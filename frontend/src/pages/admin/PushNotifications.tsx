import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, RefreshCw, Send, Users, UserCheck } from 'lucide-react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { AdminCard, AdminPageHeader, ErrorState, Field, LoadingState, StatCard, inputClass } from '../../components/admin/ui';
import { apiErrorMessage } from '../../components/admin/utils';

interface NotificationStats {
  total_subscribers?: number;
  active_subscribers?: number;
  notification_types?: Partial<Record<'blogPosts' | 'issues' | 'workflows' | 'careerTools', number>>;
}

type NotificationType = 'all' | 'blogPosts' | 'issues' | 'workflows' | 'careerTools';

interface NotificationForm {
  title: string;
  body: string;
  url: string;
  type: NotificationType;
  imageUrl: string;
}

type Errors = Partial<Record<keyof NotificationForm, string>>;

const EMPTY_FORM: NotificationForm = { title: '', body: '', url: '', type: 'all', imageUrl: '' };

const TYPES: { value: NotificationType; label: string }[] = [
  { value: 'all', label: 'All subscribers' },
  { value: 'blogPosts', label: 'Blog posts subscribers' },
  { value: 'issues', label: 'Issues subscribers' },
  { value: 'workflows', label: 'Workflows subscribers' },
  { value: 'careerTools', label: 'Career tools subscribers' },
];

const CATEGORY_LABELS: Record<string, string> = { blogPosts: 'Blog posts', issues: 'Issues', workflows: 'Workflows', careerTools: 'Career tools' };

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60';

const isUrl = (v: string) => /^https?:\/\/\S+$/i.test(v);
const fmt = (n: unknown) => (typeof n === 'number' ? n.toLocaleString() : '0');

function validate(form: NotificationForm): Errors {
  const errors: Errors = {};
  if (!form.title.trim()) errors.title = 'Title is required.';
  else if (form.title.length > 255) errors.title = 'Keep the title under 255 characters.';
  if (!form.body.trim()) errors.body = 'Message is required.';
  else if (form.body.length > 1000) errors.body = 'Keep the message under 1000 characters.';
  if (form.url && !isUrl(form.url)) errors.url = 'Enter a full URL starting with http:// or https://.';
  if (form.imageUrl && !isUrl(form.imageUrl)) errors.imageUrl = 'Enter a full URL starting with http:// or https://.';
  return errors;
}

function serverErrors(error: unknown): Errors {
  const bag = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
  return bag ? (Object.fromEntries(Object.entries(bag).map(([k, v]) => [k, v?.[0]])) as Errors) : {};
}

export default function PushNotifications() {
  useSEO({ title: 'Push Notifications | Admin', description: 'Send push notifications to subscribers', url: '/admin/push-notifications', robots: 'noindex, nofollow' });
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NotificationForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});

  const statsQuery = useQuery({
    queryKey: ['push-notification-stats'],
    queryFn: async () => {
      const data = (await apiClient.get('/admin/push-notifications/stats')).data;
      return (data && typeof data === 'object' && !Array.isArray(data) ? data : {}) as NotificationStats;
    },
  });
  const stats = statsQuery.data;

  const sendMutation = useMutation({
    mutationFn: async (payload: NotificationForm) => (await apiClient.post('/admin/push-notifications/send', payload)).data,
    onSuccess: () => {
      addToast({ type: 'success', title: 'Notification sent', description: 'Your push notification is on its way to subscribers.' });
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ['push-notification-stats'] });
    },
    onError: (error) => {
      setErrors(serverErrors(error));
      addToast({ type: 'error', title: 'Send failed', description: apiErrorMessage(error) });
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => (await apiClient.post('/admin/push-notifications/test')).data as { message?: string },
    onSuccess: (data) => {
      // The API answers 200 even when the current admin has no subscription.
      if (data?.message && /no active subscription/i.test(data.message)) {
        addToast({ type: 'warning', title: 'No subscription on this account', description: 'Enable notifications in this browser first, then send the test again.' });
      } else {
        addToast({ type: 'success', title: 'Test sent', description: 'A test notification was sent to your devices.' });
      }
    },
    onError: (error) => addToast({ type: 'error', title: 'Test failed', description: apiErrorMessage(error) }),
  });

  const set = <K extends keyof NotificationForm>(key: K, value: NotificationForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length) return;
    sendMutation.mutate({ ...form, title: form.title.trim(), body: form.body.trim() });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Push Notifications"
        description="Send web push notifications to subscribers and monitor your audience."
        actions={
          <>
            <button type="button" className={btnSecondary} onClick={() => statsQuery.refetch()} disabled={statsQuery.isFetching}>
              <RefreshCw className={`h-4 w-4 ${statsQuery.isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </button>
            <button type="button" className={btnSecondary} onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
              <BellRing className="h-4 w-4" aria-hidden="true" />
              {testMutation.isPending ? 'Sending…' : 'Send test to me'}
            </button>
          </>
        }
      />

      {statsQuery.isLoading ? (
        <AdminCard>
          <LoadingState label="Loading statistics…" />
        </AdminCard>
      ) : statsQuery.isError ? (
        <AdminCard>
          <ErrorState title="Could not load statistics" message={apiErrorMessage(statsQuery.error)} onRetry={() => statsQuery.refetch()} />
        </AdminCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2" data-testid="push-stats">
          <StatCard label="Total subscribers" icon={Users} value={fmt(stats?.total_subscribers)} />
          <StatCard
            label="Active subscribers"
            icon={UserCheck}
            value={fmt(stats?.active_subscribers)}
            hint={
              stats?.notification_types
                ? Object.entries(CATEGORY_LABELS)
                    .map(([key, label]) => `${label}: ${fmt((stats.notification_types as Record<string, number | undefined>)[key])}`)
                    .join(' · ')
                : 'No subscribers yet'
            }
          />
        </div>
      )}

      <AdminCard title="Send notification" description="Delivered immediately to every matching active subscriber.">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Field label="Title" required error={errors.title}>
            {(props) => <input {...props} className={inputClass} maxLength={255} placeholder="New article: Automating SEO checks" value={form.title} onChange={(e) => set('title', e.target.value)} />}
          </Field>
          <Field label="Message" required error={errors.body} hint={`${form.body.length}/1000 characters`}>
            {(props) => <textarea {...props} rows={3} maxLength={1000} className={inputClass} placeholder="A short summary subscribers will see" value={form.body} onChange={(e) => set('body', e.target.value)} />}
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Audience">
              {(props) => (
                <select {...props} className={inputClass} value={form.type} onChange={(e) => set('type', e.target.value as NotificationType)}>
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Link URL" error={errors.url} hint="Optional page opened when the notification is clicked.">
              {(props) => <input {...props} type="url" className={inputClass} placeholder="https://example.com/blog/post" value={form.url} onChange={(e) => set('url', e.target.value)} />}
            </Field>
          </div>
          <Field label="Icon image URL" error={errors.imageUrl} hint="Optional. Square images of 192×192 px work best.">
            {(props) => <input {...props} type="url" className={inputClass} placeholder="https://example.com/icon.png" value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} />}
          </Field>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                setForm(EMPTY_FORM);
                setErrors({});
              }}
            >
              Clear
            </button>
            <button type="submit" className={btnPrimary} disabled={sendMutation.isPending}>
              <Send className="h-4 w-4" aria-hidden="true" />
              {sendMutation.isPending ? 'Sending…' : 'Send notification'}
            </button>
          </div>
        </form>
      </AdminCard>
    </div>
  );
}
