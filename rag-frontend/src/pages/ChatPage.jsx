import { useRef, useEffect, useState, useCallback } from 'react';
import { useRAG, useHealth } from '../hooks/useRAG';
import Message from '../components/Message';

const SUGGESTIONS = [
  'Summarize the ingested documents',
  'What are the key concepts?',
  'Explain in simple terms',
  'List the main points',
];

export default function ChatPage() {
  const { messages, loading, sendQuery, clearMessages } = useRAG();
  const { status, check } = useHealth();
  const [input, setInput] = useState('');
  const [topK, setTopK] = useState(5);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { check(); }, [check]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const submit = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    textareaRef.current.style.height = 'auto';
    await sendQuery(q, topK);
  }, [input, loading, sendQuery, topK]);

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const onInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="chat-header-left">
          <h1>RAG Query</h1>
          <p>LangGraph pipeline · Pinecone retrieval · Groq inference</p>
        </div>
        <div className="header-actions">
          <div className="status-dot">
            <span className={`dot ${status || 'offline'}`} />
            <span>{status || 'checking…'}</span>
          </div>
          {messages.length > 0 && (
            <button className="btn-ghost" onClick={clearMessages}>Clear</button>
          )}
        </div>
      </div>

      <div className="messages-area">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <h2>Ask anything from your knowledge base</h2>
            <p>Ingest documents first, then query with natural language. The LangGraph pipeline handles retrieval, re-ranking, and grading.</p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="suggestion-chip" onClick={() => setInput(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <Message key={msg.id} msg={msg} />)
        )}

        {loading && (
          <div className="message assistant">
            <div className="avatar assistant">AI</div>
            <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <div className="input-row">
          <textarea
            ref={textareaRef}
            className="input-box"
            placeholder="Ask a question about your documents…"
            value={input}
            onChange={onInput}
            onKeyDown={onKey}
            rows={1}
          />
          <button className="send-btn" onClick={submit} disabled={!input.trim() || loading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <div className="topk-row">
          <span className="topk-label">Top-K results:</span>
          <input
            type="number"
            className="topk-input"
            min={1}
            max={20}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
          />
          <span className="topk-label" style={{ fontSize: 10 }}>Press Enter to send · Shift+Enter for newline</span>
        </div>
      </div>
    </div>
  );
}
