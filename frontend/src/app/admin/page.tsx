'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllGrievances, updateGrievanceStatus, adminLogin, getAdminStats, login, setStoredToken, setStoredUser, getStoredUser, getStoredToken } from '@/lib/api';
import type { Grievance, AdminStats } from '@/lib/api';

const DEPARTMENTS = [
    { id: 'pwd', name: 'Public Works Department (PWD)', icon: '🏗️' },
    { id: 'municipal', name: 'Municipal Corporation', icon: '🏙️' },
    { id: 'health', name: 'Health Department', icon: '🏥' },
    { id: 'transport', name: 'Transport Department', icon: '🚌' },
    { id: 'education', name: 'Education Department', icon: '🎓' },
    { id: 'revenue', name: 'Revenue Department', icon: '💰' },
    { id: 'electricity', name: 'Electricity Board', icon: '⚡' },
    { id: 'water', name: 'Water Supply', icon: '💧' },
];

const getDepartmentForCategory = (category: string): string => {
    const mapping: Record<string, string> = {
        'road': 'pwd',
        'water': 'water',
        'electricity': 'electricity',
        'sanitation': 'municipal',
        'health': 'health',
        'transport': 'transport',
        'education': 'education',
        'others': 'municipal',
    };
    return mapping[category.toLowerCase()] || 'municipal';
};

