import React, { useState, useEffect } from 'react';
import {
  Radio,
  MapPin,
  Clock,
  Car,
  User,
  ShieldCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  Navigation,
  Compass,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { rideService } from '../../services/rideService';
import { MapView } from '../../components/map/MapView';
import { UnifiedRideDetailsModal } from '../../components/manager/UnifiedRideDetailsModal';

export const ManagerLiveTripsPage = () => {
  const [activeTrips, setActiveTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [locationsMap, setLocationsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchLiveFleet = async () => {
    try {
      const trips = await rideService.getActiveTrips().catch(() => []);
      setActiveTrips(trips || []);

      // If no trip is selected or selected trip is no longer active, select first active trip
      if (trips && trips.length > 0) {
        setSelectedTrip((prev) => {
          if (!prev) return trips[0];
          const exists = trips.find((t) => t.id === prev.id);
          return exists || trips[0];
        });
      } else {
        setSelectedTrip(null);
      }

      // Fetch location telemetry for each trip
      const newLocs = {};
      for (const trip of trips || []) {
        try {
          const loc = await rideService.getLatestLocation(trip.id);
          if (loc) newLocs[trip.id] = loc;
        } catch {
          // ignore telemetry fetch error
        }
      }
      setLocationsMap(newLocs);
    } catch (err) {
      console.error('Failed to load active fleet:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveFleet();
    const interval = setInterval(fetchLiveFleet, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLiveFleet();
  };

  const filteredTrips = activeTrips.filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      t.bookingReference?.toLowerCase().includes(q) ||
      t.employeeName?.toLowerCase().includes(q) ||
      t.driverName?.toLowerCase().includes(q) ||
      t.vehicleRegistration?.toLowerCase().includes(q) ||
      t.pickupLocation?.toLowerCase().includes(q) ||
      t.destination?.toLowerCase().includes(q)
    );
  });

  const selectedTelemetry = selectedTrip ? locationsMap[selectedTrip.id] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#0f2920' }}>
              Live Trip Monitoring Radar
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
                fontSize: '0.75rem',
                fontWeight: 800,
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              <span>{activeTrips.length} Active Vehicles In Transit</span>
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
            Real-time GPS positioning, live route monitoring, passenger verification, and telemetry tracking.
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.6rem 1.1rem',
            borderRadius: '10px',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            color: '#0f2920',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: refreshing ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'spin-animation' : ''} />
          <span>{refreshing ? 'Updating GPS...' : 'Sync GPS Telemetry'}</span>
        </button>
      </div>

      {/* Main Split Interface */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: '1.25rem',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Left Side: Active Trips Feed */}
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Feed Search Bar */}
          <div style={{ padding: '1rem', borderBottom: '1.5px solid #e2e8f0' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search active trip..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.65rem 0.5rem 2.2rem',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  color: '#0f172a',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Active Trips Scrollable List */}
          <div style={{ flex: 1, padding: '0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
                Locating active trips...
              </div>
            ) : filteredTrips.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b', fontSize: '0.85rem' }}>
                <Car size={32} color="#64748b" style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 800, color: '#0f2920' }}>No Active Trips Found</div>
                <div style={{ fontSize: '0.775rem', marginTop: '4px' }}>
                  Vehicles will appear here once drivers start their rides.
                </div>
              </div>
            ) : (
              filteredTrips.map((trip) => {
                const isSelected = selectedTrip?.id === trip.id;
                const telemetry = locationsMap[trip.id];
                const isVerified = Boolean(trip.employeeVerifiedAt || trip.isEmployeeVerified);

                return (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      background: isSelected ? '#ecfdf5' : '#f8faf9',
                      border: `1.5px solid ${isSelected ? '#10b981' : '#e2e8f0'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f2920' }}>
                        Ride #{trip.bookingReference}
                      </span>
                      <span
                        style={{
                          fontSize: '0.675rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          background: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0',
                        }}
                      >
                        {trip.status}
                      </span>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f2920' }}>
                      {trip.employeeName || 'Corporate Employee'}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Driver: <strong style={{ color: '#0f2920' }}>{trip.driverName || 'Driver'}</strong> &bull;{' '}
                      Plate: <strong style={{ color: '#2563eb' }}>{trip.vehicleRegistration || 'Vehicle'}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', color: isVerified ? '#059669' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}>
                        <ShieldCheck size={13} /> {isVerified ? 'Passenger Verified' : 'Unverified'}
                      </span>
                      {telemetry?.speed != null && (
                        <span style={{ fontSize: '0.7rem', color: '#059669', fontFamily: 'monospace', fontWeight: 800 }}>
                          {Math.round(telemetry.speed)} km/h
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Map & Telemetry Dashboard */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            overflow: 'hidden',
          }}
        >
          {/* Top Telemetry Header for Selected Trip */}
          {selectedTrip && (
            <div
              style={{
                padding: '0.85rem 1.25rem',
                borderRadius: '16px',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Navigation size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: '#0f2920', fontSize: '0.95rem' }}>
                    Ride #{selectedTrip.bookingReference} &bull; {selectedTrip.employeeName}
                  </div>
                  <div style={{ fontSize: '0.775rem', color: '#64748b' }}>
                    Driver: <strong style={{ color: '#0f2920' }}>{selectedTrip.driverName}</strong> ({selectedTrip.driverLicenseNumber || 'DL-VALID'}) &bull;{' '}
                    Vehicle: <strong style={{ color: '#2563eb' }}>{selectedTrip.vehicleMakeModel || 'Toyota Innova'}</strong> ({selectedTrip.vehicleRegistration})
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(true)}
                  style={{
                    padding: '0.55rem 0.95rem',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    color: '#0f2920',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View Details Modal
                </button>
              </div>
            </div>
          )}

          {/* Interactive Map View */}
          <div
            style={{
              flex: 1,
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1.5px solid #e2e8f0',
              position: 'relative',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            }}
          >
            {selectedTrip ? (
              <MapView
                pickupCoords={
                  selectedTrip.pickupLongitude && selectedTrip.pickupLatitude
                    ? [selectedTrip.pickupLongitude, selectedTrip.pickupLatitude]
                    : [80.2707, 13.0827]
                }
                destCoords={
                  selectedTrip.destinationLongitude && selectedTrip.destinationLatitude
                    ? [selectedTrip.destinationLongitude, selectedTrip.destinationLatitude]
                    : [80.2000, 13.0100]
                }
                pickupAddress={selectedTrip.pickupLocation}
                destAddress={selectedTrip.destination}
                selectionMode="VIEW_ONLY"
              />
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  color: '#64748b',
                  background: '#f8faf9',
                }}
              >
                <Radio size={36} color="#64748b" />
                <div style={{ fontWeight: 800, color: '#0f2920' }}>No Active Fleet Radar Selected</div>
                <div style={{ fontSize: '0.85rem' }}>Select a trip from the left panel to begin live tracking.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unified Details Modal */}
      <UnifiedRideDetailsModal
        isOpen={isDetailsModalOpen}
        ride={selectedTrip}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </div>
  );
};
export default ManagerLiveTripsPage;
