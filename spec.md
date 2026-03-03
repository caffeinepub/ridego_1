# RideGo

## Current State
- Pickup and drop inputs exist in RiderHome with a debounced geocode call (800ms) that calculates straight-line distance using Haversine formula
- Distance badge and fare update after both fields have text and geocoding completes
- No visual map shown between pickup and drop

## Requested Changes (Diff)

### Add
- Live route map panel below the pickup/drop inputs that appears as soon as both fields have content
- Map uses OpenStreetMap tiles via Leaflet (react-leaflet) embedded in an iframe-free inline component
- Shows pickup marker (green pin), drop marker (red pin), and a dashed route line between them
- Map animates in with a smooth expand transition when both locations are set
- Distance badge updates live as the user types (debounce already present at 800ms -- keep as-is)

### Modify
- RiderHome: add RouteMap component below distance badge when both pickup and drop coords are resolved
- Distance badge: show "Calculating..." spinner while geocoding, then live km result (already works -- confirm it fires on every keystroke change via the existing useEffect)

### Remove
- Nothing removed

## Implementation Plan
1. Install react-leaflet and leaflet packages (already may be available; otherwise use dynamic OpenStreetMap embed via iframe or pure SVG fallback)
2. Create RouteMapPanel component using Leaflet or an OSM static map tile approach:
   - If react-leaflet available: render a small Leaflet map with TileLayer, Marker, and Polyline
   - Fallback: use a static OSM URL embed in an <img> with bbox from coords
3. In RiderHome, pass resolved pickup/drop coords to RouteMapPanel
4. Animate map panel in/out with motion/react
5. Add data-ocid="rider.route_map.card" to the map container
