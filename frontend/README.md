# Corporate Rides Frontend

Enterprise Ride-Sharing and Corporate Fleet Management Platform with Google Maps.

## Google Maps Configuration

The frontend uses `@vis.gl/react-google-maps` and Google Maps JavaScript API for interactive map rendering, draggable pickup/destination markers, Places autocomplete, and driving route calculation.

### Required Google Cloud APIs

In your Google Cloud Console project, enable the following APIs:

1. **Maps JavaScript API**: Renders interactive map canvas and markers.
2. **Places API (New) / Places API**: Powers location search and autocomplete suggestions.
3. **Geocoding API**: Provides forward and reverse geocoding (coordinates to readable addresses).
4. **Routes API / Directions API**: Computes optimal driving routes, distance (km), and travel duration (ETA).

### Environment Variables

Set your API key in `frontend/.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Security & API Key Restrictions

Because frontend API keys are loaded by the client browser at runtime, apply the following restrictions in Google Cloud Console:

1. **Application Restrictions**: Set HTTP Referrers to allowed domains (e.g. `http://localhost:*`, `https://your-domain.com/*`).
2. **API Restrictions**: Restrict the key to only the 4 required APIs listed above.
