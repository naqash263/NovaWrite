import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Copy, Eye, EyeOff, KeyRound, Plus, Trash2 } from 'lucide-react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import { copyToClipboard } from '../../utils/clipboard';
import {
  AdminCard,
  AdminPageHeader,
  Badge,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  LoadingState,
  Modal,
  SearchInput,
  TableShell,
  inputClass,
} from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

interface ApiToken {
  id: number;
  name: string;
  token?: string;
  /** Last 4 characters; the API no longer returns full tokens in listings. */
  token_preview?: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  permissions?: string[] | null;
}

interface TokenFormData {
  name: string;
  expires_in_days: number;
  permissions: string[];
}

type FieldErrors = Partial<Record<keyof TokenFormData, string>>;

const AVAILABLE_PERMISSIONS = [
  { value: 'read', label: 'Read', description: 'View workflows, courses and posts' },
  { value: 'write', label: 'Write', description: 'Create and update content' },
  { value: 'delete', label: 'Delete', description: 'Delete content' },
  { value: 'admin', label: 'Admin', description: 'Full administrative access' },
];

const EMPTY_FORM: TokenFormData = { name: '', expires_in_days: 30, permissions: ['read'] };

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60';

/** Masks a secret so that at most its last four characters are visible. */
function maskSecret(value: string | null | undefined) {
  if (!value) return '••••••••';
  return `••••••••${value.slice(-4)}`;
}

/** Laravel validators here return either `{ errors: {...} }` or the error bag itself. */
function validationErrors(error: unknown): FieldErrors {
  const data = (error as { response?: { status?: number; data?: Record<string, unknown> } })?.response;
  if (data?.status !== 422 || !data.data) return {};
  const bag = (data.data.errors ?? data.data) as Record<string, unknown>;
  const out: FieldErrors = {};
  for (const [key, value] of Object.entries(bag)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === 'string') out[key.split('.')[0] as keyof TokenFormData] = first;
  }
  return out;
}

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString() : 'Never');
const isExpired = (expiresAt: string | null) => !!expiresAt && new Date(expiresAt) < new Date();

