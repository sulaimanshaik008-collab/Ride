import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tag,
  Info,
  Clock,
  User,
  Plus,
  X,
  Calendar,
  CheckCircle2,
  Copy,
  ArrowRight,
  ArrowLeft,
  Route,
  Car,
  ChevronDown,
  AlertCircle,
  ShieldCheck,
  Zap,
  MapPin,
  Navigation,
  Hourglass,
  CreditCard
} from 'lucide-react';
import { rideService } from '../services/rideService';
import { useAuth } from '../context/AuthContext';
import { MapView } from '../components/map/MapView';
import { LocationSearchInput } from '../components/map/LocationSearchInput';

const PRESET_LOCATIONS = [
  { name: '35/1, Muniyandi Kovil Ln, near Saravana Multi-Speciality Hospital Pvt Ltd', coordinates: [78.1198, 9.9252] },
  { name: 'Mattuthavani Omni Bus Stand, Madurai', coordinates: [78.1565, 9.9485] },
  { name: 'Acme Global HQ - Tower A Gate 2', coordinates: [80.2707, 13.0827] },
  { name: 'TechCorp Innovation Campus Gate 1', coordinates: [80.2285, 12.9716] },
  { name: 'International Airport Terminal 2', coordinates: [80.1709, 12.9941] },
];

const VEHICLE_TIERS = [
  {
    id: 'uber-go',
    name: 'Uber Go',
    capacity: '4 seats',
    eta: '3 mins away',
    basePrice: 140,
    desc: 'Affordable, compact rides',
    icon: '🚗',
  },
  {
    id: 'uber-premier',
    name: 'Premier',
    capacity: '4 seats',
    eta: '5 mins away',
    basePrice: 220,
    desc: 'Comfortable sedans, top-rated drivers',
    icon: '🚘',
  },
  {
    id: 'uber-xl',
    name: 'Uber XL',
    capacity: '6 seats',
    eta: '7 mins away',
    basePrice: 340,
    desc: 'Spacious SUVs for teams & luggage',
    icon: '🚐',
  },
];

// Helper to format date like "Mon, Sep 14"
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return 'Mon, Sep 14';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

