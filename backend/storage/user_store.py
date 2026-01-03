import json
import os
from typing import Optional, Dict, List
from datetime import datetime

# File path for user storage
USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

def _load_users() -> Dict[str, dict]:
    """Load users from JSON file"""
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def _save_users(users: Dict[str, dict]):
    """Save users to JSON file"""
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2, default=str)

def get_user_by_email(email: str) -> Optional[dict]:
    """Get user by email"""
    users = _load_users()
    return users.get(email.lower())

def get_user_by_id(user_id: str) -> Optional[dict]:
    """Get user by ID"""
    users = _load_users()
    for user in users.values():
        if user.get("id") == user_id:
            return user
    return None

def create_user(email: str, hashed_password: str, name: str, role: str = "user") -> dict:
    """Create a new user"""
    users = _load_users()
    email_lower = email.lower()
    
    if email_lower in users:
        raise ValueError("User already exists")
    
    user_id = f"USR{datetime.now().strftime('%Y%m%d%H%M%S')}{len(users):03d}"
    
    user = {
        "id": user_id,
        "email": email_lower,
        "password": hashed_password,
        "name": name,
        "role": role,
        "created_at": datetime.now().isoformat()
    }
    
    users[email_lower] = user
    _save_users(users)
    return user

def get_all_users() -> List[dict]:
    """Get all users (without passwords)"""
    users = _load_users()
    return [{k: v for k, v in u.items() if k != "password"} for u in users.values()]

# Initialize with default admin if no users exist
def init_default_admin():
    """Create default admin user if none exists"""
    import bcrypt
    users = _load_users()
    if not users:
        hashed = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
        create_user("admin@civicsense.gov.in", hashed, "Admin User", "admin")
        print("Default admin created: admin@civicsense.gov.in / admin123")
