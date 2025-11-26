from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.notification import NotificationResponse, NotificationCreate
from app.models.notification import Notification
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all notifications for the current user"""
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return notifications


@router.put("/{notification_id}/read", response_model=dict)
async def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a specific notification as read"""
    notification = (
        db.query(Notification)
        .filter(
            Notification.notification_id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    notification.is_read = True
    notification.updated_at = datetime.utcnow()
    db.commit()

    return {"success": True, "message": "Notification marked as read"}


@router.put("/read-all", response_model=dict)
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read for the current user"""
    updated_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
        .update({"is_read": True, "updated_at": datetime.utcnow()})
    )
    db.commit()

    return {
        "success": True,
        "message": f"Marked {updated_count} notifications as read",
        "updated_count": updated_count,
    }


@router.delete("/{notification_id}", response_model=dict)
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a specific notification"""
    notification = (
        db.query(Notification)
        .filter(
            Notification.notification_id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    db.delete(notification)
    db.commit()

    return {"success": True, "message": "Notification deleted"}


@router.post("/create", response_model=NotificationResponse)
async def create_notification(
    notification_data: NotificationCreate,
    db: Session = Depends(get_db),
):
    """Create a new notification (typically called by system, not users)"""
    notification = Notification(
        user_id=notification_data.user_id,
        type=notification_data.type,
        message=notification_data.message,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification
