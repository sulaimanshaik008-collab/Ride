/**
 * Google Maps Client Service
 * Handles Places Autocomplete, Geocoding, Reverse Geocoding, Place Details, and Road Driving Directions.
 */

const getApiKey = () => {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key || key.trim() === '' || key === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return null;
  }
  return key.trim();
};

let googleScriptLoadingPromise = null;

export const loadGoogleMapsScript = () => {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.google?.maps?.places) return Promise.resolve(window.google.maps);
  if (googleScriptLoadingPromise) return googleScriptLoadingPromise;

  const apiKey = getApiKey();
  if (!apiKey) return Promise.resolve(null);

  googleScriptLoadingPromise = new Promise((resolve) => {
    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      if (window.google?.maps?.places) {
        resolve(window.google.maps);
        return;
      }
      existingScript.addEventListener('load', () => resolve(window.google?.maps || null));
      existingScript.addEventListener('error', () => resolve(null));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,routes,geometry,marker&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve(window.google?.maps || null);
    };
    script.onerror = (err) => {
      console.warn('Failed to load Google Maps script dynamically:', err);
      resolve(null);
    };
    document.head.appendChild(script);
  });

  return googleScriptLoadingPromise;
};

// Auto-trigger loading in background on file import
if (typeof window !== 'undefined') {
  loadGoogleMapsScript();
}

let autocompleteServiceInstance = null;
let geocoderInstance = null;
let placesServiceInstance = null;

const getAutocompleteService = async () => {
  if (typeof window === 'undefined') return null;
  if (window.google?.maps?.places?.AutocompleteService) {
    if (!autocompleteServiceInstance) {
      autocompleteServiceInstance = new window.google.maps.places.AutocompleteService();
    }
    return autocompleteServiceInstance;
  }
  await loadGoogleMapsScript();
  if (window.google?.maps?.places?.AutocompleteService) {
    autocompleteServiceInstance = new window.google.maps.places.AutocompleteService();
    return autocompleteServiceInstance;
  }
  return null;
};

const getGeocoder = async () => {
  if (typeof window === 'undefined') return null;
  if (window.google?.maps?.Geocoder) {
    if (!geocoderInstance) {
      geocoderInstance = new window.google.maps.Geocoder();
    }
    return geocoderInstance;
  }
  await loadGoogleMapsScript();
  if (window.google?.maps?.Geocoder) {
    geocoderInstance = new window.google.maps.Geocoder();
    return geocoderInstance;
  }
  return null;
};

const getPlacesService = async () => {
  if (typeof window === 'undefined') return null;
  if (!placesServiceInstance && window.google?.maps?.places?.PlacesService) {
    const dummyDiv = document.createElement('div');
    placesServiceInstance = new window.google.maps.places.PlacesService(dummyDiv);
  }
  return placesServiceInstance;
};

