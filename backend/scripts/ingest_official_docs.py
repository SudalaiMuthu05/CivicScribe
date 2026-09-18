import sys
from pathlib import Path

# --------------------------------------------------
# Add backend directory to Python import path
# --------------------------------------------------

BACKEND_DIR = Path(__file__).resolve().parent.parent

sys.path.insert(
    0,
    str(BACKEND_DIR)
)


# --------------------------------------------------
# Imports
# --------------------------------------------------

import re
import requests
import pymupdf

from services.rag_service import (
    add_knowledge_document
)


# --------------------------------------------------
# Official Government Documents
# --------------------------------------------------

DOCUMENTS = [
    {
        "title": "The Right to Information Act, 2005",
        "source": "India Code - Government of India",
        "source_url": "https://www.indiacode.nic.in/bitstream/123456789/19794/1/rti_act_2005.pdf",
        "document_type": "RTI"
    },
    {
        "title": "RTI Online Portal Guidelines",
        "source": "RTI Online - Government of India",
        "source_url": "https://www.rtionline.gov.in/viewPDF.php?file=um_citizen.pdf",
        "document_type": "RTI"
    },
    {
        "title": "Comprehensive Guidelines for Handling Public Grievances",
        "source": "DARPG - Government of India",
        "source_url": "https://www.darpg.gov.in/sites/default/files/Comprehensive_guidelines_for_handling_the_Public_Grievances.pdf",
        "document_type": "GRIEVANCE"
    }
]


# --------------------------------------------------
# Download PDF
# --------------------------------------------------

def download_pdf(url: str) -> bytes:

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 "
            "(KHTML, like Gecko) "
            "Chrome/140.0.0.0 Safari/537.36"
        ),
        "Accept": (
            "text/html,application/xhtml+xml,"
            "application/xml;q=0.9,"
            "application/pdf;q=0.8,*/*;q=0.7"
        ),
        "Accept-Language": "en-US,en;q=0.9"
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=60,
        allow_redirects=True
    )

    print(
        f"HTTP Status: {response.status_code}"
    )

    print(
        "Content-Type:",
        response.headers.get("Content-Type")
    )

    response.raise_for_status()

    return response.content


# --------------------------------------------------
# Extract PDF Text
# --------------------------------------------------

def extract_pdf_text(
    pdf_bytes: bytes
) -> str:

    document = pymupdf.open(
        stream=pdf_bytes,
        filetype="pdf"
    )

    pages = []

    for page in document:

        text = page.get_text()

        if text:
            pages.append(text)

    document.close()

    return "\n".join(pages)


# --------------------------------------------------
# Clean Text
# --------------------------------------------------

def clean_text(
    text: str
) -> str:

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


# --------------------------------------------------
# Create Text Chunks
# --------------------------------------------------

def create_chunks(
    text: str,
    chunk_size: int = 1200,
    overlap: int = 200
):

    chunks = []

    start = 0

    while start < len(text):

        end = start + chunk_size

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        start += chunk_size - overlap

    return chunks


# --------------------------------------------------
# Ingest One Document
# --------------------------------------------------

def ingest_document(
    document
):

    print(
        f"\nDownloading: {document['title']}"
    )

    pdf_bytes = download_pdf(
        document["source_url"]
    )

    print("Extracting text...")

    text = extract_pdf_text(
        pdf_bytes
    )

    text = clean_text(
        text
    )

    print(
        f"Extracted {len(text)} characters"
    )

    chunks = create_chunks(
        text
    )

    print(
        f"Created {len(chunks)} chunks"
    )

    for index, chunk in enumerate(chunks):

        add_knowledge_document(
            title=document["title"],
            source=document["source"],
            content=chunk,
            document_type=document["document_type"],
            source_url=document["source_url"],
            chunk_index=index
        )

        print(
            f"Inserted chunk "
            f"{index + 1}/{len(chunks)}"
        )


# --------------------------------------------------
# Main
# --------------------------------------------------

def main():

    for document in DOCUMENTS:

        try:

            ingest_document(
                document
            )

        except Exception as error:

            print(
                f"ERROR processing "
                f"{document['title']}: "
                f"{error}"
            )


# --------------------------------------------------
# Run
# --------------------------------------------------

if __name__ == "__main__":

    main()