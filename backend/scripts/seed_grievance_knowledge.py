import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from services.rag_service import add_knowledge_document


SOURCE_URL = (
    "https://www.darpg.gov.in/sites/default/files/2024-08-01.pdf"
)


KNOWLEDGE = [
    {
        "title": "DARPG Public Grievance Guidelines 2024",
        "content": (
            "CPGRAMS is a common open platform for registration "
            "of complaints by citizens on issues against public "
            "authorities in the Central Government or States and "
            "Union Territories. Ministries and Departments may "
            "also have their own public grievance platforms."
        )
    },
    {
        "title": "DARPG Public Grievance Guidelines 2024",
        "content": (
            "The 2024 comprehensive guidelines provide for an "
            "integrated and user-friendly grievance filing "
            "platform and emphasize accessible grievance "
            "redressal for citizens."
        )
    },
    {
        "title": "DARPG Public Grievance Guidelines 2024",
        "content": (
            "The guidelines state that the timelines for effective "
            "grievance redressal have been reduced to 21 days. "
            "Where grievance redressal is likely to take longer, "
            "citizens should receive an interim reply."
        )
    },
    {
        "title": "DARPG Public Grievance Guidelines 2024",
        "content": (
            "The guidelines provide for an escalation process "
            "through appellate officers and sub-nodal appellate "
            "officers in Ministries and Departments."
        )
    }
]


def main():

    for index, item in enumerate(KNOWLEDGE):

        add_knowledge_document(
            title=item["title"],
            source="DARPG - Government of India",
            content=item["content"],
            document_type="GRIEVANCE",
            source_url=SOURCE_URL,
            chunk_index=index
        )

        print(
            f"Inserted grievance knowledge {index + 1}/"
            f"{len(KNOWLEDGE)}"
        )


if __name__ == "__main__":
    main()