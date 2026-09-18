from pydantic import BaseModel
from typing import Optional, List


# -----------------------------------------
# Analyze
# -----------------------------------------

class AnalyzeRequest(BaseModel):
    text: str


class AnalyzeResponse(BaseModel):
    type: str
    category: str
    reason: str
    requested_action_or_information: str


# -----------------------------------------
# Fact Extraction
# -----------------------------------------

class FactExtractionRequest(BaseModel):
    text: str


class ExtractedFacts(BaseModel):
    model_config = {"extra": "allow"}

    issue: Optional[str] = None
    location: Optional[str] = None
    duration: Optional[str] = None

    previous_complaint: Optional[bool] = None
    previous_complaint_authority: Optional[str] = None
    previous_complaint_date: Optional[str] = None

    problem_details: List[str] = []

    requested_action: Optional[str] = None
    requested_information: Optional[str] = None


class FactExtractionResponse(BaseModel):
    facts: ExtractedFacts


# -----------------------------------------
# Missing Information
# -----------------------------------------

class MissingInfoRequest(BaseModel):
    request_type: Optional[str] = None
    category: Optional[str] = None
    facts: ExtractedFacts


class MissingInfoResponse(BaseModel):
    missing: List[str]
    questions: List[str]


# -----------------------------------------
# Draft Generation
# -----------------------------------------

class DraftRequest(BaseModel):
    request_type: str
    category: str
    facts: ExtractedFacts


class DraftSource(BaseModel):
    title: str
    source: str
    source_url: Optional[str] = None


class DraftResponse(BaseModel):
    draft: str
    sources: List[DraftSource] = []


# -----------------------------------------
# Case Creation
# -----------------------------------------

class CreateCaseRequest(BaseModel):
    model_config = {"extra": "allow"}

    original_request: str
    request_type: str
    category: str
    extracted_facts: ExtractedFacts
    draft: str
    applicant_details: Optional[dict] = None


class CreateCaseResponse(BaseModel):
    id: str
    case_number: str
    status: str
    message: str
    original_request: Optional[str] = None
    request_type: Optional[str] = None
    category: Optional[str] = None
    draft: Optional[str] = None
    created_at: Optional[str] = None

class ValidationIssue(BaseModel):
    type: str
    text: str
    reason: str


class ValidationResponse(BaseModel):
    is_valid: bool
    issues: List[ValidationIssue] = []
    unsupported_facts: List[str] = []
    unrequested_actions: List[str] = []
    intent_mismatch: List[str] = []
    fact_consistency: str

class UpdateCaseStatusRequest(BaseModel):
    status: str


class CaseStatusResponse(BaseModel):
    case_number: str
    status: str
    message: str

