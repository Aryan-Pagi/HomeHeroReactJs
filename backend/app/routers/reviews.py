from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_customer
from app.schemas.review import ReviewResponse, ReviewCreate, ReviewWithCustomer, ReviewUpdate
from app.controllers.review import ReviewController
from app.models.user import User

router = APIRouter()


# submit a review for provider
@router.post("/", response_model=dict)
async def current_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    ReviewController.create_review(db, review_data, str(current_user.id))
    return {"message": "Review submitted"}


# get all reviews for a provider
@router.get("/provider/{provider_id}", response_model=List[ReviewWithCustomer])
async def get_provider_reviews(provider_id: str, db: Session = Depends(get_db)):
    return ReviewController.get_provider_reviews(db, provider_id)


# get current user's reviews (customer or provider)
@router.get("/my-reviews", response_model=List[ReviewResponse])
async def get_my_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.user_type == "provider":
        return ReviewController.get_my_provider_reviews(db, str(current_user.id))
    else:
        return ReviewController.get_customer_reviews(db, str(current_user.id))


# get review by id
@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(
    review_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ReviewController.get_review(db, review_id)


# update review
@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: str,
    review_data: ReviewUpdate,
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    return ReviewController.update_review(
        db, review_id, review_data.rating, review_data.comment, str(current_user.id)
    )


# delete review
@router.delete("/{review_id}", response_model=dict)
async def delete_review(
    review_id: str,
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    ReviewController.delete_review(db, review_id, str(current_user.id))
    return {"message": "Review deleted successfully"}
