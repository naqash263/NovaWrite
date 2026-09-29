import { useRef, useState } from 'react';
import { addVat, formatFils, fromVatAmount, parseFils, removeVat, type VatBreakdown } from './uaeMoney';

type Mode = 'add' | 'remove' | 'reverse';
type View = 'single' | 'lines';

const modes: Record<Mode, { label: string; amountLabel: string; hint: string }> = {
  add: { label: 'Add VAT', amountLabel: 'Amount excluding VAT (AED)', hint: 'VAT = amount × 5%. Total = amount × 1.05.' },
  remove: { label: 'Remove VAT', amountLabel: 'Amount including VAT (AED)', hint: 'VAT = amount × 5 ÷ 105. Net = amount − VAT.' },
  reverse: { label: 'From VAT amount', amountLabel: 'VAT amount (AED)', hint: 'Net = VAT × 20. Total = VAT × 21.' },
};

interface Line {
  id: number;
  description: string;
  quantity: string;
  price: string;
  rate: '5' | '0';
}

const inputClass = (error?: string) =>
  `w-full min-w-0 rounded-lg border px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-400' : 'border-gray-300'}`;

const MAX_FILS = 100_000_000_000n; // AED 1,000,000,000

function amountError(raw: string, label: string, allowZero = false) {
  if (raw.trim() === '') return `Enter the ${label}.`;
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0 || (!allowZero && n === 0)) return `The ${label} must be greater than 0.`;
  const fils = parseFils(raw);
  if (fils === null) return 'Use a number with at most 2 decimal places.';
  if (fils > MAX_FILS) return 'Enter an amount up to AED 1,000,000,000.';
  return '';
}

function quantityError(raw: string) {
  if (raw.trim() === '') return '';
  return /^\d+$/.test(raw.trim()) && Number(raw) >= 1 && Number(raw) <= 1_000_000 ? '' : 'Enter a whole quantity from 1 to 1,000,000.';
}

const qty = (raw: string) => BigInt(raw.trim() === '' ? 1 : Number(raw));

function Result({ r, testid }: { r: VatBreakdown; testid: string }) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3" data-testid={testid}>
      <div className="rounded-lg bg-gray-50 p-3">
        <dt className="text-sm text-gray-600">Net (excl. VAT)</dt>
        <dd className="break-words text-xl font-bold text-gray-900 tabular-nums" data-testid={`${testid}-net`}>
          {formatFils(r.net)}
        </dd>
      </div>
      <div className="rounded-lg bg-amber-50 p-3">
        <dt className="text-sm text-gray-600">VAT (5%)</dt>
        <dd className="break-words text-xl font-bold text-amber-800 tabular-nums" data-testid={`${testid}-vat`}>
          {formatFils(r.vat)}
        </dd>
      </div>
      <div className="rounded-lg bg-blue-50 p-3">
        <dt className="text-sm text-gray-600">Total (incl. VAT)</dt>
        <dd className="break-words text-xl font-bold text-blue-800 tabular-nums" data-testid={`${testid}-gross`}>
          {formatFils(r.gross)}
        </dd>
      </div>
    </dl>
  );
}

