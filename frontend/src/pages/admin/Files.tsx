import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Copy,
  ExternalLink,
  File as FileIcon,
  FileCode2,
  FileText,
  Files as FilesIcon,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  List,
  Trash2,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { API_CONFIG } from '../../config/api';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import { AdminCard, AdminPageHeader, Badge, EmptyState, ErrorState, Field, IconButton, LoadingState, Modal, SearchInput, TableShell, inputClass } from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

interface StoredFile {
  id: number;
  name?: string;
  original_name?: string;
  path: string;
  mime_type?: string | null;
  size?: number;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
  /** Links are kept in this browser session only (there is no links API). */
  isLocalLink?: boolean;
}

type Category = 'image' | 'document' | 'archive' | 'other';

const FILE_CATEGORIES: { type: Category; label: string; icon: LucideIcon; tone: 'info' | 'success' | 'warning' | 'neutral' }[] = [
  { type: 'image', label: 'Images', icon: ImageIcon, tone: 'info' },
  { type: 'document', label: 'Documents', icon: FileText, tone: 'success' },
  { type: 'archive', label: 'Archives', icon: Archive, tone: 'warning' },
  { type: 'other', label: 'Other', icon: FileIcon, tone: 'neutral' },
];

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/zip',
  'application/json',
];

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60';

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getFileCategory = (mimeType?: string | null): Category => {
  const mime = mimeType ?? '';
  if (mime.startsWith('image/')) return 'image';
  if (mime.includes('pdf') || mime.includes('document') || mime.includes('text') || mime.includes('msword')) return 'document';
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('archive')) return 'archive';
  return 'other';
};

const getFileIcon = (mimeType?: string | null): LucideIcon => {
  const mime = mimeType ?? '';
  if (mime === 'application/link') return Link2;
  if (mime.startsWith('image/')) return ImageIcon;
  if (mime.includes('json')) return FileCode2;
  if (mime.includes('zip') || mime.includes('rar')) return Archive;
  if (mime.includes('pdf') || mime.includes('word') || mime.includes('document') || mime.includes('text')) return FileText;
  return FileIcon;
};

const displayName = (file: StoredFile) => file.original_name || file.name || `File #${file.id}`;
const fileUrl = (file: StoredFile) => (file.isLocalLink ? file.path : API_CONFIG.getStorageUrl(file.path ?? ''));

