import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Megaphone, RotateCcw, Save } from 'lucide-react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import { AdminCard, AdminPageHeader, Badge, EmptyState, ErrorState, Field, LoadingState, inputClass } from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

interface AdSenseSetting {
  id: number;
  key: string;
  value: string | null;
  title: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60';

const PUBLISHER_ID = /^ca-pub-\d{6,}$/;

function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-50 ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export default function AdSenseSettings() {
  useSEO({ title: 'AdSense Settings | Admin', robots: 'noindex, nofollow' });
  const { addToast } = useToast();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['adsense-settings'],
    queryFn: async () => asList<AdSenseSetting>((await apiClient.get('/admin/adsense-settings')).data),
  });

  const [localSettings, setLocalSettings] = useState<AdSenseSetting[]>([]);
  const [publisherError, setPublisherError] = useState<string>();

  useEffect(() => {
    if (settingsQuery.data) setLocalSettings(settingsQuery.data);
  }, [settingsQuery.data]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['adsense-settings'] });
    queryClient.invalidateQueries({ queryKey: ['adsense-settings-active'] });
  };

  const saveMutation = useMutation({
    mutationFn: async (settingsToSave: AdSenseSetting[]) => (await apiClient.post('/admin/adsense-settings', { settings: settingsToSave })).data,
    onSuccess: () => {
      invalidate();
      addToast({ type: 'success', title: 'Settings saved', description: 'AdSense settings saved successfully.' });
    },
    onError: (error) => addToast({ type: 'error', title: 'Could not save settings', description: apiErrorMessage(error) }),
  });

  const resetMutation = useMutation({
    mutationFn: async () => (await apiClient.post('/admin/adsense-settings/reset')).data,
    onSuccess: () => {
      invalidate();
      addToast({ type: 'success', title: 'Settings reset', description: 'AdSense settings were reset to defaults.' });
    },
    onError: (error) => addToast({ type: 'error', title: 'Could not reset settings', description: apiErrorMessage(error) }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (setting: AdSenseSetting) => (await apiClient.post(`/admin/adsense-settings/${setting.id}/toggle-active`)).data,
    onSuccess: (_data, setting) => {
      // Only flip the toggled slot locally so unsaved edits in other fields are kept.
      setLocalSettings((prev) => prev.map((s) => (s.id === setting.id ? { ...s, is_active: !setting.is_active } : s)));
      queryClient.invalidateQueries({ queryKey: ['adsense-settings-active'] });
      addToast({ type: 'success', title: `${setting.title || setting.key} ${setting.is_active ? 'disabled' : 'enabled'}` });
    },
    onError: (error) => addToast({ type: 'error', title: 'Could not update slot', description: apiErrorMessage(error) }),
  });

  const handleChange = (key: string, value: string) => {
    setLocalSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
    if (key === 'client_id' || key === 'enabled') setPublisherError(undefined);
  };

  const enabledSetting = localSettings.find((s) => s.key === 'enabled');
  const isEnabled = enabledSetting?.value === 'true';
  const clientId = localSettings.find((s) => s.key === 'client_id');
  const slots = useMemo(
    () => localSettings.filter((s) => s.key.startsWith('slot_')).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [localSettings],
  );

  const handleSave = () => {
    const publisher = (clientId?.value ?? '').trim();
    if (isEnabled && !publisher) {
      setPublisherError('Publisher ID is required to enable AdSense.');
      return;
    }
    if (publisher && !PUBLISHER_ID.test(publisher)) {
      setPublisherError('Publisher ID must look like ca-pub-1234567890123456.');
      return;
    }
    // Settings with values are marked active (except the master switch, which is controlled separately).
    const settingsToSave = localSettings.map((setting) => ({
      ...setting,
      value: setting.key === 'client_id' ? publisher : (setting.value ?? ''),
      is_active: setting.key === 'enabled' ? setting.is_active : setting.value && setting.value.trim() !== '' ? true : setting.is_active,
    }));
    saveMutation.mutate(settingsToSave);
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Reset AdSense settings',
      message: 'Reset all AdSense settings to their defaults? The publisher ID and every ad slot ID will be cleared.',
      confirmText: 'Reset settings',
      type: 'danger',
    });
    if (ok) resetMutation.mutate();
  };

  const busy = saveMutation.isPending || resetMutation.isPending;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="AdSense Settings"
        description="Configure Google AdSense: publisher ID, ad slots and the site-wide switch."
        actions={
          localSettings.length > 0 && (
            <>
              <button type="button" className={btnSecondary} onClick={handleReset} disabled={busy}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {resetMutation.isPending ? 'Resetting…' : 'Reset to defaults'}
              </button>
              <button type="button" className={btnPrimary} onClick={handleSave} disabled={busy}>
                <Save className="h-4 w-4" aria-hidden="true" />
                {saveMutation.isPending ? 'Saving…' : 'Save settings'}
              </button>
            </>
          )
        }
      />

      {settingsQuery.isLoading ? (
        <AdminCard>
          <LoadingState label="Loading AdSense settings…" />
        </AdminCard>
      ) : settingsQuery.isError ? (
        <AdminCard>
          <ErrorState title="Could not load AdSense settings" message={apiErrorMessage(settingsQuery.error)} onRetry={() => settingsQuery.refetch()} />
        </AdminCard>
      ) : localSettings.length === 0 ? (
        <AdminCard>
          <EmptyState
            icon={Megaphone}
            title="AdSense is not set up yet"
            description="Create the default publisher ID and ad slot settings to get started."
            action={
              <button type="button" className={btnPrimary} onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>
                {resetMutation.isPending ? 'Creating…' : 'Create default settings'}
              </button>
            }
          />
        </AdminCard>
      ) : (
        <>
          <AdminCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p id="adsense-enabled-label" className="font-semibold text-slate-900">
                  Enable AdSense
                </p>
                <p className="text-sm text-slate-500">Master switch for every ad on the site. Takes effect when you save.</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={isEnabled ? 'success' : 'neutral'}>{isEnabled ? 'On' : 'Off'}</Badge>
                <Switch label="Enable AdSense" checked={isEnabled} onChange={() => handleChange('enabled', isEnabled ? 'false' : 'true')} />
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Publisher" description="Find it in your AdSense account under Account → Settings.">
            <div className="max-w-md">
              <Field label="Publisher ID" required={isEnabled} error={publisherError} hint="Format: ca-pub-XXXXXXXXXXXXXXXX. Also used to generate /ads.txt.">
                {(props) => (
                  <input
                    {...props}
                    className={`${inputClass} font-mono`}
                    placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                    value={clientId?.value ?? ''}
                    onChange={(e) => handleChange('client_id', e.target.value)}
                    disabled={!clientId}
                  />
                )}
              </Field>
            </div>
          </AdminCard>

          <AdminCard title="Ad unit slots" description="Enter slot IDs from your AdSense dashboard. Leave a slot empty to show no ad in that position.">
            {slots.length === 0 ? (
              <p className="text-sm text-slate-500">No ad slots are configured. Reset to defaults to create them.</p>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {slots.map((setting) => (
                  <div key={setting.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <Badge tone={setting.is_active ? 'success' : 'neutral'}>{setting.is_active ? 'Active' : 'Inactive'}</Badge>
                      <Switch
                        label={`${setting.title || setting.key} active`}
                        checked={!!setting.is_active}
                        disabled={toggleActiveMutation.isPending && toggleActiveMutation.variables?.id === setting.id}
                        onChange={() => toggleActiveMutation.mutate(setting)}
                      />
                    </div>
                    <Field label={setting.title || setting.key} hint={setting.description || undefined}>
                      {(props) => (
                        <input
                          {...props}
                          className={`${inputClass} font-mono`}
                          inputMode="numeric"
                          placeholder="e.g. 1234567890"
                          value={setting.value ?? ''}
                          onChange={(e) => handleChange(setting.key, e.target.value)}
                        />
                      )}
                    </Field>
                  </div>
                ))}
              </div>
            )}
          </AdminCard>
        </>
      )}

      <AdminCard title="Setup checklist">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600">
          <li>
            Sign up for Google AdSense at{' '}
            <a href="https://www.google.com/adsense" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-blue-700 underline">
              google.com/adsense
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            .
          </li>
          <li>
            The <code className="rounded bg-slate-100 px-1 text-xs">google-adsense-account</code> meta tag updates automatically when you save a publisher ID.
          </li>
          <li>Submit your site for approval (usually 24–48 hours).</li>
          <li>Create an ad unit in AdSense for each position you want and paste its slot ID above.</li>
          <li>
            <strong>ads.txt</strong> is generated from these settings and served at <code className="rounded bg-slate-100 px-1 text-xs">/ads.txt</code>; no upload needed.
          </li>
          <li>Turn on "Enable AdSense" and save to start showing ads.</li>
        </ol>
      </AdminCard>
    </div>
  );
}
