/**
 * Maps.js - Google Maps integration for the Roehampton Ride Sharing app
 */

// Global map variable
let map;
let autocomplete;
let directionsService;
let directionsRenderer;

// Initialize the Google Map
function initMap() {
    // Roehampton University coordinates
    const roehamptonCoords = { lat: 51.4567, lng: -0.2456 };
    
    // Initialize the map centered at Roehampton
    map = new google.maps.Map(document.getElementById('map'), {
        center: roehamptonCoords,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
    });
    
    // Add a marker for Roehampton University
    const roehamptonMarker = new google.maps.Marker({
        position: roehamptonCoords,
        map: map,
        title: 'University of Roehampton',
        icon: {
            url: '/images/map-marker.png',
            scaledSize: new google.maps.Size(35, 35)
        }
    });
    
    // Initialize the directions service and renderer
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: '#4285F4',
            strokeWeight: 5
        }
    });
    
    // Check if we have location input fields
    const pickupInput = document.getElementById('pickup_location');
    if (pickupInput) {
        // Create autocomplete for the pickup location
        autocomplete = new google.maps.places.Autocomplete(pickupInput, {
            componentRestrictions: { country: 'gb' },
            fields: ['geometry', 'name', 'formatted_address'],
            strictBounds: false,
            types: ['address', 'establishment', 'geocode']
        });
        
        // Listen for place selection
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry) {
                // User didn't select a prediction
                return;
            }
            
            // Center map on selected location
            map.setCenter(place.geometry.location);
            map.setZoom(15);
            
            // Add marker for pickup location
            const pickupMarker = new google.maps.Marker({
                position: place.geometry.location,
                map: map,
                title: place.name,
                animation: google.maps.Animation.DROP,
                icon: {
                    url: '/images/pickup-marker.png',
                    scaledSize: new google.maps.Size(30, 30)
                }
            });
            
            // Calculate route to Roehampton
            calculateRoute(place.geometry.location, roehamptonCoords);
        });
    }
    
    // Additional setup for ride details page
    const pickupLocationText = document.getElementById('pickup_location_text');
    if (pickupLocationText) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: pickupLocationText.textContent + ', London, UK' }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const pickupLocation = results[0].geometry.location;
                
                // Center map on pickup location
                map.setCenter(pickupLocation);
                map.setZoom(14);
                
                // Add marker for pickup location
                const pickupMarker = new google.maps.Marker({
                    position: pickupLocation,
                    map: map,
                    title: 'Pickup Location',
                    animation: google.maps.Animation.DROP,
                    icon: {
                        url: '/images/pickup-marker.png',
                        scaledSize: new google.maps.Size(30, 30)
                    }
                });
                
                // Calculate route to Roehampton
                calculateRoute(pickupLocation, roehamptonCoords);
            }
        });
    }
}

// Calculate and display route
function calculateRoute(origin, destination) {
    directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
    }, (response, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(response);
            
            // Display distance and duration if elements exist
            const distanceElement = document.getElementById('route_distance');
            const durationElement = document.getElementById('route_duration');
            
            if (distanceElement && durationElement) {
                const route = response.routes[0];
                const leg = route.legs[0];
                distanceElement.textContent = leg.distance.text;
                durationElement.textContent = leg.duration.text;
            }
        }
    });
}

// Calculate estimated arrival time
function calculateEstimatedArrival(departureTime, durationMinutes) {
    const departure = new Date(departureTime);
    const arrival = new Date(departure.getTime() + durationMinutes * 60000);
    
    return arrival.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Search for rides based on map selection
function searchRidesFromMap() {
    const place = autocomplete.getPlace();
    if (!place || !place.geometry) {
        return;
    }
    
    const locationName = place.name || place.formatted_address;
    window.location.href = `/rides?pickup=${encodeURIComponent(locationName)}`;
}

// DOM ready function
document.addEventListener('DOMContentLoaded', function() {
    // Check if map container exists
    if (document.getElementById('map')) {
        // Map will be initialized by the Google Maps API callback
    }
    
    // Hook up search button if it exists
    const searchBtn = document.getElementById('search_rides_btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchRidesFromMap);
    }
});