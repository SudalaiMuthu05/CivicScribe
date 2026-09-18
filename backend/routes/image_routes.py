from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    UploadFile,
)

from services.evidence_service import (
    EvidenceService,
)


router = APIRouter(
    prefix="/images",
    tags=["Images & Evidence"],
)


evidence_service = EvidenceService()


# =========================================================
# UPLOAD IMAGE EVIDENCE
# =========================================================

@router.post("/upload")
async def upload_image_evidence(
    complaint_id: str = Form(...),
    file: UploadFile = File(...),
):

    try:

        # -----------------------------------------------------
        # Validate filename
        # -----------------------------------------------------

        if not file.filename:

            raise HTTPException(
                status_code=400,
                detail="Image filename is required.",
            )

        # -----------------------------------------------------
        # Read image
        # -----------------------------------------------------

        file_bytes = await file.read()

        if not file_bytes:

            raise HTTPException(
                status_code=400,
                detail="Uploaded image is empty.",
            )

        # -----------------------------------------------------
        # Upload + create evidence
        # -----------------------------------------------------

        evidence = (
            evidence_service
            .create_image_evidence(
                complaint_id=complaint_id,
                file_bytes=file_bytes,
                filename=file.filename,
                content_type=(
                    file.content_type
                    or "application/octet-stream"
                ),
            )
        )

        # -----------------------------------------------------
        # Response
        # -----------------------------------------------------

        return {

            "success":
                True,

            "message":
                "Image uploaded successfully.",

            "data":
                evidence,
        }

    except HTTPException:

        raise

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except RuntimeError as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        print(
            f"Image upload error: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to process image evidence.",
        ) from exc


# =========================================================
# GET COMPLAINT EVIDENCE
# =========================================================

@router.get("/{complaint_id}")
async def get_complaint_evidence(
    complaint_id: str,
):

    try:

        evidence = (
            evidence_service
            .get_complaint_evidence(
                complaint_id
            )
        )

        return {

            "success":
                True,

            "data":
                evidence,
        }

    except Exception as exc:

        print(
            f"Evidence retrieval error: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve evidence.",
        ) from exc