// Helper to format time like "8:10 PM"
const formatDisplayTime = (timeStr) => {
  if (!timeStr) return '8:10 PM';
  const [hours, minutes] = timeStr.split(':');
  let h = parseInt(hours, 10);
  const m = minutes || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

export const BookRidePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];

  const [pickup, setPickup] = useState({
    address: '35/1, Muniyandi Kovil Ln, near Saravana Multi-Speciality Hospital Pvt Ltd',
    coordinates: [78.1198, 9.9252],
  });

  const [destination, setDestination] = useState({
    address: 'Mattuthavani Omni Bus Stand',
    coordinates: [78.1565, 9.9485],
  });

  // Panel view state: 'main' | 'schedule'
  const [panelView, setPanelView] = useState('main');

  const [selectedTier, setSelectedTier] = useState('uber-go');
  const [isScheduled, setIsScheduled] = useState(false);
  const [bookingDate, setBookingDate] = useState('2026-09-14');
  const [pickupTime, setPickupTime] = useState('20:10');
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [riderName, setRiderName] = useState('For me');
  const [showRiderDropdown, setShowRiderDropdown] = useState(false);
  const [selectionMode, setSelectionMode] = useState('PICKUP');

  const [routeDetails, setRouteDetails] = useState(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmedRide, setConfirmedRide] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const handlePickupSelectFromMap = (loc) => {
    if (!loc) {
      setPickup({ address: '', coordinates: null });
      return;
    }
    setPickup({
      address: loc.address || `Location (${loc.coordinates[1].toFixed(4)}, ${loc.coordinates[0].toFixed(4)})`,
      coordinates: loc.coordinates,
    });
    if (error) setError(null);
  };

  const handleDestinationSelectFromMap = (loc) => {
    if (!loc) {
      setDestination({ address: '', coordinates: null });
      return;
    }
    setDestination({
      address: loc.address || `Location (${loc.coordinates[1].toFixed(4)}, ${loc.coordinates[0].toFixed(4)})`,
      coordinates: loc.coordinates,
    });
    if (error) setError(null);
  };

  const handleClearAll = () => {
    setPickup({ address: '', coordinates: null });
    setDestination({ address: '', coordinates: null });
    setRouteDetails(null);
    setSelectionMode('PICKUP');
    setError(null);
  };

  const handleClearSchedule = () => {
    setIsScheduled(false);
    setBookingDate(todayStr);
    setPickupTime('08:30');
    setPanelView('main');
  };

  const handleConfirmSchedule = () => {
    setIsScheduled(true);
    setPanelView('main');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!pickup.address.trim()) {
      setError('Please enter a pickup location');
      return;
    }
    if (!destination.address.trim()) {
      setError('Please enter a destination');
      return;
    }
    if (pickup.address.trim().toLowerCase() === destination.address.trim().toLowerCase()) {
      setError('Pickup location and destination cannot be identical');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        pickupLocation: pickup.address.trim(),
        destination: destination.address.trim(),
        pickupLatitude: pickup.coordinates ? pickup.coordinates[1] : 9.9252,
        pickupLongitude: pickup.coordinates ? pickup.coordinates[0] : 78.1198,
        destinationLatitude: destination.coordinates ? destination.coordinates[1] : 9.9485,
        destinationLongitude: destination.coordinates ? destination.coordinates[0] : 78.1565,
        bookingDate: isScheduled ? bookingDate : todayStr,
        pickupTime: isScheduled ? pickupTime : new Date().toTimeString().slice(0, 5),
        bookingNotes: bookingNotes.trim() ? `${bookingNotes.trim()} (${selectedTier})` : `Tier: ${selectedTier}`,
      };

      const ride = await rideService.createRide(payload);
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

  // Generate 15-min interval time slots
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const hStr = hour.toString().padStart(2, '0');
        const mStr = min.toString().padStart(2, '0');
        const val = `${hStr}:${mStr}`;
        slots.push({
          value: val,
          label: formatDisplayTime(val),
        });
      }
    }
    return slots;
  }, []);

  return (
    <div className="uber-dashboard-layout">
      {/* LEFT COLUMN: UBER "GET A RIDE" OR "PICKUP SCHEDULING" PANEL */}
      <div className="uber-booking-panel">
        {panelView === 'schedule' ? (
          /* ==========================================================================
             UBER SCHEDULING VIEW ("When do you want to be picked up?")
             ========================================================================== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header with Circle Back Button & Clear */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setPanelView('main')}
                className="uber-circle-btn"
                aria-label="Go back to booking"
              >
                <ArrowLeft size={18} />
              </button>

              <button
                type="button"
                onClick={handleClearSchedule}
                className="uber-text-btn"
              >
                Clear
              </button>
            </div>

            {/* Title & Pickup Location Subtitle */}
            <div>
              <h1 className="uber-title" style={{ fontSize: '1.85rem', marginBottom: '0.45rem' }}>
                When do you want to be picked up?
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted, #9ca3af)', margin: 0, lineHeight: 1.4 }}>
                From {pickup.address || 'Pickup location'}
              </p>
            </div>

            {/* DATE SELECTOR BOX */}
            <div style={{ position: 'relative' }}>
              <div
                className="uber-select-box"
                onClick={() => setShowDatePicker(!showDatePicker)}
                style={{ padding: '0.9rem 1.1rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Calendar size={18} style={{ color: 'var(--text-main, #ffffff)' }} />
                  <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    {formatDisplayDate(bookingDate)}
                  </span>
                </div>
                <ChevronDown size={18} style={{ transform: showDatePicker ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>

              {showDatePicker && (
                <div
                  style={{
                    position: 'absolute',
                    top: '105%',
                    left: 0,
                    right: 0,
                    zIndex: 30,
                    background: 'var(--bg-card, #14171b)',
                    border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.15))',
                    borderRadius: '12px',
                    padding: '1rem',
                    boxShadow: '0 10px 35px rgba(0,0,0,0.5)',
                  }}
                >
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                    Select Pickup Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={bookingDate}
                    min={todayStr}
                    onChange={(e) => {
                      setBookingDate(e.target.value);
                      setShowDatePicker(false);
                    }}
                    style={{ minHeight: '44px' }}
                  />
                </div>
              )}
            </div>

            {/* TIME SELECTOR BOX */}
            <div style={{ position: 'relative' }}>
              <div
                className="uber-select-box"
                onClick={() => setShowTimePicker(!showTimePicker)}
                style={{ padding: '0.9rem 1.1rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Clock size={18} style={{ color: 'var(--text-main, #ffffff)' }} />
                  <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    {formatDisplayTime(pickupTime)}
                  </span>
                </div>
                <ChevronDown size={18} style={{ transform: showTimePicker ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>

              {showTimePicker && (
                <div
                  style={{
                    position: 'absolute',
                    top: '105%',
                    left: 0,
                    right: 0,
                    zIndex: 30,
                    maxHeight: '220px',
                    overflowY: 'auto',
                    background: 'var(--bg-card, #14171b)',
                    border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.15))',
                    borderRadius: '12px',
                    padding: '0.5rem',
                    boxShadow: '0 10px 35px rgba(0,0,0,0.5)',
                  }}
                >
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => {
                        setPickupTime(slot.value);
                        setShowTimePicker(false);
                      }}
                      className="btn btn-secondary"
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.55rem 0.75rem',
                        fontSize: '0.85rem',
                        fontWeight: pickupTime === slot.value ? 700 : 500,
                        background: pickupTime === slot.value ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        marginBottom: '2px',
                      }}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* FEATURE BULLETS / VALUE PROPOSITIONS */}
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column' }}>
              <div className="uber-schedule-feature-item">
                <Calendar size={20} style={{ color: 'var(--text-main, #ffffff)', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.92rem', color: 'var(--text-main, #ffffff)', lineHeight: 1.4 }}>
                  Choose your pickup time up to 30 days in advance
                </span>
              </div>

              <div className="uber-schedule-feature-item">
                <Hourglass size={20} style={{ color: 'var(--text-main, #ffffff)', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.92rem', color: 'var(--text-main, #ffffff)', lineHeight: 1.4 }}>
                  Extra wait time included to meet your ride
                </span>
              </div>

              <div className="uber-schedule-feature-item">
                <CreditCard size={20} style={{ color: 'var(--text-main, #ffffff)', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.92rem', color: 'var(--text-main, #ffffff)', lineHeight: 1.4 }}>
                  Cancel at no charge up to 60 minutes in advance
                </span>
              </div>
            </div>

            {/* CONFIRM / SET PICKUP TIME BUTTON */}
            <button
              type="button"
              onClick={handleConfirmSchedule}
              className="uber-search-btn"
              style={{ marginTop: '1rem' }}
            >
              Set pickup time
            </button>
          </div>
        ) : (
          /* ==========================================================================
             MAIN UBER "GET A RIDE" VIEW
             ========================================================================== */
          <>
            <h1 className="uber-title">Get a ride</h1>

            {/* PROMO / POLICY VOUCHER PILL */}
            <div className="uber-promo-pill">
              <Tag size={15} color="#10b981" />
              <span>100% off your next ride. Up to ₹35 per ride</span>
              <Info size={14} style={{ cursor: 'pointer', opacity: 0.8 }} />
            </div>

            {error && (
              <div className="alert alert-error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.85rem' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: '0.85rem' }}>{error}</span>
              </div>
            )}

            {/* PICKUP LOCATION INPUT */}
            <div>
              <LocationSearchInput
                id="uber-pickup-input"
                label="Pickup location"
                placeholder="35/1, Muniyandi Kovil Ln, near Santha..."
                value={pickup.address}
                onChange={(val) => setPickup((prev) => ({ ...prev, address: val }))}
                onSelectLocation={(loc) => {
                  if (loc) {
                    setPickup({ address: loc.address, coordinates: loc.coordinates });
                    setSelectionMode('DESTINATION');
                  } else {
                    setPickup({ address: '', coordinates: null });
                  }
                }}
                iconType="pickup"
                proximity={pickup.coordinates || [78.1198, 9.9252]}
              />
            </div>

            {/* DESTINATION LOCATION INPUT */}
            <div>
              <LocationSearchInput
                id="uber-destination-input"
                label="Destination"
                placeholder="Mattuthavani Omni Bus Stand"
                value={destination.address}
                onChange={(val) => setDestination((prev) => ({ ...prev, address: val }))}
                onSelectLocation={(loc) => {
                  if (loc) {
                    setDestination({ address: loc.address, coordinates: loc.coordinates });
                    setSelectionMode(null);
                  } else {
                    setDestination({ address: '', coordinates: null });
                  }
                }}
                iconType="destination"
                proximity={destination.coordinates || [78.1565, 9.9485]}
              />
            </div>

            {/* PICKUP TIME SELECTOR (Opens Uber Scheduling View) */}
            <div
              className="uber-select-box"
              onClick={() => setPanelView('schedule')}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Clock size={16} />
                <span>
                  {isScheduled
                    ? `${formatDisplayDate(bookingDate)}, ${formatDisplayTime(pickupTime)}`
                    : 'Pickup now'}
                </span>
              </div>
              <ChevronDown size={16} />
            </div>

            {/* RIDER SELECTION PILL */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="uber-pill-btn"
                onClick={() => setShowRiderDropdown(!showRiderDropdown)}
              >
                <User size={15} />
                <span>{riderName}</span>
                <ChevronDown size={14} />
              </button>

              {showRiderDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    zIndex: 20,
                    background: 'var(--bg-card, #14171b)',
                    border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.15))',
                    borderRadius: '10px',
                    padding: '0.4rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    minWidth: '160px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setRiderName('For me');
                      setShowRiderDropdown(false);
                    }}
                    className="btn btn-secondary"
                    style={{ textAlign: 'left', padding: '0.4rem 0.65rem', fontSize: '0.8rem', border: 'none' }}
                  >
                    👤 For me ({currentUser?.fullName || 'Self'})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRiderName('For Colleague');
                      setShowRiderDropdown(false);
                    }}
                    className="btn btn-secondary"
                    style={{ textAlign: 'left', padding: '0.4rem 0.65rem', fontSize: '0.8rem', border: 'none' }}
                  >
                    👥 For Colleague / Guest
                  </button>
                </div>
              )}
            </div>

            {/* PRIMARY "SEARCH" ACTION BUTTON */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="uber-search-btn"
            >
              {loading ? 'Searching rides...' : 'Search'}
            </button>
          </>
        )}
      </div>

      {/* RIGHT COLUMN: EXPANSIVE GOOGLE MAP */}
      <div className="uber-map-container">
        <MapView
          center={pickup.coordinates || [78.1198, 9.9252]}
          zoom={13}
          pickupLocation={pickup.coordinates ? pickup : null}
          destinationLocation={destination.coordinates ? destination : null}
          selectionMode={selectionMode}
          onPickupSelect={handlePickupSelectFromMap}
          onDestinationSelect={handleDestinationSelectFromMap}
          onRouteUpdate={setRouteDetails}
          onClearAll={handleClearAll}
          showControls={true}
          showRouteInfo={true}
          styleOverrides={{ height: '100%', minHeight: '560px' }}
        />
      </div>

      {/* CONFIRMATION SUCCESS MODAL (Centered with full black overlay) */}
      {confirmedRide && (
        <div className="modal-overlay" onClick={() => setConfirmedRide(null)} role="dialog" aria-modal="true">
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '560px', 
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <div 
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 className="modal-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Ride Booked Successfully!
            </h2>
            <p style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Your ride has been confirmed and submitted for dispatch.
            </p>

            <div 
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.1))',
                borderRadius: '14px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim, #71717a)' }}>Booking Reference:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <code style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8' }}>
                    {confirmedRide.bookingReference}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                  >
                    {copiedRef ? 'Copied' : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))', paddingTop: '0.6rem' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Pickup Location:</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>{confirmedRide.pickupLocation}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Destination:</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>{confirmedRide.destination}</div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))', paddingTop: '0.6rem' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Pickup Schedule:</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}>
                  {confirmedRide.bookingDate} at {confirmedRide.pickupTime}
                </div>
              </div>

              {routeDetails && (
                <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))', paddingTop: '0.6rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Distance:</span>{' '}
                    <strong style={{ fontSize: '0.85rem', color: '#10b981' }}>{routeDetails.distanceText}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Est. Duration:</span>{' '}
                    <strong style={{ fontSize: '0.85rem', color: '#38bdf8' }}>{routeDetails.durationText}</strong>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setConfirmedRide(null)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.75rem' }}
              >
                Book Another
              </button>
              <button
                type="button"
                onClick={() => navigate('/my-rides')}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.75rem' }}
              >
                View My Rides
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookRidePage;
