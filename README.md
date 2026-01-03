# Civic Sense Portal

**AI-Powered Public Grievance Redressal System**

> Built for ByteQuest 2025 Hackathon | Team Avengers-2

---

## 🚀 Overview

Civic Sense Portal is a comprehensive citizen grievance platform inspired by India's CPGRAMS system. It leverages AI-powered classification to streamline public complaint handling with transparency and accountability.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI-Based Classification** | Automatic categorization and priority assignment using keyword analysis |
| ⚡ **Priority-Based Redressal** | Critical issues are flagged and fast-tracked automatically |
| 📸 **Image-Supported Complaints** | Upload photo evidence to strengthen grievance submissions |
| 🔍 **Duplicate Detection** | Smart similarity detection prevents redundant complaints |
| 📊 **Complaint Tracking** | Real-time status updates with complete timeline visibility |
| 👨‍💼 **Admin Dashboard** | Officer portal for task assignment and status management |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React, TailwindCSS |
| Backend | Python, FastAPI |
| Storage | JSON-based persistence |
| AI | Keyword-based NLP classification |

---

## 📦 Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

**Access:** http://localhost:3000

---

## 📱 Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Government-style landing with auto-slider |
| Lodge Grievance | `/lodge-grievance` | 3-step complaint submission |
| Track Status | `/track-status` | Search by Complaint ID |
| Admin Dashboard | `/admin` | Officer view (admin/admin123) |
| Help | `/help` | FAQ and guidelines |

---

## 🎯 Feature Highlights

### AI Classification Engine
- Detects categories: Road, Water, Electricity, Sanitation, Health, Others
- Assigns priority: HIGH (emergency), MEDIUM (utility issues), LOW (general)
- Provides explainable output with detected keywords

### Duplicate Prevention
- Jaccard similarity matching
- Location-based similarity boost
- Warning shown before submission

### Government-Style UI
- CPGRAMS-inspired design
- Auto-moving hero slider
- Maroon + light blue color scheme

---

## 👥 Team Avengers-2

Built with ❤️ for ByteQuest 2025 Hackathon

---

## 📄 License

This project is for hackathon demonstration purposes.
