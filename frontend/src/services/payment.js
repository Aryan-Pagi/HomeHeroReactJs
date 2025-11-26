/**
 * Payment Service
 * Handles payment gateway integration (Razorpay/Stripe)
 * Configure your payment gateway credentials in environment variables
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Initialize Razorpay payment
 * @param {Object} paymentData - Payment details
 * @returns {Promise} Payment order
 */
export const initiateRazorpayPayment = async (paymentData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/payments/razorpay/create-order`,
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Razorpay payment initiation failed:', error);
    throw error;
  }
};

/**
 * Verify Razorpay payment
 * @param {Object} paymentData - Payment verification details
 * @returns {Promise} Verification response
 */
export const verifyRazorpayPayment = async (paymentData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/payments/razorpay/verify`,
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Razorpay payment verification failed:', error);
    throw error;
  }
};

/**
 * Initialize Stripe payment
 * @param {Object} paymentData - Payment details
 * @returns {Promise} Payment intent
 */
export const initiateStripePayment = async (paymentData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/payments/stripe/create-payment-intent`,
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Stripe payment initiation failed:', error);
    throw error;
  }
};

/**
 * Load Razorpay script dynamically
 * @returns {Promise<boolean>}
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Load Stripe script dynamically
 * @returns {Promise<boolean>}
 */
export const loadStripeScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Get payment status
 * @param {string} paymentId - Payment ID
 * @returns {Promise} Payment status
 */
export const getPaymentStatus = async (paymentId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/payments/${paymentId}/status`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch payment status:', error);
    throw error;
  }
};

export default {
  initiateRazorpayPayment,
  verifyRazorpayPayment,
  initiateStripePayment,
  loadRazorpayScript,
  loadStripeScript,
  getPaymentStatus,
};
