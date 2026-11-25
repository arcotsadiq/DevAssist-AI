import { useEffect, useMemo, useState } from 'react';
import { Activity, Bot, CheckCircle2, CircleAlert, Clock3, Plus, Search, Send, Sparkles, Trash2, X } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

function App() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', requester: '' });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  }

  async function loadTickets() {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (status !== 'All') params.set('status', status);
      const data = await request(`/api/tickets?${params}`);
      setTickets(data);
      if (selected) {
        const refreshed = data.find(item => item._id === selected._id);
        if (refreshed) setSelected(refreshed);
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadTickets(); }, [query, status]);

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    progress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length
  }), [tickets]);

  async function createTicket(e) {
    e.preventDefault();
    try {
      const ticket = await request('/api/tickets', { method: 'POST', body: JSON.stringify(form) });
      setForm({ title: '', description: '', requester: '' });
      setShowForm(false); setSelected(ticket); await loadTickets();
    } catch (e) { setError(e.message); }
  }

  async function analyze() {
    if (!selected) return;
    setAiLoading(true); setError('');
    try {
      await request('/api/ai/analyze', { method: 'POST', body: JSON.stringify({ ticketId: selected._id }) });
      const updated = await request(`/api/tickets/${selected._id}`);
      setSelected(updated); await loadTickets();
    } catch (e) { setError(e.message); }
    finally { setAiLoading(false); }
  }

  async function updateStatus(nextStatus) {
    try {
      const updated = await request(`/api/tickets/${selected._id}`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
      setSelected(updated); await loadTickets();
    } catch (e) { setError(e.message); }
  }

  async function removeTicket() {
    if (!selected || !window.confirm('Delete this ticket?')) return;
    try {
      await request(`/api/tickets/${selected._id}`, { method: 'DELETE' });
      setSelected(null); await loadTickets();
    } catch (e) { setError(e.message); }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Bot size={23}/></div><div><strong>DevAssist<span>AI</span></strong><small>SUPPORT INTELLIGENCE</small></div></div>
      <div className="workspace"><span className="workspace-dot"/> Demo workspace <span className="chevron">⌄</span></div>
      <p className="nav-label">WORKSPACE</p>
      <div className="nav-item active"><Activity size={17}/> Overview</div>
      <div className="nav-item"><Bot size={17}/> AI Copilot <span className="nav-tag">AI</span></div>
      <div className="sidebar-bottom"><div className="avatar">DA</div><div><strong>Demo Admin</strong><small>Portfolio preview</small></div><span className="online-dot"/></div>
    </aside>

    <main className="main">
      <header className="topbar"><div><span className="breadcrumb">Workspace</span><span className="slash">/</span><strong>Overview</strong></div><div className="top-right"><span className="live-dot"/> System operational <div className="avatar small">DA</div></div></header>
      <section className="content">
        <div className="heading-row"><div><p className="eyebrow">YOUR SUPPORT COMMAND CENTER</p><h1>Good day, Admin <span>✦</span></h1><p className="subheading">Triage issues faster with your AI-powered support copilot.</p></div><button className="primary" onClick={() => setShowForm(true)}><Plus size={17}/> New ticket</button></div>
        {error && <div className="error-banner"><CircleAlert size={16}/>{error}<button onClick={() => setError('')}><X size={15}/></button></div>}
        <div className="stats-grid">
          <Stat icon={<Activity/>} label="Total tickets" value={stats.total} tone="blue"/>
          <Stat icon={<CircleAlert/>} label="Open" value={stats.open} tone="orange"/>
          <Stat icon={<Clock3/>} label="In progress" value={stats.progress} tone="purple"/>
          <Stat icon={<CheckCircle2/>} label="Resolved" value={stats.resolved} tone="green"/>
        </div>
        <div className="section-heading"><div><h2>Support tickets</h2><p>Review issues and let AI help with the first response.</p></div><div className="filters"><div className="search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tickets..."/></div><select value={status} onChange={e => setStatus(e.target.value)}><option>All</option><option>Open</option><option>In Progress</option><option>Resolved</option></select></div></div>
        <div className="ticket-layout">
          <div className="ticket-list">
            {loading ? <div className="empty">Loading tickets...</div> : tickets.length === 0 ? <div className="empty"><Bot size={28}/><strong>No tickets yet</strong><span>Create a ticket to try the AI workflow.</span></div> : tickets.map(ticket => <button key={ticket._id} className={`ticket-row ${selected?._id === ticket._id ? 'chosen' : ''}`} onClick={() => setSelected(ticket)}>
              <div className="ticket-top"><span className="ticket-id">#{ticket._id.slice(-6).toUpperCase()}</span><Status status={ticket.status}/></div>
              <strong>{ticket.title}</strong><p>{ticket.description}</p><div className="ticket-meta"><span>{ticket.requester || 'Demo user'}</span><span>{new Date(ticket.createdAt).toLocaleDateString()}</span></div>
            </button>)}
          </div>
          <div className="detail-panel">
            {!selected ? <div className="detail-empty"><div className="empty-icon"><Sparkles/></div><h3>Select a support ticket</h3><p>Choose a ticket to view its details and generate an AI-powered analysis.</p></div> :
              <><div className="detail-header"><div><span className="ticket-id">TICKET #{selected._id.slice(-6).toUpperCase()}</span><h3>{selected.title}</h3></div><button className="icon-button danger" title="Delete ticket" onClick={removeTicket}><Trash2 size={16}/></button></div>
                <div className="detail-meta"><Status status={selected.status}/><span>Submitted {new Date(selected.createdAt).toLocaleString()}</span></div>
                <div className="detail-block"><label>DESCRIPTION</label><p className="description">{selected.description}</p><span className="requester">Reported by {selected.requester || 'Demo user'}</span></div>
                <div className="status-control"><label>UPDATE STATUS</label><select value={selected.status} onChange={e => updateStatus(e.target.value)}><option>Open</option><option>In Progress</option><option>Resolved</option></select></div>
                <div className="ai-card"><div className="ai-card-head"><div className="ai-symbol"><Sparkles size={17}/></div><div><strong>AI Copilot</strong><small>Gemini-powered ticket intelligence</small></div><span className="powered">POWERED BY AI</span></div>
                  {!selected.aiAnalysis ? <div className="ai-start"><p>Generate a structured summary, issue category, priority and suggested reply using the knowledge base.</p><button className="ai-button" onClick={analyze} disabled={aiLoading}>{aiLoading ? <span className="spinner"/> : <Sparkles size={16}/>} {aiLoading ? 'Analyzing ticket...' : 'Analyze with AI'}</button></div> :
                    <div className="analysis"><div className="analysis-tags"><span className="category">{selected.aiAnalysis.category}</span><span className={`priority ${selected.aiAnalysis.priority?.toLowerCase()}`}>{selected.aiAnalysis.priority} priority</span></div><label>AI SUMMARY</label><p>{selected.aiAnalysis.summary}</p><label>SUGGESTED RESPONSE</label><div className="reply">{selected.aiAnalysis.suggestedReply}<button title="Copy response" onClick={() => navigator.clipboard?.writeText(selected.aiAnalysis.suggestedReply)}><Send size={14}/> Copy</button></div><label>RETRIEVED KNOWLEDGE</label><div className="sources">{(selected.aiAnalysis.sources || []).length ? selected.aiAnalysis.sources.map(s => <span key={s}>{s}</span>) : <span>No matching notes found</span>}</div><button className="regenerate" onClick={analyze} disabled={aiLoading}>{aiLoading ? 'Analyzing...' : '↻ Regenerate analysis'}</button></div>}
                </div><p className="disclaimer">AI-generated content may be inaccurate. Review suggestions before sending.</p>
              </>}
          </div>
        </div>
        <footer>DEVASSIST AI <span>•</span> BUILT FOR SMARTER SUPPORT WORKFLOWS</footer>
      </section>
    </main>

    {showForm && <div className="modal-backdrop" onClick={() => setShowForm(false)}><form className="modal" onSubmit={createTicket} onClick={e => e.stopPropagation()}><div className="modal-title"><div><p className="eyebrow">SUPPORT WORKFLOW</p><h2>Create a ticket</h2></div><button type="button" className="icon-button" onClick={() => setShowForm(false)}><X/></button></div><label>ISSUE TITLE</label><input required maxLength="120" placeholder="e.g. API returns 401 error" value={form.title} onChange={e => setForm({...form, title:e.target.value})}/><label>DESCRIPTION</label><textarea required maxLength="5000" rows="5" placeholder="Describe what happened, expected behaviour and any error message..." value={form.description} onChange={e => setForm({...form, description:e.target.value})}/><label>REQUESTER</label><input placeholder="Your name (optional)" value={form.requester} onChange={e => setForm({...form, requester:e.target.value})}/><button className="primary full" type="submit"><Plus size={16}/> Create ticket</button></form></div>}
  </div>;
}

function Stat({icon,label,value,tone}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>; }
function Status({status}) { return <span className={`status ${status.toLowerCase().replace(' ','-')}`}><i/>{status}</span>; }
export default App;
