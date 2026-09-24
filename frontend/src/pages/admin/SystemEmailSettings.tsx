import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Activity, Bell, KeyRound, Mail, Save, Send, Server, UserPlus, type LucideIcon } from 'lucide-react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { AdminCard, AdminPageHeader, EmptyState, ErrorState, Field, LoadingState, Modal, inputClass } from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

interface SmtpConfiguration {
  id: number;
  name: string;
  from_address: string;
  from_name?: string;
  is_active?: boolean;
  is_default?: boolean;
}

interface SystemEmailSettingsData {
  password_reset_smtp_id: number | null;
  welcome_email_smtp_id: number | null;
  notification_smtp_id: number | null;
  default_smtp_id: number | null;
}

type SettingKey = keyof SystemEmailSettingsData;
type TestType = 'password_reset' | 'welcome_email' | 'notification';

const EMPTY: SystemEmailSettingsData = { password_reset_smtp_id: null, welcome_email_smtp_id: null, notification_smtp_id: null, default_smtp_id: null };

const ROWS: { key: SettingKey; title: string; description: string; icon: LucideIcon; testType?: TestType }[] = [
  { key: 'password_reset_smtp_id', title: 'Password reset emails', description: 'Sent when a user asks to reset their password.', icon: KeyRound, testType: 'password_reset' },
  { key: 'welcome_email_smtp_id', title: 'Welcome emails', description: 'Sent to new users after they register.', icon: UserPlus, testType: 'welcome_email' },
  { key: 'notification_smtp_id', title: 'Notification emails', description: 'Course updates, workflow notifications and similar messages.', icon: Bell, testType: 'notification' },
  { key: 'default_smtp_id', title: 'Default', description: 'Used for any system email without its own configuration.', icon: Server },
];

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60';

function normalise(payload: unknown): SystemEmailSettingsData {
  const raw = (payload as { data?: unknown })?.data;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return EMPTY;
  const id = (v: unknown) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
  const r = raw as Record<string, unknown>;
  return {
    password_reset_smtp_id: id(r.password_reset_smtp_id),
    welcome_email_smtp_id: id(r.welcome_email_smtp_id),
    notification_smtp_id: id(r.notification_smtp_id),
    default_smtp_id: id(r.default_smtp_id),
  };
}

