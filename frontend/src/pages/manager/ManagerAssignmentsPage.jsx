import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Car,
  User,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Phone,
  Trash2,
} from 'lucide-react';
import { rideService } from '../../services/rideService';
import { driverService } from '../../services/driverService';
import { vehicleService } from '../../services/vehicleService';
import { UnifiedRideDetailsModal } from '../../components/manager/UnifiedRideDetailsModal';
import { GuidedAssignmentModal } from '../../components/manager/GuidedAssignmentModal';

export const ManagerAssignmentsPage = () => {
  const [rides, setRides] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [selectedRideForDetails, setSelectedRideForDetails] = useState(null);
  const [selectedRideForAssign, setSelectedRideForAssign] = useState(null);

  const fetchAssignmentsData = async () => {
    try {
      const [pendingAssign, scheduled, drvList, vehList] = await Promise.all([
        rideService.getPendingAssignmentRides().catch(() => []),
        rideService.getScheduledRides().catch(() => []),
        driverService.searchDrivers().catch(() => []),
        vehicleService.searchVehicles().catch(() => []),
      ]);

      const map = new Map();
      (pendingAssign || []).forEach((r) => map.set(r.id, r));
      (scheduled || []).forEach((r) => map.set(r.id, r));

      const combined = Array.from(map.values()).filter(
        (r) => r.status === 'PENDING_APPROVAL' || r.status === 'APPROVED' || r.status === 'SCHEDULED' || r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS'
      );

      setRides(combined);
      setDrivers(drvList || []);
      setVehicles(vehList || []);
    } catch (err) {
      console.error('Failed to load assignments data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignmentsData();
    const interval = setInterval(fetchAssignmentsData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAssignmentsData();
  };

  const handleUnassign = async (rideId) => {
    if (!window.confirm('Are you sure you want to unassign this driver and vehicle from the ride?')) {
      return;
    }
    try {
      await rideService.unassignRideResources(rideId);
      fetchAssignmentsData();
    } catch (err) {
      alert(err?.message || 'Failed to unassign resources');
    }
  };

  // Groupings
  const unassignedList = rides.filter((r) => !r.driverName || !r.vehicleRegistration || r.status === 'PENDING_APPROVAL' || r.status === 'APPROVED' || r.status === 'SCHEDULED');
  const waitingDriverList = rides.filter((r) => r.status === 'ASSIGNED' && !r.driverAcceptedAt && !r.isDriverAccepted);
  const acceptedList = rides.filter((r) => (r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS') && (r.driverAcceptedAt || r.isDriverAccepted));
  const rejectedList = rides.filter((r) => r.rejectionReason && r.status === 'SCHEDULED');

  const filteredRides = rides.filter((ride) => {
    const matchesSearch =
      ride.bookingReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.vehicleRegistration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.pickupLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.destination?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'UNASSIGNED') return !ride.driverName || !ride.vehicleRegistration || ride.status === 'SCHEDULED';
    if (activeTab === 'WAITING') return ride.status === 'ASSIGNED' && !ride.driverAcceptedAt && !ride.isDriverAccepted;
    if (activeTab === 'ACCEPTED') return (ride.status === 'ASSIGNED' || ride.status === 'IN_PROGRESS') && (ride.driverAcceptedAt || ride.isDriverAccepted);
    if (activeTab === 'REJECTED') return Boolean(ride.rejectionReason && ride.status === 'SCHEDULED');

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#0f2920' }}>
              Assignment Center
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
              Smart Fleet Dispatch
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
            Pair approved employee ride schedules with certified available drivers and inspected vehicles.
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
          <span>{refreshing ? 'Refreshing...' : 'Refresh Assignments'}</span>
        </button>
      </div>

      {/* Operational Assignment Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
        <div
          onClick={() => setActiveTab('UNASSIGNED')}
          style={{
            padding: '1.25rem',
            borderRadius: '16px',
            background: '#ffffff',
            border: `1.5px solid ${activeTab === 'UNASSIGNED' ? '#2563eb' : '#e2e8f0'}`,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '0.725rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Needs Assignment
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f2920', marginTop: '4px' }}>
            {unassignedList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Awaiting driver + vehicle</div>
        </div>

        <div
          onClick={() => setActiveTab('WAITING')}
          style={{
            padding: '1.25rem',
            borderRadius: '16px',
            background: '#ffffff',
            border: `1.5px solid ${activeTab === 'WAITING' ? '#7c3aed' : '#e2e8f0'}`,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '0.725rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Waiting For Driver
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f2920', marginTop: '4px' }}>
            {waitingDriverList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Dispatched, pending accept</div>
        </div>

        <div
          onClick={() => setActiveTab('ACCEPTED')}
          style={{
            padding: '1.25rem',
            borderRadius: '16px',
            background: '#ffffff',
            border: `1.5px solid ${activeTab === 'ACCEPTED' ? '#059669' : '#e2e8f0'}`,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '0.725rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Driver Confirmed
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f2920', marginTop: '4px' }}>
            {acceptedList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Driver accepted & locked</div>
        </div>

        <div
          onClick={() => setActiveTab('REJECTED')}
          style={{
            padding: '1.25rem',
            borderRadius: '16px',
            background: '#ffffff',
            border: `1.5px solid ${activeTab === 'REJECTED' ? '#ef4444' : '#e2e8f0'}`,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '0.725rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Driver Rejections
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f2920', marginTop: '4px' }}>
            {rejectedList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Needs immediate reassignment</div>
        </div>
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
            placeholder="Search by Employee, Driver, Vehicle Plate, or Booking Ref..."
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
            { key: 'ALL', label: 'All Scheduled' },
            { key: 'UNASSIGNED', label: 'Needs Assignment' },
            { key: 'WAITING', label: 'Waiting Acceptance' },
            { key: 'ACCEPTED', label: 'Driver Accepted' },
            { key: 'REJECTED', label: 'Rejections' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.5rem 0.95rem',
                borderRadius: '8px',
                background: activeTab === tab.key ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : '#eef2ef',
                border: `1.5px solid ${activeTab === tab.key ? '#1f5643' : '#e2e8f0'}`,
                color: activeTab === tab.key ? '#ffffff' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: activeTab === tab.key ? '0 3px 10px rgba(19, 56, 44, 0.25)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading assignments...
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
          <UserCheck size={40} color="#64748b" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ fontWeight: 800, color: '#0f2920', fontSize: '1.05rem' }}>No Rides In Selected View</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
            Try selecting a different filter tab or clearing your search.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredRides.map((ride) => {
            const isAssigned = Boolean(ride.driverName && ride.vehicleRegistration);
            const isAccepted = Boolean(ride.driverAcceptedAt || ride.isDriverAccepted);
            const isRejected = Boolean(ride.rejectionReason && ride.status === 'SCHEDULED');

            return (
              <div
                key={ride.id}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: '16px',
                  background: '#ffffff',
                  border: isRejected
                    ? '1.5px solid #fecaca'
                    : isAccepted
                    ? '1.5px solid #a7f3d0'
                    : isAssigned
                    ? '1.5px solid #ddd6fe'
                    : '1.5px solid #bfdbfe',
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                }}
              >
                {/* Section 1: Passenger & Route */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.675rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        background: isRejected
                          ? '#fef2f2'
                          : isAccepted
                          ? '#ecfdf5'
                          : isAssigned
                          ? '#f5f3ff'
                          : '#eff6ff',
                        color: isRejected ? '#ef4444' : isAccepted ? '#059669' : isAssigned ? '#7c3aed' : '#2563eb',
                        border: `1px solid ${
                          isRejected
                            ? '#fecaca'
                            : isAccepted
                            ? '#a7f3d0'
                            : isAssigned
                            ? '#ddd6fe'
                            : '#bfdbfe'
                        }`,
                      }}
                    >
                      {isRejected
                        ? 'DRIVER REJECTED'
                        : isAccepted
                        ? 'DRIVER ACCEPTED'
                        : isAssigned
                        ? 'WAITING FOR DRIVER'
                        : 'NEEDS ASSIGNMENT'}
                    </span>

                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f2920' }}>
                      Ride #{ride.bookingReference}
                    </span>
                    <span style={{ fontSize: '0.775rem', color: '#64748b' }}>
                      &bull; {ride.bookingDate} at <strong style={{ color: '#059669' }}>{ride.pickupTime || '08:30 AM'}</strong>
                    </span>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f2920' }}>
                    {ride.employeeName || 'Corporate Employee'}{' '}
                    <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#64748b' }}>
                      ({ride.employeeEmail})
                    </span>
                  </div>

                  <div style={{ fontSize: '0.825rem', color: '#0f2920', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                    <MapPin size={14} color="#059669" />
                    <span>{ride.pickupLocation} &rarr; {ride.destination}</span>
                  </div>

                  {ride.rejectionReason && (
                    <div style={{ fontSize: '0.775rem', color: '#ef4444', fontWeight: 700, marginTop: '2px' }}>
                      ⚠ Rejection Note: "{ride.rejectionReason}"
                    </div>
                  )}
                </div>

                {/* Section 2: Driver & Vehicle Allocation */}
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    padding: '0.75rem 1.1rem',
                    borderRadius: '12px',
                    background: '#f8faf9',
                    border: '1.5px solid #e2e8f0',
                    minWidth: '300px',
                  }}
                >
                  {/* Driver Column */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.675rem', color: '#059669', fontWeight: 800, textTransform: 'uppercase' }}>
                      Driver
                    </div>
                    {ride.driverName ? (
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f2920', fontSize: '0.875rem' }}>{ride.driverName}</div>
                        <div style={{ fontSize: '0.725rem', color: '#059669', fontWeight: 700 }}>
                          {ride.driverLicenseNumber || 'DL-VALID-2027'}
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 800 }}>Unassigned</div>
                    )}
                  </div>

                  {/* Vehicle Column */}
                  <div style={{ flex: 1, borderLeft: '1.5px solid #e2e8f0', paddingLeft: '1rem' }}>
                    <div style={{ fontSize: '0.675rem', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase' }}>
                      Vehicle
                    </div>
                    {ride.vehicleRegistration ? (
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f2920', fontSize: '0.875rem' }}>
                          {ride.vehicleMakeModel || 'Toyota Innova'}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#2563eb', fontWeight: 700 }}>
                          Plate: {ride.vehicleRegistration}
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 800 }}>Unassigned</div>
                    )}
                  </div>
                </div>

                {/* Section 3: Action Buttons */}
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

                  {isAssigned && (
                    <button
                      type="button"
                      onClick={() => handleUnassign(ride.id)}
                      title="Unassign current driver & vehicle"
                      style={{
                        padding: '0.55rem',
                        borderRadius: '8px',
                        background: '#fef2f2',
                        border: '1.5px solid #fecaca',
                        color: '#ef4444',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedRideForAssign(ride)}
                    style={{
                      padding: '0.55rem 1.15rem',
                      borderRadius: '8px',
                      background: isAssigned
                        ? 'linear-gradient(180deg, #475569 0%, #334155 100%)'
                        : isRejected
                        ? 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)'
                        : 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.825rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <span>{isAssigned ? 'Reassign' : isRejected ? 'Reassign Driver' : 'Assign'}</span>
                    <ArrowRight size={14} />
                  </button>
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
        onAssignmentSuccess={() => fetchAssignmentsData()}
      />
    </div>
  );
};
export default ManagerAssignmentsPage;
