import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import { UserAvatar } from '../components/UserAvatar';
import {
  User,
  Mail,
  Phone,
  Building,
  Shield,
  Briefcase,
  Camera,
  Trash2,
  CheckCircle,
  AlertCircle,
  Save,
  RotateCcw,
  Upload,
} from 'lucide-react';

export const ProfilePage = () => {
  const { currentUser, refreshUser } = useAuth();

  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    department: '',
    role: '',
    organizationName: '',
    profileImageUrl: '',
  });

  const [initialData, setInitialData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [photoPreview, setPhotoPreview] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile();
      const loaded = {
        fullName: data.fullName || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        department: data.department || '',
        role: data.role || 'EMPLOYEE',
        organizationName: data.organizationName || 'Acme Global Corporation',
        profileImageUrl: data.profileImageUrl || '',
      };
      setProfileData(loaded);
      setInitialData(loaded);
      setPhotoPreview(data.profileImageUrl || null);
    } catch (err) {
      console.warn('Falling back to context profile:', err);
      if (currentUser) {
        const fallback = {
          fullName: currentUser.fullName || '',
          email: currentUser.email || '',
          phoneNumber: currentUser.phoneNumber || '',
          department: currentUser.department || '',
          role: currentUser.role || 'EMPLOYEE',
          organizationName: currentUser.organizationName || 'Acme Global Corporation',
          profileImageUrl: currentUser.profileImageUrl || '',
        };
        setProfileData(fallback);
        setInitialData(fallback);
        setPhotoPreview(currentUser.profileImageUrl || null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (feedback.message) setFeedback({ type: '', message: '' });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size <= 5MB
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Image size exceeds 5MB limit. Please choose a smaller photo.' });
      return;
    }

    // Validate format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setFeedback({ type: 'error', message: 'Unsupported file format. Please upload JPEG, PNG, or WEBP.' });
      return;
    }

    // Local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target.result);
    };
    reader.readAsDataURL(file);

    // Direct upload
    try {
      setUploadingPhoto(true);
      setFeedback({ type: '', message: '' });
      const updated = await profileService.uploadAvatar(file);
      setProfileData((prev) => ({ ...prev, profileImageUrl: updated.profileImageUrl }));
      setPhotoPreview(updated.profileImageUrl);
      if (refreshUser) await refreshUser();
      setFeedback({ type: 'success', message: 'Profile photo updated successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to upload photo.' });
      setPhotoPreview(profileData.profileImageUrl || null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    try {
      setUploadingPhoto(true);
      setFeedback({ type: '', message: '' });
      await profileService.removeAvatar();
      setProfileData((prev) => ({ ...prev, profileImageUrl: '' }));
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (refreshUser) await refreshUser();
      setFeedback({ type: 'success', message: 'Profile photo removed.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to remove photo.' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!profileData.fullName.trim()) {
      setFeedback({ type: 'error', message: 'Full name is required.' });
      return;
    }

    // Phone validation regex
    if (profileData.phoneNumber && profileData.phoneNumber.trim()) {
      const phoneRegex = /^(\+?[0-9]{1,4}[\s-]?)?(\(?[0-9]{2,5}\)?[\s-]?)?[0-9]{3,5}[\s-]?[0-9]{3,5}$/;
      if (!phoneRegex.test(profileData.phoneNumber.trim())) {
        setFeedback({ type: 'error', message: 'Invalid phone format. Please enter a valid telephone number.' });
        return;
      }
    }

    try {
      setSaving(true);
      setFeedback({ type: '', message: '' });

      const payload = {
        fullName: profileData.fullName.trim(),
        phoneNumber: profileData.phoneNumber.trim(),
        department: profileData.department.trim(),
      };

      const updated = await profileService.updateProfile(payload);
      setProfileData((prev) => ({
        ...prev,
        fullName: updated.fullName,
        phoneNumber: updated.phoneNumber || '',
        department: updated.department || '',
      }));
      setInitialData({
        ...profileData,
        fullName: updated.fullName,
        phoneNumber: updated.phoneNumber || '',
        department: updated.department || '',
      });

      if (refreshUser) await refreshUser();
      setFeedback({ type: 'success', message: 'Profile information saved successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setProfileData({ ...initialData });
    setFeedback({ type: '', message: '' });
  };

  const isDirty =
    profileData.fullName !== initialData.fullName ||
    profileData.phoneNumber !== initialData.phoneNumber ||
    profileData.department !== initialData.department;

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '2rem auto' }} />
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '880px', margin: '1.5rem auto', padding: '0 1rem 3rem' }}>
      {/* HEADER CARD */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #0f766e 100%)',
          borderRadius: '20px',
          padding: '2rem',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(6, 78, 59, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.75rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ position: 'relative' }}>
          {photoPreview ? (
            <img
              src={photoPreview}
              alt={profileData.fullName}
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3.5px solid #ffffff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            />
          ) : (
            <div
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 900,
                border: '3.5px solid #ffffff',
              }}
            >
              {profileData.fullName.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Change photo"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: '#059669',
              color: '#ffffff',
              border: '2px solid #ffffff',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            <Camera size={16} />
          </button>
        </div>

        <div style={{ flex: 1, minWidth: '220px' }}>
          <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.75rem', fontWeight: 900 }}>{profileData.fullName}</h1>
          <p style={{ margin: '0 0 0.5rem 0', opacity: 0.9, fontSize: '0.95rem' }}>{profileData.email}</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(4px)',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              {profileData.role.replace('_', ' ')}
            </span>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {profileData.organizationName}
            </span>
          </div>
        </div>
      </div>

      {/* ALERT FEEDBACK */}
      {feedback.message && (
        <div
          role="alert"
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1.5px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: feedback.type === 'success' ? '#065f46' : '#991b1b',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* MAIN FORM GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* PERSONAL & CONTACT INFORMATION */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            padding: '1.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <User size={20} color="#059669" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f2920', margin: 0 }}>Personal Details</h2>
          </div>

          <form onSubmit={handleSaveProfile} id="profile-form">
            <div style={{ marginBottom: '1.15rem' }}>
              <label htmlFor="fullName" style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={profileData.fullName}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.15rem' }}>
              <label htmlFor="phoneNumber" style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Registered Phone Number <span style={{ fontSize: '0.75rem', color: '#64748b' }}>(Used for driver/passenger dispatch)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={profileData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.15rem' }}>
              <label htmlFor="department" style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Department
              </label>
              <input
                id="department"
                name="department"
                type="text"
                value={profileData.department}
                onChange={handleInputChange}
                placeholder="e.g. Engineering, Sales, Human Resources"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                  fontWeight: 600,
                }}
              />
            </div>
          </form>
        </div>

        {/* ACCOUNT & PHOTO MANAGEMENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* PROFILE PHOTO CARD */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              padding: '1.75rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Camera size={20} color="#059669" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f2920', margin: 0 }}>Profile Photo</h2>
            </div>

            <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
              Upload a clear profile photo. Supported formats: JPEG, PNG, WEBP (Max 5MB).
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              aria-label="Upload profile image file"
            />

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1rem',
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                  opacity: uploadingPhoto ? 0.6 : 1,
                }}
              >
                <Upload size={16} />
                <span>{photoPreview ? 'Change Photo' : 'Upload Photo'}</span>
              </button>

              {photoPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploadingPhoto}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.65rem 0.9rem',
                    background: '#fef2f2',
                    color: '#ef4444',
                    border: '1.5px solid #fecaca',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={16} />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          {/* READ-ONLY TENANT & SECURITY CARD */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              padding: '1.75rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Shield size={20} color="#059669" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f2920', margin: 0 }}>Organization & Role</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Corporate Email</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{profileData.email}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Assigned Organization</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{profileData.organizationName}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Security Access Level</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#059669' }}>{profileData.role.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FORM ACTIONS */}
      <div
        style={{
          marginTop: '2rem',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.85rem',
          paddingTop: '1.5rem',
          borderTop: '1.5px solid #e2e8f0',
        }}
      >
        <button
          type="button"
          onClick={handleReset}
          disabled={!isDirty || saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.7rem 1.25rem',
            background: '#f8fafc',
            color: '#64748b',
            border: '1.5px solid #cbd5e1',
            borderRadius: '10px',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: !isDirty || saving ? 'not-allowed' : 'pointer',
            opacity: !isDirty ? 0.6 : 1,
          }}
        >
          <RotateCcw size={16} />
          <span>Cancel</span>
        </button>

        <button
          type="submit"
          form="profile-form"
          disabled={!isDirty || saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.7rem 1.5rem',
            background: '#059669',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '0.9rem',
            fontWeight: 800,
            cursor: !isDirty || saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
            opacity: !isDirty || saving ? 0.6 : 1,
          }}
        >
          <Save size={16} />
          <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
