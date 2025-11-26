import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  startNotificationPolling,
  getNotifications,
} from "../services/notifications";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

/**
 * Notification Provider
 * Manages real-time notifications with polling
 */
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [isAuthenticated]);

  // Handle new notifications from polling
  const handleNewNotifications = useCallback((newNotifications) => {
    setNotifications((prev) => [...newNotifications, ...prev]);
    setUnreadCount((prev) => prev + newNotifications.length);

    // Show browser notification if permitted
    if ("Notification" in window && Notification.permission === "granted") {
      newNotifications.forEach((notification) => {
        new Notification("HomeHero", {
          body: notification.message,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
        });
      });
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.notification_id === notificationId ? { ...n, is_read: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  // Remove notification
  const removeNotification = useCallback(
    (notificationId) => {
      setNotifications((prev) =>
        prev.filter((n) => n.notification_id !== notificationId)
      );
      setUnreadCount((prev) => {
        const notification = notifications.find(
          (n) => n.notification_id === notificationId
        );
        return notification && !notification.is_read ? prev - 1 : prev;
      });
    },
    [notifications]
  );

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Start polling when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchNotifications();

    // Start polling (every 30 seconds)
    const stopPolling = startNotificationPolling(handleNewNotifications, 30000);

    return () => {
      stopPolling();
    };
  }, [isAuthenticated, fetchNotifications, handleNewNotifications]);

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refreshNotifications: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to access notification context
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
}
