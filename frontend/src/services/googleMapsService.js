/**
 * Google Maps Client Service
 * Handles Places Search, Geocoding, Reverse Geocoding, and Driving Directions API calls.
 */

const getApiKey = () => {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key || key.trim() === '' || key === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return null;
  }
  return key.trim();
};

export const googleMapsService = {
  /**
   * Search for locations/addresses using Google Places Autocomplete & Geocoding
   * Supports any city across India and worldwide.
   * @param {string} query Search text
   * @param {Object} options Optional search parameters
   * @returns {Promise<Array<{ id: string, name: string, placeName: string, coordinates: [number, number] }>>}
   */
  searchPlaces: async (query, options = {}) => {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const cleanQuery = query.trim();

    // 1. Try Google Maps Places Autocomplete Service in Browser
    if (typeof window !== 'undefined' && window.google?.maps?.places?.AutocompleteService) {
      try {
        const autocompleteService = new window.google.maps.places.AutocompleteService();
        const geocoder = new window.google.maps.Geocoder();

        const request = {
          input: cleanQuery,
          componentRestrictions: options.country ? { country: options.country } : { country: 'in' },
        };

        const predictions = await new Promise((resolve) => {
          autocompleteService.getPlacePredictions(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
              resolve(results);
            } else {
              resolve([]);
            }
          });
        });

        if (predictions && predictions.length > 0) {
          const detailedPlaces = await Promise.all(
            predictions.slice(0, options.limit || 5).map(async (pred) => {
              const geoRes = await new Promise((resGeo) => {
                geocoder.geocode({ placeId: pred.place_id }, (geoResults, geoStatus) => {
                  if (geoStatus === window.google.maps.GeocoderStatus.OK && geoResults?.[0]) {
                    const loc = geoResults[0].geometry.location;
                    resGeo([loc.lng(), loc.lat()]);
                  } else {
                    resGeo(null);
                  }
                });
              });

              return {
                id: pred.place_id,
                name: pred.structured_formatting?.main_text || pred.description,
                placeName: pred.description,
                coordinates: geoRes,
              };
            })
          );

          // Filter only places with valid resolved coordinates
          const validPlaces = detailedPlaces.filter((p) => p.coordinates !== null);
          if (validPlaces.length > 0) {
            return validPlaces;
          }
        }
      } catch (err) {
        console.warn('Google Places Autocomplete error:', err);
      }
    }

    // 2. Try Google Maps Geocoder Service (Works for ANY city, area, or address globally)
    if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const geocodeResults = await new Promise((resolve) => {
          geocoder.geocode({ address: cleanQuery, componentRestrictions: { country: 'in' } }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
              resolve(results);
            } else {
              // Try without country restriction
              geocoder.geocode({ address: cleanQuery }, (intlResults, intlStatus) => {
                if (intlStatus === window.google.maps.GeocoderStatus.OK && intlResults) {
                  resolve(intlResults);
                } else {
                  resolve([]);
                }
              });
            }
          });
        });

        if (geocodeResults && geocodeResults.length > 0) {
          return geocodeResults.slice(0, options.limit || 5).map((item) => ({
            id: item.place_id,
            name: item.formatted_address.split(',')[0],
            placeName: item.formatted_address,
            coordinates: [item.geometry.location.lng(), item.geometry.location.lat()],
          }));
        }
      } catch (err) {
        console.warn('Google Geocoder JS error:', err);
      }
    }

    // 3. Fallback database for known presets or dynamic query location
    return getFallbackSuggestions(cleanQuery);
  },

  /**
   * Reverse geocode coordinates to a readable address/place name
   * @param {number} lng Longitude
   * @param {number} lat Latitude
   * @returns {Promise<string>}
   */
  reverseGeocode: async (lng, lat) => {
    if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await new Promise((resolve) => {
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
              resolve(results[0].formatted_address);
            } else {
              resolve(null);
            }
          });
        });
        if (response) return response;
      } catch (err) {
        console.warn('Google Maps reverse geocoding JS error:', err);
      }
    }

    return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  },

  /**
   * Calculate driving route, distance, and duration between two coordinates
   * @param {[number, number]} origin [longitude, latitude]
   * @param {[number, number]} destination [longitude, latitude]
   * @returns {Promise<{
   *   coordinates: Array<[number, number]>,
   *   distanceKm: number,
   *   durationMin: number,
   *   durationText: string,
   *   distanceText: string,
   *   bounds: [[number, number], [number, number]],
   *   rawResult?: any
   * }>}
   */
  getDirections: async (origin, destination) => {
    if (typeof window !== 'undefined' && window.google?.maps?.DirectionsService) {
      try {
        const directionsService = new window.google.maps.DirectionsService();
        const request = {
          origin: new window.google.maps.LatLng(origin[1], origin[0]),
          destination: new window.google.maps.LatLng(destination[1], destination[0]),
          travelMode: window.google.maps.TravelMode.DRIVING,
        };

        const result = await new Promise((resolve, reject) => {
          directionsService.route(request, (res, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && res) {
              resolve(res);
            } else {
              reject(new Error(`Directions status: ${status}`));
            }
          });
        });

        if (result && result.routes?.[0]?.legs?.[0]) {
          const leg = result.routes[0].legs[0];
          const distanceKm = Number(((leg.distance?.value || 0) / 1000).toFixed(1));
          const durationMin = Math.max(1, Math.round((leg.duration?.value || 0) / 60));

          const pathCoordinates = [];
          if (result.routes[0].overview_path) {
            result.routes[0].overview_path.forEach((pt) => {
              pathCoordinates.push([pt.lng(), pt.lat()]);
            });
          }

          const bounds = result.routes[0].bounds;
          let formattedBounds = null;
          if (bounds) {
            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();
            formattedBounds = [
              [sw.lng(), sw.lat()],
              [ne.lng(), ne.lat()],
            ];
          }

          return {
            coordinates: pathCoordinates.length > 0 ? pathCoordinates : [origin, destination],
            distanceKm,
            durationMin,
            distanceText: leg.distance?.text || `${distanceKm} km`,
            durationText: leg.duration?.text || `${durationMin} min`,
            bounds: formattedBounds,
            rawResult: result,
          };
        }
      } catch (err) {
        console.warn('Google DirectionsService error, using fallback:', err);
      }
    }

    return getSimulatedRoute(origin, destination);
  },
};

