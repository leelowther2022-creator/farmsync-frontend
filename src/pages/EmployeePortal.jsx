import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const PRIORITY_COLORS  = { urgent: '#E24B4A', normal: '#EF9F27', low: '#888780' };
const PRIORITY_LABELS  = { urgent: 'High', normal: 'Medium', low: 'Low' };
const PRIORITY_BG      = { urgent: '#FEF2F2', normal: '#FFF7ED', low: '#F5F5F5' };

const EVENT_LABELS = {
  weight: 'Weighed', treatment: 'Treated', movement: 'Moved',
  health_check: 'Health check', birth: 'Birth recorded', note: 'Note',
};

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtTime(t) {
  if (!t) return '';
  return t.slice(0, 5);
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── BOTTOM NAV ────────────────────────────────────────────────────────────────
function BottomNav({ tab, setTab }) {
  const items = [
    { id: 'tasks',   icon: '✓', label: 'Tasks'   },
    { id: 'history', icon: '◷', label: 'History' },
    { id: 'profile', icon: '◯', label: 'Profile' },
  ];
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#fff', borderTop: '1px solid #e8e8e8',
      display: 'flex', zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {items.map(({ id, icon, label }) => (
        <button key={id} onClick={() => setTab(id)} style={{
          flex: 1, padding: '10px 0 8px', border: 'none', background: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          color: tab === id ? '#1D9E75' : '#aaa', cursor: 'pointer',
          fontSize: 10, fontWeight: tab === id ? 600 : 400,
        }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, brandColor }) {
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/employee-auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('emp_token', data.token);
      onLogin(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: brandColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 16 }}>🌾</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>FarmSync</h1>
      <p style={{ color: '#888', fontSize: 14, margin: '0 0 2rem' }}>Sign in to your account</p>

      <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        {error && <div style={{ background: '#FEF2F2', border: '1px solid #E24B4A', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', fontSize: 13, color: '#E24B4A' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" required placeholder="you@example.com"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #ddd', fontSize: 16, boxSizing: 'border-box' }}
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" required placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #ddd', fontSize: 16, boxSizing: 'border-box' }}
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: 10, background: brandColor, color: '#fff', border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── TASK LIST (Dashboard) ─────────────────────────────────────────────────────
function TaskList({ tasks, loading, employee, onSelectTask, onRefresh, brandColor }) {
  const [dayFilter, setDayFilter] = useState('today');

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const filtered = tasks.filter(t => {
    if (dayFilter === 'today') return t.due_date?.split('T')[0] === today || t.status === 'in_progress';
    if (dayFilter === 'tomorrow') return t.due_date?.split('T')[0] === tomorrow;
    return true;
  });

  const counts = {
    today:    tasks.filter(t => t.due_date?.split('T')[0] === today || t.status === 'in_progress').length,
    tomorrow: tasks.filter(t => t.due_date?.split('T')[0] === tomorrow).length,
    all:      tasks.length,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f2', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: brandColor, color: '#fff', padding: '3rem 1.25rem 1.25rem' }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{greeting()}, {employee?.fullName?.split(' ')[0]} 👋</div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>You have {counts.today} task{counts.today !== 1 ? 's' : ''} today</div>
      </div>

      {/* Day filter tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #eee' }}>
        {[['today', `Today (${counts.today})`], ['tomorrow', `Tomorrow (${counts.tomorrow})`], ['all', `All (${counts.all})`]].map(([val, label]) => (
          <button key={val} onClick={() => setDayFilter(val)} style={{
            flex: 1, padding: '12px 4px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: dayFilter === val ? 600 : 400,
            color: dayFilter === val ? brandColor : '#888',
            borderBottom: dayFilter === val ? `2px solid ${brandColor}` : '2px solid transparent',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button onClick={onRefresh} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' }}>↻</button>
        </div>

        {loading
          ? <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Loading...</div>
          : filtered.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>All done!</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>No tasks for this period.</div>
            </div>
          )
          : filtered.map(task => (
            <div key={task.id} onClick={() => onSelectTask(task)}
              style={{ background: '#fff', borderRadius: 14, padding: '1rem', marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Time */}
              <div style={{ minWidth: 44, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>{task.due_time ? fmtTime(task.due_time) : '—'}</div>
              </div>
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                <div style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.animal_name ? `${task.animal_name}${task.animal_group_size ? ` · ${task.animal_group_size} animals` : ''}` : task.location || 'No location'}
                </div>
              </div>
              {/* Priority badge */}
              <div style={{ background: PRIORITY_BG[task.priority], color: PRIORITY_COLORS[task.priority], fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                {PRIORITY_LABELS[task.priority]}
              </div>
              <div style={{ color: '#ccc', fontSize: 16 }}>›</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── TASK DETAIL ───────────────────────────────────────────────────────────────
function TaskDetail({ task, onBack, onStart, onComplete, onFlag, brandColor }) {
  const hasAnimal = task.animal_name || task.animal_tag;
  const hasLastEvent = task.last_event_type;

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f2', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '3rem 1.25rem 1rem', borderBottom: '1px solid #eee' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: brandColor, fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: 0, marginBottom: 12 }}>
          ← Back
        </button>
        <div style={{ fontSize: 11, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Task Details</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>{task.title}</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ background: PRIORITY_BG[task.priority], color: PRIORITY_COLORS[task.priority], fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.due_date && <span style={{ fontSize: 12, color: '#888' }}>📅 {fmtDate(task.due_date)}{task.due_time ? ` at ${fmtTime(task.due_time)}` : ''}</span>}
          {task.location && <span style={{ fontSize: 12, color: '#888' }}>📍 {task.location}</span>}
        </div>
      </div>

      <div style={{ padding: '1rem' }}>

        {/* Animal context block */}
        {hasAnimal && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '1rem', marginBottom: 12, border: '1px solid #c8eedd' }}>
            <div style={{ fontSize: 11, color: '#1D9E75', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Animal Group</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {task.animal_name || `#${task.animal_tag}`}
                  {task.animal_group_size ? ` – ${task.animal_group_size} animals` : ''}
                </div>
                {task.animal_tag && <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Tag: {task.animal_tag}</div>}
                {task.animal_type && <div style={{ fontSize: 12, color: '#aaa', marginTop: 1, textTransform: 'capitalize' }}>{task.animal_type}</div>}
              </div>
              <div style={{ fontSize: 24 }}>🐄</div>
            </div>

            {/* Last event */}
            {hasLastEvent && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e8f5ee' }}>
                <div style={{ fontSize: 13, color: '#555' }}>
                  <strong>Last {EVENT_LABELS[task.last_event_type] || task.last_event_type}:</strong> {daysSince(task.last_event_date)}
                  {task.last_event_value ? ` · ${task.last_event_value}${task.last_event_unit ? ' ' + task.last_event_unit : ''}` : ''}
                </div>
                {task.last_event_notes && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>"{task.last_event_notes}"</div>}
              </div>
            )}
            {!hasLastEvent && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#aaa' }}>No previous events recorded</div>
            )}
          </div>
        )}

        {/* Instructions */}
        {task.description && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '1rem', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>📋 Instructions</div>
            <div style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>{task.description}</div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1rem', background: '#f7f6f2', borderTop: '1px solid #eee' }}>
        {task.status === 'pending' && (
          <button onClick={() => onStart(task.id)}
            style={{ width: '100%', padding: '16px', borderRadius: 12, background: brandColor, color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            ▶ Start Task
          </button>
        )}
        {task.status === 'in_progress' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onFlag(task)}
              style={{ flex: 1, padding: '16px', borderRadius: 12, background: '#FEF2F2', color: '#E24B4A', border: '1px solid #E24B4A', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              🚩 Report Issue
            </button>
            <button onClick={() => onComplete(task)}
              style={{ flex: 2, padding: '16px', borderRadius: 12, background: '#1D9E75', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              ✓ Mark Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── COMPLETE MODAL (bottom sheet) ─────────────────────────────────────────────
function CompleteSheet({ task, onSubmit, onCancel, submitting, isFlagging, brandColor }) {
  const [note, setNote]   = useState('');
  const [value, setValue] = useState('');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%', boxSizing: 'border-box', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, background: '#ddd', borderRadius: 2, margin: '0 auto 1.25rem' }} />
        <h3 style={{ margin: '0 0 1rem', fontSize: 18, fontWeight: 700 }}>
          {isFlagging ? '🚩 Report an Issue' : '✅ Mark as Done'}
        </h3>

        {/* Animal reminder */}
        {task.animal_name && (
          <div style={{ background: '#f0faf6', borderRadius: 10, padding: '8px 12px', marginBottom: '1rem', fontSize: 13 }}>
            🐄 <strong>{task.animal_name}</strong>{task.animal_tag ? ` · #${task.animal_tag}` : ''}
          </div>
        )}

        {/* Value input */}
        {!isFlagging && task.requires_value && task.value_label && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>{task.value_label}</label>
            <input type="number" step="0.1" placeholder="Enter value"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #ddd', fontSize: 18, boxSizing: 'border-box', fontWeight: 600 }}
              value={value} onChange={e => setValue(e.target.value)} autoFocus />
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            {isFlagging ? 'Describe the issue' : 'Notes (optional)'}
          </label>
          <textarea rows={3}
            placeholder={isFlagging ? 'e.g. Gate post broken, needs replacing' : 'e.g. All done, moved cattle to Field 6'}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box', resize: 'none' }}
            value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: '14px', borderRadius: 12, background: '#f0f0f0', border: 'none', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => onSubmit(note, value)} disabled={submitting}
            style={{ flex: 2, padding: '14px', borderRadius: 12, background: isFlagging ? '#E24B4A' : '#1D9E75', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            {submitting ? 'Saving...' : isFlagging ? 'Report Issue' : 'Complete Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DONE SCREEN ───────────────────────────────────────────────────────────────
function DoneScreen({ task, value, onBack, brandColor }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f0faf6', border: `3px solid ${brandColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 20 }}>✓</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Task Completed!</h2>
      <p style={{ color: '#888', fontSize: 15, margin: '0 0 2rem' }}>{task.title}</p>

      {/* Summary */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.25rem', width: '100%', maxWidth: 340, marginBottom: '1.5rem', textAlign: 'left' }}>
        {task.animal_name && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14 }}>
            <span style={{ color: '#888' }}>Animal</span>
            <span style={{ fontWeight: 600 }}>🐄 {task.animal_name}</span>
          </div>
        )}
        {value && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14 }}>
            <span style={{ color: '#888' }}>{task.value_label || 'Value'}</span>
            <span style={{ fontWeight: 600 }}>{value}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
          <span style={{ color: '#888' }}>Completed at</span>
          <span style={{ fontWeight: 600 }}>{new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <button onClick={onBack}
        style={{ width: '100%', maxWidth: 340, padding: '16px', borderRadius: 12, background: brandColor, color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
        Back to My Tasks
      </button>
    </div>
  );
}

// ── HISTORY ───────────────────────────────────────────────────────────────────
function HistoryScreen({ token, brandColor }) {
  const [tasks, setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/employee-auth/my-tasks?status=completed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(await res.json());
    } catch {}
    finally { setLoading(false); }
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f2', paddingBottom: 80 }}>
      <div style={{ background: '#fff', padding: '3rem 1.25rem 0', borderBottom: '1px solid #eee' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 1rem' }}>Task History</h2>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['all','All'], ['completed','Completed'], ['flagged','Flagged']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: filter === val ? 600 : 400,
              background: filter === val ? brandColor : '#f0f0f0',
              color: filter === val ? '#fff' : '#555',
            }}>{label}</button>
          ))}
        </div>
        <div style={{ height: 12 }} />
      </div>

      <div style={{ padding: '1rem' }}>
        {loading
          ? <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Loading...</div>
          : filtered.length === 0
          ? <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>No completed tasks yet.</div>
          : filtered.map(task => (
            <div key={task.id} style={{ background: '#fff', borderRadius: 14, padding: '1rem', marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{task.title}</div>
                  {task.animal_name && <div style={{ fontSize: 12, color: '#888' }}>🐄 {task.animal_name}</div>}
                  {task.completion_note && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>💬 {task.completion_note}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    background: task.status === 'flagged' ? '#FEF2F2' : '#f0faf6',
                    color: task.status === 'flagged' ? '#E24B4A' : '#1D9E75',
                    marginBottom: 4,
                  }}>
                    {task.status === 'flagged' ? '🚩 Flagged' : '✓ Done'}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{task.completed_at ? fmtDate(task.completed_at) : fmtDate(task.due_date)}</div>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── PROFILE ───────────────────────────────────────────────────────────────────
function ProfileScreen({ employee, tenant, onSignOut, brandColor }) {
  const initials = employee?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f2', paddingBottom: 80 }}>
      <div style={{ background: '#fff', padding: '3rem 1.25rem 1.5rem', borderBottom: '1px solid #eee', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: brandColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, margin: '0 auto 12px' }}>
          {initials}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{employee?.fullName}</div>
        <div style={{ fontSize: 14, color: '#888', marginTop: 2 }}>{employee?.jobRole}</div>
        <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>{tenant?.name}</div>
      </div>

      <div style={{ padding: '1rem' }}>
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
          {[
            { label: 'Farm', value: tenant?.name },
            { label: 'Role', value: employee?.jobRole },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #f5f5f5', fontSize: 14 }}>
              <span style={{ color: '#888' }}>{label}</span>
              <span style={{ fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>

        <button onClick={onSignOut}
          style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#FEF2F2', color: '#E24B4A', border: '1px solid #fcc', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function EmployeePortal() {
  const [token, setToken]       = useState(() => localStorage.getItem('emp_token') || '');
  const [employee, setEmployee] = useState(null);
  const [tenant, setTenant]     = useState(null);
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [tab, setTab]           = useState('tasks');
  const [selectedTask, setSelectedTask] = useState(null);
  const [sheet, setSheet]       = useState(null); // { task, isFlagging }
  const [doneTask, setDoneTask] = useState(null); // { task, value }
  const [submitting, setSubmitting] = useState(false);

  const brandColor = tenant?.primaryColor || '#1D9E75';

  useEffect(() => { if (token) verifyAndLoad(); }, []);

  async function verifyAndLoad() {
    try {
      const res = await fetch(`${API}/employee-auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployee(data.employee);
      setTenant(data.tenant);
      await loadTasks();
    } catch {
      localStorage.removeItem('emp_token');
      setToken('');
    }
  }

  async function loadTasks() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/employee-auth/my-tasks?status=active`, { headers: { Authorization: `Bearer ${token}` } });
      setTasks(await res.json());
    } catch {}
    finally { setLoading(false); }
  }

  async function handleStart(taskId) {
    await fetch(`${API}/tasks/${taskId}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'in_progress' })
    });
    await loadTasks();
    setSelectedTask(t => t ? { ...t, status: 'in_progress' } : null);
  }

  async function handleSubmitComplete(note, value) {
    const task = sheet.task;
    const status = sheet.isFlagging ? 'flagged' : 'completed';
    setSubmitting(true);
    try {
      await fetch(`${API}/tasks/${task.id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, completion_note: note, value: value || null })
      });
      setSheet(null);
      setSelectedTask(null);
      if (!sheet.isFlagging) setDoneTask({ task, value });
      await loadTasks();
    } catch {}
    finally { setSubmitting(false); }
  }

  function handleLogin(data) {
    setToken(data.token);
    setEmployee(data.employee);
    setTenant(data.tenant);
    loadTasks();
  }

  function handleSignOut() {
    localStorage.removeItem('emp_token');
    setToken(''); setEmployee(null); setTenant(null); setTasks([]);
  }

  // Not logged in
  if (!token || !employee) {
    return <LoginScreen onLogin={handleLogin} brandColor={brandColor} />;
  }

  // Done confirmation screen
  if (doneTask) {
    return <DoneScreen task={doneTask.task} value={doneTask.value} onBack={() => { setDoneTask(null); setTab('tasks'); }} brandColor={brandColor} />;
  }

  // Task detail screen
  if (selectedTask) {
    return (
      <>
        <TaskDetail
          task={selectedTask}
          onBack={() => setSelectedTask(null)}
          onStart={handleStart}
          onComplete={task => setSheet({ task, isFlagging: false })}
          onFlag={task => setSheet({ task, isFlagging: true })}
          brandColor={brandColor}
        />
        {sheet && (
          <CompleteSheet
            task={sheet.task}
            isFlagging={sheet.isFlagging}
            onSubmit={handleSubmitComplete}
            onCancel={() => setSheet(null)}
            submitting={submitting}
            brandColor={brandColor}
          />
        )}
      </>
    );
  }

  // Main app with bottom nav
  return (
    <>
      {tab === 'tasks' && (
        <TaskList
          tasks={tasks} loading={loading} employee={employee}
          onSelectTask={setSelectedTask} onRefresh={loadTasks} brandColor={brandColor}
        />
      )}
      {tab === 'history' && <HistoryScreen token={token} brandColor={brandColor} />}
      {tab === 'profile' && <ProfileScreen employee={employee} tenant={tenant} onSignOut={handleSignOut} brandColor={brandColor} />}
      <BottomNav tab={tab} setTab={setTab} />
    </>
  );
}
