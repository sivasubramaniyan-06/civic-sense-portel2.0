/**
 * API Client for Civic Sense Portal
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types matching backend schemas
export interface ClassificationResult {
  detected_category: string;
  priority: 'high' | 'medium' | 'low';
  department: string;
  explanation: string;
  keywords_found: string[];
}

export interface DuplicateCheckResponse {
  is_duplicate: boolean;
  similar_complaint_id: string | null;
  similarity_score: number;
  message: string;
}

export interface TimelineEntry {
  status: string;
  timestamp: string;
  remarks: string | null;
}

export interface Grievance {
  id: string;
  category: string;
  description: string;
  location: string;
  image_path: string | null;
  image_data: string | null;  // Base64 image data for preview
  submitter_name: string;
  submitter_phone: string | null;
  submitter_email: string | null;
  status: 'submitted' | 'assigned' | 'in_progress' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  department: string;
  ai_explanation: string;
  keywords_found: string[];
  is_duplicate: boolean;
  similar_to: string | null;
  duplicate_score: number;  // Similarity percentage
  timeline: TimelineEntry[];
  created_at: string;
  updated_at: string;
}

export interface GrievanceSubmission {
  category: string;
  description: string;
  location: string;
  image_base64?: string;
  submitter_name?: string;
  submitter_phone?: string;
  submitter_email?: string;
}

export interface GrievanceResponse {
  success: boolean;
  complaint_id: string;
  message: string;
  classification: ClassificationResult;
}

export interface AdminStats {
  total: number;
  by_status: {
    submitted: number;
    assigned: number;
    in_progress: number;
    resolved: number;
  };
  by_priority: {
    high: number;
    medium: number;
    low: number;
  };
  by_category: Record<string, number>;
}

// API Functions
export async function submitGrievance(data: GrievanceSubmission): Promise<GrievanceResponse> {
  const response = await fetch(`${API_BASE_URL}/api/grievances`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to submit grievance');
  }

  return response.json();
}

export async function getGrievance(id: string): Promise<Grievance> {
  const response = await fetch(`${API_BASE_URL}/api/grievances/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Grievance not found');
  }

  return response.json();
}

export async function checkDuplicate(description: string, category: string): Promise<DuplicateCheckResponse> {
  const response = await fetch(`${API_BASE_URL}/api/grievances/check-duplicate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description, category }),
  });

  if (!response.ok) {
    throw new Error('Failed to check for duplicates');
  }

  return response.json();
}

export async function classifyGrievance(description: string, category: string): Promise<ClassificationResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/grievances/classify?description=${encodeURIComponent(description)}&category=${category}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    throw new Error('Failed to classify grievance');
  }

  return response.json();
}

// Admin APIs
export async function getAllGrievances(): Promise<Grievance[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/grievances`);

  if (!response.ok) {
    throw new Error('Failed to fetch grievances');
  }

  return response.json();
}

export async function updateGrievanceStatus(
  id: string,
  status: string,
  remarks?: string
): Promise<Grievance> {
  const response = await fetch(`${API_BASE_URL}/api/admin/grievances/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, remarks }),
  });

  if (!response.ok) {
    throw new Error('Failed to update status');
  }

  return response.json();
}

export async function getAdminStats(): Promise<AdminStats> {
  const response = await fetch(`${API_BASE_URL}/api/admin/stats`);

  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }

  return response.json();
}

export async function adminLogin(username: string, password: string): Promise<{ success: boolean; token: string | null; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  return response.json();
}
