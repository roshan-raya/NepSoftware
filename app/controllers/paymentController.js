const RideModel = require('../models/rideModel');
const PaymentModel = require('../models/paymentModel');

class PaymentController {
    // Calculate distance between two points in kilometers using Haversine formula
    static calculateDistance(lat1, lng1, lat2, lng2) {
        const radius = 6371; // Radius of the Earth in kilometers
        const dLat = PaymentController.deg2rad(lat2 - lat1);
        const dLng = PaymentController.deg2rad(lng2 - lng1);
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(PaymentController.deg2rad(lat1)) * Math.cos(PaymentController.deg2rad(lat2)) * 
            Math.sin(dLng/2) * Math.sin(dLng/2); 
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const distance = radius * c; // Distance in kilometers
        
        return distance;
    }
    
    // Convert degrees to radians
    static deg2rad(deg) {
        return deg * (Math.PI/180);
    }
    
    // Calculate fare based on distance and ride type
    static calculateFare(distance, category = 'Campus Routes') {
        // Base fare
        let baseFare = 2.00;
        
        // Rate per kilometer
        let ratePerKm = 0.50;
        
        // Adjust rates based on category
        switch (category) {
            case 'Shopping Trips':
                baseFare = 3.00;
                ratePerKm = 0.60;
                break;
            case 'Airport Transfers':
                baseFare = 10.00;
                ratePerKm = 0.80;
                break;
            case 'Special Events':
                baseFare = 5.00;
                ratePerKm = 0.70;
                break;
            case 'Weekend Getaways':
                baseFare = 8.00;
                ratePerKm = 0.75;
                break;
        }
        
        // Calculate total fare
        const totalFare = baseFare + (distance * ratePerKm);
        
        // Round to 2 decimal places
        return Math.round(totalFare * 100) / 100;
    }
    
    // Process ride payment after acceptance
    static async processRidePayment(req, res) {
        try {
            const rideId = parseInt(req.params.rideId, 10);
            const requestId = parseInt(req.params.requestId, 10);
            const userId = req.session.userId;
            
            // Get ride details
            const ride = await RideModel.getRideById(rideId);
            
            if (!ride) {
                return res.status(404).render('error', {
                    title: 'Ride Not Found',
                    message: 'The requested ride does not exist.'
                });
            }
            
            // Check if coordinates exist for distance calculation
            if (!ride.pickup_lat || !ride.pickup_lng || !ride.destination_lat || !ride.destination_lng) {
                return res.render('payment', {
                    title: 'Payment Required',
                    ride,
                    requestId,
                    error: 'Distance calculation not possible. Coordinates missing.',
                    estimatedFare: 0,
                    distance: 0
                });
            }
            
            // Calculate distance
            const distance = PaymentController.calculateDistance(
                parseFloat(ride.pickup_lat),
                parseFloat(ride.pickup_lng),
                parseFloat(ride.destination_lat),
                parseFloat(ride.destination_lng)
            );
            
            // Calculate fare
            const estimatedFare = PaymentController.calculateFare(distance, ride.category);
            
            // Store the fare in the ride request
            await RideModel.updateRideRequestFare(requestId, estimatedFare);
            
            // Render payment page
            res.render('payment', {
                title: 'Payment Required',
                ride,
                requestId,
                estimatedFare,
                distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
            });
            
        } catch (error) {
            console.error('Error in processRidePayment:', error);
            res.status(500).render('error', {
                title: 'Payment Error',
                message: 'An error occurred while processing the payment.',
                error: {
                    status: 500,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : ''
                }
            });
        }
    }
    
    // Confirm payment
    static async confirmPayment(req, res) {
        try {
            const rideId = parseInt(req.params.rideId, 10);
            const requestId = parseInt(req.params.requestId, 10);
            const userId = req.session.userId;
            const { paymentMethod, amount } = req.body;
            
            // Check payment method
            if (!paymentMethod) {
                return res.status(400).render('payment', {
                    title: 'Payment Required',
                    ride: await RideModel.getRideById(rideId),
                    requestId,
                    estimatedFare: amount,
                    error: 'Please select a payment method'
                });
            }
            
            // Create payment record - ensure amount is stored as a number
            const paymentId = await PaymentModel.createPayment({
                rideId,
                requestId,
                passengerId: userId,
                amount: parseFloat(amount),
                method: paymentMethod,
                status: 'completed'
            });
            
            // Update request status to paid
            await RideModel.updateRideRequestPaymentStatus(requestId, 'paid');
            
            // Redirect to receipt page
            res.redirect(`/payment/${paymentId}/receipt`);
            
        } catch (error) {
            console.error('Error in confirmPayment:', error);
            res.status(500).render('error', {
                title: 'Payment Error',
                message: 'An error occurred while confirming the payment.',
                error: {
                    status: 500,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : ''
                }
            });
        }
    }
    
    // Display payment receipt
    static async showReceipt(req, res) {
        try {
            const paymentId = parseInt(req.params.paymentId, 10);
            
            // Get payment details
            const payment = await PaymentModel.getPaymentById(paymentId);
            
            if (!payment) {
                return res.status(404).render('error', {
                    title: 'Payment Not Found',
                    message: 'The requested payment record does not exist.'
                });
            }
            
            // Get ride details
            const ride = await RideModel.getRideById(payment.ride_id);
            
            // Render receipt page
            res.render('receipt', {
                title: 'Payment Receipt',
                payment,
                ride
            });
            
        } catch (error) {
            console.error('Error in showReceipt:', error);
            res.status(500).render('error', {
                title: 'Receipt Error',
                message: 'An error occurred while displaying the receipt.',
                error: {
                    status: 500,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : ''
                }
            });
        }
    }
    
    // List payments for a user
    static async listUserPayments(req, res) {
        try {
            const userId = req.session.userId;
            
            // Get user's payments
            const payments = await PaymentModel.getPaymentsByUser(userId);
            
            // Render payments page
            res.render('payments_list', {
                title: 'Your Payments',
                payments
            });
            
        } catch (error) {
            console.error('Error in listUserPayments:', error);
            res.status(500).render('error', {
                title: 'Payments Error',
                message: 'An error occurred while retrieving your payments.',
                error: {
                    status: 500,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : ''
                }
            });
        }
    }
}

module.exports = PaymentController; 