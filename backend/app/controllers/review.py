from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List

from app.models.review import Review
from app.models.booking import Booking, BookingStatus
from app.schemas.review import ReviewCreate
from app.controllers.provider import ProviderController


class ReviewController:
    # create new review
    @staticmethod
    def create_review(
        db: Session, review_data: ReviewCreate, customer_id: str
    ) -> Review:
        # verify booking exists and is completed
        booking = (
            db.query(Booking)
            .filter(
                Booking.booking_id == review_data.booking_id,
                Booking.customer_id == customer_id,
                Booking.status == BookingStatus.COMPLETED,
            )
            .first()
        )

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid booking or booking not completed",
            )

        # check if review already exists
        existing_review = (
            db.query(Review).filter(Review.booking_id == review_data.booking_id).first()
        )
        if existing_review:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Review already exists for this booking",
            )

        review = Review(
            **review_data.model_dump(),
            customer_id=customer_id,
            provider_id=booking.provider_id
        )
        db.add(review)
        db.commit()
        db.refresh(review)

        # update provider rating
        ProviderController.update_rating(db, booking.provider_id, review.rating)

        return review

    # get provider reviews
    @staticmethod
    def get_provider_reviews(db: Session, provider_id: str) -> List[Review]:
        return db.query(Review).filter(Review.provider_id == provider_id).all()

    # get review based on id
    @staticmethod
    def get_review(db: Session, review_id: str) -> Review:
        review = db.query(Review).filter(Review.review_id == review_id).first()
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Review not found"
            )
        return review

    # get reviews by customer
    @staticmethod
    def get_customer_reviews(db: Session, customer_id: str) -> List[Review]:
        return db.query(Review).filter(Review.customer_id == customer_id).all()

    # get reviews for provider (as provider)
    @staticmethod
    def get_my_provider_reviews(db: Session, provider_id: str) -> List[Review]:
        return db.query(Review).filter(Review.provider_id == provider_id).all()

    # update review
    @staticmethod
    def update_review(db: Session, review_id: str, rating: int, comment: str, customer_id: str) -> Review:
        review = db.query(Review).filter(
            Review.review_id == review_id,
            Review.customer_id == customer_id
        ).first()
        
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found or unauthorized"
            )

        old_rating = review.rating
        review.rating = rating
        review.comment = comment
        db.commit()
        db.refresh(review)

        # update provider rating
        if old_rating != rating:
            ProviderController.update_rating(db, review.provider_id, rating, old_rating)

        return review

    # delete review
    @staticmethod
    def delete_review(db: Session, review_id: str, customer_id: str) -> None:
        review = db.query(Review).filter(
            Review.review_id == review_id,
            Review.customer_id == customer_id
        ).first()
        
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found or unauthorized"
            )

        provider_id = review.provider_id
        rating = review.rating
        
        db.delete(review)
        db.commit()

        # update provider rating (remove this rating)
        ProviderController.update_rating(db, provider_id, 0, rating)
