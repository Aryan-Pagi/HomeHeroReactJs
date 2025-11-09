import asyncio
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from app.models.booking import Booking, BookingStatus
from app.schemas.booking import BookingCreate, BookingUpdate
from app.services.notifications import notification_service


class BookingController:
    # create new booking
    @staticmethod
    def create_booking(
        db: Session, booking_data: BookingCreate, customer_id: str
    ) -> Booking:
        booking = Booking(**booking_data.model_dump(), customer_id=customer_id)
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return booking

    # get booking using booking id
    @staticmethod
    def get_booking(db: Session, booking_id: str) -> Booking:
        booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found"
            )
        return booking

    # update booking status
    @staticmethod
    def update_booking_status(
        db: Session, booking_id: str, status: BookingStatus
    ) -> Booking:
        booking = BookingController.get_booking(db, booking_id)
        booking.status = status
        db.commit()
        db.refresh(booking)
        return booking

    # get customer bookings
    @staticmethod
    def get_customer_bookings(db: Session, customer_id: str) -> List[Booking]:
        return db.query(Booking).filter(Booking.customer_id == customer_id).all()

    # get provider bookings
    @staticmethod
    def get_provider_bookings(db: Session, provider_id: str) -> List[Booking]:
        return db.query(Booking).filter(Booking.provider_id == provider_id).all()

    # get pending bookings
    @staticmethod
    def get_pending_bookings(db: Session, provider_id: str) -> List[Booking]:
        return (
            db.query(Booking)
            .filter(
                Booking.provider_id == provider_id,
                Booking.status == BookingStatus.PENDING,
            )
            .all()
        )

    # cancel a booking with reason
    @staticmethod
    def cancel_booking(
        db: Session,
        booking_id: str,
        user_id: str,
        reason: str,
        canceled_by: str = "customer",
    ) -> Booking:
        booking = BookingController.get_booking(db, booking_id)

        if canceled_by == "customer":
            if str(booking.customer_id) != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only cancel your own bookings",
                )

        elif canceled_by == "provider":
            from app.models.provider import Provider

            provider = (
                db.query(Provider)
                .filter(
                    Provider.user_id == user_id,
                    Provider.provider_id == booking.provider_id,
                )
                .first()
            )

            if not provider:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only cancel bookings assigned to you",
                )

        # check if booking can be completed
        if booking.status in [
            BookingStatus.COMPLETED,
            BookingStatus.CANCELED_BY_CUSTOMER,
            BookingStatus.CANCELED_BY_PROVIDER,
        ]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel booking with status: {booking.status}",
            )

        # update booking status
        if canceled_by == "customer":
            booking.status = BookingStatus.CANCELED_BY_CUSTOMER
        else:
            booking.status = BookingStatus.CANCELED_BY_PROVIDER

        booking.cancellation_reason = reason
        booking.canceled_by = canceled_by
        booking.canceled_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(booking)

        # sending notification
        try:
            if canceled_by == "customer":
                # Notify provider about cancellation
                provider_user = booking.provider.user
                asyncio.create_task(
                    notification_service.send_sms(
                        provider_user.phone,
                        f"Booking cancelled by customer. Service: {booking.service_type}. Reason: {reason}",
                    )
                )
            else:
                # Notify customer about provider cancellation
                customer_user = booking.customer
                asyncio.create_task(
                    notification_service.send_sms(
                        customer_user.phone,
                        f"Your booking has been cancelled by provider. We're finding you another provider.",
                    )
                )
        except Exception as e:
            # Don't fail the cancellation if notification fails
            print(f"Notification failed: {e}")

        return booking

    # reshedule booking to new date/time
    @staticmethod
    def reshedule_booking(
        db: Session,
        booking_id: str,
        customer_id: str,
        new_date_time: datetime,
        reason: Optional[str] = None,
    ) -> Booking:
        booking = BookingController.get_booking(db, booking_id)

        # verify if customer owns this booking
        if str(booking.customer_id) != customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only reschedule your own bookings",
            )

        # check if booking can be resheduled
        if booking.status not in [BookingStatus.PENDING, BookingStatus.ACCEPTED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reschedule booking with status: {booking.status}",
            )

        # check if new date is in the future
        if new_date_time <= datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New booking date must be in the future",
            )

        old_date = booking.date_time
        booking.date_time = new_date_time
        booking.status = BookingStatus.PENDING

        # Add reschedule note to special instructions
        reschedule_note = f"Rescheduled from {old_date.strftime('%Y-%m-%d %H:%M')}"
        if reason:
            reschedule_note += f" - Reason: {reason}"

        if booking.special_instructions:
            booking.special_instructions += f"\n{reschedule_note}"
        else:
            booking.special_instructions = reschedule_note

        db.commit()
        db.refresh(booking)

        # Notify provider about reschedule
        try:
            provider_user = booking.provider.user
            asyncio.create_task(
                notification_service.send_sms(
                    provider_user.phone,
                    f"Booking rescheduled to {new_date_time.strftime('%Y-%m-%d %H:%M')}. Please confirm.",
                )
            )
        except Exception as e:
            print(f"Notification failed: {e}")

        return booking

    # check if booking can be canceled
    @staticmethod
    def can_cancel_booking(booking: Booking) -> bool:
        cancellable_statuses = [BookingStatus.PENDING, BookingStatus.ACCEPTED]
        return booking.status in cancellable_statuses

    # check if booking can be resheduled
    @staticmethod
    def can_reshedule_booking(booking: Booking) -> bool:
        reschedulable_statuses = [BookingStatus.PENDING, BookingStatus.ACCEPTED]

        time_buffer = datetime.now(timezone.utc) + timedelta(hours=2)

        return (
            booking.status in reschedulable_statuses and booking.date_time > time_buffer
        )

    # mark booking as completed (customer only, after scheduled time)
    @staticmethod
    def mark_booking_completed(
        db: Session,
        booking_id: str,
        customer_id: str,
    ) -> Booking:
        booking = BookingController.get_booking(db, booking_id)

        # verify if customer owns this booking
        if str(booking.customer_id) != customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only complete your own bookings",
            )

        # check if booking is in accepted status
        if booking.status != BookingStatus.ACCEPTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Can only mark accepted bookings as completed. Current status: {booking.status}",
            )

        # check if scheduled time has passed
        if booking.date_time > datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot mark booking as completed before the scheduled time",
            )

        # update booking status
        booking.status = BookingStatus.COMPLETED
        db.commit()
        db.refresh(booking)

        # Notify provider about completion
        try:
            provider_user = booking.provider.user
            asyncio.create_task(
                notification_service.send_sms(
                    provider_user.phone,
                    f"Booking marked as completed by customer. Service: {booking.service_type}",
                )
            )
        except Exception as e:
            print(f"Notification failed: {e}")

        return booking
