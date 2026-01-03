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
  audio_path: string | null;  // Path to voice note
  link: string | null;  // For generic media
  audio_meta: { size: number; duration?: number; original_name: string } | null;
  lat?: number;
  lng?: number;
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
  audio_base64?: string;
  audio_path?: string;
  audio_meta?: any;
  lat?: number;
  lng?: number;
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
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Include auth token if user is logged in
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/grievances`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to submit grievance');
  }

  return response.json();
}

export async function uploadMedia(file: File): Promise<{ success: boolean; path: string; metadata: any }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/media/upload-audio`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
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

export interface AdminAnalytics {
  total_complaints: number;
  high_priority_count: number;
  resolved_count: number;
  pending_count: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_category: Record<string, number>;
  by_department: Record<string, number>;
  resolution_rate: number;
}

export interface AdminComplaintFilters {
  category?: string;
  priority?: string;
  status?: string;
  area?: string;
  search?: string;
}

export interface AssignComplaintData {
  department: string;
  officer_name?: string;
  area?: string;
  remarks?: string;
}

export interface UpdateStatusData {
  status: string;
  admin_remarks?: string;
}

function getAdminHeaders(): Record<string, string> {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

export async function getAdminComplaints(filters?: AdminComplaintFilters): Promise<Grievance[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.area) params.append('area', filters.area);
  if (filters?.search) params.append('search', filters.search);

  const url = `${API_BASE_URL}/api/admin/complaints${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, { headers: getAdminHeaders() });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Admin access required');
    }
    throw new Error('Failed to fetch complaints');
  }

  return response.json();
}

export async function assignComplaint(complaintId: string, data: AssignComplaintData): Promise<{ success: boolean; message: string; complaint: Grievance }> {
  const response = await fetch(`${API_BASE_URL}/api/admin/complaints/${complaintId}/assign`, {
    method: 'PUT',
    headers: getAdminHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to assign complaint');
  }

  return response.json();
}

export async function updateComplaintStatus(complaintId: string, data: UpdateStatusData): Promise<{ success: boolean; message: string; complaint: Grievance }> {
  const response = await fetch(`${API_BASE_URL}/api/admin/complaints/${complaintId}/status`, {
    method: 'PUT',
    headers: getAdminHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update status');
  }

  return response.json();
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const response = await fetch(`${API_BASE_URL}/api/admin/analytics`, {
    headers: getAdminHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }

  return response.json();
}

// Legacy functions for backward compatibility
export async function getAllGrievances(): Promise<Grievance[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/grievances`);
  if (!response.ok) throw new Error('Failed to fetch grievances');
  return response.json();
}

export async function updateGrievanceStatus(id: string, status: string, remarks?: string): Promise<Grievance> {
  const response = await fetch(`${API_BASE_URL}/api/admin/grievances/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, remarks }),
  });
  if (!response.ok) throw new Error('Failed to update status');
  return response.json();
}

export async function getAdminStats(): Promise<AdminStats> {
  const response = await fetch(`${API_BASE_URL}/api/admin/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

export async function adminLogin(username: string, password: string): Promise<{ success: boolean; token: string | null; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return response.json();
}

// ===== NEW AUTH APIs =====

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;
}

export async function register(email: string, password: string, name: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  });

  return response.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return response.json();
}

export async function getCurrentUser(token: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json();
}

export function getStoredToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

export function setStoredToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

export function removeStoredToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
}

export function getStoredUser(): AuthUser | null {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) : null;
  }
  return null;
}

export function setStoredUser(user: AuthUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }
}

// ===== USER DASHBOARD APIs =====

export interface UserComplaintSummary {
  id: string;
  category: string;
  description: string;
  location: string;
  priority: string;
  status: string;
  department: string;
  created_at: string;
  has_image: boolean;
}

export interface UserComplaintsResponse {
  success: boolean;
  complaints: UserComplaintSummary[];
  total: number;
}

export async function getUserComplaints(): Promise<UserComplaintsResponse> {
  const token = getStoredToken();
  if (!token) {
    return { success: false, complaints: [], total: 0 };
  }

  const response = await fetch(`${API_BASE_URL}/api/user/complaints`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch complaints');
  }

  return response.json();
}

export async function getUserComplaintDetail(complaintId: string): Promise<{ success: boolean; complaint: Grievance }> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/api/user/complaints/${complaintId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch complaint details');
  }

  return response.json();
}

