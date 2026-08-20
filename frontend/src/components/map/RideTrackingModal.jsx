import React, { useState, useEffect, useRef } from 'react';
import { 
  X, MapPin, Navigation, Car, Phone, User, Clock, 
  Activity, AlertTriangle, CheckCircle2, ShieldCheck, Sparkles 
} from 'lucide-react';
import { rideService } from '../../services/rideService';
import { StatusBadge } from '../StatusBadge';
import { MapView } from './MapView';

export const RideTrackingModal = ({ ride, onClose, onRateRide }) => {
  const [currentRide, setCurrentRide] = useState(ride);
  const [location, setLocation] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollTimerRef = useRef(null);

  const fetchLiveTelemetry = async () => {
    try {
      // 1. Fetch latest location
      const locData = await rideService.getLatestLocation(ride.id);
      if (locData && locData.latitude !== 0 && locData.longitude !== 0) {
        setLocation({
          coordinates: [locData.longitude, locData.latitude], // [lng, lat]
          speed: locData.speed,
          heading: locData.heading,
          isStale: locData.isStale,
        });
        setIsStale(Boolean(locData.isStale));
      }

      // 2. Fetch updated ride status to detect trip completion
      const freshRide = await rideService.getRideById(ride.id);
      if (freshRide) {
        setCurrentRide(freshRide);
      }
    } catch (err) {
      console.warn('Telemetry sync error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTelemetry();
    // Poll telemetry every 3.5 seconds
    pollTimerRef.current = setInterval(fetchLiveTelemetry, 3500);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [ride.id]);

  const pickupLocation = {
    address: currentRide.pickupLocation,
    coordinates: currentRide.pickupLongitude && currentRide.pickupLatitude
      ? [currentRide.pickupLongitude, currentRide.pickupLatitude]
      : [80.2707, 13.0827],
  };

  const destinationLocation = {
    address: currentRide.destination,
    coordinates: currentRide.destinationLongitude && currentRide.destinationLatitude
      ? [currentRide.destinationLongitude, currentRide.destinationLatitude]
      : [80.1709, 12.9941],
  };

  const isCompleted = currentRide.status === 'COMPLETED';

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '740px',
          width: '100%',
          padding: '2rem',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
          color: '#0f2920',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f2920' }}>
                Trip Live Tracking
              </h2>
              <StatusBadge status={currentRide.status} />
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Ref: <strong style={{ color: '#2563eb', fontWeight: 800 }}>{currentRide.bookingReference}</strong> • {currentRide.bookingDate} at {currentRide.pickupTime}
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* COMPLETED BANNER & ACTION */}
        {isCompleted && (
          <div 
            style={{ 
              background: '#ecfdf5', 
              border: '1.5px solid #a7f3d0',
              borderRadius: '14px',
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <strong style={{ color: '#0f2920', fontSize: '0.95rem', display: 'block', fontWeight: 900 }}>Trip Successfully Completed</strong>
                <span style={{ fontSize: '0.8rem', color: '#475569' }}>Your ride reached its destination. Please rate your driver experience.</span>
              </div>
            </div>

            {onRateRide && (
              <button
                type="button"
                onClick={() => onRateRide(currentRide)}
                style={{
                  padding: '0.5rem 1.1rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(19, 56, 44, 0.2)',
                }}
              >
                ⭐ Rate Driver
              </button>
            )}
          </div>
        )}

        {/* GOOGLE MAPS LIVE TRACKING MAP */}
        <div style={{ marginBottom: '1.25rem', borderRadius: '14px', overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
          <MapView
            center={pickupLocation.coordinates}
            zoom={12}
            pickupLocation={pickupLocation}
            destinationLocation={destinationLocation}
            driverLocation={location}
            showControls={false}
            showRouteInfo={true}
            styleOverrides={{ height: '380px' }}
          />
        </div>

        {/* Live Status & Telemetry Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.85rem',
            background: '#f8faf9',
            border: '1.5px solid #e2e8f0',
            padding: '1rem 1.25rem',
            borderRadius: '14px',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>GPS TELEMETRY</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              {isStale ? (
                <>
                  <AlertTriangle size={15} color="#d97706" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#d97706' }}>Delayed (&gt;60s)</span>
                </>
              ) : location ? (
                <>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', boxShadow: '0 0 8px #059669' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#059669' }}>Live GPS Broadcasting</span>
                </>
              ) : (
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#64748b' }}>Awaiting Driver GPS</span>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>DRIVER SPEED</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f2920', marginTop: '0.2rem' }}>
              {location?.speed != null ? `${location.speed.toFixed(1)} km/h` : '0.0 km/h'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>ROUTE STATUS</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2563eb', marginTop: '0.2rem' }}>
              {currentRide.status.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* DRIVER & VEHICLE DETAILS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {/* Driver Card */}
          <div
            style={{
              background: '#f8faf9',
              border: '1.5px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1.1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <User size={16} color="#059669" />
              <strong style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Assigned Driver</strong>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f2920' }}>
              {currentRide.driverName || 'Driver assignment in progress'}
            </div>
            {currentRide.driverPhone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: '#64748b', marginTop: '0.3rem', fontWeight: 600 }}>
                <Phone size={13} />
                <span>{currentRide.driverPhone}</span>
              </div>
            )}
          </div>

          {/* Vehicle Card */}
          <div
            style={{
              background: '#f8faf9',
              border: '1.5px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1.1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Car size={16} color="#2563eb" />
              <strong style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Assigned Vehicle</strong>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#2563eb' }}>
              {currentRide.vehicleRegistration || 'Vehicle pending'}
            </div>
            {currentRide.vehicleMakeModel && (
              <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.3rem', fontWeight: 600 }}>
                {currentRide.vehicleMakeModel} ({currentRide.vehicleType || 'Standard Sedan'})
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default RideTrackingModal;
