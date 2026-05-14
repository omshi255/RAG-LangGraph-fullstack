import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useIngest } from '../hooks/useRAG';

// ─── File type metadata ────────────────────────────────────────────────────

const FILE_CATEGORIES = [
  {
    label: 'Documents',
    color: '#7c6ef5',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
    exts: ['PDF', 'DOCX', 'DOC', 'PPTX', 'XLSX', 'XLS'],
  },
  {
    label: 'Text & Markup',
    color: '#3ddcb0',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="4 7 4 4 20 4 20 7"/>
        <line x1="9" y1="20" x2="15" y2="20"/>
        <line x1="12" y1="4" x2="12" y2="20"/>
      </svg>
    ),
    exts: ['TXT', 'MD', 'MDX', 'RTF', 'RST', 'LOG', 'HTML', 'XML'],
  },
  {
    label: 'Data',
    color: '#f0b060',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
    exts: ['JSON', 'CSV', 'YAML', 'TOML', 'INI', 'ENV'],
  },
  {
    label: 'Code',
    color: '#f06070',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    exts: ['PY', 'JS', 'TS', 'JSX', 'TSX', 'JAVA', 'C', 'CPP', 'GO', 'RS', 'RB', 'PHP', 'SWIFT', 'KT', 'CS', 'SQL', 'SH', 'IPYNB', '…'],
  },
  {
    label: 'Archives',
    color: '#a0c4ff',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="21 8 21 21 3 21 3 8"/>
        <rect x="1" y="3" width="22" height="5"/>
        <line x1="10" y1="12" x2="14" y2="12"/>
      </svg>
    ),
    exts: ['ZIP', 'TAR', 'TAR.GZ', 'TGZ'],
  },
  {
    label: 'eBook',
    color: '#c084fc',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
    exts: ['EPUB'],
  },
];

