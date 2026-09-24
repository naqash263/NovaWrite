import { useEffect, useMemo, useState, type ReactNode } from 'react';
import QRCode from 'qrcode';

type Kind = 'text' | 'wifi' | 'email' | 'phone' | 'sms' | 'vcard';
type Level = 'L' | 'M' | 'Q' | 'H';

const KINDS: { value: Kind; label: string }[] = [
  { value: 'text', label: 'URL / Text' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'sms', label: 'SMS' },
  { value: 'vcard', label: 'Contact (vCard)' },
];

const escWifi = (s: string) => s.replace(/([\\;,:"])/g, '\\$1');
const escVcard = (s: string) => s.replace(/([\\;,])/g, '\\$1').replace(/\n/g, '\\n');
const HEX = /^#[0-9a-f]{6}$/i;

function luminance(hex: string) {
  const ch = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(1) + 0.7152 * ch(3) + 0.0722 * ch(5);
}

const inputCls = 'w-full rounded-lg border border-gray-300 p-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500';

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function QRCodeGenerator() {
  const [kind, setKind] = useState<Kind>('text');
  const [text, setText] = useState('https://naqashthaheem.com');
  const [wifi, setWifi] = useState({ ssid: '', password: '', security: 'WPA', hidden: false });
  const [email, setEmail] = useState({ to: '', subject: '', body: '' });
  const [phone, setPhone] = useState('');
  const [sms, setSms] = useState({ number: '', message: '' });
  const [vcard, setVcard] = useState({ first: '', last: '', phone: '', email: '', org: '', title: '', url: '' });

  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(4);
  const [level, setLevel] = useState<Level>('M');
  const [dark, setDark] = useState('#000000');
  const [light, setLight] = useState('#ffffff');
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const payload = useMemo(() => {
    switch (kind) {
      case 'text':
        return text.trim();
      case 'wifi':
        if (!wifi.ssid) return '';
        return `WIFI:T:${wifi.security};S:${escWifi(wifi.ssid)};${wifi.security !== 'nopass' ? `P:${escWifi(wifi.password)};` : ''}${wifi.hidden ? 'H:true;' : ''};`;
      case 'email': {
        if (!email.to.trim()) return '';
        const params = new URLSearchParams();
        if (email.subject) params.set('subject', email.subject);
        if (email.body) params.set('body', email.body);
        const q = params.toString().replace(/\+/g, '%20');
        return `mailto:${email.to.trim()}${q ? `?${q}` : ''}`;
      }
      case 'phone':
        return phone.trim() ? `tel:${phone.replace(/[^\d+*#]/g, '')}` : '';
      case 'sms':
        return sms.number.trim() ? `SMSTO:${sms.number.replace(/[^\d+]/g, '')}:${sms.message}` : '';
      case 'vcard': {
        if (!vcard.first && !vcard.last && !vcard.phone && !vcard.email) return '';
        const lines = [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `N:${escVcard(vcard.last)};${escVcard(vcard.first)};;;`,
          `FN:${escVcard(`${vcard.first} ${vcard.last}`.trim())}`,
          vcard.org && `ORG:${escVcard(vcard.org)}`,
          vcard.title && `TITLE:${escVcard(vcard.title)}`,
          vcard.phone && `TEL;TYPE=CELL:${vcard.phone}`,
          vcard.email && `EMAIL:${vcard.email}`,
          vcard.url && `URL:${vcard.url}`,
          'END:VCARD',
        ];
        return lines.filter(Boolean).join('\n');
      }
    }
  }, [kind, text, wifi, email, phone, sms, vcard]);

  const colorsValid = HEX.test(dark) && HEX.test(light);
  const contrastRatio = colorsValid
    ? (Math.max(luminance(dark), luminance(light)) + 0.05) / (Math.min(luminance(dark), luminance(light)) + 0.05)
    : 0;
  const inverted = colorsValid && luminance(dark) > luminance(light);
  const options = useMemo(
    () => ({ width: size, margin, errorCorrectionLevel: level, color: { dark, light } }),
    [size, margin, level, dark, light],
  );

  useEffect(() => {
    let cancelled = false;
    if (!payload) {
      setDataUrl('');
      setError('');
      return;
    }
    if (!colorsValid) {
      setError('Colours must be 6-digit hex values such as #000000.');
      setDataUrl('');
      return;
    }
    QRCode.toDataURL(payload, options)
      .then((url) => {
        if (cancelled) return;
        setDataUrl(url);
        setError('');
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setDataUrl('');
        setError(
          /too big/i.test(err.message)
            ? 'This content is too long for a QR code at this error-correction level. Shorten it or choose a lower level.'
            : 'Could not generate a QR code for this content.',
        );
      });
    return () => {
      cancelled = true;
    };
  }, [payload, options, colorsValid]);

  const trigger = (href: string, name: string) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadSvg = async () => {
    const svg = await QRCode.toString(payload, { ...options, type: 'svg' });
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    trigger(url, 'qr-code.svg');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copyImage = async () => {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setStatus('QR code image copied to clipboard.');
    } catch {
      setStatus('Your browser does not allow copying images. Use Download PNG instead.');
    }
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-700">QR code type</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  aria-pressed={kind === k.value}
                  onClick={() => setKind(k.value)}
                  className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                    kind === k.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </fieldset>

          {kind === 'text' && (
            <Field id="qr-text" label="Website URL or text">
              <textarea id="qr-text" value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="https://example.com" className={inputCls} />
            </Field>
          )}
          {kind === 'wifi' && (
            <div className="space-y-3">
              <Field id="qr-ssid" label="Network name (SSID)">
                <input id="qr-ssid" value={wifi.ssid} onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })} className={inputCls} />
              </Field>
              <Field id="qr-security" label="Security">
                <select id="qr-security" value={wifi.security} onChange={(e) => setWifi({ ...wifi, security: e.target.value })} className={inputCls}>
                  <option value="WPA">WPA / WPA2 / WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">None (open network)</option>
                </select>
              </Field>
              {wifi.security !== 'nopass' && (
                <Field id="qr-wifi-pass" label="Password">
                  <input id="qr-wifi-pass" value={wifi.password} onChange={(e) => setWifi({ ...wifi, password: e.target.value })} className={inputCls} />
                </Field>
              )}
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={wifi.hidden} onChange={(e) => setWifi({ ...wifi, hidden: e.target.checked })} className="h-4 w-4 rounded" />
                Hidden network
              </label>
            </div>
          )}
          {kind === 'email' && (
            <div className="space-y-3">
              <Field id="qr-email-to" label="Email address">
                <input id="qr-email-to" type="email" value={email.to} onChange={(e) => setEmail({ ...email, to: e.target.value })} className={inputCls} />
              </Field>
              <Field id="qr-email-subject" label="Subject (optional)">
                <input id="qr-email-subject" value={email.subject} onChange={(e) => setEmail({ ...email, subject: e.target.value })} className={inputCls} />
              </Field>
              <Field id="qr-email-body" label="Message (optional)">
                <textarea id="qr-email-body" rows={3} value={email.body} onChange={(e) => setEmail({ ...email, body: e.target.value })} className={inputCls} />
              </Field>
            </div>
          )}
          {kind === 'phone' && (
            <Field id="qr-phone" label="Phone number (with country code)">
              <input id="qr-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 20 7946 0000" className={inputCls} />
            </Field>
          )}
          {kind === 'sms' && (
            <div className="space-y-3">
              <Field id="qr-sms-number" label="Phone number">
                <input id="qr-sms-number" type="tel" value={sms.number} onChange={(e) => setSms({ ...sms, number: e.target.value })} className={inputCls} />
              </Field>
              <Field id="qr-sms-message" label="Message (optional)">
                <textarea id="qr-sms-message" rows={3} value={sms.message} onChange={(e) => setSms({ ...sms, message: e.target.value })} className={inputCls} />
              </Field>
            </div>
          )}
          {kind === 'vcard' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ['first', 'First name', 'text'],
                  ['last', 'Last name', 'text'],
                  ['phone', 'Phone', 'tel'],
                  ['email', 'Email', 'email'],
                  ['org', 'Company', 'text'],
                  ['title', 'Job title', 'text'],
                  ['url', 'Website', 'url'],
                ] as const
              ).map(([k, label, type]) => (
                <Field key={k} id={`qr-vc-${k}`} label={label}>
                  <input id={`qr-vc-${k}`} type={type} value={vcard[k]} onChange={(e) => setVcard({ ...vcard, [k]: e.target.value })} className={inputCls} />
                </Field>
              ))}
            </div>
          )}

          <details className="rounded-lg border border-gray-200 p-3" open>
            <summary className="cursor-pointer text-sm font-medium text-gray-700">Design and size</summary>
            <div className="mt-3 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field id="qr-dark" label="Foreground">
                  <div className="flex gap-2">
                    <input type="color" aria-label="Foreground colour picker" value={HEX.test(dark) ? dark : '#000000'} onChange={(e) => setDark(e.target.value)} className="h-10 w-12 flex-none rounded border border-gray-300" />
                    <input id="qr-dark" value={dark} onChange={(e) => setDark(e.target.value)} className={`${inputCls} min-w-0 font-mono text-sm`} />
                  </div>
                </Field>
                <Field id="qr-light" label="Background">
                  <div className="flex gap-2">
                    <input type="color" aria-label="Background colour picker" value={HEX.test(light) ? light : '#ffffff'} onChange={(e) => setLight(e.target.value)} className="h-10 w-12 flex-none rounded border border-gray-300" />
                    <input id="qr-light" value={light} onChange={(e) => setLight(e.target.value)} className={`${inputCls} min-w-0 font-mono text-sm`} />
                  </div>
                </Field>
              </div>
              {colorsValid && (contrastRatio < 4 || inverted) && (
                <p className="text-sm text-amber-700" data-testid="qr-contrast-warning">
                  {inverted ? 'Light-on-dark QR codes are not readable by some scanners.' : 'Low contrast between the colours may make the code hard to scan.'}
                </p>
              )}
              <Field id="qr-size" label={`PNG size: ${size}×${size}px`}>
                <input id="qr-size" type="range" min={128} max={2048} step={64} value={size} onChange={(e) => setSize(e.target.valueAsNumber)} className="w-full" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field id="qr-margin" label={`Quiet zone: ${margin} modules`}>
                  <input id="qr-margin" type="range" min={0} max={10} value={margin} onChange={(e) => setMargin(e.target.valueAsNumber)} className="w-full" />
                </Field>
                <Field id="qr-level" label="Error correction">
                  <select id="qr-level" value={level} onChange={(e) => setLevel(e.target.value as Level)} className={inputCls}>
                    <option value="L">Low (~7%)</option>
                    <option value="M">Medium (~15%)</option>
                    <option value="Q">Quartile (~25%)</option>
                    <option value="H">High (~30%)</option>
                  </select>
                </Field>
              </div>
            </div>
          </details>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-gray-700">Preview</h2>
          <div className="flex min-h-[280px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4">
            {dataUrl ? (
              <img src={dataUrl} alt="Generated QR code" data-testid="qr-image" className="h-auto w-full max-w-[320px]" />
            ) : (
              <p className="text-center text-gray-500">{error ? 'No QR code' : 'Fill in the fields to create a QR code.'}</p>
            )}
          </div>
          {error && (
            <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!dataUrl}
              onClick={() => trigger(dataUrl, 'qr-code.png')}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Download PNG
            </button>
            <button
              type="button"
              disabled={!dataUrl}
              onClick={downloadSvg}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Download SVG
            </button>
            <button
              type="button"
              disabled={!dataUrl}
              onClick={copyImage}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copy image
            </button>
          </div>
          <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-green-700">
            {status}
          </p>
          {payload && (
            <div className="mt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Encoded content</h3>
              <pre data-testid="qr-payload" className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-gray-50 p-2 font-mono text-xs text-gray-800">
                {payload}
              </pre>
            </div>
          )}
          <p className="mt-3 text-xs text-gray-500">Static QR codes: the content is stored in the code itself, so it never expires and nothing is tracked.</p>
        </div>
      </div>
    </div>
  );
}
