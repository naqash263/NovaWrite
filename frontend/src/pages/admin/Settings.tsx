import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { AdminCard, AdminPageHeader, ErrorState, Field, LoadingState, inputClass } from '../../components/admin/ui';
import { apiErrorMessage } from '../../components/admin/utils';

interface SiteSettings {
  site_name: string;
  site_description: string;
  site_url: string;
  admin_email: string;
  maintenance_mode: boolean;
  allow_registration: boolean;
  max_file_size: number;
  allowed_file_types: string[];
}

type Errors = Partial<Record<keyof SiteSettings, string>>;

const DEFAULTS: SiteSettings = {
  site_name: '',
  site_description: '',
  site_url: '',
  admin_email: '',
  maintenance_mode: false,
  allow_registration: true,
  max_file_size: 10,
  allowed_file_types: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'txt', 'zip', 'json'],
};

const FILE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'doc', 'docx', 'txt', 'zip', 'json'];

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

/** Merges whatever the API returns onto the defaults, ignoring unexpected value types. */
function normalise(payload: unknown): SiteSettings {
  const raw = ((payload as { data?: unknown })?.data ?? payload) as Partial<Record<keyof SiteSettings, unknown>> | null;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return DEFAULTS;
  const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d);
  const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : v === 1 || v === '1' || v === 'true' ? true : v === 0 || v === '0' || v === 'false' ? false : d);
  return {
    site_name: str(raw.site_name, DEFAULTS.site_name),
    site_description: str(raw.site_description, DEFAULTS.site_description),
    site_url: str(raw.site_url, DEFAULTS.site_url),
    admin_email: str(raw.admin_email, DEFAULTS.admin_email),
    maintenance_mode: bool(raw.maintenance_mode, DEFAULTS.maintenance_mode),
    allow_registration: bool(raw.allow_registration, DEFAULTS.allow_registration),
    max_file_size: Number(raw.max_file_size) > 0 ? Number(raw.max_file_size) : DEFAULTS.max_file_size,
    allowed_file_types: Array.isArray(raw.allowed_file_types) ? raw.allowed_file_types.filter((t): t is string => typeof t === 'string') : DEFAULTS.allowed_file_types,
  };
}

function validate(s: SiteSettings): Errors {
  const errors: Errors = {};
  if (!s.site_name.trim()) errors.site_name = 'Site name is required.';
  if (!s.site_url.trim()) errors.site_url = 'Site URL is required.';
  else if (!/^https?:\/\/\S+$/i.test(s.site_url.trim())) errors.site_url = 'Enter a full URL starting with http:// or https://.';
  if (!s.admin_email.trim()) errors.admin_email = 'Admin email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.admin_email.trim())) errors.admin_email = 'Enter a valid email address.';
  if (!Number.isFinite(s.max_file_size) || s.max_file_size < 1 || s.max_file_size > 100) errors.max_file_size = 'Choose a size between 1 and 100 MB.';
  return errors;
}

function serverErrors(error: unknown): Errors {
  const bag = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
  if (!bag) return {};
  return Object.fromEntries(Object.entries(bag).map(([k, v]) => [k.split('.')[0], v?.[0]])) as Errors;
}

function Toggle({ id, label, description, checked, onChange }: { id: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div>
        <p id={`${id}-label`} className="text-sm font-medium text-slate-900">
          {label}
        </p>
        <p id={`${id}-desc`} className="text-sm text-slate-500">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  useSEO({ title: 'Settings | Admin', robots: 'noindex, nofollow' });
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SiteSettings>(DEFAULTS);
  const [errors, setErrors] = useState<Errors>({});

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => normalise((await apiClient.get('/settings')).data),
  });

  // Populate the form once the saved settings arrive (previously the response was ignored).
  useEffect(() => {
    if (settingsQuery.data) setFormData(settingsQuery.data);
  }, [settingsQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (data: SiteSettings) => (await apiClient.put('/settings', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      addToast({ type: 'success', title: 'Settings saved', description: 'Your changes are live.' });
    },
    onError: (error) => {
      setErrors(serverErrors(error));
      addToast({ type: 'error', title: 'Could not save settings', description: apiErrorMessage(error) });
    },
  });

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate(formData);
    setErrors(next);
    if (Object.keys(next).length) return;
    updateMutation.mutate({ ...formData, site_name: formData.site_name.trim(), site_url: formData.site_url.trim(), admin_email: formData.admin_email.trim() });
  };

  const header = <AdminPageHeader title="Settings" description="General site configuration, registration and upload limits." />;

  if (settingsQuery.isLoading) {
    return (
      <div>
        {header}
        <AdminCard>
          <LoadingState label="Loading settings…" />
        </AdminCard>
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <div>
        {header}
        <AdminCard>
          <ErrorState title="Could not load settings" message={apiErrorMessage(settingsQuery.error)} onRetry={() => settingsQuery.refetch()} />
        </AdminCard>
      </div>
    );
  }

  return (
    <div>
      {header}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <AdminCard title="General">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Site name" required error={errors.site_name}>
              {(props) => <input {...props} className={inputClass} value={formData.site_name} onChange={(e) => set('site_name', e.target.value)} />}
            </Field>
            <Field label="Site URL" required error={errors.site_url}>
              {(props) => <input {...props} type="url" className={inputClass} placeholder="https://example.com" value={formData.site_url} onChange={(e) => set('site_url', e.target.value)} />}
            </Field>
            <div className="md:col-span-2">
              <Field label="Site description" hint="Used as the default meta description.">
                {(props) => <textarea {...props} rows={3} className={inputClass} value={formData.site_description} onChange={(e) => set('site_description', e.target.value)} />}
              </Field>
            </div>
            <Field label="Admin email" required error={errors.admin_email}>
              {(props) => <input {...props} type="email" className={inputClass} value={formData.admin_email} onChange={(e) => set('admin_email', e.target.value)} />}
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="System">
          <div className="divide-y divide-slate-100">
            <Toggle id="maintenance" label="Maintenance mode" description="Show a maintenance page to visitors." checked={formData.maintenance_mode} onChange={(v) => set('maintenance_mode', v)} />
            <Toggle id="registration" label="Allow registration" description="Let new users create accounts." checked={formData.allow_registration} onChange={(v) => set('allow_registration', v)} />
          </div>
        </AdminCard>

        <AdminCard title="File uploads">
          <div className="space-y-5">
            <div className="max-w-xs">
              <Field label="Maximum file size (MB)" error={errors.max_file_size}>
                {(props) => (
                  <input {...props} type="number" min={1} max={100} className={inputClass} value={Number.isFinite(formData.max_file_size) ? formData.max_file_size : ''} onChange={(e) => set('max_file_size', parseInt(e.target.value, 10))} />
                )}
              </Field>
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">Allowed file types</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {FILE_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      checked={formData.allowed_file_types.includes(type)}
                      onChange={(e) =>
                        set('allowed_file_types', e.target.checked ? [...formData.allowed_file_types, type] : formData.allowed_file_types.filter((t) => t !== type))
                      }
                    />
                    {type.toUpperCase()}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </AdminCard>

        <div className="flex justify-end">
          <button type="submit" className={btnPrimary} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {updateMutation.isPending ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