/**
 * Fallback corporate location search for offline or initial load
 */
function getFallbackSuggestions(query) {
  const PRESET_PLACES = [
    // Madurai
    {
      name: '35/1, Muniyandi Kovil Ln, near Saravana Hospital',
      placeName: '35/1, Muniyandi Kovil Ln, near Saravana Multi-Speciality Hospital, Madurai',
      coordinates: [78.1198, 9.9252],
    },
    {
      name: 'Mattuthavani Omni Bus Stand',
      placeName: 'Mattuthavani Omni Bus Stand, Melur Main Rd, Madurai',
      coordinates: [78.1565, 9.9485],
    },
    {
      name: 'Meenakshi Amman Temple Gate',
      placeName: 'Madurai Meenakshi Amman Temple, Madurai Main, Madurai',
      coordinates: [78.1194, 9.9195],
    },
    {
      name: 'Madurai Junction Railway Station',
      placeName: 'Madurai Junction Railway Station, Railway Colony, Madurai',
      coordinates: [78.1105, 9.9238],
    },
    // Bangalore
    {
      name: 'Bangalore Kempegowda International Airport (BLR)',
      placeName: 'Kempegowda International Airport, Devanahalli, Bangalore',
      coordinates: [77.7066, 13.1986],
    },
    {
      name: 'Electronic City Phase 1 IT Park',
      placeName: 'Electronic City Phase 1, Hosur Road, Bangalore',
      coordinates: [77.6648, 12.8452],
    },
    {
      name: 'Whitefield Tech Corridor',
      placeName: 'ITPB, Whitefield Main Road, Bangalore',
      coordinates: [77.7499, 12.9866],
    },
    // Chennai
    {
      name: 'Acme Global HQ - Tower A Gate 2',
      placeName: 'Acme Global HQ, Tower A Gate 2, Tech Park, Chennai',
      coordinates: [80.2707, 13.0827],
    },
    {
      name: 'TechCorp Innovation Campus Gate 1',
      placeName: 'TechCorp Innovation Campus, Gate 1, OMR IT Corridor, Chennai',
      coordinates: [80.2285, 12.9716],
    },
    {
      name: 'Chennai International Airport Terminal 2',
      placeName: 'Chennai International Airport, Terminal 2 Departures, Meenambakkam, Chennai',
      coordinates: [80.1709, 12.9941],
    },
    // Coimbatore
    {
      name: 'Coimbatore Junction Railway Station',
      placeName: 'Coimbatore Junction, Gopalapuram, Coimbatore',
      coordinates: [76.9629, 11.0018],
    },
    {
      name: 'TIDEL Park Coimbatore',
      placeName: 'TIDEL Park, Avinashi Road, Civil Aerodrome Post, Coimbatore',
      coordinates: [77.0272, 11.0264],
    },
  ];

  if (!query || query.trim() === '') {
    return PRESET_PLACES.map((p, idx) => ({ id: `preset-${idx}`, ...p }));
  }

  const q = query.toLowerCase().trim();
  const matched = PRESET_PLACES.filter(
    (p) => p.name.toLowerCase().includes(q) || p.placeName.toLowerCase().includes(q)
  );

  if (matched.length > 0) {
    return matched.map((p, idx) => ({ id: `preset-${idx}`, ...p }));
  }

  return [
    {
      id: 'custom-query-loc',
      name: query.trim(),
      placeName: `${query.trim()}, India`,
      coordinates: [78.1198, 9.9252],
    },
  ];
}

/**
 * Calculates straight-line and simulated realistic driving path coordinates
 */
function getSimulatedRoute(origin, destination) {
  const [lng1, lat1] = origin;
  const [lng2, lat2] = destination;

  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistanceKm = R * c;

  const distanceKm = Number((Math.max(1.2, straightDistanceKm * 1.3)).toFixed(1));
  const durationMin = Math.max(5, Math.round((distanceKm / 32) * 60));

  const steps = 14;
  const coords = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const interpLng = lng1 + (lng2 - lng1) * t;
    const interpLat = lat1 + (lat2 - lat1) * t;
    const curve = Math.sin(t * Math.PI) * 0.008;
    coords.push([interpLng + curve, interpLat + curve * 0.6]);
  }

  const minLng = Math.min(lng1, lng2);
  const maxLng = Math.max(lng1, lng2);
  const minLat = Math.min(lat1, lat2);
  const maxLat = Math.max(lat1, lat2);

  return {
    coordinates: coords,
    distanceKm,
    durationMin,
    distanceText: `${distanceKm} km`,
    durationText: `${durationMin} min`,
    bounds: [
      [minLng, minLat],
      [maxLng, maxLat],
    ],
  };
}

export default googleMapsService;