function TokenValue({ token, preview }: { token?: string; preview?: string }) {
  const [revealed, setRevealed] = useState(false);
  const { addToast } = useToast();
  if (!token) {
    return preview ? (
      <code className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700" data-testid="token-value" title="Full tokens are shown only once, when created">
        ••••••••{preview}
      </code>
    ) : (
      <span className="text-slate-400">Hidden</span>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <code className="max-w-[16rem] truncate rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700" data-testid="token-value">
        {revealed ? token : maskSecret(token)}
      </code>
      <IconButton label={revealed ? 'Hide token' : 'Reveal token'} icon={revealed ? EyeOff : Eye} onClick={() => setRevealed((v) => !v)} aria-pressed={revealed} />
      <IconButton
        label="Copy token"
        icon={Copy}
        onClick={async () => {
          const ok = await copyToClipboard(token);
          addToast({ type: ok ? 'success' : 'error', title: ok ? 'Token copied' : 'Copy failed' });
        }}
      />
    </div>
  );
}

export default function ApiTokens() {
  useSEO({ title: 'API Tokens | Admin', description: 'Manage API access tokens for external integrations', url: '/admin/api-tokens', robots: 'noindex, nofollow' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<TokenFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [newToken, setNewToken] = useState<{ name: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  const tokensQuery = useQuery({
    queryKey: ['api-tokens'],
    queryFn: async () => asList<ApiToken>((await apiClient.get('/admin/api-tokens')).data),
  });
  const tokens = useMemo(() => tokensQuery.data ?? [], [tokensQuery.data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? tokens.filter((t) => t.name?.toLowerCase().includes(q)) : tokens;
  }, [tokens, search]);

  const createMutation = useMutation({
    mutationFn: async (data: TokenFormData) => (await apiClient.post('/admin/api-tokens', data)).data as ApiToken,
    onSuccess: (data) => {
      if (data?.token) setNewToken({ name: data.name, token: data.token });
      setCopied(false);
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      setShowForm(false);
      setFormData(EMPTY_FORM);
      addToast({ type: 'success', title: 'Token created', description: 'Copy it now: it will not be shown again.' });
    },
    onError: (error) => {
      const fieldErrors = validationErrors(error);
      setErrors(fieldErrors);
      addToast({ type: 'error', title: 'Could not create token', description: Object.values(fieldErrors)[0] ?? apiErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiClient.delete(`/admin/api-tokens/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      addToast({ type: 'success', title: 'Token revoked' });
    },
    onError: (error) => addToast({ type: 'error', title: 'Could not revoke token', description: apiErrorMessage(error) }),
  });

  const openForm = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
    setShowForm(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: FieldErrors = {};
    if (!formData.name.trim()) next.name = 'Token name is required.';
    if (formData.permissions.length === 0) next.permissions = 'Select at least one permission.';
    setErrors(next);
    if (Object.keys(next).length) return;
    createMutation.mutate({ ...formData, name: formData.name.trim() });
  };

  const handleDelete = async (token: ApiToken) => {
    const ok = await confirm({
      title: 'Revoke API token',
      message: `Revoke "${token.name}"? Integrations using this token will stop working immediately.`,
      confirmText: 'Revoke token',
      type: 'danger',
    });
    if (ok) deleteMutation.mutate(token.id);
  };

  const togglePermission = (value: string, checked: boolean) =>
    setFormData((prev) => ({
      ...prev,
      permissions: checked ? [...new Set([...prev.permissions, value])] : prev.permissions.filter((p) => p !== value),
    }));

  const copyNewToken = async () => {
    if (!newToken) return;
    const ok = await copyToClipboard(newToken.token);
    setCopied(ok);
    addToast({ type: ok ? 'success' : 'error', title: ok ? 'Token copied' : 'Copy failed' });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="API Tokens"
        description="Generate and revoke access tokens for external integrations and scripts."
        actions={
          <button type="button" className={btnPrimary} onClick={openForm}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Generate token
          </button>
        }
      />

      {newToken && (
        <section role="status" aria-label="New token" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5" data-testid="new-token">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-amber-600" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-emerald-900">Token "{newToken.name}" created</p>
              <p className="mt-0.5 text-sm text-emerald-800">
                Copy this token now and store it somewhere safe. <strong>You won't see it again</strong> once you dismiss this message.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all rounded-lg bg-white px-3 py-2 font-mono text-sm text-slate-900 ring-1 ring-emerald-200">{newToken.token}</code>
                <button type="button" className={btnPrimary} onClick={copyNewToken}>
                  {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                  {copied ? 'Copied' : 'Copy token'}
                </button>
              </div>
            </div>
            <button type="button" className={btnSecondary} onClick={() => setNewToken(null)}>
              Done
            </button>
          </div>
        </section>
      )}

      <AdminCard
        title="Tokens"
        description={tokens.length ? `${tokens.length} token${tokens.length === 1 ? '' : 's'}` : undefined}
        actions={tokens.length > 0 ? <SearchInput label="Search tokens" placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} /> : undefined}
        padded={false}
      >
        {tokensQuery.isLoading ? (
          <LoadingState label="Loading tokens…" />
        ) : tokensQuery.isError ? (
          <ErrorState message={apiErrorMessage(tokensQuery.error)} onRetry={() => tokensQuery.refetch()} />
        ) : tokens.length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title="No API tokens yet"
            description="Generate a token to let scripts and integrations call the API on your behalf."
            action={
              <button type="button" className={btnPrimary} onClick={openForm}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Generate token
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching tokens" description={`Nothing matches "${search}".`} />
        ) : (
          <TableShell caption="API tokens">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Token</th>
                <th scope="col">Permissions</th>
                <th scope="col">Created</th>
                <th scope="col">Last used</th>
                <th scope="col">Expires</th>
                <th scope="col" className="relative">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((token) => (
                <tr key={token.id}>
                  <td className="font-medium text-slate-900">
                    <span className="flex items-center gap-2">
                      {token.name}
                      {isExpired(token.expires_at) && <Badge tone="danger">Expired</Badge>}
                    </span>
                  </td>
                  <td>
                    <TokenValue token={token.token} preview={token.token_preview} />
                  </td>
                  <td>
                    <span className="flex flex-wrap gap-1">
                      {(Array.isArray(token.permissions) ? token.permissions : []).map((p) => (
                        <Badge key={p} tone={p === 'admin' ? 'warning' : 'neutral'}>
                          {p}
                        </Badge>
                      ))}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">{formatDate(token.created_at)}</td>
                  <td className="whitespace-nowrap">{formatDate(token.last_used_at)}</td>
                  <td className="whitespace-nowrap">{token.expires_at ? formatDate(token.expires_at) : 'Never'}</td>
                  <td className="text-right">
                    <IconButton
                      label={`Revoke ${token.name}`}
                      icon={Trash2}
                      tone="danger"
                      disabled={deleteMutation.isPending && deleteMutation.variables === token.id}
                      onClick={() => handleDelete(token)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </AdminCard>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Generate API token"
        description="The token value is shown once after it is created."
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" form="api-token-form" className={btnPrimary} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Generating…' : 'Generate token'}
            </button>
          </>
        }
      >
        <form id="api-token-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Token name" required error={errors.name} hint="A label that tells you where the token is used.">
            {(props) => (
              <input
                {...props}
                className={inputClass}
                value={formData.name}
                maxLength={255}
                placeholder="e.g. Mobile app integration"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            )}
          </Field>
          <Field label="Expires in" error={errors.expires_in_days}>
            {(props) => (
              <select {...props} className={inputClass} value={formData.expires_in_days} onChange={(e) => setFormData({ ...formData, expires_in_days: Number(e.target.value) })}>
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
                <option value={0}>Never expires</option>
              </select>
            )}
          </Field>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">Permissions</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {AVAILABLE_PERMISSIONS.map((permission) => (
                <label key={permission.value} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    checked={formData.permissions.includes(permission.value)}
                    onChange={(e) => togglePermission(permission.value, e.target.checked)}
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">{permission.label}</span>
                    <span className="block text-xs text-slate-500">{permission.description}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.permissions && <p className="mt-1 text-xs text-red-600">{errors.permissions}</p>}
          </fieldset>
        </form>
      </Modal>
    </div>
  );
}