export default function UaeVatCalculator() {
  const [view, setView] = useState<View>('single');
  const [mode, setMode] = useState<Mode>('add');
  const [amount, setAmount] = useState('1000');
  const [quantity, setQuantity] = useState('');
  const [pricesInclude, setPricesInclude] = useState(false);
  const [lines, setLines] = useState<Line[]>([
    { id: 1, description: 'Item 1', quantity: '1', price: '100', rate: '5' },
    { id: 2, description: 'Item 2', quantity: '2', price: '49.99', rate: '5' },
  ]);
  const nextId = useRef(3);
  const [notice, setNotice] = useState('');

  // ---- single amount
  const info = modes[mode];
  const amtError = amountError(amount, mode === 'reverse' ? 'VAT amount' : 'amount');
  const qtyError = mode === 'reverse' ? '' : quantityError(quantity);
  let single: VatBreakdown | null = null;
  if (!amtError && !qtyError) {
    const base = parseFils(amount)! * (mode === 'reverse' ? 1n : qty(quantity));
    single = mode === 'add' ? addVat(base) : mode === 'remove' ? removeVat(base) : fromVatAmount(base);
  }

  // ---- line items
  const lineResults = lines.map((l) => {
    const errors = { price: amountError(l.price, 'unit price', true), quantity: quantityError(l.quantity) || (l.quantity.trim() === '' ? 'Enter a quantity.' : '') };
    if (errors.price || errors.quantity) return { line: l, errors, result: null };
    const base = parseFils(l.price)! * qty(l.quantity);
    const rate = BigInt(l.rate);
    return { line: l, errors, result: pricesInclude ? removeVat(base, rate) : addVat(base, rate) };
  });
  const linesValid = lineResults.every((r) => r.result);
  const totals = lineResults.reduce<VatBreakdown>(
    (t, r) => (r.result ? { net: t.net + r.result.net, vat: t.vat + r.result.vat, gross: t.gross + r.result.gross } : t),
    { net: 0n, vat: 0n, gross: 0n },
  );

  const updateLine = (id: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const addLine = () => {
    const id = nextId.current++;
    setLines((ls) => [...ls, { id, description: `Item ${ls.length + 1}`, quantity: '1', price: '', rate: '5' }]);
  };
  const removeLine = (id: number) => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.id !== id) : ls));

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice((n) => (n === msg ? '' : n)), 2500);
  };

  const summary = () => {
    if (view === 'single' && single) {
      const q = mode !== 'reverse' && quantity.trim() !== '' && quantity.trim() !== '1' ? ` (quantity ${quantity.trim()})` : '';
      return [`UAE VAT at 5% - ${info.label}${q}`, `Net (excl. VAT): ${formatFils(single.net)}`, `VAT 5%: ${formatFils(single.vat)}`, `Total (incl. VAT): ${formatFils(single.gross)}`].join('\n');
    }
    const rows = lineResults.map(({ line, result }) =>
      result ? `${line.description || 'Item'}\t${line.quantity}\t${line.price}\t${line.rate}%\t${formatFils(result.net)}\t${formatFils(result.vat)}\t${formatFils(result.gross)}` : '',
    );
    return [
      `Description\tQty\tUnit price (${pricesInclude ? 'incl.' : 'excl.'} VAT)\tVAT rate\tNet\tVAT\tTotal`,
      ...rows,
      `Total\t\t\t\t${formatFils(totals.net)}\t${formatFils(totals.vat)}\t${formatFils(totals.gross)}`,
    ].join('\n');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary());
      flash('Copied to clipboard.');
    } catch {
      flash('Copy failed. Select the result and copy it manually.');
    }
  };

  const canCopy = view === 'single' ? Boolean(single) : linesValid;

  return (
    <div className="min-w-0">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 inline-flex overflow-hidden rounded-lg border border-gray-300" role="group" aria-label="Calculator view">
          {(
            [
              ['single', 'Single amount'],
              ['lines', 'Line items'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-medium ${view === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === 'single' ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2" role="group" aria-label="VAT calculation">
              {(Object.keys(modes) as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                    mode === m ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {modes[m].label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="vat-amount" className="mb-1.5 block text-sm font-medium text-gray-700">
                  {info.amountLabel}
                </label>
                <input
                  id="vat-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-invalid={Boolean(amtError)}
                  aria-describedby={amtError ? 'vat-amount-error' : 'vat-amount-hint'}
                  className={inputClass(amtError)}
                />
                {amtError ? (
                  <p id="vat-amount-error" className="mt-1 text-sm text-red-700">
                    {amtError}
                  </p>
                ) : (
                  <p id="vat-amount-hint" className="mt-1 text-xs text-gray-500">
                    {info.hint}
                  </p>
                )}
              </div>
              {mode !== 'reverse' && (
                <div className="min-w-0">
                  <label htmlFor="vat-quantity" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Quantity (optional)
                  </label>
                  <input
                    id="vat-quantity"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    placeholder="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    aria-invalid={Boolean(qtyError)}
                    aria-describedby={qtyError ? 'vat-quantity-error' : 'vat-quantity-hint'}
                    className={inputClass(qtyError)}
                  />
                  {qtyError ? (
                    <p id="vat-quantity-error" className="mt-1 text-sm text-red-700">
                      {qtyError}
                    </p>
                  ) : (
                    <p id="vat-quantity-hint" className="mt-1 text-xs text-gray-500">
                      The amount is treated as a unit price and multiplied by the quantity.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div aria-live="polite">
              {single ? (
                <Result r={single} testid="vat-result" />
              ) : (
                <p className="rounded-lg bg-gray-50 p-4 text-gray-600" data-testid="vat-empty">
                  Enter a valid amount to see the VAT breakdown.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="vat-lines-basis" className="text-sm font-medium text-gray-700">
                Unit prices are
              </label>
              <select
                id="vat-lines-basis"
                value={pricesInclude ? 'incl' : 'excl'}
                onChange={(e) => setPricesInclude(e.target.value === 'incl')}
                className="min-w-0 rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="excl">Excluding VAT</option>
                <option value="incl">Including VAT</option>
              </select>
            </div>
            <ol className="space-y-3" data-testid="vat-lines">
              {lineResults.map(({ line, errors, result }, i) => (
                <li key={line.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,1.6fr)_auto] sm:items-end">
                    <div className="col-span-2 min-w-0 sm:col-span-1">
                      <label htmlFor={`vat-line-${line.id}-desc`} className="mb-1 block text-xs font-medium text-gray-600">
                        Line {i + 1} description
                      </label>
                      <input
                        id={`vat-line-${line.id}-desc`}
                        type="text"
                        value={line.description}
                        onChange={(e) => updateLine(line.id, { description: e.target.value })}
                        className={inputClass()}
                      />
                    </div>
                    <div className="min-w-0">
                      <label htmlFor={`vat-line-${line.id}-qty`} className="mb-1 block text-xs font-medium text-gray-600">
                        Line {i + 1} quantity
                      </label>
                      <input
                        id={`vat-line-${line.id}-qty`}
                        type="number"
                        inputMode="numeric"
                        min="1"
                        step="1"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.id, { quantity: e.target.value })}
                        aria-invalid={Boolean(errors.quantity)}
                        className={inputClass(errors.quantity)}
                      />
                    </div>
                    <div className="min-w-0">
                      <label htmlFor={`vat-line-${line.id}-price`} className="mb-1 block text-xs font-medium text-gray-600">
                        Line {i + 1} unit price
                      </label>
                      <input
                        id={`vat-line-${line.id}-price`}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={line.price}
                        onChange={(e) => updateLine(line.id, { price: e.target.value })}
                        aria-invalid={Boolean(errors.price)}
                        className={inputClass(errors.price)}
                      />
                    </div>
                    <div className="col-span-2 min-w-0 sm:col-span-1">
                      <label htmlFor={`vat-line-${line.id}-rate`} className="mb-1 block text-xs font-medium text-gray-600">
                        Line {i + 1} VAT rate
                      </label>
                      <select
                        id={`vat-line-${line.id}-rate`}
                        value={line.rate}
                        onChange={(e) => updateLine(line.id, { rate: e.target.value as Line['rate'] })}
                        className={inputClass()}
                      >
                        <option value="5">5% standard</option>
                        <option value="0">0% zero-rated or exempt</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length === 1}
                      aria-label={`Remove line ${i + 1}`}
                      className="col-span-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 sm:col-span-1"
                    >
                      Remove
                    </button>
                  </div>
                  {(errors.price || errors.quantity) && (
                    <p className="mt-2 text-sm text-red-700">{[errors.quantity, errors.price].filter(Boolean).join(' ')}</p>
                  )}
                  {result && (
                    <p className="mt-2 text-xs text-gray-600 tabular-nums" data-testid={`vat-line-${i + 1}-result`}>
                      Net {formatFils(result.net)} · VAT {formatFils(result.vat)} · Total {formatFils(result.gross)}
                    </p>
                  )}
                </li>
              ))}
            </ol>
            <button type="button" onClick={addLine} className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
              Add line
            </button>
            <div aria-live="polite">
              {linesValid ? (
                <Result r={totals} testid="vat-lines-total" />
              ) : (
                <p className="rounded-lg bg-gray-50 p-4 text-gray-600" data-testid="vat-lines-invalid">
                  Fix the highlighted lines to see the invoice total.
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500">VAT is calculated and rounded to the fils on each line, and the lines are added up for the total.</p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="button" onClick={copy} disabled={!canCopy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            Copy
          </button>
          <span aria-live="polite" className="text-sm text-gray-600" data-testid="vat-notice">
            {notice}
          </span>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="vat-formula-heading">
        <h2 id="vat-formula-heading" className="text-xl font-semibold text-gray-900">
          UAE VAT formulas
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-gray-700">
          <li>Add VAT: VAT = net × 5%; total = net × 1.05.</li>
          <li>Remove VAT: VAT = total × 5 ÷ 105 (about 4.76% of the total); net = total ÷ 1.05.</li>
          <li>From a VAT amount: net = VAT × 20; total = VAT × 21.</li>
        </ul>
        <h3 className="mt-5 text-lg font-semibold text-gray-900">Worked examples</h3>
        <p className="mt-2 text-gray-700">
          AED 1,000 before VAT: VAT AED 50.00, total AED 1,050.00. AED 1,000 including VAT: VAT = 1,000 × 5 ÷ 105 = AED 47.62, net AED 952.38.
          Taking 5% of a VAT-inclusive total (AED 50) overstates the VAT.
        </p>
        <h3 className="mt-5 text-lg font-semibold text-gray-900">Sources</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>
            <a href="https://tax.gov.ae/en/faqs" target="_blank" rel="noopener noreferrer" className="break-words text-blue-700 underline hover:text-blue-800">
              Federal Tax Authority: tax FAQs
            </a>
          </li>
          <li>
            <a
              href="https://u.ae/en/information-and-services/finance-and-investment/taxation/valueaddedtaxvat/about-vat"
              target="_blank"
              rel="noopener noreferrer"
              className="break-words text-blue-700 underline hover:text-blue-800"
            >
              u.ae: About VAT (standard rate 5% since 1 January 2018)
            </a>
          </li>
          <li>
            <a href="https://mof.gov.ae/en/public-finance/tax/vat/" target="_blank" rel="noopener noreferrer" className="break-words text-blue-700 underline hover:text-blue-800">
              UAE Ministry of Finance: VAT
            </a>
          </li>
        </ul>
        <p className="mt-4 text-sm text-gray-600">Estimate for everyday pricing and invoices; it does not decide whether a supply is standard-rated, zero-rated or exempt.</p>
      </section>
    </div>
  );
}
