import ReactMarkdown from 'react-markdown';
import SourceCard from './SourceCard';

export default function Message({ msg }) {
  return (
    <div className={`message ${msg.role}`}>
      <div className={`avatar ${msg.role}`}>
        {msg.role === 'user' ? 'U' : msg.role === 'error' ? '!' : 'AI'}
      </div>
      <div className="bubble-wrap">
        <div className="bubble">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>

        {msg.role === 'assistant' && (
          <div className="meta-row">
            {msg.cached && <span className="meta-tag cached">⚡ cached</span>}
            {msg.retries > 0 && <span className="meta-tag retries">↻ {msg.retries} retries</span>}
            <span className="meta-tag">{msg.sources?.length ?? 0} sources</span>
            <span className="meta-tag" style={{ color: 'var(--text-muted)' }}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}

        {msg.sources && msg.sources.length > 0 && (
          <div className="sources">
            <div className="sources-label">Retrieved Context</div>
            {msg.sources.map((s, i) => (
              <SourceCard key={i} source={s} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
