import { useState } from 'react';
import ChatPage from './pages/ChatPage';
import IngestPage from './pages/IngestPage';
import './App.css';

export default function App() {
  const [tab, setTab] = useState('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>

        {/* Top section: brand + toggle on same row */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="var(--accent)" strokeWidth="1.5"/>
                <path d="M7 14 Q14 6 21 14 Q14 22 7 14Z" fill="var(--accent)" opacity="0.25"/>
                <circle cx="14" cy="14" r="3" fill="var(--accent)"/>
                <line x1="14" y1="5" x2="14" y2="9" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="14" y1="19" x2="14" y2="23" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="5" y1="14" x2="9" y2="14" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="19" y1="14" x2="23" y2="14" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            {sidebarOpen && (
              <span className="brand-name">
                Lang<span className="brand-accent">Graph</span>
              </span>
            )}
          </div>

          {/* Toggle sits beside brand, never overlaps */}
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {sidebarOpen
                ? <path d="M15 18l-6-6 6-6" />
                : <path d="M9 18l6-6-6-6" />
              }
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${tab === 'chat' ? 'active' : ''}`}
            onClick={() => setTab('chat')}
            title="Query"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {sidebarOpen && <span>Query</span>}
          </button>

          <button
            className={`nav-item ${tab === 'ingest' ? 'active' : ''}`}
            onClick={() => setTab('ingest')}
            title="Ingest"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {sidebarOpen && <span>Ingest</span>}
          </button>
        </nav>

        {sidebarOpen && (
          <div className="sidebar-footer">
            <span>LangGraph · Pinecone · Groq</span>
          </div>
        )}
      </aside>

      <main className="main-content">
        {tab === 'chat' ? <ChatPage /> : <IngestPage />}
      </main>
    </div>
  );
}