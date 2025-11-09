from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DocumentUpload(BaseModel):
    document_type: str = Field(..., description="Type of document: id_proof, address_proof, work_certificate, license")
    document_url: str = Field(..., description="URL of uploaded document")


class ProviderVerificationRequest(BaseModel):
    services: List[str] = Field(..., description="Services offered")
    experience_years: int = Field(..., ge=0, description="Years of experience")
    pricing: float = Field(..., gt=0, description="Hourly pricing")
    service_radius: float = Field(default=10.0, ge=1, le=100, description="Service radius in km")
    documents: List[DocumentUpload] = Field(..., min_items=2, description="At least 2 documents required")
    work_description: Optional[str] = Field(None, max_length=1000, description="Description of work experience")


class ProviderVerificationResponse(BaseModel):
    provider_id: str
    verification_status: str  # pending, approved, rejected
    message: str
    submitted_at: datetime
    
    class Config:
        from_attributes = True


class DocumentVerificationResult(BaseModel):
    document_type: str
    is_valid: bool
    confidence_score: float
    extracted_info: dict
    verification_message: str
