import { useMemo, useState } from 'react';

type Version = 'v4' | 'v7' | 'v1';

const MAX_COUNT = 1000;

function hex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function format(bytes: Uint8Array) {
  const h = hex(bytes);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function randomBytes(n: number) {
  return crypto.getRandomValues(new Uint8Array(n));
}

/** RFC 9562 / RFC 4122 version 4: 122 random bits from the Web Crypto CSPRNG. */
function uuidV4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return format(b);
}

let lastV7Ms = -1;
let lastV7Seq = 0;
/** RFC 9562 version 7: 48-bit Unix millisecond timestamp + random bits, sortable by creation time. */
function uuidV7(): string {
  const b = randomBytes(16);
  let ms = Date.now();
  if (ms <= lastV7Ms) {
    // Same millisecond: increment the 12-bit rand_a counter so IDs stay strictly ordered.
    lastV7Seq++;
    if (lastV7Seq > 0xfff) {
      lastV7Ms++;
      lastV7Seq = 0;
    }
    ms = lastV7Ms;
  } else {
    lastV7Ms = ms;
    lastV7Seq = ((b[6] & 0x07) << 8) | b[7]; // random start, leaves headroom for increments
  }
  for (let i = 5; i >= 0; i--) {
    b[i] = ms % 256;
    ms = Math.floor(ms / 256);
  }
  b[6] = 0x70 | ((lastV7Seq >> 8) & 0x0f);
  b[7] = lastV7Seq & 0xff;
  b[8] = (b[8] & 0x3f) | 0x80;
  return format(b);
}

const GREGORIAN_OFFSET = 0x01b21dd213814000n; // 100 ns intervals between 1582-10-15 and 1970-01-01
let lastV1 = 0n;
let v1ClockSeq = -1;
let v1Node: Uint8Array | null = null;
/** RFC 9562 version 1 with a random multicast node ID (browsers cannot read the MAC address). */
function uuidV1(): string {
  if (!v1Node) {
    v1Node = randomBytes(6);
    v1Node[0] |= 0x01; // multicast bit marks the node as random, per RFC 9562 §6.10
    const cs = randomBytes(2);
    v1ClockSeq = ((cs[0] << 8) | cs[1]) & 0x3fff;
  }
  let ts = BigInt(Date.now()) * 10000n + GREGORIAN_OFFSET;
  if (ts <= lastV1) ts = lastV1 + 1n;
  lastV1 = ts;
  const timeLow = Number(ts & 0xffffffffn);
  const timeMid = Number((ts >> 32n) & 0xffffn);
  const timeHi = Number((ts >> 48n) & 0x0fffn) | 0x1000;
  const b = new Uint8Array(16);
  const view = new DataView(b.buffer);
  view.setUint32(0, timeLow);
  view.setUint16(4, timeMid);
  view.setUint16(6, timeHi);
  view.setUint16(8, v1ClockSeq | 0x8000);
  b.set(v1Node, 10);
  return format(b);
}

const generators: Record<Version, () => string> = { v4: uuidV4, v7: uuidV7, v1: uuidV1 };

function inspect(value: string) {
  const v = value.trim().replace(/^urn:uuid:/i, '').replace(/^\{(.*)\}$/, '$1');
  if (/^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(v)) return { valid: true, text: 'Valid – the Nil UUID (all zeros)' };
  if (/^f{8}-f{4}-f{4}-f{4}-f{12}$/i.test(v)) return { valid: true, text: 'Valid – the Max UUID (all ones)' };
  const m = v.match(/^[0-9a-f]{8}-[0-9a-f]{4}-([0-9a-f])[0-9a-f]{3}-([0-9a-f])[0-9a-f]{3}-[0-9a-f]{12}$/i);
  if (!m) {
    const compact = v.replace(/-/g, '');
    if (/^[0-9a-f]{32}$/i.test(compact)) return { valid: false, text: 'Contains 32 hex digits but the hyphens are in the wrong place (expected 8-4-4-4-12).' };
    return { valid: false, text: 'Not a UUID. Expected 32 hexadecimal digits in the form 8-4-4-4-12.' };
  }
  const version = parseInt(m[1], 16);
  const variant = parseInt(m[2], 16);
  if ((variant & 0b1100) !== 0b1000) return { valid: false, text: `Well-formed, but the variant digit "${m[2]}" is not the RFC 4122 / 9562 variant (expected 8, 9, a or b).` };
  if (version < 1 || version > 8) return { valid: false, text: `Well-formed, but version ${version} is not defined by RFC 9562.` };
  const names: Record<number, string> = { 1: 'time-based', 2: 'DCE security', 3: 'name-based MD5', 4: 'random', 5: 'name-based SHA-1', 6: 'reordered time', 7: 'Unix time-ordered', 8: 'custom' };
  let extra = '';
  if (version === 7) {
    const ms = parseInt(v.replace(/-/g, '').slice(0, 12), 16);
    extra = ` · created ${new Date(ms).toISOString()}`;
  }
  return { valid: true, text: `Valid UUID version ${version} (${names[version]})${extra}` };
}

