import { useState } from 'react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() { return localStorage.getItem('fs_token'); }

async function downloadCSV(path, filename) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const year = new Date().getFullYear();

const EXPORTS = [
  {
    id: 'summary',
    title: 'P&L Summary',
    desc: `Full income vs expenses breakdown for ${year} — send straight to your accountant.`,
    file: `summary-${year}.csv`,
    path: `/export/summary.csv?year=${year}`,
    tag: 'Accountant-ready',
    tagColor: 'var(--success)',
    tagBg: 'var(--success-bg)',
  },
  {
    id: 'expenses',
    title: 'All expenses',
    desc: 'Every expense record with category, supplier, and reference number.',
    file: `expenses-${year}.csv`,
    path: `/export/expenses.csv`,
    tag: 'Expenses',
  },
  {
    id: 'income',
    title: 'Income records',
    desc: 'All income entries broken down by source.',
    file: `income-${year}.csv`,
    path: `/export/income.csv`,
    tag: 'Income',
  },
  {
    id: 'wages',
    title: 'Wage payments',
    desc: 'Full payroll log — gross, deductions, net, payment dates.',
    file: `wages-${year}.csv`,
    path: `/export/wages.csv`,
    tag: 'Payroll',
  },
  {
    id: 'equipment',
    title: 'Equipment register',
    desc: 'All machinery with values, service history, and total maintenance costs.',
    file: `equipment-${year}.csv`,
    path: `/export/equipment.csv`,
    tag: 'Equipment',
  },
];

export default function Export() {
  const [loading, setLoading] = useState({});
  const [error, setError]     = useState('');

  async function handleDownload(exp) {
    setLoading(l => ({ ...l, [exp.id]: true }));
    setError('');
    try {
      await downloadCSV(exp.path, exp.file);
    } catch (err) {
      setError(`Failed to download ${exp.title}. Try again.`);
    } finally {
      setLoading(l => ({ ...l, [exp.id]: false }));
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Export</div>
          <div className="page-subtitle">Download your data as CSV for your accountant or records</div>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {EXPORTS.map(exp => (
          <div key={exp.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Icon */}
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              ↓
            </div>
            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{exp.title}</span>
                <span style={{
                  fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 99,
                  background: exp.tagBg || 'var(--bg-secondary)',
                  color: exp.tagColor || 'var(--text-muted)',
                }}>
                  {exp.tag}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{exp.desc}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'monospace' }}>{exp.file}</div>
            </div>
            {/* Button */}
            <button
              className="btn btn-primary"
              style={{ flexShrink: 0, minWidth: 110, justifyContent: 'center' }}
              onClick={() => handleDownload(exp)}
              disabled={loading[exp.id]}
            >
              {loading[exp.id] ? 'Downloading...' : 'Download CSV'}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', fontSize: 13, color: 'var(--text-secondary)' }}>
        <strong style={{ color: 'var(--text-primary)' }}>Tip for your accountant</strong> — download the P&L Summary first. It opens cleanly in Excel and contains everything they need for your annual accounts. The other files are useful if they want to drill into the detail.
      </div>
    </div>
  );
}
