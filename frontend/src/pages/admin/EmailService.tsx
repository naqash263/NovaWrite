import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import { Eye, Mail, Plus, Send, X } from 'lucide-react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { AdminCard, AdminPageHeader, EmptyState, ErrorState, Field, IconButton, LoadingState, inputClass } from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

interface EmailTemplate {
  id: number;
  name: string;
  subject?: string;
  category?: string;
  is_active?: boolean;
}
interface User {
  id: number;
  name: string;
  email: string;
}
interface Titled {
  id: number;
  title: string;
}
interface SmtpConfiguration {
  id: number;
  name: string;
  from_address: string;
  from_name?: string;
  is_active?: boolean;
}
interface PreviewData {
  preview?: { subject?: string; body?: string; type?: string };
  variables?: Record<string, unknown> | string[];
}
interface ServiceData {
  templates: EmailTemplate[];
  users: User[];
  courses: Titled[];
  workflows: Titled[];
  posts: Titled[];
  smtp: SmtpConfiguration[];
  failed: string[];
}
type Option = { value: number; label: string };
type Errors = Partial<Record<'template' | 'user' | 'varName', string>>;

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60';

// react-select styled to match the admin inputs.
const selectStyles = {
  control: (base: object, state: { isFocused: boolean }) => ({
    ...base,
    minHeight: 38,
    borderRadius: 8,
    borderColor: state.isFocused ? '#2563eb' : '#cbd5e1',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(37,99,235,0.2)' : 'none',
    fontSize: 14,
  }),
  menu: (base: object) => ({ ...base, zIndex: 30, fontSize: 14 }),
  placeholder: (base: object) => ({ ...base, color: '#94a3b8' }),
};

async function loadServiceData(): Promise<ServiceData> {
  const [templatesRes, dataRes, smtpRes] = await Promise.allSettled([
    apiClient.get('/admin/email-templates', { params: { per_page: 100 } }),
    apiClient.get('/email-service/available-data'),
    apiClient.get('/admin/smtp-configurations'),
  ]);
  if (templatesRes.status === 'rejected' && dataRes.status === 'rejected' && smtpRes.status === 'rejected') throw templatesRes.reason;
  const failed: string[] = [];
  if (templatesRes.status === 'rejected') failed.push('templates');
  if (dataRes.status === 'rejected') failed.push('users and content');
  if (smtpRes.status === 'rejected') failed.push('SMTP configurations');
  const available = (dataRes.status === 'fulfilled' ? dataRes.value.data?.data : null) ?? {};
  const list = <T,>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);
  return {
    templates: templatesRes.status === 'fulfilled' ? asList<EmailTemplate>(templatesRes.value.data) : [],
    users: list<User>(available.users),
    courses: list<Titled>(available.courses),
    workflows: list<Titled>(available.workflows),
    posts: list<Titled>(available.posts),
    smtp: smtpRes.status === 'fulfilled' ? asList<SmtpConfiguration>(smtpRes.value.data) : [],
    failed,
  };
}

function EmailBodyPreview({ body, type }: { body: string; type?: string }) {
  if (type === 'markdown') return <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">{body}</pre>;
  return <iframe title="Rendered email body" sandbox="" srcDoc={body} className="h-[28rem] w-full rounded-lg border border-slate-200 bg-white" />;
}

