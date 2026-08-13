import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Car, ShieldAlert, CheckCircle, XCircle, 
  Clock, MapPin, Calendar, RefreshCw, Edit3, Eye, User, 
  AlertCircle, ArrowRight, ShieldCheck, Wrench, ChevronRight
} from 'lucide-react';
import { rideService } from '../services/rideService';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';

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
    if (!targetRide || !selectedDriverId || !selectedVehicleId) return;

    try {
      setFormLoading(true);
      setFormError(null);

      const requestBody = {
        driverId: selectedDriverId,
        vehicleId: selectedVehicleId,
      };

      if (replaceModalRide) {
        await rideService.replaceRideAssignment(replaceModalRide.id, requestBody);
      } else {
        await rideService.assignRideResources(assignModalRide.id, requestBody);
      }

      setAssignModalRide(null);
      setReplaceModalRide(null);
      if (activeTab === 'pending') {
        fetchPending();
      } else {
        fetchAssigned();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to assign resources');
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

      await rideService.unassignRideResources(unassignModalRide.id);

      setUnassignModalRide(null);
      if (activeTab === 'pending') {
        fetchPending();
      } else {
        fetchAssigned();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to unassign resources');
    } finally {
      setFormLoading(false);
    }
  };

  // Metrics
  const pendingCount = pendingRides.length;
  const assignedCount = assignedRides.length;
  const eligibleDriversCount = assignmentOptions.eligibleDrivers.length;
  const eligibleVehiclesCount = assignmentOptions.eligibleVehicles.length;

  if (!isManager) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Driver & Vehicle Resource Assignment is reserved for Transport Managers and Corporate Administrators.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Driver & Vehicle Resource Assignment</h1>
          <p className="page-subtitle">
            Assign active corporate drivers and vehicles to scheduled office rides, manage replacements, and prevent scheduling conflicts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setActiveTab('pending')}
            className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Clock size={16} />
            Pending Assignment ({pendingCount})
          </button>

          <button
            onClick={() => setActiveTab('assigned')}
            className={`btn ${activeTab === 'assigned' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <UserCheck size={16} />
            Assigned Fleet ({assignedCount})
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* KPI METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Awaiting Assignment</span>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.5rem' }}>
            {pendingCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Assigned Rides</span>
            <CheckCircle size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '0.5rem' }}>
            {assignedCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Available Drivers</span>
            <UserCheck size={20} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginTop: '0.5rem' }}>
            {eligibleDriversCount > 0 ? eligibleDriversCount : 'Active Pool'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Available Fleet</span>
            <Car size={20} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.5rem' }}>
            {eligibleVehiclesCount > 0 ? eligibleVehiclesCount : 'Active Pool'}
          </div>
        </div>
      </div>

      {/* PENDING ASSIGNMENT TAB CONTENT */}
      {activeTab === 'pending' && (
        <div>
          {loading ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>Loading rides awaiting driver & vehicle assignment...</p>
            </div>
          ) : pendingRides.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: '#fff', marginBottom: '0.3rem', fontSize: '1.1rem', fontWeight: 700 }}>
                All Scheduled Rides Assigned!
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                There are currently no scheduled rides pending driver or vehicle assignment.
              </p>
            </div>
          ) : (
            <div className="rides-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {pendingRides.map((ride) => (
                <div key={ride.id} className="ride-card">
                  <div className="ride-card-header">
                    <div>
                      <span className="booking-ref">{ride.bookingReference}</span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
                        {ride.employeeName}
                      </h3>
                    </div>
                    <StatusBadge status={ride.status} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', margin: '0.75rem 0' }}>
                    <div className="meta-item">
                      <MapPin size={14} color="#10b981" />
                      <span>Pickup: <strong style={{ color: '#fff' }}>{ride.pickupLocation}</strong></span>
                    </div>

                    <div className="meta-item">
                      <MapPin size={14} color="#ef4444" />
                      <span>Destination: <strong style={{ color: '#fff' }}>{ride.destination}</strong></span>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                      <div className="meta-item">
                        <Calendar size={14} color="#6366f1" />
                        <span>Date: <strong style={{ color: 'var(--accent-cyan)' }}>{ride.bookingDate}</strong></span>
                      </div>
                      <div className="meta-item">
                        <Clock size={14} color="#f59e0b" />
                        <span>Time: <strong style={{ color: '#fff' }}>{ride.pickupTime}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem' }}>
                    <button
                      onClick={() => handleOpenAssignModal(ride)}
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
                    >
                      <UserCheck size={14} />
                      Assign Driver & Vehicle
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
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>Loading assigned fleet rides...</p>
            </div>
          ) : assignedRides.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 600 }}>
                No assigned rides found
              </p>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                Assign resources from the Pending Assignment tab.
              </p>
            </div>
          ) : (
            <div className="rides-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {assignedRides.map((ride) => (
                <div key={ride.id} className="ride-card">
                  <div className="ride-card-header">
                    <div>
                      <span className="booking-ref">{ride.bookingReference}</span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
                        {ride.employeeName}
                      </h3>
                    </div>
                    <StatusBadge status={ride.status} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', margin: '0.75rem 0' }}>
                    <div className="meta-item">
                      <MapPin size={14} color="#10b981" />
                      <span>Pickup: <strong style={{ color: '#fff' }}>{ride.pickupLocation}</strong></span>
                    </div>

                    <div className="meta-item">
                      <MapPin size={14} color="#ef4444" />
                      <span>Destination: <strong style={{ color: '#fff' }}>{ride.destination}</strong></span>
                    </div>

                    <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div className="meta-item">
                        <UserCheck size={14} color="#6366f1" />
                        <span>Driver: <strong style={{ color: '#fff' }}>{ride.driverName}</strong> ({ride.driverPhone})</span>
                      </div>
                      <div className="meta-item">
                        <Car size={14} color="#06b6d4" />
                        <span>Vehicle: <strong style={{ color: 'var(--accent-cyan)' }}>{ride.vehicleRegistration}</strong> — {ride.vehicleMakeModel} ({ride.vehicleType})</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem' }}>
                    <button onClick={() => setViewModalRide(ride)} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                      <Eye size={14} />
                      Details
                    </button>

                    <button onClick={() => handleOpenReplaceModal(ride)} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                      <Edit3 size={14} />
                      Replace
                    </button>

                    <button
                      onClick={() => {
                        setUnassignModalRide(ride);
                        setFormError(null);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#f87171' }}
                    >
                      <XCircle size={14} />
                      Unassign
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
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  {replaceModalRide ? 'Replace Assignment Resources' : 'Assign Driver & Vehicle'}
                </h2>
                <span className="booking-ref" style={{ fontSize: '0.85rem' }}>
                  {(assignModalRide || replaceModalRide).bookingReference} — {(assignModalRide || replaceModalRide).employeeName}
                </span>
              </div>
              <button onClick={() => { setAssignModalRide(null); setReplaceModalRide(null); }} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            {optionsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Checking eligible drivers and vehicles...
              </div>
            ) : (
              <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                  <div>Schedule Date & Time: <strong style={{ color: 'var(--accent-cyan)' }}>{(assignModalRide || replaceModalRide).bookingDate} at {(assignModalRide || replaceModalRide).pickupTime}</strong></div>
                  <div>Route: <strong>{(assignModalRide || replaceModalRide).pickupLocation}</strong> $\rightarrow$ <strong>{(assignModalRide || replaceModalRide).destination}</strong></div>
                </div>

                {/* DRIVER SELECTOR */}
                <div className="form-group">
                  <label className="form-label">Select Eligible Driver *</label>
                  <select
                    className="form-control"
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Active Driver --</option>
                    {assignmentOptions.eligibleDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} (License: {d.licenseNumber} - Phone: {d.phoneNumber})
                      </option>
                    ))}
                  </select>
                  {assignmentOptions.eligibleDrivers.length === 0 && (
                    <span style={{ fontSize: '0.78rem', color: '#fbbf24', marginTop: '0.3rem', display: 'block' }}>
                      ⚠️ No available drivers without scheduling conflict found for this time block.
                    </span>
                  )}
                </div>

                {/* VEHICLE SELECTOR */}
                <div className="form-group">
                  <label className="form-label">Select Eligible Fleet Vehicle *</label>
                  <select
                    className="form-control"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Active Vehicle --</option>
                    {assignmentOptions.eligibleVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber} — {v.make} {v.model} ({v.vehicleType}, {v.seatingCapacity} seats)
                      </option>
                    ))}
                  </select>
                  {assignmentOptions.eligibleVehicles.length === 0 && (
                    <span style={{ fontSize: '0.78rem', color: '#fbbf24', marginTop: '0.3rem', display: 'block' }}>
                      ⚠️ No available vehicles without scheduling conflict found for this time block.
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => { setAssignModalRide(null); setReplaceModalRide(null); }} className="btn btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={formLoading}>
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
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Unassign Resources</h2>
              <button onClick={() => setUnassignModalRide(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleUnassignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Are you sure you want to unassign driver <strong style={{ color: '#fff' }}>{unassignModalRide.driverName}</strong> and vehicle <strong style={{ color: '#fff' }}>{unassignModalRide.vehicleRegistration}</strong> from ride <strong style={{ color: '#fff' }}>{unassignModalRide.bookingReference}</strong>?
              </p>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setUnassignModalRide(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Go Back
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }} disabled={formLoading}>
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
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{viewModalRide.bookingReference}</h2>
                <span className="booking-ref" style={{ fontSize: '0.85rem' }}>
                  Employee: {viewModalRide.employeeName} ({viewModalRide.employeeEmail})
                </span>
              </div>
              <button onClick={() => setViewModalRide(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <StatusBadge status={viewModalRide.status} />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Assigned Driver</span>
                  <strong style={{ color: '#fff' }}>{viewModalRide.driverName || 'None'}</strong> ({viewModalRide.driverPhone || 'N/A'})
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Assigned Vehicle</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>{viewModalRide.vehicleRegistration || 'None'}</strong> — {viewModalRide.vehicleMakeModel}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
