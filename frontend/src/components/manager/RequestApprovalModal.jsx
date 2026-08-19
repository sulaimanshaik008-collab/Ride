import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Sparkles,
} from 'lucide-react';
import { rideService } from '../../services/rideService';

export const RequestApprovalModal = ({ isOpen, onClose, ride, onDecisionSuccess }) => {
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Capacity Exceeded / No Fleet Available');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !ride) return null;

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      setErrorMsg('');
      const updated = await rideService.approveRide(ride.id);
      if (onDecisionSuccess) onDecisionSuccess(updated, 'APPROVED');
      onClose();
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to approve request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      setErrorMsg('Please select or specify a reason for rejection.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const updated = await rideService.rejectRideRequest(ride.id, rejectionReason, rejectionNotes);
      if (onDecisionSuccess) onDecisionSuccess(updated, 'REJECTED');
      onClose();
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to reject request.');
    } finally {
      setSubmitting(false);
    }
  };

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
          maxWidth: '560px',
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          color: '#0f2920',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: '#0f2920' }}>
              Review Ride Request
            </h3>
            <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
              Ride #{ride.bookingReference} &bull; Status: <strong style={{ color: '#d97706' }}>PENDING APPROVAL</strong>
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

        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1.5px solid #fecaca',
              color: '#ef4444',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Request Overview Card */}
        <div
          style={{
            padding: '1.1rem',
            borderRadius: '14px',
            background: '#f8faf9',
            border: '1.5px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>
                Employee Passenger
              </div>
              <div style={{ fontWeight: 900, color: '#0f2920', fontSize: '1rem', marginTop: '2px' }}>
                {ride.employeeName || 'Rahul Kumar'}
              </div>
              <div style={{ fontSize: '0.775rem', color: '#2563eb', fontWeight: 600 }}>{ride.employeeEmail}</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>
                Requested Time
              </div>
              <div style={{ fontWeight: 900, color: '#0f2920', fontSize: '1rem', marginTop: '2px' }}>
                {ride.pickupTime || '08:30 AM'}
              </div>
              <div style={{ fontSize: '0.775rem', color: '#059669', fontWeight: 700 }}>{ride.bookingDate}</div>
            </div>
          </div>

          <div style={{ borderTop: '1.5px solid #e2e8f0', paddingTop: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', color: '#0f2920' }}>
              <MapPin size={15} color="#059669" />
              <span><strong>From:</strong> {ride.pickupLocation}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', color: '#0f2920', marginTop: '4px' }}>
              <MapPin size={15} color="#2563eb" />
              <span><strong>To:</strong> {ride.destination}</span>
            </div>
          </div>

          {ride.bookingNotes && (
            <div style={{ fontSize: '0.775rem', color: '#475569', fontStyle: 'italic' }}>
              Notes: "{ride.bookingNotes}"
            </div>
          )}
        </div>

        {/* If in Rejection mode, show reason inputs */}
        {isRejecting ? (
          <div
            style={{
              padding: '1.1rem',
              borderRadius: '14px',
              background: '#fef2f2',
              border: '1.5px solid #fecaca',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#ef4444' }}>
              Rejection Reason & Notification
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', color: '#374151', marginBottom: '4px', fontWeight: 700 }}>
                Primary Reason
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1.5px solid #fecaca',
                  color: '#0f172a',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                <option value="Capacity Exceeded / No Fleet Available">Capacity Exceeded / No Fleet Available</option>
                <option value="Route Outside Corporate Operational Bounds">Route Outside Corporate Operational Bounds</option>
                <option value="Timing Conflict with High Priority Corporate Events">Timing Conflict with High Priority Corporate Events</option>
                <option value="Duplicate or Erroneous Booking Request">Duplicate or Erroneous Booking Request</option>
                <option value="Manager Operational Discretion">Manager Operational Discretion</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', color: '#374151', marginBottom: '4px', fontWeight: 700 }}>
                Additional Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="E.g. Please choose a later pickup time."
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1.5px solid #fecaca',
                  color: '#0f172a',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        ) : null}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          {isRejecting ? (
            <button
              type="button"
              onClick={() => setIsRejecting(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel Rejection
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsRejecting(true)}
              style={{
                padding: '0.6rem 1.15rem',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                color: '#ef4444',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <XCircle size={16} />
              <span>Reject Request</span>
            </button>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.15rem',
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

            {isRejecting ? (
              <button
                type="button"
                onClick={handleReject}
                disabled={submitting}
                style={{
                  padding: '0.6rem 1.35rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                }}
              >
                {submitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApprove}
                disabled={submitting}
                style={{
                  padding: '0.6rem 1.35rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 15px rgba(19, 56, 44, 0.25)',
                }}
              >
                <CheckCircle2 size={16} />
                <span>{submitting ? 'Approving...' : 'Approve Request'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default RequestApprovalModal;
