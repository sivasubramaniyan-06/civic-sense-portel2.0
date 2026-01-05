"""
Storage for Auto Assignment Data
Stores auto-assignment metadata and audit logs
"""
from typing import Dict, List, Optional
from datetime import datetime
import json
import os

from models.auto_assignment_schemas import (
    AutoAssignmentData,
    AutoAssignmentAuditLog,
    AutoAssignmentStatus,
    AutoAssignmentConfig
)


class AutoAssignmentStore:
    """Storage for auto-assignment data and audit logs"""
    
    def __init__(self):
        self.assignments: Dict[str, AutoAssignmentData] = {}
        self.audit_logs: List[AutoAssignmentAuditLog] = []
        self.config: AutoAssignmentConfig = AutoAssignmentConfig()
        self.data_file = "storage/auto_assignments.json"
        self.audit_file = "storage/auto_assignment_audit.json"
        self.config_file = "storage/auto_assignment_config.json"
        self._load_from_files()
    
    def _load_from_files(self):
        """Load existing data from JSON files"""
        # Load assignments
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                    for gid, a_data in data.items():
                        self.assignments[gid] = AutoAssignmentData(**a_data)
            except Exception as e:
                print(f"Warning: Could not load auto-assignments: {e}")
        
        # Load audit logs
        if os.path.exists(self.audit_file):
            try:
                with open(self.audit_file, 'r') as f:
                    data = json.load(f)
                    self.audit_logs = [AutoAssignmentAuditLog(**log) for log in data]
            except Exception as e:
                print(f"Warning: Could not load audit logs: {e}")
        
        # Load config
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r') as f:
                    data = json.load(f)
                    self.config = AutoAssignmentConfig(**data)
            except Exception as e:
                print(f"Warning: Could not load config: {e}")
    
    def _save_assignments(self):
        """Persist assignments to JSON file"""
        try:
            os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
            with open(self.data_file, 'w') as f:
                data = {gid: a.model_dump() for gid, a in self.assignments.items()}
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            print(f"Warning: Could not save auto-assignments: {e}")
    
    def _save_audit_logs(self):
        """Persist audit logs to JSON file"""
        try:
            os.makedirs(os.path.dirname(self.audit_file), exist_ok=True)
            with open(self.audit_file, 'w') as f:
                data = [log.model_dump() for log in self.audit_logs]
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            print(f"Warning: Could not save audit logs: {e}")
    
    def _save_config(self):
        """Persist config to JSON file"""
        try:
            os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
            with open(self.config_file, 'w') as f:
                json.dump(self.config.model_dump(), f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save config: {e}")
    
    def create_auto_assignment(
        self,
        grievance_id: str,
        data: AutoAssignmentData
    ) -> AutoAssignmentData:
        """Create auto-assignment record for a grievance"""
        self.assignments[grievance_id] = data
        self._save_assignments()
        return data
    
    def get_auto_assignment(self, grievance_id: str) -> Optional[AutoAssignmentData]:
        """Get auto-assignment data for a grievance"""
        return self.assignments.get(grievance_id)
    
    def update_auto_status(
        self,
        grievance_id: str,
        new_status: AutoAssignmentStatus
    ) -> Optional[AutoAssignmentData]:
        """Update the auto-assignment status"""
        if grievance_id in self.assignments:
            self.assignments[grievance_id].auto_status = new_status
            self._save_assignments()
            return self.assignments[grievance_id]
        return None
    
    def get_pending_assignments(self) -> Dict[str, AutoAssignmentData]:
        """Get all pending auto-assignment records"""
        return {
            gid: data for gid, data in self.assignments.items()
            if data.auto_status == AutoAssignmentStatus.PENDING_APPROVAL
        }
    
    def get_assignments_by_status(
        self,
        status: AutoAssignmentStatus
    ) -> Dict[str, AutoAssignmentData]:
        """Get assignments by status"""
        return {
            gid: data for gid, data in self.assignments.items()
            if data.auto_status == status
        }
    
    def add_audit_log(self, log: AutoAssignmentAuditLog):
        """Add an audit log entry"""
        self.audit_logs.append(log)
        self._save_audit_logs()
    
    def get_audit_logs(
        self,
        grievance_id: Optional[str] = None,
        limit: int = 100
    ) -> List[AutoAssignmentAuditLog]:
        """Get audit logs, optionally filtered by grievance ID"""
        logs = self.audit_logs
        if grievance_id:
            logs = [log for log in logs if log.grievance_id == grievance_id]
        # Return newest first
        logs = sorted(logs, key=lambda x: x.timestamp, reverse=True)
        return logs[:limit]
    
    def get_config(self) -> AutoAssignmentConfig:
        """Get current configuration"""
        return self.config
    
    def update_config(self, new_config: AutoAssignmentConfig) -> AutoAssignmentConfig:
        """Update configuration"""
        self.config = new_config
        self._save_config()
        return self.config
    
    def get_stats(self) -> Dict:
        """Get statistics about auto-assignments"""
        pending = sum(1 for a in self.assignments.values() 
                     if a.auto_status == AutoAssignmentStatus.PENDING_APPROVAL)
        approved = sum(1 for a in self.assignments.values() 
                      if a.auto_status == AutoAssignmentStatus.APPROVED)
        rejected = sum(1 for a in self.assignments.values() 
                      if a.auto_status == AutoAssignmentStatus.REJECTED)
        review = sum(1 for a in self.assignments.values() 
                    if a.auto_status == AutoAssignmentStatus.REVIEW_REQUIRED)
        
        # Average confidence score
        scores = [a.confidence_score for a in self.assignments.values()]
        avg_confidence = sum(scores) / len(scores) if scores else 0
        
        return {
            "total": len(self.assignments),
            "pending": pending,
            "approved": approved,
            "rejected": rejected,
            "review_required": review,
            "average_confidence": round(avg_confidence, 1)
        }


# Singleton instance
auto_assignment_store = AutoAssignmentStore()
