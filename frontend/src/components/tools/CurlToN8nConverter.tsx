import { useMemo, useState } from 'react';
import { convertCurl, HTTP_REQUEST_TYPE_VERSION, type ConvertedRequest, type CurlBody, type SecretMode } from '../../utils/curlToN8n';

const btn = 'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const field = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500';
const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6';

const SAMPLES: { label: string; command: string }[] = [
  {
    label: 'POST JSON with a Bearer token',
    command: `curl -X POST 'https://api.example.com/v1/contacts' \\
  -H 'Authorization: Bearer sk_live_REPLACE_ME' \\
  -H 'Content-Type: application/json' \\
  -d '{"email": "ada@example.com", "tags": ["lead"], "subscribed": true}'`,
  },
  {
    label: 'GET with query and API-key header',
    command: `curl "https://api.example.com/v1/orders?status=paid&limit=50" -H "X-API-Key: abc123" -H "Accept: application/json"`,
  },
  {
    label: 'Form post with basic auth',
    command: `curl https://api.example.com/v1/charges \\
  -u sk_test_123: \\
  -d amount=2000 \\
  -d currency=usd`,
  },
  {
    label: 'File upload (multipart)',
    command: `curl -F "file=@invoice.pdf" -F "folder=Invoices" https://api.example.com/v1/upload`,
  },
];

const SECRET_MODES: { value: SecretMode; label: string }[] = [
  { value: 'credential', label: 'Move to an n8n credential (recommended)' },
  { value: 'placeholder', label: 'Replace with placeholders' },
  { value: 'keep', label: 'Keep as in the cURL command' },
];

function bodyLabel(body: CurlBody) {
  switch (body.kind) {
    case 'none':
      return 'None';
    case 'json':
      return 'JSON (Specify Body: Using JSON)';
    case 'form':
      return `Form URL Encoded, ${body.fields.length} field${body.fields.length === 1 ? '' : 's'}`;
    case 'formString':
      return 'Form URL Encoded (single field)';
    case 'multipart':
      return `Form-Data, ${body.fields.length} field${body.fields.length === 1 ? '' : 's'}`;
    case 'raw':
      return `Raw (${body.contentType})`;
    case 'binary':
      return 'n8n Binary File';
  }
}

const CRED_LABEL: Record<string, string> = { httpBasicAuth: 'Basic Auth', httpHeaderAuth: 'Header Auth', httpQueryAuth: 'Query Auth' };

