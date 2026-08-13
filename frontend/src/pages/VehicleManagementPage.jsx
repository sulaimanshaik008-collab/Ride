import React, { useState, useEffect } from 'react';
import { 
  Car, Plus, Search, Filter, ShieldCheck, ShieldAlert, 
  Calendar, Wrench, AlertTriangle, RefreshCw, Edit3, Eye, 
  CheckCircle, XCircle, Activity, Gauge, Users
} from 'lucide-react';
import { vehicleService } from '../services/vehicleService';
import { useAuth } from '../context/AuthContext';

export const VehicleManagementPage = () => {
  const { currentUser } = useAuth();

  const isManager = currentUser?.role === 'TRANSPORT_MANAGER' || 
                    currentUser?.role === 'CORPORATE_ADMIN' || 
                    currentUser?.role === 'SYSTEM_ADMIN';

  const isDriver = currentUser?.role === 'DRIVER';

  const canManage = isManager;
  const canView = isManager || isDriver;

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedAvailability, setSelectedAvailability] = useState('ALL');
  const [selectedMaintenance, setSelectedMaintenance] = useState('ALL');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [viewingVehicle, setViewingVehicle] = useState(null);
  const [statusModalVehicle, setStatusModalVehicle] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    registrationNumber: '',
    vehicleType: 'SEDAN',
    make: '',
    model: '',
    manufacturingYear: new Date().getFullYear(),
    seatingCapacity: 4,
    insuranceExpiryDate: '',
    permitExpiryDate: '',
  });

  const [statusFormData, setStatusFormData] = useState({
    vehicleStatus: 'ACTIVE',
    availabilityStatus: 'AVAILABLE',
    maintenanceStatus: 'GOOD',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vehicleService.getVehicles({
        search: searchQuery,
        vehicleType: selectedType,
        status: selectedStatus,
        availability: selectedAvailability,
        maintenance: selectedMaintenance,
      });
      setVehicles(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load corporate vehicle fleet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      fetchVehicles();
    }
  }, [currentUser, selectedType, selectedStatus, selectedAvailability, selectedMaintenance]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVehicles();
  };

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    const defaultFutureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFormData({
      registrationNumber: '',
      vehicleType: 'SEDAN',
      make: '',
      model: '',
      manufacturingYear: new Date().getFullYear(),
      seatingCapacity: 4,
      insuranceExpiryDate: defaultFutureDate,
      permitExpiryDate: defaultFutureDate,
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      registrationNumber: vehicle.registrationNumber,
      vehicleType: vehicle.vehicleType,
      make: vehicle.make,
      model: vehicle.model,
      manufacturingYear: vehicle.manufacturingYear || new Date().getFullYear(),
      seatingCapacity: vehicle.seatingCapacity,
      insuranceExpiryDate: vehicle.insuranceExpiryDate || '',
      permitExpiryDate: vehicle.permitExpiryDate || '',
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setFormError(null);

      const payload = {
        registrationNumber: formData.registrationNumber.trim(),
        vehicleType: formData.vehicleType,
        make: formData.make.trim(),
        model: formData.model.trim(),
        manufacturingYear: parseInt(formData.manufacturingYear, 10),
        seatingCapacity: parseInt(formData.seatingCapacity, 10),
        insuranceExpiryDate: formData.insuranceExpiryDate || null,
        permitExpiryDate: formData.permitExpiryDate || null,
      };

      if (editingVehicle) {
        await vehicleService.updateVehicle(editingVehicle.id, payload);
      } else {
        await vehicleService.createVehicle(payload);
      }

      setShowCreateModal(false);
      fetchVehicles();
    } catch (err) {
      setFormError(err.message || 'Failed to save vehicle information');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusModalVehicle) return;

    try {
      setFormLoading(true);
      setFormError(null);

      if (statusFormData.vehicleStatus !== statusModalVehicle.vehicleStatus) {
        await vehicleService.updateVehicleStatus(statusModalVehicle.id, {
          vehicleStatus: statusFormData.vehicleStatus,
        });
      }

      if (statusFormData.maintenanceStatus !== statusModalVehicle.maintenanceStatus) {
        await vehicleService.updateVehicleMaintenance(statusModalVehicle.id, {
          maintenanceStatus: statusFormData.maintenanceStatus,
        });
      }

      if (statusFormData.availabilityStatus !== statusModalVehicle.availabilityStatus) {
        await vehicleService.updateVehicleAvailability(statusModalVehicle.id, {
          availabilityStatus: statusFormData.availabilityStatus,
        });
      }

      setStatusModalVehicle(null);
      fetchVehicles();
    } catch (err) {
      setFormError(err.message || 'Failed to update vehicle lifecycle state');
    } finally {
      setFormLoading(false);
    }
  };

  // Metrics calculation
  const totalFleet = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.vehicleStatus === 'ACTIVE').length;
  const availableVehicles = vehicles.filter((v) => v.availabilityStatus === 'AVAILABLE').length;
  const maintenanceVehicles = vehicles.filter((v) => v.maintenanceStatus === 'MAINTENANCE' || v.availabilityStatus === 'MAINTENANCE').length;
  const expiredDocsCount = vehicles.filter((v) => v.isInsuranceExpired || v.isPermitExpired).length;

  if (!canView) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Vehicle management is reserved for authorized corporate transport managers and operational personnel.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Corporate Vehicle Management</h1>
          <p className="page-subtitle">
            Maintain accurate fleet inventory, track vehicle availability, manage lifecycle states, and ensure compliance.
          </p>
        </div>

        {canManage && (
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <Plus size={18} />
            Add New Vehicle
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* KPI METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Total Fleet</span>
            <Car size={20} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginTop: '0.5rem' }}>
            {totalFleet}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Active Vehicles</span>
            <ShieldCheck size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '0.5rem' }}>
            {activeVehicles}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Available Now</span>
            <Activity size={20} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.5rem' }}>
            {availableVehicles}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Under Maintenance</span>
            <Wrench size={20} color={maintenanceVehicles > 0 ? '#f59e0b' : '#9ca3af'} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: maintenanceVehicles > 0 ? '#fbbf24' : '#fff', marginTop: '0.5rem' }}>
            {maintenanceVehicles}
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
              placeholder="Search by registration number, make, or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={14} color="#9ca3af" />
            <select
              className="tenant-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="ALL">All Vehicle Types</option>
              <option value="SEDAN">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="VAN">Van</option>
              <option value="MINIBUS">Minibus</option>
              <option value="BUS">Bus</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              className="tenant-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
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
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}>
            <RefreshCw size={14} />
            Search
          </button>
        </form>
      </div>

      {/* VEHICLES GRID */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading corporate fleet...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 600 }}>
            No vehicles found
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No vehicle records match your selected filters or organization context.
          </p>
        </div>
      ) : (
        <div className="rides-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="ride-card">
              <div className="ride-card-header">
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    {vehicle.registrationNumber}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                  <span className={`status-badge ${vehicle.vehicleStatus}`}>
                    {vehicle.vehicleStatus}
                  </span>
                  <span className="preset-chip" style={{ fontSize: '0.72rem', background: 'rgba(6, 182, 212, 0.1)', color: '#38bdf8', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
                    {vehicle.availabilityStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {(vehicle.isInsuranceExpired || vehicle.isPermitExpired) && (
                <div className="alert alert-error" style={{ padding: '0.5rem 0.75rem', margin: 0, fontSize: '0.78rem' }}>
                  <AlertTriangle size={14} />
                  <strong>Document Warning:</strong> {vehicle.isInsuranceExpired ? 'Insurance expired!' : ''} {vehicle.isPermitExpired ? 'Permit expired!' : ''}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem' }}>
                <div className="meta-item">
                  <Car size={14} color="#6366f1" />
                  <span>Type: <strong style={{ color: '#fff' }}>{vehicle.vehicleType}</strong></span>
                </div>
                <div className="meta-item">
                  <Users size={14} color="#10b981" />
                  <span>Capacity: <strong style={{ color: '#fff' }}>{vehicle.seatingCapacity} Seats</strong></span>
                </div>
                <div className="meta-item">
                  <Gauge size={14} color="#f59e0b" />
                  <span>Year: <strong style={{ color: '#fff' }}>{vehicle.manufacturingYear || 'N/A'}</strong></span>
                </div>
                <div className="meta-item">
                  <Wrench size={14} color="#ec4899" />
                  <span>Maintenance: <strong style={{ color: vehicle.maintenanceStatus === 'GOOD' ? '#34d399' : '#fbbf24' }}>{vehicle.maintenanceStatus}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem' }}>
                <button onClick={() => setViewingVehicle(vehicle)} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                  <Eye size={14} />
                  Details
                </button>
                {canManage && (
                  <>
                    <button onClick={() => handleOpenEdit(vehicle)} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                      <Edit3 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setStatusModalVehicle(vehicle);
                        setStatusFormData({
                          vehicleStatus: vehicle.vehicleStatus,
                          availabilityStatus: vehicle.availabilityStatus,
                          maintenanceStatus: vehicle.maintenanceStatus,
                        });
                        setFormError(null);
                      }}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Lifecycle & State
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT VEHICLE MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingVehicle ? 'Edit Vehicle Information' : 'Register New Corporate Vehicle'}</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleFormSubmit} className="form-grid">
              <div className="form-group">
                <label className="form-label">Registration Number *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="E.g., REG-ACME-88"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Type *</label>
                <select
                  className="form-control"
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  required
                >
                  <option value="SEDAN">SEDAN</option>
                  <option value="SUV">SUV</option>
                  <option value="VAN">VAN</option>
                  <option value="MINIBUS">MINIBUS</option>
                  <option value="BUS">BUS</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Make / Manufacturer *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="E.g., Toyota, Ford, Mercedes"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Model Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="E.g., Camry, Explorer, Sprinter"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Manufacturing Year</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="2024"
                  min="1900"
                  max="2030"
                  value={formData.manufacturingYear}
                  onChange={(e) => setFormData({ ...formData, manufacturingYear: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Seating Capacity *</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="4"
                  min="1"
                  max="100"
                  value={formData.seatingCapacity}
                  onChange={(e) => setFormData({ ...formData, seatingCapacity: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Insurance Expiry Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.insuranceExpiryDate}
                  onChange={(e) => setFormData({ ...formData, insuranceExpiryDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Permit Expiry Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.permitExpiryDate}
                  onChange={(e) => setFormData({ ...formData, permitExpiryDate: e.target.value })}
                />
              </div>

              <div className="form-group full-width" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={formLoading}>
                  {formLoading ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VEHICLE DETAILS MODAL */}
      {viewingVehicle && (
        <div className="modal-overlay" onClick={() => setViewingVehicle(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{viewingVehicle.make} {viewingVehicle.model}</h2>
                <span className="booking-ref" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Reg: {viewingVehicle.registrationNumber}
                </span>
              </div>
              <button onClick={() => setViewingVehicle(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span className={`status-badge ${viewingVehicle.vehicleStatus}`}>{viewingVehicle.vehicleStatus}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Availability:</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>{viewingVehicle.availabilityStatus.replace('_', ' ')}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Maintenance State:</span>
                <strong style={{ color: viewingVehicle.maintenanceStatus === 'GOOD' ? '#34d399' : '#fbbf24' }}>
                  {viewingVehicle.maintenanceStatus}
                </strong>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Vehicle Type</span>
                  <strong style={{ color: '#fff' }}>{viewingVehicle.vehicleType}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Seating Capacity</span>
                  <strong style={{ color: '#fff' }}>{viewingVehicle.seatingCapacity} Passengers</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Manufacturing Year</span>
                  <strong style={{ color: '#fff' }}>{viewingVehicle.manufacturingYear || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Organization</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>{viewingVehicle.organizationName}</strong>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Insurance Expiry</span>
                  <strong style={{ color: viewingVehicle.isInsuranceExpired ? '#f87171' : '#fff' }}>
                    {viewingVehicle.insuranceExpiryDate || 'N/A'} {viewingVehicle.isInsuranceExpired ? '(Expired)' : ''}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Permit Expiry</span>
                  <strong style={{ color: viewingVehicle.isPermitExpired ? '#f87171' : '#fff' }}>
                    {viewingVehicle.permitExpiryDate || 'N/A'} {viewingVehicle.isPermitExpired ? '(Expired)' : ''}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATUS, AVAILABILITY & MAINTENANCE CONTROL MODAL */}
      {statusModalVehicle && (
        <div className="modal-overlay" onClick={() => setStatusModalVehicle(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Manage Lifecycle — {statusModalVehicle.registrationNumber}</h2>
              <button onClick={() => setStatusModalVehicle(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Vehicle Lifecycle Status</label>
                <select
                  className="form-control"
                  value={statusFormData.vehicleStatus}
                  onChange={(e) => setStatusFormData({ ...statusFormData, vehicleStatus: e.target.value })}
                >
                  <option value="ACTIVE">ACTIVE (Operational)</option>
                  <option value="INACTIVE">INACTIVE (Deactivated / Soft Retired)</option>
                  <option value="SUSPENDED">SUSPENDED (Policy / Audit Hold)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Maintenance Status</label>
                <select
                  className="form-control"
                  value={statusFormData.maintenanceStatus}
                  onChange={(e) => setStatusFormData({ ...statusFormData, maintenanceStatus: e.target.value })}
                >
                  <option value="GOOD">GOOD (No service required)</option>
                  <option value="DUE">DUE (Service due soon)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Currently in workshop)</option>
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
                  <option value="ON_TRIP">ON_TRIP (Currently on ride)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Under service)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setStatusModalVehicle(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={formLoading}>
                  {formLoading ? 'Updating...' : 'Save Lifecycle Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
