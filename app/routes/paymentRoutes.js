const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Route to process payment for a ride request
router.get("/rides/:rideId/requests/:requestId/pay", isAuthenticated, PaymentController.processRidePayment);

// Route to confirm payment
router.post("/rides/:rideId/requests/:requestId/pay", isAuthenticated, PaymentController.confirmPayment);

// Route to show payment receipt
router.get("/:paymentId/receipt", isAuthenticated, PaymentController.showReceipt);

// Route to list user's payments
router.get("/history", isAuthenticated, PaymentController.listUserPayments);

module.exports = router; 