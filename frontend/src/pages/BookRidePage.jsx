import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Calendar, Clock, FileText, CheckCircle2, Copy, ArrowRight, Info } from 'lucide-react';
import { rideService } from '../services/rideService';
import { useAuth } from '../context/AuthContext';

const PRESET_LOCATIONS = [
  'Acme Global HQ - Tower A Gate 2',
  'TechCorp Innovation Campus Gate 1',
  'Downtown Tech Hub Conference Center',
  'Central Metro Station Gate 4',
  'International Airport Terminal 2',
  'Residential Park, North Ave',
];

export const BookRidePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    pickupLocation: '',
    destination: '',
    bookingDate: todayStr,
    pickupTime: '08:30',
    bookingNotes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmedRide, setConfirmedRide] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handlePresetSelect = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.pickupLocation.trim()) {
      setError('Please select or enter a pickup location');
      return;
    }
    if (!formData.destination.trim()) {
      setError('Please select or enter a destination');
      return;
    }
    if (formData.pickupLocation.trim().toLowerCase() === formData.destination.trim().toLowerCase()) {
      setError('Pickup location and destination cannot be identical');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const ride = await rideService.createRide({
        pickupLocation: formData.pickupLocation.trim(),
        destination: formData.destination.trim(),
        bookingDate: formData.bookingDate,
        pickupTime: formData.pickupTime,
        bookingNotes: formData.bookingNotes.trim(),
      });
      setConfirmedRide(ride);
    } catch (err) {
      setError(err.message || 'Failed to submit ride request');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRef = () => {
    if (confirmedRide?.bookingReference) {
      navigator.clipboard.writeText(confirmedRide.bookingReference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Book an Office Ride</h1>
        <p className="page-subtitle">
          Request corporate transportation for work commutes, inter-office travel, or client meetings.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
        {/* FORM CARD */}
        <div className="glass-card">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="form-grid">
            {/* PICKUP LOCATION */}
            <div className="form-group full-width">
              <label className="form-label">
                <MapPin size={16} color="#06b6d4" />
                Pickup Location
              </label>
              <input
                type="text"
                name="pickupLocation"
                className="form-control"
                placeholder="Enter pickup address or select preset..."
                value={formData.pickupLocation}
                onChange={handleChange}
                required
              />
              <div className="presets-container">
                {PRESET_LOCATIONS.map((loc, i) => (
                  <button
                    key={i}
                    type="button"
                    className="preset-chip"
                    onClick={() => handlePresetSelect('pickupLocation', loc)}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* DESTINATION */}
            <div className="form-group full-width">
              <label className="form-label">
                <Navigation size={16} color="#6366f1" />
                Destination
              </label>
              <input
                type="text"
                name="destination"
                className="form-control"
                placeholder="Enter destination address or select preset..."
                value={formData.destination}
                onChange={handleChange}
                required
              />
              <div className="presets-container">
                {PRESET_LOCATIONS.map((loc, i) => (
                  <button
                    key={i}
                    type="button"
                    className="preset-chip"
                    onClick={() => handlePresetSelect('destination', loc)}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* DATE */}
            <div className="form-group">
              <label className="form-label">
                <Calendar size={16} color="#f59e0b" />
                Booking Date
              </label>
              <input
                type="date"
                name="bookingDate"
                className="form-control"
                min={todayStr}
                value={formData.bookingDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* TIME */}
            <div className="form-group">
              <label className="form-label">
                <Clock size={16} color="#10b981" />
                Pickup Time
              </label>
              <input
                type="time"
                name="pickupTime"
                className="form-control"
                value={formData.pickupTime}
                onChange={handleChange}
                required
              />
            </div>

            {/* NOTES */}
            <div className="form-group full-width">
              <label className="form-label">
                <FileText size={16} color="#9ca3af" />
                Booking Notes (Optional)
              </label>
              <textarea
                name="bookingNotes"
                className="form-control"
                placeholder="E.g., 2 luggage bags, gate access code, or specific drop point..."
                value={formData.bookingNotes}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width" style={{ marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Submitting Request...' : 'Confirm & Request Ride'}
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>

        {/* TRIP SUMMARY PREVIEW SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>
              Trip Preview
            </h3>

            <div className="route-container" style={{ marginBottom: '1.5rem' }}>
              <div className="route-point">
                <div className="point-label">Pickup</div>
                <div className="point-val">{formData.pickupLocation || 'Not selected'}</div>
              </div>
              <div className="route-point destination">
                <div className="point-label">Destination</div>
                <div className="point-val">{formData.destination || 'Not selected'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Passenger:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{currentUser?.fullName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Organization:</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{currentUser?.organizationName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Scheduled Date:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{formData.bookingDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Scheduled Time:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{formData.pickupTime}</span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(99, 102, 241, 0.06)' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Info size={20} color="#818cf8" style={{ shrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.5 }}>
                <strong style={{ color: '#fff', display: 'block', marginBottom: '0.2rem' }}>Ride Workflow</strong>
                Your ride request will be automatically routed to your Transport Manager for trip scheduling and driver assignment.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOOKING CONFIRMATION MODAL */}
      {confirmedRide && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <CheckCircle2 size={36} color="#34d399" />
            </div>

            <h2 className="modal-title" style={{ marginBottom: '0.5rem' }}>
              Ride Request Submitted!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Your ride request has been registered and is pending approval by your transport team.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>
                  Booking Reference ID
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                  {confirmedRide.bookingReference}
                </div>
              </div>
              <button onClick={handleCopyRef} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <Copy size={14} />
                {copiedRef ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setConfirmedRide(null);
                  setFormData({
                    pickupLocation: '',
                    destination: '',
                    bookingDate: todayStr,
                    pickupTime: '08:30',
                    bookingNotes: '',
                  });
                }}
              >
                Book Another Ride
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => navigate('/my-rides')}
              >
                View My Bookings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
