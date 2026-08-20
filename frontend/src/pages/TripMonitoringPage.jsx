import React, { useState, useEffect } from 'react';
import { 
  Activity, MapPin, Clock, Car, User, ShieldAlert, 
  RefreshCw, CheckCircle2, AlertTriangle, Search, Eye, Filter, Compass, X 
} from 'lucide-react';
import { rideService } from '../services/rideService';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { MapView } from '../components/map/MapView';

export const TripMonitoringPage = () => {
  const { currentUser } = useAuth();
  const isManager = currentUser?.role === 'TRANSPORT_MANAGER' || 
                    currentUser?.role === 'CORPORATE_ADMIN' || 
                    currentUser?.role === 'SYSTEM_ADMIN';

  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [staleMap, setStaleMap] = useState({});
  const [locationsMap, setLocationsMap] = useState({});
  const [selectedRideModal, setSelectedRideModal] = useState(null);

  const fetchActiveTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rideService.getActiveTrips();
      setActiveTrips(data || []);

      // Fetch latest location telemetry for each active trip
      const newLocs = {};
      const newStale = {};

      for (const ride of (data || [])) {
        try {
          const loc = await rideService.getLatestLocation(ride.id);
          if (loc) {
            newLocs[ride.id] = loc;
            newStale[ride.id] = loc.isStale;
          }
        } catch (e) {
          console.warn(`Location fetch error for ride ${ride.id}:`, e);
        }
      }

      setLocationsMap(newLocs);
      setStaleMap(newStale);
    } catch (err) {
      setError(err.message || 'Failed to load active fleet trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManager) {
      fetchActiveTrips();
      // Auto refresh telemetry every 10s
      const interval = setInterval(fetchActiveTrips, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const filteredTrips = activeTrips.filter(ride => {
    const q = search.toLowerCase();
    return ride.bookingReference.toLowerCase().includes(q) ||
           ride.employeeName.toLowerCase().includes(q) ||
           (ride.driverName && ride.driverName.toLowerCase().includes(q)) ||
           (ride.vehicleRegistration && ride.vehicleRegistration.toLowerCase().includes(q));
  });

  const inProgressCount = activeTrips.filter(r => r.status === 'IN_PROGRESS').length;
  const assignedCount = activeTrips.filter(r => r.status === 'ASSIGNED').length;
  const staleCount = Object.values(staleMap).filter(Boolean).length;

  if (!isManager) {
    return (
      <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '20px', textAlign: 'center', padding: '3rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2920', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p style={{ color: '#64748b' }}>
          Real-Time Trip Monitoring is reserved for Transport Managers and Corporate Administrators.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Activity size={28} color="#059669" />
            <span>Real-Time Trip & Fleet Monitor</span>
          </h1>
          <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Live telemetry monitoring for active organization rides, driver location updates, and tracking delay detection.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchActiveTrips}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(19, 56, 44, 0.25)',
          }}
        >
          <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
          <span>Auto-Sync Active</span>
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444', padding: '1rem 1.25rem', borderRadius: '12px', fontWeight: 700 }}>
          ⚠️ {error}
        </div>
      )}

      {/* MONITORING METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <div style={{ background: '#ffffff', border: '1.5px solid #a7f3d0', borderLeft: '4px solid #059669', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>In-Progress Trips</span>
            <Activity size={20} color="#059669" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', marginTop: '0.35rem' }}>
            {inProgressCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #bfdbfe', borderLeft: '4px solid #2563eb', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#2563eb', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Assigned / Ready</span>
            <Car size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f2920', marginTop: '0.35rem' }}>
            {assignedCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: `1.5px solid ${staleCount > 0 ? '#fde68a' : '#e2e8f0'}`, borderLeft: staleCount > 0 ? '4px solid #d97706' : '1.5px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: staleCount > 0 ? '#d97706' : '#64748b', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Delayed / Stale GPS</span>
            <AlertTriangle size={20} color={staleCount > 0 ? '#d97706' : '#9ca3af'} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: staleCount > 0 ? '#d97706' : '#059669', marginTop: '0.35rem' }}>
            {staleCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Active Fleet Pool</span>
            <Compass size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f2920', marginTop: '0.35rem' }}>
            {activeTrips.length}
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div
        style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1.1rem 1.25rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search active trips by reference, employee, driver, or vehicle registration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              fontSize: '0.875rem',
              fontWeight: 600,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* ACTIVE TRIPS TABLE / GRID */}
      {loading ? (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 0.75rem', color: '#059669' }} />
          <p style={{ color: '#64748b', fontWeight: 600 }}>Syncing active trip telemetry...</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <CheckCircle2 size={40} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ color: '#0f2920', fontSize: '1.1rem', fontWeight: 900, marginBottom: '0.3rem' }}>
            No Active Trips Monitored
          </p>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            There are currently no active in-progress or assigned trips matching your search.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.25rem' }}>
          {filteredTrips.map((ride) => {
            const loc = locationsMap[ride.id];
            const isStale = staleMap[ride.id];

            return (
              <div
                key={ride.id}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderLeft: ride.status === 'IN_PROGRESS' ? '5px solid #059669' : '5px solid #2563eb',
                  borderRadius: '18px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#2563eb', letterSpacing: '0.5px' }}>{ride.bookingReference}</span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f2920', margin: '0.2rem 0 0 0' }}>
                      {ride.employeeName}
                    </h3>
                  </div>
                  <StatusBadge status={ride.status} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={14} color="#059669" />
                    <span style={{ color: '#64748b' }}>Pickup: <strong style={{ color: '#0f2920' }}>{ride.pickupLocation}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={14} color="#ef4444" />
                    <span style={{ color: '#64748b' }}>Destination: <strong style={{ color: '#0f2920' }}>{ride.destination}</strong></span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f8faf9', border: '1.5px solid #e2e8f0', padding: '0.75rem', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <User size={14} color="#2563eb" />
                      <span style={{ color: '#64748b' }}>Driver: <strong style={{ color: '#0f2920' }}>{ride.driverName || 'Unassigned'}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Car size={14} color="#059669" />
                      <span style={{ color: '#64748b' }}>Cab: <strong style={{ color: '#2563eb' }}>{ride.vehicleRegistration || 'Unassigned'}</strong></span>
                    </div>
                  </div>

                  {/* TELEMETRY CARD */}
                  <div style={{ background: isStale ? '#fffbeb' : '#ecfdf5', border: `1.5px solid ${isStale ? '#fde68a' : '#a7f3d0'}`, padding: '0.75rem', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Live GPS Telemetry</span>
                      {isStale ? (
                        <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertTriangle size={12} /> Location Update Delayed (&gt;60s)
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Activity size={12} /> Live Sync Active
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.84rem' }}>
                      <div>Coordinates: <strong style={{ color: '#0f2920' }}>{loc && loc.latitude !== 0 ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}` : 'Awaiting GPS stream'}</strong></div>
                      {loc?.speed != null && <div>Speed: <strong style={{ color: '#2563eb' }}>{loc.speed.toFixed(1)} km/h</strong></div>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1.5px solid #f1f5f9', paddingTop: '0.85rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedRideModal(ride)}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      color: '#0f2920',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <Eye size={14} />
                    <span>Inspect Details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INSPECT DETAILS MODAL */}
      {selectedRideModal && (
        <div className="modal-overlay" onClick={() => setSelectedRideModal(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '680px',
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
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>{selectedRideModal.bookingReference}</h2>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  Passenger: {selectedRideModal.employeeName} ({selectedRideModal.employeeEmail})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRideModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Status:</span>
                <StatusBadge status={selectedRideModal.status} />
              </div>

              {/* LIVE MAPVIEW FOR MONITORING */}
              <div style={{ marginBottom: '0.5rem', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
                <MapView
                  center={selectedRideModal.pickupLongitude ? [selectedRideModal.pickupLongitude, selectedRideModal.pickupLatitude] : [80.2707, 13.0827]}
                  zoom={12}
                  pickupLocation={{
                    address: selectedRideModal.pickupLocation,
                    coordinates: selectedRideModal.pickupLongitude ? [selectedRideModal.pickupLongitude, selectedRideModal.pickupLatitude] : [80.2707, 13.0827],
                  }}
                  destinationLocation={{
                    address: selectedRideModal.destination,
                    coordinates: selectedRideModal.destinationLongitude ? [selectedRideModal.destinationLongitude, selectedRideModal.destinationLatitude] : [80.1709, 12.9941],
                  }}
                  driverLocation={
                    locationsMap[selectedRideModal.id] && locationsMap[selectedRideModal.id].latitude !== 0
                      ? {
                          coordinates: [locationsMap[selectedRideModal.id].longitude, locationsMap[selectedRideModal.id].latitude],
                          speed: locationsMap[selectedRideModal.id].speed,
                          heading: locationsMap[selectedRideModal.id].heading,
                          isStale: staleMap[selectedRideModal.id],
                        }
                      : null
                  }
                  showControls={false}
                  showRouteInfo={true}
                  styleOverrides={{ height: '320px' }}
                />
              </div>

              <div style={{ background: '#f8faf9', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Route Details</span>
                  <strong style={{ color: '#0f2920' }}>{selectedRideModal.pickupLocation}</strong> → <strong style={{ color: '#0f2920' }}>{selectedRideModal.destination}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Assigned Driver</span>
                  <strong style={{ color: '#0f2920' }}>{selectedRideModal.driverName || 'Unassigned'}</strong> ({selectedRideModal.driverPhone || 'N/A'})
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Assigned Vehicle</span>
                  <strong style={{ color: '#2563eb' }}>{selectedRideModal.vehicleRegistration || 'Unassigned'}</strong> — {selectedRideModal.vehicleMakeModel}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripMonitoringPage;
