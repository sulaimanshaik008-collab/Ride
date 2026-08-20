import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, MapPin, Navigation, XCircle, Eye, AlertTriangle, RefreshCw, Car, X } from 'lucide-react';
import { rideService } from '../services/rideService';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { RideFeedbackModal } from '../components/RideFeedbackModal';
import { RideTrackingModal } from '../components/map/RideTrackingModal';

export const MyRidesPage = () => {
  const { currentUser } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [selectedRide, setSelectedRide] = useState(null);
  const [trackingRide, setTrackingRide] = useState(null);
  const [feedbackRideModal, setFeedbackRideModal] = useState(null);
  const [cancelRideModal, setCancelRideModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const fetchRides = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rideService.getEmployeeRides();
      setRides(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch ride history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [currentUser]);

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setCancelError('Please enter a cancellation reason');
      return;
    }

    try {
      setCancelLoading(true);
      setCancelError(null);
      const updatedRide = await rideService.cancelRide(cancelRideModal.id, cancelReason.trim());
      setRides((prev) => prev.map((r) => (r.id === updatedRide.id ? updatedRide : r)));
      setCancelRideModal(null);
      setCancelReason('');
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel ride');
    } finally {
      setCancelLoading(false);
    }
  };

  const filteredRides = rides.filter((ride) => {
    const matchesStatus = activeTab === 'ALL' || ride.status === activeTab;
    const matchesSearch =
      ride.bookingReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.destination.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const isCancelable = (status) => status === 'PENDING_APPROVAL' || status === 'APPROVED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Car size={28} color="#059669" />
            <span>My Ride Bookings</span>
          </h1>
          <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            View and manage all your requested corporate transport trips.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchRides}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.6rem 1.1rem',
            fontSize: '0.85rem',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            color: '#0f2920',
            borderRadius: '10px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin-animation' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444', padding: '1rem 1.25rem', borderRadius: '12px', fontWeight: 700 }}>
          ⚠️ {error}
        </div>
      )}

      {/* FILTER TABS & SEARCH BAR */}
      <div
        style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1.1rem 1.25rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['ALL', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map((tab) => (
              <button
                key={tab}
                type="button"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  border: activeTab === tab ? '1.5px solid #059669' : '1.5px solid #e2e8f0',
                  background: activeTab === tab ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : '#f8faf9',
                  color: activeTab === tab ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'ALL' ? 'All Rides' : tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
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
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none',
              }}
              placeholder="Search reference or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* RIDE CARDS LIST */}
      {loading ? (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 0.75rem', color: '#059669' }} />
          <p style={{ color: '#64748b', fontWeight: 600 }}>Loading your ride bookings...</p>
        </div>
      ) : filteredRides.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <Car size={36} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ color: '#0f2920', marginBottom: '0.25rem', fontSize: '1.1rem', fontWeight: 900 }}>
            No rides found
          </p>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            {searchQuery || activeTab !== 'ALL'
              ? 'Try adjusting your search query or status filter.'
              : 'You have not submitted any office ride requests yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.25rem' }}>
          {filteredRides.map((ride) => (
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
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#2563eb', letterSpacing: '0.5px' }}>{ride.bookingReference}</span>
                <StatusBadge status={ride.status} />
              </div>

              <div style={{ background: '#f8faf9', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.725rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Pickup Location</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f2920', marginTop: '2px' }}>{ride.pickupLocation}</div>
                </div>
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.725rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Destination</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f2920', marginTop: '2px' }}>{ride.destination}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.825rem', color: '#64748b', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} color="#d97706" />
                  <strong style={{ color: '#0f2920' }}>{ride.bookingDate}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={14} color="#059669" />
                  <strong style={{ color: '#0f2920' }}>{ride.pickupTime}</strong>
                </div>
                {ride.bookingNotes && (
                  <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span>Note:</span> <span style={{ color: '#0f2920' }}>{ride.bookingNotes}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1.5px solid #f1f5f9', paddingTop: '0.85rem' }}>
                {(ride.status === 'IN_PROGRESS' || ride.status === 'ASSIGNED') && (
                  <button
                    type="button"
                    onClick={() => setTrackingRide(ride)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.9rem',
                      fontSize: '0.82rem',
                      background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <Navigation size={14} />
                    <span>Live Track Driver</span>
                  </button>
                )}

                {ride.status === 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={() => setFeedbackRideModal(ride)}
                    style={{
                      padding: '0.45rem 0.9rem',
                      fontSize: '0.82rem',
                      background: '#fef3c7',
                      color: '#92400e',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    ⭐ Rate Ride
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedRide(ride)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.45rem 0.9rem',
                    fontSize: '0.82rem',
                    background: '#ffffff',
                    color: '#0f2920',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Eye size={14} />
                  <span>View Details</span>
                </button>

                {isCancelable(ride.status) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCancelRideModal(ride);
                      setCancelReason('');
                      setCancelError(null);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.9rem',
                      fontSize: '0.82rem',
                      background: '#fef2f2',
                      color: '#ef4444',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <XCircle size={14} />
                    <span>Cancel Ride</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIVE TRACKING MODAL */}
      {trackingRide && (
        <RideTrackingModal
          ride={trackingRide}
          onClose={() => {
            setTrackingRide(null);
            fetchRides();
          }}
          onRateRide={(completedRide) => {
            setFeedbackRideModal(completedRide);
          }}
        />
      )}

      {/* RIDE FEEDBACK MODAL */}
      {feedbackRideModal && (
        <RideFeedbackModal
          ride={feedbackRideModal}
          onClose={() => setFeedbackRideModal(null)}
          onSuccess={() => fetchRides()}
        />
      )}

      {/* RIDE DETAILS MODAL */}
      {selectedRide && (
        <div className="modal-overlay" onClick={() => setSelectedRide(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '540px',
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
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>Ride Request Details</h2>
                <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700, marginTop: '0.2rem', display: 'inline-block' }}>
                  {selectedRide.bookingReference}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRide(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Booking Status:</span>
                <StatusBadge status={selectedRide.status} />
              </div>

              <div style={{ background: '#f8faf9', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Pickup Address</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f2920', marginTop: '2px' }}>{selectedRide.pickupLocation}</div>
                </div>
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Destination Address</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f2920', marginTop: '2px' }}>{selectedRide.destination}</div>
                </div>
              </div>

              <div style={{ background: '#f8faf9', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Date</span>
                  <strong style={{ color: '#0f2920' }}>{selectedRide.bookingDate}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Pickup Time</span>
                  <strong style={{ color: '#0f2920' }}>{selectedRide.pickupTime}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Passenger Name</span>
                  <strong style={{ color: '#0f2920' }}>{selectedRide.employeeName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Organization</span>
                  <strong style={{ color: '#059669' }}>{selectedRide.organizationName}</strong>
                </div>
              </div>

              {selectedRide.bookingNotes && (
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>Booking Notes</span>
                  <div style={{ background: '#f8faf9', border: '1.5px solid #e2e8f0', padding: '0.75rem', borderRadius: '8px', fontSize: '0.88rem', color: '#0f172a' }}>
                    {selectedRide.bookingNotes}
                  </div>
                </div>
              )}

              {selectedRide.status === 'CANCELLED' && (
                <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                  <AlertTriangle size={16} />
                  <div>
                    <strong>Cancellation Reason:</strong> {selectedRide.cancellationReason || 'No reason specified'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CANCEL RIDE MODAL */}
      {cancelRideModal && (
        <div className="modal-overlay" onClick={() => setCancelRideModal(null)}>
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ef4444', margin: 0 }}>
                Cancel Ride Request
              </h2>
              <button
                type="button"
                onClick={() => setCancelRideModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {cancelError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 700, fontSize: '0.85rem' }}>
                ⚠️ {cancelError}
              </div>
            )}

            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Are you sure you want to cancel booking <strong style={{ color: '#2563eb' }}>{cancelRideModal.bookingReference}</strong>?
            </p>

            <form onSubmit={handleCancelSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Cancellation Reason *</label>
                <textarea
                  rows={3}
                  placeholder="Please state why you are cancelling this ride..."
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
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setCancelRideModal(null)}
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
                  Keep Booking
                </button>
                <button
                  type="submit"
                  disabled={cancelLoading}
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
                >
                  {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
