"""
Duplicate Complaint Checker
Enhanced text similarity with location matching
"""
from typing import List, Tuple, Optional
from models.schemas import DuplicateCheckResponse, GrievanceCategory


def tokenize(text: str) -> set:
    """Simple tokenization - split into words and normalize"""
    # Remove punctuation and convert to lowercase
    cleaned = ''.join(c if c.isalnum() or c.isspace() else ' ' for c in text.lower())
    # Split and filter short words
    words = set(w for w in cleaned.split() if len(w) > 2)
    return words


def jaccard_similarity(text1: str, text2: str) -> float:
    """Calculate Jaccard similarity between two texts"""
    set1 = tokenize(text1)
    set2 = tokenize(text2)
    
    if not set1 or not set2:
        return 0.0
    
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    
    return intersection / union if union > 0 else 0.0


def check_duplicates(
    new_description: str,
    category: GrievanceCategory,
    existing_complaints: List[Tuple[str, str, str]],  # (id, description, location)
    new_location: str = "",
    threshold: float = 0.4
) -> DuplicateCheckResponse:
    """
    Check if a new complaint is similar to existing ones.
    Uses text similarity + location matching for better accuracy.
    
    Args:
        new_description: Description of new complaint
        category: Category of new complaint
        existing_complaints: List of (id, description, location) tuples
        new_location: Location of new complaint
        threshold: Similarity threshold (0.4 = 40% word overlap)
    
    Returns:
        DuplicateCheckResponse with result
    """
    if not existing_complaints:
        return DuplicateCheckResponse(
            is_duplicate=False,
            similarity_score=0.0,
            message="No similar complaints found. Your grievance is unique."
        )
    
    max_similarity = 0.0
    most_similar_id = None
    
    for complaint_id, existing_desc, existing_location in existing_complaints:
        # Calculate text similarity
        text_similarity = jaccard_similarity(new_description, existing_desc)
        
        # Boost similarity if locations match
        location_bonus = 0.15 if new_location and existing_location and \
                         new_location.lower() == existing_location.lower() else 0.0
        
        combined_similarity = min(text_similarity + location_bonus, 1.0)
        
        if combined_similarity > max_similarity:
            max_similarity = combined_similarity
            most_similar_id = complaint_id
    
    is_duplicate = max_similarity >= threshold
    
    if is_duplicate:
        return DuplicateCheckResponse(
            is_duplicate=True,
            similar_complaint_id=most_similar_id,
            similarity_score=round(max_similarity * 100, 1),
            message=f"⚠️ A similar grievance already exists (ID: {most_similar_id}). "
                   f"Similarity: {round(max_similarity * 100, 1)}%. "
                   f"You may track the existing complaint instead of submitting a new one."
        )
    else:
        return DuplicateCheckResponse(
            is_duplicate=False,
            similarity_score=round(max_similarity * 100, 1),
            message="No similar complaints found. Your grievance is unique."
        )
