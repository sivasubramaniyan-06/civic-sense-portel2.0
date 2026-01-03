# Civic Sense Portal

**AI-Powered Public Grievance Redressal System**

A comprehensive citizen grievance portal inspired by India's CPGRAMS system. Built with Next.js 16 frontend and Python FastAPI backend.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- npm or yarn

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## ✅ Phase 2 Feature Completion Checklist

### 1. GRIEVANCE SUBMISSION FLOW ✅
| Feature | Status |
|---------|--------|
| Step 1: Category Selection (6 types) | ✅ Complete |
| Step 2: Description + Image Upload + Location | ✅ Complete |
| Step 3: Review, AI Analysis, Submit | ✅ Complete |
| Input Validation (min 20 chars, location required) | ✅ Complete |
| Grievance stored in JSON | ✅ Complete |

### 2. IMAGE UPLOAD HANDLING ✅
| Feature | Status |
|---------|--------|
| Accept image file (jpg, png, etc.) | ✅ Complete |
| Store as base64 in grievance record | ✅ Complete |
| Preview in Lodge Grievance form | ✅ Complete |
| Preview in Admin detail modal | ✅ Complete |
| Preview in Track Status page | ✅ Complete |

### 3. AI CLASSIFICATION & PRIORITY ENGINE ✅
| Feature | Status |
|---------|--------|
| Category detection: Road, Water, Electricity, Sanitation, Health, Others | ✅ Complete |
| HIGH priority: accident, danger, hospital, elderly, child, urgent, emergency | ✅ Complete |
| MEDIUM priority: delay, not working, water issue, broken | ✅ Complete |
| LOW priority: general requests | ✅ Complete |
| Explainable AI output with keywords | ✅ Complete |
| Department auto-assignment | ✅ Complete |

### 4. DUPLICATE COMPLAINT DETECTION ✅
| Feature | Status |
|---------|--------|
| Text similarity (Jaccard) | ✅ Complete |
| Same category matching | ✅ Complete |
| Location-based similarity boost | ✅ Complete |
| Warning shown before submission | ✅ Complete |
| Link to existing complaint | ✅ Complete |
| Option to continue or cancel | ✅ Complete |
| Similarity score display | ✅ Complete |

### 5. CHATBOT GUIDE (RULE-BASED) ✅
| Feature | Status |
|---------|--------|
| Floating UI button | ✅ Complete |
| Toggle open/close | ✅ Complete |
| "How to submit grievance" | ✅ Complete |
| "What is not treated as grievance" | ✅ Complete |
| "How to track complaint" | ✅ Complete |
| Default fallback response | ✅ Complete |

### 6. TRACK GRIEVANCE PAGE ✅
| Feature | Status |
|---------|--------|
| Input Complaint ID | ✅ Complete |
| Fetch grievance details | ✅ Complete |
| Display status with progress bar | ✅ Complete |
| Display priority & department | ✅ Complete |
| Timeline view with all updates | ✅ Complete |
| Attached image preview | ✅ Complete |
| AI explanation display | ✅ Complete |

### 7. ADMIN DASHBOARD ✅
| Feature | Status |
|---------|--------|
| Mock officer login (admin/admin123) | ✅ Complete |
| Table view of all complaints | ✅ Complete |
| Complaint ID column | ✅ Complete |
| Category column | ✅ Complete |
| Priority badges (HIGH/MEDIUM/LOW) | ✅ Complete |
| Status badges | ✅ Complete |
| Duplicate flag with score | ✅ Complete |
| Image preview column | ✅ Complete |
| Location column | ✅ Complete |
| Detail modal with full info | ✅ Complete |
| Mark "Assigned" button | ✅ Complete |
| Mark "In Progress" button | ✅ Complete |
| Mark "Resolved" button | ✅ Complete |
| Stats cards (Total, Pending, In Progress, Resolved) | ✅ Complete |
| Priority breakdown stats | ✅ Complete |
| Filter by status/priority | ✅ Complete |
| Refresh button | ✅ Complete |

---

## 📊 API Endpoints

### Grievance APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/grievances` | POST | Submit new grievance |
| `/api/grievances/{id}` | GET | Get grievance by ID |
| `/api/grievances/classify` | POST | AI classification preview |
| `/api/grievances/check-duplicate` | POST | Check for duplicates |

### Admin APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/grievances` | GET | List all grievances |
| `/api/admin/grievances/{id}/status` | PATCH | Update status |
| `/api/admin/stats` | GET | Dashboard statistics |
| `/api/auth/login` | POST | Admin login |

---

## 🏗️ Project Structure

```
civicsense1.0/
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── requirements.txt        # Python dependencies
│   ├── models/
│   │   └── schemas.py          # Pydantic models
│   ├── routers/
│   │   ├── grievances.py       # Grievance CRUD APIs
│   │   ├── admin.py            # Admin dashboard APIs
│   │   └── auth.py             # Authentication
│   ├── services/
│   │   ├── ai_classifier.py    # Keyword-based NLP
│   │   └── duplicate_checker.py # Similarity detection
│   └── storage/
│       ├── data_store.py       # In-memory + JSON store
│       └── grievances.json     # Persisted data
│
└── frontend/
    ├── src/app/
    │   ├── page.tsx            # Homepage
    │   ├── lodge-grievance/    # 3-step submission
    │   ├── track-status/       # Tracking page
    │   ├── admin/              # Admin dashboard
    │   └── help/               # FAQ page
    ├── src/components/
    │   ├── Header.tsx
    │   ├── Footer.tsx
    │   └── Chatbot.tsx         # Rule-based chatbot
    └── src/lib/
        └── api.ts              # API client
```

---

## 🔐 Test Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |

---

## ⚠️ Known Limitations

1. **Storage**: Uses in-memory storage with JSON file persistence. Will reset on server restart if JSON is cleared.

2. **Authentication**: Mock authentication only - not production secure.

3. **Image Storage**: Images stored as base64 in JSON. For production, use cloud storage (S3, etc.).

4. **AI Classification**: Keyword-based NLP only, not ML-based. Accuracy depends on keyword matches.

5. **Duplicate Detection**: Uses Jaccard similarity (word overlap). May not catch semantic duplicates.

6. **No Email/SMS**: No notification system implemented.

7. **Single Admin**: All complaints visible to all admins. No role-based access control.

8. **No File Size Limit**: Large images may cause performance issues.

---

## 🧪 Test Flow

### Complete End-to-End Test:
1. **Submit** → Navigate to Lodge Grievance, fill form, upload image
2. **Classify** → AI detects category/priority/keywords
3. **Duplicate** → System checks for similar complaints
4. **Confirm** → Review and submit
5. **Track** → Use Complaint ID to view status
6. **Admin** → Login, view complaints, update status
7. **Verify** → Check tracking page reflects admin update

---

## 📱 Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with banner |
| Lodge Grievance | `/lodge-grievance` | 3-step submission form |
| Track Status | `/track-status` | Search by Complaint ID |
| Admin Dashboard | `/admin` | Officer view with controls |
| Help | `/help` | FAQ and guidelines |

---

## 🎯 Phase 2 Complete

All core features have been implemented and tested:
- ✅ No console errors
- ✅ No broken navigation
- ✅ Edge cases handled (empty inputs, not found, etc.)
- ✅ Status updates reflect in tracking page
- ✅ AI classification working with explainable output
- ✅ Duplicate detection with similarity scores
- ✅ Chatbot responds to predefined queries

**Ready for Phase 3: Optimization & Polish**