export default function AdminDashboard() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'complaints' | 'analytics' | 'appeals'>('complaints');
    const [assignModal, setAssignModal] = useState<{ grievance: Grievance, open: boolean } | null>(null);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedOfficer, setSelectedOfficer] = useState('');
    const [resolutionDays, setResolutionDays] = useState(7);

    // Check for existing JWT admin login
    useEffect(() => {
        const token = getStoredToken();
        const user = getStoredUser();
        if (token && user?.role === 'admin') {
            // Redirect to new admin dashboard
            router.push('/admin/dashboard');
        }
    }, [router]);

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            setLoginError('Please enter username and password');
            return;
        }
        setLoginError('');
        try {
            // First try JWT login with email format
            const emailFormat = username.includes('@') ? username : `${username}@civicsense.gov.in`;
            const jwtResult = await login(emailFormat, password);

            if (jwtResult.success && jwtResult.token && jwtResult.user) {
                setStoredToken(jwtResult.token);
                setStoredUser(jwtResult.user);

                if (jwtResult.user.role === 'admin') {
                    router.push('/admin/dashboard');
                    return;
                }
            }

            // Fallback to legacy admin login
            const result = await adminLogin(username, password);
            if (result.success) {
                setIsLoggedIn(true);
                loadData();
            } else {
                setLoginError(result.message);
            }
        } catch {
            setLoginError('Login failed. Please try again.');
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [gData, sData] = await Promise.all([getAllGrievances(), getAdminStats()]);
            setGrievances(gData);
            setStats(sData);
        } catch (e) {
            console.error('Failed to load data:', e);
        }
        setLoading(false);
    };

    const handleStatusUpdate = async (id: string, newStatus: string, remarks?: string) => {
        setUpdating(id);
        try {
            await updateGrievanceStatus(id, newStatus, remarks || `Status updated to ${newStatus} by admin`);
            await loadData();
            if (selectedGrievance?.id === id) {
                const updated = grievances.find(g => g.id === id);
                if (updated) setSelectedGrievance({ ...updated, status: newStatus as Grievance['status'] });
            }
        } catch (e) {
            console.error('Failed to update status:', e);
        }
        setUpdating(null);
    };

    const handleAssign = async () => {
        if (!assignModal?.grievance || !selectedDept) return;
        const dept = DEPARTMENTS.find(d => d.id === selectedDept);
        const remarks = `Assigned to ${dept?.name || selectedDept}${selectedOfficer ? ` - Officer: ${selectedOfficer}` : ''}. Expected resolution: ${resolutionDays} days.`;
        await handleStatusUpdate(assignModal.grievance.id, 'assigned', remarks);
        setAssignModal(null);
        setSelectedDept('');
        setSelectedOfficer('');
        setResolutionDays(7);
    };

    // Filtering
    const filteredGrievances = grievances.filter(g => {
        if (statusFilter !== 'all' && g.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && g.priority !== priorityFilter) return false;
        if (categoryFilter !== 'all' && g.category !== categoryFilter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return g.id.toLowerCase().includes(query) ||
                g.description.toLowerCase().includes(query) ||
                g.location.toLowerCase().includes(query);
        }
        return true;
    });

    const appealedGrievances = grievances.filter(g => g.status === 'resolved');

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    const categories = [...new Set(grievances.map(g => g.category))];

    // Login Screen
    if (!isLoggedIn) {
        return (
            <div className="page-content flex items-center justify-center">
                <div className="gov-card w-full max-w-md">
                    <div className="text-center mb-6">
                        <div className="text-5xl mb-4">🔐</div>
                        <h1 className="text-xl font-bold text-[#800020]">Officer Login</h1>
                        <p className="text-sm text-gray-600">Admin Dashboard Access</p>
                    </div>
                    {loginError && <div className="alert alert-error mb-4">{loginError}</div>}
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            className="form-input"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleLogin()}
                            placeholder="Enter username"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleLogin()}
                            placeholder="Enter password"
                        />
                    </div>
                    <button onClick={handleLogin} className="btn-primary w-full">Login to Dashboard</button>
                    <p className="text-xs text-gray-500 mt-4 text-center">Demo credentials: admin / admin123</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content bg-gray-100">
            <div className="admin-container">
                {/* Header */}
                <div className="admin-header">
                    <div>
                        <h1 className="admin-title">👮 Admin Dashboard</h1>
                        <p className="text-sm text-gray-600">Grievance Management System</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={loadData} className="btn-secondary text-sm" disabled={loading}>
                            {loading ? '⏳' : '🔄'} Refresh
                        </button>
                        <button onClick={() => setIsLoggedIn(false)} className="btn-outline text-sm">Logout</button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${activeTab === 'complaints' ? 'active' : ''}`}
                        onClick={() => setActiveTab('complaints')}
                    >
                        📋 All Complaints
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        📊 Analytics
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'appeals' ? 'active' : ''}`}
                        onClick={() => setActiveTab('appeals')}
                    >
                        ⚖️ Appeals ({appealedGrievances.length})
                    </button>
                </div>

                {/* Analytics Tab */}
                {activeTab === 'analytics' && stats && (
                    <div className="analytics-section">
                        {/* Summary Cards */}
                        <div className="analytics-grid">
                            <div className="analytics-card analytics-total">
                                <div className="analytics-number">{stats.total}</div>
                                <div className="analytics-label">Total Complaints</div>
                            </div>
                            <div className="analytics-card analytics-pending">
                                <div className="analytics-number">{stats.by_status.submitted}</div>
                                <div className="analytics-label">Pending</div>
                            </div>
                            <div className="analytics-card analytics-progress">
                                <div className="analytics-number">{stats.by_status.in_progress + (stats.by_status.assigned || 0)}</div>
                                <div className="analytics-label">In Progress</div>
                            </div>
                            <div className="analytics-card analytics-resolved">
                                <div className="analytics-number">{stats.by_status.resolved}</div>
                                <div className="analytics-label">Resolved</div>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="charts-grid">
                            {/* By Category */}
                            <div className="gov-card">
                                <h3 className="chart-title">📁 By Category</h3>
                                <div className="chart-bars">
                                    {Object.entries(stats.by_category).map(([cat, count]) => (
                                        <div key={cat} className="chart-bar-row">
                                            <span className="chart-bar-label">{cat}</span>
                                            <div className="chart-bar-container">
                                                <div
                                                    className="chart-bar"
                                                    style={{ width: `${(count / stats.total) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="chart-bar-value">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* By Priority */}
                            <div className="gov-card">
                                <h3 className="chart-title">⚡ By Priority</h3>
                                <div className="priority-stats">
                                    <div className="priority-stat priority-stat-high">
                                        <span className="priority-badge priority-high">HIGH</span>
                                        <span className="priority-count">{stats.by_priority.high}</span>
                                    </div>
                                    <div className="priority-stat priority-stat-medium">
                                        <span className="priority-badge priority-medium">MEDIUM</span>
                                        <span className="priority-count">{stats.by_priority.medium}</span>
                                    </div>
                                    <div className="priority-stat priority-stat-low">
                                        <span className="priority-badge priority-low">LOW</span>
                                        <span className="priority-count">{stats.by_priority.low}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Resolution Rate */}
                            <div className="gov-card">
                                <h3 className="chart-title">✅ Resolution Rate</h3>
                                <div className="resolution-rate">
                                    <div className="rate-circle">
                                        <span className="rate-value">
                                            {stats.total ? Math.round((stats.by_status.resolved / stats.total) * 100) : 0}%
                                        </span>
                                    </div>
                                    <p className="rate-label">{stats.by_status.resolved} of {stats.total} resolved</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Appeals Tab */}
                {activeTab === 'appeals' && (
                    <div className="appeals-section">
                        <div className="gov-card">
                            <h3 className="text-lg font-bold mb-4">⚖️ Appeal Handling</h3>
                            <p className="text-gray-600 mb-4">
                                Citizens can raise appeals against resolved grievances if not satisfied.
                                Review and reassign to Nodal Appellate Authority.
                            </p>
                            {appealedGrievances.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No resolved complaints available for appeal review
                                </div>
                            ) : (
                                <div className="appeals-list">
                                    {appealedGrievances.map(g => (
                                        <div key={g.id} className="appeal-item">
                                            <div className="appeal-info">
                                                <span className="font-mono text-sm">{g.id}</span>
                                                <span className="text-gray-600">| {g.category}</span>
                                                <span className="status-badge status-resolved">Resolved</span>
                                            </div>
                                            <div className="appeal-actions">
                                                <button
                                                    className="btn-secondary text-sm"
                                                    onClick={() => setSelectedGrievance(g)}
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    className="btn-primary text-sm"
                                                    onClick={() => handleStatusUpdate(g.id, 'in_progress', 'Reopened for appeal review by Nodal Authority')}
                                                >
                                                    Reopen for Appeal
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Complaints Tab */}
                {activeTab === 'complaints' && (
                    <>
                        {/* Stats Cards */}
                        {stats && (
                            <div className="stats-cards-grid">
                                <div className="stat-card-admin stat-total">
                                    <div className="stat-icon">📋</div>
                                    <div className="stat-info">
                                        <div className="stat-number">{stats.total}</div>
                                        <div className="stat-label">Total</div>
                                    </div>
                                </div>
                                <div className="stat-card-admin stat-pending">
                                    <div className="stat-icon">⏳</div>
                                    <div className="stat-info">
                                        <div className="stat-number">{stats.by_status.submitted}</div>
                                        <div className="stat-label">Pending</div>
                                    </div>
                                </div>
                                <div className="stat-card-admin stat-assigned">
                                    <div className="stat-icon">📤</div>
                                    <div className="stat-info">
                                        <div className="stat-number">{stats.by_status.assigned || 0}</div>
                                        <div className="stat-label">Assigned</div>
                                    </div>
                                </div>
                                <div className="stat-card-admin stat-inprogress">
                                    <div className="stat-icon">🔄</div>
                                    <div className="stat-info">
                                        <div className="stat-number">{stats.by_status.in_progress}</div>
                                        <div className="stat-label">In Progress</div>
                                    </div>
                                </div>
                                <div className="stat-card-admin stat-resolved">
                                    <div className="stat-icon">✅</div>
                                    <div className="stat-info">
                                        <div className="stat-number">{stats.by_status.resolved}</div>
                                        <div className="stat-label">Resolved</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Filters */}
                        <div className="gov-card">
                            <div className="filters-section">
                                <div className="filter-row">
                                    <div className="filter-group">
                                        <label>Search</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="ID, description, location..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <label>Status</label>
                                        <select
                                            className="form-input"
                                            value={statusFilter}
                                            onChange={e => setStatusFilter(e.target.value)}
                                        >
                                            <option value="all">All Status</option>
                                            <option value="submitted">Submitted</option>
                                            <option value="assigned">Assigned</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="resolved">Resolved</option>
                                        </select>
                                    </div>
                                    <div className="filter-group">
                                        <label>Priority</label>
                                        <select
                                            className="form-input"
                                            value={priorityFilter}
                                            onChange={e => setPriorityFilter(e.target.value)}
                                        >
                                            <option value="all">All Priority</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                    <div className="filter-group">
                                        <label>Category</label>
                                        <select
                                            className="form-input"
                                            value={categoryFilter}
                                            onChange={e => setCategoryFilter(e.target.value)}
                                        >
                                            <option value="all">All Categories</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="filter-results">
                                    Showing {filteredGrievances.length} of {grievances.length} complaints
                                </div>
                            </div>

                            {/* Table */}
                            {loading ? (
                                <div className="text-center py-8">Loading complaints...</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="gov-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Category</th>
                                                <th>Location</th>
                                                <th>Priority</th>
                                                <th>Status</th>
                                                <th>Image</th>
                                                <th>Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredGrievances.map(g => (
                                                <tr key={g.id} className="hover:bg-gray-50">
                                                    <td>
                                                        <button
                                                            onClick={() => setSelectedGrievance(g)}
                                                            className="font-mono text-sm text-blue-600 hover:underline"
                                                        >
                                                            {g.id}
                                                        </button>
                                                    </td>
                                                    <td><span className="category-badge">{g.category}</span></td>
                                                    <td className="max-w-[150px] truncate">{g.location}</td>
                                                    <td>
                                                        <span className={`priority-badge priority-${g.priority}`}>
                                                            {g.priority.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge status-${g.status.replace('_', '-')}`}>
                                                            {g.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {g.image_data ? (
                                                            <button
                                                                onClick={() => setSelectedGrievance(g)}
                                                                className="text-blue-600 hover:underline text-sm"
                                                            >
                                                                📷 View
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400">No image</span>
                                                        )}
                                                    </td>
                                                    <td className="text-sm">{formatDate(g.created_at)}</td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            {g.status === 'submitted' && (
                                                                <button
                                                                    className="btn-assign"
                                                                    onClick={() => {
                                                                        setSelectedDept(getDepartmentForCategory(g.category));
                                                                        setAssignModal({ grievance: g, open: true });
                                                                    }}
                                                                    disabled={updating === g.id}
                                                                >
                                                                    Assign
                                                                </button>
                                                            )}
                                                            {g.status === 'assigned' && (
                                                                <button
                                                                    className="btn-progress"
                                                                    onClick={() => handleStatusUpdate(g.id, 'in_progress')}
                                                                    disabled={updating === g.id}
                                                                >
                                                                    Start
                                                                </button>
                                                            )}
                                                            {g.status === 'in_progress' && (
                                                                <button
                                                                    className="btn-resolve"
                                                                    onClick={() => handleStatusUpdate(g.id, 'resolved')}
                                                                    disabled={updating === g.id}
                                                                >
                                                                    Resolve
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredGrievances.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            No complaints match your filters
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Assignment Modal */}
                {assignModal?.open && (
                    <div className="modal-overlay" onClick={() => setAssignModal(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Assign Complaint</h2>
                                <button onClick={() => setAssignModal(null)} className="modal-close">×</button>
                            </div>
                            <div className="modal-body">
                                <p className="text-sm text-gray-600 mb-4">
                                    Complaint ID: <strong>{assignModal.grievance.id}</strong>
                                </p>

                                <div className="form-group">
                                    <label className="form-label">Department *</label>
                                    <select
                                        className="form-input"
                                        value={selectedDept}
                                        onChange={e => setSelectedDept(e.target.value)}
                                    >
                                        <option value="">Select Department</option>
                                        {DEPARTMENTS.map(dept => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.icon} {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        🤖 AI Suggestion: {DEPARTMENTS.find(d => d.id === getDepartmentForCategory(assignModal.grievance.category))?.name}
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Assign to Officer (Optional)</label>
                                    <input
                                        className="form-input"
                                        placeholder="Officer name or ID"
                                        value={selectedOfficer}
                                        onChange={e => setSelectedOfficer(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Expected Resolution (Days)</label>
                                    <select
                                        className="form-input"
                                        value={resolutionDays}
                                        onChange={e => setResolutionDays(Number(e.target.value))}
                                    >
                                        <option value={3}>3 days (Urgent)</option>
                                        <option value={7}>7 days (High Priority)</option>
                                        <option value={15}>15 days (Medium)</option>
                                        <option value={30}>30 days (Standard)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button onClick={() => setAssignModal(null)} className="btn-outline">Cancel</button>
                                <button onClick={handleAssign} className="btn-primary" disabled={!selectedDept}>
                                    Assign to Department
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Detail Modal */}
                {selectedGrievance && (
                    <div className="modal-overlay" onClick={() => setSelectedGrievance(null)}>
                        <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Complaint Details</h2>
                                <button onClick={() => setSelectedGrievance(null)} className="modal-close">×</button>
                            </div>
                            <div className="modal-body">
                                <div className="detail-grid">
                                    <div className="detail-row">
                                        <span className="detail-label">Complaint ID</span>
                                        <span className="detail-value font-mono">{selectedGrievance.id}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Category</span>
                                        <span className="detail-value">
                                            <span className="category-badge">{selectedGrievance.category}</span>
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Priority</span>
                                        <span className="detail-value">
                                            <span className={`priority-badge priority-${selectedGrievance.priority}`}>
                                                {selectedGrievance.priority.toUpperCase()}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Status</span>
                                        <span className="detail-value">
                                            <span className={`status-badge status-${selectedGrievance.status.replace('_', '-')}`}>
                                                {selectedGrievance.status.replace('_', ' ')}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Location</span>
                                        <span className="detail-value">{selectedGrievance.location}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Submitted</span>
                                        <span className="detail-value">{formatDate(selectedGrievance.created_at)}</span>
                                    </div>
                                    {selectedGrievance.duplicate_score && selectedGrievance.duplicate_score > 0 && (
                                        <div className="detail-row">
                                            <span className="detail-label">Duplicate Score</span>
                                            <span className="detail-value text-orange-600">
                                                {selectedGrievance.duplicate_score}% similarity
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="detail-section">
                                    <h4>Description</h4>
                                    <p className="detail-description">{selectedGrievance.description}</p>
                                </div>

                                {selectedGrievance.image_data && (
                                    <div className="detail-section">
                                        <h4>Attached Image</h4>
                                        <img
                                            src={selectedGrievance.image_data}
                                            alt="Complaint evidence"
                                            className="detail-image"
                                        />
                                    </div>
                                )}

                                {selectedGrievance.timeline && selectedGrievance.timeline.length > 0 && (
                                    <div className="detail-section">
                                        <h4>Timeline</h4>
                                        <div className="timeline">
                                            {selectedGrievance.timeline.map((event, idx) => (
                                                <div key={idx} className="timeline-item">
                                                    <div className="timeline-dot"></div>
                                                    <div className="timeline-content">
                                                        <span className="timeline-status">{event.status}</span>
                                                        <span className="timeline-date">{formatDate(event.timestamp)}</span>
                                                        {event.remarks && <p className="timeline-remarks">{event.remarks}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button onClick={() => setSelectedGrievance(null)} className="btn-outline">Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
