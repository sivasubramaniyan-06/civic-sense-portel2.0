"""
Auto Categorization Engine for Grievances
Rule-based NLP/Keyword analysis for department suggestion
Designed to be extensible for future ML model integration
"""
from typing import Tuple, List
from models.schemas import GrievanceCategory


# Department keywords mapping - more granular than category keywords
DEPARTMENT_KEYWORDS = {
    "Public Works Department (PWD)": {
        "keywords": [
            "road", "pothole", "street", "highway", "footpath", "pavement",
            "traffic", "signal", "zebra crossing", "divider", "bridge",
            "flyover", "underpass", "crater", "broken road", "tar", "asphalt",
            "construction", "building", "infrastructure", "footpath", "sidewalk",
            "parking", "road repair", "paver", "cement", "concrete"
        ],
        "categories": [GrievanceCategory.ROAD]
    },
    "Water Supply & Sewerage Board": {
        "keywords": [
            "water", "pipe", "leakage", "supply", "tap", "drain", "sewage",
            "pipeline", "bore", "borewell", "tank", "drinking water",
            "contaminated", "dirty water", "water shortage", "no water",
            "overflow", "flooding", "drainage", "sewer", "water quality",
            "water pressure", "water bill", "water connection", "plumbing"
        ],
        "categories": [GrievanceCategory.WATER]
    },
    "Electricity Board": {
        "keywords": [
            "electricity", "power", "light", "pole", "wire", "transformer",
            "outage", "blackout", "voltage", "meter", "bill", "street light",
            "electric", "current", "shock", "cable", "power cut", "fuse",
            "circuit", "electrical", "power supply", "load shedding",
            "solar", "energy", "lamp post", "bulb", "led light"
        ],
        "categories": [GrievanceCategory.ELECTRICITY]
    },
    "Municipal Corporation - Sanitation": {
        "keywords": [
            "garbage", "waste", "trash", "dustbin", "cleaning", "sweeper",
            "sanitation", "toilet", "public toilet", "urinal", "smell",
            "foul", "mosquito", "breeding", "dump", "littering", "filth",
            "hygiene", "cleanliness", "garbage collection", "waste management",
            "recycling", "compost", "debris", "litter", "solid waste"
        ],
        "categories": [GrievanceCategory.SANITATION]
    },
    "Health & Safety Department": {
        "keywords": [
            "hospital", "health", "clinic", "ambulance", "doctor", "medicine",
            "danger", "unsafe", "hazard", "accident", "injury", "emergency",
            "fire", "safety", "elderly", "child", "disabled", "risk",
            "disease", "epidemic", "vaccination", "first aid", "medical",
            "public health", "food safety", "pollution", "air quality"
        ],
        "categories": [GrievanceCategory.HEALTH_SAFETY]
    },
    "Transport Department": {
        "keywords": [
            "bus", "transport", "traffic", "vehicle", "auto", "taxi",
            "public transport", "metro", "train", "station", "stop",
            "route", "schedule", "fare", "ticket", "commute", "parking",
            "traffic jam", "traffic police", "license", "permit"
        ],
        "categories": [GrievanceCategory.ROAD, GrievanceCategory.OTHERS]
    },
    "General Administration": {
        "keywords": [
            "certificate", "license", "permit", "document", "office",
            "registration", "application", "form", "complaint", "request",
            "general", "other", "miscellaneous", "enquiry", "information"
        ],
        "categories": [GrievanceCategory.OTHERS]
    }
}

# Category to primary department mapping (fallback)
CATEGORY_DEFAULT_DEPARTMENT = {
    GrievanceCategory.ROAD: "Public Works Department (PWD)",
    GrievanceCategory.WATER: "Water Supply & Sewerage Board",
    GrievanceCategory.ELECTRICITY: "Electricity Board",
    GrievanceCategory.SANITATION: "Municipal Corporation - Sanitation",
    GrievanceCategory.HEALTH_SAFETY: "Health & Safety Department",
    GrievanceCategory.OTHERS: "General Administration"
}


def analyze_grievance_for_auto_assignment(
    description: str,
    category: GrievanceCategory
) -> Tuple[GrievanceCategory, str, float]:
    """
    Analyze grievance text to determine category and department.
    
    Returns:
        Tuple of (detected_category, suggested_department, confidence_score)
        
    The confidence score (0-100) indicates how confident the system is
    in its suggestion based on keyword matches.
    """
    description_lower = description.lower()
    
    # Score each department based on keyword matches
    department_scores = {}
    
    for dept_name, dept_info in DEPARTMENT_KEYWORDS.items():
        keywords = dept_info["keywords"]
        matches = [kw for kw in keywords if kw in description_lower]
        
        # Calculate score based on number and quality of matches
        base_score = len(matches) * 10
        
        # Bonus for exact phrase matches (more specific)
        exact_phrase_bonus = sum(5 for kw in matches if len(kw.split()) > 1)
        
        # Bonus if category matches expected categories for department
        category_bonus = 15 if category in dept_info["categories"] else 0
        
        total_score = base_score + exact_phrase_bonus + category_bonus
        department_scores[dept_name] = {
            "score": total_score,
            "matches": matches
        }
    
    # Find best matching department
    best_dept = max(department_scores.items(), key=lambda x: x[1]["score"])
    best_dept_name = best_dept[0]
    best_score = best_dept[1]["score"]
    
    # Calculate confidence (normalize to 0-100)
    # Score of 50+ is considered very confident
    confidence = min(100, max(10, best_score * 2))
    
    # If no good matches found, use category default
    if best_score < 10:
        best_dept_name = CATEGORY_DEFAULT_DEPARTMENT.get(
            category, "General Administration"
        )
        confidence = 40  # Low confidence for fallback
    
    # Detect category from text (may refine user selection)
    detected_category = detect_category_from_text(description_lower, category)
    
    return detected_category, best_dept_name, confidence


def detect_category_from_text(description_lower: str, user_category: GrievanceCategory) -> GrievanceCategory:
    """
    Detect the most appropriate category from text.
    Falls back to user selection if no strong match.
    """
    category_matches = {}
    
    category_keywords = {
        GrievanceCategory.ROAD: [
            "road", "pothole", "street", "highway", "footpath", "bridge",
            "flyover", "traffic light", "signal", "pavement"
        ],
        GrievanceCategory.WATER: [
            "water", "pipe", "leakage", "tap", "drain", "sewage",
            "borewell", "drinking water", "water supply"
        ],
        GrievanceCategory.ELECTRICITY: [
            "electricity", "power", "light", "pole", "transformer",
            "power cut", "street light", "meter"
        ],
        GrievanceCategory.SANITATION: [
            "garbage", "waste", "dustbin", "cleaning", "toilet",
            "sanitation", "mosquito", "filth", "smell"
        ],
        GrievanceCategory.HEALTH_SAFETY: [
            "hospital", "health", "clinic", "danger", "unsafe",
            "accident", "emergency", "fire", "safety"
        ]
    }
    
    for cat, keywords in category_keywords.items():
        matches = sum(1 for kw in keywords if kw in description_lower)
        category_matches[cat] = matches
    
    best_cat = max(category_matches.items(), key=lambda x: x[1])
    
    # Return detected category only if significantly better than user selection
    if best_cat[1] >= 2 and best_cat[0] != user_category:
        return best_cat[0]
    
    return user_category


def get_all_departments() -> List[str]:
    """Return list of all available departments for assignment."""
    return list(DEPARTMENT_KEYWORDS.keys())
