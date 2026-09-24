import { useEffect, useMemo, useState } from 'react';

type Json = Record<string, unknown>;

interface Decoded {
  header: Json;
  payload: Json | null;
  payloadText?: string;
  signature: string;
  encrypted: boolean;
}

/** Decodes one Base64URL segment (RFC 7515: '-' and '_' alphabet, padding optional) to UTF-8 text. */
function base64UrlDecode(segment: string, part: string): string {
  if (!/^[A-Za-z0-9_-]*={0,2}$/.test(segment)) {
    const bad = segment.match(/[^A-Za-z0-9_=-]/)?.[0];
    throw new Error(`The ${part} is not valid Base64URL${bad ? ` (unexpected "${bad}")` : ''}.`);
  }
  const b64 = segment.replace(/=+$/, '').replace(/-/g, '+').replace(/_/g, '/');
  if (b64.length % 4 === 1) throw new Error(`The ${part} has an invalid Base64URL length. The token may be truncated.`);
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`The ${part} is not UTF-8 text.`);
  }
}

function base64UrlEncode(text: string) {
  const bytes = new TextEncoder().encode(text);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function parseJsonObject(text: string, part: string): Json {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(`The ${part} decodes to text that is not valid JSON.`);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`The ${part} must be a JSON object.`);
  return value as Json;
}

function decodeToken(raw: string): Decoded {
  const token = raw.trim().replace(/^Bearer\s+/i, '').replace(/\s+/g, '');
  const parts = token.split('.');
  if (parts.length === 5) {
    const header = parseJsonObject(base64UrlDecode(parts[0], 'header'), 'header');
    return { header, payload: null, signature: '', encrypted: true };
  }
  if (parts.length !== 3) {
    throw new Error(`A JWT has 3 parts separated by dots (header.payload.signature); this input has ${parts.length}.`);
  }
  const header = parseJsonObject(base64UrlDecode(parts[0], 'header'), 'header');
  const payloadText = base64UrlDecode(parts[1], 'payload');
  let payload: Json | null = null;
  try {
    payload = parseJsonObject(payloadText, 'payload');
  } catch {
    // Some JWS payloads are not JSON; show the raw text instead.
  }
  return { header, payload, payloadText, signature: parts[2], encrypted: false };
}

function sampleToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { sub: '1234567890', name: 'José Müller ✓', email: 'jose@example.com', roles: ['editor'], iat: now, exp: now + 3600 };
  return `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}.c2FtcGxlLXNpZ25hdHVyZS1ub3QtdmFsaWQ`;
}

const CLAIMS: Record<string, string> = {
  iss: 'Issuer',
  sub: 'Subject',
  aud: 'Audience',
  exp: 'Expires',
  nbf: 'Not before',
  iat: 'Issued at',
  jti: 'JWT ID',
};

function relative(seconds: number, now: number) {
  const diff = seconds - now;
  const abs = Math.abs(diff);
  if (abs < 10) return 'just now';
  const [value, unit] = abs < 60 ? [abs, 'second'] : abs < 3600 ? [Math.round(abs / 60), 'minute'] : abs < 86400 ? [Math.round(abs / 3600), 'hour'] : [Math.round(abs / 86400), 'day'];
  const label = `${value} ${unit}${value === 1 ? '' : 's'}`;
  return diff >= 0 ? `in ${label}` : `${label} ago`;
}

function display(value: unknown) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

