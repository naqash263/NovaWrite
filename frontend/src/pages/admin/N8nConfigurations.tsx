import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, CheckCheck, Pause, Pencil, Play, Plus, Trash2, Webhook, Workflow, Zap } from 'lucide-react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import { AdminCard, AdminPageHeader, Badge, EmptyState, ErrorState, Field, IconButton, LoadingState, Modal, TableShell, inputClass } from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

interface N8nConfiguration {
  id: number;
  name: string;
  webhook_url: string;
  webhook_timeout: number;
  max_retry_attempts: number;
  is_active: boolean;
  auto_notify_on_failure?: boolean;
  gemini_fallback_enabled?: boolean;
  gemini_webhook_url?: string | null;
  gemini_fallback_timeout?: number | null;
  gemini_fallback_retry_attempts?: number | null;
}

interface FallbackWebhook {
  id: number;
  url: string;
  description?: string | null;
  is_active: boolean;
}

interface FallbackEmail {
  id: number;
  action: string;
  recipient_email: string;
  recipient_name?: string | null;
  details?: unknown;
  status: string;
  last_error?: string | null;
  attempts: number;
  created_at: string;
}

interface ConfigForm {
  name: string;
  webhook_url: string;
  webhook_timeout: number;
  max_retry_attempts: number;
  gemini_fallback_enabled: boolean;
  gemini_webhook_url: string;
  gemini_fallback_timeout: number;
  gemini_fallback_retry_attempts: number;
}

type Errors = Partial<Record<keyof ConfigForm, string>>;
type Tab = 'configurations' | 'webhooks' | 'failed';

const EMPTY_FORM: ConfigForm = {
  name: '',
  webhook_url: '',
  webhook_timeout: 30,
  max_retry_attempts: 3,
  gemini_fallback_enabled: false,
  gemini_webhook_url: '',
  gemini_fallback_timeout: 60,
  gemini_fallback_retry_attempts: 2,
};

const TABS: { id: Tab; label: string }[] = [
  { id: 'configurations', label: 'Configurations' },
  { id: 'webhooks', label: 'Fallback webhooks' },
  { id: 'failed', label: 'Failed emails' },
];

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60';

const isUrl = (v: string) => /^https?:\/\/\S+$/i.test(v.trim());

/** `{ success: false }` with a 200 still means the call failed. */
function ensureSuccess<T extends { success?: boolean; message?: string }>(data: T): T {
  if (data && data.success === false) throw new Error(data.message || 'The request failed.');
  return data;
}

function serverErrors(error: unknown): Errors {
  const bag = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
  return bag ? (Object.fromEntries(Object.entries(bag).map(([k, v]) => [k, v?.[0]])) as Errors) : {};
}

function numberInput(value: number, onChange: (n: number) => void, min: number, max: number) {
  return {
    type: 'number' as const,
    min,
    max,
    value: Number.isFinite(value) ? value : '',
    onChange: (e: { target: { value: string } }) => onChange(parseInt(e.target.value, 10)),
  };
}

