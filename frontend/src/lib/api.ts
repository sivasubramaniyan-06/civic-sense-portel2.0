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
  audio_language?: string;
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
  audio_language?: string;
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

// Admin Analytics Extensions
export async function getAdminAnalyticsSummary(): Promise<any> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/analytics/summary`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

export async function getAdminByDepartment(): Promise<Record<string, number>> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/analytics/by-department`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

export async function getAdminComplaintDetail(id: string): Promise<{ success: boolean; complaint: Grievance }> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/complaints/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch details');
  return response.json();
}

export async function downloadAdminExport(): Promise<void> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/analytics/export`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Export failed');

  // Trigger download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `complaints_export_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// ===== AUTO ASSIGNMENT APIs =====

export interface AutoAssignmentQueueItem {
  complaint_id: string;
  complaint_summary: string;
  location: string;
  nlp_category: string;
  suggested_department: string;
  confidence_score: number;
  days_since_submission: number;
  current_status: string;
  priority: string;
  created_at: string;
  keywords_found: string[];
}

export interface AutoAssignmentQueueResponse {
  success: boolean;
  items: AutoAssignmentQueueItem[];
  total: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
}

export interface AutoAssignmentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  review_required: number;
  average_confidence: number;
}

export interface AutoAssignmentConfig {
  review_window_days: number;
  auto_assign_threshold: number;
  enabled: boolean;
}

export interface AutoAssignmentFilters {
  days?: number;
  status?: string;
  min_confidence?: number;
  max_confidence?: number;
  department?: string;
}

export async function getAutoAssignmentQueue(filters?: AutoAssignmentFilters): Promise<AutoAssignmentQueueResponse> {
  const token = getStoredToken();
  const params = new URLSearchParams();

  if (filters?.days) params.append('days', filters.days.toString());
  if (filters?.status) params.append('status', filters.status);
  if (filters?.min_confidence) params.append('min_confidence', filters.min_confidence.toString());
  if (filters?.max_confidence) params.append('max_confidence', filters.max_confidence.toString());
  if (filters?.department) params.append('department', filters.department);

  const url = `${API_BASE_URL}/api/admin/auto-assignment/queue${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Failed to fetch auto-assignment queue');
  return response.json();
}

export async function getAutoAssignmentStats(): Promise<AutoAssignmentStats> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/auto-assignment/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Failed to fetch auto-assignment stats');
  return response.json();
}

export async function getAutoAssignmentDepartments(): Promise<{ departments: string[] }> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/auto-assignment/departments`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Failed to fetch departments');
  return response.json();
}

export async function getAutoAssignmentConfig(): Promise<AutoAssignmentConfig> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/auto-assignment/config`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Failed to fetch config');
  return response.json();
}

export async function updateAutoAssignmentConfig(config: AutoAssignmentConfig): Promise<AutoAssignmentConfig> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/auto-assignment/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(config)
  });

  if (!response.ok) throw new Error('Failed to update config');
  return response.json();
}

export async function approveAutoAssignment(
  complaintId: string,
  department: string,
  remarks?: string
): Promise<{ success: boolean; message: string; complaint: Grievance }> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/auto-assignment/${complaintId}/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ department, remarks })
  });

  if (!response.ok) throw new Error('Failed to approve assignment');
  return response.json();
}

export async function rejectAutoAssignment(
  complaintId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/auto-assignment/${complaintId}/reject`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });

  if (!response.ok) throw new Error('Failed to reject assignment');
  return response.json();
}

export async function bulkAutoAssignment(
  complaintIds: string[],
  action: 'approve' | 'reject',
  department?: string,
  remarks?: string
): Promise<{ success: boolean; message: string; results: { success_count: number; failed_count: number; failures: Array<{ complaint_id: string; error: string }> } }> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/auto-assignment/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ complaint_ids: complaintIds, action, department, remarks })
  });

  if (!response.ok) throw new Error('Failed to perform bulk operation');
  return response.json();
}

export async function getAutoAssignmentAuditLogs(complaintId?: string, limit: number = 100): Promise<{ success: boolean; logs: Array<any>; total: number }> {
  const token = getStoredToken();
  const params = new URLSearchParams();
  if (complaintId) params.append('complaint_id', complaintId);
  params.append('limit', limit.toString());

  const response = await fetch(`${API_BASE_URL}/api/admin/auto-assignment/audit-logs?${params.toString()}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Failed to fetch audit logs');
  return response.json();
}

export async function syncAutoAssignmentQueue(): Promise<{ success: boolean; message: string; synced_count: number }> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/auto-assignment/sync`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Failed to sync queue');
  return response.json();
}