// Friendly icon per file extension
function getFileIcon(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const map = {
    pdf:  { bg: '#7c6ef520', color: '#7c6ef5', label: 'PDF' },
    docx: { bg: '#3ddcb020', color: '#3ddcb0', label: 'DOCX' },
    doc:  { bg: '#3ddcb020', color: '#3ddcb0', label: 'DOC' },
    pptx: { bg: '#f0b06020', color: '#f0b060', label: 'PPTX' },
    xlsx: { bg: '#50fa7b20', color: '#50fa7b', label: 'XLSX' },
    xls:  { bg: '#50fa7b20', color: '#50fa7b', label: 'XLS' },
    csv:  { bg: '#50fa7b20', color: '#50fa7b', label: 'CSV' },
    json: { bg: '#f0b06020', color: '#f0b060', label: 'JSON' },
    yaml: { bg: '#f0b06020', color: '#f0b060', label: 'YAML' },
    yml:  { bg: '#f0b06020', color: '#f0b060', label: 'YAML' },
    toml: { bg: '#f0b06020', color: '#f0b060', label: 'TOML' },
    xml:  { bg: '#f0b06020', color: '#f0b060', label: 'XML' },
    md:   { bg: '#3ddcb020', color: '#3ddcb0', label: 'MD' },
    mdx:  { bg: '#3ddcb020', color: '#3ddcb0', label: 'MDX' },
    txt:  { bg: '#8890a020', color: '#8890a0', label: 'TXT' },
    html: { bg: '#f0607020', color: '#f06070', label: 'HTML' },
    htm:  { bg: '#f0607020', color: '#f06070', label: 'HTML' },
    zip:  { bg: '#a0c4ff20', color: '#a0c4ff', label: 'ZIP' },
    tar:  { bg: '#a0c4ff20', color: '#a0c4ff', label: 'TAR' },
    epub: { bg: '#c084fc20', color: '#c084fc', label: 'EPUB' },
    ipynb:{ bg: '#f0b06020', color: '#f0b060', label: 'IPYNB' },
  };
  const code = ['py','js','ts','jsx','tsx','java','c','cpp','go','rs','rb',
    'php','swift','kt','cs','sql','sh','bash','ps1','lua','rs','dart'];
  if (code.includes(ext)) return { bg: '#f0607020', color: '#f06070', label: ext.toUpperCase() };
  return map[ext] || { bg: '#8890a020', color: '#8890a0', label: (ext || 'FILE').toUpperCase() };
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─── Multi-file upload card ────────────────────────────────────────────────

function FileUploadCard() {
  const { ingesting, progress, result, error, ingestFile } = useIngest();
  const [files, setFiles]   = useState([]);
  const [current, setCurrent] = useState(0);    // index of file being uploaded
  const [results, setResults] = useState([]);   // per-file results
  const [errors, setErrors]   = useState([]);   // per-file errors

  const onDrop = useCallback((accepted) => {
    setFiles(prev => [...prev, ...accepted]);
    setResults([]);
    setErrors([]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 50,
    // Accept everything — server validates
  });

  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleUpload = async () => {
    if (!files.length) return;
    const newResults = [];
    const newErrors  = [];
    for (let i = 0; i < files.length; i++) {
      setCurrent(i);
      try {
        const res = await ingestFile(files[i]);
        newResults.push({ name: files[i].name, ...res });
        newErrors.push(null);
      } catch (e) {
        newResults.push(null);
        newErrors.push({ name: files[i].name, msg: e?.message || 'Failed' });
      }
    }
    setResults(newResults);
    setErrors(newErrors);
  };

  const totalChunks = results.filter(Boolean).reduce((s, r) => s + (r?.chunks_stored || 0), 0);
  const successCount = results.filter(Boolean).length;
  const errorCount   = errors.filter(Boolean).length;

  return (
    <div className="card" style={{ flex: 1 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        File Upload
      </h2>
      <p style={{ marginBottom: 14 }}>
        Drop any file — documents, code, data, archives. Every type is supported.
      </p>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
        style={{ cursor: 'pointer' }}
      >
        <input {...getInputProps()} />
        <div className="dropzone-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <p style={{ marginBottom: 4 }}>
          {isDragActive ? 'Drop files here…' : 'Drag & drop files or click to browse'}
        </p>
        <small style={{ color: 'var(--text-muted)' }}>
          PDF · DOCX · PPTX · XLSX · CSV · JSON · MD · HTML · XML · PY · JS · TS · ZIP · TAR · EPUB · and more
        </small>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {files.map((f, i) => {
            const badge = getFileIcon(f.name);
            const res = results[i];
            const err = errors[i];
            return (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px',
                  background: 'var(--bg3)',
                  borderRadius: 8,
                  border: `1px solid ${err ? 'var(--error)' : res ? 'var(--accent2)' : 'var(--border)'}`,
                  fontSize: 12,
                }}
              >
                {/* badge */}
                <span style={{
                  background: badge.bg, color: badge.color,
                  borderRadius: 4, padding: '2px 6px',
                  fontSize: 10, fontWeight: 700, flexShrink: 0,
                  fontFamily: 'var(--font-mono)',
                }}>
                  {badge.label}
                </span>
                {/* name */}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.name}
                </span>
                {/* size */}
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{formatSize(f.size)}</span>
                {/* status */}
                {res && (
                  <span style={{ color: 'var(--accent2)', flexShrink: 0, fontSize: 11 }}>
                    ✓ {res.chunks_stored} chunks
                  </span>
                )}
                {err && (
                  <span style={{ color: 'var(--error)', flexShrink: 0, fontSize: 11 }} title={err.msg}>
                    ✗ failed
                  </span>
                )}
                {/* upload progress */}
                {ingesting && current === i && !res && !err && (
                  <span style={{ color: 'var(--warn)', flexShrink: 0, fontSize: 11 }}>
                    {progress}%
                  </span>
                )}
                {/* remove */}
                {!ingesting && !results.length && (
                  <button
                    onClick={() => removeFile(i)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: 2, flexShrink: 0,
                    }}
                    title="Remove"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Progress bar */}
      {ingesting && (
        <div className="progress-bar-wrap" style={{ marginTop: 12 }}>
          <div
            className="progress-bar"
            style={{ width: `${((current) / files.length) * 100 + (progress / files.length)}%` }}
          />
        </div>
      )}

      {/* Actions */}
      <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className="btn-primary"
          onClick={handleUpload}
          disabled={!files.length || ingesting}
        >
          {ingesting
            ? `Ingesting ${current + 1}/${files.length}… ${progress}%`
            : `Ingest ${files.length} File${files.length !== 1 ? 's' : ''}`}
        </button>
        {files.length > 0 && !ingesting && (
          <button
            className="btn-ghost"
            onClick={() => { setFiles([]); setResults([]); setErrors([]); }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Summary banner */}
      {successCount > 0 && (
        <div className="result-banner success" style={{ marginTop: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {successCount} file{successCount !== 1 ? 's' : ''} ingested — {totalChunks} total chunks stored
          {errorCount > 0 && ` · ${errorCount} failed`}
        </div>
      )}
      {errorCount > 0 && successCount === 0 && (
        <div className="result-banner error" style={{ marginTop: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {errors.filter(Boolean).map(e => e.msg).join(' · ')}
        </div>
      )}
    </div>
  );
}

// ─── Text ingest card ──────────────────────────────────────────────────────

function TextIngestCard() {
  const { ingesting, result, error, ingestTexts } = useIngest();
  const [text, setText] = useState('');

  const handleIngest = async () => {
    const chunks = text.split('\n\n').map(c => c.trim()).filter(Boolean);
    if (!chunks.length) return;
    await ingestTexts(chunks);
  };

  const chunkCount = text.split('\n\n').filter(c => c.trim()).length;

  return (
    <div className="card" style={{ flex: 1 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Paste Text
      </h2>
      <p style={{ marginBottom: 14 }}>
        Paste raw text — each blank line creates a separate chunk.
      </p>

      <textarea
        className="textarea"
        placeholder={`Paste your content here…\n\nBlank lines = chunk boundaries.\n\nPerfect for notes, transcripts, raw data.`}
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <div className="textarea-hint">
        {chunkCount} chunk{chunkCount !== 1 ? 's' : ''} detected · {text.length} chars
      </div>

      <button
        className="btn-primary"
        onClick={handleIngest}
        disabled={!text.trim() || ingesting}
        style={{ marginTop: 12 }}
      >
        {ingesting ? 'Ingesting…' : `Ingest ${chunkCount} Chunk${chunkCount !== 1 ? 's' : ''}`}
      </button>

      {result && (
        <div className="result-banner success" style={{ marginTop: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {result.message} — {result.chunks_stored} chunks stored
        </div>
      )}
      {error && (
        <div className="result-banner error" style={{ marginTop: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Supported types grid ──────────────────────────────────────────────────

function SupportedTypesCard() {
  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        Supported File Types
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {FILE_CATEGORIES.map(cat => (
          <div
            key={cat.label}
            style={{
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '10px 14px',
              minWidth: 150,
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: cat.color, fontWeight: 600, fontSize: 12,
              marginBottom: 8,
            }}>
              {cat.icon}
              {cat.label}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {cat.exts.map(ext => (
                <span
                  key={ext}
                  style={{
                    background: `${cat.color}18`,
                    color: cat.color,
                    borderRadius: 4, padding: '1px 6px',
                    fontSize: 10, fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pipeline info card ────────────────────────────────────────────────────

function PipelineInfoCard() {
  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Pipeline Info
      </h2>
      <p style={{ marginBottom: 0, color: 'var(--text-dim)', lineHeight: 1.8 }}>
        Files are extracted → smart-chunked (≈500 words, paragraph-aware) → embedded with{' '}
        <strong style={{ color: 'var(--text)' }}>SentenceTransformers</strong> → stored in{' '}
        <strong style={{ color: 'var(--text)' }}>Pinecone</strong> (dense) + BM25 (sparse).{' '}
        At query time, the <strong style={{ color: 'var(--text)' }}>LangGraph</strong> agent rewrites the query,
        retrieves top-K chunks, re-ranks with <strong style={{ color: 'var(--text)' }}>Cohere</strong>,
        grades for hallucinations, and retries automatically. Results are semantically cached.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function IngestPage() {
  return (
    <div className="ingest-page">
      <h1>Ingest Documents</h1>
      <p>Add any file to your RAG knowledge base — documents, code, data, archives, or raw text.</p>

      <div className="ingest-sections" style={{ alignItems: 'flex-start' }}>
        <FileUploadCard />
        <TextIngestCard />
      </div>

      <SupportedTypesCard />
      <PipelineInfoCard />
    </div>
  );
}