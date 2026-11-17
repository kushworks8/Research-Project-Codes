import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

async function api(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Something went wrong.');
  return data;
}
function App() {
  const [docs, setDocs] = useState([]), [selected, setSelected] = useState([]), [health, setHealth] = useState(null);
  const [question, setQuestion] = useState(''), [result, setResult] = useState(null), [busy, setBusy] = useState(false), [uploading, setUploading] = useState(false), [error, setError] = useState('');
  const fileRef = useRef(null);
  const refresh = async () => { try { setDocs(await api('/api/documents')); } catch (e) { setError(e.message); } };
  useEffect(() => { refresh(); api('/api/health').then(setHealth).catch(() => setHealth({ollama:false})); const timer = setInterval(refresh, 3000); return () => clearInterval(timer); }, []);
  useEffect(() => { setSelected(old => old.filter(id => docs.some(d => d.id === id && d.status === 'ready'))); }, [docs]);
  const upload = async files => {
    if (!files?.length) return;
    setError(''); setUploading(true);
    for (const file of files) { try { const body = new FormData(); body.append('file', file); await api('/api/documents', {method:'POST', body}); } catch (e) { setError(`${file.name}: ${e.message}`); } }
    setUploading(false); await refresh(); if (fileRef.current) fileRef.current.value = '';
  };
  const ask = async e => { e.preventDefault(); if (!question.trim() || !selected.length) return; setBusy(true); setError(''); setResult(null); try { setResult(await api('/api/ask', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({question, document_ids:selected})})); } catch(e) { setError(e.message); } finally { setBusy(false); } };
  const remove = async id => { try { await api(`/api/documents/${id}`, {method:'DELETE'}); setResult(null); await refresh(); } catch(e) { setError(e.message); } };
  return <div className="shell">
    <aside className="sidebar"><div className="brand"><span className="brandmark">◈</span><div><strong>RBER</strong><small>DOCUMENT INTELLIGENCE</small></div></div>
      <div className="sideintro"><span className="eyebrow">YOUR LIBRARY</span><h2>Make more of<br/>what you read.</h2><p>A quieter place to find answers in your documents.</p></div>
      <button className="upload" onClick={() => fileRef.current?.click()} disabled={uploading}><span>＋</span> {uploading ? 'Uploading…' : 'Add documents'}</button><input ref={fileRef} type="file" accept=".pdf,.txt,.md" multiple hidden onChange={e => upload(e.target.files)}/><div className="uploadhint">PDF, TXT, or MD · up to 100 MB each</div>
      <div className="library-title"><span>DOCUMENTS</span><span>{String(docs.length).padStart(2,'0')}</span></div>
      <div className="doclist">{docs.length === 0 && <p className="empty-library">Your library is empty.<br/>Add a document to get started.</p>}{docs.map(d => <div className="doc" key={d.id}><label><input type="checkbox" checked={selected.includes(d.id)} disabled={d.status !== 'ready'} onChange={e => setSelected(e.target.checked ? [...selected,d.id] : selected.filter(id => id !== d.id))}/><span className="docicon">▤</span><span className="docinfo"><strong title={d.name}>{d.name}</strong><small>{d.status === 'ready' ? `${d.words.toLocaleString()} words · ${d.chunks} passages` : d.status === 'processing' ? 'Indexing document…' : 'Indexing failed'}</small>{d.error && <small className="docerror">{d.error}</small>}</span></label><button className="delete" aria-label={`Delete ${d.name}`} title="Delete document" onClick={() => remove(d.id)}>×</button></div>)}</div>
      <div className="sidebar-bottom"><span className={'dot '+(health?.ollama ? 'online':'')}></span><span>{health === null ? 'Checking connection' : health.ollama ? 'Ollama connected' : 'Ollama unavailable'}</span><span className="local">LOCAL</span></div>
    </aside>
    <main><header><div><span className="breadcrumb">WORKSPACE</span><span className="slash"> / </span><span>Document search</span></div><div className="header-right"><span className="status-dot"></span> RESEARCH WORKSPACE</div></header>
      <div className="content"><div className="topline"><span className="eyebrow">RESEARCH, WITHOUT THE SCROLL</span><span className="top-number">01 / EXPLORE</span></div><h1>Find the detail.<br/><em>Keep the context.</em></h1><p className="lede">Ask questions across your documents and follow the evidence back to its source.</p>
      {error && <div className="alert" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
      {health && !health.ollama && <div className="notice">Ollama is not connected. Start Ollama and install the configured embedding and generation models to index and query documents.</div>}
      <form onSubmit={ask} className="question-card"><div className="question-top"><span className="eyebrow">ASK YOUR DOCUMENTS</span><span className="selected-count"><span className="tiny-dot"></span>{selected.length} SELECTED</span></div><textarea maxLength={1000} disabled={busy} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask one question at a time" rows="3" aria-label="Your question"/><div className="question-bottom"><span>Select ready documents from your library</span><button disabled={busy || !question.trim() || !selected.length}>{busy ? 'Searching…' : 'Find answer'} <span>↗</span></button></div></form>
      {!result && <div className="how"><div className="how-head"><span className="eyebrow">HOW IT WORKS</span><span>BUILT FOR THE BIG PICTURE</span></div><div className="steps"><div><span>01</span><h3>Bring your documents</h3><p>Upload text or text-based PDFs to build your private library.</p></div><div><span>02</span><h3>Ask a question</h3><p>Search one question at a time through document boundaries.</p></div><div><span>03</span><h3>Explore the evidence</h3><p>Review source passages and the recursive boundary scores.</p></div></div></div>}
      {result && <section className="results"><div className="section-label"><span>THE ANSWER</span><span>01 — SYNTHESIS</span></div><div className="answer"><div className="answer-icon">✳</div><p>{result.answer}</p></div><div className="section-label sources-label"><span>THE EVIDENCE</span><span>{String(result.sources.length).padStart(2,'0')} PASSAGES</span></div><p className="source-intro">The boundary view shows the text supplied to the model; it may join the beginning and end of a region.</p><div className="sources">{result.sources.map(s => <details key={s.id}><summary><span className="source-num">{String(s.id).padStart(2,'0')}</span><span className="source-name">{s.document}<small>{s.boundary_view ? 'BOUNDARY VIEW' : s.page ? `PAGE ${s.page}` : `PASSAGE ${s.chunk}`} </small></span><span className="expand">＋</span></summary><p>{s.text}</p></details>)}</div><details className="trace"><summary>View recursive boundary scores <span>＋</span></summary>{result.trace.map((t,i) => <div key={i}><strong>{t.document}</strong>{t.steps.length ? t.steps.map(s => <p key={s.depth}>Depth {s.depth} · {s.region_chunks} passages · left {s.left_max.toFixed(3)} · right {s.right_max.toFixed(3)}</p>) : <p>Document is smaller than three passages.</p>}</div>)}<p>Scores measure vector similarity; they are not confidence probabilities.</p></details></section>}
      <footer><span>RBER <span className="footer-star">✳</span> DOCUMENT INTELLIGENCE</span><span>MADE FOR DEEPER READING</span></footer></div></main>
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
