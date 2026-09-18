from sentence_transformers import SentenceTransformer

from services.supabase_service import test_supabase_connection


embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


def create_embedding(text: str):
    embedding = embedding_model.encode(
        text,
        normalize_embeddings=True
    )

    return embedding.tolist()


def add_knowledge_document(
    title: str,
    source: str,
    content: str,
    document_type: str,
    source_url: str = None,
    chunk_index: int = None
):
    supabase = test_supabase_connection()

    embedding = create_embedding(content)

    data = {
        "title": title,
        "source": source,
        "source_url": source_url,
        "content": content,
        "document_type": document_type,
        "chunk_index": chunk_index,
        "embedding": embedding
    }

    response = (
        supabase
        .table("knowledge_documents")
        .insert(data)
        .execute()
    )

    return response.data


def search_knowledge(
    query: str,
    match_count: int = 5,
    document_type: str = None
):
    supabase = test_supabase_connection()

    query_embedding = create_embedding(query)

    params = {
        "query_embedding": query_embedding,
        "match_count": match_count
    }

    if document_type:
        params["filter_document_type"] = document_type

    response = supabase.rpc(
        "match_knowledge_documents",
        params
    ).execute()

    return response.data