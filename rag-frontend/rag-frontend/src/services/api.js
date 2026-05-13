import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const queryRAG = async (query, top_k = 5) => {
  const { data } = await api.post('/api/query', { query, top_k });
  return data;
};

export const ingestTexts = async (texts, metadata = null) => {
  const { data } = await api.post('/api/ingest', { texts, metadata });
  return data;
};

export const ingestFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/api/ingest/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return data;
};

export const checkHealth = async () => {
  const { data } = await api.get('/health');
  return data;
};
