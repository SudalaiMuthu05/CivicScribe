from typing import Any


def _normalize(value: str | None) -> str:
    if not value:
        return ""

    return " ".join(
        value.lower()
        .strip()
        .split()
    )


def _location_matches(
    location_a: str | None,
    location_b: str | None,
) -> bool:

    a = _normalize(location_a)
    b = _normalize(location_b)

    if not a or not b:
        return False

    return (
        a == b
        or a in b
        or b in a
    )


def _text_similarity(
    text_a: str | None,
    text_b: str | None,
) -> float:

    a_words = set(_normalize(text_a).split())
    b_words = set(_normalize(text_b).split())

    if not a_words or not b_words:
        return 0.0

    intersection = a_words.intersection(b_words)
    union = a_words.union(b_words)

    return len(intersection) / len(union)


def find_duplicate_issue(
    issue_analysis: dict[str, Any],
    existing_issues: list[dict[str, Any]],
) -> dict[str, Any] | None:

    new_location = issue_analysis.get("location_text")

    new_summary = (
        issue_analysis.get("normalized_text")
        or issue_analysis.get("issue_summary")
        or issue_analysis.get("problem")
    )

    for issue in existing_issues:

        existing_location = issue.get("location_text")

        existing_text = (
            issue.get("normalized_issue")
            or issue.get("description")
            or issue.get("title")
        )

        # Location is a strong duplicate signal.
        if not _location_matches(
            new_location,
            existing_location,
        ):
            continue

        similarity = _text_similarity(
            new_summary,
            existing_text,
        )

        # MVP threshold
        if similarity >= 0.20:

            return {
                "is_duplicate": True,
                "existing_issue": issue,
                "similarity": round(
                    similarity * 100,
                    2,
                ),
                "match_reason": (
                    "A similar civic issue was already "
                    "reported at the same location."
                ),
            }

    return None