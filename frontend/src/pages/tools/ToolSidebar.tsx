import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { categoryLabels, hubs, toolPath, toolsInHub, type ToolHub } from '../../data/tools';

/** Crawlable, category-grouped navigation between tools of one hub. */
export default function ToolSidebar({ hub }: { hub: ToolHub }) {
  const [query, setQuery] = useState('');
  const info = hubs[hub];
  const tools = useMemo(() => toolsInHub(hub), [hub]);
  const q = query.trim().toLowerCase();
  const visible = q ? tools.filter((t) => `${t.name} ${t.summary} ${t.keywords.join(' ')}`.toLowerCase().includes(q)) : tools;

  return (
    <nav aria-label={`${info.name} navigation`} className="rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-24">
      <label htmlFor={`tool-filter-${hub}`} className="sr-only">
        Filter {info.name.toLowerCase()}
      </label>
      <input
        id={`tool-filter-${hub}`}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Filter ${tools.length} tools…`}
        className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
      />
      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1 lg:max-h-[calc(100vh-12rem)]">
        {info.categories.map((category) => {
          const items = visible.filter((t) => t.category === category);
          if (!items.length) return null;
          return (
            <div key={category}>
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{categoryLabels[category]}</p>
              <ul>
                {items.map((tool) => (
                  <li key={tool.slug}>
                    <NavLink
                      to={toolPath(tool)}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                          isActive ? 'bg-blue-50 font-semibold text-blue-800' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                        }`
                      }
                    >
                      <span aria-hidden="true">{tool.icon}</span>
                      {tool.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {!visible.length && <p className="px-2 text-sm text-slate-500">No tools match &ldquo;{query}&rdquo;.</p>}
      </div>
    </nav>
  );
}
