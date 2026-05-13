import { useState, useCallback } from 'react';
import { queryRAG, ingestTexts, ingestFile, checkHealth } from '../services/api';

export const useRAG = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendQuery = useCallback(async (query, top_k = 5) => {
    setLoading(true);
    setError(null);
    const userMsg = { id: Date.now(), role: 'user', content: query, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const res = await queryRAG(query, top_k);
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        cached: res.cached,
        retries: res.retries,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      return assistantMsg;
    } catch (e) {
      const errMsg = e.response?.data?.detail || e.message || 'Query failed';
      setError(errMsg);
      const errAssistant = {
        id: Date.now() + 1,
        role: 'error',
        content: errMsg,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errAssistant]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, loading, error, sendQuery, clearMessages };
};

export const useIngest = () => {
  const [ingesting, setIngesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const ingestFile_ = useCallback(async (file) => {
    setIngesting(true);
    setProgress(0);
    setError(null);
    setResult(null);
    try {
      const res = await ingestFile(file, setProgress);
      setResult(res);
      return res;
    } catch (e) {
      const errMsg = e.response?.data?.detail || e.message || 'Ingest failed';
      setError(errMsg);
    } finally {
      setIngesting(false);
    }
  }, []);

  const ingestTexts_ = useCallback(async (texts) => {
    setIngesting(true);
    setError(null);
    setResult(null);
    try {
      const res = await ingestTexts(texts);
      setResult(res);
      return res;
    } catch (e) {
      const errMsg = e.response?.data?.detail || e.message || 'Ingest failed';
      setError(errMsg);
    } finally {
      setIngesting(false);
    }
  }, []);

  return { ingesting, progress, result, error, ingestFile: ingestFile_, ingestTexts: ingestTexts_ };
};

export const useHealth = () => {
  const [status, setStatus] = useState(null);
  const check = useCallback(async () => {
    try {
      const res = await checkHealth();
      setStatus(res.status === 'ok' ? 'online' : 'degraded');
    } catch {
      setStatus('offline');
    }
  }, []);
  return { status, check };
};
