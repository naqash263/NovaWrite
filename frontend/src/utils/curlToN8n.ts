// cURL command -> n8n HTTP Request node (typeVersion 4.2) converter. Runs entirely in the browser.
//
// Parameter names and values follow n8n's HTTP Request V3 node description
// (packages/nodes-base/nodes/HttpRequest/V3/Description.ts, versions 3 and 4.x) and the output is
// wrapped in the clipboard shape the n8n canvas accepts on paste: {"nodes":[...],"connections":{}}.

export type SecretMode = 'credential' | 'placeholder' | 'keep';

export interface NameValue {
  name: string;
  value: string;
}

export interface MultipartField {
  name: string;
  value?: string;
  /** File path from -F name=@path (sent as n8n binary data). */
  file?: string;
}

export type CurlBody =
  | { kind: 'none' }
  | { kind: 'json'; text: string; value: unknown }
  | { kind: 'form'; fields: NameValue[] }
  | { kind: 'formString'; text: string }
  | { kind: 'multipart'; fields: MultipartField[] }
  | { kind: 'raw'; contentType: string; text: string }
  | { kind: 'binary'; file: string };

export interface CurlRequest {
  method: string;
  /** Explicit -X / --request, or how the method was implied. */
  methodSource: string;
  url: string;
  query: NameValue[];
  headers: NameValue[];
  body: CurlBody;
  basicAuth?: { user: string; password: string };
  insecure: boolean;
  timeoutMs?: number;
  /** Flags that were ignored or changed the mapping, shown to the user. */
  notes: string[];
}

export interface SecretFinding {
  location: 'header' | 'query' | 'basic' | 'body';
  name: string;
}

export interface ConvertedRequest {
  request: CurlRequest;
  secrets: SecretFinding[];
  node: N8nNode;
  /** n8n generic credential type used when secrets are moved into a credential. */
  credentialType?: 'httpBasicAuth' | 'httpHeaderAuth' | 'httpQueryAuth';
  /** Extra notes produced while building the node (e.g. which credential to create). */
  nodeNotes: string[];
}

export interface N8nNode {
  parameters: Record<string, unknown>;
  type: 'n8n-nodes-base.httpRequest';
  typeVersion: number;
  position: [number, number];
  name: string;
}

export interface ConvertResult {
  items: ConvertedRequest[];
  errors: string[];
  clipboard: { nodes: N8nNode[]; connections: Record<string, never> } | null;
}

export const HTTP_REQUEST_TYPE_VERSION = 4.2;
const N8N_METHODS = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'];

// ---------------------------------------------------------------------------------------------
// Shell-style tokenizer (bash quoting rules that matter for copied cURL commands)

