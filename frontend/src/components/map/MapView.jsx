import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import {
  AlertTriangle,
  MapPin,
  Navigation,
  RotateCcw,
  Clock,
  ArrowRight,
  Loader2,
  Check,
  ChevronRight
} from 'lucide-react';
import { googleMapsService } from '../../services/googleMapsService';

/**
 * Custom Directions Renderer Component with Solid Black Driving Route Line
 */
const DirectionsRenderer = ({
  pickupCoords,
  destCoords,
  onRouteCalculated,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  useEffect(() => {
    if (!routesLib || !map) return;
    const renderer = new routesLib.DirectionsRenderer({
      map,
      suppressMarkers: true,
      preserveViewport: false,
      polylineOptions: {
        strokeColor: '#000000',
        strokeWeight: 6,
        strokeOpacity: 0.95,
      },
    });
    setDirectionsRenderer(renderer);

    return () => {
      renderer.setMap(null);
    };
  }, [routesLib, map]);

  useEffect(() => {
    if (!pickupCoords || !destCoords) {
      if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
      }
      onRouteCalculated(null);
      return;
    }

    let isMounted = true;

    const fetchRoute = async () => {
      try {
        const directions = await googleMapsService.getDirections(pickupCoords, destCoords);
        if (!isMounted) return;

        onRouteCalculated(directions);

        if (directionsRenderer && directions?.rawResult) {
          directionsRenderer.setDirections(directions.rawResult);
          if (directions.rawResult.routes?.[0]?.bounds && map) {
            map.fitBounds(directions.rawResult.routes[0].bounds, {
              top: 80,
              bottom: 80,
              left: 80,
              right: 80,
            });
          }
        } else if (map && directions?.bounds) {
          const [[minLng, minLat], [maxLng, maxLat]] = directions.bounds;
          if (window.google?.maps?.LatLngBounds) {
            const bounds = new window.google.maps.LatLngBounds(
              { lat: minLat, lng: minLng },
              { lat: maxLat, lng: maxLng }
            );
            map.fitBounds(bounds, { top: 80, bottom: 80, left: 80, right: 80 });
          }
        }
      } catch (err) {
        console.warn('Failed to calculate road route:', err);
      }
    };

    fetchRoute();

    return () => {
      isMounted = false;
    };
  }, [pickupCoords, destCoords, directionsRenderer, map, onRouteCalculated]);

  return null;
};

/**
 * Automatically pans and centers the map to active location or bounds
 */
const MapBoundsManager = ({ pickupCoords, destCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (pickupCoords && destCoords) {
      if (window.google?.maps?.LatLngBounds) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat: pickupCoords[1], lng: pickupCoords[0] });
        bounds.extend({ lat: destCoords[1], lng: destCoords[0] });
        map.fitBounds(bounds, { top: 70, bottom: 70, left: 60, right: 60 });
      }
    } else if (pickupCoords) {
      map.panTo({ lat: pickupCoords[1], lng: pickupCoords[0] });
      map.setZoom(14);
    } else if (destCoords) {
      map.panTo({ lat: destCoords[1], lng: destCoords[0] });
      map.setZoom(14);
    }
  }, [map, pickupCoords, destCoords]);

  return null;
};

/**
 * Map Interaction Handler for Click to Select Pickup/Destination
 */
const MapEventsHandler = ({
  selectionMode,
  onPickupSelect,
  onDestinationSelect,
  setInternalMode,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('click', async (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const coords = [lng, lat];

      if (selectionMode === 'PICKUP' && onPickupSelect) {
        const address = await googleMapsService.reverseGeocode(lng, lat);
        onPickupSelect({ address, coordinates: coords });
        if (setInternalMode) setInternalMode('DESTINATION');
      } else if (selectionMode === 'DESTINATION' && onDestinationSelect) {
        const address = await googleMapsService.reverseGeocode(lng, lat);
        onDestinationSelect({ address, coordinates: coords });
        if (setInternalMode) setInternalMode(null);
      }
    });

    return () => {
      window.google?.maps?.event?.removeListener(listener);
    };
  }, [map, selectionMode, onPickupSelect, onDestinationSelect, setInternalMode]);

  return null;
};

