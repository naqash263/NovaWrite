import { useEffect, useState } from 'react';
import apiClient from '../../api/axios';
import type { File as FileType } from '../../types';

export default function Files() {
  const [files, setFiles] = useState<FileType[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const response = await apiClient.get('/files');
    setFiles(response.data);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_public', 'true');

    try {
      await apiClient.post('/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure?')) {
      await apiClient.delete(`/files/${id}`);
      fetchFiles();
    }
  };

  const handleDownload = (id: number) => {
    window.open(`http://localhost:8000/api/files/${id}/download`, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="admin-page">
      <header>
        <h1>Files</h1>
        <label className="upload-button">
          {uploading ? 'Uploading...' : 'Upload File'}
          <input
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      </header>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Size</th>
            <th>Downloads</th>
            <th>Visibility</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map(file => (
            <tr key={file.id}>
              <td>{file.original_name}</td>
              <td>{file.mime_type}</td>
              <td>{formatFileSize(file.size)}</td>
              <td>{file.downloads}</td>
              <td>{file.is_public ? 'Public' : 'Private'}</td>
              <td>
                <button onClick={() => handleDownload(file.id)}>
                  Download
                </button>
                <button onClick={() => handleDelete(file.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
