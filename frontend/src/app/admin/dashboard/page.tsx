'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
    getStoredUser,
    getStoredToken,
    removeStoredToken,
    getAdminComplaints,
    getAdminAnalytics,
    assignComplaint,
    updateComplaintStatus,
    getAdminByDepartment,
    downloadAdminExport,
    type Grievance,
    type AdminAnalytics,
    type AdminComplaintFilters,
} from '@/lib/api';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [complaints, setComplaints] = useState<Grievance[]>([]);
    const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
    const [filters, setFilters] = useState<AdminComplaintFilters>({});
    const [selectedComplaint, setSelectedComplaint] = useState<Grievance | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [deptCounts, setDeptCounts] = useState<Record<string, number>>({});

    const LocationMap = dynamic(() => import('@/components/LocationMap'), { ssr: false });

    // Form states
    const [assignData, setAssignData] = useState({ department: '', officer_name: '', remarks: '' });
    const [statusData, setStatusData] = useState({ status: '', admin_remarks: '' });

    useEffect(() => {
        const checkAdminAccess = async () => {
            const token = getStoredToken();
            const user = getStoredUser();

            if (!token) {
                router.push('/login');
                return;
            }

            if (user?.role !== 'admin') {
                router.push('/dashboard');
                return;
            }

            await loadData();
            setLoading(false);
        };

        checkAdminAccess();
    }, [router]);

    const loadData = async () => {
        try {
            const [complaintsData, analyticsData, deptData] = await Promise.all([
                getAdminComplaints(filters),
                getAdminAnalytics(),
                getAdminByDepartment()
            ]);
            setComplaints(complaintsData);
            setAnalytics(analyticsData);
            setDeptCounts(deptData);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const handleFilterChange = (key: keyof AdminComplaintFilters, value: string) => {
        const newFilters = { ...filters, [key]: value || undefined };
        setFilters(newFilters);
    };

    const applyFilters = () => {
        loadData();
    };

    const clearFilters = () => {
        setFilters({});
        loadData();
    };

    const handleAssign = async () => {
        if (!selectedComplaint) return;
        try {
            await assignComplaint(selectedComplaint.id, assignData);
            setShowAssignModal(false);
            setAssignData({ department: '', officer_name: '', remarks: '' });
            loadData();
        } catch (error) {
            console.error('Failed to assign:', error);
        }
    };

    const handleStatusUpdate = async () => {
        if (!selectedComplaint) return;
        try {
            await updateComplaintStatus(selectedComplaint.id, statusData);
            setShowStatusModal(false);
            setStatusData({ status: '', admin_remarks: '' });
            loadData();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'submitted': return 'status-badge status-submitted';
            case 'assigned': return 'status-badge status-assigned';
            case 'in_progress': return 'status-badge status-in-progress';
            case 'resolved': return 'status-badge status-resolved';
            default: return 'status-badge';
        }
    };

    const getPriorityBadgeClass = (priority: string) => {
        switch (priority) {
            case 'high': return 'priority-badge priority-high';
            case 'medium': return 'priority-badge priority-medium';
            case 'low': return 'priority-badge priority-low';
            default: return 'priority-badge';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="page-content flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">⏳</div>
                    <p>Loading Admin Dashboard...</p>
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
                        <p className="text-sm text-gray-500">Grievance Management System</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/dashboard" className="btn-outline text-sm">
                            User Dashboard
                        </Link>
                        <button onClick={() => { removeStoredToken(); router.push('/'); }} className="btn-outline text-sm">
                            Logout
                        </button>
                    </div>
                </div>

                {/* Analytics Cards */}
                {analytics && (
                    <div className="stats-cards-grid">
                        <div className="stat-card-admin">
                            <div className="stat-icon">📋</div>
                            <div>
                                <div className="stat-number">{analytics.total_complaints}</div>
                                <div className="stat-label">Total</div>
                            </div>
                        </div>
                        <div className="stat-card-admin stat-pending">
                            <div className="stat-icon">⏳</div>
                            <div>
                                <div className="stat-number">{analytics.pending_count}</div>
                                <div className="stat-label">Pending</div>
                            </div>
                        </div>
                        <div className="stat-card-admin" style={{ borderColor: '#dc2626' }}>
                            <div className="stat-icon">🔴</div>
                            <div>
                                <div className="stat-number">{analytics.high_priority_count}</div>
                                <div className="stat-label">High Priority</div>
                            </div>
                        </div>
                        <div className="stat-card-admin stat-resolved">
                            <div className="stat-icon">✅</div>
                            <div>
                                <div className="stat-number">{analytics.resolved_count}</div>
                                <div className="stat-label">Resolved</div>
                            </div>
                        </div>
                        <div className="stat-card-admin">
                            <div className="stat-icon">📊</div>
                            <div>
                                <div className="stat-number">{analytics.resolution_rate}%</div>
                                <div className="stat-label">Resolution Rate</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Charts Section */}
                <div className="gov-card mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-[#003366]">📊 Complaints by Department</h3>
                        <button onClick={downloadAdminExport} className="btn-primary text-sm flex items-center gap-2">
                            📥 Export CSV
                        </button>
                    </div>

                    <div className="h-48 flex items-end gap-2 border-b border-gray-300 pb-2">
                        {Object.entries(deptCounts).length > 0 ? (
                            Object.entries(deptCounts).map(([dept, count]) => {
                                const max = Math.max(...Object.values(deptCounts)) || 1;
                                const height = Math.max((count / max) * 100, 5); // min 5%
                                return (
                                    <div key={dept} className="flex-1 flex flex-col items-center justify-end group">
                                        <div className="text-xs font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{count}</div>
                                        <div
                                            className="w-full bg-[#003366] rounded-t hover:bg-[#002244] transition-all"
                                            style={{ height: `${height}%` }}
                                        />
                                        <div className="text-[10px] mt-2 text-center truncate w-full h-8 leading-tight text-gray-600">
                                            {dept}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="w-full text-center text-gray-500 self-center">No data available for charts</p>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="gov-card mb-4">
                    <h3 className="font-bold text-[#003366] mb-3">🔍 Filter Complaints</h3>
                    <div className="filter-row">
                        <div className="filter-group">
                            <label>Search</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="ID, description, location..."
                                value={filters.search || ''}
                                onChange={e => handleFilterChange('search', e.target.value)}
                            />
                        </div>
                        <div className="filter-group">
                            <label>Status</label>
                            <select
                                className="form-input"
                                value={filters.status || ''}
                                onChange={e => handleFilterChange('status', e.target.value)}
                            >
                                <option value="">All</option>
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
                                value={filters.priority || ''}
                                onChange={e => handleFilterChange('priority', e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Category</label>
                            <select
                                className="form-input"
                                value={filters.category || ''}
                                onChange={e => handleFilterChange('category', e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="road">Road</option>
                                <option value="water">Water</option>
                                <option value="electricity">Electricity</option>
                                <option value="sanitation">Sanitation</option>
                                <option value="health_safety">Health & Safety</option>
                                <option value="others">Others</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button onClick={applyFilters} className="btn-primary text-sm">Apply Filters</button>
                        <button onClick={clearFilters} className="btn-outline text-sm">Clear</button>
                    </div>
                </div>

                {/* Complaints Table */}
                <div className="gov-card">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-[#003366]">📋 All Complaints ({complaints.length})</h3>
                        <button onClick={loadData} className="btn-outline text-sm">🔄 Refresh</button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="gov-table w-full">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>User</th>
                                    <th>Category</th>
                                    <th>Area</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-gray-500">
                                            No complaints found
                                        </td>
                                    </tr>
                                ) : (
                                    complaints.map(complaint => (
                                        <tr key={complaint.id}>
                                            <td className="font-mono text-xs">{complaint.id}</td>
                                            <td className="text-sm">{complaint.submitter_name}</td>
                                            <td className="capitalize text-sm">{complaint.category.replace('_', ' ')}</td>
                                            <td className="text-sm max-w-32 truncate">{complaint.location}</td>
                                            <td>
                                                <span className={getPriorityBadgeClass(complaint.priority)}>
                                                    {complaint.priority.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={getStatusBadgeClass(complaint.status)}>
                                                    {complaint.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="text-xs">{formatDate(complaint.created_at)}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-outline text-xs px-2 py-1"
                                                        onClick={() => {
                                                            setSelectedComplaint(complaint);
                                                            setShowViewModal(true);
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        className="btn-assign"
                                                        onClick={() => {
                                                            setSelectedComplaint(complaint);
                                                            setAssignData({ department: complaint.department, officer_name: '', remarks: '' });
                                                            setShowAssignModal(true);
                                                        }}
                                                    >
                                                        Assign
                                                    </button>
                                                    <button
                                                        className="btn-progress"
                                                        onClick={() => {
                                                            setSelectedComplaint(complaint);
                                                            setStatusData({ status: '', admin_remarks: '' });
                                                            setShowStatusModal(true);
                                                        }}
                                                    >
                                                        Status
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Assign Modal */}
                {showAssignModal && selectedComplaint && (
                    <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Assign Complaint</h2>
                                <button className="modal-close" onClick={() => setShowAssignModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <p className="text-sm text-gray-600 mb-4">Complaint: {selectedComplaint.id}</p>
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <select
                                        className="form-input"
                                        value={assignData.department}
                                        onChange={e => setAssignData({ ...assignData, department: e.target.value })}
                                    >
                                        <option value="">Select Department</option>
                                        <option value="Public Works Department">Public Works Dept.</option>
                                        <option value="Municipal Corporation">Municipal Corp.</option>
                                        <option value="Health Department">Health Dept.</option>
                                        <option value="Electricity Board">Electricity Board</option>
                                        <option value="Water Supply">Water Supply</option>
                                        <option value="Transport Department">Transport Dept.</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Officer Name (Optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={assignData.officer_name}
                                        onChange={e => setAssignData({ ...assignData, officer_name: e.target.value })}
                                        placeholder="Assigned officer name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Remarks</label>
                                    <textarea
                                        className="form-input"
                                        value={assignData.remarks}
                                        onChange={e => setAssignData({ ...assignData, remarks: e.target.value })}
                                        placeholder="Assignment remarks..."
                                        rows={2}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-outline" onClick={() => setShowAssignModal(false)}>Cancel</button>
                                <button className="btn-primary" onClick={handleAssign}>Assign</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Modal */}
                {showStatusModal && selectedComplaint && (
                    <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Update Status</h2>
                                <button className="modal-close" onClick={() => setShowStatusModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <p className="text-sm text-gray-600 mb-2">Complaint: {selectedComplaint.id}</p>
                                <p className="text-sm mb-4">
                                    Current: <span className={getStatusBadgeClass(selectedComplaint.status)}>
                                        {selectedComplaint.status.replace('_', ' ')}
                                    </span>
                                </p>
                                <div className="form-group">
                                    <label className="form-label">New Status</label>
                                    <select
                                        className="form-input"
                                        value={statusData.status}
                                        onChange={e => setStatusData({ ...statusData, status: e.target.value })}
                                    >
                                        <option value="">Select Status</option>
                                        <option value="submitted">Submitted</option>
                                        <option value="assigned">Assigned</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Admin Remarks</label>
                                    <textarea
                                        className="form-input"
                                        value={statusData.admin_remarks}
                                        onChange={e => setStatusData({ ...statusData, admin_remarks: e.target.value })}
                                        placeholder="Add remarks for the citizen..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-outline" onClick={() => setShowStatusModal(false)}>Cancel</button>
                                <button className="btn-primary" onClick={handleStatusUpdate}>Update</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Details Modal */}
                {showViewModal && selectedComplaint && (
                    <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Complaint Details</h2>
                                <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <p className="text-sm font-bold text-[#003366] mb-2">Complaint #{selectedComplaint.id}</p>
                                <p className="text-gray-700 mb-4">{selectedComplaint.description}</p>

                                {selectedComplaint.audio_path && (
                                    <div className="mb-4">
                                        <label className="text-sm font-bold block mb-1">Voice Note</label>
                                        {selectedComplaint.audio_language && (
                                            <p className="text-xs text-[#003366] mb-1 font-bold">
                                                Language: <span className="text-gray-600 font-normal">{selectedComplaint.audio_language}</span>
                                            </p>
                                        )}
                                        <audio controls className="w-full h-8">
                                            <source src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/uploads/${selectedComplaint.audio_path}`} />
                                        </audio>
                                    </div>
                                )}

                                {(selectedComplaint.lat || (selectedComplaint as any).lat) && (
                                    <div className="mb-4">
                                        <label className="text-sm font-bold block mb-1">Location Pin</label>
                                        <div className="h-[200px] rounded border overflow-hidden">
                                            <LocationMap
                                                initialLat={(selectedComplaint.lat || (selectedComplaint as any).lat) as number}
                                                initialLng={(selectedComplaint.lng || (selectedComplaint as any).lng) as number}
                                                onLocationSelect={() => { }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Department:</span>
                                        <p className="font-medium">{selectedComplaint.department}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Priority:</span>
                                        <p className="font-medium uppercase">{selectedComplaint.priority}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-primary" onClick={() => setShowViewModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
