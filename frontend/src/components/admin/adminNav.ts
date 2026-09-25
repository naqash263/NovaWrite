import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  Bot,
  Bug,
  FileBadge,
  Files,
  FileText,
  FlaskConical,
  FolderKanban,
  FolderTree,
  Hash,
  House,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Mail,
  MailCheck,
  ScrollText,
  Send,
  Server,
  Settings,
  Tags,
  UserCheck,
  UserCog,
  Users,
  UsersRound,
  Webhook,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Extra words for the command palette search. */
  keywords?: string;
}

export interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

/** Every routed admin page, grouped for the sidebar and the command palette. */
export const adminNav: AdminNavSection[] = [
  {
    title: 'Overview',
    items: [
      { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, keywords: 'home overview stats' },
      { path: '/admin/leads', label: 'Leads', icon: Inbox, keywords: 'enquiries contact bookings consultation subscribers sales' },
      { path: '/admin/analytics', label: 'Analytics', icon: BarChart3, keywords: 'pwa installs traffic' },
      { path: '/admin/monitoring', label: 'System Monitoring', icon: Activity, keywords: 'health status queue' },
    ],
  },
  {
    title: 'Content',
    items: [
      { path: '/admin/posts', label: 'Posts', icon: FileText, keywords: 'blog articles' },
      { path: '/admin/categories', label: 'Categories', icon: FolderTree, keywords: 'blog' },
      { path: '/admin/tags', label: 'Tags', icon: Tags },
      { path: '/admin/projects', label: 'Projects', icon: FolderKanban, keywords: 'portfolio' },
      { path: '/admin/workflows', label: 'Workflows', icon: Workflow, keywords: 'n8n templates' },
      { path: '/admin/workflow-categories', label: 'Workflow Categories', icon: FolderTree },
      { path: '/admin/test-workflows', label: 'Test Workflows', icon: FlaskConical },
      { path: '/admin/files', label: 'Files', icon: Files, keywords: 'uploads media seo' },
      { path: '/admin/cv-templates', label: 'CV Templates', icon: FileBadge, keywords: 'resume' },
      { path: '/admin/home-settings', label: 'Home Settings', icon: House, keywords: 'homepage hero banner' },
    ],
  },
  {
    title: 'Community',
    items: [
      { path: '/admin/issues', label: 'Issues', icon: Bug, keywords: 'community questions' },
      { path: '/admin/issue-categories', label: 'Issue Categories', icon: Hash },
    ],
  },
  {
    title: 'Users',
    items: [
      { path: '/admin/user-management', label: 'User Management', icon: UserCog, keywords: 'roles accounts' },
      { path: '/admin/users', label: 'Users (legacy)', icon: Users },
      { path: '/admin/user-groups', label: 'User Groups', icon: UsersRound },
      { path: '/admin/user-activities', label: 'User Activities', icon: UserCheck, keywords: 'audit log' },
    ],
  },
  {
    title: 'Email & Messaging',
    items: [
      { path: '/admin/push-notifications', label: 'Push Notifications', icon: Bell },
      { path: '/admin/email-templates', label: 'Email Templates', icon: Mail },
      { path: '/admin/email-service', label: 'Email Service', icon: Send },
      { path: '/admin/system-email-settings', label: 'System Email Settings', icon: MailCheck },
      { path: '/admin/smtp-configurations', label: 'SMTP Settings', icon: Server },
      { path: '/admin/n8n-configurations', label: 'n8n Configuration', icon: Webhook, keywords: 'webhook automation' },
      { path: '/admin/email-queue', label: 'Email Queue', icon: Inbox, keywords: 'jobs' },
      { path: '/admin/email-logs', label: 'Email Logs', icon: ScrollText },
    ],
  },
  {
    title: 'Integrations & System',
    items: [
      { path: '/admin/gemini-api', label: 'Gemini API', icon: Bot, keywords: 'ai keys' },
      { path: '/admin/api-tokens', label: 'API Tokens', icon: KeyRound },
      { path: '/admin/api-documentation', label: 'API Documentation', icon: BookOpen },
      { path: '/admin/api-docs', label: 'API Docs (reference)', icon: BookMarked },
      { path: '/admin/adsense-settings', label: 'AdSense Settings', icon: BadgeDollarSign, keywords: 'ads monetization' },
      { path: '/admin/settings', label: 'Settings', icon: Settings, keywords: 'site configuration' },
    ],
  },
];

export const adminNavItems = adminNav.flatMap((section) => section.items.map((item) => ({ ...item, section: section.title })));

/** Most specific nav item for a path (so /admin/cv-templates/create maps to CV Templates). */
export function findAdminNavItem(pathname: string) {
  return (
    adminNavItems.find((item) => item.path === pathname) ??
    [...adminNavItems].sort((a, b) => b.path.length - a.path.length).find((item) => item.path !== '/admin' && pathname.startsWith(`${item.path}/`))
  );
}
