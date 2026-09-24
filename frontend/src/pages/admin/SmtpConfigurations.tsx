import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Copy, Eye, EyeOff, HelpCircle, Mail, Pencil, Plus, Send, Star, Trash2, XCircle, Zap } from 'lucide-react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import { AdminCard, AdminPageHeader, Badge, EmptyState, ErrorState, Field, IconButton, LoadingState, Modal, TableShell, inputClass } from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

interface SmtpConfiguration {
  id: number;
  name: string;
  mailer: string;
  host: string;
  port: number;
  username: string;
  encryption: string | null;
  from_address: string;
  from_name: string;
  is_active: boolean;
  is_default: boolean;
  description: string | null;
  last_tested_at: string | null;
  test_successful: boolean | null;
  test_error: string | null;
}

interface SmtpForm {
  name: string;
  mailer: string;
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: string | null;
  from_address: string;
  from_name: string;
  is_active: boolean;
  is_default: boolean;
  description: string;
}

type Errors = Partial<Record<keyof SmtpForm, string>>;

const MAILERS = [
  { value: 'smtp', label: 'SMTP' },
  { value: 'sendmail', label: 'Sendmail' },
  { value: 'mailgun', label: 'Mailgun' },
  { value: 'ses', label: 'Amazon SES' },
  { value: 'postmark', label: 'Postmark' },
  { value: 'resend', label: 'Resend' },
];
const ENCRYPTION = [
  { value: '', label: 'None' },
  { value: 'tls', label: 'TLS (STARTTLS)' },
  { value: 'ssl', label: 'SSL' },
];
const COMMON_PORTS = [25, 465, 587, 2525];

const EMPTY_FORM: SmtpForm = {
  name: '',
  mailer: 'smtp',
  host: '',
  port: 587,
  username: '',
  password: '',
  encryption: 'tls',
  from_address: '',
  from_name: 'NovaWrite',
  is_active: false,
  is_default: false,
  description: '',
};

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60';
const btnLink = 'text-xs font-medium text-blue-700 hover:underline disabled:opacity-50';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function serverErrors(error: unknown): Errors {
  const bag = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
  return bag ? (Object.fromEntries(Object.entries(bag).map(([k, v]) => [k, v?.[0]])) as Errors) : {};
}

function TestStatus({ config }: { config: SmtpConfiguration }) {
  const when = config.last_tested_at ? new Date(config.last_tested_at).toLocaleString() : null;
  if (config.test_successful === true)
    return (
      <span className="flex items-center gap-1.5 text-emerald-700" title={when ?? undefined}>
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Passed
      </span>
    );
  if (config.test_successful === false)
    return (
      <span className="flex items-center gap-1.5 text-red-700" title={config.test_error ?? undefined}>
        <XCircle className="h-4 w-4" aria-hidden="true" /> Failed
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-slate-500">
      <HelpCircle className="h-4 w-4" aria-hidden="true" /> Not tested
    </span>
  );
}