function Summary({ item }: { item: ConvertedRequest }) {
  const { request: r, node } = item;
  const p = node.parameters as Record<string, unknown>;
  const headers = (p.headerParameters as { parameters: { name: string }[] } | undefined)?.parameters ?? [];
  const query = (p.queryParameters as { parameters: { name: string; value: string }[] } | undefined)?.parameters ?? [];
  const rows: [string, string, string][] = [
    ['Method', r.method, r.methodSource],
    ['URL', r.url, 'URL without the query string'],
    [
      'Authentication',
      item.credentialType ? `Generic Credential Type → ${CRED_LABEL[item.credentialType]}` : 'None',
      item.credentialType ? 'Secret moved out of the parameters' : r.basicAuth ? '-u sent as an Authorization header' : 'No credential needed',
    ],
    ['Send Query Parameters', query.length ? query.map((q) => `${q.name}=${q.value}`).join(', ') : 'Off', query.length ? 'From the URL' + (r.methodSource.startsWith('-G') ? ' and -G data' : '') : ''],
    ['Send Headers', headers.length ? headers.map((h) => h.name).join(', ') : 'Off', headers.length ? '-H, -A, -e, -b' : ''],
    ['Send Body', bodyLabel(r.body), r.body.kind === 'none' ? '' : 'From -d / --data* / --json / -F'],
  ];
  const opts = p.options as Record<string, unknown>;
  if (Object.keys(opts).length) rows.push(['Options', Object.entries(opts).map(([k, v]) => `${k}: ${String(v)}`).join(', '), '-k / -m']);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] text-left text-sm" data-testid="curl-summary">
        <caption className="sr-only">How the cURL command maps to the HTTP Request node</caption>
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th scope="col" className="py-1.5 pr-3 font-medium">
              n8n field
            </th>
            <th scope="col" className="py-1.5 pr-3 font-medium">
              Value
            </th>
            <th scope="col" className="py-1.5 font-medium">
              From cURL
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, value, from]) => (
            <tr key={name} className="border-b border-slate-100 align-top">
              <th scope="row" className="py-1.5 pr-3 font-medium text-slate-700">
                {name}
              </th>
              <td className="break-all py-1.5 pr-3 font-mono text-xs">{value}</td>
              <td className="py-1.5 text-xs text-slate-500">{from}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CurlToN8nConverter() {
  const [input, setInput] = useState('');
  const [secretMode, setSecretMode] = useState<SecretMode>('credential');
  const [notice, setNotice] = useState('');

  const result = useMemo(() => convertCurl(input, secretMode), [input, secretMode]);
  const output = result.clipboard ? JSON.stringify(result.clipboard, null, 2) : '';
  const secrets = result.items.flatMap((it, i) => it.secrets.map((s) => ({ ...s, request: i + 1 })));

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice((n) => (n === msg ? '' : n)), 2500);
  };
  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(`${what} copied. Click the n8n canvas and press Ctrl+V (Cmd+V).`);
    } catch {
      flash('Copy failed. Select the JSON and press Ctrl+C.');
    }
  };
  const download = () => {
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'n8n-http-request.json';
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      <section aria-labelledby="curl-in-h" className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="curl-in-h" className="text-lg font-semibold text-slate-900">
            Paste a cURL command
          </h2>
          <button type="button" onClick={() => setInput('')} disabled={!input} className={`${btn} bg-slate-100 px-3 py-1 text-xs text-slate-800 hover:bg-slate-200`}>
            Clear
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          From API docs or your browser&apos;s DevTools (Copy as cURL, bash). Paste several commands to convert them in one go. Everything runs in your browser; nothing is sent
          anywhere.
        </p>
        <label htmlFor="curl-input" className="mt-4 mb-1.5 block text-sm font-medium text-slate-700">
          cURL command(s)
        </label>
        <textarea
          id="curl-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={result.errors.length > 0}
          aria-describedby={result.errors.length ? 'curl-error' : undefined}
          placeholder={`curl -X POST https://api.example.com/v1/items \\\n  -H 'Content-Type: application/json' \\\n  -d '{"name": "Widget"}'`}
          className="h-44 w-full resize-y rounded-lg border border-slate-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Load a sample">
          {SAMPLES.map((s) => (
            <button key={s.label} type="button" onClick={() => setInput(s.command)} className={`${btn} bg-slate-100 px-3 py-1 text-xs text-slate-800 hover:bg-slate-200`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="mt-4 max-w-md">
          <label htmlFor="curl-secret-mode" className="mb-1.5 block text-sm font-medium text-slate-700">
            API keys and tokens
          </label>
          <select id="curl-secret-mode" value={secretMode} onChange={(e) => setSecretMode(e.target.value as SecretMode)} className={field}>
            {SECRET_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {result.errors.length > 0 && (
          <div id="curl-error" role="alert" data-testid="curl-error" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {result.errors.map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        )}
      </section>

      {secrets.length > 0 && (
        <div role="note" data-testid="curl-secret-warning" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 sm:p-5">
          <p className="font-semibold">Secrets detected: {[...new Set(secrets.map((s) => (s.location === 'query' ? `query parameter ${s.name}` : s.location === 'body' ? `body field ${s.name}` : s.location === 'basic' ? 'basic auth (-u)' : `header ${s.name}`)))].join(', ')}</p>
          <p className="mt-1">
            Values in node parameters are saved in the workflow and travel with it when you copy, export or share it. Store API keys, tokens and passwords in an n8n
            credential instead: exported workflows only include a credential&apos;s name and ID, not its value.
            {secretMode === 'keep' && ' You chose to keep secrets in the node, so do not share this JSON.'}
            {secretMode === 'credential' && ' The node below already uses a generic credential; create it after pasting.'}
          </p>
        </div>
      )}

      {result.items.length > 0 && (
        <section aria-labelledby="curl-out-h" className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="curl-out-h" className="text-lg font-semibold text-slate-900">
              n8n HTTP Request node{result.items.length > 1 ? `s (${result.items.length})` : ''}
            </h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => copy(output, result.items.length > 1 ? 'Nodes' : 'Node')} className={`${btn} bg-blue-700 text-white hover:bg-blue-800`}>
                Copy n8n node{result.items.length > 1 ? 's' : ''}
              </button>
              <button type="button" onClick={download} className={`${btn} bg-slate-100 text-slate-800 hover:bg-slate-200`}>
                Download .json
              </button>
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            HTTP Request node typeVersion {HTTP_REQUEST_TYPE_VERSION}, in the format the n8n canvas accepts on paste. Click an empty spot on the canvas and press Ctrl+V (Cmd+V).
          </p>
          <p aria-live="polite" className="mt-1 min-h-[1.25rem] text-sm text-emerald-800">
            {notice}
          </p>
          <pre data-testid="curl-n8n-output" className="mt-2 max-h-[28rem] overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-100">
            {output}
          </pre>

          {result.items.map((item, i) => (
            <div key={i} className="mt-6" data-testid="curl-request">
              <h3 className="text-base font-semibold text-slate-900">
                {result.items.length > 1 ? `${i + 1}. ` : ''}
                {item.node.name}: {item.request.method} {item.request.url}
              </h3>
              <div className="mt-2">
                <Summary item={item} />
              </div>
              {(item.nodeNotes.length > 0 || item.request.notes.length > 0) && (
                <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-700" data-testid="curl-notes">
                  {[...item.nodeNotes, ...item.request.notes].map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      <section aria-labelledby="curl-n8n-h" className={card}>
        <h2 id="curl-n8n-h" className="text-lg font-semibold text-slate-900">
          Supported cURL options
        </h2>
        <ul className="mt-2 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
          <li>
            <code>-X</code>, <code>-G</code>, <code>-I</code> → Method
          </li>
          <li>
            <code>-H</code>, <code>-A</code>, <code>-e</code>, <code>-b</code> → Headers
          </li>
          <li>
            <code>-d</code>, <code>--data-raw</code>, <code>--data-binary</code>, <code>--data-urlencode</code>, <code>--json</code> → Body
          </li>
          <li>
            <code>-F</code>, <code>--form-string</code> → Form-Data body
          </li>
          <li>
            <code>-u</code>, <code>--oauth2-bearer</code> → Basic Auth / Header Auth credential
          </li>
          <li>
            <code>-k</code>, <code>-m</code> → Ignore SSL issues, Timeout options
          </li>
          <li>
            <code>\</code> line continuations, single, double and <code>$&apos;…&apos;</code> quotes
          </li>
          <li>
            <code>--compressed</code>, <code>-s</code>, <code>-L</code> → ignored, with a note
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          n8n&apos;s HTTP Request node also has a built-in <strong>Import cURL</strong> button. This converter adds batch conversion, a field-by-field explanation and secret
          handling. Sources:{' '}
          <a className="text-blue-700 underline" href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/" target="_blank" rel="noopener noreferrer">
            n8n HTTP Request docs
          </a>
          ,{' '}
          <a
            className="text-blue-700 underline"
            href="https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/HttpRequest/V3/Description.ts"
            target="_blank"
            rel="noopener noreferrer"
          >
            node parameters (n8n source)
          </a>
          .
        </p>
      </section>
    </div>
  );
}
