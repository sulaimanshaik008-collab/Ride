import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Filter, ShieldCheck, ShieldAlert, 
  Calendar, Phone, Mail, Award, CheckCircle, XCircle, AlertTriangle, 
  RefreshCw, Edit3, Eye, Clock, UserCheck, Activity, Building, X
} from 'lucide-react';
import { driverService } from '../services/driverService';
import { useAuth } from '../context/AuthContext';

export const DriverManagementPage = () => {
  const { currentUser } = useAuth();

  const isManager = currentUser?.role === 'TRANSPORT_MANAGER' || 
                    currentUser?.role === 'CORPORATE_ADMIN' || 
                    currentUser?.role === 'SYSTEM_ADMIN';

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedAvailability, setSelectedAvailability] = useState('ALL');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [viewingDriver, setViewingDriver] = useState(null);
  const [statusModalDriver, setStatusModalDriver] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    department: 'Fleet Services',
    licenseNumber: '',
    licenseExpiryDate: '',
  });

  const [statusFormData, setStatusFormData] = useState({
    driverStatus: 'ACTIVE',
    availabilityStatus: 'AVAILABLE',
    statusNotes: '',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await driverService.getDrivers({
        search: searchQuery,
        status: selectedStatus,
        availability: selectedAvailability,
      });
      setDrivers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load driver roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManager) {
      fetchDrivers();
    }
  }, [currentUser, selectedStatus, selectedAvailability]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDrivers();
  };

  const handleOpenCreate = () => {
    setEditingDriver(null);
    setFormData({
      fullName: '',
      email: '',
      phoneNumber: '',
      department: 'Fleet Services',
      licenseNumber: '',
      licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      fullName: driver.fullName,
      email: driver.email,
      phoneNumber: driver.phoneNumber,
      department: driver.department || '',
      licenseNumber: driver.licenseNumber,
      licenseExpiryDate: driver.licenseExpiryDate,
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setFormError(null);

      if (editingDriver) {
        await driverService.updateDriver(editingDriver.id, {
          fullName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          department: formData.department.trim(),
          licenseNumber: formData.licenseNumber.trim(),
          licenseExpiryDate: formData.licenseExpiryDate,
        });
      } else {
        await driverService.createDriver({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          department: formData.department.trim(),
          licenseNumber: formData.licenseNumber.trim(),
          licenseExpiryDate: formData.licenseExpiryDate,
        });
      }

      setShowCreateModal(false);
      fetchDrivers();
    } catch (err) {
      setFormError(err.message || 'Failed to save driver details');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusModalDriver) return;

    try {
      setFormLoading(true);
      setFormError(null);

      if (statusFormData.driverStatus !== statusModalDriver.driverStatus) {
        await driverService.updateDriverStatus(statusModalDriver.id, {
          driverStatus: statusFormData.driverStatus,
          statusNotes: statusFormData.statusNotes,
        });
      }

      if (statusFormData.availabilityStatus !== statusModalDriver.availabilityStatus) {
        await driverService.updateDriverAvailability(statusModalDriver.id, {
          availabilityStatus: statusFormData.availabilityStatus,
        });
      }

      setStatusModalDriver(null);
      fetchDrivers();
    } catch (err) {
      setFormError(err.message || 'Failed to update driver status');
    } finally {
      setFormLoading(false);
    }
  };

  // Metrics
  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter((d) => d.driverStatus === 'ACTIVE').length;
  const availableDrivers = drivers.filter((d) => d.availabilityStatus === 'AVAILABLE').length;
  const expiredLicenses = drivers.filter((d) => d.isLicenseExpired).length;

  if (!isManager) {
    return (
      <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '20px', textAlign: 'center', padding: '3rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2920', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p style={{ color: '#64748b' }}>
          Driver management is reserved for Transport Managers and Corporate Administrators.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Users size={28} color="#059669" />
            <span>Driver Roster & Management</span>
          </h1>
          <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Manage corporate drivers, driver status, license compliance, and availability for trip assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
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
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(19, 56, 44, 0.25)',
          }}
        >
          <UserPlus size={18} />
          <span>Register New Driver</span>
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444', padding: '1rem 1.25rem', borderRadius: '12px', fontWeight: 700 }}>
          ⚠️ {error}
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Roster</span>
            <Users size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f2920', marginTop: '0.35rem' }}>
            {totalDrivers}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #a7f3d0', borderLeft: '4px solid #059669', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Active Drivers</span>
            <UserCheck size={20} color="#059669" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', marginTop: '0.35rem' }}>
            {activeDrivers}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #bfdbfe', borderLeft: '4px solid #2563eb', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#2563eb', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Available Now</span>
            <Activity size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#2563eb', marginTop: '0.35rem' }}>
            {availableDrivers}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: `1.5px solid ${expiredLicenses > 0 ? '#fecaca' : '#e2e8f0'}`, borderLeft: expiredLicenses > 0 ? '4px solid #ef4444' : '1.5px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: expiredLicenses > 0 ? '#ef4444' : '#64748b', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Expired Licenses</span>
            <AlertTriangle size={20} color={expiredLicenses > 0 ? '#ef4444' : '#9ca3af'} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: expiredLicenses > 0 ? '#ef4444' : '#0f2920', marginTop: '0.35rem' }}>
            {expiredLicenses}
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div
        style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1.1rem 1.25rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              style={{
                width: '100%',
                paddingLeft: '2.35rem',
                paddingRight: '0.75rem',
                paddingTop: '0.55rem',
                paddingBottom: '0.55rem',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                color: '#0f172a',
                fontSize: '0.875rem',
                fontWeight: 600,
                outline: 'none',
              }}
              placeholder="Search by driver name, email, phone, or license..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={14} color="#64748b" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '0.55rem 0.75rem',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                color: '#0f172a',
                fontSize: '0.85rem',
                fontWeight: 700,
                outline: 'none',
              }}
            >
              <option value="ALL">All Driver Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              style={{
                padding: '0.55rem 0.75rem',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                color: '#0f172a',
                fontSize: '0.85rem',
                fontWeight: 700,
                outline: 'none',
              }}
            >
              <option value="ALL">All Availabilities</option>
              <option value="AVAILABLE">Available</option>
              <option value="UNAVAILABLE">Unavailable</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="OFF_DUTY">Off Duty</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '8px',
              background: '#f8faf9',
              border: '1.5px solid #e2e8f0',
              color: '#0f2920',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <RefreshCw size={14} />
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* DRIVER CARDS LIST */}
      {loading ? (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 0.75rem', color: '#059669' }} />
          <p style={{ color: '#64748b', fontWeight: 600 }}>Loading corporate drivers...</p>
        </div>
      ) : drivers.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <Users size={36} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ color: '#0f2920', marginBottom: '0.25rem', fontSize: '1.1rem', fontWeight: 900 }}>
            No drivers found
          </p>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            No drivers match the selected search criteria or tenant organization.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.25rem' }}>
          {drivers.map((driver) => (
            <div
              key={driver.id}
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '18px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>{driver.fullName}</h3>
                  <span style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 600 }}>{driver.department || 'Fleet Operations'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      background: driver.driverStatus === 'ACTIVE' ? '#ecfdf5' : '#fef2f2',
                      color: driver.driverStatus === 'ACTIVE' ? '#059669' : '#ef4444',
                      border: `1px solid ${driver.driverStatus === 'ACTIVE' ? '#a7f3d0' : '#fecaca'}`,
                    }}
                  >
                    {driver.driverStatus}
                  </span>
                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      background: driver.availabilityStatus === 'AVAILABLE' ? '#eff6ff' : '#f8faf9',
                      color: driver.availabilityStatus === 'AVAILABLE' ? '#2563eb' : '#64748b',
                      border: `1px solid ${driver.availabilityStatus === 'AVAILABLE' ? '#bfdbfe' : '#e2e8f0'}`,
                    }}
                  >
                    {driver.availabilityStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {driver.isLicenseExpired && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                  <AlertTriangle size={14} />
                  <span><strong>License Expired!</strong> Renewal required before trip assignment.</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', borderTop: '1.5px solid #f1f5f9', paddingTop: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={14} color="#2563eb" />
                  <span style={{ color: '#0f2920', fontWeight: 600 }}>{driver.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={14} color="#059669" />
                  <span style={{ color: '#0f2920', fontWeight: 600 }}>{driver.phoneNumber}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={14} color="#d97706" />
                  <span>License: <strong style={{ color: '#0f2920' }}>{driver.licenseNumber}</strong> (Expires: {driver.licenseExpiryDate})</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1.5px solid #f1f5f9', paddingTop: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => setViewingDriver(driver)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    color: '#0f2920',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Eye size={14} />
                  <span>Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(driver)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    color: '#0f2920',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Edit3 size={14} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusModalDriver(driver);
                    setStatusFormData({
                      driverStatus: driver.driverStatus,
                      availabilityStatus: driver.availabilityStatus,
                      statusNotes: '',
                    });
                    setFormError(null);
                  }}
                  style={{
                    padding: '0.45rem 0.95rem',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(19, 56, 44, 0.2)',
                  }}
                >
                  Status / Availability
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT DRIVER MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              width: '100%',
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
              color: '#0f2920',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>
                {editingDriver ? 'Edit Driver Information' : 'Register New Corporate Driver'}
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 700, fontSize: '0.85rem' }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Full Name *</label>
                <input
                  type="text"
                  placeholder="E.g., Michael Vance"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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

              {!editingDriver && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Email Address *</label>
                  <input
                    type="email"
                    placeholder="driver@corporate.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Phone Number *</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
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
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Department</label>
                  <input
                    type="text"
                    placeholder="Fleet Operations"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>License Number *</label>
                  <input
                    type="text"
                    placeholder="DL-890123-X"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
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
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>License Expiry Date *</label>
                  <input
                    type="date"
                    value={formData.licenseExpiryDate}
                    onChange={(e) => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
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
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#64748b',
                    border: '1.5px solid #e2e8f0',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(19, 56, 44, 0.25)',
                  }}
                >
                  {formLoading ? 'Saving...' : editingDriver ? 'Update Driver' : 'Register Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRIVER DETAILS MODAL */}
      {viewingDriver && (
        <div className="modal-overlay" onClick={() => setViewingDriver(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
              color: '#0f2920',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>{viewingDriver.fullName}</h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  Driver ID: {viewingDriver.id.substring(0, 8)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingDriver(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Status:</span>
                <span style={{ fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '6px', background: viewingDriver.driverStatus === 'ACTIVE' ? '#ecfdf5' : '#fef2f2', color: viewingDriver.driverStatus === 'ACTIVE' ? '#059669' : '#ef4444' }}>
                  {viewingDriver.driverStatus}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Availability:</span>
                <strong style={{ color: '#2563eb' }}>{viewingDriver.availabilityStatus.replace('_', ' ')}</strong>
              </div>

              <div style={{ background: '#f8faf9', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Email</span>
                  <strong style={{ color: '#0f2920' }}>{viewingDriver.email}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Phone</span>
                  <strong style={{ color: '#0f2920' }}>{viewingDriver.phoneNumber}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Organization</span>
                  <strong style={{ color: '#059669' }}>{viewingDriver.organizationName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Department</span>
                  <strong style={{ color: '#0f2920' }}>{viewingDriver.department}</strong>
                </div>
              </div>

              <div style={{ background: '#f8faf9', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>License Number</span>
                  <strong style={{ color: '#2563eb' }}>{viewingDriver.licenseNumber}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>License Expiry</span>
                  <strong style={{ color: viewingDriver.isLicenseExpired ? '#ef4444' : '#0f2920' }}>{viewingDriver.licenseExpiryDate}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATUS & AVAILABILITY CONTROL MODAL */}
      {statusModalDriver && (
        <div className="modal-overlay" onClick={() => setStatusModalDriver(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
              color: '#0f2920',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>
                Manage Driver Status — {statusModalDriver.fullName}
              </h2>
              <button
                type="button"
                onClick={() => setStatusModalDriver(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 700, fontSize: '0.85rem' }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Driver Operational Status</label>
                <select
                  value={statusFormData.driverStatus}
                  onChange={(e) => setStatusFormData({ ...statusFormData, driverStatus: e.target.value })}
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
                  <option value="ACTIVE">ACTIVE (Normal Duty)</option>
                  <option value="INACTIVE">INACTIVE (Off Roster / On Leave)</option>
                  <option value="SUSPENDED">SUSPENDED (Policy Lock)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Availability Status</label>
                <select
                  value={statusFormData.availabilityStatus}
                  onChange={(e) => setStatusFormData({ ...statusFormData, availabilityStatus: e.target.value })}
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
                  <option value="AVAILABLE">AVAILABLE (Ready for assignment)</option>
                  <option value="UNAVAILABLE">UNAVAILABLE (Unavailable)</option>
                  <option value="ON_TRIP">ON_TRIP (Currently driving)</option>
                  <option value="OFF_DUTY">OFF_DUTY (Shift finished)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Reason / Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="State reason for status update..."
                  value={statusFormData.statusNotes}
                  onChange={(e) => setStatusFormData({ ...statusFormData, statusNotes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setStatusModalDriver(null)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#64748b',
                    border: '1.5px solid #e2e8f0',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(19, 56, 44, 0.25)',
                  }}
                >
                  {formLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverManagementPage;