export default function Files() {
  useSEO({ title: 'Manage Files | Admin', robots: 'noindex, nofollow' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const [selectedCategory, setSelectedCategory] = useState<'all' | Category>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState({ title: '', url: '' });
  const [linkErrors, setLinkErrors] = useState<{ title?: string; url?: string }>({});
  const [localLinks, setLocalLinks] = useState<StoredFile[]>([]);

  const { data: serverFiles = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-files'],
    queryFn: async () => asList<StoredFile>((await apiClient.get('/files')).data),
  });

  const files = useMemo(() => [...localLinks, ...serverFiles], [localLinks, serverFiles]);

  const filteredFiles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return files.filter((file) => {
      const matchesCategory = selectedCategory === 'all' || getFileCategory(file.mime_type) === selectedCategory;
      return matchesCategory && displayName(file).toLowerCase().includes(term);
    });
  }, [files, searchTerm, selectedCategory]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append('file', file);
      body.append('is_public', '1');
      return (await apiClient.post('/files', body, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    onSuccess: (data) => {
      addToast({ type: 'success', title: 'File uploaded', description: data?.message });
      closeUpload();
      queryClient.invalidateQueries({ queryKey: ['admin-files'] });
    },
    onError: (err) => {
      const message = apiErrorMessage(err, 'Error uploading file. Please try again.');
      setUploadError(message);
      addToast({ type: 'error', title: 'Upload failed', description: message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/files/${id}`),
    onSuccess: () => {
      addToast({ type: 'success', title: 'File deleted' });
      queryClient.invalidateQueries({ queryKey: ['admin-files'] });
    },
    onError: (err) => addToast({ type: 'error', title: 'Could not delete file', description: apiErrorMessage(err) }),
  });

  function closeUpload() {
    setUploadOpen(false);
    setSelectedFile(null);
    setUploadError('');
  }

  const validateFile = (file: File | null): string => {
    if (!file) return 'Choose a file to upload.';
    if (file.size > MAX_SIZE) return 'File size must not exceed 10MB.';
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG, PNG, GIF, WebP, AVIF, SVG, PDF, DOC, DOCX, TXT, ZIP, and JSON files are allowed.';
    return '';
  };

  const handleUploadSubmit = (e: FormEvent) => {
    e.preventDefault();
    const message = validateFile(selectedFile);
    setUploadError(message);
    if (message || !selectedFile) return;
    uploadMutation.mutate(selectedFile);
  };

  const handleLinkSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof linkErrors = {};
    if (!link.title.trim()) next.title = 'Link title is required.';
    if (!link.url.trim()) next.url = 'URL is required.';
    else {
      try {
        new URL(link.url);
      } catch {
        next.url = 'Enter a full URL, e.g. https://example.com';
      }
    }
    setLinkErrors(next);
    if (Object.keys(next).length) return;
    const now = new Date().toISOString();
    setLocalLinks((prev) => [
      { id: -Date.now(), name: link.title.trim(), original_name: link.title.trim(), path: link.url.trim(), mime_type: 'application/link', size: 0, is_public: true, created_at: now, updated_at: now, isLocalLink: true },
      ...prev,
    ]);
    addToast({ type: 'success', title: 'Link added', description: 'Links are kept for this session only.' });
    setLinkOpen(false);
    setLink({ title: '', url: '' });
  };

  const handleDelete = async (file: StoredFile) => {
    if (file.isLocalLink) {
      setLocalLinks((prev) => prev.filter((l) => l.id !== file.id));
      return;
    }
    const ok = await confirm({
      title: 'Delete file',
      message: `Delete "${displayName(file)}"? Pages that link to it will show a broken file.`,
      confirmText: 'Delete',
      type: 'danger',
    });
    if (ok) deleteMutation.mutate(file.id);
  };

  const copyUrl = async (file: StoredFile) => {
    try {
      await navigator.clipboard.writeText(fileUrl(file));
      addToast({ type: 'success', title: 'URL copied' });
    } catch {
      addToast({ type: 'error', title: 'Could not copy URL', description: fileUrl(file) });
    }
  };

  const categoryMeta = (file: StoredFile) => FILE_CATEGORIES.find((c) => c.type === getFileCategory(file.mime_type)) ?? FILE_CATEGORIES[3];

  const renderActions = (file: StoredFile) => (
    <div className="flex items-center justify-end gap-1">
      <a
        href={fileUrl(file)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${displayName(file)}`}
        title={file.isLocalLink ? 'Open link' : 'View file'}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
      <IconButton label={`Copy URL of ${displayName(file)}`} icon={Copy} onClick={() => copyUrl(file)} />
      <IconButton
        label={`Delete ${displayName(file)}`}
        icon={Trash2}
        tone="danger"
        disabled={deleteMutation.isPending && deleteMutation.variables === file.id}
        onClick={() => handleDelete(file)}
      />
    </div>
  );

  const filterButton = (value: 'all' | Category, label: string, Icon?: LucideIcon) => (
    <button
      key={value}
      type="button"
      aria-pressed={selectedCategory === value}
      onClick={() => setSelectedCategory(value)}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
        selectedCategory === value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Files"
        description="Upload and manage images, documents and downloads used across the site."
        actions={
          <>
            <button type="button" className={secondaryBtn} onClick={() => setLinkOpen(true)}>
              <Link2 className="h-4 w-4" aria-hidden="true" /> Add link
            </button>
            <button type="button" className={primaryBtn} onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4" aria-hidden="true" /> Upload file
            </button>
          </>
        }
      />

      <AdminCard padded={false}>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-xs">
            <SearchInput label="Search files" placeholder="Search files…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by type">
            {filterButton('all', 'All files')}
            {FILE_CATEGORIES.map((c) => filterButton(c.type, c.label, c.icon))}
          </div>
          <div className="flex gap-1" role="group" aria-label="View mode">
            <IconButton label="Grid view" icon={LayoutGrid} aria-pressed={viewMode === 'grid'} className={viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : ''} onClick={() => setViewMode('grid')} />
            <IconButton label="Table view" icon={List} aria-pressed={viewMode === 'table'} className={viewMode === 'table' ? 'bg-slate-100 text-slate-900' : ''} onClick={() => setViewMode('table')} />
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Loading files…" />
        ) : isError ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : filteredFiles.length === 0 ? (
          <EmptyState
            icon={FilesIcon}
            title={files.length ? 'No matching files' : 'No files yet'}
            description={files.length ? 'Try adjusting your search or filter.' : 'Upload your first file or add a link to get started.'}
            action={
              files.length ? undefined : (
                <button type="button" className={primaryBtn} onClick={() => setUploadOpen(true)}>
                  <Upload className="h-4 w-4" aria-hidden="true" /> Upload file
                </button>
              )
            }
          />
        ) : viewMode === 'grid' ? (
          <ul className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Files">
            {filteredFiles.map((file) => {
              const Icon = getFileIcon(file.mime_type);
              const meta = categoryMeta(file);
              return (
                <li key={file.id} className="flex flex-col rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    {renderActions(file)}
                  </div>
                  <p className="truncate font-medium text-slate-900" title={displayName(file)}>
                    {displayName(file)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{file.isLocalLink ? 'External link' : formatFileSize(file.size)}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Badge tone={meta.tone}>{file.isLocalLink ? 'Link' : meta.label}</Badge>
                    {file.isLocalLink && <Badge tone="warning">Not saved</Badge>}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <TableShell caption="Files">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Type</th>
                <th scope="col">Size</th>
                <th scope="col">URL</th>
                <th scope="col" className="!text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFiles.map((file) => {
                const Icon = getFileIcon(file.mime_type);
                const meta = categoryMeta(file);
                return (
                  <tr key={file.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 flex-none text-slate-400" aria-hidden="true" />
                        <span className="max-w-[16rem] truncate font-medium text-slate-900">{displayName(file)}</span>
                      </div>
                    </td>
                    <td>
                      <Badge tone={meta.tone}>{file.isLocalLink ? 'Link' : meta.label}</Badge>
                    </td>
                    <td className="whitespace-nowrap text-slate-500">{file.isLocalLink ? '—' : formatFileSize(file.size)}</td>
                    <td>
                      <span className="block max-w-xs truncate font-mono text-xs text-slate-500">{fileUrl(file)}</span>
                    </td>
                    <td>{renderActions(file)}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}
      </AdminCard>

      <Modal
        open={uploadOpen}
        onClose={closeUpload}
        title="Upload file"
        description="Max 10MB. JPG, PNG, GIF, WebP, AVIF, SVG, PDF, DOC, DOCX, TXT, ZIP or JSON."
        footer={
          <>
            <button type="button" className={secondaryBtn} onClick={closeUpload}>
              Cancel
            </button>
            <button type="submit" form="file-upload-form" className={primaryBtn} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
            </button>
          </>
        }
      >
        <form id="file-upload-form" onSubmit={handleUploadSubmit} noValidate>
          <Field label="File" required error={uploadError} hint={selectedFile ? `${selectedFile.name} · ${formatFileSize(selectedFile.size)}` : undefined}>
            {(props) => (
              <input
                {...props}
                type="file"
                disabled={uploadMutation.isPending}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt,.zip,.json,.gif,.webp,.avif,.svg"
                className="block w-full rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setSelectedFile(file);
                  setUploadError(file ? validateFile(file) : '');
                }}
              />
            )}
          </Field>
        </form>
      </Modal>

      <Modal
        open={linkOpen}
        onClose={() => {
          setLinkOpen(false);
          setLinkErrors({});
        }}
        title="Add link"
        description="Links are listed for this browser session only; they are not stored on the server."
        footer={
          <>
            <button
              type="button"
              className={secondaryBtn}
              onClick={() => {
                setLinkOpen(false);
                setLinkErrors({});
              }}
            >
              Cancel
            </button>
            <button type="submit" form="file-link-form" className={primaryBtn}>
              Add link
            </button>
          </>
        }
      >
        <form id="file-link-form" onSubmit={handleLinkSubmit} noValidate className="space-y-4">
          <Field label="Link title" required error={linkErrors.title}>
            {(props) => <input {...props} type="text" className={inputClass} placeholder="Enter link title" value={link.title} onChange={(e) => setLink({ ...link, title: e.target.value })} />}
          </Field>
          <Field label="URL" required error={linkErrors.url}>
            {(props) => <input {...props} type="url" className={inputClass} placeholder="https://example.com" value={link.url} onChange={(e) => setLink({ ...link, url: e.target.value })} />}
          </Field>
        </form>
      </Modal>
    </div>
  );
}
