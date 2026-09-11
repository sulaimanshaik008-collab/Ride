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
  RefreshCw,
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Save
} from 'lucide-react';
import { driverService } from '../../services/driverService';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../../components/UserAvatar';

export const DriverProfilePage = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    licenseNumber: '',
    licenseExpiryDate: '',
    vehiclePlateNumber: '',
    vehicleModel: '',
    insuranceNumber: '',
    insuranceExpiryDate: '',
    documentUrl: '',
    bankAccountNumber: '',
    bankIfscCode: '',
    bankAccountName: '',
    upiId: '',
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await driverService.getSelfDriverProfile();
      setProfile(data);
      if (data) {
        setFormData({
          licenseNumber: data.licenseNumber || '',
          licenseExpiryDate: data.licenseExpiryDate || '',
          vehiclePlateNumber: data.vehiclePlateNumber || '',
          vehicleModel: data.vehicleModel || '',
          insuranceNumber: data.insuranceNumber || '',
          insuranceExpiryDate: data.insuranceExpiryDate || '',
          documentUrl: data.documentUrl || '',
          bankAccountNumber: data.bankAccountNumber || '',
          bankIfscCode: data.bankIfscCode || '',
          bankAccountName: data.bankAccountName || '',
          upiId: data.upiId || '',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load driver profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateDocuments = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg('');
      const updated = await driverService.updateSelfDocuments(formData);
      setProfile(updated);
      setSuccessMsg('Documents submitted successfully! Status updated to Pending Verification.');
    } catch (err) {
      setError(err.message || 'Failed to update documents');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#dcfce7', color: '#15803d', padding: '6px 14px', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>
            <CheckCircle2 size={16} /> Verified & Approved
          </span>
        );
      case 'PENDING_VERIFICATION':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fef3c7', color: '#b45309', padding: '6px 14px', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>
            <Clock size={16} /> Pending Manager Review
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fee2e2', color: '#b91c1c', padding: '6px 14px', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>
            <XCircle size={16} /> Documents Rejected
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', color: '#475569', padding: '6px 14px', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>
            <AlertCircle size={16} /> Unverified
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '860px', margin: '0 auto', animation: 'fadeIn 0.25s ease' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <User size={28} color="#059669" />
          <span>Driver Profile & Onboarding Documents</span>
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
          Update license, vehicle plate number, insurance, and bank payout credentials for Transport Manager verification.
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444', padding: '0.85rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', color: '#047857', padding: '0.85rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
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
              <UserAvatar user={currentUser || profile} size={60} />
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>
                  {profile?.fullName || currentUser?.fullName || currentUser?.email?.split('@')[0] || 'Driver Partner'}
                </h2>
                <div style={{ fontSize: '0.875rem', color: '#059669', fontWeight: 800, marginTop: '2px' }}>
                  License: {profile?.licenseNumber || 'Not set'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                  {profile?.organizationName || currentUser?.organizationName || 'Corporate Fleet'} &bull; {profile?.department || 'Fleet Operations'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>
                Verification Status
              </div>
              {getStatusBadge(profile?.verificationStatus)}
              {profile?.verifiedByName && (
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Approved by: {profile.verifiedByName}
                </div>
              )}
              {profile?.rejectionReason && (
                <div style={{ fontSize: '0.78rem', color: '#b91c1c', maxWidth: '240px', textAlign: 'right', fontWeight: 600 }}>
                  Reason: {profile.rejectionReason}
                </div>
              )}
            </div>
          </div>

          {/* Verification Status Alert Box */}
          {profile?.verificationStatus !== 'VERIFIED' && (
            <div style={{
              background: profile?.verificationStatus === 'REJECTED' ? '#fff1f2' : '#fefce8',
              border: `1.5px solid ${profile?.verificationStatus === 'REJECTED' ? '#fecdd3' : '#fde047'}`,
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem'
            }}>
              <ShieldCheck size={24} color={profile?.verificationStatus === 'REJECTED' ? '#e11d48' : '#ca8a04'} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.875rem', color: '#334155' }}>
                <div style={{ fontWeight: 800, color: profile?.verificationStatus === 'REJECTED' ? '#9f1239' : '#854d0e', marginBottom: '4px' }}>
                  {profile?.verificationStatus === 'REJECTED' ? 'Verification Rejected — Action Required' : 'Complete Verification to Receive Ride Allocations'}
                </div>
                {profile?.verificationStatus === 'REJECTED' ? (
                  <div>Your documents were rejected: <strong>{profile?.rejectionReason}</strong>. Please correct and resubmit below.</div>
                ) : (
                  <div>Transport Managers require approved Driving License, Vehicle Plate, and Insurance credentials before allocating employee corporate rides to your account.</div>
                )}
              </div>
            </div>
          )}

          {/* Documents & Details Form */}
          <form onSubmit={handleUpdateDocuments} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Vehicle & License Section */}
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f2920', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Car size={20} color="#059669" />
                <span>Driving License & Vehicle Credentials</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.15rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Driving License Number *
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    required
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="e.g. DL-1420110012345"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '5px' }}>
                    License Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="licenseExpiryDate"
                    required
                    value={formData.licenseExpiryDate}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Vehicle Plate Number *
                  </label>
                  <input
                    type="text"
                    name="vehiclePlateNumber"
                    required
                    value={formData.vehiclePlateNumber}
                    onChange={handleChange}
                    placeholder="e.g. KA-01-AB-1234"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Vehicle Make & Model *
                  </label>
                  <input
                    type="text"
                    name="vehicleModel"
                    required
                    value={formData.vehicleModel}
                    onChange={handleChange}
                    placeholder="e.g. Toyota Innova Crysta / Swift Dzire"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Insurance Policy Number
                  </label>
                  <input
                    type="text"
                    name="insuranceNumber"
                    value={formData.insuranceNumber}
                    onChange={handleChange}
                    placeholder="e.g. POL-88992211"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Insurance Expiry Date
                  </label>
                  <input
                    type="date"
                    name="insuranceExpiryDate"
                    value={formData.insuranceExpiryDate}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Document Verification Link (Google Drive / Cloud Storage URL)
                  </label>
                  <input
                    type="url"
                    name="documentUrl"
                    value={formData.documentUrl}
                    onChange={handleChange}
                    placeholder="https://drive.google.com/your-license-and-rc-copy"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>

            {/* Bank Payout Details */}
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f2920', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={20} color="#2563eb" />
                <span>Month-End Payout & Bank Settlement Details</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.15rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Account Holder Full Name
                  </label>
                  <input
                    type="text"
                    name="bankAccountName"
                    value={formData.bankAccountName}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Kumar"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    name="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={handleChange}
                    placeholder="e.g. 50100234567890"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '5px' }}>
                    IFSC / Routing Code
                  </label>
                  <input
                    type="text"
                    name="bankIfscCode"
                    value={formData.bankIfscCode}
                    onChange={handleChange}
                    placeholder="e.g. HDFC0001234"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '5px' }}>
                    UPI ID (Instant Pay)
                  </label>
                  <input
                    type="text"
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleChange}
                    placeholder="e.g. driver@oksbi / 9876543210@paytm"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.85rem 2rem',
                  borderRadius: '12px',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                {saving ? (
                  <>
                    <RefreshCw size={18} className="spin-animation" />
                    <span>Saving & Submitting...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Submit Documents for Verification</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DriverProfilePage;

