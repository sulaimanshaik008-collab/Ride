import React, { useState, useEffect } from 'react';
import { 
  Activity, MapPin, Clock, Car, User, ShieldAlert, 
  RefreshCw, CheckCircle2, AlertTriangle, Search, Eye, Filter, Compass 
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
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Real-Time Trip Monitoring is reserved for Transport Managers and Corporate Administrators.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Real-Time Trip & Fleet Monitor</h1>
          <p className="page-subtitle">
            Live telemetry monitoring for active organization rides, driver location updates, and tracking delay detection.
          </p>
        </div>

        <button onClick={fetchActiveTrips} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={16} />
          Auto-Sync Active
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* MONITORING METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>In-Progress Trips</span>
            <Activity size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '0.5rem' }}>
            {inProgressCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Assigned / Ready</span>
            <Car size={20} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginTop: '0.5rem' }}>
            {assignedCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Delayed / Stale GPS</span>
            <AlertTriangle size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: staleCount > 0 ? '#fbbf24' : '#10b981', marginTop: '0.5rem' }}>
            {staleCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Active Fleet Pool</span>
            <Compass size={20} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.5rem' }}>
            {activeTrips.length}
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search active trips by reference, employee, driver, or vehicle registration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>
      </div>

      {/* ACTIVE TRIPS TABLE / GRID */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Syncing active trip telemetry from Supabase...</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem' }}>
            No Active Trips Monitored
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            There are currently no active in-progress or assigned trips matching your search.
          </p>
        </div>
      ) : (
        <div className="rides-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {filteredTrips.map((ride) => {
            const loc = locationsMap[ride.id];
            const isStale = staleMap[ride.id];

            return (
              <div key={ride.id} className="ride-card" style={{ borderLeft: ride.status === 'IN_PROGRESS' ? '4px solid #10b981' : '4px solid #6366f1' }}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                    <div className="meta-item">
                      <User size={14} color="#6366f1" />
                      <span>Driver: <strong style={{ color: '#fff' }}>{ride.driverName || 'Unassigned'}</strong></span>
                    </div>
                    <div className="meta-item">
                      <Car size={14} color="#06b6d4" />
                      <span>Vehicle: <strong style={{ color: 'var(--accent-cyan)' }}>{ride.vehicleRegistration || 'Unassigned'}</strong></span>
                    </div>
                  </div>

                  {/* TELEMETRY CARD */}
                  <div style={{ background: isStale ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)', border: `1px solid ${isStale ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`, padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Live GPS Telemetry</span>
                      {isStale ? (
                        <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertTriangle size={12} /> Location Update Delayed (&gt;60s)
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Activity size={12} /> Live Sync Active
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.84rem' }}>
                      <div>Coordinates: <strong style={{ color: '#fff' }}>{loc && loc.latitude !== 0 ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}` : 'Awaiting GPS stream'}</strong></div>
                      {loc?.speed != null && <div>Speed: <strong style={{ color: 'var(--accent-cyan)' }}>{loc.speed.toFixed(1)} km/h</strong></div>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem' }}>
                  <button onClick={() => setSelectedRideModal(ride)} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}>
                    <Eye size={14} />
                    Inspect Details
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
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{selectedRideModal.bookingReference}</h2>
                <span className="booking-ref" style={{ fontSize: '0.85rem' }}>
                  Passenger: {selectedRideModal.employeeName} ({selectedRideModal.employeeEmail})
                </span>
              </div>
              <button onClick={() => setSelectedRideModal(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <StatusBadge status={selectedRideModal.status} />
              </div>

              {/* LIVE MAPVIEW FOR MONITORING */}
              <div style={{ marginBottom: '0.5rem' }}>
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

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Route Details</span>
                  <strong style={{ color: '#fff' }}>{selectedRideModal.pickupLocation}</strong> $\rightarrow$ <strong style={{ color: '#fff' }}>{selectedRideModal.destination}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Assigned Driver</span>
                  <strong style={{ color: '#fff' }}>{selectedRideModal.driverName || 'Unassigned'}</strong> ({selectedRideModal.driverPhone || 'N/A'})
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Assigned Vehicle</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>{selectedRideModal.vehicleRegistration || 'Unassigned'}</strong> — {selectedRideModal.vehicleMakeModel}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
