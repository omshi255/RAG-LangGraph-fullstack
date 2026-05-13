import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useIngest } from '../hooks/useRAG';

function FileUploadCard() {
  const { ingesting, progress, result, error, ingestFile } = useIngest();
  const [file, setFile] = useState(null);

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    await ingestFile(file);
  };

  return (
    <div className="card">
      <h2>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        File Upload
      </h2>
      <p>Upload PDF, DOCX, or TXT files. They'll be chunked (500 words/chunk) and stored in Pinecone.</p>

      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <div className="dropzone-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <p>{isDragActive ? 'Drop it here…' : 'Drag & drop or click to browse'}</p>
        <small>PDF · DOCX · TXT</small>
      </div>

      {file && (
        <div className="file-selected">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span className="file-selected-name">{file.name}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</span>
        </div>
      )}

      {ingesting && (
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button className="btn-primary" onClick={handleUpload} disabled={!file || ingesting}>
          {ingesting ? `Uploading… ${progress}%` : 'Ingest File'}
        </button>
      </div>

      {result && (
        <div className="result-banner success">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {result.message} — {result.chunks_stored} chunks stored
          {result.filename && ` from "${result.filename}"`}
        </div>
      )}
      {error && (
        <div className="result-banner error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

function TextIngestCard() {
  const { ingesting, result, error, ingestTexts } = useIngest();
  const [text, setText] = useState('');

  const handleIngest = async () => {
    const chunks = text.split('\n\n').map((c) => c.trim()).filter(Boolean);
    if (!chunks.length) return;
    await ingestTexts(chunks);
  };

  return (
    <div className="card">
      <h2>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Paste Text
      </h2>
      <p>Paste raw text directly. Separate chunks with a blank line — each paragraph becomes one indexed chunk.</p>

      <textarea
        className="textarea"
        placeholder={`Paste your text here…\n\nBlank lines split chunks.\n\nEach chunk is stored and indexed separately.`}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="textarea-hint">
        {text.split('\n\n').filter((c) => c.trim()).length} chunk(s) detected · {text.length} chars
      </div>

      <button className="btn-primary" onClick={handleIngest} disabled={!text.trim() || ingesting}>
        {ingesting ? 'Ingesting…' : 'Ingest Text'}
      </button>

      {result && (
        <div className="result-banner success">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {result.message} — {result.chunks_stored} chunks stored
        </div>
      )}
      {error && (
        <div className="result-banner error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

export default function IngestPage() {
  return (
    <div className="ingest-page">
      <h1>Ingest Documents</h1>
      <p>Add knowledge to your RAG pipeline. Supports file upload or direct text paste.</p>
      <div className="ingest-sections">
        <FileUploadCard />
        <TextIngestCard />
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Pipeline Info
        </h2>
        <p style={{ marginBottom: 0 }}>
          Ingested documents are embedded via <strong>Cohere</strong> and stored in <strong>Pinecone</strong> using hybrid (dense + sparse) indexing.
          At query time, the <strong>LangGraph</strong> agent rewrites the query, retrieves top-K chunks, re-ranks with Cohere, grades relevance, checks for hallucinations, and falls back or retries automatically.
          Responses are cached via Redis for repeated queries.
        </p>
      </div>
    </div>
  );
}
