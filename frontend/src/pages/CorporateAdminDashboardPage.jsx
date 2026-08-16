import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { organizationService } from '../services/organizationService';

export default function CorporateAdminDashboardPage() {
  const { currentUser } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await organizationService.getOrganizationSummary();
      setSummary(data);
    } catch (err) {
      setError(err.message || 'Failed to load organization summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading Corporate Administration Center...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Corporate Admin Center</h1>
            <span className="badge badge-primary">{summary?.organizationCode}</span>
            <span className="badge badge-success">{summary?.status}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            {summary?.organizationName} &bull; Multi-Tenant Workspace & Role Administration
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/admin/organization" className="btn btn-secondary">
            🏢 Organization Settings
          </Link>
          <Link to="/admin/users" className="btn btn-primary">
            👥 Manage Users & Roles
          </Link>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)' }}>
          <p style={{ color: 'var(--danger)', margin: 0 }}>⚠️ {error}</p>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Organization Users</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-light)' }}>{summary?.totalUsers || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {summary?.activeUsers || 0} active &bull; {summary?.suspendedUsers || 0} suspended
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Registered Drivers</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8' }}>{summary?.totalDrivers || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {summary?.activeDrivers || 0} on duty / available
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Fleet Vehicles</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a855f7' }}>{summary?.totalVehicles || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {summary?.activeVehicles || 0} active in fleet
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Tenant Isolation</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.5rem' }}>
            🔒 Row-Level Enforced
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Strict tenant boundaries active
          </div>
        </div>
      </div>

      {/* Role Distribution & Quick Operations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>User Role Distribution</h3>
          {summary?.roleDistribution && Object.keys(summary.roleDistribution).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(summary.roleDistribution).map(([role, count]) => (
                <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                  <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{role.replace('_', ' ')}</span>
                  <span className="badge badge-primary">{count} users</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No user data available.</p>
          )}
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Administrative Controls</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/admin/users" className="btn btn-secondary" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
              ➕ Onboard New Employee / Manager
            </Link>
            <Link to="/admin/users" className="btn btn-secondary" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
              🛡️ Audit & Manage Account Access
            </Link>
            <Link to="/admin/organization" className="btn btn-secondary" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
              ⚙️ Configure Corporate Timezone & Contacts
            </Link>
            <Link to="/analytics" className="btn btn-secondary" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
              📊 View Transportation Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