export default function SystemEmailSettings() {
  useSEO({ title: 'System Email Settings | Admin', description: 'Configure SMTP settings for system emails', robots: 'noindex, nofollow' });
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const smtpQuery = useQuery({
    queryKey: ['smtp-configurations'],
    queryFn: async () => asList<SmtpConfiguration>((await apiClient.get('/admin/smtp-configurations')).data),
  });
  const settingsQuery = useQuery({
    queryKey: ['system-email-settings'],
    queryFn: async () => normalise((await apiClient.get('/admin/system-email-settings')).data),
  });

  const [settings, setSettings] = useState<SystemEmailSettingsData>(EMPTY);
  useEffect(() => {
    if (settingsQuery.data) setSettings(settingsQuery.data);
  }, [settingsQuery.data]);

  const [testOpen, setTestOpen] = useState(false);
  const [testForm, setTestForm] = useState<{ email_type: TestType; test_email: string }>({ email_type: 'password_reset', test_email: '' });
  const [testError, setTestError] = useState<string>();

  const configs = smtpQuery.data ?? [];
  const byId = (id: number | null) => (id ? configs.find((c) => c.id === id) : undefined);
  const effectiveSmtp = (type: TestType) => byId(settings[`${type}_smtp_id` as SettingKey]) ?? byId(settings.default_smtp_id) ?? configs.find((c) => c.is_default) ?? configs.find((c) => c.is_active);

  const saveMutation = useMutation({
    mutationFn: async (data: SystemEmailSettingsData) => (await apiClient.post('/admin/system-email-settings', data, { timeout: 15000 })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-email-settings'] });
      addToast({ type: 'success', title: 'Settings saved', description: 'System email routing was updated.' });
    },
    onError: (error) => addToast({ type: 'error', title: 'Could not save settings', description: apiErrorMessage(error) }),
  });

  const healthMutation = useMutation({
    mutationFn: async () => (await apiClient.get('/admin/system-email-settings/health')).data as { message?: string },
    onSuccess: (data) => addToast({ type: 'success', title: 'Service is healthy', description: data?.message }),
    onError: (error) => addToast({ type: 'error', title: 'Health check failed', description: apiErrorMessage(error) }),
  });

  const testMutation = useMutation({
    mutationFn: async (payload: { email_type: TestType; smtp_id: number; test_email: string }) => (await apiClient.post('/admin/system-email-settings/test', payload)).data as { message?: string },
    onSuccess: (data) => {
      setTestOpen(false);
      addToast({ type: 'success', title: 'Test email sent', description: data?.message });
    },
    onError: (error) => setTestError(apiErrorMessage(error)),
  });

  const submitTest = (e: FormEvent) => {
    e.preventDefault();
    const email = testForm.test_email.trim();
    if (!email) return setTestError('Recipient email is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setTestError('Enter a valid email address.');
    const config = effectiveSmtp(testForm.email_type);
    if (!config) return setTestError('Assign an SMTP configuration to this email type first.');
    setTestError(undefined);
    testMutation.mutate({ email_type: testForm.email_type, smtp_id: config.id, test_email: email });
  };

  const loading = smtpQuery.isLoading || settingsQuery.isLoading;
  const error = smtpQuery.error ?? settingsQuery.error;
  const describe = (c?: SmtpConfiguration) => (c ? `${c.from_name ? `${c.from_name} ` : ''}<${c.from_address}>` : undefined);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="System Email Settings"
        description="Choose which SMTP configuration sends each type of system email."
        actions={
          <>
            <button type="button" className={btnSecondary} onClick={() => healthMutation.mutate()} disabled={healthMutation.isPending}>
              <Activity className="h-4 w-4" aria-hidden="true" />
              {healthMutation.isPending ? 'Checking…' : 'Check service'}
            </button>
            {configs.length > 0 && (
              <button
                type="button"
                className={btnSecondary}
                onClick={() => {
                  setTestError(undefined);
                  setTestOpen(true);
                }}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Send test email
              </button>
            )}
          </>
        }
      />

      {loading ? (
        <AdminCard>
          <LoadingState label="Loading email settings…" />
        </AdminCard>
      ) : error ? (
        <AdminCard>
          <ErrorState
            message={apiErrorMessage(error)}
            onRetry={() => {
              smtpQuery.refetch();
              settingsQuery.refetch();
            }}
          />
        </AdminCard>
      ) : configs.length === 0 ? (
        <AdminCard>
          <EmptyState
            icon={Mail}
            title="No SMTP configurations yet"
            description="Add an SMTP configuration before routing system emails."
            action={
              <Link to="/admin/smtp-configurations" className={btnPrimary}>
                Add SMTP configuration
              </Link>
            }
          />
        </AdminCard>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(settings);
          }}
          className="space-y-6"
        >
          <AdminCard padded={false}>
            <ul className="divide-y divide-slate-100">
              {ROWS.map(({ key, title, description, icon: Icon }) => {
                const selected = byId(settings[key]);
                const fallback = key === 'default_smtp_id' ? undefined : byId(settings.default_smtp_id);
                return (
                  <li key={key} className="grid gap-4 p-5 md:grid-cols-[1fr_minmax(0,22rem)] md:items-start">
                    <div className="flex gap-3">
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                        <p className="text-sm text-slate-500">{description}</p>
                      </div>
                    </div>
                    <Field
                      label={`${title} SMTP`}
                      hint={
                        selected
                          ? `Sends from ${describe(selected)}`
                          : key === 'default_smtp_id'
                            ? 'No default selected.'
                            : fallback
                              ? `Uses the default: ${describe(fallback)}`
                              : 'Uses the default configuration.'
                      }
                    >
                      {(props) => (
                        <select
                          {...props}
                          className={inputClass}
                          value={settings[key] ?? ''}
                          onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.value ? Number(e.target.value) : null }))}
                        >
                          <option value="">{key === 'default_smtp_id' ? 'None' : 'Use default'}</option>
                          {configs.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.from_address})
                            </option>
                          ))}
                        </select>
                      )}
                    </Field>
                  </li>
                );
              })}
            </ul>
          </AdminCard>
          <div className="flex justify-end">
            <button type="submit" className={btnPrimary} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4" aria-hidden="true" />
              {saveMutation.isPending ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </form>
      )}

      <Modal
        open={testOpen}
        onClose={() => setTestOpen(false)}
        title="Send test email"
        description="Sends a short test message through the configuration assigned to that email type."
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setTestOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="system-email-test-form" className={btnPrimary} disabled={testMutation.isPending}>
              {testMutation.isPending ? 'Sending…' : 'Send test'}
            </button>
          </>
        }
      >
        <form id="system-email-test-form" onSubmit={submitTest} noValidate className="space-y-4">
          <Field label="Email type" hint={describe(effectiveSmtp(testForm.email_type)) ? `Will send from ${describe(effectiveSmtp(testForm.email_type))}` : undefined}>
            {(props) => (
              <select {...props} className={inputClass} value={testForm.email_type} onChange={(e) => setTestForm((f) => ({ ...f, email_type: e.target.value as TestType }))}>
                {ROWS.filter((r) => r.testType).map((r) => (
                  <option key={r.key} value={r.testType}>
                    {r.title}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Recipient email" required error={testError}>
            {(props) => (
              <input {...props} type="email" className={inputClass} placeholder="you@example.com" value={testForm.test_email} onChange={(e) => setTestForm((f) => ({ ...f, test_email: e.target.value }))} />
            )}
          </Field>
        </form>
      </Modal>
    </div>
  );
}
