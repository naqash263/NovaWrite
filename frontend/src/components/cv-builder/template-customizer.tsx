import { useId } from 'react';
import { moveSection, SECTION_TITLES, type CvLayout, type SectionKey } from './cv-sections';
import { ACCENT_PRESETS, FONT_OPTIONS, type CVStyle } from './cv-style';

export type { CVStyle } from './cv-style';

const FONT_SIZES = [10, 11, 12, 13, 14];

/** Accent colour, font and base size for the CV templates and exports. */
export const TemplateCustomizer = ({ style, onStyleChange }: { style: CVStyle; onStyleChange: (style: CVStyle) => void }) => {
  const id = useId();
  const accent = style.primaryColor.toLowerCase();
  const fontKnown = FONT_OPTIONS.some((f) => f.value === style.fontFamily);

  return (
    <section aria-labelledby={`${id}-title`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h3 id={`${id}-title`} className="text-lg font-semibold text-gray-900">
        Customize style
      </h3>
      <p className="mt-1 text-sm text-gray-600">Applies to the preview, the PDF and the Word file.</p>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-gray-700">Accent colour</legend>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map((preset) => (
            <label
              key={preset.value}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2 py-1 text-xs text-gray-700 ${accent === preset.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            >
              <input
                type="radio"
                name={`${id}-accent`}
                value={preset.value}
                checked={accent === preset.value}
                onChange={() => onStyleChange({ ...style, primaryColor: preset.value })}
                style={{ backgroundColor: preset.value }}
                className="h-4 w-4 cursor-pointer appearance-none rounded-full border border-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              />
              {preset.name}
            </label>
          ))}
          <label className="flex items-center gap-1.5 text-xs text-gray-700">
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(style.primaryColor) ? style.primaryColor : '#000000'}
              onChange={(e) => onStyleChange({ ...style, primaryColor: e.target.value })}
              aria-label="Custom accent colour"
              className="h-7 w-10 cursor-pointer rounded border border-gray-300 bg-white"
            />
            Custom
          </label>
        </div>
      </fieldset>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-font`} className="block text-sm font-medium text-gray-700">
            Font
          </label>
          <select
            id={`${id}-font`}
            value={style.fontFamily}
            onChange={(e) => onStyleChange({ ...style, fontFamily: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {!fontKnown && <option value={style.fontFamily}>{style.fontFamily}</option>}
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-size`} className="block text-sm font-medium text-gray-700">
            Font size
          </label>
          <select
            id={`${id}-size`}
            value={String(style.fontSize)}
            onChange={(e) => onStyleChange({ ...style, fontSize: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {!FONT_SIZES.includes(style.fontSize) && <option value={String(style.fontSize)}>{style.fontSize}px</option>}
            {FONT_SIZES.map((size) => (
              <option key={size} value={String(size)}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
};

/** Show / hide and reorder CV sections. */
export const SectionManager = ({ layout, onLayoutChange }: { layout: CvLayout; onLayoutChange: (layout: CvLayout) => void }) => {
  const id = useId();
  const toggle = (key: SectionKey, visible: boolean) =>
    onLayoutChange({ ...layout, hidden: visible ? layout.hidden.filter((k) => k !== key) : [...layout.hidden, key] });

  return (
    <section aria-labelledby={`${id}-title`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h3 id={`${id}-title`} className="text-lg font-semibold text-gray-900">
        Sections: order and visibility
      </h3>
      <p className="mt-1 text-sm text-gray-600">
        Hidden sections are left out everywhere. The order applies to the Classic ATS template, the PDF (ATS layout) and Word; admin templates keep their own order.
      </p>
      <ol className="mt-3 divide-y divide-gray-100">
        {layout.order.map((key, index) => {
          const title = SECTION_TITLES[key];
          const visible = !layout.hidden.includes(key);
          return (
            <li key={key} className="flex items-center justify-between gap-2 py-2">
              <label className="flex min-w-0 items-center gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => toggle(key, e.target.checked)}
                  aria-label={`Show ${title}`}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={visible ? '' : 'text-gray-400 line-through'}>{title}</span>
              </label>
              <span className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => onLayoutChange(moveSection(layout, key, -1))}
                  disabled={index === 0}
                  aria-label={`Move ${title} up`}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onLayoutChange(moveSection(layout, key, 1))}
                  disabled={index === layout.order.length - 1}
                  aria-label={`Move ${title} down`}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                >
                  ↓
                </button>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
