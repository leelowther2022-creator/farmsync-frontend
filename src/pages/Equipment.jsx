import { useEffect, useState } from 'react';
import api from '../lib/api';

function fmt(n) { return '£' + Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

const EQ_EMPTY = { name: '', category: '', make: '', model: '', year: '', reg_number: '', purchase_date: '', purchase_price: '', current_value: '', next_service_date: '', notes: '' };
const SVC_EMPTY = { service_date: new Date().toISOString().split('T')[0], service_type: '', description: '', cost: '', supplier: '', next_service_date: '' };

export default function Equipment() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null); // 'equipment' | 'service'
  const [editing, setEditing]     = useState(null);
  const [serviceFor, setServiceFor] = useState(null);
  const [form, setForm]           = useState(EQ_EMPTY);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [serviceHistory, setServiceHistory] = useState([]);
  const [expanded, setExpanded]   = useState(null);

  async function load() {
    setLoading(true);
    const eq = await api.get('/equipment');
    setEquipment(eq); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggleExpand(eq) {
    if (expanded === eq.id) { setExpanded(null); return; }
    setExpanded(eq.id);
    const history = await api.get(`/equipment/${eq.id}/service`);
    setServiceHistory(history);
  }

  function openAdd()      { setEditing(null); setForm(EQ_EMPTY); setModal('equipment'); setError(''); }
  function openEdit(eq)   { setEditing(eq); setForm({ name: eq.name, category: eq.category||'', make: eq.make||'', model: eq.model||'', year: eq.year||'', reg_number: eq.reg_number||'', purchase_date: eq.purchase_date?.split('T')[0]||'', purchase_price: eq.purchase_price||'', current_value: eq.current_value||'', next_service_date: eq.next_service_date?.split('T')[0]||'', notes: eq.notes||'' }); setModal('equipment'); setError(''); }
  function openService(eq){ setServiceFor(eq); setForm(SVC_EMPTY); setModal('service'); setError(''); }

  async function handleSaveEq(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await api.put(`/equipment/${editing.id}`, form);
      else         await api.post('/equipment', form);
      setModal(null); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleSaveService(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post(`/equipment/${serviceFor.id}/service`, form);
      setModal(null); load();
      if (expanded === serviceFor.id) {
        const history = await api.get(`/equipment/${serviceFor.id}/service`);
        setServiceHistory(history);
      }
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  const daysUntil = d => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Equipment</div>
          <div className="page-subtitle">{equipment.length} machines</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add equipment</button>
      </div>

      {loading
        ? <div className="loading-center"><div className="spinner" /></div>
        : equipment.length === 0
        ? <div className="card"><div className="empty-state"><p>No equipment recorded yet.</p></div></div>
        : equipment.map(eq => {
          const days = daysUntil(eq.next_service_date);
          const serviceStatus = days === null ? null : days < 0 ? 'overdue' : days <= 14 ? 'soon' : 'ok';
          return (
            <div key={eq.id} className="card" style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{eq.name}</span>
                    {eq.category && <span className="badge badge-gray">{eq.category}</span>}
                    {serviceStatus === 'overdue' && <span className="badge badge-red">Service overdue</span>}
                    {serviceStatus === 'soon'    && <span className="badge badge-amber">Service in {days}d</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 12 }}>
                    {eq.reg_number && <span>Reg: <strong>{eq.reg_number}</strong></span>}
                    {eq.year       && <span>{eq.year}</span>}
                    {eq.last_service && <span>Last service: {eq.last_service?.split('T')[0]}</span>}
                    {eq.total_service_cost > 0 && <span>Total service cost: {fmt(eq.total_service_cost)}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm" onClick={() => openService(eq)}>+ Log service</button>
                  <button className="btn btn-sm btn-icon" onClick={() => openEdit(eq)}>✎</button>
                  <button className="btn btn-sm btn-icon" onClick={() => toggleExpand(eq)}>{expanded === eq.id ? '▲' : '▼'}</button>
                </div>
              </div>

              {expanded === eq.id && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '0.5px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>Service history</div>
                  {serviceHistory.length === 0
                    ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No service records yet.</p>
                    : (
                      <table style={{ width: '100%', fontSize: 13 }}>
                        <thead><tr><th style={{ textAlign: 'left', paddingBottom: 6, color: 'var(--text-muted)', fontSize: 11 }}>Date</th><th>Type</th><th>Supplier</th><th>Cost</th><th>Next service</th></tr></thead>
                        <tbody>
                          {serviceHistory.map(s => (
                            <tr key={s.id}>
                              <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>{s.service_date?.split('T')[0]}</td>
                              <td style={{ fontWeight: 500 }}>{s.service_type}</td>
                              <td style={{ color: 'var(--text-secondary)' }}>{s.supplier || '—'}</td>
                              <td>{s.cost ? fmt(s.cost) : '—'}</td>
                              <td style={{ color: 'var(--text-muted)' }}>{s.next_service_date?.split('T')[0] || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  }
                </div>
              )}
            </div>
          );
        })
      }

      {/* Equipment modal */}
      {modal === 'equipment' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit equipment' : 'Add equipment'}</div>
              <button className="btn btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSaveEq}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Name *</label><input className="form-input" required placeholder="John Deere 6R 155" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Category</label><input className="form-input" placeholder="Tractor" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
              </div>
              <div className="form-row-3">
                <div className="form-group"><label className="form-label">Make</label><input className="form-input" placeholder="John Deere" value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Model</label><input className="form-input" placeholder="6R 155" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Year</label><input className="form-input" type="number" placeholder="2022" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Reg number</label><input className="form-input" placeholder="AB12 CDE" value={form.reg_number} onChange={e => setForm(f => ({ ...f, reg_number: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Next service date</label><input className="form-input" type="date" value={form.next_service_date} onChange={e => setForm(f => ({ ...f, next_service_date: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Purchase price (£)</label><input className="form-input" type="number" step="0.01" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Current value (£)</label><input className="form-input" type="number" step="0.01" value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service modal */}
      {modal === 'service' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Log service — {serviceFor?.name}</div>
              <button className="btn btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSaveService}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Service date *</label><input className="form-input" type="date" required value={form.service_date} onChange={e => setForm(f => ({ ...f, service_date: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Type *</label><input className="form-input" required placeholder="Annual service" value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={2} placeholder="What was done..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Cost (£)</label><input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Supplier / garage</label><input className="form-input" placeholder="Local Agri Services" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Next service date</label><input className="form-input" type="date" value={form.next_service_date} onChange={e => setForm(f => ({ ...f, next_service_date: e.target.value }))} /></div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Log service'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
