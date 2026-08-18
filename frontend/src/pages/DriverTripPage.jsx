import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, CheckCircle2, Navigation, MapPin, Clock, 
  ShieldAlert, RefreshCw, Car, User, AlertCircle, Compass, Gauge, AlertTriangle, Eye, ArrowRight, XCircle, PhoneCall
} from 'lucide-react';
import { rideService } from '../services/rideService';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { MapView } from '../components/map/MapView';

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
  const [acceptedRides, setAcceptedRides] = useState({});

  // Active tracking state
  const [activeTrackingRide, setActiveTrackingRide] = useState(null);
  const [lastLocation, setLastLocation] = useState(null);
  const [geoStatus, setGeoStatus] = useState('Idle');
  const [viewRouteModalRide, setViewRouteModalRide] = useState(null);

  const watchIdRef = useRef(null);
  const simIntervalRef = useRef(null);
  const simStepRef = useRef(0);

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
        if (!watchIdRef.current && !simIntervalRef.current) {
          startLocationStreaming(active);
        }
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

  useEffect(() => {
    return () => {
      stopLocationStreaming();
    };
  }, []);

  const transmitLocation = async (rideId, payload) => {
    try {
      const response = await rideService.updateLocation(rideId, payload);
      setLastLocation(response);
      setGeoStatus('Live GPS Streaming Active');
    } catch (err) {
      console.warn('Location transmission error:', err);
      setGeoStatus(`Transmission notice: ${err.message}`);
    }
  };

  const startLocationStreaming = (ride) => {
    stopLocationStreaming();
    setGeoStatus('Activating GPS Telemetry...');

    const originLat = ride.pickupLatitude || 9.9252;
    const originLng = ride.pickupLongitude || 78.1198;
    const destLat = ride.destinationLatitude || 9.9485;
    const destLng = ride.destinationLongitude || 78.1565;

    if (navigator.geolocation) {
      const handlePosition = (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        transmitLocation(ride.id, {
          latitude,
          longitude,
          accuracy: accuracy || 5.0,
          speed: speed ? Number((speed * 3.6).toFixed(1)) : 35.0,
          heading: heading || 0.0,
          recordedAt: new Date().toISOString(),
        });
      };

      const handleError = (err) => {
        console.warn('Browser GPS notice:', err.message);
        setGeoStatus(`GPS Notice: ${err.message}. Using simulated telemetry.`);
        startSimulatedTelemetry(ride, originLng, originLat, destLng, destLat);
      };

      navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      });

      watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 4000,
      });
    } else {
      startSimulatedTelemetry(ride, originLng, originLat, destLng, destLat);
    }
  };

  const startSimulatedTelemetry = (ride, originLng, originLat, destLng, destLat) => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    simStepRef.current = 0;

    const totalSteps = 40;
    simIntervalRef.current = setInterval(() => {
      simStepRef.current = (simStepRef.current + 1) % totalSteps;
      const t = simStepRef.current / totalSteps;
      const curLng = originLng + (destLng - originLng) * t;
      const curLat = originLat + (destLat - originLat) * t;

      transmitLocation(ride.id, {
        latitude: curLat,
        longitude: curLng,
        accuracy: 4.5,
        speed: 38.5,
        heading: 45.0,
        recordedAt: new Date().toISOString(),
      });
    }, 4000);
  };

  const stopLocationStreaming = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simIntervalRef.current !== null) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setGeoStatus('Idle');
  };

  const handleAcceptRide = (ride) => {
    setAcceptedRides((prev) => ({ ...prev, [ride.id]: true }));
  };

  const handleDeclineRide = async (ride) => {
    try {
      setActionLoading(ride.id);
      setError(null);
      // Decline removes driver assignment and returns ride to manager pool
      await rideService.cancelRide(ride.id, { cancellationReason: 'Driver declined trip dispatch' });
      fetchAssignedRides();
    } catch (err) {
      setError(err.message || 'Failed to decline trip request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartTrip = async (ride) => {
    try {
      setActionLoading(ride.id);
      setError(null);
      const updated = await rideService.startTrip(ride.id);
      setActiveTrackingRide(updated);
      startLocationStreaming(updated);
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

  const activePickupLoc = activeTrackingRide ? {
    address: activeTrackingRide.pickupLocation,
    coordinates: activeTrackingRide.pickupLongitude && activeTrackingRide.pickupLatitude
      ? [activeTrackingRide.pickupLongitude, activeTrackingRide.pickupLatitude]
      : [78.1198, 9.9252],
  } : null;

  const activeDestLoc = activeTrackingRide ? {
    address: activeTrackingRide.destination,
    coordinates: activeTrackingRide.destinationLongitude && activeTrackingRide.destinationLatitude
      ? [activeTrackingRide.destinationLongitude, activeTrackingRide.destinationLatitude]
      : [78.1565, 9.9485],
  } : null;

  const driverLiveCoords = lastLocation && lastLocation.latitude !== 0 ? {
    coordinates: [lastLocation.longitude, lastLocation.latitude],
    speed: lastLocation.speed,
    heading: lastLocation.heading,
  } : null;

  const pendingOffers = assignedRides.filter(r => r.status === 'ASSIGNED');
  const inProgressRides = assignedRides.filter(r => r.status === 'IN_PROGRESS');
  const completedRides = assignedRides.filter(r => r.status === 'COMPLETED');

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Driver Console</h1>
          <p className="page-subtitle">
            Accept corporate trip dispatches, navigate driving routes with Google Maps, broadcast live telemetry, and complete passenger commutes.
          </p>
        </div>

        <button onClick={fetchAssignedRides} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ACTIVE GPS TRACKING PANEL & MAP */}
      {activeTrackingRide && (
        <div className="glass-card" style={{ marginBottom: '2rem', borderColor: 'var(--accent-teal, #10b981)', background: 'rgba(16, 185, 129, 0.05)', padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Active Trip in Progress &bull; {activeTrackingRide.bookingReference}
              </h2>
            </div>
            <StatusBadge status={activeTrackingRide.status} />
          </div>

          {/* DRIVER MAPVIEW */}
          <div style={{ marginBottom: '1.25rem' }}>
            <MapView
              center={activePickupLoc?.coordinates || [78.1198, 9.9252]}
              zoom={13}
              pickupLocation={activePickupLoc}
              destinationLocation={activeDestLoc}
              driverLocation={driverLiveCoords}
              showControls={false}
              showRouteInfo={true}
              styleOverrides={{ height: '340px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Passenger</span>
              <strong style={{ color: '#fff' }}>{activeTrackingRide.employeeName}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Assigned Vehicle</span>
              <strong style={{ color: 'var(--accent-cyan, #06b6d4)' }}>{activeTrackingRide.vehicleRegistration}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>GPS Status</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>
                {geoStatus}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Telemetry Coordinates</span>
              <strong style={{ color: '#fff' }}>
                {lastLocation ? `${lastLocation.latitude.toFixed(4)}, ${lastLocation.longitude.toFixed(4)}` : 'Syncing...'}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              onClick={() => handleCompleteTrip(activeTrackingRide)}
              className="btn btn-primary"
              style={{ background: '#10b981', borderColor: '#10b981', padding: '0.65rem 1.5rem', fontWeight: 700 }}
              disabled={actionLoading === activeTrackingRide.id}
            >
              <CheckCircle2 size={18} />
              {actionLoading === activeTrackingRide.id ? 'Completing Trip...' : 'Mark Trip Completed'}
            </button>
          </div>
        </div>
      )}

      {/* UBER DRIVER INCOMING DISPATCH CARDS (ASSIGNED RIDES) */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Assigned Trips & Offers
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {pendingOffers.length} pending trip(s)
          </span>
        </div>

        {loading ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>Loading assigned driver trips...</p>
          </div>
        ) : pendingOffers.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <Car size={36} color="var(--text-dim, #71717a)" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              No Pending Ride Offers
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              You will receive a notification here when the Transport Manager assigns a corporate commute to you.
            </p>
          </div>
        ) : (
          <div className="rides-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {pendingOffers.map((ride) => {
              const isAccepted = acceptedRides[ride.id];
              return (
                <div 
                  key={ride.id} 
                  className="ride-card"
                  style={{
                    border: isAccepted ? '1.5px solid #10b981' : '1.5px solid rgba(255, 255, 255, 0.15)',
                    background: isAccepted ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-card, #14171b)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                  }}
                >
                  <div className="ride-card-header" style={{ marginBottom: '0.75rem' }}>
                    <div>
                      <span className="booking-ref">{ride.bookingReference}</span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                        {ride.employeeName}
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Passenger &bull; {ride.department || 'Corporate'}
                      </span>
                    </div>
                    <StatusBadge status={isAccepted ? 'ASSIGNED' : 'ASSIGNED'} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem', margin: '0.85rem 0' }}>
                    <div className="meta-item">
                      <MapPin size={15} color="#10b981" style={{ flexShrink: 0 }} />
                      <span>Pickup: <strong style={{ color: '#fff' }}>{ride.pickupLocation}</strong></span>
                    </div>

                    <div className="meta-item">
                      <MapPin size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                      <span>Destination: <strong style={{ color: '#fff' }}>{ride.destination}</strong></span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: '10px' }}>
                      <div className="meta-item">
                        <Clock size={14} color="#6366f1" />
                        <span>Date: <strong style={{ color: '#fff' }}>{ride.bookingDate}</strong></span>
                      </div>
                      <div className="meta-item">
                        <Clock size={14} color="#f59e0b" />
                        <span>Time: <strong style={{ color: '#10b981' }}>{ride.pickupTime}</strong></span>
                      </div>
                    </div>

                    {ride.vehicleRegistration && (
                      <div className="meta-item" style={{ background: 'rgba(6, 182, 212, 0.08)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                        <Car size={15} color="#06b6d4" />
                        <span>Vehicle: <strong style={{ color: 'var(--accent-cyan)' }}>{ride.vehicleRegistration}</strong> ({ride.vehicleMakeModel || 'Fleet Sedan'})</span>
                      </div>
                    )}
                  </div>

                  {/* UBER DRIVER ACTION BUTTONS (ACCEPT / DECLINE / START) */}
                  <div style={{ display: 'flex', gap: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setViewRouteModalRide(ride)}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                    >
                      <Eye size={14} />
                      Route
                    </button>

                    {!isAccepted ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDeclineRide(ride)}
                          className="btn btn-secondary"
                          style={{ flex: 1, color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                          disabled={actionLoading === ride.id}
                        >
                          <XCircle size={15} />
                          Decline
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAcceptRide(ride)}
                          className="btn btn-primary"
                          style={{ flex: 1.5, background: '#10b981', borderColor: '#10b981', padding: '0.5rem 0.75rem', fontSize: '0.85rem', fontWeight: 700 }}
                        >
                          <CheckCircle2 size={15} />
                          Accept Ride
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartTrip(ride)}
                        className="btn btn-primary"
                        style={{ flex: 2, padding: '0.55rem 1rem', fontSize: '0.88rem', fontWeight: 700 }}
                        disabled={actionLoading === ride.id}
                      >
                        <Play size={15} />
                        {actionLoading === ride.id ? 'Starting GPS Navigation...' : 'Start Trip & Navigate'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COMPLETED TRIPS ROSTER */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>
          Completed Trips History
        </h2>

        {completedRides.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              No completed trips recorded for this session yet.
            </p>
          </div>
        ) : (
          <div className="rides-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {completedRides.map((ride) => (
              <div key={ride.id} className="ride-card" style={{ opacity: 0.85 }}>
                <div className="ride-card-header">
                  <div>
                    <span className="booking-ref">{ride.bookingReference}</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{ride.employeeName}</h3>
                  </div>
                  <StatusBadge status="COMPLETED" />
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  <div>From: <strong style={{ color: '#fff' }}>{ride.pickupLocation}</strong></div>
                  <div>To: <strong style={{ color: '#fff' }}>{ride.destination}</strong></div>
                  <div style={{ marginTop: '0.3rem', color: '#10b981' }}>Completed on {ride.bookingDate}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIEW ROUTE MODAL */}
      {viewRouteModalRide && (
        <div className="modal-overlay" onClick={() => setViewRouteModalRide(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Planned Driving Route</h2>
                <span className="booking-ref" style={{ fontSize: '0.85rem' }}>
                  {viewRouteModalRide.bookingReference} &bull; Passenger: {viewRouteModalRide.employeeName}
                </span>
              </div>
              <button onClick={() => setViewRouteModalRide(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <MapView
                center={viewRouteModalRide.pickupLongitude ? [viewRouteModalRide.pickupLongitude, viewRouteModalRide.pickupLatitude] : [78.1198, 9.9252]}
                zoom={13}
                pickupLocation={{
                  address: viewRouteModalRide.pickupLocation,
                  coordinates: viewRouteModalRide.pickupLongitude ? [viewRouteModalRide.pickupLongitude, viewRouteModalRide.pickupLatitude] : [78.1198, 9.9252],
                }}
                destinationLocation={{
                  address: viewRouteModalRide.destination,
                  coordinates: viewRouteModalRide.destinationLongitude ? [viewRouteModalRide.destinationLongitude, viewRouteModalRide.destinationLatitude] : [78.1565, 9.9485],
                }}
                showControls={false}
                showRouteInfo={true}
                styleOverrides={{ height: '350px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={() => {
                  const r = viewRouteModalRide;
                  setViewRouteModalRide(null);
                  handleAcceptRide(r);
                }}
                className="btn btn-primary"
                style={{ background: '#10b981', borderColor: '#10b981' }}
              >
                <CheckCircle2 size={15} />
                Accept & Prepare Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverTripPage;
