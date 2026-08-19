import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  Radio,
  UserCheck,
  AlertTriangle,
  MapPin,
  Calendar,
  RefreshCw,
  Search,
  ExternalLink,
  Car,
  User,
} from 'lucide-react';
import { rideService } from '../../services/rideService';
import { UnifiedRideDetailsModal } from '../../components/manager/UnifiedRideDetailsModal';
import { GuidedAssignmentModal } from '../../components/manager/GuidedAssignmentModal';

export const ManagerOperationsPage = () => {
  const navigate = useNavigate();

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [selectedRideForDetails, setSelectedRideForDetails] = useState(null);
  const [selectedRideForAssign, setSelectedRideForAssign] = useState(null);

  const fetchOperations = async () => {
    try {
      const scheduled = await rideService.getScheduledRides().catch(() => []);
      const sorted = (scheduled || []).sort((a, b) => {
        const timeA = a.pickupTime || '00:00';
        const timeB = b.pickupTime || '00:00';
        return timeA.localeCompare(timeB);
      });
      setRides(sorted);
    } catch (err) {
      console.error('Failed to load operations timeline:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOperations();
    const interval = setInterval(fetchOperations, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOperations();
  };

  const filteredRides = rides.filter((ride) => {
    const matchesSearch =
      ride.bookingReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.pickupLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.destination?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || ride.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#0f2920' }}>
              Today's Operations Timeline
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
              Live Timeline
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
            Chronological operations feed for today's dispatches, active trips, and driver verifications.
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
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
          <span>{refreshing ? 'Refreshing...' : 'Refresh Timeline'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          padding: '1.1rem 1.25rem',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search by Employee, Driver, Location, or Booking Ref..."
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

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'All Today' },
            { key: 'IN_PROGRESS', label: 'In Progress' },
            { key: 'ASSIGNED', label: 'Assigned' },
            { key: 'SCHEDULED', label: 'Needs Assignment' },
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
      </div>

      {/* Timeline View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading operations timeline...
        </div>
      ) : filteredRides.length === 0 ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            borderRadius: '16px',
            background: '#ffffff',
            border: '1.5px dashed #cbd5e1',
          }}
        >
          <Clock size={40} color="#64748b" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ fontWeight: 800, color: '#0f2920', fontSize: '1.05rem' }}>No Operational Rides Listed</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
            No operations scheduled for the current criteria.
          </div>
        </div>
      ) : (
        <div
          style={{
            position: 'relative',
            paddingLeft: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Vertical Timeline Rule */}
          <div
            style={{
              position: 'absolute',
              left: '11px',
              top: '12px',
              bottom: '12px',
              width: '2px',
              background: '#cbd5e1',
            }}
          />

          {filteredRides.map((ride, idx) => {
            const isCompleted = ride.status === 'COMPLETED';
            const isInProgress = ride.status === 'IN_PROGRESS';
            const isAssigned = ride.status === 'ASSIGNED';
            const isNeedsAssign = !ride.driverName || !ride.vehicleRegistration || ride.status === 'SCHEDULED';

            const dotColor = isCompleted
              ? '#94a3b8'
              : isInProgress
              ? '#10b981'
              : isAssigned
              ? '#38bdf8'
              : '#f59e0b';

            return (
              <div key={ride.id} style={{ position: 'relative' }}>
                {/* Timeline Dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-2.15rem',
                    top: '1.25rem',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: `3px solid ${dotColor}`,
                    boxShadow: isInProgress ? `0 0 10px ${dotColor}` : 'none',
                    zIndex: 2,
                  }}
                />

                {/* Timeline Card */}
                <div
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderRadius: '16px',
                    background: '#ffffff',
                    border: isInProgress
                      ? '1.5px solid #a7f3d0'
                      : '1.5px solid #e2e8f0',
                    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  {/* Left: Time + Ride Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: '300px' }}>
                    <div
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '10px',
                        background: '#f8faf9',
                        border: '1.5px solid #e2e8f0',
                        textAlign: 'center',
                        minWidth: '80px',
                      }}
                    >
                      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#059669', fontFamily: 'monospace' }}>
                        {ride.pickupTime || '08:30'}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>
                        Slot
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
                            background: isInProgress
                              ? '#ecfdf5'
                              : isCompleted
                              ? '#f1f5f9'
                              : isAssigned
                              ? '#eff6ff'
                              : '#fffbeb',
                            color: isInProgress
                              ? '#059669'
                              : isCompleted
                              ? '#64748b'
                              : isAssigned
                              ? '#2563eb'
                              : '#d97706',
                            border: `1px solid ${
                              isInProgress
                                ? '#a7f3d0'
                                : isCompleted
                                ? '#e2e8f0'
                                : isAssigned
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

                  {/* Middle: Driver & Vehicle Allocation */}
                  <div
                    style={{
                      padding: '0.65rem 1rem',
                      borderRadius: '12px',
                      background: '#f8faf9',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.675rem', color: '#059669', textTransform: 'uppercase', fontWeight: 800 }}>Driver</div>
                      <div style={{ fontWeight: 800, color: ride.driverName ? '#0f2920' : '#ef4444' }}>
                        {ride.driverName || 'Unassigned'}
                      </div>
                    </div>
                    <div style={{ borderLeft: '1.5px solid #e2e8f0', paddingLeft: '1rem' }}>
                      <div style={{ fontSize: '0.675rem', color: '#2563eb', textTransform: 'uppercase', fontWeight: 800 }}>Vehicle</div>
                      <div style={{ fontWeight: 800, color: ride.vehicleRegistration ? '#0f2920' : '#ef4444' }}>
                        {ride.vehicleRegistration || 'Unassigned'}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

                    {isNeedsAssign && (
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

                    {isInProgress && (
                      <button
                        type="button"
                        onClick={() => navigate('/transport-manager/live-trips')}
                        style={{
                          padding: '0.55rem 1.15rem',
                          borderRadius: '8px',
                          background: 'linear-gradient(180deg, #059669 0%, #047857 100%)',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '0.825rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                        }}
                      >
                        <Radio size={14} />
                        <span>Live GPS</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unified Modals */}
      <UnifiedRideDetailsModal
        isOpen={Boolean(selectedRideForDetails)}
        ride={selectedRideForDetails}
        onClose={() => setSelectedRideForDetails(null)}
        onOpenAssign={(ride) => setSelectedRideForAssign(ride)}
        onOpenLiveMap={() => navigate('/transport-manager/live-trips')}
      />

      <GuidedAssignmentModal
        isOpen={Boolean(selectedRideForAssign)}
        ride={selectedRideForAssign}
        onClose={() => setSelectedRideForAssign(null)}
        onAssignmentSuccess={() => fetchOperations()}
      />
    </div>
  );
};
export default ManagerOperationsPage;
