from fastapi import APIRouter

from services.tasks import process_test_task
from services.ai_service import ask_llm
from services.supabase_service import test_supabase_connection
from services.rag_service import (
    add_knowledge_document,
    search_knowledge
)

router = APIRouter()


# -----------------------------------------
# Health Check
# -----------------------------------------

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "The Grievance Scribe API"
    }


# -----------------------------------------
# Celery Test
# -----------------------------------------

@router.post("/test-celery")
def test_celery():
    task = process_test_task.delay()

    return {
        "message": "Celery task submitted",
        "task_id": task.id
    }


# -----------------------------------------
# Groq AI Test
# -----------------------------------------

@router.post("/test-ai")
def test_ai():
    response = ask_llm(
        "Reply with exactly: The Grievance Scribe AI is working."
    )

    return {
        "response": response
    }


# -----------------------------------------
# Supabase Test
# -----------------------------------------

@router.get("/test-supabase")
def test_supabase():
    test_supabase_connection()

    return {
        "status": "connected",
        "database": "supabase",
        "test": "successful"
    }


# -----------------------------------------
# RAG Add Test
# -----------------------------------------

@router.post("/test-rag-add")
def test_rag_add():

    result = add_knowledge_document(
        title="RTI Test Document",
        source="Hackathon Test",
        content=(
            "The Right to Information framework allows "
            "citizens to seek information held by public "
            "authorities."
        ),
        document_type="RTI"
    )

    return {
        "message": "Test knowledge document added",
        "data": result
    }


# -----------------------------------------
# RAG Search Test - RTI
# -----------------------------------------

@router.get("/test-rag-search")
def test_rag_search():

    results = search_knowledge(
        query=(
            "How can a citizen seek information "
            "from a public authority?"
        ),
        match_count=3
    )

    return {
        "results": results
    }


# -----------------------------------------
# RAG Search Test - Grievance
# -----------------------------------------

@router.get("/test-rag")
def test_rag():

    results = search_knowledge(
        query=(
            "How should a citizen file "
            "a public grievance?"
        ),
        match_count=3
    )

    return {
        "results": results
    }