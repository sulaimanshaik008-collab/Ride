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
  ChevronRight,
  Circle,
  Square
} from 'lucide-react';
import { googleMapsService } from '../../services/googleMapsService';

/**
 * Standard Google Roadmap Style with Clean Roadways, Highway Badges (81, 44, 38, etc.), and Blue Water
 */
export const UBER_CITY_MAP_STYLE = [];

/**
 * Custom Directions & Route Polyline Renderer Component with Solid Black Driving Route Line
 */
const DirectionsRenderer = ({
  pickupCoords,
  destCoords,
  onRouteCalculated,
}) => {
  const map = useMap();
  const polylineRef = useRef(null);

  useEffect(() => {
    // Clean up standalone polyline on unmount
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!pickupCoords || !destCoords || !map) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      if (onRouteCalculated) onRouteCalculated(null);
      return;
    }

    let isMounted = true;

    const fetchRoute = async () => {
      try {
        const directions = await googleMapsService.getDirections(pickupCoords, destCoords);
        if (!isMounted) return;

        if (onRouteCalculated) {
          onRouteCalculated(directions);
        }

        // Draw solid jet-black driving route line matching reference screenshot
        if (directions?.coordinates && directions.coordinates.length > 0 && map) {
          const pathLatLngs = directions.coordinates.map((c) => ({
            lat: c[1],
            lng: c[0],
          }));

          if (polylineRef.current) {
            polylineRef.current.setPath(pathLatLngs);
            polylineRef.current.setMap(map);
          } else if (window.google?.maps?.Polyline) {
            polylineRef.current = new window.google.maps.Polyline({
              path: pathLatLngs,
              geodesic: true,
              strokeColor: '#000000',
              strokeOpacity: 0.95,
              strokeWeight: 6,
              zIndex: 50,
              map: map,
            });
          }

          // Frame bounds smoothly around the entire corridor with padding
          if (directions?.bounds && window.google?.maps?.LatLngBounds) {
            const [[minLng, minLat], [maxLng, maxLat]] = directions.bounds;
            const bounds = new window.google.maps.LatLngBounds(
              { lat: minLat, lng: minLng },
              { lat: maxLat, lng: maxLng }
            );
            map.fitBounds(bounds, { top: 80, bottom: 80, left: 80, right: 80 });
          } else if (directions?.rawResult?.routes?.[0]?.bounds) {
            map.fitBounds(directions.rawResult.routes[0].bounds, {
              top: 80,
              bottom: 80,
              left: 80,
              right: 80,
            });
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
  }, [pickupCoords, destCoords, map, onRouteCalculated]);

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
        map.fitBounds(bounds, { top: 80, bottom: 80, left: 80, right: 80 });
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
 * Known tech corridor coordinates across Chennai / Tamil Nadu for resilient route rendering
 */
const getKnownCoords = (addr, isPickup = true) => {
  if (!addr) return isPickup ? [80.2285, 12.8276] : [80.1264, 12.9372];
  const s = String(addr).toLowerCase();
  if (s.includes('siruseri') || s.includes('sipcot')) return [80.2285, 12.8276];
  if (s.includes('mepz') || s.includes('tambaram')) return [80.1264, 12.9372];
  if (s.includes('zoho') || s.includes('estancia') || s.includes('guduvanchery')) return [80.0384, 12.8335];
  if (s.includes('tidel') || s.includes('taramani') || s.includes('tharamani')) return [80.2443, 12.9897];
  if (s.includes('guindy') || s.includes('olympia')) return [80.2091, 13.0102];
  if (s.includes('sholinganallur')) return [80.2279, 12.9010];
  if (s.includes('medavakkam')) return [80.1873, 12.9192];
  if (s.includes('chromepet')) return [80.1416, 12.9516];
  if (s.includes('navalur')) return [80.2268, 12.8465];
  if (s.includes('padur')) return [80.2265, 12.8124];
  if (s.includes('madurai')) return isPickup ? [78.1198, 9.9252] : [78.1565, 9.9485];
  return isPickup ? [80.2285, 12.8276] : [80.1264, 12.9372];
};

/**
 * Custom red car pin marker icon matching destination tracking design
 */
const CAR_MARKER_SVG_DATA = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="42" height="50" viewBox="0 0 42 50">
    <defs>
      <filter id="pinShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.38"/>
      </filter>
    </defs>
    <!-- Red Teardrop Location Pin -->
    <path d="M21 2 C10.5 2 2 10.5 2 21 C2 33 19 46.5 20.2 47.6 C20.6 48 21.4 48 21.8 47.6 C23 46.5 40 33 40 21 C40 10.5 31.5 2 21 2 Z" 
          fill="#dc2626" stroke="#b91c1c" stroke-width="1.2" filter="url(#pinShadow)"/>
    <!-- Inner White Disc -->
    <circle cx="21" cy="21" r="14" fill="#ffffff"/>
    <!-- Detailed Red Car with Cyan Windows -->
    <g transform="translate(11, 13)">
      <!-- Car silhouette -->
      <path d="M2 9.5 L3.8 5.2 C4.2 4.4 5.1 4 6 4 L14 4 C14.9 4 15.8 4.4 16.2 5.2 L18 9.5 L19 9.5 C19.6 9.5 20 9.9 20 10.5 L20 12.5 C20 13.1 19.6 13.5 19 13.5 L18.5 13.5 C18.5 14.6 17.6 15.5 16.5 15.5 C15.4 15.5 14.5 14.6 14.5 13.5 L5.5 13.5 C5.5 14.6 4.6 15.5 3.5 15.5 C2.4 15.5 1.5 14.6 1.5 13.5 L1 13.5 C0.4 13.5 0 13.1 0 12.5 L0 10.5 C0 9.9 0.4 9.5 1 9.5 Z" fill="#ef4444"/>
      <!-- Cyan / light blue windows -->
      <path d="M4.5 8.5 L5.8 5.4 L9.5 5.4 L9.5 8.5 Z" fill="#38bdf8"/>
      <path d="M10.5 5.4 L14.2 5.4 L15.5 8.5 L10.5 8.5 Z" fill="#38bdf8"/>
      <!-- Wheels -->
      <circle cx="3.5" cy="13.5" r="2" fill="#1e293b"/>
      <circle cx="3.5" cy="13.5" r="0.8" fill="#f8fafc"/>
      <circle cx="16.5" cy="13.5" r="2" fill="#1e293b"/>
      <circle cx="16.5" cy="13.5" r="0.8" fill="#f8fafc"/>
      <!-- Headlight -->
      <rect x="0.2" y="10.2" width="1.2" height="1.4" rx="0.5" fill="#fde047"/>
      <rect x="18.6" y="10.2" width="1.2" height="1.4" rx="0.5" fill="#f87171"/>
    </g>
  </svg>
`.trim());

/**
 * Enhanced Google Maps MapView Component (Uber Style Layout)
 */
export const MapView = ({
  center = null,
  zoom = 13,
  pickupLocation = null, // { coordinates: [lng, lat], address?: string } OR string OR [lng, lat]
  destinationLocation = null, // { coordinates: [lng, lat], address?: string } OR string OR [lng, lat]
  destination = null, // Alias prop for destinationLocation
  pickupCoords = null, // Direct [lng, lat]
  destCoords = null, // Direct [lng, lat]
  driverLocation = null, // { coordinates: [lng, lat] } OR [lng, lat] OR { longitude, latitude }
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

  // Normalize Pickup Location & Coordinates
  const normalizedPickup = useMemo(() => {
    if (pickupLocation && typeof pickupLocation === 'object' && !Array.isArray(pickupLocation) && pickupLocation.coordinates) {
      return pickupLocation;
    }
    const coords = pickupCoords || (Array.isArray(pickupLocation) ? pickupLocation : null);
    const address = typeof pickupLocation === 'string' ? pickupLocation : (pickupLocation?.address || '');
    if (coords && coords.length >= 2 && coords[0] != null && coords[1] != null) {
      return { address, coordinates: coords };
    }
    if (address) {
      return { address, coordinates: getKnownCoords(address, true) };
    }
    return null;
  }, [pickupLocation, pickupCoords]);

  // Normalize Destination Location & Coordinates
  const normalizedDest = useMemo(() => {
    const rawDest = destinationLocation || destination;
    if (rawDest && typeof rawDest === 'object' && !Array.isArray(rawDest) && rawDest.coordinates) {
      return rawDest;
    }
    const coords = destCoords || (Array.isArray(rawDest) ? rawDest : null);
    const address = typeof rawDest === 'string' ? rawDest : (rawDest?.address || '');
    if (coords && coords.length >= 2 && coords[0] != null && coords[1] != null) {
      return { address, coordinates: coords };
    }
    if (address) {
      return { address, coordinates: getKnownCoords(address, false) };
    }
    return null;
  }, [destinationLocation, destination, destCoords]);

  // Normalize Driver Live Location
  const normalizedDriver = useMemo(() => {
    if (!driverLocation) {
      if (normalizedPickup?.coordinates && normalizedDest?.coordinates) {
        return {
          coordinates: [
            normalizedPickup.coordinates[0] * 0.6 + normalizedDest.coordinates[0] * 0.4,
            normalizedPickup.coordinates[1] * 0.6 + normalizedDest.coordinates[1] * 0.4,
          ],
        };
      }
      return null;
    }
    if (Array.isArray(driverLocation) && driverLocation.length >= 2) {
      return { coordinates: driverLocation };
    }
    if (driverLocation.coordinates) {
      return driverLocation;
    }
    if (driverLocation.latitude && driverLocation.longitude) {
      return { coordinates: [driverLocation.longitude, driverLocation.latitude] };
    }
    return null;
  }, [driverLocation, normalizedPickup, normalizedDest]);

  const pickupLat = normalizedPickup?.coordinates?.[1];
  const pickupLng = normalizedPickup?.coordinates?.[0];
  const destLat = normalizedDest?.coordinates?.[1];
  const destLng = normalizedDest?.coordinates?.[0];
  const driverLat = normalizedDriver?.coordinates?.[1];
  const driverLng = normalizedDriver?.coordinates?.[0];

  const mapCenter = useMemo(() => {
    if (pickupLat !== undefined && pickupLng !== undefined) {
      return { lat: pickupLat, lng: pickupLng };
    }
    if (Array.isArray(center) && center.length >= 2) {
      return { lat: center[1], lng: center[0] };
    }
    if (center && typeof center === 'object' && center.lat) {
      return center;
    }
    return { lat: 12.8276, lng: 80.2285 }; // Default Chennai / Siruseri
  }, [center, pickupLat, pickupLng]);

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

  const formatShortAddress = (addr, prefix) => {
    if (!addr) return prefix;
    const clean = addr.split(',')[0].trim();
    const short = clean.length > 22 ? clean.substring(0, 20) + '...' : clean;
    return `${prefix} ${short}`;
  };

  return (
    <div
      className={`map-wrapper ${className}`}
      style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        background: '#e5e7eb',
        height: '100%',
        width: '100%',
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
          style={{ width: '100%', height: '100%' }}
          defaultCenter={mapCenter}
          defaultZoom={zoom}
          defaultMapTypeId="roadmap"
          mapTypeId="roadmap"
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {/* Pickup Marker with Uber Callout Bubble */}
          {pickupLat !== undefined && pickupLng !== undefined && (
            <>
              <Marker
                position={{ lat: pickupLat, lng: pickupLng }}
                draggable={false}
                onDragEnd={handlePickupDragEnd}
                title="Pickup Location"
                icon={{
                  path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                  scale: 8,
                  fillColor: '#000000',
                  fillOpacity: 1,
                  strokeWeight: 3.5,
                  strokeColor: '#ffffff',
                }}
              />
              <InfoWindow
                position={{ lat: pickupLat, lng: pickupLng }}
                headerDisabled={true}
                pixelOffset={[0, -22]}
              >
                <div
                  className="uber-map-callout"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.65rem',
                    padding: '0.45rem 0.75rem',
                    background: '#ffffff',
                    color: '#000000',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.22)',
                    minWidth: '130px',
                    maxWidth: '240px',
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formatShortAddress(normalizedPickup?.address, 'From')}
                  </span>
                  <ChevronRight size={16} color="#000000" style={{ flexShrink: 0 }} />
                </div>
              </InfoWindow>
            </>
          )}

          {/* Destination Marker (Crisp black square matching reference image) */}
          {destLat !== undefined && destLng !== undefined && (
            <Marker
              position={{ lat: destLat, lng: destLng }}
              draggable={false}
              onDragEnd={handleDestinationDragEnd}
              title={normalizedDest?.address || "Destination"}
              icon={{
                path: 'M -6.5,-6.5 L 6.5,-6.5 L 6.5,6.5 L -6.5,6.5 Z', // Crisp black square icon matching image
                scale: 1,
                fillColor: '#000000',
                fillOpacity: 1,
                strokeWeight: 2.5,
                strokeColor: '#ffffff',
              }}
            />
          )}

          {/* Driver Live Car Marker (Custom Red Badge with Car Icon matching image) */}
          {driverLat !== undefined && driverLng !== undefined && (
            <Marker
              position={{ lat: driverLat, lng: driverLng }}
              title="Driver Location"
              icon={{
                url: CAR_MARKER_SVG_DATA,
                scaledSize: typeof window !== 'undefined' && window.google?.maps?.Size ? new window.google.maps.Size(42, 50) : undefined,
                anchor: typeof window !== 'undefined' && window.google?.maps?.Point ? new window.google.maps.Point(21, 48) : undefined,
              }}
              zIndex={99}
            />
          )}

          {/* Viewport Bounds & Panning Manager */}
          <MapBoundsManager
            pickupCoords={normalizedPickup?.coordinates}
            destCoords={normalizedDest?.coordinates}
          />

          {/* Directions and Driving Route (Solid Black Line) */}
          <DirectionsRenderer
            pickupCoords={normalizedPickup?.coordinates}
            destCoords={normalizedDest?.coordinates}
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
