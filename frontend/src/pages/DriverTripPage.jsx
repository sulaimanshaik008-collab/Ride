import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, CheckCircle2, Navigation, MapPin, Clock, 
  ShieldAlert, RefreshCw, Car, User, AlertCircle, Compass, Gauge 
} from 'lucide-react';
import { rideService } from '../services/rideService';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';

export const DriverTripPage = () => {
  const { currentUser } = useAuth();
  const isDriver = currentUser?.role === 'DRIVER' || 
                   currentUser?.role === 'TRANSPORT_MANAGER' || 
                   currentUser?.role === 'CORPORATE_ADMIN' || 
                   currentUser?.role === 'SYSTEM_ADMIN';

  const [assignedRides, setAssignedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Active tracking state
  const [activeTrackingRide, setActiveTrackingRide] = useState(null);
  const [lastLocation, setLastLocation] = useState(null);
  const [geoStatus, setGeoStatus] = useState('Idle'); // 'Idle' | 'Streaming' | 'Permission Denied' | 'Unavailable' | 'Error'
  const watchIdRef = useRef(null);

  const fetchAssignedRides = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rideService.getDriverAssignedTrips();
      setAssignedRides(data || []);

      // Check if any ride is IN_PROGRESS
      const active = (data || []).find(r => r.status === 'IN_PROGRESS');
      if (active) {
        setActiveTrackingRide(active);
      }
    } catch (err) {
      setError(err.message || 'Failed to load driver assigned trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDriver) {
      fetchAssignedRides();
    }
  }, [currentUser]);

  // Clean up geolocation watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const startLocationStreaming = (rideId) => {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation unsupported on this browser');
      return;
    }

    setGeoStatus('Requesting GPS position...');

    const handlePosition = async (position) => {
      const { latitude, longitude, accuracy, speed, heading } = position.coords;
      const payload = {
        latitude,
        longitude,
        accuracy: accuracy || 5.0,
        speed: speed ? speed * 3.6 : 30.0, // Convert m/s to km/h or fallback
        heading: heading || 0.0,
        recordedAt: new Date().toISOString(),
      };

      try {
        const response = await rideService.updateLocation(rideId, payload);
        setLastLocation(response);
        setGeoStatus('Live GPS Streaming Active');
      } catch (err) {
        console.error('Location transmission error:', err);
        setGeoStatus(`Transmission issue: ${err.message}`);
      }
    };

    const handleError = (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        setGeoStatus('GPS Permission Denied. Please enable location access in browser settings.');
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setGeoStatus('GPS Position Unavailable');
      } else {
        setGeoStatus(`GPS Error: ${err.message}`);
      }
    };

    // Immediate initial sync
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    // Continuous watch
    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    });
  };

  const stopLocationStreaming = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGeoStatus('Idle');
  };

  const handleStartTrip = async (ride) => {
    try {
      setActionLoading(ride.id);
      setError(null);
      const updated = await rideService.startTrip(ride.id);
      setActiveTrackingRide(updated);
      startLocationStreaming(ride.id);
      fetchAssignedRides();
    } catch (err) {
      setError(err.message || 'Failed to start trip');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteTrip = async (ride) => {
    try {
      setActionLoading(ride.id);
      setError(null);
      await rideService.completeTrip(ride.id);
      stopLocationStreaming();
      setActiveTrackingRide(null);
      setLastLocation(null);
      fetchAssignedRides();
    } catch (err) {
      setError(err.message || 'Failed to complete trip');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isDriver) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          The Driver Console is reserved for registered fleet drivers and transport personnel.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Driver Trip & GPS Console</h1>
          <p className="page-subtitle">
            Manage assigned trips, broadcast live GPS coordinates, and mark trip completion.
          </p>
        </div>

        <button onClick={fetchAssignedRides} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ACTIVE GPS TRACKING PANEL */}
      {activeTrackingRide && (
        <div className="glass-card" style={{ marginBottom: '1.75rem', borderColor: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.06)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Active Trip in Progress — {activeTrackingRide.bookingReference}
              </h2>
            </div>
            <StatusBadge status={activeTrackingRide.status} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Passenger</span>
              <strong style={{ color: '#fff' }}>{activeTrackingRide.employeeName}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Assigned Vehicle</span>
              <strong style={{ color: 'var(--accent-cyan)' }}>{activeTrackingRide.vehicleRegistration}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>GPS Telemetry Status</span>
              <span style={{ color: geoStatus.includes('Active') ? '#10b981' : '#fbbf24', fontWeight: 700 }}>
                {geoStatus}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Last Coordinates</span>
              <strong style={{ color: '#fff' }}>
                {lastLocation ? `${lastLocation.latitude.toFixed(4)}, ${lastLocation.longitude.toFixed(4)}` : 'Syncing...'}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              onClick={() => handleCompleteTrip(activeTrackingRide)}
              className="btn btn-primary"
              style={{ background: '#10b981', borderColor: '#10b981', padding: '0.6rem 1.25rem' }}
              disabled={actionLoading === activeTrackingRide.id}
            >
              <CheckCircle2 size={16} />
              {actionLoading === activeTrackingRide.id ? 'Completing...' : 'Mark Trip Completed'}
            </button>
          </div>
        </div>
      )}

      {/* ASSIGNED TRIPS LIST */}
      <div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
          Assigned Rides Roster
        </h2>

        {loading ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>Loading assigned driver trips...</p>
          </div>
        ) : assignedRides.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Car size={40} color="#6366f1" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem' }}>
              No Assigned Trips
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              You currently have no scheduled or assigned corporate trips.
            </p>
          </div>
        ) : (
          <div className="rides-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {assignedRides.map((ride) => (
              <div key={ride.id} className="ride-card">
                <div className="ride-card-header">
                  <div>
                    <span className="booking-ref">{ride.bookingReference}</span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
                      {ride.employeeName}
                    </h3>
                  </div>
                  <StatusBadge status={ride.status} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', margin: '0.75rem 0' }}>
                  <div className="meta-item">
                    <MapPin size={14} color="#10b981" />
                    <span>Pickup: <strong style={{ color: '#fff' }}>{ride.pickupLocation}</strong></span>
                  </div>

                  <div className="meta-item">
                    <MapPin size={14} color="#ef4444" />
                    <span>Destination: <strong style={{ color: '#fff' }}>{ride.destination}</strong></span>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                    <div className="meta-item">
                      <Clock size={14} color="#6366f1" />
                      <span>Date: <strong style={{ color: 'var(--accent-cyan)' }}>{ride.bookingDate}</strong></span>
                    </div>
                    <div className="meta-item">
                      <Clock size={14} color="#f59e0b" />
                      <span>Pickup: <strong style={{ color: '#fff' }}>{ride.pickupTime}</strong></span>
                    </div>
                  </div>

                  {ride.vehicleRegistration && (
                    <div className="meta-item" style={{ background: 'rgba(6, 182, 212, 0.06)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                      <Car size={14} color="#06b6d4" />
                      <span>Vehicle: <strong style={{ color: 'var(--accent-cyan)' }}>{ride.vehicleRegistration}</strong> ({ride.vehicleMakeModel})</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem' }}>
                  {ride.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleStartTrip(ride)}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      disabled={actionLoading === ride.id}
                    >
                      <Play size={14} />
                      {actionLoading === ride.id ? 'Starting...' : 'Start Trip'}
                    </button>
                  )}

                  {ride.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleCompleteTrip(ride)}
                      className="btn btn-primary"
                      style={{ background: '#10b981', borderColor: '#10b981', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      disabled={actionLoading === ride.id}
                    >
                      <CheckCircle2 size={14} />
                      {actionLoading === ride.id ? 'Completing...' : 'Complete Trip'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
