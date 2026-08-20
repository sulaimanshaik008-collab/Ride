import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, Settings, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Globe, Phone, Mail, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { organizationService } from '../services/organizationService';

export default function OrganizationSettingsPage() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    timezone: 'UTC',
  });
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadOrganization = async () => {
    try {
      setLoading(true);
      const data = await organizationService.getCurrentOrganization();
      setOrganization(data);
      setFormData({
        name: data.name || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        address: data.address || '',
        timezone: data.timezone || 'UTC',
      });
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Failed to load organization settings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganization();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      const updated = await organizationService.updateCurrentOrganization(formData);
      setOrganization(updated);
      setMessage({ type: 'success', text: 'Organization profile and operational settings updated successfully!' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Failed to update organization settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <RefreshCw size={32} className="spin-animation" style={{ margin: '0 auto 1rem', color: '#059669' }} />
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading Organization Settings...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Settings size={28} color="#059669" />
            <span>Organization Settings</span>
          </h1>
          <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Manage corporate profile, headquarters address, and operational timezone
          </p>
        </div>
        <Link
          to="/admin"
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
          <ArrowLeft size={16} />
          <span>Back to Admin Center</span>
        </Link>
      </div>

      {message.text && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: `1.5px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: message.type === 'success' ? '#059669' : '#ef4444',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div
        style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 4px 25px rgba(0, 0, 0, 0.04)',
        }}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Organization Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Organization Code (Immutable)</label>
              <input
                type="text"
                value={organization?.organizationCode || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#f1f5f9',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#64748b',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'not-allowed',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Contact Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="transport@company.com"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Contact Phone</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+91 98765 43210"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Headquarters / Primary Office Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. 100 Technology Plaza, Suite 400, Austin, TX"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                color: '#0f172a',
                fontSize: '0.9rem',
                fontWeight: 600,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Operating Timezone</label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                color: '#0f172a',
                fontSize: '0.9rem',
                fontWeight: 700,
                outline: 'none',
              }}
            >
              <option value="UTC">UTC (Universal Time)</option>
              <option value="America/New_York">America/New_York (Eastern Time)</option>
              <option value="America/Chicago">America/Chicago (Central Time)</option>
              <option value="America/Denver">America/Denver (Mountain Time)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (Pacific Time)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.75rem 1.75rem',
                borderRadius: '10px',
                background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(19, 56, 44, 0.25)',
              }}
            >
              {saving ? 'Saving Changes...' : 'Save Organization Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
