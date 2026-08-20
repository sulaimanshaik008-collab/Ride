import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, Users, ShieldCheck, Car, Settings, BarChart3, UserPlus, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
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
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <RefreshCw size={32} className="spin-animation" style={{ margin: '0 auto 1rem', color: '#059669' }} />
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading Corporate Administration Center...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Building size={28} color="#059669" />
              <span>Corporate Admin Center</span>
            </h1>
            <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800 }}>
              {summary?.organizationCode || 'ORG-100'}
            </span>
            <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800 }}>
              {summary?.status || 'ACTIVE'}
            </span>
          </div>
          <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            <strong style={{ color: '#0f2920' }}>{summary?.organizationName || 'Acme Global Corp'}</strong> &bull; Multi-Tenant Workspace & Role Administration
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            to="/admin/organization"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              color: '#0f2920',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <Settings size={16} color="#64748b" />
            <span>Organization Settings</span>
          </Link>
          <Link
            to="/admin/users"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.875rem',
              textDecoration: 'none',
              boxShadow: '0 4px 15px rgba(19, 56, 44, 0.25)',
            }}
          >
            <Users size={16} />
            <span>Manage Users & Roles</span>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: 700 }}>
          ⚠️ {error}
        </div>
      )}

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '18px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ color: '#64748b', fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Total Organization Users
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f2920' }}>{summary?.totalUsers || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem', fontWeight: 600 }}>
            <span style={{ color: '#059669', fontWeight: 800 }}>{summary?.activeUsers || 0} active</span> &bull; {summary?.suspendedUsers || 0} suspended
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '18px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ color: '#64748b', fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Registered Drivers
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f2920' }}>{summary?.totalDrivers || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem', fontWeight: 600 }}>
            <span style={{ color: '#2563eb', fontWeight: 800 }}>{summary?.activeDrivers || 0}</span> on duty / available
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '18px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ color: '#64748b', fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Fleet Vehicles
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f2920' }}>{summary?.totalVehicles || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem', fontWeight: 600 }}>
            <span style={{ color: '#059669', fontWeight: 800 }}>{summary?.activeVehicles || 0}</span> active in fleet
          </div>
        </div>

        <div
          style={{
            background: '#ecfdf5',
            border: '1.5px solid #a7f3d0',
            borderRadius: '18px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(5, 150, 105, 0.08)',
          }}
        >
          <div style={{ color: '#059669', fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Tenant Isolation
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f2920', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
            <ShieldCheck size={22} color="#059669" />
            <span>Row-Level Enforced</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem', fontWeight: 600 }}>
            Strict corporate tenant boundaries
          </div>
        </div>
      </div>

      {/* Role Distribution & Quick Operations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '18px',
            padding: '1.75rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f2920', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} color="#2563eb" />
            <span>User Role Distribution</span>
          </h3>
          {summary?.roleDistribution && Object.keys(summary.roleDistribution).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(summary.roleDistribution).map(([role, count]) => (
                <div
                  key={role}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: '#f8faf9',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '10px',
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f2920' }}>{role.replace('_', ' ')}</span>
                  <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800 }}>
                    {count} users
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No user data available.</p>
          )}
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '18px',
            padding: '1.75rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f2920', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="#059669" />
            <span>Administrative Controls</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              to="/admin/users"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                background: '#f8faf9',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                color: '#0f2920',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              <UserPlus size={18} color="#059669" />
              <span>Onboard New Employee / Manager</span>
            </Link>
            <Link
              to="/admin/users"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                background: '#f8faf9',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                color: '#0f2920',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              <ShieldAlert size={18} color="#2563eb" />
              <span>Audit & Manage Account Access</span>
            </Link>
            <Link
              to="/admin/organization"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                background: '#f8faf9',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                color: '#0f2920',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              <Settings size={18} color="#d97706" />
              <span>Configure Corporate Timezone & Contacts</span>
            </Link>
            <Link
              to="/analytics"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                background: '#f8faf9',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                color: '#0f2920',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              <BarChart3 size={18} color="#7c3aed" />
              <span>View Transportation Analytics</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