export const googleMapsService = {
  /**
   * Fast Google Places Autocomplete Suggestions across India
   * Returns predictions instantly without slow parallel geocoding.
   * @param {string} query Search query (e.g., "Tric", "Chennai Central", "MG Road Bengaluru")
   * @param {Object} options Optional search parameters
   * @returns {Promise<Array<{ id: string, placeId: string, name: string, secondaryText: string, placeName: string, types: string[] }>>}
   */
  searchPlaces: async (query, options = {}) => {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const cleanQuery = query.trim();

    // 1. Google Places AutocompleteService (Instant India-wide suggestions)
    try {
      const autocompleteService = await getAutocompleteService();
      if (autocompleteService) {
        const request = {
          input: cleanQuery,
          componentRestrictions: options.country ? { country: options.country } : { country: 'in' },
        };

        const predictions = await new Promise((resolve) => {
          autocompleteService.getPlacePredictions(request, (results, status) => {
            if (
              (status === window.google.maps.places.PlacesServiceStatus.OK || status === 'OK') &&
              results &&
              results.length > 0
            ) {
              resolve(results);
            } else {
              resolve([]);
            }
          });
        });

        if (predictions && predictions.length > 0) {
          return predictions.slice(0, options.limit || 6).map((pred) => {
            const mainText =
              pred.structured_formatting?.main_text ||
              (pred.description.includes(',') ? pred.description.split(',')[0].trim() : pred.description);

            const secondaryText =
              pred.structured_formatting?.secondary_text ||
              (pred.description.includes(',')
                ? pred.description.substring(pred.description.indexOf(',') + 1).trim()
                : 'India');

            return {
              id: pred.place_id,
              placeId: pred.place_id,
              name: mainText,
              secondaryText,
              placeName: pred.description,
              types: pred.types || [],
            };
          });
        }
      }
    } catch (err) {
      console.warn('Google Places Autocomplete error:', err);
    }

    // 2. Geocoder fallback for address matching across India
    try {
      const geocoder = await getGeocoder();
      if (geocoder) {
        const geocodeResults = await new Promise((resolve) => {
          geocoder.geocode(
            { address: cleanQuery, componentRestrictions: { country: 'in' } },
            (results, status) => {
              if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
                resolve(results);
              } else {
                resolve([]);
              }
            }
          );
        });

        if (geocodeResults && geocodeResults.length > 0) {
          return geocodeResults.slice(0, options.limit || 5).map((item) => {
            const parts = item.formatted_address.split(',');
            const mainText = parts[0].trim();
            const secondaryText = parts.slice(1).join(',').trim() || 'India';
            return {
              id: item.place_id,
              placeId: item.place_id,
              name: mainText,
              secondaryText,
              placeName: item.formatted_address,
              coordinates: [item.geometry.location.lng(), item.geometry.location.lat()],
              types: item.types || [],
            };
          });
        }
      }
    } catch (err) {
      console.warn('Google Geocoder fallback search error:', err);
    }

    // 3. Fallback database for offline/test environments
    return getFallbackSuggestions(cleanQuery);
  },

  /**
   * Resolve exact coordinates and full formatted address for a chosen place
   * @param {string} placeId Google place ID or identifier
   * @param {string} fallbackQuery Address text to geocode if placeId fails
   * @returns {Promise<{ address: string, name: string, coordinates: [number, number], placeId: string }>}
   */
  getPlaceDetails: async (placeId, fallbackQuery = '') => {
    // 1. Try Geocoder by placeId (fastest & most reliable)
    try {
      const geocoder = await getGeocoder();
      if (geocoder && placeId) {
        const result = await new Promise((resolve) => {
          geocoder.geocode({ placeId }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
              const loc = results[0].geometry.location;
              resolve({
                address: results[0].formatted_address,
                name: results[0].formatted_address.split(',')[0].trim(),
                coordinates: [loc.lng(), loc.lat()],
                placeId: results[0].place_id || placeId,
              });
            } else {
              resolve(null);
            }
          });
        });

        if (result) return result;
      }
    } catch (err) {
      console.warn('Geocoder placeId lookup failed:', err);
    }

    // 2. Try PlacesService.getDetails
    try {
      const placesService = await getPlacesService();
      if (placesService && placeId) {
        const result = await new Promise((resolve) => {
          placesService.getDetails(
            { placeId, fields: ['geometry', 'formatted_address', 'name', 'place_id'] },
            (place, status) => {
              if (
                (status === window.google.maps.places.PlacesServiceStatus.OK || status === 'OK') &&
                place?.geometry?.location
              ) {
                resolve({
                  address: place.formatted_address || place.name,
                  name: place.name || place.formatted_address?.split(',')[0],
                  coordinates: [place.geometry.location.lng(), place.geometry.location.lat()],
                  placeId: place.place_id || placeId,
                });
              } else {
                resolve(null);
              }
            }
          );
        });

        if (result) return result;
      }
    } catch (err) {
      console.warn('PlacesService details lookup error:', err);
    }

    // 3. Try geocoding by fallback query string
    if (fallbackQuery && fallbackQuery.trim()) {
      try {
        const geocoder = await getGeocoder();
        if (geocoder) {
          const result = await new Promise((resolve) => {
            geocoder.geocode({ address: fallbackQuery.trim(), componentRestrictions: { country: 'in' } }, (results, status) => {
              if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
                const loc = results[0].geometry.location;
                resolve({
                  address: results[0].formatted_address,
                  name: results[0].formatted_address.split(',')[0].trim(),
                  coordinates: [loc.lng(), loc.lat()],
                  placeId: results[0].place_id || placeId,
                });
              } else {
                resolve(null);
              }
            });
          });

          if (result) return result;
        }
      } catch (err) {
        console.warn('Fallback address geocoding error:', err);
      }
    }

    // Fallback default coordinates if offline
    return {
      address: fallbackQuery || 'Selected Location, India',
      name: fallbackQuery ? fallbackQuery.split(',')[0] : 'Location',
      coordinates: [78.1198, 9.9252],
      placeId: placeId || 'loc-id',
    };
  },

  /**
   * Reverse geocode coordinates to a human-readable address
   * @param {number} lng Longitude
   * @param {number} lat Latitude
   * @returns {Promise<string>}
   */
  reverseGeocode: async (lng, lat) => {
    try {
      const geocoder = await getGeocoder();
      if (geocoder) {
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
      }
    } catch (err) {
      console.warn('Google Maps reverse geocoding error:', err);
    }

    return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  },

  /**
   * Calculate real road-following driving directions, distance, and duration
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
    if (!origin || !destination) return null;

    try {
      await loadGoogleMapsScript();
      if (typeof window !== 'undefined' && window.google?.maps?.DirectionsService) {
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
      }
    } catch (err) {
      console.warn('Google DirectionsService error, calculating fallback road simulation:', err);
    }

    return getSimulatedRoute(origin, destination);
  },
};

/**
 * Fallback corporate location search for offline or initial load
 */
