import { useEffect, useState } from 'react';
import api from '../lib/api';

function fmt(n) { return '£' + Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d) { if (!d) return '—'; const s = String(d).split('T')[0]; const [y,m,day] = s.split('-'); return `${day}/${m}/${y}`; }

const EMPTY = { description: '', amount: '', expense_date: new Date().toISOString().split('T')[0], category_id: '', supplier: '', reference: '', notes: '' };

export default function Expenses() {
  const [expenses, setExpenses]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [filters, setFilters]       = useState({ from: '', to: '', category_id: '' });
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    api.get('/expenses/categories').then(setCategories).catch(() => {});
  }, []);

  async function load(p = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p });
      if (filters.from)        params.append('from', filters.from);
      if (filters.to)          params.append('to', filters.to);
      if (filters.category_id) params.append('category_id', filters.category_id);
      const res = await api.get('/expenses?' + params);
      setExpenses(res.data);
      setPagination({ total: res.total, totalPages: res.totalPages });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setPage(1); load(1); }, [filters]);
  useEffect(() => { load(page); }, [page]);

  function openAdd()     { setEditing(null); setForm(EMPTY); setModal(true); setError(''); }
  function openEdit(exp) {
    setEditing(exp);
    setForm({ description: exp.description, amount: exp.amount, expense_date: exp.expense_date?.split('T')[0] ?? '', category_id: exp.category_id ?? '', supplier: exp.supplier ?? '', reference: exp.reference ?? '', notes: exp.notes ?? '' });
    setModal(true); setError('');
  }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await api.put(`/expenses/${editing.id}`, form);
      else         await api.post('/expenses', form);
      setModal(false); load(page);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id, description) {
    if (!window.confirm(`Delete "${description}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/expenses/${id}`);
      load(page);
    } catch { alert('Failed to delete. Please try again.'); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Expenses</div>
          <div className="page-subtitle">{pagination.total} records total</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add expense</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">From</label>
            <input className="form-input" type="date" value={filters.from}
              onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} style={{ width: 150 }} />
          </div>
          <div>
            <label className="form-label">To</label>
            <input className="form-input" type="date" value={filters.to}
              onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} style={{ width: 150 }} />
          </div>
          <div>
            <label className="form-label">Category</label>
            <select className="form-input" value={filters.category_id}
              onChange={e => setFilters(f => ({ ...f, category_id: e.target.value }))} style={{ width: 180 }}>
              <option value="">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {(filters.from || filters.to || filters.category_id) && (
            <button className="btn btn-sm" onClick={() => setFilters({ from: '', to: '', category_id: '' })}>Clear filters</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading
          ? <div className="loading-center"><div className="spinner" /></div>
          : expenses.length === 0
          ? <div className="empty-state"><p>No expenses found.</p></div>
          : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Description</th><th>Category</th><th>Supplier</th><th>Amount</th><th></th></tr>
                  </thead>
                  <tbody>
                    {expenses.map(exp => (
                      <tr key={exp.id}>
                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(exp.expense_date)}</td>
                        <td style={{ fontWeight: 500 }}>{exp.description}</td>
                        <td>
                          {exp.category_name
                            ? <span className="badge badge-gray"><span className="dot" style={{ background: exp.category_color }} />{exp.category_name}</span>
                            : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                          }
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{exp.supplier || '—'}</td>
                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(exp.amount)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button className="btn btn-sm btn-icon" onClick={() => openEdit(exp)} style={{ marginRight: 4 }}>✎</button>
                          <button className="btn btn-sm btn-icon" onClick={() => handleDelete(exp.id, exp.description)} style={{ color: 'var(--danger)' }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '0.5px solid var(--border)' }}>
                  <button className="btn btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Previous</button>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {page} of {pagination.totalPages}</span>
                  <button className="btn btn-sm" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>Next →</button>
                </div>
              )}
            </>
          )
        }
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit expense' : 'Add expense'}</div>
              <button className="btn btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <input className="form-input" required placeholder="e.g. Feed delivery"
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
                    value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category_id}
                  onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                  <option value="">Uncategorised</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Supplier</label>
                  <input className="form-input" placeholder="e.g. Mole Valley"
                    value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reference / invoice no.</label>
                  <input className="form-input" placeholder="INV-1234"
                    value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} placeholder="Optional notes"
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
