import { Link } from 'react-router-dom';
import { services } from '../../data/services';
import { featuredCaseStudies } from '../../data/caseStudies';
import { profile } from '../../data/profile';

const companyLinks = [
  { to: '/about', label: 'About' },
  { to: '/case-studies', label: 'Case Studies' },
  { to: '/projects', label: 'All Projects' },
  { to: '/blog', label: 'Blog' },
  { to: '/workflows', label: 'Workflow Templates' },
  { to: '/resources', label: 'Tools & Resources' },
  { to: '/contact', label: 'Contact' },
];

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold text-white">{title}</h2>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}

const linkClass = 'text-slate-400 transition-colors hover:text-white';

export default function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white font-mono text-sm font-semibold text-slate-950">NT</span>
              <span className="text-lg font-semibold text-white">{profile.name}</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              {profile.headline}. {profile.shortVersion}
            </p>
            <address className="mt-5 space-y-1 text-sm not-italic text-slate-400">
              <p className="text-white">{profile.location}</p>
              <p>Working with clients remotely</p>
              <a href={`mailto:${profile.email}`} className="block text-slate-300 hover:text-white">
                {profile.email}
              </a>
            </address>
            <ul className="mt-5 flex gap-4 text-sm">
              <li>
                <a href={profile.sameAs[0]} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  LinkedIn
                </a>
              </li>
              <li>
                <a href={profile.sameAs[1]} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  Fiverr
                </a>
              </li>
            </ul>
          </div>

          <FooterColumn title="Services">
            {services.map((s) => (
              <li key={s.slug}>
                <Link to={`/services/${s.slug}`} className={linkClass}>
                  {s.name}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Case studies">
            {featuredCaseStudies.map((c) => (
              <li key={c.slug}>
                <Link to={`/case-studies/${c.slug}`} className={linkClass}>
                  {c.name}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Explore">
            {companyLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {profile.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-5">
            <li>
              <Link to="/privacy-policy" className={linkClass}>
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms-of-service" className={linkClass}>
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/cookie-policy" className={linkClass}>
                Cookie Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