export default function EmailService() {
  useSEO({ title: 'Email Service | Admin', description: 'Send emails using templates with real system data', robots: 'noindex, nofollow' });
  const { addToast } = useToast();

  const dataQuery = useQuery({ queryKey: ['email-service-data'], queryFn: loadServiceData });
  const data = dataQuery.data;

  const [templateId, setTemplateId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [smtpId, setSmtpId] = useState<number | null | undefined>(undefined); // undefined = follow the active configuration
  const [courseId, setCourseId] = useState<number | null>(null);
  const [workflowId, setWorkflowId] = useState<number | null>(null);
  const [postId, setPostId] = useState<number | null>(null);
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [newVar, setNewVar] = useState({ name: '', value: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [lastSent, setLastSent] = useState<string | null>(null);

  const templates = data?.templates ?? [];
  const users = data?.users ?? [];
  const smtp = data?.smtp ?? [];
  const template = templates.find((t) => t.id === templateId) ?? null;
  const user = users.find((u) => u.id === userId) ?? null;
  const activeSmtp = smtp.find((c) => c.is_active) ?? null;
  const selectedSmtp = smtpId === undefined ? activeSmtp : (smtp.find((c) => c.id === smtpId) ?? null);

  const basePayload = () => ({
    template_name: template?.name,
    user_id: user?.id,
    course_id: courseId,
    workflow_id: workflowId,
    post_id: postId,
    custom_variables: customVariables,
  });

  const validateSelection = () => {
    const next: Errors = {};
    if (!template) next.template = 'Choose a template.';
    if (!user) next.user = 'Choose a recipient.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const previewMutation = useMutation({
    mutationFn: async () => (await apiClient.post('/email-service/preview-real-data', basePayload())).data as PreviewData & { success?: boolean; message?: string },
    onSuccess: (res) => {
      if (res?.success === false) {
        addToast({ type: 'error', title: 'Preview failed', description: res.message || 'Failed to generate preview' });
        return;
      }
      setPreviewData(res);
    },
    onError: (error) => addToast({ type: 'error', title: 'Preview failed', description: apiErrorMessage(error) }),
  });

  const sendMutation = useMutation({
    mutationFn: async () => (await apiClient.post('/email-service/send-real-data', { ...basePayload(), smtp_config_id: selectedSmtp?.id ?? null })).data as { success?: boolean; message?: string },
    onSuccess: (res) => {
      if (res?.success === false) {
        addToast({ type: 'error', title: 'Email not sent', description: res.message || 'Failed to send email' });
        return;
      }
      setLastSent(`Sent "${template?.name}" to ${user?.email}`);
      addToast({ type: 'success', title: 'Email sent', description: `Delivered to ${user?.email}.` });
    },
    onError: (error) => addToast({ type: 'error', title: 'Email not sent', description: apiErrorMessage(error) }),
  });

  const addVariable = () => {
    const name = newVar.name.trim().replace(/^\{\{|\}\}$/g, '');
    if (!name) return setErrors((e) => ({ ...e, varName: 'Enter a variable name.' }));
    if (!/^[A-Za-z0-9_.]+$/.test(name)) return setErrors((e) => ({ ...e, varName: 'Use letters, numbers, dots or underscores.' }));
    setCustomVariables((prev) => ({ ...prev, [name]: newVar.value }));
    setNewVar({ name: '', value: '' });
    setErrors((e) => ({ ...e, varName: undefined }));
  };

  const optionalSelect = (label: string, items: Titled[], value: number | null, onChange: (v: number | null) => void) => (
    <Field label={label}>
      {(props) => (
        <select {...props} className={inputClass} value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} disabled={items.length === 0}>
          <option value="">{items.length ? 'None' : 'None available'}</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.title}
            </option>
          ))}
        </select>
      )}
    </Field>
  );

  const header = <AdminPageHeader title="Email Service" description="Send a template email to a real user, filled in with live course, workflow or post data." />;

  if (dataQuery.isLoading)
    return (
      <div>
        {header}
        <AdminCard>
          <LoadingState label="Loading templates and recipients…" />
        </AdminCard>
      </div>
    );
  if (dataQuery.isError || !data)
    return (
      <div>
        {header}
        <AdminCard>
          <ErrorState message={apiErrorMessage(dataQuery.error)} onRetry={() => dataQuery.refetch()} />
        </AdminCard>
      </div>
    );

  const toOption = (id: number, label: string): Option => ({ value: id, label });
  const variableNames = previewData?.variables ? (Array.isArray(previewData.variables) ? previewData.variables : Object.keys(previewData.variables)) : [];

  return (
    <div className="space-y-6">
      {header}

      {data.failed.length > 0 && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Some data could not be loaded ({data.failed.join(', ')}). You can still use what is available.
        </div>
      )}

      {templates.length === 0 && !data.failed.includes('templates') ? (
        <AdminCard>
          <EmptyState
            icon={Mail}
            title="No email templates yet"
            description="Create a template first, then come back to send it."
            action={
              <Link to="/admin/email-templates" className={btnPrimary}>
                Go to email templates
              </Link>
            }
          />
        </AdminCard>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <AdminCard title="Compose">
            <div className="space-y-4">
              <Field label="Template" required error={errors.template}>
                {({ id, ...aria }) => (
                  <Select<Option>
                    inputId={id}
                    aria-describedby={aria['aria-describedby']}
                    aria-invalid={aria['aria-invalid']}
                    styles={selectStyles}
                    value={template ? toOption(template.id, `${template.name}${template.category ? ` (${template.category})` : ''}`) : null}
                    onChange={(o) => {
                      setTemplateId(o?.value ?? null);
                      setErrors((e) => ({ ...e, template: undefined }));
                    }}
                    options={templates.map((t) => toOption(t.id, `${t.name}${t.category ? ` (${t.category})` : ''}`))}
                    placeholder="Choose a template…"
                    isClearable
                  />
                )}
              </Field>
              <Field label="Recipient" required error={errors.user}>
                {({ id, ...aria }) => (
                  <Select<Option>
                    inputId={id}
                    aria-describedby={aria['aria-describedby']}
                    aria-invalid={aria['aria-invalid']}
                    styles={selectStyles}
                    value={user ? toOption(user.id, `${user.name} (${user.email})`) : null}
                    onChange={(o) => {
                      setUserId(o?.value ?? null);
                      setErrors((e) => ({ ...e, user: undefined }));
                    }}
                    options={users.map((u) => toOption(u.id, `${u.name} (${u.email})`))}
                    placeholder={users.length ? 'Search users…' : 'No users available'}
                    noOptionsMessage={() => 'No matching users'}
                    isClearable
                  />
                )}
              </Field>
              <Field label="SMTP configuration" hint={selectedSmtp ? `Sends from ${selectedSmtp.from_name ?? selectedSmtp.name} <${selectedSmtp.from_address}>` : 'Uses the active SMTP configuration.'}>
                {({ id, ...aria }) => (
                  <Select<Option>
                    inputId={id}
                    aria-describedby={aria['aria-describedby']}
                    styles={selectStyles}
                    value={selectedSmtp ? toOption(selectedSmtp.id, `${selectedSmtp.name} (${selectedSmtp.from_address})`) : null}
                    onChange={(o) => setSmtpId(o?.value ?? null)}
                    options={smtp.map((c) => toOption(c.id, `${c.name} (${c.from_address})`))}
                    placeholder="Use active SMTP configuration"
                    isClearable
                  />
                )}
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                {optionalSelect('Course', data.courses, courseId, setCourseId)}
                {optionalSelect('Workflow', data.workflows, workflowId, setWorkflowId)}
                {optionalSelect('Blog post', data.posts, postId, setPostId)}
              </div>

              <fieldset className="rounded-lg border border-slate-200 p-4">
                <legend className="px-1 text-sm font-medium text-slate-700">Custom variables</legend>
                {Object.keys(customVariables).length > 0 && (
                  <ul className="mb-3 space-y-2">
                    {Object.entries(customVariables).map(([key, value]) => (
                      <li key={key} className="flex items-center gap-2">
                        <label htmlFor={`var-${key}`} className="w-32 flex-none truncate font-mono text-xs text-slate-600">{`{{${key}}}`}</label>
                        <input
                          id={`var-${key}`}
                          className={inputClass}
                          value={value}
                          onChange={(e) => setCustomVariables((prev) => ({ ...prev, [key]: e.target.value }))}
                        />
                        <IconButton
                          label={`Remove ${key}`}
                          icon={X}
                          tone="danger"
                          onClick={() =>
                            setCustomVariables((prev) => {
                              const next = { ...prev };
                              delete next[key];
                              return next;
                            })
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
                  <Field label="Variable name" error={errors.varName}>
                    {(props) => <input {...props} className={`${inputClass} font-mono`} placeholder="order_number" value={newVar.name} onChange={(e) => setNewVar((v) => ({ ...v, name: e.target.value }))} />}
                  </Field>
                  <Field label="Value">
                    {(props) => (
                      <input
                        {...props}
                        className={inputClass}
                        placeholder="ORD-12345"
                        value={newVar.value}
                        onChange={(e) => setNewVar((v) => ({ ...v, value: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addVariable();
                          }
                        }}
                      />
                    )}
                  </Field>
                  <button type="button" className={`${btnSecondary} sm:mt-6`} onClick={addVariable}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add
                  </button>
                </div>
              </fieldset>

              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnSecondary} disabled={previewMutation.isPending} onClick={() => validateSelection() && previewMutation.mutate()}>
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  {previewMutation.isPending ? 'Rendering…' : 'Preview'}
                </button>
                <button type="button" className={btnPrimary} disabled={sendMutation.isPending} onClick={() => validateSelection() && sendMutation.mutate()}>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {sendMutation.isPending ? 'Sending…' : 'Send email'}
                </button>
              </div>
              {lastSent && (
                <p role="status" className="text-sm text-emerald-700">
                  {lastSent}
                </p>
              )}
            </div>
          </AdminCard>

          <AdminCard title="Preview">
            {previewData?.preview ? (
              <div className="space-y-4" data-testid="email-preview">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subject</p>
                  <p className="mt-1 text-sm text-slate-900">{previewData.preview.subject}</p>
                </div>
                <EmailBodyPreview body={previewData.preview.body ?? ''} type={previewData.preview.type} />
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Variables available</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variableNames.length ? (
                      variableNames.map((v) => <code key={v} className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-800">{`{{${v}}}`}</code>)
                    ) : (
                      <span className="text-sm text-slate-500">No variables detected</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState icon={Eye} title="No preview yet" description="Choose a template and a recipient, then select Preview to see the rendered email." />
            )}
          </AdminCard>
        </div>
      )}
    </div>
  );
}
