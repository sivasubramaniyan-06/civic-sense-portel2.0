"""
In-memory data storage for grievances
Simple JSON-based storage for hackathon demo
"""
from typing import Dict, List, Optional
from datetime import datetime
import uuid
import json
import os

from models.schemas import Grievance, Status, TimelineEntry


class DataStore:
    """In-memory storage with optional JSON persistence"""
    
    def __init__(self):
        self.grievances: Dict[str, Grievance] = {}
        self.data_file = "storage/grievances.json"
        self._load_from_file()
    
    def _load_from_file(self):
        """Load existing data from JSON file if exists"""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                    for gid, g_data in data.items():
                        self.grievances[gid] = Grievance(**g_data)
            except Exception as e:
                print(f"Warning: Could not load data file: {e}")
    
    def _save_to_file(self):
        """Persist data to JSON file"""
        try:
            os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
            with open(self.data_file, 'w') as f:
                data = {gid: g.model_dump() for gid, g in self.grievances.items()}
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            print(f"Warning: Could not save data file: {e}")
    
    def generate_id(self) -> str:
        """Generate unique complaint ID in government format"""
        timestamp = datetime.now().strftime("%Y%m%d")
        random_part = uuid.uuid4().hex[:6].upper()
        return f"CSP-{timestamp}-{random_part}"
    
    def create_grievance(self, grievance: Grievance) -> Grievance:
        """Store a new grievance"""
        self.grievances[grievance.id] = grievance
        self._save_to_file()
        return grievance
    
    def get_grievance(self, grievance_id: str) -> Optional[Grievance]:
        """Retrieve grievance by ID"""
        return self.grievances.get(grievance_id)
    
    def get_all_grievances(self) -> List[Grievance]:
        """Get all grievances for admin view"""
        return list(self.grievances.values())
    
    def update_status(self, grievance_id: str, new_status: Status, remarks: str = None) -> Optional[Grievance]:
        """Update grievance status and add timeline entry"""
        grievance = self.grievances.get(grievance_id)
        if not grievance:
            return None
        
        # Update status
        grievance.status = new_status
        grievance.updated_at = datetime.now().isoformat()
        
        # Add timeline entry
        timeline_entry = TimelineEntry(
            status=new_status,
            timestamp=datetime.now().isoformat(),
            remarks=remarks
        )
        grievance.timeline.append(timeline_entry)
        
        self._save_to_file()
        return grievance
    
    def get_descriptions_for_category(self, category: str) -> List[tuple]:
        """Get all descriptions and locations for a category (for duplicate check)"""
        results = []
        for gid, g in self.grievances.items():
            if g.category.value == category:
                results.append((gid, g.description, g.location))
        return results
    
    def get_user_grievances(self, user_id: str) -> List[Grievance]:
        """Get all grievances submitted by a specific user"""
        return [g for g in self.grievances.values() if g.user_id == user_id]


# Singleton instance
data_store = DataStore()
