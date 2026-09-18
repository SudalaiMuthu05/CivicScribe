from services.authority_routing_service import route_complaint_to_authority


issue_analysis = {
    "normalized_text": (
        "A large pothole near 1st Street is making it "
        "difficult for vehicles to pass."
    ),
    "issue_summary": (
        "Large pothole causing difficulty for vehicles."
    ),
    "issue_category": "Road Damage",
    "issue_category_confidence": 95,
    "location_text": "1st Street",
    "problem": (
        "A large pothole is present near 1st Street."
    ),
    "requested_action": (
        "Repair the pothole."
    ),
    "duration": None,
    "affected_people": (
        "People travelling through the road."
    ),
    "key_facts": [
        "Large pothole",
        "Vehicles are struggling to pass",
    ],
    "missing_information": [],
}


severity = {
    "severity_score": 45,
    "severity_level": "MEDIUM",
    "severity_explanation": (
        "The road defect is affecting vehicle movement "
        "but no immediate severe danger was reported."
    ),
    "risk_factors": [
        "Road obstruction",
    ],
}


result = route_complaint_to_authority(
    complaint_text=(
        "There is a large pothole near 1st Street "
        "and vehicles are struggling to pass."
    ),
    issue_analysis=issue_analysis,
    severity=severity,
)


print("\n==============================")
print("AUTHORITY ROUTING RESULT")
print("==============================")

for key, value in result.items():
    print(f"{key}: {value}")