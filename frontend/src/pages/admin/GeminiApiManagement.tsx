import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Eye, EyeOff, Gauge, KeyRound, Pencil, Plus, Power, RotateCcw, Sparkles, Trash2, Users, Zap } from 'lucide-react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import { AdminCard, AdminPageHeader, Badge, EmptyState, ErrorState, Field, IconButton, LoadingState, Modal, StatCard, TableShell, inputClass } from '../../components/admin/ui';
import { apiErrorMessage } from '../../components/admin/utils';

interface GeminiApiKey {
  id: number;
  name: string;
  max_requests: number;
  total_requests: number;
  used_requests: number;
  is_active: boolean;
  created_at: string;
}

interface UserApiKey {
  id: number;
  user_id: number;
  name: string;
  requests_per_key?: number;
  usage_count?: number;
  is_active: boolean;
  created_at: string;
  user?: { id: number; name: string; email: string } | null;
}

interface Totals {
  total_keys?: number;
  total_requests?: number;
  used_requests?: number;
  available_requests?: number;
}

interface ApiStats extends Totals {
  gemini_keys?: Totals & { active_keys?: number };
  user_keys?: Totals;
  overall?: Totals;
}

interface HealthResult {
  total_keys?: number;
  healthy_keys?: number;
  unhealthy_keys?: number;
  keys?: Array<{ id: number; name: string; is_healthy: boolean; details?: { status?: string; error_message?: string } }>;
}

interface KeyForm {
  name: string;
  api_key: string;
  max_requests: number;
  is_active: boolean;
}

type KeyErrors = Partial<Record<keyof KeyForm, string>>;
type Tab = 'admin' | 'user';

const EMPTY_KEY: KeyForm = { name: '', api_key: '', max_requests: 5, is_active: true };

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60';

const num = (v: unknown) => (typeof v === 'number' ? v.toLocaleString() : '0');

function ensureSuccess<T extends { success?: boolean; message?: string }>(data: T): T {
  if (data && data.success === false) throw new Error(data.message || 'The request failed.');
  return data;
}

function serverErrors(error: unknown): KeyErrors {
  const bag = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
  return bag ? (Object.fromEntries(Object.entries(bag).map(([k, v]) => [k, v?.[0]])) as KeyErrors) : {};
}

function UsageBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div className="min-w-[8rem]">
      <div className="text-xs tabular-nums text-slate-700">
        {num(used)} / {num(total)}
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Usage">
        <div className={`h-1.5 rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-600'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function GeminiApiManagement() {
  useSEO({ title: 'Gemini API | Admin', robots: 'noindex, nofollow' });
  const { addToast } = useToast();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('admin');

  const keysQuery = useQuery({
    queryKey: ['gemini-api-keys'],
    queryFn: async () => {
      const data = (await apiClient.get('/admin/gemini-api-keys')).data?.data;
      return {
        keys: (Array.isArray(data?.api_keys) ? data.api_keys : []) as GeminiApiKey[],
        statistics: (data?.statistics ?? {}) as Totals,
      };
    },
  });
  const userKeysQuery = useQuery({
    queryKey: ['gemini-user-api-keys'],
    queryFn: async () => {
      const data = (await apiClient.get('/admin/user-api-keys')).data?.data;
      return (Array.isArray(data?.user_api_keys) ? data.user_api_keys : []) as UserApiKey[];
    },
  });
  const statsQuery = useQuery({
    queryKey: ['gemini-api-stats'],
    queryFn: async () => {
      const data = (await apiClient.get('/admin/gemini-api-keys/comprehensive-stats')).data?.data;
      return (data && typeof data === 'object' && !Array.isArray(data) ? data : {}) as ApiStats;
    },
  });

  const keys = keysQuery.data?.keys ?? [];
  const userKeys = userKeysQuery.data ?? [];
  const stats: ApiStats = { ...(keysQuery.data?.statistics ?? {}), ...(statsQuery.data ?? {}) };
  const totals: Totals = stats.overall ?? stats;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['gemini-api-keys'] });
    queryClient.invalidateQueries({ queryKey: ['gemini-user-api-keys'] });
    queryClient.invalidateQueries({ queryKey: ['gemini-api-stats'] });
  };

  // ---------------------------------------------------------------- admin keys
  const [keyModal, setKeyModal] = useState(false);
  const [editingKey, setEditingKey] = useState<GeminiApiKey | null>(null);
  const [keyForm, setKeyForm] = useState<KeyForm>(EMPTY_KEY);
  const [keyErrors, setKeyErrors] = useState<KeyErrors>({});
  const [showKey, setShowKey] = useState(false);
  const [health, setHealth] = useState<HealthResult | null>(null);

  const saveKey = useMutation({
    mutationFn: async (payload: Partial<KeyForm>) =>
      ensureSuccess(editingKey ? (await apiClient.put(`/admin/gemini-api-keys/${editingKey.id}`, payload)).data : (await apiClient.post('/admin/gemini-api-keys', payload)).data),
    onSuccess: () => {
      addToast({ type: 'success', title: editingKey ? 'API key updated' : 'API key added' });
      setKeyModal(false);
      setKeyForm(EMPTY_KEY); // drop the typed secret from memory
      invalidateAll();
    },
    onError: (error) => {
      setKeyErrors(serverErrors(error));
      addToast({ type: 'error', title: 'Could not save API key', description: apiErrorMessage(error) });
    },
  });

  const keyAction = useMutation({
    mutationFn: async ({ key, action }: { key: GeminiApiKey; action: 'toggle' | 'delete' | 'test' }) => {
      if (action === 'toggle') return ensureSuccess((await apiClient.put(`/admin/gemini-api-keys/${key.id}`, { is_active: !key.is_active })).data);
      if (action === 'delete') return ensureSuccess((await apiClient.delete(`/admin/gemini-api-keys/${key.id}`)).data);
      return (await apiClient.post(`/admin/gemini-api-keys/${key.id}/test`, {})).data;
    },
    onSuccess: (data, { key, action }) => {
      if (action === 'test') {
        const d = data?.details ?? {};
        if (data?.success && data?.valid) addToast({ type: 'success', title: `${key.name} is working`, description: [d.status && `Status: ${d.status}`, d.response_time && `Response: ${d.response_time}s`, d.quota_status && `Quota: ${d.quota_status}`].filter(Boolean).join(' · ') || data?.message });
        else addToast({ type: 'error', title: `${key.name} failed the test`, description: d.error_message || data?.message || 'Unknown error' });
        return;
      }
      addToast({ type: 'success', title: action === 'delete' ? 'API key deleted' : `${key.name} ${key.is_active ? 'deactivated' : 'activated'}` });
      invalidateAll();
    },
    onError: (error, { action }) => addToast({ type: 'error', title: action === 'test' ? 'Test failed' : 'Action failed', description: apiErrorMessage(error) }),
  });

  const healthCheck = useMutation({
    mutationFn: async () => ensureSuccess((await apiClient.get('/admin/gemini-api-keys/health-check')).data).data as HealthResult,
    onSuccess: (data) => {
      setHealth(data ?? {});
      const unhealthy = data?.unhealthy_keys ?? 0;
      addToast({ type: unhealthy ? 'warning' : 'success', title: 'Health check complete', description: `${num(data?.healthy_keys)}/${num(data?.total_keys)} active keys healthy.` });
    },
    onError: (error) => addToast({ type: 'error', title: 'Health check failed', description: apiErrorMessage(error) }),
  });

  const openAddKey = () => {
    setEditingKey(null);
    setKeyForm(EMPTY_KEY);
    setKeyErrors({});
    setShowKey(false);
    setKeyModal(true);
  };
  const openEditKey = (key: GeminiApiKey) => {
    setEditingKey(key);
    setKeyForm({ name: key.name ?? '', api_key: '', max_requests: key.max_requests ?? 5, is_active: !!key.is_active });
    setKeyErrors({});
    setShowKey(false);
    setKeyModal(true);
  };
  const submitKey = (e: FormEvent) => {
    e.preventDefault();
    const next: KeyErrors = {};
    if (!keyForm.name.trim()) next.name = 'Name is required.';
    if (!editingKey && !keyForm.api_key.trim()) next.api_key = 'API key is required.';
    if (!(keyForm.max_requests >= 1 && keyForm.max_requests <= 1000)) next.max_requests = 'Use a value between 1 and 1000.';
    setKeyErrors(next);
    if (Object.keys(next).length) return;
    const payload: Partial<KeyForm> = { ...keyForm, name: keyForm.name.trim(), api_key: keyForm.api_key.trim() };
    // Blank on edit keeps the stored key (sending "" would fail validation and reset usage).
    if (editingKey && !payload.api_key) delete payload.api_key;
    saveKey.mutate(payload);
  };
  const keyBusy = (key: GeminiApiKey) => keyAction.isPending && keyAction.variables?.key.id === key.id;

  // ---------------------------------------------------------------- user keys
  const [quotaKey, setQuotaKey] = useState<UserApiKey | null>(null);
  const [quotaForm, setQuotaForm] = useState({ requests_per_key: 100, is_active: true });
  const [quotaError, setQuotaError] = useState<string>();

  const userKeyAction = useMutation({
    mutationFn: async ({ key, action }: { key: UserApiKey; action: 'quota' | 'reset' | 'delete' }) => {
      if (action === 'quota') return ensureSuccess((await apiClient.put(`/admin/user-api-keys/${key.id}/quota`, quotaForm)).data);
      if (action === 'reset') return ensureSuccess((await apiClient.post(`/admin/user-api-keys/${key.id}/reset-usage`)).data);
      return ensureSuccess((await apiClient.delete(`/admin/user-api-keys/${key.id}`)).data);
    },
    onSuccess: (_d, { action }) => {
      addToast({ type: 'success', title: action === 'quota' ? 'Quota updated' : action === 'reset' ? 'Usage reset' : 'User API key deleted' });
      if (action === 'quota') setQuotaKey(null);
      invalidateAll();
    },
    onError: (error, { action }) => {
      if (action === 'quota') setQuotaError(apiErrorMessage(error));
      else addToast({ type: 'error', title: 'Action failed', description: apiErrorMessage(error) });
    },
  });

  const submitQuota = (e: FormEvent) => {
    e.preventDefault();
    if (!(quotaForm.requests_per_key >= 1 && quotaForm.requests_per_key <= 10000)) return setQuotaError('Use a value between 1 and 10,000.');
    setQuotaError(undefined);
    if (quotaKey) userKeyAction.mutate({ key: quotaKey, action: 'quota' });
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next: Tab = tab === 'admin' ? 'user' : 'admin';
    setTab(next);
    document.getElementById(`gemini-tab-${next}`)?.focus();
  };

  const unhealthy = health?.keys?.filter((k) => !k.is_healthy) ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gemini API"
        description="Manage the Gemini API keys the site rotates through and the quotas of users' own keys. Keys are stored encrypted and never displayed."
        actions={
          <>
            <button type="button" className={btnSecondary} onClick={() => healthCheck.mutate()} disabled={healthCheck.isPending}>
              <Activity className="h-4 w-4" aria-hidden="true" />
              {healthCheck.isPending ? 'Checking…' : 'Health check'}
            </button>
            <button type="button" className={btnPrimary} onClick={openAddKey}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add API key
            </button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="gemini-stats">
        <StatCard label="Total keys" icon={KeyRound} value={num(totals.total_keys)} hint={stats.gemini_keys && stats.user_keys ? `Admin ${num(stats.gemini_keys.total_keys)} · User ${num(stats.user_keys.total_keys)}` : undefined} />
        <StatCard label="Available requests" icon={Gauge} value={num(totals.available_requests)} hint={stats.gemini_keys && stats.user_keys ? `Admin ${num(stats.gemini_keys.available_requests)} · User ${num(stats.user_keys.available_requests)}` : undefined} />
        <StatCard label="Used requests" icon={Zap} value={num(totals.used_requests)} hint={stats.gemini_keys && stats.user_keys ? `Admin ${num(stats.gemini_keys.used_requests)} · User ${num(stats.user_keys.used_requests)}` : undefined} />
        <StatCard label="Total requests" icon={Sparkles} value={num(totals.total_requests)} hint={stats.gemini_keys && stats.user_keys ? `Admin ${num(stats.gemini_keys.total_requests)} · User ${num(stats.user_keys.total_requests)}` : undefined} />
      </div>

      {health && (
        <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${unhealthy.length ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
          <p className="font-medium">
            Health check: {num(health.healthy_keys)} of {num(health.total_keys)} active keys healthy.
          </p>
          {unhealthy.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {unhealthy.map((k) => (
                <li key={k.id}>
                  {k.name}: {k.details?.error_message || k.details?.status || 'unhealthy'}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div role="tablist" aria-label="Key type" className="flex gap-1 border-b border-slate-200">
        {(
          [
            { id: 'admin', label: `Admin keys (${keys.length})` },
            { id: 'user', label: `User keys (${userKeys.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            id={`gemini-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`gemini-panel-${t.id}`}
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

      {tab === 'admin' ? (
        <div role="tabpanel" id="gemini-panel-admin" aria-labelledby="gemini-tab-admin">
          <AdminCard padded={false}>
            {keysQuery.isLoading ? (
              <LoadingState label="Loading API keys…" />
            ) : keysQuery.isError ? (
              <ErrorState message={apiErrorMessage(keysQuery.error)} onRetry={() => keysQuery.refetch()} />
            ) : keys.length === 0 ? (
              <EmptyState
                icon={KeyRound}
                title="No Gemini API keys"
                description="Add a key from Google AI Studio so AI tools can make requests."
                action={
                  <button type="button" className={btnPrimary} onClick={openAddKey}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add API key
                  </button>
                }
              />
            ) : (
              <TableShell caption="Gemini API keys">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Key</th>
                    <th scope="col">Usage</th>
                    <th scope="col">Status</th>
                    <th scope="col">Created</th>
                    <th scope="col" className="relative">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {keys.map((key) => (
                    <tr key={key.id}>
                      <td className="font-medium text-slate-900">{key.name}</td>
                      <td>
                        <code className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-500" title="Stored encrypted; never displayed">
                          ••••••••
                        </code>
                      </td>
                      <td>
                        <UsageBar used={Number(key.used_requests) || 0} total={Number(key.total_requests) || 0} />
                      </td>
                      <td>
                        <Badge tone={key.is_active ? 'success' : 'neutral'}>{key.is_active ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="whitespace-nowrap text-xs">{key.created_at ? new Date(key.created_at).toLocaleDateString() : '—'}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <IconButton label={`Test ${key.name}`} icon={Zap} disabled={keyBusy(key)} onClick={() => keyAction.mutate({ key, action: 'test' })} />
                          <IconButton label={`Edit ${key.name}`} icon={Pencil} onClick={() => openEditKey(key)} />
                          <IconButton label={`${key.is_active ? 'Deactivate' : 'Activate'} ${key.name}`} icon={Power} disabled={keyBusy(key)} onClick={() => keyAction.mutate({ key, action: 'toggle' })} />
                          <IconButton
                            label={`Delete ${key.name}`}
                            icon={Trash2}
                            tone="danger"
                            disabled={keyBusy(key)}
                            onClick={async () => {
                              if (await confirm({ title: 'Delete API key', message: `Delete "${key.name}"? Requests will rotate to the remaining keys.`, confirmText: 'Delete', type: 'danger' }))
                                keyAction.mutate({ key, action: 'delete' });
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
        </div>
      ) : (
        <div role="tabpanel" id="gemini-panel-user" aria-labelledby="gemini-tab-user">
          <AdminCard padded={false} description="Keys users added to their own accounts. Adjust quotas or reset usage.">
            {userKeysQuery.isLoading ? (
              <LoadingState label="Loading user keys…" />
            ) : userKeysQuery.isError ? (
              <ErrorState message={apiErrorMessage(userKeysQuery.error)} onRetry={() => userKeysQuery.refetch()} />
            ) : userKeys.length === 0 ? (
              <EmptyState icon={Users} title="No user API keys" description="Keys appear here when users add their own Gemini key." />
            ) : (
              <TableShell caption="User API keys">
                <thead>
                  <tr>
                    <th scope="col">User</th>
                    <th scope="col">Key name</th>
                    <th scope="col">Usage</th>
                    <th scope="col">Status</th>
                    <th scope="col">Created</th>
                    <th scope="col" className="relative">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userKeys.map((key) => (
                    <tr key={key.id}>
                      <td>
                        <div className="font-medium text-slate-900">{key.user?.name ?? `User #${key.user_id}`}</div>
                        {key.user?.email && <div className="text-xs text-slate-500">{key.user.email}</div>}
                      </td>
                      <td>{key.name}</td>
                      <td>
                        <UsageBar used={Number(key.usage_count) || 0} total={Number(key.requests_per_key) || 0} />
                      </td>
                      <td>
                        <Badge tone={key.is_active ? 'success' : 'neutral'}>{key.is_active ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="whitespace-nowrap text-xs">{key.created_at ? new Date(key.created_at).toLocaleDateString() : '—'}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <IconButton
                            label={`Edit quota for ${key.name}`}
                            icon={Pencil}
                            onClick={() => {
                              setQuotaKey(key);
                              setQuotaForm({ requests_per_key: Number(key.requests_per_key) || 100, is_active: !!key.is_active });
                              setQuotaError(undefined);
                            }}
                          />
                          <IconButton
                            label={`Reset usage for ${key.name}`}
                            icon={RotateCcw}
                            onClick={async () => {
                              if (await confirm({ title: 'Reset usage', message: `Reset the usage counter for "${key.name}"?`, confirmText: 'Reset usage', type: 'warning' })) userKeyAction.mutate({ key, action: 'reset' });
                            }}
                          />
                          <IconButton
                            label={`Delete ${key.name}`}
                            icon={Trash2}
                            tone="danger"
                            onClick={async () => {
                              if (await confirm({ title: 'Delete user API key', message: `Delete "${key.name}"? The user will need to add a key again.`, confirmText: 'Delete', type: 'danger' }))
                                userKeyAction.mutate({ key, action: 'delete' });
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
        </div>
      )}

      <Modal
        open={keyModal}
        onClose={() => setKeyModal(false)}
        title={editingKey ? `Edit ${editingKey.name}` : 'Add Gemini API key'}
        description="The key is validated with Google before it is saved."
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setKeyModal(false)}>
              Cancel
            </button>
            <button type="submit" form="gemini-key-form" className={btnPrimary} disabled={saveKey.isPending}>
              {saveKey.isPending ? 'Saving…' : editingKey ? 'Save changes' : 'Add API key'}
            </button>
          </>
        }
      >
        <form id="gemini-key-form" onSubmit={submitKey} noValidate className="space-y-4" autoComplete="off">
          <Field label="Name" required error={keyErrors.name}>
            {(props) => <input {...props} className={inputClass} placeholder="e.g. Primary key" value={keyForm.name} onChange={(e) => setKeyForm((f) => ({ ...f, name: e.target.value }))} />}
          </Field>
          <Field label="API key" required={!editingKey} error={keyErrors.api_key} hint={editingKey ? 'A key is stored. Leave blank to keep it; entering a new key resets usage.' : 'Starts with AIza…'}>
            {(props) => (
              <div className="relative">
                <input
                  {...props}
                  type={showKey ? 'text' : 'password'}
                  autoComplete="off"
                  spellCheck={false}
                  className={`${inputClass} pr-10 font-mono`}
                  placeholder={editingKey ? '••••••••' : ''}
                  value={keyForm.api_key}
                  onChange={(e) => setKeyForm((f) => ({ ...f, api_key: e.target.value }))}
                />
                <IconButton
                  label={showKey ? 'Hide API key' : 'Show API key'}
                  icon={showKey ? EyeOff : Eye}
                  aria-pressed={showKey}
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowKey((v) => !v)}
                />
              </div>
            )}
          </Field>
          <Field label="Max requests" required error={keyErrors.max_requests} hint="Requests this key may serve before it is rotated out (1–1000).">
            {(props) => (
              <input
                {...props}
                type="number"
                min={1}
                max={1000}
                className={inputClass}
                value={Number.isFinite(keyForm.max_requests) ? keyForm.max_requests : ''}
                onChange={(e) => setKeyForm((f) => ({ ...f, max_requests: parseInt(e.target.value, 10) }))}
              />
            )}
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" checked={keyForm.is_active} onChange={(e) => setKeyForm((f) => ({ ...f, is_active: e.target.checked }))} />
            Active
          </label>
        </form>
      </Modal>

      <Modal
        open={!!quotaKey}
        onClose={() => setQuotaKey(null)}
        title="Edit user key quota"
        description={quotaKey ? `${quotaKey.user?.name ?? `User #${quotaKey.user_id}`} · ${quotaKey.name}` : undefined}
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setQuotaKey(null)}>
              Cancel
            </button>
            <button type="submit" form="gemini-quota-form" className={btnPrimary} disabled={userKeyAction.isPending}>
              {userKeyAction.isPending ? 'Saving…' : 'Update quota'}
            </button>
          </>
        }
      >
        <form id="gemini-quota-form" onSubmit={submitQuota} noValidate className="space-y-4">
          <Field label="Requests per key" required error={quotaError}>
            {(props) => (
              <input
                {...props}
                type="number"
                min={1}
                max={10000}
                className={inputClass}
                value={Number.isFinite(quotaForm.requests_per_key) ? quotaForm.requests_per_key : ''}
                onChange={(e) => setQuotaForm((f) => ({ ...f, requests_per_key: parseInt(e.target.value, 10) }))}
              />
            )}
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" checked={quotaForm.is_active} onChange={(e) => setQuotaForm((f) => ({ ...f, is_active: e.target.checked }))} />
            Active
          </label>
        </form>
      </Modal>
    </div>
  );
}
