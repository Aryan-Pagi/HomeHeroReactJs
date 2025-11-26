/**
 * Notification Service
 * Handles real-time notifications using polling
 * For production, consider upgrading to WebSocket for better performance
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Fetch unread notifications for the current user
 * @returns {Promise<Array>} List of notifications
 */
export const getNotifications = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise}
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/notifications/${notificationId}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise}
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/notifications/read-all`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise}
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/notifications/${notificationId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to delete notification:', error);
    throw error;
  }
};

/**
 * Start polling for notifications
 * @param {Function} callback - Called when new notifications arrive
 * @param {number} interval - Polling interval in milliseconds (default: 30000 = 30 seconds)
 * @returns {Function} Stop polling function
 */
export const startNotificationPolling = (callback, interval = 30000) => {
  let lastCheck = Date.now();
  
  const poll = async () => {
    try {
      const notifications = await getNotifications();
      const newNotifications = notifications.filter(
        n => new Date(n.created_at).getTime() > lastCheck
      );
      
      if (newNotifications.length > 0) {
        callback(newNotifications);
      }
      
      lastCheck = Date.now();
    } catch (error) {
      console.error('Polling error:', error);
    }
  };

  // Initial fetch
  poll();

  // Start polling
  const intervalId = setInterval(poll, interval);

  // Return stop function
  return () => clearInterval(intervalId);
};

export default {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  startNotificationPolling,
};