export default function N8nConfigurations() {
  useSEO({ title: 'n8n Configurations | Admin', robots: 'noindex, nofollow' });
  const { addToast } = useToast();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('configurations');

  // ------------------------------------------------------------ configurations
  const configsQuery = useQuery({
    queryKey: ['n8n-configurations'],
    queryFn: async () => asList<N8nConfiguration>((await apiClient.get('/admin/n8n-configurations')).data),
  });
  const configs = configsQuery.data ?? [];
  const activeConfig = configs.find((c) => c.is_active);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<N8nConfiguration | null>(null);
  const [form, setForm] = useState<ConfigForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});

  const invalidateConfigs = () => queryClient.invalidateQueries({ queryKey: ['n8n-configurations'] });

  const saveMutation = useMutation({
    mutationFn: async (payload: ConfigForm) =>
      ensureSuccess(editing ? (await apiClient.put(`/admin/n8n-configurations/${editing.id}`, payload)).data : (await apiClient.post('/admin/n8n-configurations', payload)).data),
    onSuccess: () => {
      addToast({ type: 'success', title: editing ? 'Configuration updated' : 'Configuration created' });
      setFormOpen(false);
      invalidateConfigs();
    },
    onError: (error) => {
      setErrors(serverErrors(error));
      addToast({ type: 'error', title: 'Could not save configuration', description: apiErrorMessage(error) });
    },
  });

  const configAction = useMutation({
    mutationFn: async ({ config, action }: { config: N8nConfiguration; action: 'activate' | 'deactivate' | 'test' | 'delete' }) =>
      ensureSuccess(
        (action === 'delete' ? await apiClient.delete(`/admin/n8n-configurations/${config.id}`) : await apiClient.post(`/admin/n8n-configurations/${config.id}/${action}`)).data ?? {},
      ) as { message?: string },
    onSuccess: (data, { config, action }) => {
      const titles = { activate: `${config.name} activated`, deactivate: `${config.name} deactivated`, test: 'Connection test passed', delete: 'Configuration deleted' };
      addToast({ type: 'success', title: titles[action], description: action === 'test' ? data?.message : undefined });
      if (action !== 'test') invalidateConfigs();
    },
    onError: (error, { action }) => addToast({ type: 'error', title: action === 'test' ? 'Connection test failed' : 'Action failed', description: apiErrorMessage(error) }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (c: N8nConfiguration) => {
    setEditing(c);
    setForm({
      name: c.name ?? '',
      webhook_url: c.webhook_url ?? '',
      webhook_timeout: c.webhook_timeout ?? 30,
      max_retry_attempts: c.max_retry_attempts ?? 3,
      gemini_fallback_enabled: !!c.gemini_fallback_enabled,
      gemini_webhook_url: c.gemini_webhook_url ?? '',
      gemini_fallback_timeout: c.gemini_fallback_timeout ?? 60,
      gemini_fallback_retry_attempts: c.gemini_fallback_retry_attempts ?? 2,
    });
    setErrors({});
    setFormOpen(true);
  };

  const set = <K extends keyof ConfigForm>(key: K, value: ConfigForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.webhook_url.trim()) next.webhook_url = 'Webhook URL is required.';
    else if (!isUrl(form.webhook_url)) next.webhook_url = 'Enter a full URL starting with http:// or https://.';
    if (!(form.webhook_timeout >= 5 && form.webhook_timeout <= 300)) next.webhook_timeout = 'Use 5–300 seconds.';
    if (!(form.max_retry_attempts >= 1 && form.max_retry_attempts <= 10)) next.max_retry_attempts = 'Use 1–10 attempts.';
    if (form.gemini_fallback_enabled) {
      if (form.gemini_webhook_url && !isUrl(form.gemini_webhook_url)) next.gemini_webhook_url = 'Enter a full URL starting with http:// or https://.';
      if (!(form.gemini_fallback_timeout >= 5 && form.gemini_fallback_timeout <= 300)) next.gemini_fallback_timeout = 'Use 5–300 seconds.';
      if (!(form.gemini_fallback_retry_attempts >= 1 && form.gemini_fallback_retry_attempts <= 10)) next.gemini_fallback_retry_attempts = 'Use 1–10 attempts.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    saveMutation.mutate({ ...form, name: form.name.trim(), webhook_url: form.webhook_url.trim(), gemini_webhook_url: form.gemini_webhook_url.trim() });
  };

  const handleDeactivate = async (c: N8nConfiguration) => {
    const ok = await confirm({ title: 'Deactivate configuration', message: `Deactivate "${c.name}"? Emails sent through n8n will stop until another configuration is active.`, confirmText: 'Deactivate', type: 'warning' });
    if (ok) configAction.mutate({ config: c, action: 'deactivate' });
  };
  const handleDelete = async (c: N8nConfiguration) => {
    const ok = await confirm({ title: 'Delete configuration', message: `Delete "${c.name}"? This cannot be undone.`, confirmText: 'Delete', type: 'danger' });
    if (ok) configAction.mutate({ config: c, action: 'delete' });
  };
  const busy = (c: N8nConfiguration) => configAction.isPending && configAction.variables?.config.id === c.id;

  // ------------------------------------------------------------ fallback webhooks
  const webhooksQuery = useQuery({
    queryKey: ['fallback-webhooks'],
    enabled: tab === 'webhooks',
    queryFn: async () => asList<FallbackWebhook>((await apiClient.get('/admin/fallback-webhooks')).data),
  });
  const webhooks = webhooksQuery.data ?? [];
  const [webhookForm, setWebhookForm] = useState({ url: '', description: '' });
  const [webhookEditId, setWebhookEditId] = useState<number | null>(null);
  const [webhookError, setWebhookError] = useState<string>();

  const webhookSave = useMutation({
    mutationFn: async (payload: { url: string; description: string; is_active: boolean }) =>
      ensureSuccess(webhookEditId ? (await apiClient.put(`/admin/fallback-webhooks/${webhookEditId}`, payload)).data : (await apiClient.post('/admin/fallback-webhooks', payload)).data),
    onSuccess: () => {
      addToast({ type: 'success', title: webhookEditId ? 'Webhook updated' : 'Webhook added' });
      setWebhookForm({ url: '', description: '' });
      setWebhookEditId(null);
      queryClient.invalidateQueries({ queryKey: ['fallback-webhooks'] });
    },
    onError: (error) => setWebhookError(apiErrorMessage(error)),
  });

  const webhookDelete = useMutation({
    mutationFn: async (id: number) => ensureSuccess((await apiClient.delete(`/admin/fallback-webhooks/${id}`)).data ?? {}),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Webhook deleted' });
      queryClient.invalidateQueries({ queryKey: ['fallback-webhooks'] });
    },
    onError: (error) => addToast({ type: 'error', title: 'Could not delete webhook', description: apiErrorMessage(error) }),
  });

  const autoNotify = useMutation({
    mutationFn: async (value: boolean) => ensureSuccess((await apiClient.post('/admin/fallback-notifications/toggle-auto', { config_id: activeConfig!.id, auto_notify_on_failure: value })).data),
    onSuccess: (_d, value) => {
      addToast({ type: 'success', title: value ? 'Auto-notify enabled' : 'Auto-notify disabled' });
      invalidateConfigs();
    },
    onError: (error) => addToast({ type: 'error', title: 'Could not update auto-notify', description: apiErrorMessage(error) }),
  });

  const notifyNow = useMutation({
    mutationFn: async () => ensureSuccess((await apiClient.post('/admin/fallback-notifications/notify-now')).data) as { count?: number },
    onSuccess: (data) => addToast({ type: 'success', title: 'Webhooks notified', description: typeof data?.count === 'number' ? `${data.count} failed email(s) sent to fallback webhooks.` : undefined }),
    onError: (error) => addToast({ type: 'error', title: 'Could not notify webhooks', description: apiErrorMessage(error) }),
  });

  const submitWebhook = (e: FormEvent) => {
    e.preventDefault();
    if (!webhookForm.url.trim()) return setWebhookError('Webhook URL is required.');
    if (!isUrl(webhookForm.url)) return setWebhookError('Enter a full URL starting with http:// or https://.');
    setWebhookError(undefined);
    webhookSave.mutate({ url: webhookForm.url.trim(), description: webhookForm.description.trim(), is_active: true });
  };

  // ------------------------------------------------------------ failed emails
  const failedQuery = useQuery({
    queryKey: ['fallback-emails'],
    enabled: tab === 'failed',
    queryFn: async () => asList<FallbackEmail>((await apiClient.get('/admin/fallback-emails')).data),
  });
  const failedEmails = failedQuery.data ?? [];
  const markSent = useMutation({
    mutationFn: async (id: number) => ensureSuccess((await apiClient.post(`/admin/fallback-emails/${id}/mark-sent`)).data ?? {}),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Marked as sent' });
      queryClient.invalidateQueries({ queryKey: ['fallback-emails'] });
    },
    onError: (error) => addToast({ type: 'error', title: 'Could not update email', description: apiErrorMessage(error) }),
  });

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const next = e.key === 'ArrowRight' ? (i + 1) % TABS.length : e.key === 'ArrowLeft' ? (i - 1 + TABS.length) % TABS.length : -1;
    if (next < 0) return;
    e.preventDefault();
    setTab(TABS[next].id);
    document.getElementById(`n8n-tab-${TABS[next].id}`)?.focus();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="n8n Configurations"
        description="Webhooks that deliver transactional email through n8n, plus fallbacks when delivery fails."
        actions={
          tab === 'configurations' && (
            <button type="button" className={btnPrimary} onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New configuration
            </button>
          )
        }
      />

      <div role="tablist" aria-label="n8n sections" className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`n8n-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`n8n-panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={onTabKey}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'configurations' && (
        <div role="tabpanel" id="n8n-panel-configurations" aria-labelledby="n8n-tab-configurations">
          <AdminCard padded={false}>
            {configsQuery.isLoading ? (
              <LoadingState label="Loading configurations…" />
            ) : configsQuery.isError ? (
              <ErrorState message={apiErrorMessage(configsQuery.error)} onRetry={() => configsQuery.refetch()} />
            ) : configs.length === 0 ? (
              <EmptyState
                icon={Workflow}
                title="No n8n configurations"
                description="Add the n8n webhook that sends your transactional emails."
                action={
                  <button type="button" className={btnPrimary} onClick={openCreate}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    New configuration
                  </button>
                }
              />
            ) : (
              <TableShell caption="n8n configurations">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Webhook URL</th>
                    <th scope="col">Timeout</th>
                    <th scope="col">Retries</th>
                    <th scope="col">Gemini fallback</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="relative">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {configs.map((c) => (
                    <tr key={c.id}>
                      <td className="font-medium text-slate-900">{c.name}</td>
                      <td>
                        <span className="block max-w-[16rem] truncate font-mono text-xs" title={c.webhook_url}>
                          {c.webhook_url}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">{c.webhook_timeout}s</td>
                      <td>{c.max_retry_attempts}</td>
                      <td>{c.gemini_fallback_enabled ? <Badge tone="info">Enabled</Badge> : <span className="text-slate-400">Off</span>}</td>
                      <td>
                        <Badge tone={c.is_active ? 'success' : 'neutral'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <IconButton label={`Edit ${c.name}`} icon={Pencil} onClick={() => openEdit(c)} />
                          <IconButton label={`Test ${c.name}`} icon={Zap} disabled={busy(c)} onClick={() => configAction.mutate({ config: c, action: 'test' })} />
                          {c.is_active ? (
                            <IconButton label={`Deactivate ${c.name}`} icon={Pause} disabled={busy(c)} onClick={() => handleDeactivate(c)} />
                          ) : (
                            <>
                              <IconButton label={`Activate ${c.name}`} icon={Play} disabled={busy(c)} onClick={() => configAction.mutate({ config: c, action: 'activate' })} />
                              <IconButton label={`Delete ${c.name}`} icon={Trash2} tone="danger" disabled={busy(c)} onClick={() => handleDelete(c)} />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            )}
          </AdminCard>
        </div>
      )}

      {tab === 'webhooks' && (
        <div role="tabpanel" id="n8n-panel-webhooks" aria-labelledby="n8n-tab-webhooks" className="space-y-6">
          <AdminCard title={webhookEditId ? 'Edit webhook' : 'Add webhook'} description="Every fallback webhook receives failed emails so another system can deliver them.">
            <form onSubmit={submitWebhook} noValidate className="grid gap-4 md:grid-cols-[2fr_1fr_auto] md:items-start">
              <Field label="Webhook URL" required error={webhookError}>
                {(props) => (
                  <input
                    {...props}
                    type="url"
                    className={`${inputClass} font-mono`}
                    placeholder="https://hooks.example.com/failed-email"
                    value={webhookForm.url}
                    onChange={(e) => setWebhookForm((f) => ({ ...f, url: e.target.value }))}
                  />
                )}
              </Field>
              <Field label="Description">
                {(props) => <input {...props} className={inputClass} value={webhookForm.description} onChange={(e) => setWebhookForm((f) => ({ ...f, description: e.target.value }))} />}
              </Field>
              <div className="flex gap-2 md:mt-6">
                <button type="submit" className={btnPrimary} disabled={webhookSave.isPending}>
                  {webhookSave.isPending ? 'Saving…' : webhookEditId ? 'Update' : 'Add webhook'}
                </button>
                {webhookEditId && (
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => {
                      setWebhookEditId(null);
                      setWebhookForm({ url: '', description: '' });
                      setWebhookError(undefined);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </AdminCard>

          <AdminCard padded={false} title="Fallback webhooks">
            {webhooksQuery.isLoading ? (
              <LoadingState label="Loading webhooks…" />
            ) : webhooksQuery.isError ? (
              <ErrorState message={apiErrorMessage(webhooksQuery.error)} onRetry={() => webhooksQuery.refetch()} />
            ) : webhooks.length === 0 ? (
              <EmptyState icon={Webhook} title="No fallback webhooks" description="Add a webhook above to be told about emails that could not be sent." />
            ) : (
              <TableShell caption="Fallback webhooks">
                <thead>
                  <tr>
                    <th scope="col">URL</th>
                    <th scope="col">Description</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="relative">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {webhooks.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <span className="block max-w-[20rem] truncate font-mono text-xs" title={w.url}>
                          {w.url}
                        </span>
                      </td>
                      <td>{w.description || <span className="text-slate-400">—</span>}</td>
                      <td>
                        <Badge tone={w.is_active ? 'success' : 'neutral'}>{w.is_active ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <IconButton
                            label={`Edit webhook ${w.url}`}
                            icon={Pencil}
                            onClick={() => {
                              setWebhookEditId(w.id);
                              setWebhookForm({ url: w.url, description: w.description ?? '' });
                              setWebhookError(undefined);
                            }}
                          />
                          <IconButton
                            label={`Delete webhook ${w.url}`}
                            icon={Trash2}
                            tone="danger"
                            onClick={async () => {
                              if (await confirm({ title: 'Delete webhook', message: `Delete ${w.url}?`, confirmText: 'Delete', type: 'danger' })) webhookDelete.mutate(w.id);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            )}
          </AdminCard>

          <AdminCard title="Notifications">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  checked={!!activeConfig?.auto_notify_on_failure}
                  disabled={!activeConfig || autoNotify.isPending}
                  onChange={(e) => autoNotify.mutate(e.target.checked)}
                />
                <span>
                  Automatically notify every fallback webhook when a new failed email is detected
                  {!activeConfig && <span className="block text-xs text-slate-500">Activate an n8n configuration to use this.</span>}
                </span>
              </label>
              <button type="button" className={btnSecondary} onClick={() => notifyNow.mutate()} disabled={notifyNow.isPending}>
                <BellRing className="h-4 w-4" aria-hidden="true" />
                {notifyNow.isPending ? 'Notifying…' : 'Notify all now'}
              </button>
            </div>
          </AdminCard>
        </div>
      )}

      {tab === 'failed' && (
        <div role="tabpanel" id="n8n-panel-failed" aria-labelledby="n8n-tab-failed">
          <AdminCard padded={false} title="Failed and unsent emails">
            {failedQuery.isLoading ? (
              <LoadingState label="Loading failed emails…" />
            ) : failedQuery.isError ? (
              <ErrorState message={apiErrorMessage(failedQuery.error)} onRetry={() => failedQuery.refetch()} />
            ) : failedEmails.length === 0 ? (
              <EmptyState icon={CheckCheck} title="No failed emails" description="Every email handed to n8n was delivered." />
            ) : (
              <TableShell caption="Failed emails">
                <thead>
                  <tr>
                    <th scope="col">Recipient</th>
                    <th scope="col">Action</th>
                    <th scope="col">Status</th>
                    <th scope="col">Attempts</th>
                    <th scope="col">Last error</th>
                    <th scope="col">Details</th>
                    <th scope="col" className="relative">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {failedEmails.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <div className="font-medium text-slate-900">{e.recipient_email}</div>
                        {e.recipient_name && <div className="text-xs text-slate-500">{e.recipient_name}</div>}
                      </td>
                      <td className="font-mono text-xs">{e.action}</td>
                      <td>
                        <Badge tone="danger">{e.status}</Badge>
                      </td>
                      <td>{e.attempts}</td>
                      <td>
                        <span className="block max-w-[14rem] truncate text-xs" title={e.last_error ?? undefined}>
                          {e.last_error || '—'}
                        </span>
                      </td>
                      <td>
                        <details>
                          <summary className="cursor-pointer text-xs text-blue-700">Show</summary>
                          <pre className="mt-1 max-h-48 max-w-xs overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(e.details, null, 2)}</pre>
                        </details>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="whitespace-nowrap text-xs font-medium text-blue-700 hover:underline disabled:opacity-50"
                          disabled={markSent.isPending && markSent.variables === e.id}
                          onClick={async () => {
                            if (await confirm({ title: 'Mark as sent', message: `Mark the email to ${e.recipient_email} as sent? It will leave this list.`, confirmText: 'Mark as sent', type: 'info' })) markSent.mutate(e.id);
                          }}
                        >
                          Mark as sent
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            )}
          </AdminCard>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="lg"
        title={editing ? `Edit ${editing.name}` : 'New n8n configuration'}
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="n8n-form" className={btnPrimary} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create configuration'}
            </button>
          </>
        }
      >
        <form id="n8n-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Name" required error={errors.name}>
            {(props) => <input {...props} className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} />}
          </Field>
          <Field label="Webhook URL" required error={errors.webhook_url}>
            {(props) => (
              <input {...props} type="url" className={`${inputClass} font-mono`} placeholder="https://n8n.example.com/webhook/send-email" value={form.webhook_url} onChange={(e) => set('webhook_url', e.target.value)} />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Timeout (seconds)" required error={errors.webhook_timeout}>
              {(props) => <input {...props} className={inputClass} {...numberInput(form.webhook_timeout, (n) => set('webhook_timeout', n), 5, 300)} />}
            </Field>
            <Field label="Max retry attempts" required error={errors.max_retry_attempts}>
              {(props) => <input {...props} className={inputClass} {...numberInput(form.max_retry_attempts, (n) => set('max_retry_attempts', n), 1, 10)} />}
            </Field>
          </div>
          <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-800">Gemini API fallback</legend>
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                checked={form.gemini_fallback_enabled}
                onChange={(e) => set('gemini_fallback_enabled', e.target.checked)}
              />
              <span>
                Use n8n when the Gemini API fails
                <span className="block text-xs text-slate-500">For example when the quota is exceeded or requests are rate limited.</span>
              </span>
            </label>
            {form.gemini_fallback_enabled && (
              <>
                <Field label="Gemini webhook URL" error={errors.gemini_webhook_url}>
                  {(props) => (
                    <input
                      {...props}
                      type="url"
                      className={`${inputClass} font-mono`}
                      placeholder="https://n8n.example.com/webhook/gemini-fallback"
                      value={form.gemini_webhook_url}
                      onChange={(e) => set('gemini_webhook_url', e.target.value)}
                    />
                  )}
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Fallback timeout (seconds)" error={errors.gemini_fallback_timeout}>
                    {(props) => <input {...props} className={inputClass} {...numberInput(form.gemini_fallback_timeout, (n) => set('gemini_fallback_timeout', n), 5, 300)} />}
                  </Field>
                  <Field label="Fallback retry attempts" error={errors.gemini_fallback_retry_attempts}>
                    {(props) => <input {...props} className={inputClass} {...numberInput(form.gemini_fallback_retry_attempts, (n) => set('gemini_fallback_retry_attempts', n), 1, 10)} />}
                  </Field>
                </div>
              </>
            )}
          </fieldset>
        </form>
      </Modal>
    </div>
  );
}
