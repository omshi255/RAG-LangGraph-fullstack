# RAGGraph Frontend

Production React frontend for the RAG-LangGraph backend.

## Quick Start

### 1. Start Backend
```bash
cd RAG-LangGraph
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Configure Frontend
```bash
cd rag-frontend
cp .env.example .env
# Edit VITE_API_URL if backend is not on localhost:8000
```

### 3. Install & Dev
```bash
npm install
npm run dev
# Opens http://localhost:5173
```

### 4. Production Build
```bash
npm run build
npx serve dist
```

## Change Backend URL
Edit `.env`:
```
VITE_API_URL=https://your-backend.example.com
```
Then `npm run build`.

## Structure
```
src/
  services/api.js     - Axios calls to backend
  hooks/useRAG.js     - Query / ingest / health hooks
  components/         - Message, SourceCard
  pages/              - ChatPage, IngestPage
  App.jsx / App.css   - Layout + design system
```
