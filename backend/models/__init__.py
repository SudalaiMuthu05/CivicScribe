from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    text: str


class AnalyzeResponse(BaseModel):
    type: str
    category: str
    reason: str
    requested_action_or_information: str