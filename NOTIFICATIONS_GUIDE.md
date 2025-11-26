# Real-time Notifications Guide

## Overview
HomeHero now includes a real-time notification system that keeps users informed about booking updates, payments, reviews, and other important events.

## Implementation Details

### Architecture
The notification system uses **polling** to fetch updates every 30 seconds. This approach is:
- ✅ Simple to implement
- ✅ Works across all browsers
- ✅ No special server requirements
- ✅ Easy to deploy

For production with high traffic, consider upgrading to **WebSocket** for true real-time updates with lower server load.

## Features

### For Customers
- 📬 Booking confirmation notifications
- ✅ Booking acceptance by provider
- ❌ Booking cancellation alerts
- 🎉 Service completion notifications
- ⭐ New review responses
- 💰 Payment confirmations

### For Providers
- 📥 New booking requests
- 💳 Payment received notifications
- ⭐ New customer reviews
- 📊 Booking statistics updates
- 🔔 System announcements

### UI Features
- 🔴 **Badge**: Shows unread count on bell icon
- 🔔 **Dropdown**: Clean notification panel in navbar
- ✨ **Icons**: Visual notification types (✅❌🎉💰⭐)
- ⏱️ **Timestamps**: "Just now", "5m ago", "2h ago"
- ✓ **Mark as read**: Individual or bulk actions
- 🗑️ **Delete**: Remove notifications
- 🖥️ **Browser notifications**: Desktop alerts (optional)

## Files Created

### 1. `services/notifications.js`
Handles all notification API calls:
- `getNotifications()` - Fetch all notifications
- `markNotificationAsRead(id)` - Mark single as read
- `markAllNotificationsAsRead()` - Mark all as read
- `deleteNotification(id)` - Delete notification
- `startNotificationPolling(callback, interval)` - Start polling

### 2. `context/NotificationContext.jsx`
React context for notification state management:
- Manages notification list and unread count
- Starts/stops polling based on auth status
- Provides notification actions to components
- Handles browser notification permissions

### 3. `components/NotificationBell.jsx`
UI component displayed in navbar:
- Bell icon with unread badge
- Dropdown panel with notification list
- Mark as read / delete actions
- Time ago formatting
- Empty state handling

## Setup Instructions

### Frontend Integration

The notification system is already integrated into:
- ✅ `App.jsx` - NotificationProvider wraps the app
- ✅ `Navbar.jsx` - NotificationBell component added
- ✅ Auto-polling when user is authenticated

### Backend Requirements

Your backend needs these API endpoints:

#### 1. Get Notifications
```
GET /api/notifications
Authorization: Bearer {token}

Response:
[
  {
    "notification_id": "uuid",
    "user_id": "uuid",
    "type": "booking_confirmed",
    "message": "Your booking has been confirmed",
    "is_read": false,
    "created_at": "2025-11-26T10:30:00Z"
  }
]
```

#### 2. Mark as Read
```
PUT /api/notifications/{notification_id}/read
Authorization: Bearer {token}

Response: { "success": true }
```

#### 3. Mark All as Read
```
PUT /api/notifications/read-all
Authorization: Bearer {token}

Response: { "success": true, "updated_count": 5 }
```

#### 4. Delete Notification
```
DELETE /api/notifications/{notification_id}
Authorization: Bearer {token}

Response: { "success": true }
```

## Notification Types

The system recognizes these notification types:

| Type | Icon | Usage |
|------|------|-------|
| `booking_confirmed` | ✅ | Booking accepted by provider |
| `booking_cancelled` | ❌ | Booking cancelled |
| `booking_completed` | 🎉 | Service completed |
| `payment_received` | 💰 | Payment successful |
| `new_review` | ⭐ | New review received |
| `system_announcement` | 📢 | Admin announcements |

## Usage

### Access Notifications Anywhere

Use the `useNotifications` hook in any component:

```jsx
import { useNotifications } from '../context/NotificationContext';

function MyComponent() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    removeNotification,
    refreshNotifications 
  } = useNotifications();

  return (
    <div>
      <p>You have {unreadCount} unread notifications</p>
      {notifications.map(n => (
        <div key={n.notification_id}>{n.message}</div>
      ))}
    </div>
  );
}
```

### Create Notification (Backend)

When an event occurs, create a notification:

```python
# Python/FastAPI example
async def create_notification(user_id: str, notification_type: str, message: str):
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        message=message,
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(notification)
    await db.commit()
```

### Trigger Scenarios

