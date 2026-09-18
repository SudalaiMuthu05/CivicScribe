from typing import Any

import cloudinary
import cloudinary.uploader

from config.settings import settings


# =========================================================
# CLOUDINARY CONFIGURATION
# =========================================================

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)


# =========================================================
# VALIDATION
# =========================================================

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}


MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB


def validate_image(
    filename: str | None,
    content_type: str | None,
    file_size: int | None = None,
) -> None:
    """
    Validate an uploaded image before sending it to Cloudinary.
    """

    if not filename:
        raise ValueError("Image filename is required.")

    if not content_type:
        raise ValueError("Image content type is required.")

    if content_type.lower() not in ALLOWED_IMAGE_TYPES:
        raise ValueError(
            "Unsupported image type. "
            "Please upload JPG, JPEG, PNG, or WEBP."
        )

    if file_size is not None and file_size > MAX_IMAGE_SIZE:
        raise ValueError(
            "Image is too large. Maximum allowed size is 10 MB."
        )


# =========================================================
# UPLOAD IMAGE
# =========================================================

def upload_image(
    file_bytes: bytes,
    filename: str,
    content_type: str,
) -> dict[str, Any]:
    """
    Upload an image to Cloudinary.

    Returns the important Cloudinary metadata required
    by the CivicScribe evidence table.
    """

    if not file_bytes:
        raise ValueError("Uploaded image is empty.")

    validate_image(
        filename=filename,
        content_type=content_type,
        file_size=len(file_bytes),
    )

    try:

        result = cloudinary.uploader.upload(
            file_bytes,
            folder="civicscribe/evidence",
            resource_type="image",
            use_filename=True,
            unique_filename=True,
            overwrite=False,
            secure=True,
        )

    except Exception as exc:

        print(f"Cloudinary upload error: {exc}")

        raise RuntimeError(
            "Failed to upload image to Cloudinary."
        ) from exc

    return {
        "cloudinary_public_id":
            result.get("public_id"),

        "cloudinary_url":
            result.get("secure_url")
            or result.get("url"),

        "cloudinary_resource_type":
            result.get("resource_type", "image"),

        "original_filename":
            filename,

        "mime_type":
            content_type,

        "file_size":
            len(file_bytes),

        "width":
            result.get("width"),

        "height":
            result.get("height"),

        "format":
            result.get("format"),

        "created_at":
            result.get("created_at"),
    }


# =========================================================
# DELETE IMAGE
# =========================================================

def delete_image(
    public_id: str,
) -> bool:
    """
    Delete an image from Cloudinary.

    Used when an upload succeeds but the corresponding
    database operation fails.
    """

    if not public_id:
        return False

    try:

        result = cloudinary.uploader.destroy(
            public_id,
            resource_type="image",
        )

        return result.get("result") == "ok"

    except Exception as exc:

        print(
            f"Cloudinary delete error: {exc}"
        )

        return False