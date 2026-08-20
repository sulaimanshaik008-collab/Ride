import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Car, ShieldAlert, CheckCircle, XCircle, 
  Clock, MapPin, Calendar, RefreshCw, Edit3, Eye, User, 
  AlertCircle, ArrowRight, ShieldCheck, Wrench, ChevronRight, X
} from 'lucide-react';
import { rideService } from '../services/rideService';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { MapView } from '../components/map/MapView';

export const RideAssignmentPage = () => {
  const { currentUser } = useAuth();

  const isManager = currentUser?.role === 'TRANSPORT_MANAGER' || 
                    currentUser?.role === 'CORPORATE_ADMIN' || 
                    currentUser?.role === 'SYSTEM_ADMIN';

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'assigned'

  // Data states
  const [pendingRides, setPendingRides] = useState([]);
  const [assignedRides, setAssignedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal & Option states
  const [assignModalRide, setAssignModalRide] = useState(null);
  const [replaceModalRide, setReplaceModalRide] = useState(null);
  const [unassignModalRide, setUnassignModalRide] = useState(null);
  const [viewModalRide, setViewModalRide] = useState(null);

  const [assignmentOptions, setAssignmentOptions] = useState({ eligibleDrivers: [], eligibleVehicles: [] });
  const [optionsLoading, setOptionsLoading] = useState(false);

  // Form states
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rideService.getPendingAssignmentRides();
      setPendingRides(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load pending assignments queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssigned = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rideService.getScheduledRides({ status: 'ASSIGNED' });
      setAssignedRides(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load assigned fleet rides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManager) {
      if (activeTab === 'pending') {
        fetchPending();
      } else {
        fetchAssigned();
      }
    }
  }, [currentUser, activeTab]);

  const handleOpenAssignModal = async (ride) => {
    setAssignModalRide(ride);
    setSelectedDriverId('');
    setSelectedVehicleId('');
    setFormError(null);
    try {
      setOptionsLoading(true);
      const options = await rideService.getAssignmentOptions(ride.id);
      setAssignmentOptions(options || { eligibleDrivers: [], eligibleVehicles: [] });
    } catch (err) {
      setFormError(err.message || 'Failed to fetch assignment options');
    } finally {
      setOptionsLoading(false);
    }
  };

  const handleOpenReplaceModal = async (ride) => {
    setReplaceModalRide(ride);
    setSelectedDriverId(ride.driverId || '');
    setSelectedVehicleId(ride.vehicleId || '');
    setFormError(null);
    try {
      setOptionsLoading(true);
      const options = await rideService.getAssignmentOptions(ride.id);
      setAssignmentOptions(options || { eligibleDrivers: [], eligibleVehicles: [] });
    } catch (err) {
      setFormError(err.message || 'Failed to fetch assignment options');
    } finally {
      setOptionsLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    const targetRide = assignModalRide || replaceModalRide;
    if (!targetRide) return;

    if (!selectedDriverId || !selectedVehicleId) {
      setFormError('Please select both an eligible driver and an active vehicle');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);
      await rideService.assignDriverAndVehicle(targetRide.id, {
        driverId: selectedDriverId,
        vehicleId: selectedVehicleId,
      });

      setAssignModalRide(null);
      setReplaceModalRide(null);

      if (activeTab === 'pending') {
        fetchPending();
      } else {
        fetchAssigned();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to assign resources to ride');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUnassignSubmit = async (e) => {
    e.preventDefault();
    if (!unassignModalRide) return;

    try {
      setFormLoading(true);
      setFormError(null);
      await rideService.unassignRide(unassignModalRide.id);
      setUnassignModalRide(null);
      fetchAssigned();
    } catch (err) {
      setFormError(err.message || 'Failed to unassign ride resources');
    } finally {
      setFormLoading(false);
    }
  };

  const pendingCount = pendingRides.length;
  const assignedCount = assignedRides.length;
  const eligibleDriversCount = assignmentOptions.eligibleDrivers.length;
  const eligibleVehiclesCount = assignmentOptions.eligibleVehicles.length;

  if (!isManager) {
    return (
      <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '20px', textAlign: 'center', padding: '3rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2920', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p style={{ color: '#64748b' }}>
          Driver & Vehicle assignment operations are restricted to authorized transport managers.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <UserCheck size={28} color="#059669" />
            <span>Driver & Vehicle Assignment</span>
          </h1>
          <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Allocate eligible active drivers and corporate fleet vehicles to approved employee ride bookings.
          </p>
        </div>

        {/* TAB TOGGLE */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              padding: '0.55rem 1.1rem',
              borderRadius: '8px',
              border: activeTab === 'pending' ? '1.5px solid #059669' : '1.5px solid #e2e8f0',
              background: activeTab === 'pending' ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : '#ffffff',
              color: activeTab === 'pending' ? '#ffffff' : '#475569',
              cursor: 'pointer',
            }}
          >
            <Clock size={16} />
            <span>Pending Assignment ({pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assigned')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              padding: '0.55rem 1.1rem',
              borderRadius: '8px',
              border: activeTab === 'assigned' ? '1.5px solid #059669' : '1.5px solid #e2e8f0',
              background: activeTab === 'assigned' ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : '#ffffff',
              color: activeTab === 'assigned' ? '#ffffff' : '#475569',
              cursor: 'pointer',
            }}
          >
            <UserCheck size={16} />
            <span>Assigned Fleet ({assignedCount})</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444', padding: '1rem 1.25rem', borderRadius: '12px', fontWeight: 700 }}>
          ⚠️ {error}
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <div style={{ background: '#ffffff', border: `1.5px solid ${pendingCount > 0 ? '#fde68a' : '#e2e8f0'}`, borderLeft: pendingCount > 0 ? '4px solid #d97706' : '1.5px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: pendingCount > 0 ? '#d97706' : '#64748b', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Awaiting Assignment</span>
            <Clock size={20} color={pendingCount > 0 ? '#d97706' : '#9ca3af'} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: pendingCount > 0 ? '#d97706' : '#0f2920', marginTop: '0.35rem' }}>
            {pendingCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #a7f3d0', borderLeft: '4px solid #059669', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Assigned Rides</span>
            <CheckCircle size={20} color="#059669" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', marginTop: '0.35rem' }}>
            {assignedCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #bfdbfe', borderLeft: '4px solid #2563eb', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#2563eb', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Available Drivers</span>
            <UserCheck size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f2920', marginTop: '0.35rem' }}>
            {eligibleDriversCount > 0 ? eligibleDriversCount : 'Active Pool'}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Available Fleet</span>
            <Car size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f2920', marginTop: '0.35rem' }}>
            {eligibleVehiclesCount > 0 ? eligibleVehiclesCount : 'Active Pool'}
          </div>
        </div>
      </div>

      {/* PENDING ASSIGNMENT TAB CONTENT */}
      {activeTab === 'pending' && (
        <div>
          {loading ? (
            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
              <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 0.75rem', color: '#059669' }} />
              <p style={{ color: '#64748b', fontWeight: 600 }}>Loading rides awaiting driver & vehicle assignment...</p>
            </div>
          ) : pendingRides.length === 0 ? (
            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
              <CheckCircle size={40} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ color: '#0f2920', marginBottom: '0.25rem', fontSize: '1.1rem', fontWeight: 900 }}>
                All Scheduled Rides Assigned!
              </p>
              <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                There are currently no scheduled rides pending driver or vehicle assignment.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.25rem' }}>
              {pendingRides.map((ride) => (
                <div
                  key={ride.id}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#2563eb', letterSpacing: '0.5px' }}>{ride.bookingReference}</span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f2920', margin: '0.2rem 0 0 0' }}>
                        {ride.employeeName}
                      </h3>
                    </div>
                    <StatusBadge status={ride.status} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={14} color="#059669" />
                      <span style={{ color: '#64748b' }}>Pickup: <strong style={{ color: '#0f2920' }}>{ride.pickupLocation}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={14} color="#ef4444" />
                      <span style={{ color: '#64748b' }}>Destination: <strong style={{ color: '#0f2920' }}>{ride.destination}</strong></span>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', color: '#64748b', background: '#f8faf9', border: '1.5px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={14} color="#2563eb" />
                        <span>Date: <strong style={{ color: '#0f2920' }}>{ride.bookingDate}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} color="#d97706" />
                        <span>Time: <strong style={{ color: '#0f2920' }}>{ride.pickupTime}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1.5px solid #f1f5f9', paddingTop: '0.85rem' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal(ride)}
                      style={{
                        padding: '0.55rem 1.1rem',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 10px rgba(19, 56, 44, 0.2)',
                      }}
                    >
                      <UserCheck size={14} />
                      <span>Assign Driver & Vehicle</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ASSIGNED FLEET TAB CONTENT */}
      {activeTab === 'assigned' && (
        <div>
          {loading ? (
            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
              <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 0.75rem', color: '#059669' }} />
              <p style={{ color: '#64748b', fontWeight: 600 }}>Loading assigned fleet rides...</p>
            </div>
          ) : assignedRides.length === 0 ? (
            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
              <Car size={36} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ color: '#0f2920', marginBottom: '0.25rem', fontSize: '1.1rem', fontWeight: 900 }}>
                No assigned rides found
              </p>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                Assign resources from the Pending Assignment tab.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.25rem' }}>
              {assignedRides.map((ride) => (
                <div
                  key={ride.id}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#2563eb', letterSpacing: '0.5px' }}>{ride.bookingReference}</span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f2920', margin: '0.2rem 0 0 0' }}>
                        {ride.employeeName}
                      </h3>
                    </div>
                    <StatusBadge status={ride.status} />
                  </div>

                  <div style={{ background: '#f8faf9', border: '1.5px solid #e2e8f0', padding: '0.75rem', borderRadius: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.825rem' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase' }}>Assigned Driver</span>
                      <strong style={{ color: '#0f2920' }}>{ride.driverName || 'Unassigned'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase' }}>Assigned Vehicle</span>
                      <strong style={{ color: '#2563eb' }}>{ride.vehicleRegistration || 'Unassigned'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1.5px solid #f1f5f9', paddingTop: '0.85rem' }}>
                    <button
                      type="button"
                      onClick={() => setViewModalRide(ride)}
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
                      onClick={() => handleOpenReplaceModal(ride)}
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
                      <span>Replace</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUnassignModalRide(ride);
                        setFormError(null);
                      }}
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#ef4444',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <XCircle size={14} />
                      <span>Unassign</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ASSIGN / REPLACE MODAL */}
      {(assignModalRide || replaceModalRide) && (
        <div className="modal-overlay" onClick={() => { setAssignModalRide(null); setReplaceModalRide(null); }}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '580px',
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
                  {replaceModalRide ? 'Replace Assignment Resources' : 'Assign Driver & Vehicle'}
                </h2>
                <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700 }}>
                  {(assignModalRide || replaceModalRide).bookingReference} — {(assignModalRide || replaceModalRide).employeeName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setAssignModalRide(null); setReplaceModalRide(null); }}
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

            {optionsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 0.5rem', color: '#059669' }} />
                <p>Checking eligible drivers and vehicles...</p>
              </div>
            ) : (
              <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ marginBottom: '0.5rem', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
                  <MapView
                    center={(assignModalRide || replaceModalRide).pickupLongitude ? [(assignModalRide || replaceModalRide).pickupLongitude, (assignModalRide || replaceModalRide).pickupLatitude] : [80.2707, 13.0827]}
                    zoom={12}
                    pickupLocation={{
                      address: (assignModalRide || replaceModalRide).pickupLocation,
                      coordinates: (assignModalRide || replaceModalRide).pickupLongitude ? [(assignModalRide || replaceModalRide).pickupLongitude, (assignModalRide || replaceModalRide).pickupLatitude] : [80.2707, 13.0827],
                    }}
                    destinationLocation={{
                      address: (assignModalRide || replaceModalRide).destination,
                      coordinates: (assignModalRide || replaceModalRide).destinationLongitude ? [(assignModalRide || replaceModalRide).destinationLongitude, (assignModalRide || replaceModalRide).destinationLatitude] : [80.1709, 12.9941],
                    }}
                    showControls={false}
                    showRouteInfo={true}
                    styleOverrides={{ height: '220px' }}
                  />
                </div>

                <div style={{ background: '#f8faf9', border: '1.5px solid #e2e8f0', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.84rem' }}>
                  <div>Schedule Date & Time: <strong style={{ color: '#059669' }}>{(assignModalRide || replaceModalRide).bookingDate} at {(assignModalRide || replaceModalRide).pickupTime}</strong></div>
                  <div>Route: <strong style={{ color: '#0f2920' }}>{(assignModalRide || replaceModalRide).pickupLocation}</strong> → <strong style={{ color: '#0f2920' }}>{(assignModalRide || replaceModalRide).destination}</strong></div>
                </div>

                {/* DRIVER SELECTOR */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Select Eligible Driver *</label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
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
                  >
                    <option value="">-- Choose Active Driver --</option>
                    {assignmentOptions.eligibleDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} (License: {d.licenseNumber} - Phone: {d.phoneNumber})
                      </option>
                    ))}
                  </select>
                  {assignmentOptions.eligibleDrivers.length === 0 && (
                    <span style={{ fontSize: '0.78rem', color: '#d97706', marginTop: '0.3rem', display: 'block', fontWeight: 700 }}>
                      ⚠️ No available drivers without scheduling conflict found for this time block.
                    </span>
                  )}
                </div>

                {/* VEHICLE SELECTOR */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Select Eligible Fleet Vehicle *</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
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
                  >
                    <option value="">-- Choose Active Vehicle --</option>
                    {assignmentOptions.eligibleVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber} — {v.make} {v.model} ({v.vehicleType}, {v.seatingCapacity} seats)
                      </option>
                    ))}
                  </select>
                  {assignmentOptions.eligibleVehicles.length === 0 && (
                    <span style={{ fontSize: '0.78rem', color: '#d97706', marginTop: '0.3rem', display: 'block', fontWeight: 700 }}>
                      ⚠️ No available vehicles without scheduling conflict found for this time block.
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => { setAssignModalRide(null); setReplaceModalRide(null); }}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      color: '#64748b',
                      fontWeight: 700,
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 800,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(19, 56, 44, 0.25)',
                    }}
                    disabled={formLoading}
                  >
                    {formLoading ? 'Saving...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* UNASSIGN MODAL */}
      {unassignModalRide && (
        <div className="modal-overlay" onClick={() => setUnassignModalRide(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '480px',
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
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ef4444', margin: 0 }}>Unassign Resources</h2>
              <button
                type="button"
                onClick={() => setUnassignModalRide(null)}
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

            <form onSubmit={handleUnassignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Are you sure you want to unassign driver <strong style={{ color: '#0f2920' }}>{unassignModalRide.driverName}</strong> and vehicle <strong style={{ color: '#2563eb' }}>{unassignModalRide.vehicleRegistration}</strong> from ride <strong style={{ color: '#0f2920' }}>{unassignModalRide.bookingReference}</strong>?
              </p>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setUnassignModalRide(null)}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    color: '#64748b',
                    fontWeight: 700,
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    background: '#ef4444',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 800,
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                  disabled={formLoading}
                >
                  {formLoading ? 'Unassigning...' : 'Confirm Unassign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewModalRide && (
        <div className="modal-overlay" onClick={() => setViewModalRide(null)}>
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
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>{viewModalRide.bookingReference}</h2>
                <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700 }}>
                  Employee: {viewModalRide.employeeName} ({viewModalRide.employeeEmail})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewModalRide(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Status:</span>
                <StatusBadge status={viewModalRide.status} />
              </div>

              <div style={{ background: '#f8faf9', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Assigned Driver</span>
                  <strong style={{ color: '#0f2920' }}>{viewModalRide.driverName || 'None'}</strong> ({viewModalRide.driverPhone || 'N/A'})
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Assigned Vehicle</span>
                  <strong style={{ color: '#2563eb' }}>{viewModalRide.vehicleRegistration || 'None'}</strong> — {viewModalRide.vehicleMakeModel}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RideAssignmentPage;