/**
 * Enhanced Google Maps MapView Component (Uber Style Layout)
 */
export const MapView = ({
  center = [78.1198, 9.9252], // Default Madurai coordinates
  zoom = 13,
  pickupLocation = null, // { coordinates: [lng, lat], address?: string }
  destinationLocation = null, // { coordinates: [lng, lat], address?: string }
  driverLocation = null, // { coordinates: [lng, lat], speed?: number, heading?: number, isStale?: boolean }
  selectionMode: externalSelectionMode = null,
  onPickupSelect,
  onDestinationSelect,
  onRouteUpdate,
  onClearPickup,
  onClearDestination,
  onClearAll,
  showControls = true,
  showRouteInfo = true,
  className = '',
  styleOverrides = {},
  onMapLoad,
}) => {
  const [internalMode, setInternalMode] = useState('PICKUP');
  const activeMode = externalSelectionMode !== null ? externalSelectionMode : internalMode;

  const [routeInfo, setRouteInfo] = useState(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  const rawKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isKeyConfigured = Boolean(
    rawKey &&
    rawKey.trim() !== '' &&
    rawKey !== 'YOUR_GOOGLE_MAPS_API_KEY'
  );

  const mapCenter = useMemo(() => {
    if (pickupLocation?.coordinates) {
      return { lat: pickupLocation.coordinates[1], lng: pickupLocation.coordinates[0] };
    }
    if (Array.isArray(center)) {
      return { lat: center[1], lng: center[0] };
    }
    return center || { lat: 9.9252, lng: 78.1198 };
  }, [center, pickupLocation]);

  const handleRouteCalculated = useCallback((directions) => {
    setRouteInfo(directions);
    if (onRouteUpdate) {
      onRouteUpdate(directions);
    }
    setCalculatingRoute(false);
  }, [onRouteUpdate]);

  // Marker Drag Handlers
  const handlePickupDragEnd = async (e) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const address = await googleMapsService.reverseGeocode(lng, lat);
    if (onPickupSelect) {
      onPickupSelect({ address, coordinates: [lng, lat] });
    }
  };

  const handleDestinationDragEnd = async (e) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const address = await googleMapsService.reverseGeocode(lng, lat);
    if (onDestinationSelect) {
      onDestinationSelect({ address, coordinates: [lng, lat] });
    }
  };

  const pickupLat = pickupLocation?.coordinates?.[1];
  const pickupLng = pickupLocation?.coordinates?.[0];
  const destLat = destinationLocation?.coordinates?.[1];
  const destLng = destinationLocation?.coordinates?.[0];
  const driverLat = driverLocation?.coordinates?.[1];
  const driverLng = driverLocation?.coordinates?.[0];

  const formatShortAddress = (addr, prefix) => {
    if (!addr) return prefix;
    const short = addr.length > 26 ? addr.substring(0, 24) + '...' : addr;
    return `${prefix} ${short}`;
  };

  return (
    <div
      className={`map-wrapper ${className}`}
      style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.12))',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        background: '#e5e7eb',
        height: '100%',
        minHeight: '480px',
        ...styleOverrides,
      }}
    >
      {/* Top Banner Notice if API key is not configured */}
      {!isKeyConfigured && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            zIndex: 10,
            background: 'rgba(17, 24, 39, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '10px',
            padding: '0.6rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.8rem',
            color: '#f3f4f6',
          }}
        >
          <AlertTriangle size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
          <span>
            Google Maps API Key not set in <code>frontend/.env</code>. Running in interactive simulator mode.
          </span>
        </div>
      )}

      {/* Main Google Maps Canvas with Libraries Loaded */}
      <APIProvider
        apiKey={isKeyConfigured ? rawKey.trim() : ''}
        libraries={['places', 'routes', 'geometry', 'marker']}
      >
        <Map
          style={{ width: '100%', height: '100%', minHeight: styleOverrides.height || '540px' }}
          defaultCenter={mapCenter}
          defaultZoom={zoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {/* Pickup Marker with Uber Callout */}
          {pickupLat !== undefined && pickupLng !== undefined && (
            <>
              <Marker
                position={{ lat: pickupLat, lng: pickupLng }}
                draggable={true}
                onDragEnd={handlePickupDragEnd}
                title="Pickup Location"
                icon={{
                  path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                  scale: 7,
                  fillColor: '#000000',
                  fillOpacity: 1,
                  strokeWeight: 3,
                  strokeColor: '#ffffff',
                }}
              />
              <InfoWindow
                position={{ lat: pickupLat, lng: pickupLng }}
                headerDisabled={true}
                pixelOffset={[0, -22]}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.6rem',
                    background: '#ffffff',
                    color: '#000000',
                    fontWeight: 700,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                  }}
                >
                  <span>{formatShortAddress(pickupLocation?.address, 'From')}</span>
                  <ChevronRight size={14} />
                </div>
              </InfoWindow>
            </>
          )}

          {/* Destination Marker with Uber Callout */}
          {destLat !== undefined && destLng !== undefined && (
            <>
              <Marker
                position={{ lat: destLat, lng: destLng }}
                draggable={true}
                onDragEnd={handleDestinationDragEnd}
                title="Destination Location"
                icon={{
                  path: 'M -5,-5 L 5,-5 L 5,5 L -5,5 Z', // Square
                  scale: 1,
                  fillColor: '#000000',
                  fillOpacity: 1,
                  strokeWeight: 2.5,
                  strokeColor: '#ffffff',
                }}
              />
              <InfoWindow
                position={{ lat: destLat, lng: destLng }}
                headerDisabled={true}
                pixelOffset={[0, -22]}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.6rem',
                    background: '#ffffff',
                    color: '#000000',
                    fontWeight: 700,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                  }}
                >
                  <span>{formatShortAddress(destinationLocation?.address, 'To')}</span>
                  <ChevronRight size={14} />
                </div>
              </InfoWindow>
            </>
          )}

          {/* Driver Live Marker if active */}
          {driverLat !== undefined && driverLng !== undefined && (
            <Marker
              position={{ lat: driverLat, lng: driverLng }}
              title="Driver Live Location"
              label={{
                text: '🚗',
                fontSize: '18px',
              }}
            />
          )}

          {/* Viewport Bounds & Panning Manager */}
          <MapBoundsManager
            pickupCoords={pickupLocation?.coordinates}
            destCoords={destinationLocation?.coordinates}
          />

          {/* Directions and Driving Route (Solid Black Line) */}
          <DirectionsRenderer
            pickupCoords={pickupLocation?.coordinates}
            destCoords={destinationLocation?.coordinates}
            onRouteCalculated={handleRouteCalculated}
          />

          {/* Click to Select Handler */}
          <MapEventsHandler
            selectionMode={activeMode}
            onPickupSelect={onPickupSelect}
            onDestinationSelect={onDestinationSelect}
            setInternalMode={setInternalMode}
          />
        </Map>
      </APIProvider>

      {/* FLOATING ROUTE METRICS BADGE */}
      {showRouteInfo && routeInfo && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            zIndex: 10,
            background: '#000000',
            color: '#ffffff',
            borderRadius: '14px',
            padding: '0.75rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
            }}
          >
            <Navigation size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>
              Driving Estimate
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>{routeInfo.distanceText}</span>
              <span style={{ color: '#6b7280' }}>&bull;</span>
              <span style={{ color: '#38bdf8' }}>{routeInfo.durationText}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
