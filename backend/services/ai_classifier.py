"""
Rule-based AI Classifier for Grievances
Simple keyword matching for category and priority detection
"""
from typing import List, Tuple
from models.schemas import GrievanceCategory, Priority, ClassificationResult


# Category keywords mapping
CATEGORY_KEYWORDS = {
    GrievanceCategory.ROAD: [
        "road", "pothole", "street", "highway", "footpath", "pavement",
        "traffic", "signal", "zebra crossing", "divider", "bridge",
        "flyover", "underpass", "crater", "broken road", "tar", "asphalt"
    ],
    GrievanceCategory.WATER: [
        "water", "pipe", "leakage", "supply", "tap", "drain", "sewage",
        "pipeline", "bore", "borewell", "tank", "drinking water",
        "contaminated", "dirty water", "water shortage", "no water"
    ],
    GrievanceCategory.ELECTRICITY: [
        "electricity", "power", "light", "pole", "wire", "transformer",
        "outage", "blackout", "voltage", "meter", "bill", "street light",
        "electric", "current", "shock", "cable", "power cut"
    ],
    GrievanceCategory.SANITATION: [
        "garbage", "waste", "trash", "dustbin", "cleaning", "sweeper",
        "sanitation", "toilet", "public toilet", "urinal", "smell",
        "foul", "mosquito", "breeding", "dump", "littering", "filth"
    ],
    GrievanceCategory.HEALTH_SAFETY: [
        "hospital", "health", "clinic", "ambulance", "doctor", "medicine",
        "danger", "unsafe", "hazard", "accident", "injury", "emergency",
        "fire", "safety", "elderly", "child", "disabled", "risk"
    ]
}

# Priority keywords
PRIORITY_KEYWORDS = {
    Priority.HIGH: [
        "accident", "danger", "emergency", "hospital", "elderly", "child",
        "death", "injury", "fire", "collapse", "urgent", "critical",
        "life-threatening", "severe", "immediate", "hazard", "unsafe"
    ],
    Priority.MEDIUM: [
        "delay", "pending", "utility", "inconvenience", "problem",
        "issue", "complaint", "days", "weeks", "waiting", "supply"
    ],
    Priority.LOW: [
        "request", "suggestion", "improvement", "general", "minor",
        "feedback", "information", "query", "clarification"
    ]
}

# Department mapping
DEPARTMENT_MAPPING = {
    GrievanceCategory.ROAD: "Public Works Department (PWD)",
    GrievanceCategory.WATER: "Water Supply & Sewerage Board",
    GrievanceCategory.ELECTRICITY: "Electricity Board",
    GrievanceCategory.SANITATION: "Municipal Corporation - Sanitation",
    GrievanceCategory.HEALTH_SAFETY: "Health & Safety Department",
    GrievanceCategory.OTHERS: "General Administration"
}


def classify_grievance(description: str, selected_category: GrievanceCategory) -> ClassificationResult:
    """
    Classify grievance based on description text.
    Uses rule-based keyword matching for explainable AI.
    """
    description_lower = description.lower()
    
    # Detect category from text (may override user selection if strong match)
    detected_category = selected_category
    category_keywords_found = []
    max_category_matches = 0
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        matches = [kw for kw in keywords if kw in description_lower]
        if len(matches) > max_category_matches:
            max_category_matches = len(matches)
            detected_category = category
            category_keywords_found = matches
    
    # If no strong category match, use user's selection
    if max_category_matches < 2:
        detected_category = selected_category
    
    # Detect priority
    priority = Priority.LOW
    priority_keywords_found = []
    
    # Check high priority first
    high_matches = [kw for kw in PRIORITY_KEYWORDS[Priority.HIGH] if kw in description_lower]
    if high_matches:
        priority = Priority.HIGH
        priority_keywords_found = high_matches
    else:
        # Check medium priority
        medium_matches = [kw for kw in PRIORITY_KEYWORDS[Priority.MEDIUM] if kw in description_lower]
        if medium_matches:
            priority = Priority.MEDIUM
            priority_keywords_found = medium_matches
        else:
            # Check low priority
            low_matches = [kw for kw in PRIORITY_KEYWORDS[Priority.LOW] if kw in description_lower]
            priority_keywords_found = low_matches
    
    # Combine all found keywords
    all_keywords = list(set(category_keywords_found + priority_keywords_found))
    
    # Get department
    department = DEPARTMENT_MAPPING.get(detected_category, "General Administration")
    
    # Generate explanation
    explanation = generate_explanation(detected_category, priority, all_keywords)
    
    return ClassificationResult(
        detected_category=detected_category,
        priority=priority,
        department=department,
        explanation=explanation,
        keywords_found=all_keywords
    )


def generate_explanation(category: GrievanceCategory, priority: Priority, keywords: List[str]) -> str:
    """Generate human-readable explanation for AI decision"""
    
    if not keywords:
        return f"Classified as {category.value.replace('_', ' ').title()} with {priority.value.upper()} priority based on general content analysis."
    
    keywords_str = ", ".join(keywords[:5])
    
    priority_reason = ""
    if priority == Priority.HIGH:
        priority_reason = "This is marked HIGH priority due to safety-related or emergency keywords detected."
    elif priority == Priority.MEDIUM:
        priority_reason = "This is marked MEDIUM priority as it involves utility or service-related issues."
    else:
        priority_reason = "This is marked LOW priority as it appears to be a general request or feedback."
    
    return f"AI Analysis: Keywords detected - [{keywords_str}]. {priority_reason}"
