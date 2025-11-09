import re
from typing import Dict, List
from datetime import datetime


class DocumentVerificationService:
    """
    Automated document verification service
    In production, this would integrate with services like:
    - AWS Textract for OCR
    - Third-party KYC APIs
    - Government verification APIs
    """

    REQUIRED_DOCUMENT_TYPES = ["id_proof", "address_proof"]
    OPTIONAL_DOCUMENT_TYPES = ["work_certificate", "license", "certification"]
    
    VALID_ID_PROOFS = ["aadhar", "passport", "driving_license", "voter_id", "pan"]
    VALID_ADDRESS_PROOFS = ["aadhar", "passport", "utility_bill", "rental_agreement"]

    @staticmethod
    def verify_document(document_type: str, document_url: str) -> Dict:
        """
        Verify a single document
        For demo: Basic validation based on document type and URL pattern
        In production: Use OCR and AI verification
        """
        
        # Basic validation
        if not document_url or len(document_url) < 10:
            return {
                "is_valid": False,
                "confidence_score": 0.0,
                "extracted_info": {},
                "verification_message": "Invalid document URL"
            }
        
        # Check if document type is valid
        if document_type not in (DocumentVerificationService.REQUIRED_DOCUMENT_TYPES + 
                                DocumentVerificationService.OPTIONAL_DOCUMENT_TYPES):
            return {
                "is_valid": False,
                "confidence_score": 0.0,
                "extracted_info": {},
                "verification_message": f"Invalid document type: {document_type}"
            }
        
        # Simulate document verification
        # In production, this would:
        # 1. Download/fetch the document
        # 2. Run OCR to extract text
        # 3. Validate format and data
        # 4. Check against databases
        
        extracted_info = {
            "document_type": document_type,
            "verified_at": datetime.utcnow().isoformat(),
            "verification_method": "automated_ocr"
        }
        
        # For demo: Accept if document URL is valid
        confidence_score = 0.85 if document_url.startswith(('http://', 'https://')) else 0.3
        
        is_valid = confidence_score >= 0.7
        
        return {
            "is_valid": is_valid,
            "confidence_score": confidence_score,
            "extracted_info": extracted_info,
            "verification_message": "Document verified successfully" if is_valid else "Document verification failed"
        }

    @staticmethod
    def verify_provider_documents(documents: List[Dict]) -> Dict:
        """
        Verify all provider documents and return overall verification result
        """
        
        if not documents or len(documents) < 2:
            return {
                "approved": False,
                "verification_status": "rejected",
                "message": "At least 2 documents required (ID proof and Address proof)",
                "document_results": []
            }
        
        # Extract document types
        document_types = [doc.get("document_type") for doc in documents]
        
        # Check if required documents are present
        has_id_proof = any(dt == "id_proof" for dt in document_types)
        has_address_proof = any(dt == "address_proof" for dt in document_types)
        
        if not has_id_proof:
            return {
                "approved": False,
                "verification_status": "rejected",
                "message": "ID proof is required",
                "document_results": []
            }
        
        if not has_address_proof:
            return {
                "approved": False,
                "verification_status": "rejected",
                "message": "Address proof is required",
                "document_results": []
            }
        
        # Verify each document
        document_results = []
        all_valid = True
        total_confidence = 0.0
        
        for doc in documents:
            result = DocumentVerificationService.verify_document(
                doc.get("document_type", ""),
                doc.get("document_url", "")
            )
            document_results.append({
                "document_type": doc.get("document_type"),
                **result
            })
            
            if not result["is_valid"]:
                all_valid = False
            total_confidence += result["confidence_score"]
        
        avg_confidence = total_confidence / len(documents) if documents else 0
        
        # Auto-approve if all documents valid and high confidence
        if all_valid and avg_confidence >= 0.75:
            return {
                "approved": True,
                "verification_status": "approved",
                "message": "All documents verified successfully. Provider approved!",
                "document_results": document_results,
                "confidence_score": avg_confidence
            }
        elif all_valid and avg_confidence >= 0.5:
            return {
                "approved": False,
                "verification_status": "pending",
                "message": "Documents submitted for manual review",
                "document_results": document_results,
                "confidence_score": avg_confidence
            }
        else:
            return {
                "approved": False,
                "verification_status": "rejected",
                "message": "Document verification failed. Please upload valid documents.",
                "document_results": document_results,
                "confidence_score": avg_confidence
            }

    @staticmethod
    def validate_work_experience(experience_years: int, services: List[str], work_description: str = None) -> Dict:
        """
        Validate work experience claims
        """
        if experience_years < 0 or experience_years > 50:
            return {
                "is_valid": False,
                "message": "Invalid experience years"
            }
        
        if not services or len(services) == 0:
            return {
                "is_valid": False,
                "message": "At least one service must be specified"
            }
        
        # For providers with high experience, require work description
        if experience_years >= 5 and not work_description:
            return {
                "is_valid": False,
                "message": "Work description required for providers with 5+ years experience"
            }
        
        return {
            "is_valid": True,
            "message": "Work experience validated"
        }
