import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Search,
  Filter,
  Clock,
  MapPin,
  Car,
  User,
  CheckCircle2,
  RefreshCw,
  Edit2,
  Calendar,
  AlertTriangle,
  UserCheck,
  X,
} from 'lucide-react';
import { rideService } from '../../services/rideService';
import { UnifiedRideDetailsModal } from '../../components/manager/UnifiedRideDetailsModal';
import { GuidedAssignmentModal } from '../../components/manager/GuidedAssignmentModal';

export const ManagerSchedulePage = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');

  // Reschedule Modal state
  const [rescheduleRide, setRescheduleRide] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Modals
  const [selectedRideForDetails, setSelectedRideForDetails] = useState(null);
  const [selectedRideForAssign, setSelectedRideForAssign] = useState(null);

  const fetchSchedule = async () => {
    try {
      const data = await rideService.getScheduledRides({
        search: searchTerm || undefined,
        bookingDate: selectedDate || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setRides(data || []);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [statusFilter, selectedDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSchedule();
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate || !newTime) return;

    try {
      setSubmittingReschedule(true);
      await rideService.rescheduleRide(rescheduleRide.id, {
        scheduledDate: newDate,
        scheduledPickupTime: newTime.length === 5 ? `${newTime}:00` : newTime,
        rescheduleReason: rescheduleReason || 'Manager operational adjustment',
      });
      setRescheduleRide(null);
      fetchSchedule();
    } catch (err) {
      alert(err?.message || 'Failed to reschedule ride');
    } finally {
      setSubmittingReschedule(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#0f2920' }}>
              Schedule Calendar & Dispatch Plan
            </h1>
            <span
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
                fontSize: '0.75rem',
                fontWeight: 800,
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              {rides.length} Total Rides
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
            View and reschedule corporate bookings, adjust departure times, and manage dispatch calendar.
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            fetchSchedule();
          }}
          disabled={refreshing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.6rem 1.1rem',
            borderRadius: '10px',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            color: '#0f2920',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: refreshing ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'spin-animation' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Schedule'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          background: '#ffffff',
          padding: '1.1rem 1.25rem',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search reference, employee, pickup or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.85rem 0.6rem 2.25rem',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              color: '#0f172a',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              color: '#0f172a',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'All' },
            { key: 'SCHEDULED', label: 'Scheduled' },
            { key: 'ASSIGNED', label: 'Assigned' },
            { key: 'IN_PROGRESS', label: 'In Progress' },
            { key: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              style={{
                padding: '0.5rem 0.95rem',
                borderRadius: '8px',
                background: statusFilter === tab.key ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : '#eef2ef',
                border: `1.5px solid ${statusFilter === tab.key ? '#1f5643' : '#e2e8f0'}`,
                color: statusFilter === tab.key ? '#ffffff' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: statusFilter === tab.key ? '0 3px 10px rgba(19, 56, 44, 0.25)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </form>

      {/* Schedule Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading schedule records...
        </div>
      ) : rides.length === 0 ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            borderRadius: '16px',
            background: '#ffffff',
            border: '1.5px dashed #cbd5e1',
          }}
        >
          <CalendarDays size={40} color="#64748b" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ fontWeight: 800, color: '#0f2920', fontSize: '1.05rem' }}>No Rides Found</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
            Try adjusting your search query or date filter.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {rides.map((ride) => (
            <div
              key={ride.id}
              style={{
                padding: '1.25rem 1.5rem',
                borderRadius: '16px',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: '300px' }}>
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: '#f8faf9',
                    border: '1.5px solid #e2e8f0',
                    textAlign: 'center',
                    minWidth: '90px',
                  }}
                >
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#059669', fontFamily: 'monospace' }}>
                    {ride.pickupTime || '08:30'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                    {ride.bookingDate}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.675rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        background:
                          ride.status === 'COMPLETED'
                            ? '#f1f5f9'
                            : ride.status === 'IN_PROGRESS'
                            ? '#ecfdf5'
                            : ride.status === 'ASSIGNED'
                            ? '#eff6ff'
                            : '#fffbeb',
                        color:
                          ride.status === 'COMPLETED'
                            ? '#64748b'
                            : ride.status === 'IN_PROGRESS'
                            ? '#059669'
                            : ride.status === 'ASSIGNED'
                            ? '#2563eb'
                            : '#d97706',
                        border: `1px solid ${
                          ride.status === 'COMPLETED'
                            ? '#e2e8f0'
                            : ride.status === 'IN_PROGRESS'
                            ? '#a7f3d0'
                            : ride.status === 'ASSIGNED'
                            ? '#bfdbfe'
                            : '#fde68a'
                        }`,
                      }}
                    >
                      {ride.status}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f2920' }}>
                      Ride #{ride.bookingReference}
                    </span>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f2920', marginTop: '2px' }}>
                    {ride.employeeName || 'Corporate Passenger'}
                  </div>

                  <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                    <MapPin size={14} color="#059669" />
                    <span style={{ color: '#0f2920' }}>{ride.pickupLocation} &rarr; {ride.destination}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedRideForDetails(ride)}
                  style={{
                    padding: '0.55rem 0.95rem',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    color: '#0f2920',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Details
                </button>

                {ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setRescheduleRide(ride);
                      setNewDate(ride.bookingDate || '');
                      setNewTime(ride.pickupTime ? ride.pickupTime.substring(0, 5) : '08:30');
                    }}
                    style={{
                      padding: '0.55rem 0.95rem',
                      borderRadius: '8px',
                      background: '#eff6ff',
                      border: '1.5px solid #bfdbfe',
                      color: '#2563eb',
                      fontSize: '0.825rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Edit2 size={13} />
                    <span>Reschedule</span>
                  </button>
                )}

                {(!ride.driverName || !ride.vehicleRegistration) && (
                  <button
                    type="button"
                    onClick={() => setSelectedRideForAssign(ride)}
                    style={{
                      padding: '0.55rem 1.15rem',
                      borderRadius: '8px',
                      background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.825rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 12px rgba(19, 56, 44, 0.25)',
                    }}
                  >
                    <UserCheck size={14} />
                    <span>Assign</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleRide && (
        <div
          className="modal-overlay"
          onClick={() => setRescheduleRide(null)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '20px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#0f2920' }}>
                Reschedule Ride #{rescheduleRide.bookingReference}
              </h3>
              <button
                type="button"
                onClick={() => setRescheduleRide(null)}
                style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: '8px', padding: '0.35rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#374151', marginBottom: '4px', fontWeight: 700 }}>
                  New Date
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    color: '#0f172a',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#374151', marginBottom: '4px', fontWeight: 700 }}>
                  New Pickup Time
                </label>
                <input
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    color: '#0f172a',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#374151', marginBottom: '4px', fontWeight: 700 }}>
                  Reschedule Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="E.g. Shift change or client meeting adjustment"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    color: '#0f172a',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setRescheduleRide(null)}
                  style={{
                    padding: '0.6rem 1.1rem',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    color: '#0f2920',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingReschedule}
                  style={{
                    padding: '0.6rem 1.35rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: submittingReschedule ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(19, 56, 44, 0.25)',
                  }}
                >
                  {submittingReschedule ? 'Saving...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified Modals */}
      <UnifiedRideDetailsModal
        isOpen={Boolean(selectedRideForDetails)}
        ride={selectedRideForDetails}
        onClose={() => setSelectedRideForDetails(null)}
        onOpenAssign={(ride) => setSelectedRideForAssign(ride)}
      />

      <GuidedAssignmentModal
        isOpen={Boolean(selectedRideForAssign)}
        ride={selectedRideForAssign}
        onClose={() => setSelectedRideForAssign(null)}
        onAssignmentSuccess={() => fetchSchedule()}
      />
    </div>
  );
};
export default ManagerSchedulePage;
