from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form

from models.complaint import ComplaintCreate
from models.common import LocationData

from services.complaint_service import ComplaintService
from services.evidence_service import EvidenceService


router = APIRouter(
    prefix="/complaints",
    tags=["Complaints"],
)


complaint_service = ComplaintService()
evidence_service = EvidenceService()


# ============================================================
# CREATE COMPLAINT
# ============================================================

@router.post("")
async def create_complaint(
    request: ComplaintCreate,
):

    try:

        result = complaint_service.create_complaint(request)

        # ----------------------------------------------------
        # IRRELEVANT INPUT
        # ----------------------------------------------------

        if not result["accepted"]:

            return {
                "success": False,
                "registered": False,
                "message": (
                    "The provided input does not "
                    "appear to be a valid civic complaint."
                ),
                "reason": result["reason"],
                "analysis": result["relevance"],
            }

        # ----------------------------------------------------
        # ACCEPTED
        # ----------------------------------------------------

        complaint = result["complaint"]
        citizen = result["citizen"]

        is_new_issue = result.get(
            "is_new_issue",
            True,
        )

        if is_new_issue:

            message = (
                "Your complaint has been received "
                "and a new civic issue has been created."
            )

        else:

            message = (
                "A similar issue has already been "
                "reported at this location. "
                "Your complaint has been linked "
                "to the existing civic issue."
            )

        return {
            "success": True,
            "registered": True,
            "message": message,
            "data": {
                "complaint": complaint,
                "citizen": {
                    "id": citizen["id"],
                    "name": citizen["name"],
                },
                "issue_analysis": result.get(
                    "issue_analysis"
                ),
                "severity": result.get(
                    "severity"
                ),
                "civic_issue": result.get(
                    "civic_issue"
                ),
                "duplicate": result.get(
                    "duplicate"
                ),
                "is_new_issue": is_new_issue,
                "is_supporting_existing_issue": result.get(
                    "is_supporting_existing_issue",
                    False,
                ),
                "relevance": result["relevance"],
            },
        }

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        print(
            f"Complaint creation error: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to process complaint.",
        ) from exc


# ============================================================
# MULTIMODAL COMPLAINT
# TEXT + IMAGE
# ============================================================

@router.post("/multimodal")
async def create_multimodal_complaint(
    citizen_name: str = Form(...),
    phone_number: str | None = Form(None),
    email: str | None = Form(None),
    telegram_chat_id: str | None = Form(None),

    original_input: str = Form(...),

    input_language: str | None = Form(None),
    output_language: str | None = Form(None),

    location_text: str | None = Form(None),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    postal_code: str | None = Form(None),

    file: UploadFile | None = File(None),
):

    try:

        # ----------------------------------------------------
        # 1. BUILD COMPLAINT REQUEST
        # ----------------------------------------------------

        location = None

        if (
            location_text
            or latitude is not None
            or longitude is not None
            or postal_code
        ):

            location = LocationData(
                text=location_text,
                latitude=latitude,
                longitude=longitude,
                postal_code=postal_code,
            )

        request = ComplaintCreate(
            citizen_name=citizen_name,
            phone_number=phone_number,
            email=email,
            telegram_chat_id=telegram_chat_id,
            original_input=original_input,
            input_type="text",
            input_language=input_language,
            output_language=output_language,
            location=location,
        )

        # ----------------------------------------------------
        # 2. PROCESS TEXT COMPLAINT
        # ----------------------------------------------------

        result = complaint_service.create_complaint(
            request
        )

        # ----------------------------------------------------
        # 3. REJECT IRRELEVANT INPUT
        # ----------------------------------------------------

        if not result["accepted"]:

            return {
                "success": False,
                "registered": False,
                "message": (
                    "The provided input does not "
                    "appear to be a valid civic complaint."
                ),
                "reason": result["reason"],
                "analysis": result["relevance"],
            }

        # ----------------------------------------------------
        # 4. GET CREATED COMPLAINT
        # ----------------------------------------------------

        complaint = result["complaint"]
        citizen = result["citizen"]

        evidence = None

        # ----------------------------------------------------
        # 5. PROCESS IMAGE IF PROVIDED
        # ----------------------------------------------------

        if file is not None:

            # Validate content type
            allowed_types = {
                "image/jpeg",
                "image/png",
                "image/webp",
            }

            if file.content_type not in allowed_types:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Only JPEG, PNG and WEBP "
                        "images are supported."
                    ),
                )

            image_bytes = await file.read()

            if not image_bytes:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uploaded image is empty.",
                )

            # 10 MB limit
            max_size = 10 * 1024 * 1024

            if len(image_bytes) > max_size:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Image size must be "
                        "10 MB or less."
                    ),
                )

            # ------------------------------------------------
            # Upload + Vision Analysis + Supabase
            # ------------------------------------------------

            evidence = (
                evidence_service
                .create_image_evidence(
                    complaint_id=complaint["id"],
                    file_bytes=image_bytes,
                    filename=file.filename or "evidence",
                    content_type=file.content_type,
                )
            )

        # ----------------------------------------------------
        # 6. ISSUE STATUS
        # ----------------------------------------------------

        is_new_issue = result.get(
            "is_new_issue",
            True,
        )

        if is_new_issue:

            message = (
                "Your complaint has been received "
                "and a new civic issue has been created."
            )

        else:

            message = (
                "A similar issue has already been "
                "reported at this location. "
                "Your complaint has been linked "
                "to the existing civic issue."
            )

        # ----------------------------------------------------
        # 7. FINAL RESPONSE
        # ----------------------------------------------------

        return {

            "success": True,

            "registered": True,

            "message": message,

            "data": {

                "complaint": complaint,

                "citizen": {
                    "id": citizen["id"],
                    "name": citizen["name"],
                },

                "issue_analysis": result.get(
                    "issue_analysis"
                ),

                "severity": result.get(
                    "severity"
                ),

                "civic_issue": result.get(
                    "civic_issue"
                ),

                "duplicate": result.get(
                    "duplicate"
                ),

                "is_new_issue": is_new_issue,

                "is_supporting_existing_issue": result.get(
                    "is_supporting_existing_issue",
                    False,
                ),

                "relevance": result["relevance"],

                "evidence": evidence,
            },
        }

    except HTTPException:
        raise

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        print(
            f"Multimodal complaint error: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to process "
                "multimodal complaint."
            ),
        ) from exc