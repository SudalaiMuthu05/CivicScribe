from typing import Any

from database.repositories.evidence_repository import (
    EvidenceRepository,
)

from database.repositories.complaint_repository import (
    ComplaintRepository,
)

from services.cloudinary_service import (
    upload_image,
    delete_image,
)

from services.vision_service import (
    analyze_image_against_complaint,
)


class EvidenceService:

    def __init__(self) -> None:

        self.evidence_repository = (
            EvidenceRepository()
        )

        self.complaint_repository = (
            ComplaintRepository()
        )

    # =========================================================
    # CREATE IMAGE EVIDENCE
    # =========================================================

    def create_image_evidence(
        self,
        complaint_id: str,
        file_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> dict[str, Any]:

        # -----------------------------------------------------
        # 1. GET COMPLAINT
        # -----------------------------------------------------

        complaint = (
            self.complaint_repository
            .get_complaint(
                complaint_id
            )
        )

        if complaint is None:

            raise ValueError(
                "Complaint not found."
            )

        # -----------------------------------------------------
        # 2. VALIDATE IMAGE
        # -----------------------------------------------------

        allowed_types = {
            "image/jpeg",
            "image/png",
            "image/webp",
        }

        if content_type not in allowed_types:

            raise ValueError(
                "Only JPEG, PNG and WEBP images "
                "are supported."
            )

        if not file_bytes:

            raise ValueError(
                "Uploaded image is empty."
            )

        # 10 MB maximum
        max_file_size = 10 * 1024 * 1024

        if len(file_bytes) > max_file_size:

            raise ValueError(
                "Image size must be 10 MB or less."
            )

        # -----------------------------------------------------
        # 3. UPLOAD IMAGE TO CLOUDINARY
        # -----------------------------------------------------

        cloudinary_result = upload_image(

            file_bytes=file_bytes,

            filename=filename,

            content_type=content_type,
        )

        public_id = (
            cloudinary_result.get(
                "cloudinary_public_id"
            )
        )

        cloudinary_url = (
            cloudinary_result.get(
                "cloudinary_url"
            )
        )

        # -----------------------------------------------------
        # 4. PROCESS AI + DATABASE
        # -----------------------------------------------------

        try:

            # -------------------------------------------------
            # 4A. GET COMPLAINT TEXT
            # -------------------------------------------------

            complaint_text = (

                complaint.get(
                    "normalized_text"
                )

                or complaint.get(
                    "original_input"
                )

                or ""
            )

            # -------------------------------------------------
            # 4B. GROQ VISION ANALYSIS
            # -------------------------------------------------

            vision_result = (
                analyze_image_against_complaint(

                    complaint_text=
                        complaint_text,

                    image_url=
                        cloudinary_url,
                )
            )

            # -------------------------------------------------
            # 5. BUILD EVIDENCE RECORD
            # -------------------------------------------------

            evidence_data = {

                # ---------------------------------------------
                # RELATION
                # ---------------------------------------------

                "complaint_id":
                    complaint_id,

                "evidence_type":
                    "image",

                # ---------------------------------------------
                # CLOUDINARY
                # ---------------------------------------------

                "cloudinary_public_id":
                    public_id,

                "cloudinary_url":
                    cloudinary_url,

                "cloudinary_resource_type":
                    cloudinary_result.get(
                        "cloudinary_resource_type"
                    ),

                # ---------------------------------------------
                # ORIGINAL FILE
                # ---------------------------------------------

                "original_filename":
                    cloudinary_result.get(
                        "original_filename"
                    ),

                "mime_type":
                    cloudinary_result.get(
                        "mime_type"
                    ),

                "file_size":
                    cloudinary_result.get(
                        "file_size"
                    ),

                # ---------------------------------------------
                # IMAGE INFORMATION
                # ---------------------------------------------

                "image_description":
                    vision_result.get(
                        "image_description"
                    ),

                "detected_objects":
                    vision_result.get(
                        "detected_objects",
                        [],
                    ),

                "detected_issue":
                    vision_result.get(
                        "detected_issue"
                    ),

                # ---------------------------------------------
                # IMAGE RELEVANCE
                # ---------------------------------------------

                "relevance":
                    vision_result.get(
                        "relevance"
                    ),

                "relevance_score":
                    vision_result.get(
                        "relevance_score"
                    ),

                "relevance_reason":
                    vision_result.get(
                        "relevance_reason"
                    ),

                # ---------------------------------------------
                # TEXT ↔ IMAGE CONSISTENCY
                # ---------------------------------------------

                "consistency_score":
                    vision_result.get(
                        "consistency_score"
                    ),

                "consistency_status":
                    vision_result.get(
                        "consistency_status"
                    ),

                "consistency_explanation":
                    vision_result.get(
                        "consistency_explanation"
                    ),

                # ---------------------------------------------
                # COMPLETE AI RESPONSE
                # ---------------------------------------------

                "ai_analysis":
                    vision_result,
            }

            # -------------------------------------------------
            # 6. SAVE EVIDENCE TO SUPABASE
            # -------------------------------------------------

            evidence = (
                self.evidence_repository
                .create_evidence(
                    evidence_data
                )
            )

            return evidence

        except Exception:

            # -------------------------------------------------
            # ROLLBACK CLOUDINARY ASSET
            # -------------------------------------------------

            if public_id:

                try:

                    delete_image(
                        public_id
                    )

                except Exception as delete_error:

                    print(
                        "Cloudinary rollback failed:",
                        delete_error,
                    )

            raise

    # =========================================================
    # GET ALL EVIDENCE FOR A COMPLAINT
    # =========================================================

    def get_complaint_evidence(
        self,
        complaint_id: str,
    ) -> list[dict[str, Any]]:

        # -----------------------------------------------------
        # Verify complaint exists
        # -----------------------------------------------------

        complaint = (
            self.complaint_repository
            .get_complaint(
                complaint_id
            )
        )

        if complaint is None:

            raise ValueError(
                "Complaint not found."
            )

        # -----------------------------------------------------
        # Fetch evidence
        # -----------------------------------------------------

        return (
            self.evidence_repository
            .get_complaint_evidence(
                complaint_id
            )
        )