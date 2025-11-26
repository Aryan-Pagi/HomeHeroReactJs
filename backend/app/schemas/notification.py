from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class NotificationBase(BaseModel):
    type: str = Field(..., description="Type of notification (e.g., booking_confirmed, payment_received)")
    message: str = Field(..., description="Notification message")


class NotificationCreate(NotificationBase):
    user_id: UUID


class NotificationResponse(NotificationBase):
    notification_id: UUID
    user_id: UUID
    is_read: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationUpdate(BaseModel):
    is_read: bool = True
