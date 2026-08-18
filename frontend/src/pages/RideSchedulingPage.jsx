import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Search, Filter, ShieldAlert, CheckCircle, 
  XCircle, AlertTriangle, RefreshCw, Edit3, Eye, User, 
  MapPin, CalendarCheck, CalendarX, AlertCircle, ArrowRight
} from 'lucide-react';
import { rideService } from '../services/rideService';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { MapView } from '../components/map/MapView';

export const RideSchedulingPage = () => {
  const { currentUser } = useAuth();

  const isManager = currentUser?.role === 'TRANSPORT_MANAGER' || 
                    currentUser?.role === 'CORPORATE_ADMIN' || 
                    currentUser?.role === 'SYSTEM_ADMIN';

  const [activeTab, setActiveTab] = useState('schedulable'); // 'schedulable' | 'scheduled'

  // Data states
  const [schedulableRides, setSchedulableRides] = useState([]);
  const [scheduledRides, setScheduledRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter states for Scheduled tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal states
  const [scheduleModalRide, setScheduleModalRide] = useState(null);
  const [rescheduleModalRide, setRescheduleModalRide] = useState(null);
  const [cancelModalRide, setCancelModalRide] = useState(null);
  const [viewModalRide, setViewModalRide] = useState(null);

  // Form states
  const [scheduleFormData, setScheduleFormData] = useState({
    scheduledDate: '',
    scheduledPickupTime: '',
    notes: '',
  });

  const [rescheduleFormData, setRescheduleFormData] = useState({
    scheduledDate: '',
    scheduledPickupTime: '',
    rescheduleReason: '',
  });

  const [cancelReason, setCancelReason] = useState('');

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchSchedulable = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rideService.getSchedulableRides();
      setSchedulableRides(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load schedulable ride queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduled = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rideService.getScheduledRides({
        search: searchQuery,
        bookingDate: filterDate,
        status: filterStatus,
      });
      setScheduledRides(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load scheduled rides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManager) {
      if (activeTab === 'schedulable') {
        fetchSchedulable();
      } else {
        fetchScheduled();
      }
    }
  }, [currentUser, activeTab, filterDate, filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchScheduled();
  };

  const handleOpenScheduleModal = (ride) => {
    setScheduleModalRide(ride);
    setScheduleFormData({
      scheduledDate: ride.bookingDate,
      scheduledPickupTime: ride.pickupTime,
      notes: '',
    });
    setFormError(null);
  };

  const handleOpenRescheduleModal = (ride) => {
    setRescheduleModalRide(ride);
    setRescheduleFormData({
      scheduledDate: ride.bookingDate,
      scheduledPickupTime: ride.pickupTime,
      rescheduleReason: '',
    });
    setFormError(null);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleModalRide) return;

    try {
      setFormLoading(true);
      setFormError(null);

      await rideService.scheduleRide(scheduleModalRide.id, {
        scheduledDate: scheduleFormData.scheduledDate,
        scheduledPickupTime: scheduleFormData.scheduledPickupTime,
        notes: scheduleFormData.notes.trim(),
      });

      setScheduleModalRide(null);
      fetchSchedulable();
    } catch (err) {
      setFormError(err.message || 'Failed to schedule ride');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleModalRide) return;

    try {
      setFormLoading(true);
      setFormError(null);

      await rideService.rescheduleRide(rescheduleModalRide.id, {
        scheduledDate: rescheduleFormData.scheduledDate,
        scheduledPickupTime: rescheduleFormData.scheduledPickupTime,
        rescheduleReason: rescheduleFormData.rescheduleReason.trim(),
      });

      setRescheduleModalRide(null);
      fetchScheduled();
    } catch (err) {
      setFormError(err.message || 'Failed to reschedule ride');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelModalRide) return;

    try {
      setFormLoading(true);
      setFormError(null);

      await rideService.cancelRide(cancelModalRide.id, cancelReason.trim());

      setCancelModalRide(null);
      if (activeTab === 'schedulable') {
        fetchSchedulable();
      } else {
        fetchScheduled();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to cancel scheduled ride');
    } finally {
      setFormLoading(false);
    }
  };

  // Metrics
  const schedulableCount = schedulableRides.length;
  const totalScheduled = scheduledRides.length;
  const activeScheduledCount = scheduledRides.filter((r) => r.status === 'SCHEDULED').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTripsCount = scheduledRides.filter((r) => r.bookingDate === todayStr).length;

  if (!isManager) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Ride scheduling is reserved for Transport Managers and Corporate Administrators.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Corporate Ride Scheduling</h1>
          <p className="page-subtitle">
            Convert employee ride requests into confirmed transportation schedules, manage timetables, and handle reschedules.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setActiveTab('schedulable')}
            className={`btn ${activeTab === 'schedulable' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <CalendarCheck size={16} />
            Schedulable Queue ({schedulableCount})
          </button>

          <button
            onClick={() => setActiveTab('scheduled')}
            className={`btn ${activeTab === 'scheduled' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Calendar size={16} />
            Scheduled Fleet ({activeScheduledCount})
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* KPI METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Pending Queue</span>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.5rem' }}>
            {schedulableCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Scheduled Trips</span>
            <CalendarCheck size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '0.5rem' }}>
            {activeScheduledCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Today's Departures</span>
            <Calendar size={20} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.5rem' }}>
            {todayTripsCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Total Handled</span>
            <CheckCircle size={20} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginTop: '0.5rem' }}>
            {totalScheduled}
          </div>
        </div>
      </div>

      {/* SCHEDULABLE QUEUE TAB CONTENT */}
      {activeTab === 'schedulable' && (
        <div>
          {loading ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>Loading schedulable ride requests...</p>
            </div>
          ) : schedulableRides.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: '#fff', marginBottom: '0.3rem', fontSize: '1.1rem', fontWeight: 700 }}>
                All Ride Requests Scheduled!
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                There are currently no pending or unassigned ride requests requiring schedule confirmation.
              </p>
            </div>
          ) : (
            <div className="rides-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {schedulableRides.map((ride) => (
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', margin: '0.75rem 0' }}>
                    <div className="meta-item">
                      <MapPin size={14} color="#10b981" />
                      <span>Pickup: <strong style={{ color: '#fff' }}>{ride.pickupLocation}</strong></span>
                    </div>

                    <div className="meta-item">
                      <MapPin size={14} color="#ef4444" />
                      <span>Destination: <strong style={{ color: '#fff' }}>{ride.destination}</strong></span>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)' }}>
                      <div className="meta-item">
                        <Calendar size={14} color="#6366f1" />
                        <span>Date: <strong style={{ color: 'var(--accent-cyan)' }}>{ride.bookingDate}</strong></span>
                      </div>
                      <div className="meta-item">
                        <Clock size={14} color="#f59e0b" />
                        <span>Requested: <strong style={{ color: '#fff' }}>{ride.pickupTime}</strong></span>
                      </div>
                    </div>

                    {ride.bookingNotes && (
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <strong>Employee Note:</strong> {ride.bookingNotes}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem' }}>
                    <button
                      onClick={() => {
                        setCancelModalRide(ride);
                        setCancelReason('');
                        setFormError(null);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      <XCircle size={14} />
                      Reject / Cancel
                    </button>

                    <button
                      onClick={() => handleOpenScheduleModal(ride)}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      <CalendarCheck size={14} />
                      Confirm Schedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCHEDULED FLEET TAB CONTENT */}
      {activeTab === 'scheduled' && (
        <div>
          {/* SEARCH & FILTER BAR */}
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem', fontSize: '0.88rem' }}
                  placeholder="Search by ref, employee name, pickup, or destination..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={14} color="#9ca3af" />
                <input
                  type="date"
                  className="form-control"
                  style={{ fontSize: '0.85rem', width: '160px' }}
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={14} color="#9ca3af" />
                <select
                  className="tenant-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <button type="submit" className="btn btn-secondary" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}>
                <RefreshCw size={14} />
                Filter
              </button>
            </form>
          </div>

          {loading ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>Loading scheduled fleet rides...</p>
            </div>
          ) : scheduledRides.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 600 }}>
                No scheduled rides found
              </p>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No ride schedules match your selected search criteria.
              </p>
            </div>
          ) : (
            <div className="rides-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {scheduledRides.map((ride) => (
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
                        <span>Scheduled Date: <strong style={{ color: 'var(--accent-cyan)' }}>{ride.bookingDate}</strong></span>
                      </div>
                      <div className="meta-item">
                        <Clock size={14} color="#f59e0b" />
                        <span>Pickup Time: <strong style={{ color: '#fff' }}>{ride.pickupTime}</strong></span>
                      </div>
                    </div>

                    {ride.bookingNotes && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <strong>Notes:</strong> {ride.bookingNotes}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem' }}>
                    <button onClick={() => setViewModalRide(ride)} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                      <Eye size={14} />
                      Details
                    </button>

                    {ride.status === 'SCHEDULED' && (
                      <>
                        <button onClick={() => handleOpenRescheduleModal(ride)} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                          <Edit3 size={14} />
                          Reschedule
                        </button>

                        <button
                          onClick={() => {
                            setCancelModalRide(ride);
                            setCancelReason('');
                            setFormError(null);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#f87171' }}
                        >
                          <XCircle size={14} />
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {scheduleModalRide && (
        <div className="modal-overlay" onClick={() => setScheduleModalRide(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Schedule Office Ride</h2>
                <span className="booking-ref" style={{ fontSize: '0.85rem' }}>
                  {scheduleModalRide.bookingReference} — {scheduleModalRide.employeeName}
                </span>
              </div>
              <button onClick={() => setScheduleModalRide(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <div style={{ marginBottom: '1.25rem' }}>
              <MapView
                center={scheduleModalRide.pickupLongitude ? [scheduleModalRide.pickupLongitude, scheduleModalRide.pickupLatitude] : [80.2707, 13.0827]}
                zoom={12}
                pickupLocation={{
                  address: scheduleModalRide.pickupLocation,
                  coordinates: scheduleModalRide.pickupLongitude ? [scheduleModalRide.pickupLongitude, scheduleModalRide.pickupLatitude] : [80.2707, 13.0827],
                }}
                destinationLocation={{
                  address: scheduleModalRide.destination,
                  coordinates: scheduleModalRide.destinationLongitude ? [scheduleModalRide.destinationLongitude, scheduleModalRide.destinationLatitude] : [80.1709, 12.9941],
                }}
                showControls={false}
                showRouteInfo={true}
                styleOverrides={{ height: '240px' }}
              />
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Route: </span>
                <strong style={{ color: '#fff' }}>{scheduleModalRide.pickupLocation}</strong>
                <ArrowRight size={12} style={{ margin: '0 0.4rem', verticalAlign: 'middle' }} />
                <strong style={{ color: '#fff' }}>{scheduleModalRide.destination}</strong>
              </div>
            </div>

            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Scheduled Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={scheduleFormData.scheduledDate}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, scheduledDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Scheduled Pickup Time *</label>
                <input
                  type="time"
                  className="form-control"
                  value={scheduleFormData.scheduledPickupTime}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, scheduledPickupTime: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Manager Scheduling Notes (Optional)</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="E.g., Assigned to Executive Van Route A"
                  value={scheduleFormData.notes}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setScheduleModalRide(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={formLoading}>
                  {formLoading ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {rescheduleModalRide && (
        <div className="modal-overlay" onClick={() => setRescheduleModalRide(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Reschedule Ride</h2>
                <span className="booking-ref" style={{ fontSize: '0.85rem' }}>
                  {rescheduleModalRide.bookingReference} — {rescheduleModalRide.employeeName}
                </span>
              </div>
              <button onClick={() => setRescheduleModalRide(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">New Scheduled Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={rescheduleFormData.scheduledDate}
                  onChange={(e) => setRescheduleFormData({ ...rescheduleFormData, scheduledDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Scheduled Pickup Time *</label>
                <input
                  type="time"
                  className="form-control"
                  value={rescheduleFormData.scheduledPickupTime}
                  onChange={(e) => setRescheduleFormData({ ...rescheduleFormData, scheduledPickupTime: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reschedule Reason *</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="State reason for rescheduling..."
                  value={rescheduleFormData.rescheduleReason}
                  onChange={(e) => setRescheduleFormData({ ...rescheduleFormData, rescheduleReason: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setRescheduleModalRide(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={formLoading}>
                  {formLoading ? 'Rescheduling...' : 'Save Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelModalRide && (
        <div className="modal-overlay" onClick={() => setCancelModalRide(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Cancel Ride Schedule</h2>
              <button onClick={() => setCancelModalRide(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleCancelSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Are you sure you want to cancel the schedule for ride <strong style={{ color: '#fff' }}>{cancelModalRide.bookingReference}</strong>?
              </p>

              <div className="form-group">
                <label className="form-label">Cancellation Reason *</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="State cancellation reason..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setCancelModalRide(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Go Back
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }} disabled={formLoading}>
                  {formLoading ? 'Cancelling...' : 'Confirm Cancellation'}
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
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Pickup Location</span>
                  <strong style={{ color: '#fff' }}>{viewModalRide.pickupLocation}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Destination</span>
                  <strong style={{ color: '#fff' }}>{viewModalRide.destination}</strong>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Scheduled Date</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>{viewModalRide.bookingDate}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Pickup Time</span>
                  <strong style={{ color: '#fff' }}>{viewModalRide.pickupTime}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Organization</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>{viewModalRide.organizationName}</strong>
                </div>
              </div>

              {viewModalRide.bookingNotes && (
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Notes & History</span>
                  <span style={{ color: '#fff', fontSize: '0.85rem' }}>{viewModalRide.bookingNotes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
