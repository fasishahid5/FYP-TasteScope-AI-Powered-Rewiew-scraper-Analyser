import React, { useCallback, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";

const GOOGLE_MAP_LIBRARIES = ["places"];

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 31.5204,
  lng: 74.3587,
};

function GoogleMapView({ restaurants, hoveredPin, onMapLoad, selectedSearchPlace, userLocation }) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAP_LIBRARIES,
  });

  const mapRef = useRef(null);

  // Re-center and zoom to user's location whenever it changes
  useEffect(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      mapRef.current.setZoom(13);
    }
  }, [userLocation]);

  // Pass the map instance up to the parent component when it readies
  const onLoad = useCallback((map) => {
    mapRef.current = map;
    if (onMapLoad) onMapLoad(map);
    // If we already have user location by the time the map loads, center on it
    if (userLocation) {
      map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      map.setZoom(13);
    }
  }, [onMapLoad, userLocation]);

  if (!isLoaded) return <div className="p-4 text-center font-semibold text-gray-500">Loading Maps...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={12}
      onLoad={onLoad}
      options={{
        mapTypeControl: false,
        streetViewControl: false,
      }}
    >
      {/* User location marker - Purple/Violet pin */}
      {userLocation && (
        <MarkerF
          position={{ lat: userLocation.lat, lng: userLocation.lng }}
          title={`Your Location: ${userLocation.lat.toFixed(3)}°, ${userLocation.lng.toFixed(3)}°`}
          icon="http://maps.google.com/mapfiles/ms/icons/purple-dot.png"
        />
      )}

      {/* Searched place marker - Blue pin */}
      {selectedSearchPlace && (
        <MarkerF
          position={{ lat: selectedSearchPlace.lat, lng: selectedSearchPlace.lng }}
          title={`Search: ${selectedSearchPlace.name}`}
          icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        />
      )}

      {/* Restaurant markers - Red/Yellow pins */}
      {restaurants?.map((restaurant) => {
        const lat = Number(restaurant.lat);
        const lng = Number(restaurant.lng);

        if (isNaN(lat) || isNaN(lng)) return null;

        return (
          <MarkerF
            key={restaurant._id || restaurant.id}
            position={{ lat, lng }}
            title={restaurant.name}
            icon={
              hoveredPin === (restaurant._id || restaurant.id)
                ? "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
                : "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
            }
            animation={
              hoveredPin === (restaurant._id || restaurant.id)
                ? window.google.maps.Animation.BOUNCE
                : null
            }
          />
        );
      })}
    </GoogleMap>
  );
}

export default React.memo(GoogleMapView);