function ansiC(body: string): string {
  return body.replace(/\\(x[0-9a-fA-F]{1,2}|u[0-9a-fA-F]{4}|[nrt\\'"abefv0]|.)/g, (_, e: string) => {
    if (e[0] === 'x' && e.length > 1) return String.fromCharCode(parseInt(e.slice(1), 16));
    if (e[0] === 'u' && e.length > 1) return String.fromCharCode(parseInt(e.slice(1), 16));
    const map: Record<string, string> = { n: '\n', r: '\r', t: '\t', '\\': '\\', "'": "'", '"': '"', a: '\x07', b: '\b', e: '\x1b', f: '\f', v: '\v', '0': '\0' };
    return map[e] ?? `\\${e}`;
  });
}

/** Splits input into commands (arrays of words). Throws on unclosed quotes. */
export function tokenize(input: string): string[][] {
  const commands: { words: string[]; afterNewline: boolean }[] = [];
  let words: string[] = [];
  let tok = '';
  let inTok = false;
  let afterNewline = false;
  let i = 0;
  const n = input.length;
  const pushTok = () => {
    if (inTok) words.push(tok);
    tok = '';
    inTok = false;
  };
  const endCommand = (byNewline: boolean) => {
    pushTok();
    if (words.length) commands.push({ words, afterNewline });
    words = [];
    afterNewline = byNewline;
  };
  while (i < n) {
    const c = input[i];
    if (c === '\\') {
      const nx = input[i + 1];
      if (nx === '\n') {
        i += 2;
        continue;
      }
      if (nx === '\r' && input[i + 2] === '\n') {
        i += 3;
        continue;
      }
      if (nx !== undefined) tok += nx;
      inTok = true;
      i += 2;
      continue;
    }
    if (c === "'" || (c === '$' && input[i + 1] === "'")) {
      const start = c === '$' ? i + 2 : i + 1;
      let j = start;
      if (c === '$') {
        while (j < n && input[j] !== "'") j += input[j] === '\\' ? 2 : 1;
      } else {
        j = input.indexOf("'", start);
        if (j === -1) j = n;
      }
      if (j >= n) throw new Error('A single quote (\') is never closed.');
      const body = input.slice(start, j);
      tok += c === '$' ? ansiC(body) : body;
      inTok = true;
      i = j + 1;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      let out = '';
      while (j < n && input[j] !== '"') {
        if (input[j] === '\\' && j + 1 < n) {
          const e = input[j + 1];
          if (e === '\n') {
            j += 2;
            continue;
          }
          out += '"\\$`'.includes(e) ? e : `\\${e}`;
          j += 2;
          continue;
        }
        out += input[j];
        j++;
      }
      if (j >= n) throw new Error('A double quote (") is never closed.');
      tok += out;
      inTok = true;
      i = j + 1;
      continue;
    }
    if (c === '\n' || c === '\r') {
      endCommand(true);
      i++;
      continue;
    }
    if (c === ';' || c === '|' || (c === '&' && input[i + 1] === '&')) {
      endCommand(false);
      i += c === '&' ? 2 : 1;
      continue;
    }
    if (c === ' ' || c === '\t') {
      pushTok();
      i++;
      continue;
    }
    if (c === '#' && !inTok) {
      while (i < n && input[i] !== '\n') i++;
      continue;
    }
    tok += c;
    inTok = true;
    i++;
  }
  endCommand(false);

  // Merge lines that don't start with "curl" into the previous command (commands pasted
  // without trailing backslashes); drop piped commands such as "| jq".
  const result: string[][] = [];
  for (const cmd of commands) {
    const w = cmd.words[0] === '$' ? cmd.words.slice(1) : cmd.words;
    if (!w.length) continue;
    if (/^curl(\.exe)?$/i.test(w[0])) result.push([...w]);
    else if (cmd.afterNewline && result.length && w[0].startsWith('-')) result[result.length - 1].push(...w);
  }
  return result;
}

// ---------------------------------------------------------------------------------------------
// cURL option parsing

const LONG_WITH_VALUE = new Set([
  'request', 'header', 'data', 'data-raw', 'data-binary', 'data-ascii', 'data-urlencode', 'json', 'form', 'form-string', 'user', 'url',
  'user-agent', 'referer', 'cookie', 'max-time', 'connect-timeout', 'output', 'proxy', 'cert', 'key', 'cacert', 'capath', 'retry',
  'write-out', 'upload-file', 'oauth2-bearer', 'cookie-jar', 'resolve', 'interface', 'limit-rate', 'max-redirs', 'proxy-user',
  'config', 'dump-header', 'range', 'retry-delay', 'retry-max-time', 'trace', 'trace-ascii', 'unix-socket', 'aws-sigv4', 'cert-type', 'key-type', 'pass',
]);
const SHORT_WITH_VALUE = new Set(['X', 'H', 'd', 'F', 'u', 'A', 'e', 'b', 'm', 'o', 'x', 'E', 'w', 'T', 'c', 'D', 'K', 'r', 'U', 'Y', 'y', 'z', 'C', 'P', 'Q', 't']);
const SHORT_TO_LONG: Record<string, string> = {
  X: 'request', H: 'header', d: 'data', F: 'form', u: 'user', A: 'user-agent', e: 'referer', b: 'cookie', m: 'max-time', o: 'output',
  x: 'proxy', E: 'cert', w: 'write-out', T: 'upload-file', c: 'cookie-jar', D: 'dump-header', K: 'config', r: 'range', U: 'proxy-user',
  G: 'get', I: 'head', k: 'insecure', s: 'silent', S: 'show-error', L: 'location', v: 'verbose', i: 'include', f: 'fail', g: 'globoff',
  N: 'no-buffer', O: 'remote-name', '#': 'progress-bar', q: 'disable', '4': 'ipv4', '6': 'ipv6', Z: 'parallel', j: 'junk-session-cookies',
  J: 'remote-header-name', n: 'netrc', l: 'list-only', a: 'append', B: 'use-ascii', M: 'manual', R: 'remote-time', V: 'version', '0': 'http1.0',
  '1': 'tlsv1', '2': 'sslv2', '3': 'sslv3', h: 'help', p: 'proxytunnel',
};

const IGNORED_NOTES: Record<string, string> = {
  compressed: '--compressed ignored: it only controls how the curl program negotiates compression; the HTTP Request node has no matching parameter.',
  silent: '-s / --silent ignored: it only hides curl\'s progress output.',
  'show-error': '-S / --show-error ignored: it only affects curl\'s terminal output.',
  location:
    '-L / --location ignored: the HTTP Request node (typeVersion 4.x) follows redirects by default (Options → Redirects, up to 21).',
  verbose: '-v / --verbose ignored: it only affects curl\'s terminal output.',
  include: '-i / --include ignored: to get headers and status code in n8n, add Options → Response → Include Response Headers and Status.',
  fail: '-f / --fail ignored: in n8n, HTTP errors fail the node unless you enable Options → Response → Never Error.',
  globoff: '-g / --globoff ignored: n8n does not expand URL globs.',
  output: '-o / --output ignored: to save the response as a file, set Options → Response → Response Format to File.',
};

function note(notes: string[], text: string) {
  if (!notes.includes(text)) notes.push(text);
}

function decodeFormComponent(s: string) {
  return decodeURIComponent(s.replace(/\+/g, ' '));
}

/** Parses "a=1&b=2" into fields; returns null when it isn't clean key=value pairs. */
function parseFormPairs(text: string): NameValue[] | null {
  if (!text) return [];
  const out: NameValue[] = [];
  for (const piece of text.split('&')) {
    if (piece === '') continue;
    const eq = piece.indexOf('=');
    if (eq <= 0) return null;
    try {
      out.push({ name: decodeFormComponent(piece.slice(0, eq)), value: decodeFormComponent(piece.slice(eq + 1)) });
    } catch {
      return null;
    }
  }
  return out;
}

/** curl --data-urlencode rules: "content", "=content", "name=content" (name@file is not supported here). */
function urlencodeData(arg: string, notes: string[]): string {
  const eq = arg.indexOf('=');
  const at = arg.indexOf('@');
  if (at > -1 && (eq === -1 || at < eq)) {
    note(notes, `--data-urlencode "${arg}" reads a file, which the browser can't do; replace FILE_CONTENTS in the body.`);
    return `${arg.slice(0, at) ? `${arg.slice(0, at)}=` : ''}FILE_CONTENTS`;
  }
  if (eq === -1) return encodeURIComponent(arg);
  if (eq === 0) return encodeURIComponent(arg.slice(1));
  return `${arg.slice(0, eq)}=${encodeURIComponent(arg.slice(eq + 1))}`;
}

function splitUrl(raw: string, notes: string[]) {
  let url = raw.split('#')[0];
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
    note(notes, `The URL has no scheme, so http:// was added (curl does the same). Use https:// if the API supports it.`);
    url = `http://${url}`;
  }
  const q = url.indexOf('?');
  if (q === -1) return { url, query: [] as NameValue[] };
  const query: NameValue[] = [];
  for (const piece of url.slice(q + 1).split('&')) {
    if (!piece) continue;
    const eq = piece.indexOf('=');
    const name = eq === -1 ? piece : piece.slice(0, eq);
    const value = eq === -1 ? '' : piece.slice(eq + 1);
    let decoded: NameValue;
    try {
      decoded = { name: decodeFormComponent(name), value: decodeFormComponent(value) };
    } catch {
      decoded = { name, value };
    }
    query.push(decoded);
  }
  return { url: url.slice(0, q), query };
}