const btn = 'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export default function JWTDecoder() {
  const [token, setToken] = useState('');
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const t = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const result = useMemo((): { decoded: Decoded | null; error: string } => {
    if (!token.trim()) return { decoded: null, error: '' };
    try {
      return { decoded: decodeToken(token), error: '' };
    } catch (e) {
      return { decoded: null, error: e instanceof Error ? e.message : 'Could not decode this token.' };
    }
  }, [token]);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice((n) => (n === msg ? '' : n)), 2500);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash('Copied to clipboard.');
    } catch {
      flash('Copy failed. Select the text and press Ctrl+C.');
    }
  };

  const { decoded, error } = result;
  const payload = decoded?.payload;
  const exp = typeof payload?.exp === 'number' ? payload.exp : undefined;
  const nbf = typeof payload?.nbf === 'number' ? payload.nbf : undefined;
  const status = exp !== undefined && exp < now ? 'expired' : nbf !== undefined && nbf > now ? 'not-yet-valid' : exp !== undefined ? 'active' : null;
  const alg = decoded ? String(decoded.header.alg ?? '') : '';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div role="note" data-testid="jwt-warning" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <strong>Decode only – the signature is not verified.</strong> Anyone can create a token with any claims, so never trust
        decoded values until your server has verified the signature with the correct key. Tokens are decoded in your browser and are not sent anywhere.
      </div>

      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="jwt-input" className="block text-sm font-medium text-slate-700">
          Encoded token (JWT)
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setToken(sampleToken())} className={`${btn} bg-slate-100 px-3 py-1 text-xs text-slate-800 hover:bg-slate-200`}>
            Load sample
          </button>
          <button type="button" onClick={() => setToken('')} disabled={!token} className={`${btn} bg-slate-100 px-3 py-1 text-xs text-slate-800 hover:bg-slate-200`}>
            Clear
          </button>
        </div>
      </div>
      <textarea
        id="jwt-input"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'jwt-error' : undefined}
        placeholder="Paste a token such as eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9… (a leading “Bearer ” is removed automatically)"
        className="h-32 w-full resize-y break-all rounded-lg border border-slate-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {error && (
        <div id="jwt-error" role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </div>
      )}

      {decoded && (
        <div className="mt-5 space-y-4">
          {(alg.toLowerCase() === 'none' || (!decoded.encrypted && !decoded.signature)) && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
              This token is unsigned (alg “none” or empty signature). Servers must reject unsigned tokens.
            </p>
          )}
          {decoded.encrypted && (
            <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
              This is an encrypted token (JWE, 5 parts). Only the header can be read; the payload needs the recipient’s private key.
            </p>
          )}

          {status && (
            <p
              data-testid="jwt-status"
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                status === 'expired' ? 'bg-red-100 text-red-800' : status === 'not-yet-valid' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {status === 'expired' ? `Expired ${relative(exp!, now)}` : status === 'not-yet-valid' ? `Not valid until ${new Date(nbf! * 1000).toLocaleString()}` : `Not expired – expires ${relative(exp!, now)}`}
              <span className="font-normal"> (based on your device clock)</span>
            </p>
          )}

          <section aria-labelledby="jwt-header-h" className="rounded-lg border border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 id="jwt-header-h" className="text-base font-semibold text-rose-700">
                Header <span className="text-sm font-normal text-slate-500">{alg ? `· ${alg}` : ''}</span>
              </h2>
              <button type="button" onClick={() => copy(JSON.stringify(decoded.header, null, 2))} className="rounded px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                Copy
              </button>
            </div>
            <pre data-testid="jwt-header" className="overflow-x-auto rounded-md bg-slate-50 p-3 font-mono text-sm">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </section>

          {!decoded.encrypted && (
            <section aria-labelledby="jwt-payload-h" className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h2 id="jwt-payload-h" className="text-base font-semibold text-violet-700">
                  Payload
                </h2>
                <button
                  type="button"
                  onClick={() => copy(payload ? JSON.stringify(payload, null, 2) : decoded.payloadText ?? '')}
                  className="rounded px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Copy
                </button>
              </div>
              <pre data-testid="jwt-payload" className="overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-slate-50 p-3 font-mono text-sm">
                {payload ? JSON.stringify(payload, null, 2) : decoded.payloadText}
              </pre>

              {payload && Object.keys(CLAIMS).some((k) => k in payload) && (
                <dl className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-100 text-sm" data-testid="jwt-claims">
                  {Object.entries(CLAIMS)
                    .filter(([k]) => k in payload)
                    .map(([k, label]) => {
                      const v = payload[k];
                      const isTime = ['exp', 'nbf', 'iat'].includes(k) && typeof v === 'number';
                      return (
                        <div key={k} className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
                          <dt className="text-slate-500">
                            {label} <code className="text-xs">({k})</code>
                          </dt>
                          <dd className="min-w-0 break-all font-mono">
                            {isTime ? `${new Date((v as number) * 1000).toISOString()} · ${relative(v as number, now)}` : Array.isArray(v) ? v.map(display).join(', ') : display(v)}
                          </dd>
                        </div>
                      );
                    })}
                </dl>
              )}
            </section>
          )}

          {!decoded.encrypted && (
            <section aria-labelledby="jwt-sig-h" className="rounded-lg border border-slate-200 p-3">
              <h2 id="jwt-sig-h" className="mb-2 text-base font-semibold text-sky-700">
                Signature <span className="text-sm font-normal text-slate-500">(not verified)</span>
              </h2>
              <code className="block break-all rounded-md bg-slate-50 p-3 font-mono text-sm">{decoded.signature || '(empty)'}</code>
            </section>
          )}
        </div>
      )}

      <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-slate-600">
        {notice}
      </p>
    </div>
  );
}