export default function SmtpConfigurations() {
  useSEO({ title: 'SMTP Configurations | Admin', robots: 'noindex, nofollow' });
  const { addToast } = useToast();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SmtpConfiguration | null>(null);
  const [form, setForm] = useState<SmtpForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState<SmtpConfiguration | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testError, setTestError] = useState<string>();
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const listQuery = useQuery({
    queryKey: ['smtp-configurations'],
    queryFn: async () => asList<SmtpConfiguration>((await apiClient.get('/admin/smtp-configurations')).data),
  });
  const configurations = listQuery.data ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['smtp-configurations'] });

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<SmtpForm>) =>
      editing ? (await apiClient.put(`/admin/smtp-configurations/${editing.id}`, payload)).data : (await apiClient.post('/admin/smtp-configurations', payload)).data,
    onSuccess: () => {
      addToast({ type: 'success', title: editing ? 'Configuration updated' : 'Configuration created' });
      setFormOpen(false);
      setForm(EMPTY_FORM); // never keep a typed password in memory longer than needed
      invalidate();
    },
    onError: (error) => {
      setErrors(serverErrors(error));
      addToast({ type: 'error', title: 'Could not save configuration', description: apiErrorMessage(error) });
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ config, action }: { config: SmtpConfiguration; action: 'set-active' | 'set-default' | 'duplicate' | 'delete' }) =>
      action === 'delete' ? apiClient.delete(`/admin/smtp-configurations/${config.id}`) : apiClient.post(`/admin/smtp-configurations/${config.id}/${action}`),
    onSuccess: (_d, { config, action }) => {
      const titles = { 'set-active': `${config.name} is now active`, 'set-default': `${config.name} is now the default`, duplicate: `${config.name} duplicated`, delete: 'Configuration deleted' };
      addToast({ type: 'success', title: titles[action] });
      invalidate();
    },
    onError: (error) => addToast({ type: 'error', title: 'Action failed', description: apiErrorMessage(error) }),
  });

  const testMutation = useMutation({
    mutationFn: async ({ config, email }: { config: SmtpConfiguration; email: string }) =>
      (await apiClient.post(`/admin/smtp-configurations/${config.id}/test`, { test_email: email })).data as { success?: boolean; message?: string },
    onSuccess: (data) => {
      const result = { success: !!data?.success, message: data?.message || (data?.success ? 'Test email sent.' : 'Test failed.') };
      setTestResult(result);
      setTesting(null);
      addToast({ type: result.success ? 'success' : 'error', title: result.success ? 'SMTP test passed' : 'SMTP test failed', description: result.message });
      invalidate();
    },
    onError: (error) => setTestError(apiErrorMessage(error)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowPassword(false);
    setFormOpen(true);
  };

  const openEdit = (c: SmtpConfiguration) => {
    setEditing(c);
    setForm({
      name: c.name ?? '',
      mailer: c.mailer || 'smtp',
      host: c.host ?? '',
      port: Number(c.port) || 587,
      username: c.username ?? '',
      password: '', // the API never returns the stored password
      encryption: c.encryption,
      from_address: c.from_address ?? '',
      from_name: c.from_name ?? '',
      is_active: !!c.is_active,
      is_default: !!c.is_default,
      description: c.description ?? '',
    });
    setErrors({});
    setShowPassword(false);
    setFormOpen(true);
  };

  const set = <K extends keyof SmtpForm>(key: K, value: SmtpForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.host.trim()) next.host = 'Host is required.';
    if (!Number.isInteger(form.port) || form.port < 1 || form.port > 65535) next.port = 'Enter a port between 1 and 65535.';
    if (!form.username.trim()) next.username = 'Username is required.';
    if (!editing && !form.password) next.password = 'Password is required.';
    if (!form.from_address.trim()) next.from_address = 'From address is required.';
    else if (!EMAIL.test(form.from_address.trim())) next.from_address = 'Enter a valid email address.';
    if (!form.from_name.trim()) next.from_name = 'From name is required.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const payload: Partial<SmtpForm> = { ...form, name: form.name.trim(), host: form.host.trim(), from_address: form.from_address.trim() };
    // Leaving the password blank on edit keeps the stored one (sending "" would fail validation).
    if (editing && !form.password) delete payload.password;
    saveMutation.mutate(payload);
  };

  const handleDelete = async (c: SmtpConfiguration) => {
    const ok = await confirm({ title: 'Delete SMTP configuration', message: `Delete "${c.name}"? Emails routed through it will fall back to the default configuration.`, confirmText: 'Delete', type: 'danger' });
    if (ok) actionMutation.mutate({ config: c, action: 'delete' });
  };

  const openTest = (c: SmtpConfiguration) => {
    setTesting(c);
    setTestEmail(c.from_address ?? '');
    setTestError(undefined);
  };

  const submitTest = (e: FormEvent) => {
    e.preventDefault();
    const email = testEmail.trim();
    if (!email) return setTestError('Recipient email is required.');
    if (!EMAIL.test(email)) return setTestError('Enter a valid email address.');
    if (testing) testMutation.mutate({ config: testing, email });
  };

  const busy = (c: SmtpConfiguration) => actionMutation.isPending && actionMutation.variables?.config.id === c.id;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="SMTP Configurations"
        description="Mail servers used to deliver email. The active configuration sends by default; passwords are stored encrypted and never shown again."
        actions={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New configuration
          </button>
        }
      />

      {testResult && (
        <div
          role="status"
          className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${testResult.success ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900'}`}
        >
          <span>
            <strong>{testResult.success ? 'Test passed. ' : 'Test failed. '}</strong>
            {testResult.message}
          </span>
          <IconButton label="Dismiss test result" icon={XCircle} onClick={() => setTestResult(null)} />
        </div>
      )}

      <AdminCard padded={false} title="Configurations" description={configurations.length ? `${configurations.length} configured` : undefined}>
        {listQuery.isLoading ? (
          <LoadingState label="Loading SMTP configurations…" />
        ) : listQuery.isError ? (
          <ErrorState message={apiErrorMessage(listQuery.error)} onRetry={() => listQuery.refetch()} />
        ) : configurations.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No SMTP configurations"
            description="Add your mail provider's SMTP details so the site can send email."
            action={
              <button type="button" className={btnPrimary} onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                New configuration
              </button>
            }
          />
        ) : (
          <TableShell caption="SMTP configurations">
            <thead>
              <tr>
                <th scope="col">Configuration</th>
                <th scope="col">Server</th>
                <th scope="col">Credentials</th>
                <th scope="col">Status</th>
                <th scope="col">Last test</th>
                <th scope="col" className="relative">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {configurations.map((c) => (
                <tr key={c.id}>
                  <td className="min-w-[12rem]">
                    <div className="font-medium text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.from_address}</div>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="font-mono text-xs text-slate-800">
                      {c.host}:{c.port}
                    </div>
                    <div className="text-xs text-slate-500">
                      {(c.mailer || 'smtp').toUpperCase()}
                      {c.encryption ? ` · ${c.encryption.toUpperCase()}` : ''}
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-xs">
                    <div className="text-slate-800">{c.username}</div>
                    <div className="font-mono text-slate-400" aria-label="Password hidden" data-testid="smtp-password">
                      ••••••••
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {c.is_active && <Badge tone="success">Active</Badge>}
                      {c.is_default && <Badge tone="info">Default</Badge>}
                      {!c.is_active && (
                        <button type="button" className={btnLink} disabled={busy(c)} onClick={() => actionMutation.mutate({ config: c, action: 'set-active' })}>
                          Set active
                        </button>
                      )}
                      {!c.is_default && (
                        <button type="button" className={btnLink} disabled={busy(c)} onClick={() => actionMutation.mutate({ config: c, action: 'set-default' })}>
                          Make default
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-xs">
                    <TestStatus config={c} />
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <IconButton label={`Send test email with ${c.name}`} icon={Zap} onClick={() => openTest(c)} />
                      <IconButton label={`Edit ${c.name}`} icon={Pencil} onClick={() => openEdit(c)} />
                      <IconButton label={`Duplicate ${c.name}`} icon={Copy} disabled={busy(c)} onClick={() => actionMutation.mutate({ config: c, action: 'duplicate' })} />
                      <IconButton label={`Delete ${c.name}`} icon={Trash2} tone="danger" disabled={busy(c)} onClick={() => handleDelete(c)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </AdminCard>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="lg"
        title={editing ? `Edit ${editing.name}` : 'New SMTP configuration'}
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="smtp-form" className={btnPrimary} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create configuration'}
            </button>
          </>
        }
      >
        <form id="smtp-form" onSubmit={handleSubmit} noValidate className="space-y-4" autoComplete="off">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required error={errors.name}>
              {(props) => <input {...props} className={inputClass} placeholder="e.g. Postmark production" value={form.name} onChange={(e) => set('name', e.target.value)} />}
            </Field>
            <Field label="Mailer" error={errors.mailer}>
              {(props) => (
                <select {...props} className={inputClass} value={form.mailer} onChange={(e) => set('mailer', e.target.value)}>
                  {MAILERS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
            <Field label="Host" required error={errors.host}>
              {(props) => <input {...props} className={`${inputClass} font-mono`} placeholder="smtp.example.com" value={form.host} onChange={(e) => set('host', e.target.value)} />}
            </Field>
            <Field label="Port" required error={errors.port} hint="587, 465, 25 or 2525">
              {(props) => (
                <>
                  <input
                    {...props}
                    type="number"
                    min={1}
                    max={65535}
                    list="smtp-common-ports"
                    className={inputClass}
                    value={Number.isFinite(form.port) ? form.port : ''}
                    onChange={(e) => set('port', parseInt(e.target.value, 10))}
                  />
                  <datalist id="smtp-common-ports">
                    {COMMON_PORTS.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </>
              )}
            </Field>
            <Field label="Encryption" error={errors.encryption}>
              {(props) => (
                <select {...props} className={inputClass} value={form.encryption ?? ''} onChange={(e) => set('encryption', e.target.value || null)}>
                  {ENCRYPTION.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Username" required error={errors.username}>
              {(props) => <input {...props} className={inputClass} autoComplete="off" value={form.username} onChange={(e) => set('username', e.target.value)} />}
            </Field>
            <Field label="Password" required={!editing} error={errors.password} hint={editing ? 'A password is stored. Leave blank to keep it.' : undefined}>
              {(props) => (
                <div className="relative">
                  <input
                    {...props}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`${inputClass} pr-10`}
                    placeholder={editing ? '••••••••' : ''}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                  />
                  <IconButton
                    label={showPassword ? 'Hide password' : 'Show password'}
                    icon={showPassword ? EyeOff : Eye}
                    aria-pressed={showPassword}
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword((v) => !v)}
                  />
                </div>
              )}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From address" required error={errors.from_address}>
              {(props) => <input {...props} type="email" className={inputClass} placeholder="hello@example.com" value={form.from_address} onChange={(e) => set('from_address', e.target.value)} />}
            </Field>
            <Field label="From name" required error={errors.from_name}>
              {(props) => <input {...props} className={inputClass} value={form.from_name} onChange={(e) => set('from_name', e.target.value)} />}
            </Field>
          </div>
          <Field label="Description" error={errors.description}>
            {(props) => <textarea {...props} rows={2} className={inputClass} value={form.description} onChange={(e) => set('description', e.target.value)} />}
          </Field>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
              Set as active
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" checked={form.is_default} onChange={(e) => set('is_default', e.target.checked)} />
              <Star className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              Set as default
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!testing}
        onClose={() => setTesting(null)}
        title={testing ? `Test ${testing.name}` : 'Test configuration'}
        description="Sends a short test message through this server."
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setTesting(null)}>
              Cancel
            </button>
            <button type="submit" form="smtp-test-form" className={btnPrimary} disabled={testMutation.isPending}>
              <Send className="h-4 w-4" aria-hidden="true" />
              {testMutation.isPending ? 'Sending…' : 'Send test'}
            </button>
          </>
        }
      >
        <form id="smtp-test-form" onSubmit={submitTest} noValidate>
          <Field label="Send test to" required error={testError}>
            {(props) => <input {...props} type="email" className={inputClass} value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />}
          </Field>
        </form>
      </Modal>
    </div>
  );
}
