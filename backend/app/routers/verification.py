from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.provider import Provider
from app.schemas.verification import (
    ProviderVerificationRequest,
    ProviderVerificationResponse,
    DocumentUpload,
)
from app.services.document_verification import DocumentVerificationService
from app.services.file_upload import FileUploadService
from datetime import datetime

router = APIRouter()
file_upload_service = FileUploadService()


@router.post("/submit", response_model=ProviderVerificationResponse)
async def submit_provider_verification(
    verification_data: ProviderVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit provider verification request with documents
    Auto-approves if documents pass validation
    """
    
    # Check if user is a provider
    if current_user.user_type != "provider":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only providers can submit verification requests"
        )
    
    # Check if provider profile exists
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    
    if not provider:
        # Create provider profile if doesn't exist
        provider = Provider(
            user_id=current_user.id,
            services=verification_data.services,
            pricing=verification_data.pricing,
            experience_years=verification_data.experience_years,
            service_radius=verification_data.service_radius,
            approved=False,
        )
        db.add(provider)
        db.commit()
        db.refresh(provider)
    
    # Validate work experience
    work_validation = DocumentVerificationService.validate_work_experience(
        verification_data.experience_years,
        verification_data.services,
        verification_data.work_description
    )
    
    if not work_validation["is_valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=work_validation["message"]
        )
    
    # Prepare documents for verification
    documents = [
        {
            "document_type": doc.document_type,
            "document_url": doc.document_url
        }
        for doc in verification_data.documents
    ]
    
    # Verify documents
    verification_result = DocumentVerificationService.verify_provider_documents(documents)
    
    # Update provider with document URLs
    provider.documents = [doc.document_url for doc in verification_data.documents]
    provider.services = verification_data.services
    provider.pricing = verification_data.pricing
    provider.experience_years = verification_data.experience_years
    provider.service_radius = verification_data.service_radius
    
    # Set approval status based on verification
    provider.approved = verification_result["approved"]
    
    db.commit()
    db.refresh(provider)
    
    return ProviderVerificationResponse(
        provider_id=str(provider.provider_id),
        verification_status=verification_result["verification_status"],
        message=verification_result["message"],
        submitted_at=datetime.utcnow()
    )


@router.post("/upload-document")
async def upload_document(
    document_type: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a single document and return the URL
    """
    
    if current_user.user_type != "provider":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only providers can upload documents"
        )
    
    # Validate file type
    allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
    file_extension = file.filename.split('.')[-1].lower()
    
    if f'.{file_extension}' not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024  # 5MB
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 5MB"
        )
    
    try:
        # Upload file using file upload service
        # For demo: return a placeholder URL
        # In production: upload to S3/Cloud Storage
        
        file_url = f"https://storage.homehero.com/documents/{current_user.id}/{document_type}/{file.filename}"
        
        # In production, actually upload the file:
        # file_url = await file_upload_service.upload_file(file, f"provider_docs/{current_user.id}")
        
        return {
            "success": True,
            "document_url": file_url,
            "document_type": document_type,
            "filename": file.filename,
            "message": "Document uploaded successfully"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )


@router.get("/status")
async def get_verification_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get provider verification status
    """
    
    if current_user.user_type != "provider":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only providers can check verification status"
        )
    
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    
    if not provider:
        return {
            "verification_status": "not_submitted",
            "message": "No verification request found. Please submit your documents.",
            "approved": False
        }
    
    if provider.approved:
        status_message = "approved"
        message = "Your profile has been approved! You can now receive bookings."
    elif provider.documents and len(provider.documents) > 0:
        status_message = "pending"
        message = "Your documents are under review. We'll notify you once approved."
    else:
        status_message = "not_submitted"
        message = "Please submit your documents for verification."
    
    return {
        "verification_status": status_message,
        "message": message,
        "approved": provider.approved,
        "documents_count": len(provider.documents) if provider.documents else 0,
        "services": provider.services,
        "experience_years": provider.experience_years,
    }
