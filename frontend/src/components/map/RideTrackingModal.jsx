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
          padding: '1.75rem',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <h2 className="modal-title" style={{ margin: 0, fontSize: '1.35rem' }}>
                Trip Live Tracking
              </h2>
              <StatusBadge status={currentRide.status} />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #9ca3af)' }}>
              Ref: <strong style={{ color: 'var(--accent-cyan, #06b6d4)', fontFamily: 'monospace' }}>{currentRide.bookingReference}</strong> &bull; {currentRide.bookingDate} at {currentRide.pickupTime}
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* COMPLETED BANNER & ACTION */}
        {isCompleted && (
          <div 
            style={{ 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(6, 182, 212, 0.18))', 
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '12px',
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
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <strong style={{ color: '#fff', fontSize: '0.95rem', display: 'block' }}>Trip Successfully Completed</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #9ca3af)' }}>Your ride reached its destination. Please rate your driver experience.</span>
              </div>
            </div>

            {onRateRide && (
              <button
                type="button"
                onClick={() => onRateRide(currentRide)}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              >
                ⭐ Rate Driver
              </button>
            )}
          </div>
        )}

        {/* GOOGLE MAPS LIVE TRACKING MAP */}
        <div style={{ marginBottom: '1.25rem' }}>
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
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.1))',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim, #71717a)', fontWeight: 600 }}>GPS TELEMETRY</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              {isStale ? (
                <>
                  <AlertTriangle size={15} color="#f59e0b" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fbbf24' }}>Delayed (&gt;60s)</span>
                </>
              ) : location ? (
                <>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#10b981' }}>Live GPS Broadcasting</span>
                </>
              ) : (
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>Awaiting Driver GPS</span>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim, #71717a)', fontWeight: 600 }}>DRIVER SPEED</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main, #fff)', marginTop: '0.2rem' }}>
              {location?.speed != null ? `${location.speed.toFixed(1)} km/h` : '0.0 km/h'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim, #71717a)', fontWeight: 600 }}>ROUTE STATUS</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan, #06b6d4)', marginTop: '0.2rem' }}>
              {currentRide.status.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* DRIVER & VEHICLE DETAILS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Driver Card */}
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '12px',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <User size={18} color="#818cf8" />
              <strong style={{ fontSize: '0.9rem', color: '#fff' }}>Assigned Driver</strong>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
              {currentRide.driverName || 'Driver assignment in progress'}
            </div>
            {currentRide.driverPhone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                <Phone size={13} />
                <span>{currentRide.driverPhone}</span>
              </div>
            )}
          </div>

          {/* Vehicle Card */}
          <div
            style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: '12px',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <Car size={18} color="#22d3ee" />
              <strong style={{ fontSize: '0.9rem', color: '#fff' }}>Assigned Vehicle</strong>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {currentRide.vehicleRegistration || 'Vehicle pending'}
            </div>
            {currentRide.vehicleMakeModel && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
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