const headerIndex = (headers: NameValue[], name: string) => headers.findIndex((h) => h.name.toLowerCase() === name.toLowerCase());

/** Parses one tokenized curl command. Throws Error with a user-facing message. */
export function parseCurlArgs(words: string[]): CurlRequest {
  if (!words.length || !/^curl(\.exe)?$/i.test(words[0])) throw new Error('The command must start with "curl".');
  const notes: string[] = [];
  const headers: NameValue[] = [];
  const data: { type: 'data' | 'raw' | 'binary' | 'urlencode' | 'json'; value: string }[] = [];
  const form: MultipartField[] = [];
  const urls: string[] = [];
  let method: string | undefined;
  let get = false;
  let head = false;
  let insecure = false;
  let timeoutMs: number | undefined;
  let user: string | undefined;

  const handle = (opt: string, value?: string) => {
    switch (opt) {
      case 'request':
        method = value!.toUpperCase();
        break;
      case 'header': {
        const v = value!;
        const colon = v.indexOf(':');
        if (colon === -1) {
          if (v.endsWith(';')) headers.push({ name: v.slice(0, -1).trim(), value: '' });
          else if (v.trim().startsWith('@')) note(notes, `-H ${v} reads headers from a file, which the browser can't do; add them manually.`);
          else note(notes, `Header "${v}" has no colon and was ignored.`);
          break;
        }
        const name = v.slice(0, colon).trim();
        const hv = v.slice(colon + 1).trim();
        if (!hv) note(notes, `-H "${name}:" removes a default curl header; it was ignored.`);
        else headers.push({ name, value: hv });
        break;
      }
      case 'data':
      case 'data-ascii':
        data.push({ type: 'data', value: value! });
        break;
      case 'data-raw':
        data.push({ type: 'raw', value: value! });
        break;
      case 'data-binary':
        data.push({ type: 'binary', value: value! });
        break;
      case 'data-urlencode':
        data.push({ type: 'urlencode', value: urlencodeData(value!, notes) });
        break;
      case 'json':
        data.push({ type: 'json', value: value! });
        break;
      case 'form':
      case 'form-string': {
        const v = value!;
        const eq = v.indexOf('=');
        if (eq <= 0) {
          note(notes, `-F "${v}" is not in name=value form and was ignored.`);
          break;
        }
        const name = v.slice(0, eq);
        let fv = v.slice(eq + 1);
        if (opt === 'form' && fv.startsWith('@')) {
          form.push({ name, file: fv.slice(1).split(';')[0] });
          break;
        }
        if (opt === 'form' && fv.startsWith('<')) {
          note(notes, `-F ${name}=<file reads a file into a text field; replace FILE_CONTENTS with the value.`);
          fv = 'FILE_CONTENTS';
        }
        form.push({ name, value: opt === 'form' ? fv.split(';type=')[0] : fv });
        break;
      }
      case 'user':
        user = value!;
        break;
      case 'url':
        urls.push(value!);
        break;
      case 'user-agent':
        headers.push({ name: 'User-Agent', value: value! });
        break;
      case 'referer':
        headers.push({ name: 'Referer', value: value!.replace(/;auto$/, '') });
        break;
      case 'cookie':
        if (value!.includes('=')) headers.push({ name: 'Cookie', value: value! });
        else note(notes, `-b ${value} reads cookies from a file, which the browser can't do; add a Cookie header manually.`);
        break;
      case 'oauth2-bearer':
        headers.push({ name: 'Authorization', value: `Bearer ${value}` });
        break;
      case 'max-time': {
        const secs = Number(value);
        if (Number.isFinite(secs) && secs > 0) timeoutMs = Math.round(secs * 1000);
        break;
      }
      case 'get':
        get = true;
        break;
      case 'head':
        head = true;
        break;
      case 'insecure':
        insecure = true;
        break;
      case 'upload-file':
        note(notes, `-T / --upload-file sends a local file, which the browser can't read. Use Body Content Type "n8n Binary File" with the file from a previous node.`);
        break;
      default:
        if (IGNORED_NOTES[opt]) note(notes, IGNORED_NOTES[opt]);
        else note(notes, `${opt.startsWith('-') ? opt : `--${opt}`} has no HTTP Request node equivalent and was ignored.`);
    }
  };

  for (let i = 1; i < words.length; i++) {
    const w = words[i];
    if (w.startsWith('--') && w.length > 2) {
      const opt = w.slice(2);
      if (LONG_WITH_VALUE.has(opt)) {
        if (i + 1 >= words.length) throw new Error(`${w} needs a value.`);
        handle(opt, words[++i]);
      } else handle(opt);
    } else if (w.startsWith('-') && w.length > 1) {
      for (let k = 1; k < w.length; k++) {
        const ch = w[k];
        const long = SHORT_TO_LONG[ch] ?? `-${ch}`;
        if (SHORT_WITH_VALUE.has(ch)) {
          let value = w.slice(k + 1);
          if (!value) {
            if (i + 1 >= words.length) throw new Error(`-${ch} needs a value.`);
            value = words[++i];
          }
          handle(long, value);
          break;
        }
        handle(long);
      }
    } else {
      urls.push(w);
    }
  }

  if (!urls.length) throw new Error('No URL found in the command.');
  if (urls.length > 1) note(notes, `The command has ${urls.length} URLs; only the first (${urls[0]}) was converted.`);
  const { url, query } = splitUrl(urls[0], notes);

  // --json also sets the Content-Type and Accept headers (curl 7.82+).
  const jsonFlag = data.some((d) => d.type === 'json');
  if (jsonFlag && headerIndex(headers, 'accept') === -1) headers.push({ name: 'Accept', value: 'application/json' });

  let basicAuth: CurlRequest['basicAuth'];
  if (user !== undefined) {
    const colon = user.indexOf(':');
    if (colon === -1) note(notes, `-u "${user}" has no password; curl would prompt for it. Add the password in the n8n credential.`);
    basicAuth = { user: colon === -1 ? user : user.slice(0, colon), password: colon === -1 ? '' : user.slice(colon + 1) };
  }

  // Body
  let body: CurlBody = { kind: 'none' };
  const fileData = data.find((d) => d.type !== 'raw' && d.type !== 'urlencode' && d.value.startsWith('@'));
  const joined = data.map((d) => d.value).join(jsonFlag && data.every((d) => d.type === 'json') ? '' : '&');
  const ctIndex = headerIndex(headers, 'content-type');
  const ctHeader = ctIndex > -1 ? headers[ctIndex].value : jsonFlag ? 'application/json' : '';
  const ct = ctHeader.split(';')[0].trim().toLowerCase();

  if (form.length) {
    if (data.length) note(notes, 'The command mixes -d and -F; curl refuses that combination, so only the -F form fields were converted.');
    body = { kind: 'multipart', fields: form };
  } else if (data.length && get) {
    const pairs = parseFormPairs(joined);
    if (pairs) query.push(...pairs);
    else query.push({ name: joined, value: '' });
  } else if (fileData) {
    note(notes, `${fileData.value} tells curl to send a file, which the browser can't read. The node is set to send binary data from the "data" field of the previous node.`);
    body = { kind: 'binary', file: fileData.value.slice(1) };
  } else if (data.length) {
    let parsed: unknown;
    let isJson = false;
    try {
      parsed = JSON.parse(joined);
      isJson = parsed !== null && typeof parsed === 'object';
    } catch {
      isJson = false;
    }
    if (ct === 'application/json' || /\+json$/.test(ct) || (!ct && isJson)) {
      if (isJson) {
        body = { kind: 'json', text: joined, value: parsed };
        if (!ct) note(notes, 'The body is JSON but no Content-Type was set: curl would label it application/x-www-form-urlencoded. The node sends it as JSON, which is what most APIs expect.');
      } else {
        body = { kind: 'raw', contentType: ctHeader, text: joined };
        note(notes, 'The Content-Type is JSON but the body is not valid JSON, so it is sent as a raw body.');
      }
    } else if (!ct || ct === 'application/x-www-form-urlencoded') {
      const pairs = parseFormPairs(joined);
      body = pairs ? { kind: 'form', fields: pairs } : { kind: 'formString', text: joined };
    } else {
      body = { kind: 'raw', contentType: ctHeader, text: joined };
    }
  }

  // The node sets Content-Type from the body type, so drop a duplicate header.
  if (body.kind !== 'none' && ctIndex > -1) headers.splice(ctIndex, 1);

  let methodSource = method ? `-X ${method}` : '';
  if (!method) {
    if (head) [method, methodSource] = ['HEAD', '-I / --head'];
    else if (get) [method, methodSource] = ['GET', '-G / --get'];
    else if (form.length) [method, methodSource] = ['POST', 'implied by -F'];
    else if (data.length) [method, methodSource] = ['POST', 'implied by the request body'];
    else [method, methodSource] = ['GET', 'curl default'];
  }
  if (!N8N_METHODS.includes(method)) note(notes, `${method} is not one of the node's standard methods (DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT).`);

  return { method, methodSource, url, query, headers, body, basicAuth, insecure, timeoutMs, notes };
}

