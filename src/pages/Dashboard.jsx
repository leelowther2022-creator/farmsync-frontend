import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../lib/api';

function fmt(n) {
  return '£' + Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then(setData)
      .catch(() => setError('Failed to load dashboard data. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  if (error) return (
    <div>
      <div className="page-header"><div className="page-title">Dashboard</div></div>
      <div className="alert alert-error">{error}</div>
    </div>
  );

  const profit = (data?.ytd?.profit) || 0;
  const hasExpenses = (data?.ytd?.expenses || 0) > 0;
  const hasIncome   = (data?.ytd?.income || 0) > 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">{new Date().getFullYear()} overview</div>
        </div>
      </div>

      {/* Welcome message for new accounts */}
      {!hasExpenses && !hasIncome && (
        <div style={{ background: 'var(--color-brand-light)', border: '0.5px solid var(--color-brand)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: 14, color: 'var(--color-brand-dark)' }}>
          Welcome! Start by adding your first expense or income record using the links in the sidebar.
        </div>
      )}

      {/* YTD metrics */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">Total income YTD</div>
          <div className="metric-value" style={{ color: 'var(--success)' }}>{fmt(data?.ytd?.income)}</div>
          <div className="metric-sub">This month: {fmt(data?.thisMonth?.income)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total expenses YTD</div>
          <div className="metric-value">{fmt(data?.ytd?.expenses)}</div>
          <div className="metric-sub">This month: {fmt(data?.thisMonth?.expenses)}</div>
        </div>
        <div className={`metric-card ${profit >= 0 ? 'positive' : 'negative'}`}>
          <div className="metric-label">Net profit YTD</div>
          <div className="metric-value">{fmt(profit)}</div>
          <div className="metric-sub">{profit >= 0 ? 'In the black' : 'In the red'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Active employees</div>
          <div className="metric-value">{data?.activeEmployees || 0}</div>
          <div className="metric-sub">On payroll</div>
        </div>
        {(data?.equipmentAlerts || 0) > 0 && (
          <div className="metric-card" style={{ borderColor: 'var(--warning)', background: 'var(--warning-bg)' }}>
            <div className="metric-label" style={{ color: 'var(--warning)' }}>Service due</div>
            <div className="metric-value" style={{ color: 'var(--warning)' }}>{data.equipmentAlerts}</div>
            <div className="metric-sub" style={{ color: 'var(--warning)' }}>Within 30 days</div>
          </div>
        )}
      </div>

      {/* Charts — only show if there's data */}
      {(hasExpenses || hasIncome) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>

          <div className="card">
            <div className="card-title">Income vs expenses — last 6 months</div>
            {(data?.monthlyTrend?.length || 0) === 0
              ? <div className="empty-state" style={{ padding: '1.5rem' }}><p>No data yet</p></div>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.monthlyTrend} barGap={4} barSize={14}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}
                      tickFormatter={v => '£' + (v >= 1000 ? (v/1000).toFixed(0)+'k' : v)} />
                    <Tooltip formatter={v => fmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid var(--border)' }} />
                    <Bar dataKey="income"   name="Income"   fill="var(--color-brand)" radius={[4,4,0,0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#d3d1c7"            radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>

          <div className="card">
            <div className="card-title">Expenses by category</div>
            {(data?.topCategories?.length || 0) === 0
              ? <div className="empty-state" style={{ padding: '1.5rem' }}><p>No expenses recorded yet</p></div>
              : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <PieChart width={140} height={140}>
                    <Pie data={data.topCategories} dataKey="total" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2}>
                      {data.topCategories.map((entry, i) => (
                        <Cell key={i} fill={entry.color || '#d3d1c7'} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div style={{ flex: 1 }}>
                    {data.topCategories.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span className="dot" style={{ background: c.color || '#d3d1c7' }} />
                          <span style={{ color: 'var(--text-secondary)' }}>{c.category || 'Uncategorised'}</span>
                        </div>
                        <span style={{ fontWeight: 600 }}>{fmt(c.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
          </div>
        </div>
      )}
    </div>
  );
}
