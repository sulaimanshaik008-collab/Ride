import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  User,
  ArrowRight,
  RefreshCw,
  UserCheck,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { rideService } from '../../services/rideService';
import { UnifiedRideDetailsModal } from '../../components/manager/UnifiedRideDetailsModal';
import { GuidedAssignmentModal } from '../../components/manager/GuidedAssignmentModal';
import { RequestApprovalModal } from '../../components/manager/RequestApprovalModal';

export const ManagerRideRequestsPage = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [selectedRideForDetails, setSelectedRideForDetails] = useState(null);
  const [selectedRideForAssign, setSelectedRideForAssign] = useState(null);
  const [selectedRideForApproval, setSelectedRideForApproval] = useState(null);

  const fetchRequests = async () => {
    try {
      const [schedulable, pendingAssign, allScheduled] = await Promise.all([
        rideService.getSchedulableRides().catch(() => []),
        rideService.getPendingAssignmentRides().catch(() => []),
        rideService.getScheduledRides().catch(() => []),
      ]);

      // Combine requests, avoiding duplicates by id
      const map = new Map();
      (schedulable || []).forEach((r) => map.set(r.id, r));
      (pendingAssign || []).forEach((r) => map.set(r.id, r));
      (allScheduled || []).forEach((r) => map.set(r.id, r));

      const combined = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      setRides(combined);
    } catch (err) {
      console.error('Failed to fetch ride requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const filteredRides = rides.filter((ride) => {
    const matchesSearch =
      ride.bookingReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.pickupLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.destination?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || ride.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = rides.filter((r) => r.status === 'PENDING_APPROVAL').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#0f2920' }}>
              Employee Ride Requests
            </h1>
            {pendingCount > 0 && (
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  background: '#fffbeb',
                  color: '#d97706',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  border: '1px solid #fde68a',
                }}
              >
                {pendingCount} Pending Approval
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
            Review, authorize, reject, or schedule incoming employee corporate commute requests.
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
          <span>{refreshing ? 'Refreshing...' : 'Refresh List'}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
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
        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search by Employee, Booking #, Pickup or Dropoff..."
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

        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'All Requests' },
            { key: 'PENDING_APPROVAL', label: 'Pending Approval' },
            { key: 'SCHEDULED', label: 'Scheduled' },
            { key: 'ASSIGNED', label: 'Assigned' },
            { key: 'REJECTED', label: 'Rejected' },
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

      {/* Requests Table / Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading ride requests...
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
          <Inbox size={40} color="#64748b" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ fontWeight: 800, color: '#0f2920', fontSize: '1.05rem' }}>No Ride Requests Found</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
            No incoming employee ride requests matching the selected filters.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredRides.map((ride) => {
            const isPending = ride.status === 'PENDING_APPROVAL';
            return (
              <div
                key={ride.id}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: '16px',
                  background: '#ffffff',
                  border: isPending ? '1.5px solid #fde68a' : '1.5px solid #e2e8f0',
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                }}
              >
                {/* Left: Passenger and Route */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, minWidth: '320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        background:
                          isPending
                            ? '#fffbeb'
                            : ride.status === 'SCHEDULED'
                            ? '#eff6ff'
                            : ride.status === 'ASSIGNED'
                            ? '#f5f3ff'
                            : '#fef2f2',
                        color:
                          isPending
                            ? '#d97706'
                            : ride.status === 'SCHEDULED'
                            ? '#2563eb'
                            : ride.status === 'ASSIGNED'
                            ? '#7c3aed'
                            : '#ef4444',
                        border: `1px solid ${
                          isPending
                            ? '#fde68a'
                            : ride.status === 'SCHEDULED'
                            ? '#bfdbfe'
                            : ride.status === 'ASSIGNED'
                            ? '#ddd6fe'
                            : '#fecaca'
                        }`,
                      }}
                    >
                      {ride.status}
                    </span>

                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f2920' }}>
                      Ride #{ride.bookingReference}
                    </span>

                    <span style={{ fontSize: '0.775rem', color: '#64748b' }}>
                      &bull; {ride.bookingDate} at <strong style={{ color: '#059669' }}>{ride.pickupTime || '08:30 AM'}</strong>
                    </span>
                  </div>

                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f2920' }}>
                    {ride.employeeName || 'Corporate Employee'}{' '}
                    <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#64748b' }}>
                      ({ride.employeeEmail})
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.825rem', color: '#0f2920', marginTop: '2px', fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={14} color="#059669" /> {ride.pickupLocation}
                    </span>
                    <span style={{ color: '#94a3b8' }}>&rarr;</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={14} color="#2563eb" /> {ride.destination}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
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
                    View Details
                  </button>

                  {isPending && (
                    <button
                      type="button"
                      onClick={() => setSelectedRideForApproval(ride)}
                      style={{
                        padding: '0.55rem 1.25rem',
                        borderRadius: '8px',
                        background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                        color: '#ffffff',
                        border: '1px solid #1f5643',
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
                      <span>Review Request</span>
                    </button>
                  )}

                  {ride.status === 'APPROVED' && (
                    <button
                      type="button"
                      onClick={() => setSelectedRideForAssign(ride)}
                      style={{
                        padding: '0.55rem 1.25rem',
                        borderRadius: '8px',
                        background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '0.825rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                      }}
                    >
                      <span>Assign Driver</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
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
      />

      <GuidedAssignmentModal
        isOpen={Boolean(selectedRideForAssign)}
        ride={selectedRideForAssign}
        onClose={() => setSelectedRideForAssign(null)}
        onAssignmentSuccess={() => fetchRequests()}
      />

      <RequestApprovalModal
        isOpen={Boolean(selectedRideForApproval)}
        ride={selectedRideForApproval}
        onClose={() => setSelectedRideForApproval(null)}
        onDecisionSuccess={() => fetchRequests()}
      />
    </div>
  );
};
export default ManagerRideRequestsPage;
