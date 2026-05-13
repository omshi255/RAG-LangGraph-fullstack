import { useState } from 'react';

export default function SourceCard({ source, index }) {
  const [expanded, setExpanded] = useState(false);
  const preview = source.text.slice(0, 80) + (source.text.length > 80 ? '…' : '');

  return (
    <div className={`source-card ${expanded ? 'expanded' : ''}`} onClick={() => setExpanded((v) => !v)}>
      <div className="source-header">
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Source {index + 1}</span>
        <span className="source-score">score: {source.score.toFixed(3)}</span>
      </div>
      {!expanded && <div className="source-preview">{preview}</div>}
      {expanded && <div className="source-full">{source.text}</div>}
    </div>
  );
}
