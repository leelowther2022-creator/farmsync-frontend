import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const PRIORITY_COLORS = { urgent: '#E24B4A', normal: '#1D9E75', low: '#888780' };

const EVENT_TYPE_LABELS = {
  weight:       '⚖️ Weighed',
  treatment:    '💉 Treated',
  movement:     '📍 Moved',
  health_check: '🩺 Health check',
  birth:        '🐣 Birth recorded',
  note:         '📝 Note',
};

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export default function EmployeePortal() {
  const [screen, setScreen]       = useState('login');
  const [token, setToken]         = useState(() => localStorage.getItem('emp_token') || '');
  const [employee, setEmployee]   = useState(null);
  const [tenant, setTenant]       = useState(null);
  const [tasks, setTasks]         = useState([]);
  const [animalHistory, setAnimalHistory] = useState({});
  const [loading, setLoading]     = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [noteModal, setNoteModal] = useState(null);
  const [note, setNote]           = useState('');
  const [value, setValue]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (token) verifyAndLoad(); }, []);

  async function verifyAndLoad() {
    try {
      const res = await fetch(`${API}/employee-auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployee(data.employee);
      setTenant(data.tenant);
      setScreen('tasks');
      await loadTasks();
    } catch {
      localStorage.removeItem('emp_token');
      setToken('');
      setScreen('login');
    }
  }

  async function loadTasks() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/employee-auth/my-tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTasks(data);

      // Fetch last event for each linked animal
      const animalIds = [...new Set(data.filter(t => t.animal_id).map(t => t.animal_id))];
      if (animalIds.length > 0) {
        const histories = {};
        await Promise.all(animalIds.map(async (aid) => {
          try {
            const r = await fetch(`${API}/livestock/animals/${aid}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (r.ok) {
              const a = await r.json();
              if (a.events && a.events.length > 0) histories[aid] = a.events[0];
            }
          } catch {}
        }));
        setAnimalHistory(histories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault(); setLoginError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/employee-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('emp_token', data.token);
      setToken(data.token);
      setEmployee(data.employee);
      setTenant(data.tenant);
      setScreen('tasks');
      const tasksRes = await fetch(`${API}/employee-auth/my-tasks`, {
        headers: { Authorization: `Bearer ${data.token}` }
      });
      setTasks(await tasksRes.json());
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(task, status) {
    if (status === 'completed' || status === 'flagged') {
      setNoteModal({ taskId: task.id, status, task });
      setNote(''); setValue('');
      return;
    }
    await submitStatus(task.id, status, '', '');
  }

  async function submitStatus(taskId, status, completionNote, val) {
    setSubmitting(true);
    try {
      await fetch(`${API}/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, completion_note: completionNote, value: val || null })
      });
      setTasks(t => t.filter(x => x.id !== taskId));
      setNoteModal(null);
      setNote(''); setValue('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  function signOut() {
    localStorage.removeItem('emp_token');
    setToken(''); setEmployee(null); setTasks([]);
    setScreen('login');
  }

  const brandColor = tenant?.primaryColor || '#1D9E75';

  // ── LOGIN SCREEN ─────────────────────────────────────────────────────────────
  if (screen === 'login') {
    return (
      <div style={{ minHeight: '100vh', background: '#f7f6f2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: brandColor, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🌾</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>FarmSync</h1>
            <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Employee sign in</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            {loginError && <div style={{ background: '#FEF2F2', border: '1px solid #E24B4A', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', fontSize: 13, color: '#E24B4A' }}>{loginError}</div>}
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                <input type="email" required placeholder="your@email.com"
                  style={{ width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }}
                  value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                <input type="password" required placeholder="••••••••"
                  style={{ width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }}
                  value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '12px', borderRadius: 8, background: brandColor, color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── TASKS SCREEN ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f2', paddingBottom: 80 }}>
      <div style={{ background: brandColor, color: '#fff', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{employee?.fullName}</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>{tenant?.name} · {employee?.jobRole}</div>
        </div>
        <button onClick={signOut} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}>
          Sign out
        </button>
      </div>

      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>My tasks</h2>
          <button onClick={loadTasks} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>↻</button>
        </div>

        {loading
          ? <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Loading...</div>
          : tasks.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: 12 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 600 }}>All done!</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>No tasks assigned right now.</div>
            </div>
          )
          : tasks.map(task => {
            const lastEvent = task.animal_id ? animalHistory[task.animal_id] : null;
            const isLivestock = task.task_category && task.task_category !== 'general';

            return (
              <div key={task.id} style={{
                background: '#fff', borderRadius: 12, padding: '1rem',
                marginBottom: 10, borderLeft: `4px solid ${PRIORITY_COLORS[task.priority]}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}>
                {/* Title + priority */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, flex: 1, paddingRight: 8 }}>{task.title}</div>
                  {task.priority === 'urgent' && <span style={{ fontSize: 11, color: '#E24B4A', fontWeight: 700, whiteSpace: 'nowrap' }}>🚨 URGENT</span>}
                </div>

                {/* Description */}
                {task.description && (
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 8, lineHeight: 1.5 }}>{task.description}</div>
                )}

                {/* Animal context block */}
                {isLivestock && (task.animal_name || task.animal_tag) && (
                  <div style={{ background: '#f0faf6', border: '1px solid #c8eedd', borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 15 }}>🐄</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#1D9E75' }}>
                        {task.animal_name || ''}
                        {task.animal_tag ? ` · #${task.animal_tag}` : ''}
                      </span>
                      {task.animal_type && (
                        <span style={{ fontSize: 11, color: '#888', textTransform: 'capitalize' }}>({task.animal_type})</span>
                      )}
                    </div>
                    {lastEvent ? (
                      <div style={{ fontSize: 12, color: '#555' }}>
                        {EVENT_TYPE_LABELS[lastEvent.event_type] || lastEvent.event_type} {daysSince(lastEvent.event_date)}
                        {lastEvent.value ? ` · ${lastEvent.value}${lastEvent.unit ? ' ' + lastEvent.unit : ''}` : ''}
                        {lastEvent.notes ? ` · "${lastEvent.notes}"` : ''}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: '#aaa' }}>No previous events recorded</div>
                    )}
                  </div>
                )}

                {/* Date + location */}
                <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
                  {task.due_date && <span>📅 {fmtDate(task.due_date)}{task.due_time ? ` at ${task.due_time.slice(0,5)}` : ''}&nbsp;&nbsp;</span>}
                  {task.location && <span>📍 {task.location}</span>}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {task.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(task, 'in_progress')}
                        style={{ flex: 1, padding: '10px', borderRadius: 8, background: brandColor, color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                        ▶ Start
                      </button>
                      <button onClick={() => updateStatus(task, 'flagged')}
                        style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', color: '#E24B4A', border: '1px solid #E24B4A', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                        🚩
                      </button>
                    </>
                  )}
                  {task.status === 'in_progress' && (
                    <>
                      <button onClick={() => updateStatus(task, 'completed')}
                        style={{ flex: 2, padding: '10px', borderRadius: 8, background: '#1D9E75', color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                        ✓ Mark done
                      </button>
                      <button onClick={() => updateStatus(task, 'flagged')}
                        style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#FEF2F2', color: '#E24B4A', border: '1px solid #E24B4A', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                        🚩 Issue
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        }
      </div>

      {/* Completion / flag modal */}
      {noteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 0.75rem' }}>
              {noteModal.status === 'flagged' ? '🚩 Report an issue' : '✅ Mark as done'}
            </h3>

            {/* Animal context reminder */}
            {noteModal.task?.animal_name && (
              <div style={{ background: '#f0faf6', border: '1px solid #c8eedd', borderRadius: 8, padding: '8px 10px', marginBottom: '1rem', fontSize: 13 }}>
                🐄 <strong>{noteModal.task.animal_name}</strong>
                {noteModal.task.animal_tag ? ` · #${noteModal.task.animal_tag}` : ''}
              </div>
            )}

            {/* Value input for livestock tasks */}
            {noteModal.status === 'completed' && noteModal.task?.requires_value && noteModal.task?.value_label && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
                  {noteModal.task.value_label}
                </label>
                <input type="number" step="0.1" placeholder="Enter value"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 16, boxSizing: 'border-box' }}
                  value={value} onChange={e => setValue(e.target.value)} />
              </div>
            )}

            <p style={{ fontSize: 13, color: '#888', margin: '0 0 0.75rem' }}>
              {noteModal.status === 'flagged' ? 'Describe the issue so the farmer knows what to look at.' : 'Any notes for the farmer? (optional)'}
            </p>
            <textarea rows={3}
              placeholder={noteModal.status === 'flagged' ? 'e.g. Gate post broken, needs replacing' : 'e.g. All done, moved cattle to Field 6'}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box', marginBottom: '1rem', resize: 'none' }}
              value={note} onChange={e => setNote(e.target.value)} />

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setNoteModal(null); setNote(''); setValue(''); }}
                style={{ flex: 1, padding: '12px', borderRadius: 8, background: '#f0f0f0', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => submitStatus(noteModal.taskId, noteModal.status, note, value)} disabled={submitting}
                style={{ flex: 2, padding: '12px', borderRadius: 8, background: noteModal.status === 'flagged' ? '#E24B4A' : '#1D9E75', color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                {submitting ? 'Saving...' : noteModal.status === 'flagged' ? 'Report issue' : 'Mark done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