// ---------------------------------------------------------------------------------------------
// Secrets

const SECRET_HEADER = /^(authorization|proxy-authorization|cookie|x-api-key|api-key|apikey|x-auth-token|x-access-token|x-token|x-secret)$|api[-_]?key|token|secret|password|signature/i;
const SECRET_QUERY = /^(api[-_]?key|apikey|key|token|access[-_]?token|auth|auth[-_]?token|secret|client[-_]?secret|password|sig|signature|code)$/i;
const SECRET_BODY = /password|secret|api[-_]?key|token/i;

function bodyKeys(body: CurlBody): string[] {
  if (body.kind === 'form') return body.fields.map((f) => f.name);
  if (body.kind === 'multipart') return body.fields.filter((f) => f.value !== undefined).map((f) => f.name);
  if (body.kind === 'json' && body.value && typeof body.value === 'object' && !Array.isArray(body.value)) return Object.keys(body.value as object);
  return [];
}

export function findSecrets(req: CurlRequest): SecretFinding[] {
  const out: SecretFinding[] = [];
  if (req.basicAuth) out.push({ location: 'basic', name: '-u (basic auth)' });
  for (const h of req.headers) if (SECRET_HEADER.test(h.name)) out.push({ location: 'header', name: h.name });
  for (const q of req.query) if (SECRET_QUERY.test(q.name)) out.push({ location: 'query', name: q.name });
  for (const k of bodyKeys(req.body)) if (SECRET_BODY.test(k)) out.push({ location: 'body', name: k });
  return out;
}