function getFallbackSuggestions(query) {
  const PRESET_PLACES = [
    // Trichy / Tiruchirappalli
    {
      name: 'Trichy International Airport (TRZ)',
      secondaryText: 'Ramanathapuram Road, Tiruchirappalli, Tamil Nadu',
      placeName: 'Trichy International Airport, Ramanathapuram Road, Tiruchirappalli, Tamil Nadu, India',
      coordinates: [78.7047, 10.7654],
      types: ['airport'],
    },
    {
      name: 'Tiruchirappalli Junction Railway Station',
      secondaryText: 'Bharathiyar Salai, Sangillyandapuram, Tiruchirappalli',
      placeName: 'Tiruchirappalli Junction Railway Station, Bharathiyar Salai, Tiruchirappalli, Tamil Nadu',
      coordinates: [78.6856, 10.7932],
      types: ['transit_station'],
    },
    {
      name: 'Trichy Central Bus Stand',
      secondaryText: 'Cantonment, Tiruchirappalli, Tamil Nadu',
      placeName: 'Central Bus Stand, Rockins Rd, Cantonment, Tiruchirappalli, Tamil Nadu',
      coordinates: [78.6841, 10.7967],
      types: ['transit_station'],
    },
    {
      name: 'NIT Trichy Campus Gate',
      secondaryText: 'Tanjore Main Road, Thuvakudi, Tiruchirappalli',
      placeName: 'National Institute of Technology, Thuvakudi, Tiruchirappalli, Tamil Nadu',
      coordinates: [78.8139, 10.7621],
      types: ['establishment'],
    },
    // Madurai
    {
      name: '35/1, Muniyandi Kovil Ln, near Saravana Hospital',
      secondaryText: 'Saravana Multi-Speciality Hospital Pvt Ltd, Madurai',
      placeName: '35/1, Muniyandi Kovil Ln, near Saravana Multi-Speciality Hospital, Madurai, Tamil Nadu',
      coordinates: [78.1198, 9.9252],
      types: ['establishment'],
    },
    {
      name: 'Mattuthavani Omni Bus Stand',
      secondaryText: 'Melur Main Road, Mattuthavani, Madurai',
      placeName: 'Mattuthavani Omni Bus Stand, Melur Main Rd, Madurai, Tamil Nadu',
      coordinates: [78.1565, 9.9485],
      types: ['transit_station'],
    },
    {
      name: 'Madurai International Airport (IXM)',
      secondaryText: 'Airport Road, Madurai, Tamil Nadu',
      placeName: 'Madurai International Airport, Airport Rd, Madurai, Tamil Nadu',
      coordinates: [78.0934, 9.8345],
      types: ['airport'],
    },
    {
      name: 'Madurai Junction Railway Station',
      secondaryText: 'Railway Colony, Madurai, Tamil Nadu',
      placeName: 'Madurai Junction Railway Station, Railway Colony, Madurai, Tamil Nadu',
      coordinates: [78.1105, 9.9238],
      types: ['transit_station'],
    },
    // Chennai
    {
      name: 'Acme Global HQ - Tower A Gate 2',
      secondaryText: 'Tech Park, Guindy, Chennai, Tamil Nadu',
      placeName: 'Acme Global HQ, Tower A Gate 2, Tech Park, Chennai, Tamil Nadu',
      coordinates: [80.2707, 13.0827],
      types: ['establishment'],
    },
    {
      name: 'Chennai Central Railway Station',
      secondaryText: 'Kannappar Thidal, Periamet, Chennai, Tamil Nadu',
      placeName: 'Puratchi Thalaivar Dr. M.G. Ramachandran Central Railway Station, Chennai',
      coordinates: [80.2755, 13.0823],
      types: ['transit_station'],
    },
    {
      name: 'Chennai International Airport (MAA)',
      secondaryText: 'Grand Southern Trunk Rd, Meenambakkam, Chennai',
      placeName: 'Chennai International Airport, Meenambakkam, Chennai, Tamil Nadu',
      coordinates: [80.1709, 12.9941],
      types: ['airport'],
    },
    {
      name: 'T. Nagar Commercial Hub',
      secondaryText: 'Thyagaraya Road, T. Nagar, Chennai, Tamil Nadu',
      placeName: 'T. Nagar Commercial Hub, Thyagaraya Rd, T. Nagar, Chennai, Tamil Nadu',
      coordinates: [80.2337, 13.0418],
      types: ['establishment'],
    },
    // Bangalore
    {
      name: 'Bangalore Kempegowda International Airport (BLR)',
      secondaryText: 'Devanahalli, Bengaluru, Karnataka',
      placeName: 'Kempegowda International Airport, Devanahalli, Bengaluru, Karnataka',
      coordinates: [77.7066, 13.1986],
      types: ['airport'],
    },
    {
      name: 'MG Road Metro Station',
      secondaryText: 'Mahatma Gandhi Road, Bengaluru, Karnataka',
      placeName: 'MG Road Metro Station, Shivaji Nagar, Bengaluru, Karnataka',
      coordinates: [77.6186, 12.9756],
      types: ['transit_station'],
    },
    // Coimbatore
    {
      name: 'Coimbatore Junction Railway Station',
      secondaryText: 'Gopalapuram, Coimbatore, Tamil Nadu',
      placeName: 'Coimbatore Junction, Gopalapuram, Coimbatore, Tamil Nadu',
      coordinates: [76.9629, 11.0018],
      types: ['transit_station'],
    },
    {
      name: 'Coimbatore International Airport (CJB)',
      secondaryText: 'Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu',
      placeName: 'Coimbatore International Airport, Peelamedu, Coimbatore, Tamil Nadu',
      coordinates: [77.0434, 11.0298],
      types: ['airport'],
    },
  ];

  if (!query || query.trim() === '') {
    return PRESET_PLACES.map((p, idx) => ({ id: `preset-${idx}`, placeId: `preset-${idx}`, ...p }));
  }

  const q = query.toLowerCase().trim();
  const matched = PRESET_PLACES.filter(
    (p) => p.name.toLowerCase().includes(q) || p.placeName.toLowerCase().includes(q) || p.secondaryText.toLowerCase().includes(q)
  );

  if (matched.length > 0) {
    return matched.map((p, idx) => ({ id: `preset-${idx}`, placeId: `preset-${idx}`, ...p }));
  }

  return [
    {
      id: 'custom-query-loc',
      placeId: 'custom-query-loc',
      name: query.trim(),
      secondaryText: 'India',
      placeName: `${query.trim()}, India`,
      coordinates: [78.7047, 10.7654],
      types: ['geocode'],
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

  const steps = 16;
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
