import { useEffect, useState } from 'react';
import api from '../lib/api';

const TYPE_LABELS = {
  beef: '🐄 Beef cattle',
  dairy: '🐄 Dairy cattle',
  sheep: '🐑 Sheep',
  pigs: '🐷 Pigs',
  poultry: '🐔 Poultry',
};

const TYPE_OPTIONS = Object.entries(TYPE_LABELS);

const EVENT_LABELS = {
  weight: '⚖️ Weight',
  treatment: '💉 Treatment',
  movement: '📍 Movement',
  health_check: '🩺 Health check',
  birth: '🐣 Birth',
  death: '💀 Death',
  note: '📝 Note',
};

const EMPTY_ANIMAL = {
  tag: '', name: '', type: 'beef', is_group: false, group_size: '', dob: '', notes: ''
};

const EMPTY_EVENT = {
  animal_id: '', event_type: 'weight', event_date: new Date().toISOString().split('T')[0],
  value: '', unit: 'kg', location: '', notes: ''
};

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Livestock() {
  const [animals, setAnimals]       = useState([]);
  const [events, setEvents]         = useState([]);
  const [settings, setSettings]     = useState({ animal_types: [] });
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('animals'); // animals | events | settings
  const [animalModal, setAnimalModal] = useState(false);
  const [eventModal, setEventModal]   = useState(false);
  const [editing, setEditing]         = useState(null);
  const [animalForm, setAnimalForm]   = useState(EMPTY_ANIMAL);
  const [eventForm, setEventForm]     = useState(EMPTY_EVENT);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [a, e, s] = await Promise.all([
        api.get('/livestock/animals'),
        api.get('/livestock/events'),
        api.get('/livestock/settings'),
      ]);
      setAnimals(a);
      setEvents(e);
      setSettings(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ── ANIMAL CRUD ──────────────────────────────────────────────────────────────
  function openAddAnimal() {
    setEditing(null); setAnimalForm(EMPTY_ANIMAL); setAnimalModal(true); setError('');
  }
  function openEditAnimal(a) {
    setEditing(a);
    setAnimalForm({
      tag: a.tag || '', name: a.name || '', type: a.type,
      is_group: a.is_group, group_size: a.group_size || '',
      dob: a.dob?.split('T')[0] || '', notes: a.notes || ''
    });
    setAnimalModal(true); setError('');
  }

  async function saveAnimal(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...animalForm, group_size: animalForm.group_size || null, dob: animalForm.dob || null };
      if (editing) {
        await api.put(`/livestock/animals/${editing.id}`, payload);
      } else {
        await api.post('/livestock/animals', payload);
      }
      setAnimalModal(false);
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteAnimal(id, name) {
    if (!window.confirm(`Remove ${name || 'this animal'}?`)) return;
    await api.delete(`/livestock/animals/${id}`);
    loadAll();
  }

  // ── EVENT CRUD ───────────────────────────────────────────────────────────────
  function openAddEvent(animalId = '') {
    setEventForm({ ...EMPTY_EVENT, animal_id: animalId });
    setEventModal(true); setError('');
  }

  async function saveEvent(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/livestock/events', {
        ...eventForm,
        value: eventForm.value ? parseFloat(eventForm.value) : null,
      });
      setEventModal(false);
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── SETTINGS ─────────────────────────────────────────────────────────────────
  async function toggleType(type) {
    const current = settings.animal_types || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    const result = await api.put('/livestock/settings', { animal_types: updated });
    setSettings(result);
  }

  // ── ANIMAL DETAIL ────────────────────────────────────────────────────────────
  const animalEvents = selectedAnimal
    ? events.filter(e => e.animal_id === selectedAnimal.id)
    : [];

  if (selectedAnimal) {
    return (
      <div>
        <div className="page-header">
          <div>
            <button onClick={() => setSelectedAnimal(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, padding: 0 }}>
              ← Back to livestock
            </button>
            <div className="page-title">
              {selectedAnimal.tag ? `#${selectedAnimal.tag} · ` : ''}{selectedAnimal.name || TYPE_LABELS[selectedAnimal.type]}
            </div>
            <div className="page-subtitle">{TYPE_LABELS[selectedAnimal.type]}{selectedAnimal.is_group ? ` · Group of ${selectedAnimal.group_size || '?'}` : ''}</div>
          </div>
          <button className="btn btn-primary" onClick={() => openAddEvent(selectedAnimal.id)}>+ Log event</button>
        </div>

        {/* Animal info card */}
        <div className="card" style={{ marginBottom: '1rem', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {selectedAnimal.dob && <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Date of birth</div><div style={{ fontSize: 14, fontWeight: 500 }}>{fmtDate(selectedAnimal.dob)}</div></div>}
          {selectedAnimal.notes && <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Notes</div><div style={{ fontSize: 14 }}>{selectedAnimal.notes}</div></div>}
        </div>

        {/* Event timeline */}
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Event history</div>
        {animalEvents.length === 0
          ? <div className="card"><div className="empty-state"><p>No events logged yet.</p></div></div>
          : animalEvents.map(ev => (
            <div key={ev.id} className="card" style={{ padding: '0.75rem 1rem', marginBottom: 8, borderLeft: '3px solid var(--color-brand)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{EVENT_LABELS[ev.event_type] || ev.event_type}</div>
                  {ev.value && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ev.value} {ev.unit || ''}</div>}
                  {ev.location && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📍 {ev.location}</div>}
                  {ev.notes && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ev.notes}</div>}
                  {ev.task_title && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>From task: {ev.task_title}</div>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(ev.event_date)}</div>
              </div>
            </div>
          ))
        }

        {/* Event modal */}
        {eventModal && (
          <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setEventModal(false)}>
            <div className="modal">
              <div className="modal-header">
                <div className="modal-title">Log event</div>
                <button className="btn btn-icon" onClick={() => setEventModal(false)}>✕</button>
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={saveEvent}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Event type</label>
                    <select className="form-input" value={eventForm.event_type} onChange={e => setEventForm(f => ({ ...f, event_type: e.target.value }))}>
                      {Object.entries(EVENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input className="form-input" type="date" value={eventForm.event_date} onChange={e => setEventForm(f => ({ ...f, event_date: e.target.value }))} />
                  </div>
                </div>
                {(eventForm.event_type === 'weight') && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Weight</label>
                      <input className="form-input" type="number" step="0.1" placeholder="0.0" value={eventForm.value} onChange={e => setEventForm(f => ({ ...f, value: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Unit</label>
                      <select className="form-input" value={eventForm.unit} onChange={e => setEventForm(f => ({ ...f, unit: e.target.value }))}>
                        <option value="kg">kg</option>
                        <option value="lb">lb</option>
                      </select>
                    </div>
                  </div>
                )}
                {eventForm.event_type === 'movement' && (
                  <div className="form-group">
                    <label className="form-label">Moved to</label>
                    <input className="form-input" placeholder="e.g. Field 3" value={eventForm.location} onChange={e => setEventForm(f => ({ ...f, location: e.target.value }))} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" rows={2} placeholder="Any details..." value={eventForm.notes} onChange={e => setEventForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn" onClick={() => setEventModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save event'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Livestock</div>
          <div className="page-subtitle">{animals.filter(a => a.active).length} animals / groups</div>
        </div>
        <button className="btn btn-primary" onClick={openAddAnimal}>+ Add animal</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem' }}>
        {[['animals','Animals'], ['events','Recent events'], ['settings','Settings']].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)} className={`btn btn-sm ${tab === val ? 'btn-primary' : ''}`}>{label}</button>
        ))}
      </div>

      {loading
        ? <div className="loading-center"><div className="spinner" /></div>
        : tab === 'animals' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {animals.length === 0
              ? <div className="card"><div className="empty-state"><p>No animals added yet. Click "+ Add animal" to get started.</p></div></div>
              : animals.map(a => (
                <div key={a.id} className="card" style={{ padding: '0.85rem 1rem', cursor: 'pointer' }}
                  onClick={() => setSelectedAnimal(a)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>
                          {a.tag ? `#${a.tag}` : ''} {a.name || TYPE_LABELS[a.type]}
                        </span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f0faf6', color: 'var(--color-brand)', fontWeight: 600 }}>
                          {TYPE_LABELS[a.type]}
                        </span>
                        {a.is_group && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Group · {a.group_size || '?'} head</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {a.event_count > 0 ? `${a.event_count} events · Last: ${fmtDate(a.last_event_date)}` : 'No events yet'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-sm btn-icon" onClick={() => openEditAnimal(a)}>✎</button>
                      <button className="btn btn-sm btn-icon" onClick={() => deleteAnimal(a.id, a.name || a.tag)} style={{ color: 'var(--danger)' }}>✕</button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        ) : tab === 'events' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.length === 0
              ? <div className="card"><div className="empty-state"><p>No events logged yet.</p></div></div>
              : events.slice(0, 30).map(ev => (
                <div key={ev.id} className="card" style={{ padding: '0.75rem 1rem', borderLeft: '3px solid var(--color-brand)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{EVENT_LABELS[ev.event_type] || ev.event_type}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {ev.animal_name || ev.animal_tag ? `${ev.animal_name || ''} ${ev.animal_tag ? '#' + ev.animal_tag : ''}` : TYPE_LABELS[ev.animal_type]}
                      </div>
                      {ev.value && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ev.value} {ev.unit || ''}</div>}
                      {ev.notes && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ev.notes}</div>}
                      {ev.task_title && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>From task: {ev.task_title}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(ev.event_date)}</div>
                  </div>
                </div>
              ))
            }
          </div>
        ) : (
          // Settings tab
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Animal types on this farm</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Only enabled types will appear in task assignment dropdowns.
            </div>
            {TYPE_OPTIONS.map(([type, label]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid var(--border)' }}>
                <span style={{ fontSize: 14 }}>{label}</span>
                <button onClick={() => toggleType(type)}
                  style={{
                    padding: '4px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: (settings.animal_types || []).includes(type) ? 'var(--color-brand)' : '#eee',
                    color: (settings.animal_types || []).includes(type) ? '#fff' : 'var(--text-secondary)',
                  }}>
                  {(settings.animal_types || []).includes(type) ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        )
      }

      {/* Add/Edit Animal Modal */}
      {animalModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setAnimalModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit animal' : 'Add animal'}</div>
              <button className="btn btn-icon" onClick={() => setAnimalModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={saveAnimal}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select className="form-input" required value={animalForm.type} onChange={e => setAnimalForm(f => ({ ...f, type: e.target.value }))}>
                    {TYPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tag / ID</label>
                  <input className="form-input" placeholder="e.g. UK123456" value={animalForm.tag} onChange={e => setAnimalForm(f => ({ ...f, tag: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" placeholder="e.g. Daisy, Flock A, Pen 3" value={animalForm.name} onChange={e => setAnimalForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="is_group" checked={animalForm.is_group} onChange={e => setAnimalForm(f => ({ ...f, is_group: e.target.checked }))} />
                <label htmlFor="is_group" style={{ fontSize: 13 }}>This is a group / flock / herd</label>
              </div>
              {animalForm.is_group && (
                <div className="form-group">
                  <label className="form-label">Number of animals</label>
                  <input className="form-input" type="number" placeholder="e.g. 120" value={animalForm.group_size} onChange={e => setAnimalForm(f => ({ ...f, group_size: e.target.value }))} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Date of birth</label>
                <input className="form-input" type="date" value={animalForm.dob} onChange={e => setAnimalForm(f => ({ ...f, dob: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} placeholder="Any additional details..." value={animalForm.notes} onChange={e => setAnimalForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setAnimalModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
