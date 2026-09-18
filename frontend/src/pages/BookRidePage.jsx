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
import { RiderSelectionModal } from '../components/RiderSelectionModal';
import promoBannerImg from '../assets/promo-voucher-banner.png';

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
    address: '',
    coordinates: null,
    placeId: null,
  });

  const [destination, setDestination] = useState({
    address: '',
    coordinates: null,
    placeId: null,
  });

  // Panel view state: 'main' | 'schedule'
  const [panelView, setPanelView] = useState('main');

  const [selectedTier, setSelectedTier] = useState('uber-go');
  const [isScheduled, setIsScheduled] = useState(false);
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [pickupTime, setPickupTime] = useState('08:30');
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [selectedRider, setSelectedRider] = useState({
    type: 'SELF',
    name: 'For me',
    phone: '',
  });
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState('PICKUP');

  const [routeDetails, setRouteDetails] = useState(null);
  const [routeCalculating, setRouteCalculating] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmedRide, setConfirmedRide] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const handlePickupSelectFromMap = (loc) => {
    if (!loc) {
      setPickup({ address: '', coordinates: null, placeId: null });
      setRouteDetails(null);
      return;
    }
    setPickup({
      address: loc.address || `Location (${loc.coordinates[1].toFixed(4)}, ${loc.coordinates[0].toFixed(4)})`,
      coordinates: loc.coordinates,
      placeId: loc.placeId || null,
    });
    if (error) setError(null);
  };

  const handleDestinationSelectFromMap = (loc) => {
    if (!loc) {
      setDestination({ address: '', coordinates: null, placeId: null });
      setRouteDetails(null);
      return;
    }
    setDestination({
      address: loc.address || `Location (${loc.coordinates[1].toFixed(4)}, ${loc.coordinates[0].toFixed(4)})`,
      coordinates: loc.coordinates,
      placeId: loc.placeId || null,
    });
    if (error) setError(null);
  };

  const handleClearAll = () => {
    setPickup({ address: '', coordinates: null, placeId: null });
    setDestination({ address: '', coordinates: null, placeId: null });
    setRouteDetails(null);
    setRouteCalculating(false);
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

    if (!pickup.address || !pickup.address.trim()) {
      setError('Please enter or select a pickup location');
      return;
    }
    if (!destination.address || !destination.address.trim()) {
      setError('Please enter or select a destination');
      return;
    }
    if (pickup.address.trim().toLowerCase() === destination.address.trim().toLowerCase()) {
      setError('Pickup location and destination cannot be identical');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const notesSuffix = selectedRider.type === 'COLLEAGUE'
        ? ` [Passenger: ${selectedRider.name} (${selectedRider.phone})] (${selectedTier})`
        : ` (${selectedTier})`;

      const payload = {
        pickupLocation: pickup.address.trim(),
        destination: destination.address.trim(),
        pickupLatitude: pickup.coordinates ? pickup.coordinates[1] : 10.7905,
        pickupLongitude: pickup.coordinates ? pickup.coordinates[0] : 78.7047,
        destinationLatitude: destination.coordinates ? destination.coordinates[1] : 10.7932,
        destinationLongitude: destination.coordinates ? destination.coordinates[0] : 78.6856,
        bookingDate: isScheduled ? bookingDate : todayStr,
        pickupTime: isScheduled ? pickupTime : new Date().toTimeString().slice(0, 5),
        bookingNotes: bookingNotes.trim() ? `${bookingNotes.trim()}${notesSuffix}` : `Tier: ${selectedTier}${selectedRider.type === 'COLLEAGUE' ? ` - Passenger: ${selectedRider.name} (${selectedRider.phone})` : ''}`,
        riderType: selectedRider.type,
        riderName: selectedRider.type === 'COLLEAGUE' ? selectedRider.name : (currentUser?.fullName || 'Self'),
        riderPhone: selectedRider.type === 'COLLEAGUE' ? selectedRider.phone : (currentUser?.phoneNumber || ''),
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header with Circle Back Button & Clear */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setPanelView('main')}
                className="uber-circle-btn"
                aria-label="Go back to booking"
                style={{ background: '#f3f4f6', border: 'none', color: '#000000' }}
              >
                <ArrowLeft size={18} />
              </button>

              <button
                type="button"
                onClick={handleClearSchedule}
                className="uber-text-btn"
                style={{ color: '#000000', fontWeight: 600 }}
              >
                Clear
              </button>
            </div>

            {/* Title & Pickup Location Subtitle */}
            <div>
              <h1 className="uber-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                When do you want to be picked up?
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                From {pickup.address || 'Pickup location'}
              </p>
            </div>

            {/* DATE SELECTOR BOX */}
            <div style={{ position: 'relative' }}>
              <div
                className="uber-select-box"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Calendar size={18} style={{ color: '#000000' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>
                    {formatDisplayDate(bookingDate)}
                  </span>
                </div>
                <ChevronDown size={18} style={{ transform: showDatePicker ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#000000' }} />
              </div>

              {showDatePicker && (
                <div
                  style={{
                    position: 'absolute',
                    top: '105%',
                    left: 0,
                    right: 0,
                    zIndex: 30,
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1rem',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                  }}
                >
                  <label style={{ fontSize: '0.8rem', color: '#4b5563', marginBottom: '0.4rem', display: 'block', fontWeight: 600 }}>
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
                    style={{ minHeight: '44px', background: '#f9fafb', color: '#000000', border: '1px solid #d1d5db' }}
                  />
                </div>
              )}
            </div>

            {/* TIME SELECTOR BOX */}
            <div style={{ position: 'relative' }}>
              <div
                className="uber-select-box"
                onClick={() => setShowTimePicker(!showTimePicker)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Clock size={18} style={{ color: '#000000' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>
                    {formatDisplayTime(pickupTime)}
                  </span>
                </div>
                <ChevronDown size={18} style={{ transform: showTimePicker ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#000000' }} />
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
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '0.5rem',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
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
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.55rem 0.75rem',
                        fontSize: '0.85rem',
                        fontWeight: pickupTime === slot.value ? 700 : 500,
                        background: pickupTime === slot.value ? '#f3f4f6' : 'transparent',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '8px',
                        marginBottom: '2px',
                        cursor: 'pointer',
                      }}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* FEATURE BULLETS / VALUE PROPOSITIONS */}
            <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.4rem 0' }}>
                <Calendar size={18} style={{ color: '#000000', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.4 }}>
                  Choose your pickup time up to 30 days in advance
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.4rem 0' }}>
                <Hourglass size={18} style={{ color: '#000000', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.4 }}>
                  Extra wait time included to meet your ride
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.4rem 0' }}>
                <CreditCard size={18} style={{ color: '#000000', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.4 }}>
                  Cancel at no charge up to 60 minutes in advance
                </span>
              </div>
            </div>

            {/* CONFIRM / SET PICKUP TIME BUTTON */}
            <button
              type="button"
              onClick={handleConfirmSchedule}
              className="uber-search-btn"
              style={{ marginTop: '0.5rem' }}
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
            <div
              className="uber-promo-pill"
              onClick={() => setShowPromoModal(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowPromoModal(true);
                }
              }}
              title="Click to view promo details"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Tag size={15} color="#059669" style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>100% off your next ride. Up to ₹45 pe...</span>
              </div>
              <Info size={15} color="#059669" style={{ cursor: 'pointer', flexShrink: 0 }} />
            </div>

            {error && (
              <div className="alert alert-error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                <AlertCircle size={15} />
                <span style={{ fontSize: '0.82rem' }}>{error}</span>
              </div>
            )}

            {/* PICKUP LOCATION BAR */}
            <LocationSearchInput
              id="uber-pickup-input"
              variant="uber"
              placeholder="Pickup location"
              value={pickup.address}
              onChange={(val) => {
                setPickup((prev) => ({ ...prev, address: val }));
                if (!val || val.trim() === '') {
                  setPickup({ address: '', coordinates: null, placeId: null });
                  setRouteDetails(null);
                }
              }}
              onSelectLocation={(loc) => {
                if (loc) {
                  setPickup({ address: loc.address, coordinates: loc.coordinates, placeId: loc.placeId });
                  setSelectionMode('DESTINATION');
                  if (destination.coordinates) {
                    setRouteCalculating(true);
                  }
                } else {
                  setPickup({ address: '', coordinates: null, placeId: null });
                  setRouteDetails(null);
                }
              }}
              iconType="pickup"
            />

            {/* DROPOFF LOCATION BAR */}
            <LocationSearchInput
              id="uber-destination-input"
              variant="uber"
              placeholder="Dropoff location"
              value={destination.address}
              showAddStop={true}
              onChange={(val) => {
                setDestination((prev) => ({ ...prev, address: val }));
                if (!val || val.trim() === '') {
                  setDestination({ address: '', coordinates: null, placeId: null });
                  setRouteDetails(null);
                }
              }}
              onSelectLocation={(loc) => {
                if (loc) {
                  setDestination({ address: loc.address, coordinates: loc.coordinates, placeId: loc.placeId });
                  setSelectionMode(null);
                  if (pickup.coordinates) {
                    setRouteCalculating(true);
                  }
                } else {
                  setDestination({ address: '', coordinates: null, placeId: null });
                  setRouteDetails(null);
                }
              }}
              iconType="destination"
            />

            {/* LIVE DRIVING ROUTE ESTIMATE STRIP */}
            {pickup.coordinates && destination.coordinates && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Navigation size={14} color="#059669" />
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#065f46' }}>
                    {routeDetails ? (
                      <>
                        <span>{routeDetails.distanceText}</span>
                        <span style={{ margin: '0 0.35rem', color: '#86efac' }}>&bull;</span>
                        <span>{routeDetails.durationText}</span>
                      </>
                    ) : (
                      <span>Calculating route...</span>
                    )}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: '#dcfce7',
                    color: '#15803d',
                  }}
                >
                  DRIVING
                </span>
              </div>
            )}

            {/* PICKUP TIME BAR */}
            <div
              className="uber-select-box"
              onClick={() => setPanelView('schedule')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock size={18} color="#000000" strokeWidth={2.5} />
                <span>
                  {isScheduled
                    ? `${formatDisplayDate(bookingDate)}, ${formatDisplayTime(pickupTime)}`
                    : 'Pickup now'}
                </span>
              </div>
              <ChevronDown size={18} color="#000000" />
            </div>

            {/* RIDER SELECTION PILL ("For me" button) */}
            <div>
              <button
                type="button"
                className="uber-pill-btn"
                onClick={() => setShowRiderModal(true)}
              >
                <User size={15} color="#000000" strokeWidth={2.5} />
                <span>
                  {selectedRider.type === 'COLLEAGUE'
                    ? `For ${selectedRider.name}`
                    : 'For me'}
                </span>
                <ChevronDown size={14} color="#000000" />
              </button>
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
          styleOverrides={{ height: '100%', minHeight: '100%', borderRadius: '16px' }}
        />
      </div>

      {/* CHOOSE A RIDER / NEW RIDER MODAL */}
      <RiderSelectionModal
        isOpen={showRiderModal}
        onClose={() => setShowRiderModal(false)}
        selectedRider={selectedRider}
        onSelectRider={(rider) => {
          setSelectedRider(rider);
          setShowRiderModal(false);
        }}
      />

      {/* PROMOTION / VOUCHER DETAILS MODAL */}
      {showPromoModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPromoModal(false)}
          role="dialog"
          aria-modal="true"
          style={{
            zIndex: 1200,
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.65)',
          }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: 0,
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#ffffff',
              color: '#000000',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              position: 'relative',
              animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* TOP ILLUSTRATION HEADER WITH CLOSE BUTTON */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
                flexShrink: 0,
                background: '#cbe5d2',
              }}
            >
              <img
                src={promoBannerImg}
                alt="Price Tag"
                title="Price Tag"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  userSelect: 'none',
                }}
              />
              {/* Interactive click zone perfectly overlaying the top-right close X */}
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                aria-label="Close"
                title="Close"
                style={{
                  position: 'absolute',
                  top: '5%',
                  right: '3.5%',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
              />
            </div>

            {/* SCROLLABLE CONTENT BODY */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <h2
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#000000',
                  margin: 0,
                  lineHeight: 1.25,
                  letterSpacing: '-0.02em',
                }}
              >
                100% off your next ride. Up to ₹45 per ride.
              </h2>

              {/* EXPIRATION */}
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#000000', marginBottom: '0.2rem' }}>
                  Expiration
                </div>
                <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                  Expires Jan 31, 2027.
                </div>
              </div>

              {/* RESTRICTIONS */}
              <div style={{ marginTop: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#000000', marginBottom: '0.6rem' }}>
                  Restrictions
                </div>
                <ul
                  style={{
                    paddingLeft: '1.2rem',
                    margin: 0,
                    fontSize: '0.84rem',
                    color: '#374151',
                    lineHeight: 1.6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                  }}
                >
                  <li>Congrats! You've unlocked first FREE Bike ride upto Rs 45. Limited period validity.</li>
                  <li>Valid only on: Bike, Bike Saver.</li>
                  <li>Valid in India.</li>
                  <li>Up to ₹45 per ride.</li>
                  <li>Only promotions applied at time of trip booking will be available at trip completion.</li>
                  <li>
                    Discount does not apply to surcharges, government fees, tolls, or tips and cannot be combined with other offers. For accounts with multiple valid promo codes, the promo with the highest savings will automatically apply to a rider’s next trip. Offer is non-transferable. Offer and terms are subject to change.
                  </li>
                </ul>
              </div>

              {/* BOOK NOW ACTION BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setShowPromoModal(false);
                  const pickupInput = document.getElementById('uber-pickup-input');
                  if (pickupInput) pickupInput.focus();
                }}
                className="uber-search-btn"
                style={{ marginTop: '0.5rem', width: '100%' }}
              >
                Book now
              </button>
            </div>
          </div>
        </div>
      )}

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

              {/* Rider Info Badge */}
              {confirmedRide.riderType === 'COLLEAGUE' && (
                <div style={{ borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))', paddingTop: '0.6rem' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Booked For Colleague:</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '2px' }}>
                    <span>👤 {confirmedRide.riderName}</span>
                    {confirmedRide.riderPhone && (
                      <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>({confirmedRide.riderPhone})</span>
                    )}
                  </div>
                </div>
              )}

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
