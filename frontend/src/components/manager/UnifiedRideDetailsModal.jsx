import React from 'react';
import {
  X,
  User,
  MapPin,
  Calendar,
  Clock,
  Car,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  Navigation,
  FileText,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UnifiedRideDetailsModal = ({ isOpen, onClose, ride, onOpenAssign, onOpenLiveMap }) => {
  const navigate = useNavigate();

  if (!isOpen || !ride) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return { label: 'PENDING APPROVAL', bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'SCHEDULED':
        return { label: 'SCHEDULED — NEEDS ASSIGNMENT', bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
      case 'ASSIGNED':
        if (!ride.driverAcceptedAt && !ride.isDriverAccepted) {
          return { label: 'ASSIGNED — WAITING FOR DRIVER', bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
        }
        if (ride.employeeVerifiedAt || ride.isEmployeeVerified) {
          return { label: 'PASSENGER VERIFIED', bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
        }
        return { label: 'DRIVER ACCEPTED', bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'IN_PROGRESS':
        return { label: 'IN PROGRESS (LIVE)', bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399', border: 'rgba(16, 185, 129, 0.5)' };
      case 'COMPLETED':
        return { label: 'COMPLETED', bg: 'rgba(100, 116, 139, 0.2)', text: '#94a3b8', border: 'rgba(100, 116, 139, 0.3)' };
      case 'CANCELLED':
        return { label: 'CANCELLED', bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'REJECTED':
        return { label: 'REJECTED', bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: 'rgba(239, 68, 68, 0.4)' };
      default:
        return { label: status, bg: 'rgba(255, 255, 255, 0.1)', text: '#ffffff', border: 'rgba(255, 255, 255, 0.2)' };
    }
  };

  const statusBadge = getStatusBadge(ride.status);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          color: '#0f2920',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: '#0f2920' }}>
                Ride #{ride.bookingReference || ride.id?.substring(0, 8)}
              </h3>
              <span
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px',
                  background: statusBadge.bg,
                  color: statusBadge.text,
                  border: `1px solid ${statusBadge.border}`,
                }}
              >
                {statusBadge.label}
              </span>
            </div>
            <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
              Organization: <strong style={{ color: '#0f2920' }}>{ride.organizationName || 'Acme Global'}</strong> &bull; Requested on {ride.bookingDate}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Rejection Alert Banner (if applicable) */}
        {ride.rejectionReason && (
          <div
            style={{
              padding: '0.9rem 1.1rem',
              borderRadius: '12px',
              background: '#fef2f2',
              border: '1.5px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <AlertTriangle size={18} color="#ef4444" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444' }}>
                Rejection Notice Recorded:
              </div>
              <div style={{ fontSize: '0.85rem', color: '#0f2920', fontWeight: 600 }}>
                {ride.rejectionReason}
              </div>
            </div>
          </div>
        )}

        {/* Grid Sections: 1. Employee | 2. Trip Route */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* Employee Card */}
          <div
            style={{
              padding: '1.2rem',
              borderRadius: '14px',
              background: '#f8faf9',
              border: '1.5px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#059669' }}>
              <User size={16} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Employee Passenger
              </span>
            </div>
            <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0f2920' }}>
              {ride.employeeName || 'Corporate Employee'}
            </div>
            <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
              {ride.employeeEmail}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: '6px' }}>
              Employee ID: EMP-{(ride.employeeId || ride.id)?.toString().substring(0, 4).toUpperCase()}
            </div>
          </div>

          {/* Schedule & Timing Card */}
          <div
            style={{
              padding: '1.2rem',
              borderRadius: '14px',
              background: '#f8faf9',
              border: '1.5px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#2563eb' }}>
              <Calendar size={16} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Trip Schedule
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f2920', fontWeight: 800 }}>
              <Clock size={16} color="#2563eb" />
              <span>Pickup: {ride.pickupTime || '08:30 AM'}</span>
            </div>
            <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '4px' }}>
              Date: <strong style={{ color: '#0f2920' }}>{ride.bookingDate}</strong>
            </div>
            {ride.bookingNotes && (
              <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '6px', fontStyle: 'italic' }}>
                "{ride.bookingNotes}"
              </div>
            )}
          </div>
        </div>

        {/* Route Details */}
        <div
          style={{
            padding: '1.2rem',
            borderRadius: '14px',
            background: '#f8faf9',
            border: '1.5px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            Trip Route
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 800, marginTop: '2px' }}>
                A
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Pickup Location</div>
                <div style={{ fontWeight: 800, color: '#0f2920', fontSize: '0.95rem' }}>{ride.pickupLocation}</div>
              </div>
            </div>

            <div style={{ marginLeft: '10px', width: '2px', height: '14px', background: '#cbd5e1' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 800, marginTop: '2px' }}>
                B
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Destination</div>
                <div style={{ fontWeight: 800, color: '#0f2920', fontSize: '0.95rem' }}>{ride.destination}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Resources: Driver & Vehicle */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* Driver Card */}
          <div
            style={{
              padding: '1.2rem',
              borderRadius: '14px',
              background: ride.driverName ? '#ecfdf5' : '#f8faf9',
              border: ride.driverName ? '1.5px solid #a7f3d0' : '1.5px dashed #cbd5e1',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#059669', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                <User size={15} />
                <span>Assigned Driver</span>
              </div>
              {ride.driverAcceptedAt || ride.isDriverAccepted ? (
                <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <CheckCircle2 size={13} /> Accepted
                </span>
              ) : ride.driverName ? (
                <span style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 800 }}>Waiting Response</span>
              ) : (
                <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 800 }}>Unassigned</span>
              )}
            </div>

            {ride.driverName ? (
              <div>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: '#0f2920' }}>{ride.driverName}</div>
                <div style={{ fontSize: '0.775rem', color: '#059669', marginTop: '2px', fontWeight: 700 }}>
                  License: {ride.driverLicenseNumber || 'DL-VALID-2027'}
                </div>
                {ride.driverPhone && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Phone size={12} /> {ride.driverPhone}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                No driver currently assigned.
              </div>
            )}
          </div>

          {/* Vehicle Card */}
          <div
            style={{
              padding: '1.2rem',
              borderRadius: '14px',
              background: ride.vehicleRegistration ? '#eff6ff' : '#f8faf9',
              border: ride.vehicleRegistration ? '1.5px solid #bfdbfe' : '1.5px dashed #cbd5e1',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#2563eb', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                <Car size={15} />
                <span>Assigned Vehicle</span>
              </div>
              {ride.vehicleRegistration ? (
                <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 800 }}>Reserved</span>
              ) : (
                <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 800 }}>Unassigned</span>
              )}
            </div>

            {ride.vehicleRegistration ? (
              <div>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: '#0f2920' }}>
                  {ride.vehicleMakeModel || 'Corporate Fleet Vehicle'}
                </div>
                <div style={{ fontSize: '0.775rem', color: '#2563eb', marginTop: '2px', fontWeight: 800 }}>
                  Plate: {ride.vehicleRegistration}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                  Type: {ride.vehicleType || 'SEDAN'}
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                No vehicle currently assigned.
              </div>
            )}
          </div>
        </div>

        {/* Operational Passenger Verification Badge */}
        <div
          style={{
            padding: '0.9rem 1.25rem',
            borderRadius: '12px',
            background: ride.employeeVerifiedAt || ride.isEmployeeVerified ? '#ecfdf5' : '#f8faf9',
            border: `1.5px solid ${ride.employeeVerifiedAt || ride.isEmployeeVerified ? '#a7f3d0' : '#e2e8f0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShieldCheck size={20} color={ride.employeeVerifiedAt || ride.isEmployeeVerified ? '#059669' : '#64748b'} />
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0f2920' }}>
                Employee Passenger Verification Status
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {ride.employeeVerifiedAt || ride.isEmployeeVerified
                  ? 'Passenger was verified via corporate badge / OTP at pickup.'
                  : 'Pending boarding verification by driver.'}
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: ride.employeeVerifiedAt || ride.isEmployeeVerified ? '#059669' : '#64748b',
            }}
          >
            {ride.employeeVerifiedAt || ride.isEmployeeVerified ? 'VERIFIED ✓' : 'NOT VERIFIED'}
          </span>
        </div>

        {/* Modal Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.65rem 1.35rem',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              color: '#0f2920',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Close
          </button>

          {/* If unassigned or rejected, allow direct assignment */}
          {(!ride.driverName || !ride.vehicleRegistration || ride.status === 'SCHEDULED' || ride.status === 'REJECTED') && onOpenAssign && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAssign(ride);
              }}
              style={{
                padding: '0.65rem 1.35rem',
                borderRadius: '8px',
                background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 12px rgba(19, 56, 44, 0.25)',
              }}
            >
              <UserCheck size={16} />
              <span>{ride.driverName ? 'Reassign Driver & Vehicle' : 'Assign Driver & Vehicle'}</span>
            </button>
          )}

          {/* If In Progress or active, offer Live Map */}
          {(ride.status === 'IN_PROGRESS' || ride.status === 'ASSIGNED') && onOpenLiveMap && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLiveMap(ride);
              }}
              style={{
                padding: '0.65rem 1.35rem',
                borderRadius: '8px',
                background: 'linear-gradient(180deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              }}
            >
              <Radio size={16} />
              <span>Track Live On Map</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default UnifiedRideDetailsModal;
