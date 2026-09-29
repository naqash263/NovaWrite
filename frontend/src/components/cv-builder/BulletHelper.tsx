import { useId, useState } from 'react';
import { ACTION_VERBS, BULLET_PATTERNS, analyzeBullets, appendBullet } from './bullet-helper';

/** Action verbs, quantified patterns and a live check for one experience description. */
export default function BulletHelper({ index, description, onChange }: { index: number; description: string; onChange: (next: string) => void }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const check = analyzeBullets(description || '');

  return (
    <div className="space-y-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Bullet ideas for experience ${index + 1}`}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {open ? 'Hide bullet ideas' : 'Bullet ideas: action verbs and examples'}
      </button>

      {open && (
        <div id={panelId} className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs text-gray-600">Start each line with an action verb and add a number where you can. Click to add a new bullet.</p>
          {ACTION_VERBS.map((group) => (
            <div key={group.group}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{group.group}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.verbs.map((verb) => (
                  <button
                    key={verb}
                    type="button"
                    aria-label={`Insert "${verb}"`}
                    onClick={() => onChange(appendBullet(description || '', `${verb} `))}
                    className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800 hover:border-blue-400 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {verb}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Quantified patterns</p>
            <ul className="space-y-1">
              {BULLET_PATTERNS.map((pattern) => (
                <li key={pattern}>
                  <button
                    type="button"
                    aria-label={`Insert pattern: ${pattern}`}
                    onClick={() => onChange(appendBullet(description || '', pattern))}
                    className="w-full rounded-md border border-dashed border-gray-300 bg-white px-2 py-1 text-left text-xs text-gray-700 hover:border-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {pattern}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {check.count > 0 && (
        <div data-testid={`bullet-feedback-${index}`} aria-live="polite" className="text-xs text-gray-600">
          <p>
            {check.withNumbers} of {check.count} bullets include a number.{' '}
            {check.withNumbers < check.count && 'Quantify results where you can (%, time saved, revenue, team size).'}
          </p>
          {check.weakStarts.length > 0 && (
            <p className="text-amber-700">
              Weak opening: {check.weakStarts.map((w) => `"${w}"`).join(', ')}. Start with an action verb instead.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
