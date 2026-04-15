import { useEffect, useState } from 'react';
import api from '../lib/api';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const PRIORITY_COLORS = { urgent: '#E24B4A', normal: '#1D9E75', low: '#888780' };
const STATUS_LABELS = { pending: 'To do', in_progress: 'In progress', completed: 'Done', flagged: 'Issue flagged' };
const STATUS_COLORS = { pending: '#888780', in_progress: '#EF9F27', completed: '#1D9E75', flagged: '#E24B4A' };

const EMPTY = {
  title: '', description: '', priority: 'normal',
  due_date: new Date().toISOString().split('T')[0],
  due_time: '', location: '', assigned_to: '', linked_equipment_id: ''
};

export default function Tasks() {
  const [tasks, setTasks]         = useState([]);
  const [employees, setEmployees] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [dupWarning, setDupWarning] = useState(null);
  const [filter, setFilter]       = useState('all');

  useEffect(() => {
    Promise.all([
      api.get('/employees'),
      api.get('/equipment'),
    ]).then(([emps, equip]) => {
      setEmployees(emps);
      setEquipment(equip?.data || equip || []);
    }).catch(() => {});
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/tasks');
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openAdd()      { setEditing(null); setForm(EMPTY); setModal(true); setError(''); setDupWarning(null); }
  function openEdit(task) {
    setEditing(task);
    setForm({
      title:               task.title,
      description:         task.description || '',
      priority:            task.priority,
      due_date:            task.due_date?.split('T')[0] || '',
      due_time:            task.due_time || '',
      location:            task.location || '',
      assigned_to:         task.assigned_to || '',
      linked_equipment_id: task.linked_equipment_id || '',
    });
    setModal(true); setError(''); setDupWarning(null);
  }

  async function handleSave(e, force = false) {
    e.preventDefault();
    setSaving(true); setError(''); setDupWarning(null);
    try {
      if (editing) {
        await api.put(`/tasks/${editing.id}`, form);
      } else {
        await api.post('/tasks', { ...form, force });
      }
      setModal(false);
      load();
    } catch (err) {
      if (err.code === 'duplicate') {
        setDupWarning(err);
      } else {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"?`)) return;
    await api.delete(`/tasks/${id}`);
    setTasks(t => t.filter(x => x.id !== id));
  }

  async function quickStatus(id, status) {
    await api.put(`/tasks/${id}/status`, { status });
    load();
  }

  const filtered = filter === 'all' ? tasks
    : filter === 'today' ? tasks.filter(t => t.due_date?.split('T')[0] === new Date().toISOString().split('T')[0])
    : filter === 'overdue' ? tasks.filter(t => t.due_date && t.due_date.split('T')[0] < new Date().toISOString().split('T')[0] && t.status !== 'completed')
    : tasks.filter(t => t.status === filter);

  const counts = {
    urgent:     tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
    overdue:    tasks.filter(t => t.due_date && t.due_date.split('T')[0] < new Date().toISOString().split('T')[0] && t.status !== 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    today:      tasks.filter(t => t.due_date?.split('T')[0] === new Date().toISOString().split('T')[0]).length,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Tasks</div>
          <div className="page-subtitle">{tasks.filter(t => t.status !== 'completed').length} active tasks</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add task</button>
      </div>

      {/* Alert cards */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
        {counts.urgent > 0 && (
          <div style={{ background: '#FEF2F2', border: '1px solid #E24B4A', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#E24B4A', fontWeight: 600, cursor: 'pointer' }} onClick={() => setFilter('urgent')}>
            🚨 {counts.urgent} urgent
          </div>
        )}
        {counts.overdue > 0 && (
          <div style={{ background: '#FFF7ED', border: '1px solid #EF9F27', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#EF9F27', fontWeight: 600, cursor: 'pointer' }} onClick={() => setFilter('overdue')}>
            ⚠️ {counts.overdue} overdue
          </div>
        )}
        {counts.inProgress > 0 && (
          <div style={{ background: '#F0FDF4', border: '1px solid #1D9E75', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#1D9E75', fontWeight: 600 }}>
            ⚙️ {counts.inProgress} in progress
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[['all','All'], ['today','Today'], ['pending','To do'], ['in_progress','In progress'], ['completed','Done'], ['flagged','Flagged']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`btn btn-sm ${filter === val ? 'btn-primary' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading
          ? <div className="loading-center"><div className="spinner" /></div>
          : filtered.length === 0
          ? <div className="card"><div className="empty-state"><p>No tasks found.</p></div></div>
          : filtered.map(task => (
            <div key={task.id} className="card" style={{ padding: '0.85rem 1rem', borderLeft: `4px solid ${PRIORITY_COLORS[task.priority]}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{task.title}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: STATUS_COLORS[task.status] + '22', color: STATUS_COLORS[task.status], fontWeight: 600 }}>
                      {STATUS_LABELS[task.status]}
                    </span>
                    {task.priority === 'urgent' && <span style={{ fontSize: 11, color: '#E24B4A', fontWeight: 700 }}>🚨 URGENT</span>}
                  </div>
                  {task.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{task.description}</div>}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
                    {task.employee_name && <span>👤 {task.employee_name}</span>}
                    {task.due_date && <span>📅 {fmtDate(task.due_date)}{task.due_time ? ` at ${task.due_time.slice(0,5)}` : ''}</span>}
                    {task.location && <span>📍 {task.location}</span>}
                    {task.completion_note && <span style={{ color: task.status === 'flagged' ? '#E24B4A' : 'var(--text-muted)' }}>💬 {task.completion_note}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {task.status !== 'completed' && (
                    <button className="btn btn-sm" style={{ fontSize: 11 }}
                      onClick={() => quickStatus(task.id, task.status === 'in_progress' ? 'completed' : 'in_progress')}>
                      {task.status === 'in_progress' ? '✓ Done' : '▶ Start'}
                    </button>
                  )}
                  <button className="btn btn-sm btn-icon" onClick={() => openEdit(task)}>✎</button>
                  <button className="btn btn-sm btn-icon" onClick={() => handleDelete(task.id, task.title)} style={{ color: 'var(--danger)' }}>✕</button>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit task' : 'Add task'}</div>
              <button className="btn btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            {dupWarning && (
              <div style={{ background: '#FFF7ED', border: '1px solid #EF9F27', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem', fontSize: 13 }}>
                <strong>⚠️ Similar task exists</strong><br />
                {dupWarning.message}<br />
                <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={e => handleSave(e, true)}>Create anyway</button>
              </div>
            )}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" required placeholder="e.g. Check fencing north boundary"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} placeholder="Any extra details..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="urgent">🚨 Urgent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign to</label>
                  <select className="form-input" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Due date</label>
                  <input className="form-input" type="date" value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Due time</label>
                  <input className="form-input" type="time" value={form.due_time}
                    onChange={e => setForm(f => ({ ...f, due_time: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="e.g. Field 7 — North boundary"
                  value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Link to equipment</label>
                <select className="form-input" value={form.linked_equipment_id} onChange={e => setForm(f => ({ ...f, linked_equipment_id: e.target.value }))}>
                  <option value="">None</option>
                  {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