**When a booking is created:**
```python
await create_notification(
    provider_id,
    "new_booking",
    f"New booking request from {customer_name}"
)
```

**When booking is confirmed:**
```python
await create_notification(
    customer_id,
    "booking_confirmed",
    f"Your booking with {provider_name} has been confirmed"
)
```

**When payment is received:**
```python
await create_notification(
    provider_id,
    "payment_received",
    f"Payment of ₹{amount} received for booking #{booking_id}"
)
```

## Browser Notifications

Desktop notifications are automatically requested when the app loads.

### Enable Browser Notifications
1. User sees browser permission prompt
2. User clicks "Allow"
3. Notifications appear even when tab is inactive

### Test Browser Notifications
```javascript
// Test notification
new Notification('HomeHero', {
  body: 'This is a test notification',
  icon: '/favicon.ico',
});
```

## Polling Configuration

Default polling interval: **30 seconds**

To change interval, edit `NotificationContext.jsx`:

```javascript
// Poll every 15 seconds instead
const stopPolling = startNotificationPolling(handleNewNotifications, 15000);
```

**Recommended intervals:**
- Development: 10-15 seconds
- Production (low traffic): 30 seconds
- Production (high traffic): 60 seconds or switch to WebSocket

## Performance Optimization

### Current Implementation (Polling)
- ✅ Simple and reliable
- ✅ Works everywhere
- ⚠️ Some server load with many users
- ⚠️ 30-second delay for updates

### Upgrade to WebSocket (Recommended for Production)

Benefits:
- ⚡ Instant notifications (no delay)
- 📉 Lower server load
- 🔥 True real-time experience

Implementation:
```javascript
// Replace polling with WebSocket
const ws = new WebSocket('wss://your-domain.com/ws/notifications');

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  handleNewNotifications([notification]);
};
```

## Troubleshooting

### Notifications Not Appearing
1. Check if user is authenticated
2. Verify backend endpoints are working
3. Check browser console for errors
4. Ensure `NotificationProvider` wraps the app

### Polling Not Working
1. Check `isAuthenticated` status
2. Verify token in localStorage
3. Check network tab for API calls
4. Verify 30-second intervals in console

### Browser Notifications Not Showing
1. Check permission: `Notification.permission`
2. Request permission: `Notification.requestPermission()`
3. Ensure notifications are enabled in browser settings
4. Test with: `new Notification('Test', {body: 'Test'})`

### High Server Load
1. Increase polling interval (30s → 60s)
2. Implement caching on backend
3. Add rate limiting
4. Consider WebSocket upgrade

## Database Schema

Suggested notification table structure:

```sql
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user_notifications (user_id, created_at),
  INDEX idx_unread (user_id, is_read)
);
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only see their own notifications
3. **Validation**: Validate notification IDs before operations
4. **Rate Limiting**: Prevent notification spam
5. **XSS Prevention**: Sanitize notification messages
6. **SQL Injection**: Use parameterized queries

## Testing

### Manual Testing
1. Create a booking → Check for notification
2. Accept booking (provider) → Customer gets notification
3. Complete payment → Provider gets notification
4. Click bell icon → See notification list
5. Click notification → Marks as read
6. Click "Mark all read" → All marked as read
7. Delete notification → Removed from list

### Test Data
Create test notifications via API:

```bash
curl -X POST http://localhost:8000/api/notifications \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "booking_confirmed",
    "message": "Test notification message"
  }'
```

## Future Enhancements

- [ ] WebSocket implementation for real-time
- [ ] Notification preferences (email, SMS, push)
- [ ] Notification categories with filters
- [ ] Sound alerts for new notifications
- [ ] Notification history page
- [ ] Bulk delete operations
- [ ] Notification search
- [ ] Push notifications for mobile apps
- [ ] Email digest of notifications
- [ ] Notification templates

## Support

For issues with:
- **Polling**: Check NotificationContext.jsx
- **UI**: Check NotificationBell.jsx
- **API calls**: Check services/notifications.js
- **Backend**: Check your notification endpoints

## Migration from Polling to WebSocket

When ready to upgrade:

1. Install WebSocket library: `npm install socket.io-client`
2. Update backend with WebSocket support
3. Replace polling logic in `NotificationContext.jsx`
4. Test thoroughly
5. Deploy with monitoring

Example WebSocket implementation:

```javascript
import io from 'socket.io-client';

const socket = io('wss://your-domain.com', {
  auth: { token: localStorage.getItem('token') }
});

socket.on('notification', (data) => {
  handleNewNotifications([data]);
});
```
