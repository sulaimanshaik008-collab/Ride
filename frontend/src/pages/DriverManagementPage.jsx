import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Filter, ShieldCheck, ShieldAlert, 
  Calendar, Phone, Mail, Award, CheckCircle, XCircle, AlertTriangle, 
  RefreshCw, Edit3, Eye, Clock, UserCheck, Activity, Building
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
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Driver management is reserved for Transport Managers and Corporate Administrators.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Driver Roster & Management</h1>
          <p className="page-subtitle">
            Manage corporate drivers, driver status, license compliance, and availability for trip assignments.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <UserPlus size={18} />
          Register New Driver
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* KPI METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Total Roster</span>
            <Users size={20} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginTop: '0.5rem' }}>
            {totalDrivers}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Active Drivers</span>
            <UserCheck size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '0.5rem' }}>
            {activeDrivers}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Available Now</span>
            <Activity size={20} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.5rem' }}>
            {availableDrivers}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Expired Licenses</span>
            <AlertTriangle size={20} color={expiredLicenses > 0 ? '#ef4444' : '#9ca3af'} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: expiredLicenses > 0 ? '#f87171' : '#fff', marginTop: '0.5rem' }}>
            {expiredLicenses}
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.4rem', fontSize: '0.88rem' }}
              placeholder="Search by driver name, email, phone, or license..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={14} color="#9ca3af" />
            <select
              className="tenant-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Driver Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              className="tenant-select"
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
            >
              <option value="ALL">All Availabilities</option>
              <option value="AVAILABLE">Available</option>
              <option value="UNAVAILABLE">Unavailable</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="OFF_DUTY">Off Duty</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}>
            <RefreshCw size={14} />
            Search
          </button>
        </form>
      </div>

      {/* DRIVER CARDS LIST */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading corporate drivers...</p>
        </div>
      ) : drivers.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 600 }}>
            No drivers found
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No drivers match the selected search criteria or tenant organization.
          </p>
        </div>
      ) : (
        <div className="rides-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {drivers.map((driver) => (
            <div key={driver.id} className="ride-card">
              <div className="ride-card-header">
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{driver.fullName}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{driver.department || 'Fleet Operations'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                  <span className={`status-badge ${driver.driverStatus}`}>
                    {driver.driverStatus}
                  </span>
                  <span className="preset-chip" style={{ fontSize: '0.72rem', background: 'rgba(6, 182, 212, 0.1)', color: '#38bdf8', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
                    {driver.availabilityStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {driver.isLicenseExpired && (
                <div className="alert alert-error" style={{ padding: '0.5rem 0.75rem', margin: 0, fontSize: '0.78rem' }}>
                  <AlertTriangle size={14} />
                  <strong>License Expired!</strong> Renewal required before trip assignment.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem' }}>
                <div className="meta-item">
                  <Mail size={14} color="#6366f1" />
                  <span>{driver.email}</span>
                </div>
                <div className="meta-item">
                  <Phone size={14} color="#10b981" />
                  <span>{driver.phoneNumber}</span>
                </div>
                <div className="meta-item">
                  <Award size={14} color="#f59e0b" />
                  <span>License: <strong style={{ color: 'var(--accent-cyan)' }}>{driver.licenseNumber}</strong> (Expires: {driver.licenseExpiryDate})</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem' }}>
                <button onClick={() => setViewingDriver(driver)} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                  <Eye size={14} />
                  Details
                </button>
                <button onClick={() => handleOpenEdit(driver)} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                  <Edit3 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setStatusModalDriver(driver);
                    setStatusFormData({
                      driverStatus: driver.driverStatus,
                      availabilityStatus: driver.availabilityStatus,
                      statusNotes: '',
                    });
                    setFormError(null);
                  }}
                  className="btn btn-primary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
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
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingDriver ? 'Edit Driver Information' : 'Register New Corporate Driver'}</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleFormSubmit} className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="E.g., Michael Vance"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              {!editingDriver && (
                <div className="form-group full-width">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="driver@corporate.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Fleet Operations"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">License Number *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="DL-890123-X"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">License Expiry Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.licenseExpiryDate}
                  onChange={(e) => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group full-width" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={formLoading}>
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
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{viewingDriver.fullName}</h2>
                <span className="booking-ref" style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  Driver ID: {viewingDriver.id.substring(0, 8)}
                </span>
              </div>
              <button onClick={() => setViewingDriver(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span className={`status-badge ${viewingDriver.driverStatus}`}>{viewingDriver.driverStatus}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Availability:</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>{viewingDriver.availabilityStatus.replace('_', ' ')}</strong>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Email</span>
                  <strong style={{ color: '#fff' }}>{viewingDriver.email}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Phone</span>
                  <strong style={{ color: '#fff' }}>{viewingDriver.phoneNumber}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Organization</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>{viewingDriver.organizationName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Department</span>
                  <strong style={{ color: '#fff' }}>{viewingDriver.department}</strong>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>License Number</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>{viewingDriver.licenseNumber}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>License Expiry</span>
                  <strong style={{ color: viewingDriver.isLicenseExpired ? '#f87171' : '#fff' }}>{viewingDriver.licenseExpiryDate}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATUS & AVAILABILITY CONTROL MODAL */}
      {statusModalDriver && (
        <div className="modal-overlay" onClick={() => setStatusModalDriver(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Manage Driver Status — {statusModalDriver.fullName}</h2>
              <button onClick={() => setStatusModalDriver(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Driver Operational Status</label>
                <select
                  className="form-control"
                  value={statusFormData.driverStatus}
                  onChange={(e) => setStatusFormData({ ...statusFormData, driverStatus: e.target.value })}
                >
                  <option value="ACTIVE">ACTIVE (Normal Duty)</option>
                  <option value="INACTIVE">INACTIVE (Off Roster / On Leave)</option>
                  <option value="SUSPENDED">SUSPENDED (Policy Lock)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Availability Status</label>
                <select
                  className="form-control"
                  value={statusFormData.availabilityStatus}
                  onChange={(e) => setStatusFormData({ ...statusFormData, availabilityStatus: e.target.value })}
                >
                  <option value="AVAILABLE">AVAILABLE (Ready for assignment)</option>
                  <option value="UNAVAILABLE">UNAVAILABLE (Unavailable)</option>
                  <option value="ON_TRIP">ON_TRIP (Currently driving)</option>
                  <option value="OFF_DUTY">OFF_DUTY (Shift finished)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Notes (Optional)</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="State reason for status update..."
                  value={statusFormData.statusNotes}
                  onChange={(e) => setStatusFormData({ ...statusFormData, statusNotes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setStatusModalDriver(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={formLoading}>
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
