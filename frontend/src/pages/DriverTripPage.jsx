import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, CheckCircle2, Navigation, MapPin, Clock, 
  ShieldAlert, RefreshCw, Car, User, AlertCircle, Compass, Gauge, AlertTriangle, Eye, ArrowRight, XCircle, PhoneCall, X, Phone
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
    }, 3000);
  };

  const stopLocationStreaming = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setGeoStatus('Inactive');
  };

  const handleAcceptRide = (ride) => {
    setAcceptedRides(prev => ({ ...prev, [ride.id]: true }));
  };

  const handleDeclineRide = (ride) => {
    setAssignedRides(prev => prev.filter(r => r.id !== ride.id));
  };

  const handleStartTrip = async (ride) => {
    try {
      setActionLoading(ride.id);
      setError(null);
      const updated = await rideService.startTrip(ride.id);

      setActiveTrackingRide(updated || ride);
      startLocationStreaming(updated || ride);
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

      const finalLat = ride.destinationLatitude || 9.9485;
      const finalLng = ride.destinationLongitude || 78.1565;

      await rideService.completeTrip(ride.id, {
        finalLatitude: finalLat,
        finalLongitude: finalLng,
      });

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
      <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '20px', textAlign: 'center', padding: '3rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2920', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p style={{ color: '#64748b' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Navigation size={28} color="#059669" />
            <span>Driver Console</span>
          </h1>
          <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Accept corporate trip dispatches, navigate driving routes with Google Maps, broadcast live telemetry, and complete passenger commutes.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAssignedRides}
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
          <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444', padding: '1rem 1.25rem', borderRadius: '12px', fontWeight: 700 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ACTIVE GPS TRACKING PANEL & MAP */}
      {activeTrackingRide && (
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #a7f3d0',
            borderLeft: '5px solid #059669',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#059669', boxShadow: '0 0 12px #059669' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>
                Active Trip in Progress • {activeTrackingRide.bookingReference}
              </h2>
            </div>
            <StatusBadge status={activeTrackingRide.status} />
          </div>

          {/* DRIVER MAPVIEW */}
          <div style={{ marginBottom: '1.25rem', borderRadius: '14px', overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#f8faf9', border: '1.5px solid #e2e8f0', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Passenger</span>
              <strong style={{ color: '#0f2920' }}>{activeTrackingRide.employeeName}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Assigned Vehicle</span>
              <strong style={{ color: '#2563eb' }}>{activeTrackingRide.vehicleRegistration}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>GPS Status</span>
              <span style={{ color: '#059669', fontWeight: 800 }}>
                {geoStatus}
              </span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Telemetry Coordinates</span>
              <strong style={{ color: '#0f2920' }}>
                {lastLocation ? `${lastLocation.latitude.toFixed(4)}, ${lastLocation.longitude.toFixed(4)}` : 'Syncing...'}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => handleCompleteTrip(activeTrackingRide)}
              style={{
                background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.5rem',
                fontWeight: 800,
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 15px rgba(19, 56, 44, 0.25)',
              }}
              disabled={actionLoading === activeTrackingRide.id}
            >
              <CheckCircle2 size={18} />
              <span>{actionLoading === activeTrackingRide.id ? 'Completing Trip...' : 'Mark Trip Completed'}</span>
            </button>
          </div>
        </div>
      )}

      {/* UBER DRIVER INCOMING DISPATCH CARDS (ASSIGNED RIDES) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>
            Assigned Trips & Offers
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>
            {pendingOffers.length} pending trip(s)
          </span>
        </div>

        {loading ? (
          <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 0.75rem', color: '#059669' }} />
            <p style={{ color: '#64748b', fontWeight: 600 }}>Loading assigned driver trips...</p>
          </div>
        ) : pendingOffers.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '3.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <Car size={36} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ color: '#0f2920', fontSize: '1.1rem', fontWeight: 900, marginBottom: '0.25rem' }}>
              No Pending Ride Offers
            </p>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
              You will receive a notification here when the Transport Manager assigns a corporate commute to you.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {pendingOffers.map((ride) => {
              const isAccepted = acceptedRides[ride.id];
              return (
                <div 
                  key={ride.id} 
                  style={{
                    border: isAccepted ? '1.5px solid #059669' : '1.5px solid #e2e8f0',
                    background: isAccepted ? '#f0fdf4' : '#ffffff',
                    borderRadius: '18px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#2563eb', letterSpacing: '0.5px' }}>{ride.bookingReference}</span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f2920', margin: '0.2rem 0 0 0' }}>
                        {ride.employeeName}
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                        Passenger • {ride.department || 'Corporate'}
                      </span>
                    </div>
                    <StatusBadge status="ASSIGNED" />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={15} color="#059669" style={{ flexShrink: 0 }} />
                      <span style={{ color: '#64748b' }}>Pickup: <strong style={{ color: '#0f2920' }}>{ride.pickupLocation}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                      <span style={{ color: '#64748b' }}>Destination: <strong style={{ color: '#0f2920' }}>{ride.destination}</strong></span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: '#64748b', background: '#f8faf9', border: '1.5px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} color="#2563eb" />
                        <span>Date: <strong style={{ color: '#0f2920' }}>{ride.bookingDate}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} color="#d97706" />
                        <span>Time: <strong style={{ color: '#059669' }}>{ride.pickupTime}</strong></span>
                      </div>
                    </div>

                    {ride.vehicleRegistration && (
                      <div style={{ background: '#f8faf9', border: '1.5px solid #e2e8f0', padding: '0.55rem 0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                        <Car size={15} color="#2563eb" />
                        <span style={{ color: '#64748b' }}>Vehicle: <strong style={{ color: '#2563eb' }}>{ride.vehicleRegistration}</strong> ({ride.vehicleMakeModel || 'Fleet Sedan'})</span>
                      </div>
                    )}

                    {ride.employeePhone && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.55rem 0.75rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                        <span style={{ color: '#166534', fontWeight: 700 }}>Passenger Phone: {ride.employeePhone}</span>
                        <a
                          href={`tel:${ride.employeePhone}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.25rem 0.6rem',
                            background: '#16a34a',
                            color: '#ffffff',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          <Phone size={12} />
                          <span>Call Passenger</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* UBER DRIVER ACTION BUTTONS (ACCEPT / DECLINE / START) */}
                  <div style={{ display: 'flex', gap: '0.6rem', borderTop: '1.5px solid #f1f5f9', paddingTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => setViewRouteModalRide(ride)}
                      style={{
                        padding: '0.5rem 0.85rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        color: '#0f2920',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Eye size={14} />
                      <span>Route</span>
                    </button>

                    {!isAccepted ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDeclineRide(ride)}
                          style={{
                            flex: 1,
                            color: '#ef4444',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                          }}
                          disabled={actionLoading === ride.id}
                        >
                          <XCircle size={15} />
                          <span>Decline</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAcceptRide(ride)}
                          style={{
                            flex: 1.5,
                            background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            boxShadow: '0 2px 10px rgba(19, 56, 44, 0.2)',
                          }}
                        >
                          <CheckCircle2 size={15} />
                          <span>Accept Ride</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartTrip(ride)}
                        style={{
                          flex: 2,
                          padding: '0.55rem 1rem',
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 4px 15px rgba(19, 56, 44, 0.25)',
                        }}
                        disabled={actionLoading === ride.id}
                      >
                        <Play size={15} />
                        <span>{actionLoading === ride.id ? 'Starting GPS Navigation...' : 'Start Trip & Navigate'}</span>
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
        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f2920', marginBottom: '1rem' }}>
          Completed Trips History
        </h2>

        {completedRides.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '3rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0, fontWeight: 600 }}>
              No completed trips recorded for this session yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {completedRides.map((ride) => (
              <div
                key={ride.id}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '1.25rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#2563eb', letterSpacing: '0.5px' }}>{ride.bookingReference}</span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f2920', margin: '0.15rem 0 0 0' }}>{ride.employeeName}</h3>
                  </div>
                  <StatusBadge status="COMPLETED" />
                </div>
                <div style={{ fontSize: '0.825rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div>From: <strong style={{ color: '#0f2920' }}>{ride.pickupLocation}</strong></div>
                  <div>To: <strong style={{ color: '#0f2920' }}>{ride.destination}</strong></div>
                  <div style={{ marginTop: '0.3rem', color: '#059669', fontWeight: 700 }}>Completed on {ride.bookingDate}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIEW ROUTE MODAL */}
      {viewRouteModalRide && (
        <div className="modal-overlay" onClick={() => setViewRouteModalRide(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '780px',
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
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>Planned Driving Route</h2>
                <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700 }}>
                  {viewRouteModalRide.bookingReference} • Passenger: {viewRouteModalRide.employeeName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewRouteModalRide(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem', borderRadius: '14px', overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
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
                style={{
                  background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 15px rgba(19, 56, 44, 0.25)',
                }}
              >
                <CheckCircle2 size={16} />
                <span>Accept & Prepare Route</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverTripPage;
