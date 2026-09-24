import { useCallback, useEffect, useState } from 'react';

const SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?/~',
} as const;
type SetKey = keyof typeof SETS;

const SIMILAR = /[il1Lo0OI|]/g;
const AMBIGUOUS = /[{}[\]()/\\'"`~,;:.<>]/g;
const MIN_LENGTH = 4;
const MAX_LENGTH = 128;

/** Unbiased random integer in [0, max) from the Web Crypto CSPRNG (rejection sampling). */
function secureRandomInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}

function buildPools(enabled: Record<SetKey, boolean>, excludeSimilar: boolean, excludeAmbiguous: boolean) {
  return (Object.keys(SETS) as SetKey[])
    .filter((k) => enabled[k])
    .map((k) => {
      let chars: string = SETS[k];
      if (excludeSimilar) chars = chars.replace(SIMILAR, '');
      if (excludeAmbiguous) chars = chars.replace(AMBIGUOUS, '');
      return chars;
    })
    .filter(Boolean);
}

/** Generates a password containing at least one character from every selected set. */
function generatePassword(length: number, pools: string[]): string {
  const all = pools.join('');
  if (!all) return '';
  const chars: string[] = [];
  // One guaranteed character per set (only when the length allows it).
  if (length >= pools.length) for (const pool of pools) chars.push(pool[secureRandomInt(pool.length)]);
  while (chars.length < length) chars.push(all[secureRandomInt(all.length)]);
  // Fisher-Yates shuffle so the guaranteed characters are not always at the start.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function strengthFor(bits: number) {
  if (bits < 40) return { label: 'Very weak', bar: 'bg-red-500', text: 'text-red-700' };
  if (bits < 60) return { label: 'Weak', bar: 'bg-orange-500', text: 'text-orange-700' };
  if (bits < 80) return { label: 'Fair', bar: 'bg-yellow-500', text: 'text-yellow-700' };
  if (bits < 100) return { label: 'Strong', bar: 'bg-blue-600', text: 'text-blue-700' };
  return { label: 'Very strong', bar: 'bg-green-600', text: 'text-green-700' };
}

const OPTION_LABELS: Record<SetKey, string> = {
  upper: 'Uppercase letters (A-Z)',
  lower: 'Lowercase letters (a-z)',
  numbers: 'Numbers (0-9)',
  symbols: 'Symbols (!@#$%…)',
};

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [enabled, setEnabled] = useState<Record<SetKey, boolean>>({ upper: true, lower: true, numbers: true, symbols: true });
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [status, setStatus] = useState('');

  const pools = buildPools(enabled, excludeSimilar, excludeAmbiguous);
  const poolSize = pools.join('').length;
  const bits = poolSize ? Math.round(length * Math.log2(poolSize)) : 0;
  const strength = strengthFor(bits);

  const generate = useCallback(() => {
    const p = buildPools(enabled, excludeSimilar, excludeAmbiguous);
    if (!p.length) {
      setPasswords([]);
      return;
    }
    setPasswords(Array.from({ length: quantity }, () => generatePassword(length, p)));
    setStatus('');
  }, [enabled, excludeSimilar, excludeAmbiguous, quantity, length]);

  // Regenerate whenever the options change (and on first load).
  useEffect(() => {
    generate();
  }, [generate]);

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${what} copied to clipboard.`);
    } catch {
      setStatus('Copy failed. Select the text and copy it manually.');
    }
  };

  const setLengthSafe = (value: number) => {
    if (Number.isNaN(value)) return;
    setLength(Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, Math.round(value))));
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6">
      <div className="space-y-6">
        {/* Output */}
        <div>
          <label htmlFor="pw-output" className="mb-2 block text-sm font-medium text-gray-700">
            Generated password
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="pw-output"
              data-testid="password-output"
              type="text"
              value={passwords[0] ?? ''}
              readOnly
              spellCheck={false}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-lg focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="Select at least one character type"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => passwords[0] && copy(passwords[0], 'Password')}
                disabled={!passwords.length}
                className="flex-1 whitespace-nowrap rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:flex-none"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={generate}
                disabled={!pools.length}
                className="flex-1 whitespace-nowrap rounded-lg bg-green-600 px-5 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:flex-none"
              >
                Generate
              </button>
            </div>
          </div>
          <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-green-700">
            {status}
          </p>
        </div>

        {/* Strength */}
        {pools.length > 0 ? (
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium text-gray-700">Strength</span>
              <span className={`font-semibold ${strength.text}`} data-testid="password-strength">
                {strength.label} · ~{bits} bits of entropy
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200" aria-hidden="true">
              <div className={`h-3 rounded-full transition-all ${strength.bar}`} style={{ width: `${Math.min(100, (bits / 128) * 100)}%` }} />
            </div>
          </div>
        ) : (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            Select at least one character type to generate a password.
          </p>
        )}

        {/* Length */}
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="pw-length" className="text-sm font-medium text-gray-700">
              Password length
            </label>
            <input
              type="number"
              aria-label="Password length (number)"
              min={MIN_LENGTH}
              max={MAX_LENGTH}
              value={length}
              onChange={(e) => setLengthSafe(e.target.valueAsNumber)}
              className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-right font-mono"
            />
          </div>
          <input
            id="pw-length"
            type="range"
            min={MIN_LENGTH}
            max={MAX_LENGTH}
            value={length}
            onChange={(e) => setLengthSafe(e.target.valueAsNumber)}
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-500">
            {MIN_LENGTH}–{MAX_LENGTH} characters. 16 or more is recommended for online accounts.
          </p>
        </div>

        {/* Character options */}
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-gray-700">Characters to include</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(Object.keys(SETS) as SetKey[]).map((key) => (
              <label key={key} className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={enabled[key]}
                  onChange={(e) => setEnabled((prev) => ({ ...prev, [key]: e.target.checked }))}
                  className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{OPTION_LABELS[key]}</span>
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={excludeSimilar}
                onChange={(e) => setExcludeSimilar(e.target.checked)}
                className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">Exclude look-alikes (i, l, 1, L, I, o, 0, O, |)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={excludeAmbiguous}
                onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">Exclude hard-to-type symbols ({'{ } [ ] ( ) / \\ \' " ` ~ , ; : . < >'})</span>
            </label>
          </div>
        </fieldset>

        {/* Bulk */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="pw-quantity" className="mb-2 block text-sm font-medium text-gray-700">
              How many passwords
            </label>
            <select
              id="pw-quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              {[1, 5, 10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          {passwords.length > 1 && (
            <button
              type="button"
              onClick={() => copy(passwords.join('\n'), `${passwords.length} passwords`)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Copy all
            </button>
          )}
        </div>

        {passwords.length > 1 && (
          <ol className="max-h-72 space-y-1 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm" data-testid="password-list">
            {passwords.map((pw, i) => (
              <li key={i} className="break-all">
                {pw}
              </li>
            ))}
          </ol>
        )}

        <p className="text-xs text-gray-500">
          Passwords are generated on your device with the Web Crypto API (<code>crypto.getRandomValues</code>). They are never sent to
          a server or stored.
        </p>
      </div>
    </div>
  );
}