function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const btn = 'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const field = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function UUIDGenerator() {
  const [version, setVersion] = useState<Version>('v4');
  const [countText, setCountText] = useState('5');
  const [upper, setUpper] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [braces, setBraces] = useState(false);
  const [raw, setRaw] = useState<string[]>(() => Array.from({ length: 5 }, uuidV4));
  const [check, setCheck] = useState('');
  const [notice, setNotice] = useState('');

  const count = Math.min(MAX_COUNT, Math.max(1, Math.floor(Number(countText)) || 1));
  const countInvalid = countText !== '' && (!/^\d+$/.test(countText) || Number(countText) < 1 || Number(countText) > MAX_COUNT);

  const uuids = useMemo(
    () =>
      raw.map((u) => {
        let s = hyphens ? u : u.replace(/-/g, '');
        if (upper) s = s.toUpperCase();
        return braces ? `{${s}}` : s;
      }),
    [raw, upper, hyphens, braces],
  );

  const generate = () => setRaw(Array.from({ length: count }, generators[version]));

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice((n) => (n === msg ? '' : n)), 2500);
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(`Copied ${what}.`);
    } catch {
      flash('Copy failed. Select the text and press Ctrl+C.');
    }
  };

  const checked = check.trim() ? inspect(check) : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="uuid-version" className="mb-1.5 block text-sm font-medium text-slate-700">
            Version
          </label>
          <select id="uuid-version" value={version} onChange={(e) => setVersion(e.target.value as Version)} className={field}>
            <option value="v4">v4 – random (most common)</option>
            <option value="v7">v7 – time-ordered (database keys)</option>
            <option value="v1">v1 – time-based, random node</option>
          </select>
        </div>
        <div>
          <label htmlFor="uuid-count" className="mb-1.5 block text-sm font-medium text-slate-700">
            How many (1–{MAX_COUNT})
          </label>
          <input
            id="uuid-count"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_COUNT}
            value={countText}
            onChange={(e) => setCountText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') generate();
            }}
            aria-invalid={countInvalid}
            aria-describedby={countInvalid ? 'uuid-count-hint' : undefined}
            className={field}
          />
          {countInvalid && (
            <p id="uuid-count-hint" className="mt-1 text-xs text-amber-700">
              Enter a whole number from 1 to {MAX_COUNT}. {count} will be generated.
            </p>
          )}
        </div>
        <div className="flex items-end">
          <button type="button" onClick={generate} className={`${btn} w-full bg-blue-600 py-2.5 text-white hover:bg-blue-700`}>
            Generate
          </button>
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="mb-1.5 text-sm font-medium text-slate-700">Format</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Uppercase
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hyphens} onChange={(e) => setHyphens(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Hyphens
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={braces} onChange={(e) => setBraces(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            {'{Braces}'} (GUID style)
          </label>
        </div>
      </fieldset>

      <div className="mt-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">
            Generated UUIDs <span className="font-normal text-slate-500">({uuids.length})</span>
          </h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => copy(uuids.join('\n'), `${uuids.length} UUID${uuids.length === 1 ? '' : 's'}`)} className={`${btn} bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700`}>
              Copy all
            </button>
            <button type="button" onClick={() => downloadText(uuids.join('\n') + '\n', `uuids-${version}.txt`)} className={`${btn} bg-slate-100 px-3 py-1.5 text-slate-800 hover:bg-slate-200`}>
              Download .txt
            </button>
          </div>
        </div>
        <ol className="max-h-96 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 p-2" data-testid="uuid-list">
          {uuids.map((u, i) => (
            <li key={`${i}-${u}`} className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1.5">
              <span className="w-8 flex-none text-right text-xs text-slate-400">{i + 1}.</span>
              <code className="min-w-0 flex-1 break-all font-mono text-sm text-slate-900" data-testid="uuid-value">
                {u}
              </code>
              <button type="button" onClick={() => copy(u, 'UUID')} aria-label={`Copy UUID ${i + 1}`} className="flex-none rounded px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                Copy
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 rounded-lg bg-slate-50 p-4">
        <label htmlFor="uuid-check" className="mb-1.5 block text-sm font-semibold text-slate-900">
          Validate a UUID
        </label>
        <input
          id="uuid-check"
          type="text"
          value={check}
          onChange={(e) => setCheck(e.target.value)}
          spellCheck={false}
          placeholder="Paste a UUID to check its format, version and variant"
          className={`${field} font-mono`}
        />
        {checked && (
          <p data-testid="uuid-check-result" className={`mt-2 rounded-md px-3 py-2 text-sm ${checked.valid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
            {checked.text}
          </p>
        )}
      </div>

      <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-slate-600">
        {notice}
      </p>
    </div>
  );
}
