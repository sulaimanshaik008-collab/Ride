import React, { useState, useEffect } from 'react';
import { 
  Car, Plus, Search, Filter, ShieldCheck, ShieldAlert, 
  Calendar, Wrench, AlertTriangle, RefreshCw, Edit3, Eye, 
  CheckCircle, XCircle, Activity, Gauge, Users, X
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
      <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '20px', textAlign: 'center', padding: '3rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2920', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p style={{ color: '#64748b' }}>
          Vehicle management is reserved for authorized corporate transport managers and operational personnel.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Car size={28} color="#059669" />
            <span>Corporate Vehicle Management</span>
          </h1>
          <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Maintain accurate fleet inventory, track vehicle availability, manage lifecycle states, and ensure compliance.
          </p>
        </div>

        {canManage && (
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
            <Plus size={18} />
            <span>Add New Vehicle</span>
          </button>
        )}
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
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Fleet</span>
            <Car size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f2920', marginTop: '0.35rem' }}>
            {totalFleet}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #a7f3d0', borderLeft: '4px solid #059669', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Active Vehicles</span>
            <ShieldCheck size={20} color="#059669" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', marginTop: '0.35rem' }}>
            {activeVehicles}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #bfdbfe', borderLeft: '4px solid #2563eb', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#2563eb', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Available Now</span>
            <Activity size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#2563eb', marginTop: '0.35rem' }}>
            {availableVehicles}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: `1.5px solid ${maintenanceVehicles > 0 ? '#fde68a' : '#e2e8f0'}`, borderLeft: maintenanceVehicles > 0 ? '4px solid #d97706' : '1.5px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: maintenanceVehicles > 0 ? '#d97706' : '#64748b', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Under Maintenance</span>
            <Wrench size={20} color={maintenanceVehicles > 0 ? '#d97706' : '#9ca3af'} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: maintenanceVehicles > 0 ? '#d97706' : '#0f2920', marginTop: '0.35rem' }}>
            {maintenanceVehicles}
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
              placeholder="Search by registration number, make, or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={14} color="#64748b" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
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
              <option value="ALL">All Statuses</option>
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
              <option value="MAINTENANCE">Maintenance</option>
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

      {/* VEHICLES GRID */}
      {loading ? (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 0.75rem', color: '#059669' }} />
          <p style={{ color: '#64748b', fontWeight: 600 }}>Loading corporate fleet...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <Car size={36} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ color: '#0f2920', marginBottom: '0.25rem', fontSize: '1.1rem', fontWeight: 900 }}>
            No vehicles found
          </p>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            No vehicle records match your selected filters or organization context.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.25rem' }}>
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
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
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700 }}>
                    {vehicle.registrationNumber}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      background: vehicle.vehicleStatus === 'ACTIVE' ? '#ecfdf5' : '#fef2f2',
                      color: vehicle.vehicleStatus === 'ACTIVE' ? '#059669' : '#ef4444',
                      border: `1px solid ${vehicle.vehicleStatus === 'ACTIVE' ? '#a7f3d0' : '#fecaca'}`,
                    }}
                  >
                    {vehicle.vehicleStatus}
                  </span>
                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      background: vehicle.availabilityStatus === 'AVAILABLE' ? '#eff6ff' : '#f8faf9',
                      color: vehicle.availabilityStatus === 'AVAILABLE' ? '#2563eb' : '#64748b',
                      border: `1px solid ${vehicle.availabilityStatus === 'AVAILABLE' ? '#bfdbfe' : '#e2e8f0'}`,
                    }}
                  >
                    {vehicle.availabilityStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {(vehicle.isInsuranceExpired || vehicle.isPermitExpired) && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                  <AlertTriangle size={14} />
                  <span><strong>Document Warning:</strong> {vehicle.isInsuranceExpired ? 'Insurance expired!' : ''} {vehicle.isPermitExpired ? 'Permit expired!' : ''}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', fontSize: '0.85rem', color: '#64748b', borderTop: '1.5px solid #f1f5f9', paddingTop: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Car size={14} color="#2563eb" />
                  <span>Type: <strong style={{ color: '#0f2920' }}>{vehicle.vehicleType}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={14} color="#059669" />
                  <span>Capacity: <strong style={{ color: '#0f2920' }}>{vehicle.seatingCapacity} Seats</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Gauge size={14} color="#d97706" />
                  <span>Year: <strong style={{ color: '#0f2920' }}>{vehicle.manufacturingYear || 'N/A'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Wrench size={14} color="#db2777" />
                  <span>Maintenance: <strong style={{ color: vehicle.maintenanceStatus === 'GOOD' ? '#059669' : '#d97706' }}>{vehicle.maintenanceStatus}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1.5px solid #f1f5f9', paddingTop: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => setViewingVehicle(vehicle)}
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
                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(vehicle)}
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
                        setStatusModalVehicle(vehicle);
                        setStatusFormData({
                          vehicleStatus: vehicle.vehicleStatus,
                          availabilityStatus: vehicle.availabilityStatus,
                          maintenanceStatus: vehicle.maintenanceStatus,
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
                {editingVehicle ? 'Edit Vehicle Information' : 'Register New Corporate Vehicle'}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Registration Number *</label>
                  <input
                    type="text"
                    placeholder="E.g., REG-ACME-88"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
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
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Vehicle Type *</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    required
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
                    <option value="SEDAN">SEDAN</option>
                    <option value="SUV">SUV</option>
                    <option value="VAN">VAN</option>
                    <option value="MINIBUS">MINIBUS</option>
                    <option value="BUS">BUS</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Make / Manufacturer *</label>
                  <input
                    type="text"
                    placeholder="E.g., Toyota, Ford, Mercedes"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
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
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Model Name *</label>
                  <input
                    type="text"
                    placeholder="E.g., Camry, Explorer, Sprinter"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Manufacturing Year</label>
                  <input
                    type="number"
                    placeholder="2024"
                    min="1900"
                    max="2030"
                    value={formData.manufacturingYear}
                    onChange={(e) => setFormData({ ...formData, manufacturingYear: e.target.value })}
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
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Seating Capacity *</label>
                  <input
                    type="number"
                    placeholder="4"
                    min="1"
                    max="100"
                    value={formData.seatingCapacity}
                    onChange={(e) => setFormData({ ...formData, seatingCapacity: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Insurance Expiry Date</label>
                  <input
                    type="date"
                    value={formData.insuranceExpiryDate}
                    onChange={(e) => setFormData({ ...formData, insuranceExpiryDate: e.target.value })}
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Permit Expiry Date</label>
                  <input
                    type="date"
                    value={formData.permitExpiryDate}
                    onChange={(e) => setFormData({ ...formData, permitExpiryDate: e.target.value })}
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
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '540px',
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
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>
                  {viewingVehicle.make} {viewingVehicle.model}
                </h2>
                <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700 }}>
                  Reg: {viewingVehicle.registrationNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingVehicle(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Status:</span>
                <span style={{ fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '6px', background: viewingVehicle.vehicleStatus === 'ACTIVE' ? '#ecfdf5' : '#fef2f2', color: viewingVehicle.vehicleStatus === 'ACTIVE' ? '#059669' : '#ef4444' }}>
                  {viewingVehicle.vehicleStatus}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Availability:</span>
                <strong style={{ color: '#2563eb' }}>{viewingVehicle.availabilityStatus.replace('_', ' ')}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Maintenance State:</span>
                <strong style={{ color: viewingVehicle.maintenanceStatus === 'GOOD' ? '#059669' : '#d97706' }}>
                  {viewingVehicle.maintenanceStatus}
                </strong>
              </div>

              <div style={{ background: '#f8faf9', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Vehicle Type</span>
                  <strong style={{ color: '#0f2920' }}>{viewingVehicle.vehicleType}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Seating Capacity</span>
                  <strong style={{ color: '#0f2920' }}>{viewingVehicle.seatingCapacity} Passengers</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Manufacturing Year</span>
                  <strong style={{ color: '#0f2920' }}>{viewingVehicle.manufacturingYear || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Organization</span>
                  <strong style={{ color: '#059669' }}>{viewingVehicle.organizationName}</strong>
                </div>
              </div>

              <div style={{ background: '#f8faf9', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Insurance Expiry</span>
                  <strong style={{ color: viewingVehicle.isInsuranceExpired ? '#ef4444' : '#0f2920' }}>
                    {viewingVehicle.insuranceExpiryDate || 'N/A'} {viewingVehicle.isInsuranceExpired ? '(Expired)' : ''}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Permit Expiry</span>
                  <strong style={{ color: viewingVehicle.isPermitExpired ? '#ef4444' : '#0f2920' }}>
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
                Manage Lifecycle — {statusModalVehicle.registrationNumber}
              </h2>
              <button
                type="button"
                onClick={() => setStatusModalVehicle(null)}
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
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Vehicle Lifecycle Status</label>
                <select
                  value={statusFormData.vehicleStatus}
                  onChange={(e) => setStatusFormData({ ...statusFormData, vehicleStatus: e.target.value })}
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
                  <option value="ACTIVE">ACTIVE (Operational)</option>
                  <option value="INACTIVE">INACTIVE (Deactivated / Soft Retired)</option>
                  <option value="SUSPENDED">SUSPENDED (Policy / Audit Hold)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Maintenance Status</label>
                <select
                  value={statusFormData.maintenanceStatus}
                  onChange={(e) => setStatusFormData({ ...statusFormData, maintenanceStatus: e.target.value })}
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
                  <option value="GOOD">GOOD (No service required)</option>
                  <option value="DUE">DUE (Service due soon)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Currently in workshop)</option>
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
                  <option value="ON_TRIP">ON_TRIP (Currently on ride)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Under service)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setStatusModalVehicle(null)}
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

export default VehicleManagementPage;
