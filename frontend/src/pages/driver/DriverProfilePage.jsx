import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Car,
  Building,
  Phone,
  Mail,
  Calendar,
  Award,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { driverService } from '../../services/driverService';
import { useAuth } from '../../context/AuthContext';

export const DriverProfilePage = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await driverService.getSelfDriverProfile();
      setProfile(data);
    } catch (err) {
      setError(err.message || 'Failed to load driver profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.25s ease' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <User size={28} color="#059669" />
          <span>Driver Profile & Operations</span>
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
          Your driver credentials, licensing status, and assigned corporate vehicle specs.
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444', padding: '0.85rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 0.75rem auto' }} />
          <div>Loading driver profile...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Driver ID Card */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #a7f3d0',
              borderRadius: '20px',
              padding: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem',
              boxShadow: '0 8px 30px rgba(5, 150, 105, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  boxShadow: '0 4px 14px rgba(19, 56, 44, 0.3)',
                }}
              >
                {currentUser?.fullName?.charAt(0) || 'D'}
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>
                  {profile?.fullName || currentUser?.fullName}
                </h2>
                <div style={{ fontSize: '0.875rem', color: '#059669', fontWeight: 800, marginTop: '2px' }}>
                  License: {profile?.licenseNumber || 'DL-ACME-9081'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                  {profile?.organizationName || currentUser?.organizationName || 'Acme Global Corp'} &bull; {profile?.department || 'Fleet Services'}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>
                License Expiry
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: profile?.isLicenseExpired ? '#ef4444' : '#0f2920', marginTop: '2px' }}>
                {profile?.licenseExpiryDate || '2028-12-31'}
              </div>
              <span style={{ fontSize: '0.775rem', color: profile?.isLicenseExpired ? '#ef4444' : '#059669', fontWeight: 800 }}>
                {profile?.isLicenseExpired ? 'Expired ⚠️' : 'Active & Valid ✓'}
              </span>
            </div>
          </div>

          {/* Detailed Info Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Contact Details */}
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f2920', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Phone size={18} color="#2563eb" />
                <span>Contact & Communication</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Phone Number</div>
                  <div style={{ fontWeight: 800, color: '#0f2920', marginTop: '2px' }}>{profile?.phoneNumber || currentUser?.phoneNumber || '+1 (555) 777-1001'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Corporate Email</div>
                  <div style={{ fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>{profile?.email || currentUser?.email}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Department</div>
                  <div style={{ fontWeight: 800, color: '#0f2920', marginTop: '2px' }}>{profile?.department || 'Fleet Operations'}</div>
                </div>
              </div>
            </div>

            {/* Corporate Organization */}
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f2920', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Building size={18} color="#059669" />
                <span>Fleet & Organization</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Organization Name</div>
                  <div style={{ fontWeight: 800, color: '#0f2920', marginTop: '2px' }}>{profile?.organizationName || 'Acme Global Corp'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Duty Status</div>
                  <div style={{ fontWeight: 800, color: '#059669', marginTop: '2px' }}>{profile?.driverStatus || 'ACTIVE'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Availability Mode</div>
                  <div style={{ fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>{profile?.availabilityStatus || 'AVAILABLE'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverProfilePage;
