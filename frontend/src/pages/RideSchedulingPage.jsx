import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Search, Filter, ShieldAlert, CheckCircle, 
  XCircle, AlertTriangle, RefreshCw, Edit3, Eye, User, 
  MapPin, CalendarCheck, CalendarX, AlertCircle, ArrowRight, X
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
      await rideService.scheduleRide(scheduleModalRide.id, scheduleFormData);
      setScheduleModalRide(null);
      if (activeTab === 'schedulable') {
        fetchSchedulable();
      } else {
        fetchScheduled();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to confirm schedule');
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
      await rideService.rescheduleRide(rescheduleModalRide.id, rescheduleFormData);
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
      await rideService.cancelRideSchedule(cancelModalRide.id, { reason: cancelReason });
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

  const schedulableCount = schedulableRides.length;
  const activeScheduledCount = scheduledRides.filter(r => r.status === 'SCHEDULED' || r.status === 'ASSIGNED').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTripsCount = scheduledRides.filter(r => r.bookingDate === todayStr).length;
  const totalScheduled = scheduledRides.length;

  if (!isManager) {
    return (
      <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '20px', textAlign: 'center', padding: '3rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2920', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p style={{ color: '#64748b' }}>
          Ride scheduling is reserved for Transport Managers and Corporate Administrators.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CalendarCheck size={28} color="#059669" />
            <span>Corporate Ride Scheduling</span>
          </h1>
          <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Convert employee ride requests into confirmed transportation schedules, manage timetables, and handle reschedules.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('schedulable')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              padding: '0.55rem 1.1rem',
              borderRadius: '8px',
              border: activeTab === 'schedulable' ? '1.5px solid #059669' : '1.5px solid #e2e8f0',
              background: activeTab === 'schedulable' ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : '#ffffff',
              color: activeTab === 'schedulable' ? '#ffffff' : '#475569',
              cursor: 'pointer',
            }}
          >
            <CalendarCheck size={16} />
            <span>Schedulable Queue ({schedulableCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scheduled')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              padding: '0.55rem 1.1rem',
              borderRadius: '8px',
              border: activeTab === 'scheduled' ? '1.5px solid #059669' : '1.5px solid #e2e8f0',
              background: activeTab === 'scheduled' ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : '#ffffff',
              color: activeTab === 'scheduled' ? '#ffffff' : '#475569',
              cursor: 'pointer',
            }}
          >
            <Calendar size={16} />
            <span>Scheduled Fleet ({activeScheduledCount})</span>
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
        <div style={{ background: '#ffffff', border: `1.5px solid ${schedulableCount > 0 ? '#fde68a' : '#e2e8f0'}`, borderLeft: schedulableCount > 0 ? '4px solid #d97706' : '1.5px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: schedulableCount > 0 ? '#d97706' : '#64748b', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Pending Queue</span>
            <Clock size={20} color={schedulableCount > 0 ? '#d97706' : '#9ca3af'} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: schedulableCount > 0 ? '#d97706' : '#0f2920', marginTop: '0.35rem' }}>
            {schedulableCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #a7f3d0', borderLeft: '4px solid #059669', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Scheduled Trips</span>
            <CalendarCheck size={20} color="#059669" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', marginTop: '0.35rem' }}>
            {activeScheduledCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #bfdbfe', borderLeft: '4px solid #2563eb', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#2563eb', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Today's Departures</span>
            <Calendar size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f2920', marginTop: '0.35rem' }}>
            {todayTripsCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Handled</span>
            <CheckCircle size={20} color="#059669" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f2920', marginTop: '0.35rem' }}>
            {totalScheduled}
          </div>
        </div>
      </div>

      {/* SCHEDULABLE QUEUE TAB CONTENT */}
      {activeTab === 'schedulable' && (
        <div>
          {loading ? (
            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
              <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 0.75rem', color: '#059669' }} />
              <p style={{ color: '#64748b', fontWeight: 600 }}>Loading schedulable ride requests...</p>
            </div>
          ) : schedulableRides.length === 0 ? (
            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
              <CheckCircle size={40} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ color: '#0f2920', marginBottom: '0.25rem', fontSize: '1.1rem', fontWeight: 900 }}>
                All Ride Requests Scheduled!
              </p>
              <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                There are currently no pending or unassigned ride requests requiring schedule confirmation.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.25rem' }}>
              {schedulableRides.map((ride) => (
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
                        <span>Requested: <strong style={{ color: '#0f2920' }}>{ride.pickupTime}</strong></span>
                      </div>
                    </div>

                    {ride.bookingNotes && (
                      <div style={{ background: '#f8faf9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#475569' }}>
                        <strong style={{ color: '#0f2920' }}>Employee Note:</strong> {ride.bookingNotes}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1.5px solid #f1f5f9', paddingTop: '0.85rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCancelModalRide(ride);
                        setCancelReason('');
                        setFormError(null);
                      }}
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        color: '#ef4444',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <XCircle size={14} />
                      <span>Reject / Cancel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenScheduleModal(ride)}
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
                      <CalendarCheck size={14} />
                      <span>Confirm Schedule</span>
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
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.1rem 1.25rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              marginBottom: '1.5rem',
            }}
          >
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by ref, employee name, pickup, or destination..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={14} color="#64748b" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  style={{
                    padding: '0.55rem 0.75rem',
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={14} color="#64748b" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: '0.55rem 0.75rem',
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <button
                type="submit"
                style={{
                  padding: '0.55rem 1.1rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Apply Filters
              </button>
            </form>
          </div>

          {/* SCHEDULED RIDES LIST */}
          {loading ? (
            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
              <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 0.75rem', color: '#059669' }} />
              <p style={{ color: '#64748b', fontWeight: 600 }}>Loading scheduled trips...</p>
            </div>
          ) : scheduledRides.length === 0 ? (
            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
              <Calendar size={36} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ color: '#0f2920', marginBottom: '0.25rem', fontSize: '1.1rem', fontWeight: 900 }}>
                No scheduled rides found
              </p>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                Schedule confirmed rides from the Schedulable Queue tab.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.25rem' }}>
              {scheduledRides.map((ride) => (
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
                        <span>Pickup Time: <strong style={{ color: '#0f2920' }}>{ride.pickupTime}</strong></span>
                      </div>
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

                    {(ride.status === 'SCHEDULED' || ride.status === 'ASSIGNED') && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenRescheduleModal(ride)}
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
                          <span>Reschedule</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCancelModalRide(ride);
                            setCancelReason('');
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
                          <span>Cancel</span>
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
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>Schedule Office Ride</h2>
                <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700 }}>
                  {scheduleModalRide.bookingReference} — {scheduleModalRide.employeeName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setScheduleModalRide(null)}
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

            <div style={{ marginBottom: '1.25rem', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
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
                styleOverrides={{ height: '220px' }}
              />
            </div>

            <div style={{ background: '#f8faf9', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748b' }}>Route: </span>
                <strong style={{ color: '#0f2920' }}>{scheduleModalRide.pickupLocation}</strong>
                <ArrowRight size={12} style={{ margin: '0 0.4rem', verticalAlign: 'middle', color: '#64748b' }} />
                <strong style={{ color: '#0f2920' }}>{scheduleModalRide.destination}</strong>
              </div>
            </div>

            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Scheduled Date *</label>
                <input
                  type="date"
                  value={scheduleFormData.scheduledDate}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, scheduledDate: e.target.value })}
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
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Scheduled Pickup Time *</label>
                <input
                  type="time"
                  value={scheduleFormData.scheduledPickupTime}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, scheduledPickupTime: e.target.value })}
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
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Manager Scheduling Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="E.g., Assigned to Executive Van Route A"
                  value={scheduleFormData.notes}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, notes: e.target.value })}
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
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setScheduleModalRide(null)}
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
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>Reschedule Ride</h2>
                <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700 }}>
                  {rescheduleModalRide.bookingReference} — {rescheduleModalRide.employeeName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleModalRide(null)}
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

            <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>New Scheduled Date *</label>
                <input
                  type="date"
                  value={rescheduleFormData.scheduledDate}
                  onChange={(e) => setRescheduleFormData({ ...rescheduleFormData, scheduledDate: e.target.value })}
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
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>New Scheduled Pickup Time *</label>
                <input
                  type="time"
                  value={rescheduleFormData.scheduledPickupTime}
                  onChange={(e) => setRescheduleFormData({ ...rescheduleFormData, scheduledPickupTime: e.target.value })}
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
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Reschedule Reason *</label>
                <textarea
                  rows={2}
                  placeholder="State reason for rescheduling..."
                  value={rescheduleFormData.rescheduleReason}
                  onChange={(e) => setRescheduleFormData({ ...rescheduleFormData, rescheduleReason: e.target.value })}
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
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setRescheduleModalRide(null)}
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
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ef4444', margin: 0 }}>Cancel Ride Schedule</h2>
              <button
                type="button"
                onClick={() => setCancelModalRide(null)}
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

            <form onSubmit={handleCancelSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Are you sure you want to cancel the schedule for ride <strong style={{ color: '#0f2920' }}>{cancelModalRide.bookingReference}</strong>?
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Cancellation Reason *</label>
                <textarea
                  rows={2}
                  placeholder="State cancellation reason..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
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
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCancelModalRide(null)}
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
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Pickup Location</span>
                  <strong style={{ color: '#0f2920' }}>{viewModalRide.pickupLocation}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Destination</span>
                  <strong style={{ color: '#0f2920' }}>{viewModalRide.destination}</strong>
                </div>
              </div>

              <div style={{ background: '#f8faf9', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Scheduled Date</span>
                  <strong style={{ color: '#059669' }}>{viewModalRide.bookingDate}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Pickup Time</span>
                  <strong style={{ color: '#0f2920' }}>{viewModalRide.pickupTime}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Organization</span>
                  <strong style={{ color: '#2563eb' }}>{viewModalRide.organizationName}</strong>
                </div>
              </div>

              {viewModalRide.bookingNotes && (
                <div style={{ background: '#f8faf9', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Notes & History</span>
                  <span style={{ color: '#0f2920', fontSize: '0.85rem', fontWeight: 600 }}>{viewModalRide.bookingNotes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
