import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, MapPin, Navigation, XCircle, Eye, AlertTriangle, RefreshCw } from 'lucide-react';
import { rideService } from '../services/rideService';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const MyRidesPage = () => {
  const { currentUser } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [selectedRide, setSelectedRide] = useState(null);
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
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">My Ride Bookings</h1>
          <p className="page-subtitle">View and manage all your requested corporate transport trips.</p>
        </div>
        <button onClick={fetchRides} className="btn btn-secondary" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* FILTER TABS & SEARCH BAR */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="tabs-header" style={{ margin: 0, padding: 0, border: 'none' }}>
            {['ALL', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map((tab) => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'ALL' ? 'All Rides' : tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.4rem', fontSize: '0.85rem' }}
              placeholder="Search reference or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* RIDE CARDS LIST */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading your ride bookings...</p>
        </div>
      ) : filteredRides.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 600 }}>
            No rides found
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            {searchQuery || activeTab !== 'ALL'
              ? 'Try adjusting your search query or status filter.'
              : 'You have not submitted any office ride requests yet.'}
          </p>
        </div>
      ) : (
        <div className="rides-grid">
          {filteredRides.map((ride) => (
            <div key={ride.id} className="ride-card">
              <div className="ride-card-header">
                <span className="booking-ref">{ride.bookingReference}</span>
                <StatusBadge status={ride.status} />
              </div>

              <div className="route-container">
                <div className="route-point">
                  <div className="point-label">Pickup Location</div>
                  <div className="point-val">{ride.pickupLocation}</div>
                </div>
                <div className="route-point destination">
                  <div className="point-label">Destination</div>
                  <div className="point-val">{ride.destination}</div>
                </div>
              </div>

              <div className="ride-meta">
                <div className="meta-item">
                  <Calendar size={14} color="#f59e0b" />
                  <span>{ride.bookingDate}</span>
                </div>
                <div className="meta-item">
                  <Clock size={14} color="#10b981" />
                  <span>{ride.pickupTime}</span>
                </div>
                {ride.bookingNotes && (
                  <div className="meta-item" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Note:</span> {ride.bookingNotes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem' }}>
                <button onClick={() => setSelectedRide(ride)} className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}>
                  <Eye size={14} />
                  View Details
                </button>

                {isCancelable(ride.status) && (
                  <button
                    onClick={() => {
                      setCancelRideModal(ride);
                      setCancelReason('');
                      setCancelError(null);
                    }}
                    className="btn btn-danger"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                  >
                    <XCircle size={14} />
                    Cancel Ride
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RIDE DETAILS MODAL */}
      {selectedRide && (
        <div className="modal-overlay" onClick={() => setSelectedRide(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title" style={{ fontSize: '1.2rem' }}>Ride Request Details</h2>
                <span className="booking-ref" style={{ fontSize: '0.8rem', marginTop: '0.2rem', display: 'inline-block' }}>
                  {selectedRide.bookingReference}
                </span>
              </div>
              <button onClick={() => setSelectedRide(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Booking Status:</span>
                <StatusBadge status={selectedRide.status} />
              </div>

              <div className="route-container">
                <div className="route-point">
                  <div className="point-label">Pickup Address</div>
                  <div className="point-val">{selectedRide.pickupLocation}</div>
                </div>
                <div className="route-point destination">
                  <div className="point-label">Destination Address</div>
                  <div className="point-val">{selectedRide.destination}</div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Date</span>
                  <strong style={{ color: '#fff' }}>{selectedRide.bookingDate}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Pickup Time</span>
                  <strong style={{ color: '#fff' }}>{selectedRide.pickupTime}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Passenger Name</span>
                  <strong style={{ color: '#fff' }}>{selectedRide.employeeName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Organization</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>{selectedRide.organizationName}</strong>
                </div>
              </div>

              {selectedRide.bookingNotes && (
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'block', marginBottom: '0.2rem' }}>Booking Notes</span>
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem' }}>
                    {selectedRide.bookingNotes}
                  </div>
                </div>
              )}

              {selectedRide.status === 'CANCELLED' && (
                <div className="alert alert-error" style={{ margin: 0 }}>
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
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontSize: '1.2rem', color: '#f87171' }}>
                Cancel Ride Request
              </h2>
              <button onClick={() => setCancelRideModal(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            {cancelError && <div className="alert alert-error">{cancelError}</div>}

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Are you sure you want to cancel booking <strong style={{ color: 'var(--accent-cyan)' }}>{cancelRideModal.bookingReference}</strong>?
            </p>

            <form onSubmit={handleCancelSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Cancellation Reason *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Please state why you are cancelling this ride..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setCancelRideModal(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Keep Booking
                </button>
                <button type="submit" className="btn btn-danger" style={{ flex: 1 }} disabled={cancelLoading}>
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