const placeholderFor = (name: string) => `YOUR_${name.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').toUpperCase() || 'SECRET'}`;

function headerPlaceholder(h: NameValue) {
  const lower = h.name.toLowerCase();
  if (lower === 'authorization' || lower === 'proxy-authorization') {
    const scheme = h.value.match(/^(\w+)\s/)?.[1];
    if (scheme?.toLowerCase() === 'bearer') return 'Bearer YOUR_TOKEN';
    if (scheme?.toLowerCase() === 'basic') return 'Basic YOUR_BASE64_USER_PASSWORD';
    return scheme ? `${scheme} YOUR_CREDENTIALS` : 'YOUR_CREDENTIALS';
  }
  return placeholderFor(h.name);
}

function utf8Base64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

// ---------------------------------------------------------------------------------------------
// n8n node

export function toN8nNode(req: CurlRequest, secretMode: SecretMode, name = 'HTTP Request', position: [number, number] = [0, 0]) {
  const nodeNotes: string[] = [];
  let headers = req.headers.map((h) => ({ ...h }));
  let query = req.query.map((q) => ({ ...q }));
  let credentialType: ConvertedRequest['credentialType'];

  // Basic auth becomes an Authorization header unless it moves into a credential.
  const isSecretHeader = (h: NameValue) => SECRET_HEADER.test(h.name) && h.name.toLowerCase() !== 'cookie';

  if (secretMode === 'credential') {
    const authIdx = headerIndex(headers, 'authorization');
    if (req.basicAuth || (authIdx > -1 && /^basic\s/i.test(headers[authIdx].value))) {
      credentialType = 'httpBasicAuth';
      if (authIdx > -1) headers.splice(authIdx, 1);
      nodeNotes.push('Create a "Basic Auth" credential with the username and password, then select it in the node (Authentication → Generic Credential Type → Basic Auth).');
    } else {
      const idx = authIdx > -1 ? authIdx : headers.findIndex(isSecretHeader);
      if (idx > -1) {
        credentialType = 'httpHeaderAuth';
        const h = headers[idx];
        headers.splice(idx, 1);
        nodeNotes.push(`Create a "Header Auth" credential with Name "${h.name}" and Value set to your secret${/^bearer\s/i.test(h.value) ? ' (including the "Bearer " prefix)' : ''}, then select it in the node.`);
      } else {
        const qi = query.findIndex((q) => SECRET_QUERY.test(q.name));
        if (qi > -1) {
          credentialType = 'httpQueryAuth';
          const q = query[qi];
          query.splice(qi, 1);
          nodeNotes.push(`Create a "Query Auth" credential with Name "${q.name}" and your key as the Value, then select it in the node.`);
        }
      }
    }
  } else if (req.basicAuth) {
    headers.unshift({
      name: 'Authorization',
      value: secretMode === 'keep' ? `Basic ${utf8Base64(`${req.basicAuth.user}:${req.basicAuth.password}`)}` : 'Basic YOUR_BASE64_USER_PASSWORD',
    });
  }

  // Remaining secrets: placeholders (credential and placeholder modes).
  if (secretMode !== 'keep') {
    let replaced = 0;
    headers = headers.map((h) => (isSecretHeader(h) && !/^YOUR_|\sYOUR_/.test(h.value) ? (replaced++, { ...h, value: headerPlaceholder(h) }) : h));
    query = query.map((q) => (SECRET_QUERY.test(q.name) ? (replaced++, { ...q, value: placeholderFor(q.name) }) : q));
    if (replaced && secretMode === 'credential') nodeNotes.push('An n8n node uses one credential, so other secrets were replaced with YOUR_… placeholders. Use expressions or a second credential for them.');
  }

  const p: Record<string, unknown> = { method: req.method, url: req.url };
  if (credentialType) {
    p.authentication = 'genericCredentialType';
    p.genericAuthType = credentialType;
  }
  if (query.length) {
    p.sendQuery = true;
    p.queryParameters = { parameters: query };
  }
  if (headers.length) {
    p.sendHeaders = true;
    p.headerParameters = { parameters: headers };
  }
  const b = req.body;
  if (b.kind === 'json') {
    Object.assign(p, { sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: JSON.stringify(b.value, null, 2) });
  } else if (b.kind === 'form') {
    Object.assign(p, { sendBody: true, contentType: 'form-urlencoded', bodyParameters: { parameters: b.fields } });
  } else if (b.kind === 'formString') {
    Object.assign(p, { sendBody: true, contentType: 'form-urlencoded', specifyBody: 'string', body: b.text });
  } else if (b.kind === 'multipart') {
    let fileNo = 0;
    const parameters = b.fields.map((f) =>
      f.file !== undefined
        ? { parameterType: 'formBinaryData', name: f.name, inputDataFieldName: fileNo++ ? `data${fileNo - 1}` : 'data' }
        : { parameterType: 'formData', name: f.name, value: f.value ?? '' },
    );
    if (fileNo) nodeNotes.push(`File fields read binary data from the previous node (field "data"${fileNo > 1 ? ', "data1", …' : ''}). Add a Read/Write Files from Disk or HTTP download node before this one.`);
    Object.assign(p, { sendBody: true, contentType: 'multipart-form-data', bodyParameters: { parameters } });
  } else if (b.kind === 'raw') {
    Object.assign(p, { sendBody: true, contentType: 'raw', rawContentType: b.contentType, body: b.text });
  } else if (b.kind === 'binary') {
    Object.assign(p, { sendBody: true, contentType: 'binaryData', inputDataFieldName: 'data' });
  }
  const options: Record<string, unknown> = {};
  if (req.insecure) options.allowUnauthorizedCerts = true;
  if (req.timeoutMs) options.timeout = req.timeoutMs;
  p.options = options;

  const node: N8nNode = { parameters: p, type: 'n8n-nodes-base.httpRequest', typeVersion: HTTP_REQUEST_TYPE_VERSION, position, name };
  return { node, credentialType, nodeNotes };
}

/** Converts one or more cURL commands into n8n HTTP Request nodes. */
export function convertCurl(input: string, secretMode: SecretMode = 'credential'): ConvertResult {
  if (!input.trim()) return { items: [], errors: [], clipboard: null };
  let commands: string[][];
  try {
    commands = tokenize(input);
  } catch (e) {
    return { items: [], errors: [(e as Error).message], clipboard: null };
  }
  if (!commands.length) return { items: [], errors: ['No curl command found. The input must start with "curl".'], clipboard: null };
  const items: ConvertedRequest[] = [];
  const errors: string[] = [];
  commands.forEach((words, i) => {
    try {
      const request = parseCurlArgs(words);
      const index = items.length;
      const { node, credentialType, nodeNotes } = toN8nNode(request, secretMode, index ? `HTTP Request ${index + 1}` : 'HTTP Request', [index * 240, 0]);
      items.push({ request, secrets: findSecrets(request), node, credentialType, nodeNotes });
    } catch (e) {
      errors.push(commands.length > 1 ? `Command ${i + 1}: ${(e as Error).message}` : (e as Error).message);
    }
  });
  return { items, errors, clipboard: items.length ? { nodes: items.map((it) => it.node), connections: {} } : null };
}
