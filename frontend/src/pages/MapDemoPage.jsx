import React, { useState } from 'react';
import { MapView } from '../components/map/MapView';
import { LocationSearchInput } from '../components/map/LocationSearchInput';
import { Navigation, Layers, CheckCircle2, Route } from 'lucide-react';

export default function MapDemoPage() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pickup, setPickup] = useState({
    address: 'Acme Global HQ - Tower A Gate 2',
    coordinates: [80.2707, 13.0827],
  });
  const [destination, setDestination] = useState({
    address: 'International Airport Terminal 2',
    coordinates: [80.1709, 12.9941],
  });
  const [selectionMode, setSelectionMode] = useState('PICKUP');
  const [routeInfo, setRouteInfo] = useState(null);

  const rawKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isConfigured = Boolean(
    rawKey &&
    rawKey.trim() !== '' &&
    rawKey !== 'YOUR_GOOGLE_MAPS_API_KEY'
  );

  return (
    <div className="page-container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-teal, #10b981)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.6rem' }}>
            <Navigation size={13} />
            <span>Interactive Map & Driving Directions Demo</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.4rem', color: 'var(--text-main, #ffffff)', letterSpacing: '-0.02em' }}>
            Google Maps Integration
          </h1>
          <p style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '0.95rem', margin: 0 }}>
            Interactive pickup & destination selection, draggable markers, Places autocomplete, and driving routes.
          </p>
        </div>

        {/* Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'var(--bg-card, #121418)',
            border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.12))',
            padding: '0.6rem 1.1rem',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isConfigured ? '#10b981' : '#f59e0b',
              boxShadow: isConfigured ? '0 0 10px #10b981' : '0 0 10px #f59e0b',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim, #71717a)', fontWeight: 600, textTransform: 'uppercase' }}>
              Map Status
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main, #ffffff)' }}>
              {isConfigured ? 'Connected' : 'Preview Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Search Bar & Location Inputs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          background: 'var(--bg-card, #121418)',
          border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.12))',
          padding: '1.25rem',
          borderRadius: '16px',
          marginBottom: '1.5rem',
        }}
      >
        <LocationSearchInput
          id="demo-pickup"
          label="Pickup Location (Search or Map Click)"
          placeholder="Search pickup place..."
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
        />

        <LocationSearchInput
          id="demo-destination"
          label="Destination Location (Search or Map Click)"
          placeholder="Search destination place..."
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
        />
      </div>

      {/* Google Maps Component */}
      <div style={{ marginBottom: '1.75rem' }}>
        <MapView
          center={[80.2707, 13.0827]}
          zoom={11}
          pickupLocation={pickup.coordinates ? pickup : null}
          destinationLocation={destination.coordinates ? destination : null}
          selectionMode={selectionMode}
          onPickupSelect={(loc) => setPickup({ address: loc?.address || '', coordinates: loc?.coordinates || null })}
          onDestinationSelect={(loc) => setDestination({ address: loc?.address || '', coordinates: loc?.coordinates || null })}
          onRouteUpdate={setRouteInfo}
          onClearAll={() => {
            setPickup({ address: '', coordinates: null });
            setDestination({ address: '', coordinates: null });
            setRouteInfo(null);
          }}
          onMapLoad={() => setMapLoaded(true)}
          styleOverrides={{ height: '480px' }}
        />
      </div>

      {/* Status & Info Footer Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
        }}
      >
        <div
          style={{
            background: 'var(--bg-card, #121418)',
            border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.1))',
            padding: '1.25rem',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              flexShrink: 0,
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim, #71717a)', fontWeight: 600 }}>Provider</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #ffffff)' }}>Google Maps JavaScript API</div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card, #121418)',
            border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.1))',
            padding: '1.25rem',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim, #71717a)', fontWeight: 600 }}>Map Status</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #ffffff)' }}>
              {isConfigured ? 'Connected' : 'Operating in Preview'}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card, #121418)',
            border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.1))',
            padding: '1.25rem',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a855f7',
              flexShrink: 0,
            }}
          >
            <Route size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim, #71717a)', fontWeight: 600 }}>Driving Directions</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #ffffff)' }}>
              {routeInfo ? `${routeInfo.distanceText} • ${routeInfo.durationText}` : 'Ready for routing'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
