/**
 * Authentication utilities for ride sharing app
 * Handles login/signup redirects for protected features
 */

document.addEventListener('DOMContentLoaded', function() {
  // Auth required buttons handler
  const authButtons = document.querySelectorAll('.auth-required');
  if (authButtons.length > 0) {
    const authModal = new bootstrap.Modal(document.getElementById('authModal'));
    
    authButtons.forEach(button => {
      button.addEventListener('click', function() {
        const action = this.getAttribute('data-action');
        const rideId = this.getAttribute('data-ride-id');
        
        // Show the modal
        authModal.show();
        
        // Store the intended action and ride ID for redirect after login
        localStorage.setItem('intended_action', action);
        if (rideId) {
          localStorage.setItem('intended_ride_id', rideId);
        }
        
        // Update login links to include the redirect after authentication
        const loginLink = document.querySelector('#authModal a[href="/users/login"]');
        const signupLink = document.querySelector('#authModal a[href="/users/signup"]');
        
        if (loginLink) {
          loginLink.addEventListener('click', function(e) {
            // We'll handle the redirect in the login page
            // Just make sure the localStorage values are set
            console.log('Login clicked, redirect will be handled after auth');
          });
        }
        
        if (signupLink) {
          signupLink.addEventListener('click', function(e) {
            // We'll handle the redirect in the signup page
            console.log('Signup clicked, redirect will be handled after auth');
          });
        }
      });
    });
  }
  
  // Check if we need to handle post-login redirects
  const handlePostAuthRedirect = () => {
    const intendedAction = localStorage.getItem('intended_action');
    const intendedRideId = localStorage.getItem('intended_ride_id');
    
    if (intendedAction) {
      switch(intendedAction) {
        case 'offer':
          window.location.href = '/rides/offer';
          break;
        case 'book':
        case 'request':
          if (intendedRideId) {
            window.location.href = `/rides/${intendedRideId}`;
          } else {
            window.location.href = '/rides';
          }
          break;
        default:
          // No specific action, do nothing
          break;
      }
      
      // Clear the storage after redirecting
      localStorage.removeItem('intended_action');
      localStorage.removeItem('intended_ride_id');
      
      return true; // Indicate that we handled a redirect
    }
    
    return false; // No redirect was needed
  };
  
  // Only run the redirect check if the user is authenticated
  const isAuthenticated = document.body.classList.contains('authenticated') || 
                        document.cookie.includes('connect.sid');
  
  if (isAuthenticated) {
    handlePostAuthRedirect();
  }
}); 