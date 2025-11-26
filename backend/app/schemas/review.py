from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from app.schemas.user import UserResponse

class ReviewBase(BaseModel):
    rating: float
    comment: Optional[str] = None
    images: List[str] = []
    
class ReviewCreate(ReviewBase):
    booking_id: UUID

class ReviewUpdate(BaseModel):
    rating: float
    comment: Optional[str] = None
    
class ReviewResponse(ReviewBase):
    review_id: UUID
    booking_id: UUID
    customer_id: UUID
    provider_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
        
class ReviewWithCustomer(ReviewResponse):
    customer: UserResponse