import cloudinary
import cloudinary.uploader
import cloudinary.api
from fastapi import HTTPException, status, UploadFile
from typing import List, Optional
import uuid

from app.core.config import settings


# handle file uploads using cloudinary
class FileUploadService:
    def __init__(self):
        self.enabled = all(
            [
                settings.CLOUDINARY_CLOUD_NAME,
                settings.CLOUDINARY_API_KEY,
                settings.CLOUDINARY_API_SECRET,
            ]
        )
        
        if self.enabled:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
            )

    # upload file image to cloudinary
    async def upload_image(
        self, file: UploadFile, folder: str = "homehero", max_size_mb: int = 5
    ) -> dict:
        if not self.enabled:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="File upload service not configured",
            )
        
        # validate file
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are allowed",
            )

        # check file size
        file_size = 0
        content = await file.read()
        file_size = len(content)

        if file_size > max_size_mb * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size must not exceed {max_size_mb}MB",
            )

        try:
            # generate unique file name
            unique_filename = f"{uuid.uuid4()}_{file.filename}"

            # upload to clodinary
            result = cloudinary.uploader.upload(
                content,
                folder=folder,
                public_id=unique_filename,
                resource_type="image",
                transformation=[{"quality": "auto:good"}, {"fetch_format": "auto"}],
            )

            return {
                "public_id": result["public_id"],
                "url": result["secure_url"],
                "width": result["width"],
                "height": result["height"],
                "format": result["format"],
                "bytes": result["bytes"],
            }

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"File upload failed: {str(e)}",
            )

    # upload multiple image files
    async def upload_multiple_images(
        self, files: List[UploadFile], folder: str = "homehero", max_files: int = 5
    ) -> List[dict]:

        if len(files) > max_files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum {max_files} files allowed",
            )

        uploaded_file = []
        for file in files:
            result = await self.upload_image(file, folder)
            uploaded_file.append(result)

        return uploaded_file

    # delete an image from cloudinary
    def delete_image(self, public_id: str) -> bool:
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get("result") == "ok"
        except Exception:
            return False

    # Get optimizeed image url
    def get_optimized_url(
        self, public_id: str, width: int = 300, height: int = 300, crop: str = "fill"
    ) -> str:
        try:
            url = cloudinary.CloudinaryImage(public_id).build_url(
                width=width,
                height=height,
                crop=crop,
                quality="auto:good",
                fetch_format="auto",
            )
        except Exception:
            return ""
