import { useEffect, useState } from 'react';
import api from '../lib/api';

function fmt(n) { return '£' + Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d) { if (!d) return '—'; const s = String(d).split('T')[0]; const [y,m,day] = s.split('-'); return `${day}/${m}/${y}`; }

const SOURCES = ['Milk Sales', 'Livestock Sales', 'Grain / Crop Sales', 'BPS Grant', 'SFI / ELMS', 'Agri-Environment Scheme', 'Contract Work', 'Other'];
const EMPTY = { source: '', description: '', amount: '', income_date: new Date().toISOString().split('T')[0], reference: '', notes: '' };

export default function Income() {
  const [income, setIncome]   = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  async function load() {
    setLoading(true);
    try {
      const [inc, sum] = await Promise.all([api.get('/income'), api.get('/income/summary')]);
      setIncome(inc);
      setSummary(sum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); setError(''); }
  function openEdit(rec) {
    setEditing(rec);
    setForm({
      source:      rec.source,
      description: rec.description || '',
      amount:      rec.amount,
      income_date: rec.income_date?.split('T')[0] || '',
      reference:   rec.reference || '',
      notes:       rec.notes || '',
    });
    setModal(true);
    setError('');
  }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await api.put(`/income/${editing.id}`, form);
      else         await api.post('/income', form);
      setModal(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, source) {
    if (!window.confirm(`Delete this ${source} record? This cannot be undone.`)) return;
    try {
      await api.delete(`/income/${id}`);
      setIncome(i => i.filter(x => x.id !== id));
    } catch (err) {
      alert('Failed to delete record. Please try again.');
    }
  }

  const total = income.reduce((s, r) => s + parseFloat(r.amount || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Income</div>
          <div className="page-subtitle">{income.length} records · Total: {fmt(total)}</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add income</button>
      </div>

      {/* Summary cards */}
      {summary.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
          {summary.map(s => (
            <div key={s.source} className="card" style={{ flex: '1 1 160px', padding: '0.85rem 1rem' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.source}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-brand)' }}>{fmt(s.total)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.count} payment{s.count != 1 ? 's' : ''}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        {loading
          ? <div className="loading-center"><div className="spinner" /></div>
          : income.length === 0
          ? <div className="empty-state"><p>No income recorded yet.</p></div>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Source</th><th>Description</th><th>Reference</th><th>Amount</th><th></th></tr></thead>
                <tbody>
                  {income.map(rec => (
                    <tr key={rec.id}>
                      <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(rec.income_date)}</td>
                      <td><span className="badge badge-green">{rec.source}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{rec.description || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rec.reference || '—'}</td>
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>{fmt(rec.amount)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn btn-sm btn-icon" onClick={() => openEdit(rec)} style={{ marginRight: 4 }}>✎</button>
                        <button className="btn btn-sm btn-icon" onClick={() => handleDelete(rec.id, rec.source)} style={{ color: 'var(--danger)' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit income' : 'Record income'}</div>
              <button className="btn btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Source *</label>
                <select className="form-input" required value={form.source}
                  onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                  <option value="">Select source...</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Optional detail"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount (£) *</label>
                  <input className="form-input" type="number" step="0.01" min="0.01" required placeholder="0.00"
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-input" type="date" required
                    value={form.income_date} onChange={e => setForm(f => ({ ...f, income_date: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reference</label>
                <input className="form-input" placeholder="e.g. milk statement ref"
                  value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2}
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
