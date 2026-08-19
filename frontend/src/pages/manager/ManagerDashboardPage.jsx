import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  UserCheck,
  Radio,
  Users,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Car,
  ShieldCheck,
  Calendar,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { rideService } from '../../services/rideService';
import { driverService } from '../../services/driverService';
import { vehicleService } from '../../services/vehicleService';
import { UnifiedRideDetailsModal } from '../../components/manager/UnifiedRideDetailsModal';
import { GuidedAssignmentModal } from '../../components/manager/GuidedAssignmentModal';
import { RequestApprovalModal } from '../../components/manager/RequestApprovalModal';

export const ManagerDashboardPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data States
  const [schedulableRides, setSchedulableRides] = useState([]);
  const [pendingAssignmentRides, setPendingAssignmentRides] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [scheduledRides, setScheduledRides] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // Modal States
  const [selectedRideForDetails, setSelectedRideForDetails] = useState(null);
  const [selectedRideForAssign, setSelectedRideForAssign] = useState(null);
  const [selectedRideForApproval, setSelectedRideForApproval] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [
        schedulable,
        pendingAssign,
        active,
        scheduled,
        drvList,
        vehList,
      ] = await Promise.all([
        rideService.getSchedulableRides().catch(() => []),
        rideService.getPendingAssignmentRides().catch(() => []),
        rideService.getActiveTrips().catch(() => []),
        rideService.getScheduledRides().catch(() => []),
        driverService.searchDrivers().catch(() => []),
        vehicleService.searchVehicles().catch(() => []),
      ]);

      setSchedulableRides(schedulable || []);
      setPendingAssignmentRides(pendingAssign || []);
      setActiveTrips(active || []);
      setScheduledRides(scheduled || []);
      setDrivers(drvList || []);
      setVehicles(vehList || []);
    } catch (err) {
      console.error('Failed to load manager dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Operational Calculations
  const pendingApprovals = schedulableRides.filter((r) => r.status === 'PENDING_APPROVAL');
  const rejectedAssignments = scheduledRides.filter(
    (r) => r.status === 'SCHEDULED' && r.rejectionReason
  );
  const unassignedRides = pendingAssignmentRides.filter(
    (r) => !r.driverName || !r.vehicleRegistration
  );
  const availableDrivers = drivers.filter(
    (d) => d.driverStatus === 'ACTIVE' && d.availabilityStatus === 'AVAILABLE'
  );
  const availableVehicles = vehicles.filter(
    (v) => v.vehicleStatus === 'ACTIVE' && v.availabilityStatus === 'AVAILABLE'
  );
  const completedToday = scheduledRides.filter((r) => r.status === 'COMPLETED');

  // Combined Action Required Items
  const actionRequiredItems = [
    ...pendingApprovals.map((ride) => ({
      type: 'APPROVAL_NEEDED',
      title: `Ride Request Awaiting Approval (${ride.bookingReference})`,
      badge: 'APPROVAL NEEDED',
      badgeColor: '#fbbf24',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      ride,
      actionText: 'Review & Approve',
      actionHandler: () => setSelectedRideForApproval(ride),
    })),
    ...rejectedAssignments.map((ride) => ({
      type: 'DRIVER_REJECTED',
      title: `Driver Rejected Assignment (${ride.bookingReference})`,
      badge: 'DRIVER REJECTED',
      badgeColor: '#f87171',
      badgeBg: 'rgba(239, 68, 68, 0.15)',
      ride,
      actionText: 'Reassign Driver',
      actionHandler: () => setSelectedRideForAssign(ride),
    })),
    ...unassignedRides.map((ride) => ({
      type: 'NEEDS_ASSIGNMENT',
      title: `Approved Ride Needs Driver + Vehicle (${ride.bookingReference})`,
      badge: 'NEEDS DRIVER & VEHICLE',
      badgeColor: '#38bdf8',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      ride,
      actionText: 'Assign Driver & Vehicle',
      actionHandler: () => setSelectedRideForAssign(ride),
    })),
  ];

  const greetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* ======================================================== */}
      {/* 1. OPERATIONAL COMMAND HEADER */}
      {/* ======================================================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1
              style={{
                fontSize: '1.85rem',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                margin: 0,
                color: '#0f2920',
              }}
            >
              {greetingTime()}, {currentUser?.fullName || 'Transport Manager'}
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
                fontSize: '0.75rem',
                fontWeight: 800,
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <Sparkles size={13} />
              <span>Operations Dispatch</span>
            </span>
          </div>

          <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '6px' }}>
            Organization: <strong style={{ color: '#0f2920' }}>{currentUser?.organizationName || 'Acme Global Corporation'}</strong> &bull; Today:{' '}
            <span style={{ color: '#0f2920', fontWeight: 700 }}>
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Quick Operational Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleManualRefresh}
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
            <span>{refreshing ? 'Syncing...' : 'Sync Fleet'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/transport-manager/live-trips')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 800,
              border: '1px solid #1f5643',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(19, 56, 44, 0.35)',
            }}
          >
            <Radio size={15} />
            <span>Open Live GPS Radar</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. OPERATIONAL SUMMARY METRICS CARDS */}
      {/* ======================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Pending Requests */}
        <div
          onClick={() => navigate('/transport-manager/requests')}
          style={{
            padding: '1.5rem',
            borderRadius: '16px',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'transform 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#d97706')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Requests
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
              <Inbox size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f2920', marginTop: '0.6rem' }}>
            {pendingApprovals.length}
          </div>
          <div style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
            Awaiting manager approval
          </div>
        </div>

        {/* Need Assignment */}
        <div
          onClick={() => navigate('/transport-manager/assignments')}
          style={{
            padding: '1.5rem',
            borderRadius: '16px',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'transform 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Need Assignment
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
              <UserCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f2920', marginTop: '0.6rem' }}>
            {pendingAssignmentRides.length}
          </div>
          <div style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
            Approved rides pending driver + vehicle
          </div>
        </div>

        {/* Active Trips */}
        <div
          onClick={() => navigate('/transport-manager/live-trips')}
          style={{
            padding: '1.5rem',
            borderRadius: '16px',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'transform 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#059669')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Trips (Live)
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
              <Radio size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f2920', marginTop: '0.6rem' }}>
            {activeTrips.length}
          </div>
          <div style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
            Currently in transit with live GPS
          </div>
        </div>

        {/* Available Drivers */}
        <div
          onClick={() => navigate('/transport-manager/drivers')}
          style={{
            padding: '1.5rem',
            borderRadius: '16px',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'transform 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#7c3aed')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Available Drivers
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f2920', marginTop: '0.6rem' }}>
            {availableDrivers.length}{' '}
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#64748b' }}>/ {drivers.length}</span>
          </div>
          <div style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
            Ready for dispatch
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. ACTION REQUIRED SECTION (TOP OPERATIONAL PRIORITY) */}
      {/* ======================================================== */}
      <div
        style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: '#0f2920' }}>
                ACTION REQUIRED
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                {actionRequiredItems.length === 0
                  ? 'All operational items are cleared and in good standing.'
                  : `${actionRequiredItems.length} operational tasks requiring immediate manager decision.`}
              </div>
            </div>
          </div>

          {actionRequiredItems.length > 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.3rem 0.85rem',
                borderRadius: '9999px',
                background: '#fef2f2',
                color: '#ef4444',
                border: '1px solid #fecaca',
              }}
            >
              {actionRequiredItems.length} Urgent Items
            </span>
          )}
        </div>

        {/* Action Items List */}
        {actionRequiredItems.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              borderRadius: '14px',
              background: '#f8faf9',
              border: '1.5px dashed #cbd5e1',
            }}
          >
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontWeight: 800, color: '#0f2920', fontSize: '1.05rem' }}>Fleet Operations Running Smoothly</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
              No pending approvals, unassigned rides, or driver rejections at this moment.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {actionRequiredItems.slice(0, 6).map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1.1rem 1.25rem',
                  borderRadius: '14px',
                  background: '#f8faf9',
                  border: '1.5px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1, minWidth: '300px' }}>
                  <div style={{ width: '4px', height: '44px', borderRadius: '4px', background: item.badgeColor }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '3px' }}>
                      <span
                        style={{
                          fontSize: '0.675rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          background: item.badgeBg,
                          color: item.badgeColor,
                        }}
                      >
                        {item.badge}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f2920' }}>
                        Ride #{item.ride.bookingReference}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.925rem', fontWeight: 800, color: '#0f2920' }}>
                      {item.ride.employeeName || 'Corporate Employee'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.775rem', color: '#64748b', marginTop: '3px' }}>
                      <span>From: <strong style={{ color: '#334155' }}>{item.ride.pickupLocation}</strong></span>
                      <span>&bull;</span>
                      <span>To: <strong style={{ color: '#334155' }}>{item.ride.destination}</strong></span>
                      <span>&bull;</span>
                      <span>Pickup: <strong style={{ color: '#059669' }}>{item.ride.pickupTime || '08:30 AM'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Trigger Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedRideForDetails(item.ride)}
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

                  <button
                    type="button"
                    onClick={item.actionHandler}
                    style={{
                      padding: '0.55rem 1.25rem',
                      borderRadius: '8px',
                      background:
                        item.type === 'APPROVAL_NEEDED'
                          ? 'linear-gradient(180deg, #184738 0%, #103327 100%)'
                          : 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
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
                    <span>{item.actionText}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. TODAY'S OPERATIONS TIMELINE & FLEET RADAR */}
      {/* ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* Today's Operational Schedule Timeline */}
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="#059669" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: '#0f2920' }}>
                Today's Operations Timeline
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/transport-manager/operations')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#059669',
                fontSize: '0.825rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span>View Full Timeline</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {scheduledRides.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
              No rides scheduled for today yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {scheduledRides.slice(0, 5).map((ride) => (
                <div
                  key={ride.id}
                  onClick={() => setSelectedRideForDetails(ride)}
                  style={{
                    padding: '0.9rem 1.1rem',
                    borderRadius: '12px',
                    background: '#f8faf9',
                    border: '1.5px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        padding: '0.35rem 0.6rem',
                        borderRadius: '8px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        fontFamily: 'monospace',
                        fontSize: '0.775rem',
                        fontWeight: 800,
                        color: '#059669',
                      }}
                    >
                      {ride.pickupTime || '08:30'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f2920' }}>
                        {ride.employeeName || 'Employee'}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: '#64748b' }}>
                        {ride.pickupLocation} &rarr; {ride.destination}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.25rem 0.6rem',
                        borderRadius: '9999px',
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
                    <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '3px', fontWeight: 600 }}>
                      Driver: {ride.driverName || 'Unassigned'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Active Trips Radar Preview */}
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Radio size={18} color="#059669" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: '#0f2920' }}>
                Live GPS Radar
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/transport-manager/live-trips')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#059669',
                fontSize: '0.825rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span>Open Full Map</span>
              <ExternalLink size={14} />
            </button>
          </div>

          {activeTrips.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                borderRadius: '14px',
                background: '#f8faf9',
                border: '1.5px dashed #cbd5e1',
                color: '#64748b',
                fontSize: '0.85rem',
              }}
            >
              <Car size={32} color="#64748b" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 700, color: '#0f2920' }}>No active trips currently in transit.</div>
              <div style={{ fontSize: '0.775rem', marginTop: '4px', color: '#64748b' }}>
                Live vehicles will appear here once drivers start trips.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeTrips.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => navigate('/transport-manager/live-trips')}
                  style={{
                    padding: '0.9rem 1.1rem',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1.5px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#10b981',
                          boxShadow: '0 0 8px #10b981',
                        }}
                      />
                      <span style={{ fontWeight: 800, color: '#0f2920', fontSize: '0.875rem' }}>
                        {trip.driverName || 'Driver'} &bull; {trip.vehicleRegistration || 'Vehicle'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '2px' }}>
                      Passenger: {trip.employeeName} &bull; {trip.destination}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.6rem',
                      borderRadius: '9999px',
                      background: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    IN TRANSIT
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
        onAssignmentSuccess={() => fetchDashboardData()}
      />

      <RequestApprovalModal
        isOpen={Boolean(selectedRideForApproval)}
        ride={selectedRideForApproval}
        onClose={() => setSelectedRideForApproval(null)}
        onDecisionSuccess={() => fetchDashboardData()}
      />
    </div>
  );
};
export default ManagerDashboardPage;
