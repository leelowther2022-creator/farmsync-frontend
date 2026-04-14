import { useEffect, useState } from 'react';
import api from '../lib/api';

function fmt(n) { return '£' + Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

const EMP_EMPTY = { full_name: '', role: '', hourly_rate: '', day_rate: '', phone: '', email: '', start_date: '', notes: '' };
const WAGE_EMPTY = { employee_id: '', pay_period_start: '', pay_period_end: '', hours_worked: '', days_worked: '', gross_amount: '', deductions: '0', net_amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'bank_transfer', notes: '' };

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [wages, setWages]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('employees');
  const [modal, setModal]         = useState(null); // 'employee' | 'wage'
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMP_EMPTY);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  async function load() {
    setLoading(true);
    const [emps, wgs] = await Promise.all([api.get('/employees'), api.get('/employees/wages')]);
    setEmployees(emps); setWages(wgs); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAddEmp()   { setEditing(null); setForm(EMP_EMPTY); setModal('employee'); setError(''); }
  function openEditEmp(e) { setEditing(e); setForm({ full_name: e.full_name, role: e.role||'', hourly_rate: e.hourly_rate||'', day_rate: e.day_rate||'', phone: e.phone||'', email: e.email||'', start_date: e.start_date?.split('T')[0]||'', notes: e.notes||'' }); setModal('employee'); setError(''); }
  function openAddWage()  { setEditing(null); setForm(WAGE_EMPTY); setModal('wage'); setError(''); }

  async function handleSaveEmp(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await api.put(`/employees/${editing.id}`, form);
      else         await api.post('/employees', form);
      setModal(null); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleSaveWage(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/employees/wages', form);
      setModal(null); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  // Auto-calc net when gross or deductions change
  function setWageField(field, value) {
    setForm(f => {
      const updated = { ...f, [field]: value };
      const gross = parseFloat(field === 'gross_amount' ? value : f.gross_amount) || 0;
      const ded   = parseFloat(field === 'deductions'   ? value : f.deductions)   || 0;
      updated.net_amount = (gross - ded).toFixed(2);
      return updated;
    });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Employees</div>
          <div className="page-subtitle">{employees.filter(e => e.active).length} active</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={openAddWage}>+ Log wage payment</button>
          <button className="btn btn-primary" onClick={openAddEmp}>+ Add employee</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', borderBottom: '0.5px solid var(--border)', paddingBottom: 0 }}>
        {['employees', 'wages'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: tab === t ? 600 : 400, color: tab === t ? 'var(--color-brand)' : 'var(--text-muted)', borderBottom: tab === t ? '2px solid var(--color-brand)' : '2px solid transparent', marginBottom: -1 }}>
            {t === 'employees' ? 'Employees' : 'Wage payments'}
          </button>
        ))}
      </div>

      {loading
        ? <div className="loading-center"><div className="spinner" /></div>
        : tab === 'employees'
        ? (
          <div className="card">
            {employees.length === 0
              ? <div className="empty-state"><p>No employees yet. Add your first one.</p></div>
              : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Name</th><th>Role</th><th>Rate</th><th>Total paid YTD</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {employees.map(emp => (
                        <tr key={emp.id}>
                          <td style={{ fontWeight: 500 }}>{emp.full_name}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{emp.role || '—'}</td>
                          <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {emp.hourly_rate ? `${fmt(emp.hourly_rate)}/hr` : emp.day_rate ? `${fmt(emp.day_rate)}/day` : '—'}
                          </td>
                          <td style={{ fontWeight: 600 }}>{fmt(emp.total_paid_ytd)}</td>
                          <td><span className={`badge ${emp.active ? 'badge-green' : 'badge-gray'}`}>{emp.active ? 'Active' : 'Inactive'}</span></td>
                          <td><button className="btn btn-sm btn-icon" onClick={() => openEditEmp(emp)}>✎</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        )
        : (
          <div className="card">
            {wages.length === 0
              ? <div className="empty-state"><p>No wage payments recorded yet.</p></div>
              : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Employee</th><th>Period</th><th>Hours/Days</th><th>Gross</th><th>Net</th><th>Payment date</th><th>Method</th></tr></thead>
                    <tbody>
                      {wages.map(w => (
                        <tr key={w.id}>
                          <td style={{ fontWeight: 500 }}>{w.employee_name}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{w.pay_period_start?.split('T')[0]} → {w.pay_period_end?.split('T')[0]}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{w.hours_worked ? `${w.hours_worked}h` : w.days_worked ? `${w.days_worked}d` : '—'}</td>
                          <td>{fmt(w.gross_amount)}</td>
                          <td style={{ fontWeight: 600 }}>{fmt(w.net_amount)}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{w.payment_date?.split('T')[0] || '—'}</td>
                          <td><span className="badge badge-gray">{w.payment_method?.replace('_', ' ')}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        )
      }

      {/* Employee modal */}
      {modal === 'employee' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit employee' : 'Add employee'}</div>
              <button className="btn btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSaveEmp}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Full name *</label><input className="form-input" required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Role / job title</label><input className="form-input" placeholder="Farmhand" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Hourly rate (£)</label><input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Day rate (£)</label><input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.day_rate} onChange={e => setForm(f => ({ ...f, day_rate: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Start date</label><input className="form-input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wage modal */}
      {modal === 'wage' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Log wage payment</div>
              <button className="btn btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSaveWage}>
              <div className="form-group">
                <label className="form-label">Employee *</label>
                <select className="form-input" required value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}>
                  <option value="">Select employee...</option>
                  {employees.filter(e => e.active).map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Period start *</label><input className="form-input" type="date" required value={form.pay_period_start} onChange={e => setForm(f => ({ ...f, pay_period_start: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Period end *</label><input className="form-input" type="date" required value={form.pay_period_end} onChange={e => setForm(f => ({ ...f, pay_period_end: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Hours worked</label><input className="form-input" type="number" step="0.5" placeholder="0" value={form.hours_worked} onChange={e => setForm(f => ({ ...f, hours_worked: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Days worked</label><input className="form-input" type="number" step="0.5" placeholder="0" value={form.days_worked} onChange={e => setForm(f => ({ ...f, days_worked: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Gross (£) *</label><input className="form-input" type="number" step="0.01" required placeholder="0.00" value={form.gross_amount} onChange={e => setWageField('gross_amount', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Deductions (£)</label><input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.deductions} onChange={e => setWageField('deductions', e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Net pay (£) *</label><input className="form-input" type="number" step="0.01" required value={form.net_amount} onChange={e => setForm(f => ({ ...f, net_amount: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Payment date</label><input className="form-input" type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">Payment method</label>
                <select className="form-input" value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Log payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
