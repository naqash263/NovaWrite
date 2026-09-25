import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Download, Inbox, Mail, MailOpen, Trash2, TrendingUp, Users } from 'lucide-react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { useConfirm } from '../../hooks/use-confirm';
import { AdminCard, AdminPageHeader, Badge, EmptyState, ErrorState, IconButton, LoadingState, Modal, SearchInput, StatCard, TableShell, inputClass } from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  subject: string;
  message: string;
  inquiry_type: string;
  source?: string | null;
  is_read: boolean;
  created_at: string;
}

interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

interface LeadStats {
  total: number;
  unread: number;
  last_30_days: number;
  subscribers: number;
  top_sources: Array<{ source: string; total: number }>;
}

interface Subscriber {
  email: string;
  last_opt_in: string;
  downloads: number;
}

const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60';

const num = (v: unknown) => (typeof v === 'number' ? v.toLocaleString() : '—');

const dateTime = (value: string) =>
  new Date(value).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** "tool:json-formatter" → "Tool · json-formatter"; "booking:AI & Automation" → "Booking · AI & Automation". */
const sourceLabel = (source?: string | null) => {
  if (!source) return 'Contact page';
  const [kind, ...rest] = source.split(':');
  return rest.length ? `${kind.charAt(0).toUpperCase()}${kind.slice(1)} · ${rest.join(':')}` : source;
};

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Leads() {
  useSEO({ title: 'Leads | Admin', robots: 'noindex, nofollow' });
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const [tab, setTab] = useState<'enquiries' | 'subscribers'>('enquiries');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [status, setStatus] = useState('');
  const [inquiryType, setInquiryType] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => setPage(1), [debouncedSearch, status, inquiryType]);

  const stats = useQuery({
    queryKey: ['admin', 'leads', 'stats'],
    queryFn: async () => (await apiClient.get<LeadStats>('/admin/leads/stats')).data,
  });

  const leads = useQuery({
    queryKey: ['admin', 'leads', { page, debouncedSearch, status, inquiryType }],
    queryFn: async () =>
      (
        await apiClient.get<Paginated<Lead>>('/admin/leads', {
          params: { page, search: debouncedSearch || undefined, status: status || undefined, inquiry_type: inquiryType || undefined },
        })
      ).data,
    placeholderData: keepPreviousData,
    enabled: tab === 'enquiries',
  });

  const subscribers = useQuery({
    queryKey: ['admin', 'leads', 'subscribers'],
    queryFn: async () => (await apiClient.get<Paginated<Subscriber>>('/admin/leads/subscribers', { params: { per_page: 200 } })).data,
    enabled: tab === 'subscribers',
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] });

  const openLead = useMutation({
    mutationFn: async (lead: Lead) => (await apiClient.get<Lead>(`/admin/leads/${lead.id}`)).data,
    onSuccess: (lead) => {
      setSelected(lead);
      refresh();
    },
    onError: (error) => setActionError(apiErrorMessage(error, 'Could not open this enquiry.')),
  });

  const setRead = useMutation({
    mutationFn: async ({ id, is_read }: { id: number; is_read: boolean }) => (await apiClient.patch<Lead>(`/admin/leads/${id}`, { is_read })).data,
    onSuccess: (lead) => {
      setSelected((current) => (current?.id === lead.id ? lead : current));
      refresh();
    },
    onError: (error) => setActionError(apiErrorMessage(error, 'Could not update this enquiry.')),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => apiClient.delete(`/admin/leads/${id}`),
    onSuccess: () => {
      setSelected(null);
      refresh();
    },
    onError: (error) => setActionError(apiErrorMessage(error, 'Could not delete this enquiry.')),
  });

  const confirmDelete = async (lead: Lead) => {
    const ok = await confirm({ title: 'Delete enquiry', message: `Delete the enquiry from ${lead.name}? This cannot be undone.`, confirmText: 'Delete', type: 'danger' });
    if (ok) remove.mutate(lead.id);
  };

  const leadRows = asList<Lead>(leads.data);
  const subscriberRows = asList<Subscriber>(subscribers.data);
  const s = stats.data;
  const topSources = Array.isArray(s?.top_sources) ? s.top_sources : [];

  return (
    <div>
      <AdminPageHeader
        title="Leads"
        description="Enquiries from the contact form and consultation bookings, with the page or tool they came from, plus people who opted in to updates when downloading a workflow."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Unread enquiries" value={num(s?.unread)} icon={Mail} />
        <StatCard label="Enquiries, last 30 days" value={num(s?.last_30_days)} icon={TrendingUp} />
        <StatCard label="All enquiries" value={num(s?.total)} icon={Inbox} />
        <StatCard label="Email subscribers" value={num(s?.subscribers)} icon={Users} />
      </div>

      {topSources.length > 0 && (
        <AdminCard title="Top lead sources" className="mb-6">
          <ul className="flex flex-wrap gap-2" aria-label="Top lead sources">
            {topSources.map((row) => (
              <li key={row.source}>
                <Badge tone="info">
                  {sourceLabel(row.source)}: {row.total}
                </Badge>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}

      {actionError && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
        </div>
      )}

      <div role="tablist" aria-label="Lead lists" className="mb-4 flex gap-2">
        {(['enquiries', 'subscribers'] as const).map((key) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === key ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'}`}
          >
            {key === 'enquiries' ? 'Enquiries' : 'Subscribers'}
          </button>
        ))}
      </div>

      {tab === 'enquiries' ? (
        <AdminCard padded={false}>
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <SearchInput label="Search enquiries" placeholder="Name, email, company or subject" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Status</span>
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Type</span>
              <select className={inputClass} value={inquiryType} onChange={(e) => setInquiryType(e.target.value)}>
                <option value="">All types</option>
                <option value="consultation">Consultation</option>
                <option value="project">Project</option>
                <option value="general">General</option>
                <option value="partnership">Partnership</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>

          {leads.isLoading ? (
            <LoadingState label="Loading enquiries…" />
          ) : leads.isError ? (
            <ErrorState message={apiErrorMessage(leads.error)} onRetry={() => leads.refetch()} />
          ) : leadRows.length === 0 ? (
            <EmptyState title="No enquiries yet" description="New contact form messages and consultation requests will appear here." />
          ) : (
            <>
              <TableShell caption="Enquiries">
                <thead>
                  <tr>
                    <th scope="col">From</th>
                    <th scope="col">Subject</th>
                    <th scope="col">Type</th>
                    <th scope="col">Source</th>
                    <th scope="col">Received</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leadRows.map((lead) => (
                    <tr key={lead.id} className={lead.is_read ? '' : 'font-semibold'}>
                      <td>
                        <button type="button" className="text-left text-blue-700 hover:underline" onClick={() => openLead.mutate(lead)}>
                          {lead.name}
                        </button>
                        <div className="text-xs font-normal text-slate-500">{lead.email}</div>
                      </td>
                      <td className="max-w-xs truncate">{lead.subject}</td>
                      <td>
                        <Badge tone={lead.inquiry_type === 'consultation' || lead.inquiry_type === 'project' ? 'success' : 'neutral'}>{lead.inquiry_type}</Badge>
                      </td>
                      <td className="whitespace-nowrap text-xs font-normal">{sourceLabel(lead.source)}</td>
                      <td className="whitespace-nowrap text-xs font-normal">{dateTime(lead.created_at)}</td>
                      <td className="whitespace-nowrap text-right">
                        <IconButton
                          label={lead.is_read ? `Mark enquiry from ${lead.name} as unread` : `Mark enquiry from ${lead.name} as read`}
                          icon={lead.is_read ? Mail : MailOpen}
                          onClick={() => setRead.mutate({ id: lead.id, is_read: !lead.is_read })}
                        />
                        <IconButton label={`Delete enquiry from ${lead.name}`} icon={Trash2} tone="danger" onClick={() => confirmDelete(lead)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
              {leads.data && (leads.data.last_page ?? 1) > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
                  <span>
                    Page {leads.data.current_page} of {leads.data.last_page} · {leads.data.total} enquiries
                  </span>
                  <div className="flex gap-2">
                    <IconButton label="Previous page" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => p - 1)} />
                    <IconButton label="Next page" icon={ChevronRight} disabled={page >= leads.data.last_page} onClick={() => setPage((p) => p + 1)} />
                  </div>
                </div>
              )}
            </>
          )}
        </AdminCard>
      ) : (
        <AdminCard
          title="Email subscribers"
          description="People who ticked “send me updates” when downloading a workflow. Only email people on this list."
          actions={
            <button
              type="button"
              className={buttonClass}
              disabled={subscriberRows.length === 0}
              onClick={() =>
                downloadCsv('subscribers.csv', [['email', 'last_opt_in', 'downloads'], ...subscriberRows.map((r) => [r.email, r.last_opt_in, String(r.downloads)])])
              }
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </button>
          }
          padded={false}
        >
          {subscribers.isLoading ? (
            <LoadingState label="Loading subscribers…" />
          ) : subscribers.isError ? (
            <ErrorState message={apiErrorMessage(subscribers.error)} onRetry={() => subscribers.refetch()} />
          ) : subscriberRows.length === 0 ? (
            <EmptyState title="No subscribers yet" description="Opt-ins from workflow downloads will appear here." />
          ) : (
            <TableShell caption="Email subscribers">
              <thead>
                <tr>
                  <th scope="col">Email</th>
                  <th scope="col">Last opt-in</th>
                  <th scope="col">Downloads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriberRows.map((row) => (
                  <tr key={row.email}>
                    <td>{row.email}</td>
                    <td className="whitespace-nowrap text-xs">{dateTime(row.last_opt_in)}</td>
                    <td>{row.downloads}</td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          )}
        </AdminCard>
      )}

      <Modal
        open={Boolean(selected)}
        title={selected ? selected.subject : ''}
        description={selected ? `${selected.name} · ${dateTime(selected.created_at)} · ${sourceLabel(selected.source)}` : undefined}
        onClose={() => setSelected(null)}
        size="lg"
        footer={
          selected && (
            <>
              <button type="button" className={buttonClass} onClick={() => setRead.mutate({ id: selected.id, is_read: false })}>
                Mark as unread
              </button>
              <a
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Reply by email
              </a>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="font-medium text-slate-500">Email</dt>
                <dd className="text-slate-900">{selected.email}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Phone</dt>
                <dd className="text-slate-900">{selected.phone || '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Company</dt>
                <dd className="text-slate-900">{selected.company || '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Type</dt>
                <dd className="text-slate-900">{selected.inquiry_type}</dd>
              </div>
            </dl>
            <div>
              <p className="font-medium text-slate-500">Message</p>
              <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-slate-900">{selected.message}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
