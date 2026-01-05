'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getStoredToken,
    getStoredUser,
    getAutoAssignmentQueue,
    getAutoAssignmentStats,
    getAutoAssignmentDepartments,
    getAutoAssignmentConfig,
    updateAutoAssignmentConfig,
    approveAutoAssignment,
    rejectAutoAssignment,
    bulkAutoAssignment,
    syncAutoAssignmentQueue,
    type AutoAssignmentQueueItem,
    type AutoAssignmentStats,
    type AutoAssignmentConfig
} from '@/lib/api';
import AdminNav from '@/components/AdminNav';

export default function AutoAssignmentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [queueItems, setQueueItems] = useState<AutoAssignmentQueueItem[]>([]);
    const [stats, setStats] = useState<AutoAssignmentStats | null>(null);
    const [config, setConfig] = useState<AutoAssignmentConfig | null>(null);
    const [departments, setDepartments] = useState<string[]>([]);

    // Filters
    const [filterDays, setFilterDays] = useState<number>(20);
    const [filterStatus, setFilterStatus] = useState<string>('pending_approval');
    const [filterDepartment, setFilterDepartment] = useState<string>('');

    // UI State
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState<{ item: AutoAssignmentQueueItem } | null>(null);
    const [showRejectModal, setShowRejectModal] = useState<{ item: AutoAssignmentQueueItem } | null>(null);
    const [showBulkModal, setShowBulkModal] = useState<'approve' | 'reject' | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Form state
    const [approveForm, setApproveForm] = useState({ department: '', remarks: '' });
    const [rejectForm, setRejectForm] = useState({ reason: '' });
    const [configForm, setConfigForm] = useState({ review_window_days: 20, auto_assign_threshold: 85, enabled: true });

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = getStoredToken();
        const user = getStoredUser();
        if (!token || user?.role !== 'admin') {
            router.push('/login');
            return;
        }
        loadData();
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [queueData, statsData, deptData, configData] = await Promise.all([
                getAutoAssignmentQueue({
                    days: filterDays,
                    status: filterStatus || undefined,
                    department: filterDepartment || undefined
                }),
                getAutoAssignmentStats(),
                getAutoAssignmentDepartments(),
                getAutoAssignmentConfig()
            ]);

            setQueueItems(queueData.items);
            setStats(statsData);
            setDepartments(deptData.departments);
            setConfig(configData);
            setConfigForm({
                review_window_days: configData.review_window_days,
                auto_assign_threshold: configData.auto_assign_threshold,
                enabled: configData.enabled
            });
        } catch (error) {
            console.error('Failed to load data:', error);
            showNotification('error', 'Failed to load data');
        }
        setLoading(false);
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const result = await syncAutoAssignmentQueue();
            showNotification('success', result.message);
            loadData();
        } catch (error) {
            showNotification('error', 'Failed to sync complaints');
        }
        setSyncing(false);
    };

    const handleApprove = async () => {
        if (!showApproveModal || !approveForm.department) return;

        setActionLoading(true);
        try {
            await approveAutoAssignment(
                showApproveModal.item.complaint_id,
                approveForm.department,
                approveForm.remarks
            );
            showNotification('success', `Complaint ${showApproveModal.item.complaint_id} approved and assigned!`);
            setShowApproveModal(null);
            setApproveForm({ department: '', remarks: '' });
            loadData();
        } catch (error) {
            showNotification('error', 'Failed to approve assignment');
        }
        setActionLoading(false);
    };

    const handleReject = async () => {
        if (!showRejectModal) return;

        setActionLoading(true);
        try {
            await rejectAutoAssignment(showRejectModal.item.complaint_id, rejectForm.reason);
            showNotification('success', `Complaint ${showRejectModal.item.complaint_id} marked for manual review`);
            setShowRejectModal(null);
            setRejectForm({ reason: '' });
            loadData();
        } catch (error) {
            showNotification('error', 'Failed to reject assignment');
        }
        setActionLoading(false);
    };

    const handleBulkAction = async () => {
        if (selectedItems.size === 0 || !showBulkModal) return;

        if (showBulkModal === 'approve' && !approveForm.department) {
            showNotification('error', 'Please select a department');
            return;
        }

        setActionLoading(true);
        try {
            const result = await bulkAutoAssignment(
                Array.from(selectedItems),
                showBulkModal,
                showBulkModal === 'approve' ? approveForm.department : undefined,
                showBulkModal === 'approve' ? approveForm.remarks : rejectForm.reason
            );

            showNotification('success', result.message);
            setShowBulkModal(null);
            setSelectedItems(new Set());
            setApproveForm({ department: '', remarks: '' });
            setRejectForm({ reason: '' });
            loadData();
        } catch (error) {
            showNotification('error', 'Bulk operation failed');
        }
        setActionLoading(false);
    };

    const handleUpdateConfig = async () => {
        setActionLoading(true);
        try {
            const updated = await updateAutoAssignmentConfig(configForm);
            setConfig(updated);
            showNotification('success', 'Configuration updated successfully');
            setShowConfigModal(false);
        } catch (error) {
            showNotification('error', 'Failed to update configuration');
        }
        setActionLoading(false);
    };

    const toggleSelectItem = (id: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === queueItems.filter(i => i.current_status === 'pending_approval').length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(queueItems.filter(i => i.current_status === 'pending_approval').map(i => i.complaint_id)));
        }
    };

    const getConfidenceColor = (score: number) => {
        if (score >= 75) return 'text-green-600 bg-green-50';
        if (score >= 50) return 'text-orange-600 bg-orange-50';
        return 'text-red-600 bg-red-50';
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200';
            case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'review_required': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 pt-40 flex justify-center">
                <div className="text-2xl font-bold text-[#003366] uppercase tracking-widest">
                    Loading Auto Assignment Queue...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* HEADER OFFSET */}
            <div className="h-36"></div>

            {/* CENTERED CONTAINER */}
            <div className="max-w-[1400px] mx-auto px-8 pb-20">

                {/* PAGE TITLE */}
                <header className="text-center mb-10 pt-6">
                    <h1 className="text-4xl font-bold text-[#003366] uppercase tracking-wide">
                        Auto Grievance Assignment Queue
                    </h1>
                    <p className="text-xl text-gray-600 mt-3">
                        AI-Assisted Department Suggestions with Admin Approval
                    </p>
                </header>

                {/* NAVIGATION TABS */}
                <AdminNav />

                {/* Notification Toast */}
                {notification && (
                    <div className={`fixed top-40 right-8 z-50 px-6 py-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                        {notification.message}
                    </div>
                )}

                {/* STATS SUMMARY */}
                <section className="bg-white rounded-lg shadow-lg p-8 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-[#003366] uppercase tracking-wide">
                            Queue Statistics
                        </h2>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50"
                            >
                                {syncing ? '🔄 Syncing...' : '🔄 Sync Complaints'}
                            </button>
                            <button
                                onClick={loadData}
                                disabled={loading}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium text-sm disabled:opacity-50"
                            >
                                {loading ? '⏳ Refreshing...' : '🔃 Refresh'}
                            </button>
                            <button
                                onClick={() => setShowConfigModal(true)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
                            >
                                ⚙️ Configure
                            </button>
                        </div>
                    </div>

                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                                <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
                                <p className="text-sm font-bold text-blue-800 uppercase">Total</p>
                            </div>
                            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 text-center">
                                <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
                                <p className="text-sm font-bold text-yellow-800 uppercase">Pending</p>
                            </div>
                            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                                <p className="text-3xl font-bold text-green-700">{stats.approved}</p>
                                <p className="text-sm font-bold text-green-800 uppercase">Approved</p>
                            </div>
                            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
                                <p className="text-3xl font-bold text-red-700">{stats.rejected}</p>
                                <p className="text-sm font-bold text-red-800 uppercase">Rejected</p>
                            </div>
                            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 text-center">
                                <p className="text-3xl font-bold text-purple-700">{stats.average_confidence}%</p>
                                <p className="text-sm font-bold text-purple-800 uppercase">Avg Confidence</p>
                            </div>
                        </div>
                    )}
                </section>

                {/* FILTERS */}
                <section className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Time Window (Days)</label>
                            <select
                                value={filterDays}
                                onChange={(e) => setFilterDays(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={7}>Last 7 days</option>
                                <option value={14}>Last 14 days</option>
                                <option value={20}>Last 20 days</option>
                                <option value={30}>Last 30 days</option>
                                <option value={60}>Last 60 days</option>
                                <option value={90}>Last 90 days</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending_approval">Pending Approval</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="review_required">Review Required</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Department</label>
                            <select
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={loadData}
                            className="px-6 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004488] font-bold"
                        >
                            Apply Filters
                        </button>
                    </div>
                </section>

                {/* BULK ACTIONS BAR */}
                {selectedItems.size > 0 && (
                    <section className="bg-blue-600 text-white rounded-lg shadow-lg p-4 mb-4 flex justify-between items-center">
                        <span className="font-bold">{selectedItems.size} complaints selected</span>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBulkModal('approve')}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-bold"
                            >
                                ✅ Bulk Approve
                            </button>
                            <button
                                onClick={() => setShowBulkModal('reject')}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-bold"
                            >
                                ❌ Bulk Reject
                            </button>
                            <button
                                onClick={() => setSelectedItems(new Set())}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg font-bold"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </section>
                )}

                {/* QUEUE TABLE */}
                <section className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#003366] text-white">
                                <tr>
                                    <th className="px-4 py-4 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.size === queueItems.filter(i => i.current_status === 'pending_approval').length && queueItems.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4"
                                        />
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-bold uppercase">Complaint ID</th>
                                    <th className="px-4 py-4 text-left text-sm font-bold uppercase">Summary</th>
                                    <th className="px-4 py-4 text-left text-sm font-bold uppercase">NLP Category</th>
                                    <th className="px-4 py-4 text-left text-sm font-bold uppercase">Suggested Dept</th>
                                    <th className="px-4 py-4 text-center text-sm font-bold uppercase">Confidence</th>
                                    <th className="px-4 py-4 text-center text-sm font-bold uppercase">Days</th>
                                    <th className="px-4 py-4 text-center text-sm font-bold uppercase">Priority</th>
                                    <th className="px-4 py-4 text-center text-sm font-bold uppercase">Status</th>
                                    <th className="px-4 py-4 text-center text-sm font-bold uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {queueItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-8 py-16 text-center text-gray-500">
                                            <div className="text-5xl mb-4">📋</div>
                                            <p className="text-xl font-bold">No complaints in queue</p>
                                            <p className="text-sm mt-2">Adjust filters or wait for new submissions</p>
                                        </td>
                                    </tr>
                                ) : (
                                    queueItems.map((item) => (
                                        <tr key={item.complaint_id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                {item.current_status === 'pending_approval' && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.has(item.complaint_id)}
                                                        onChange={() => toggleSelectItem(item.complaint_id)}
                                                        className="w-4 h-4"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <Link
                                                    href={`/admin/complaints/${item.complaint_id}`}
                                                    className="font-mono text-sm text-blue-600 hover:underline"
                                                >
                                                    {item.complaint_id.substring(0, 12)}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm text-gray-700 max-w-xs truncate" title={item.complaint_summary}>
                                                    {item.complaint_summary}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">📍 {item.location}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold uppercase">
                                                    {item.nlp_category.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {item.suggested_department}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getConfidenceColor(item.confidence_score)}`}>
                                                    {item.confidence_score}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`text-lg font-bold ${item.days_since_submission >= 7 ? 'text-red-600' : item.days_since_submission >= 3 ? 'text-orange-600' : 'text-green-600'}`}>
                                                    {item.days_since_submission}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`px-2 py-1 border rounded text-xs font-bold uppercase ${getPriorityColor(item.priority)}`}>
                                                    {item.priority}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(item.current_status)}`}>
                                                    {item.current_status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {item.current_status === 'pending_approval' && (
                                                    <div className="flex gap-2 justify-center">
                                                        <button
                                                            onClick={() => {
                                                                setApproveForm({ department: item.suggested_department, remarks: '' });
                                                                setShowApproveModal({ item });
                                                            }}
                                                            className="px-3 py-1 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700"
                                                        >
                                                            ✅ Approve
                                                        </button>
                                                        <button
                                                            onClick={() => setShowRejectModal({ item })}
                                                            className="px-3 py-1 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700"
                                                        >
                                                            ❌ Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* AI INFO BOX */}
                <section className="bg-white rounded-lg shadow-lg p-8 mt-8">
                    <h3 className="text-lg font-bold text-[#003366] mb-4">🤖 How AI Auto-Assignment Works</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-bold text-blue-800 mb-2">1. Text Analysis</h4>
                            <p className="text-sm text-gray-700">
                                AI analyzes complaint text using keyword matching and NLP to identify the most relevant department.
                            </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h4 className="font-bold text-purple-800 mb-2">2. Confidence Score</h4>
                            <p className="text-sm text-gray-700">
                                A confidence score (0-100%) indicates how certain the AI is about its suggestion based on keyword density.
                            </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-bold text-green-800 mb-2">3. Admin Approval</h4>
                            <p className="text-sm text-gray-700">
                                All suggestions require admin approval. You can accept, modify the department, or reject the suggestion.
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            {/* APPROVE MODAL */}
            {showApproveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4">
                        <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg">
                            <h2 className="text-xl font-bold">✅ Approve Assignment</h2>
                        </div>
                        <div className="p-6">
                            <p className="mb-4">
                                Complaint ID: <strong className="font-mono">{showApproveModal.item.complaint_id}</strong>
                            </p>
                            <p className="mb-4 text-sm text-gray-600">
                                AI Suggested: <strong>{showApproveModal.item.suggested_department}</strong>
                                (Confidence: {showApproveModal.item.confidence_score}%)
                            </p>

                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Assign to Department *</label>
                                <select
                                    value={approveForm.department}
                                    onChange={(e) => setApproveForm({ ...approveForm, department: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Remarks (Optional)</label>
                                <textarea
                                    value={approveForm.remarks}
                                    onChange={(e) => setApproveForm({ ...approveForm, remarks: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    rows={3}
                                    placeholder="Add any notes..."
                                />
                            </div>
                        </div>
                        <div className="bg-gray-100 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                            <button
                                onClick={() => setShowApproveModal(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={actionLoading || !approveForm.department}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold disabled:opacity-50"
                            >
                                {actionLoading ? 'Processing...' : 'Approve & Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REJECT MODAL */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4">
                        <div className="bg-red-600 text-white px-6 py-4 rounded-t-lg">
                            <h2 className="text-xl font-bold">❌ Reject Auto-Suggestion</h2>
                        </div>
                        <div className="p-6">
                            <p className="mb-4">
                                Complaint ID: <strong className="font-mono">{showRejectModal.item.complaint_id}</strong>
                            </p>
                            <p className="mb-4 text-sm text-gray-600">
                                This will mark the complaint for <strong>manual review</strong>.
                                It will NOT be assigned automatically.
                            </p>

                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Rejection (Optional)</label>
                                <textarea
                                    value={rejectForm.reason}
                                    onChange={(e) => setRejectForm({ reason: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                    rows={3}
                                    placeholder="Why is the AI suggestion incorrect?"
                                />
                            </div>
                        </div>
                        <div className="bg-gray-100 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                            <button
                                onClick={() => setShowRejectModal(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={actionLoading}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold disabled:opacity-50"
                            >
                                {actionLoading ? 'Processing...' : 'Reject & Mark for Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BULK ACTION MODAL */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4">
                        <div className={`${showBulkModal === 'approve' ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 rounded-t-lg`}>
                            <h2 className="text-xl font-bold">
                                {showBulkModal === 'approve' ? '✅ Bulk Approve' : '❌ Bulk Reject'}
                            </h2>
                        </div>
                        <div className="p-6">
                            <p className="mb-4">
                                You are about to {showBulkModal} <strong>{selectedItems.size}</strong> complaints.
                            </p>

                            {showBulkModal === 'approve' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Assign All to Department *</label>
                                    <select
                                        value={approveForm.department}
                                        onChange={(e) => setApproveForm({ ...approveForm, department: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    {showBulkModal === 'approve' ? 'Remarks' : 'Reason'} (Optional)
                                </label>
                                <textarea
                                    value={showBulkModal === 'approve' ? approveForm.remarks : rejectForm.reason}
                                    onChange={(e) => showBulkModal === 'approve'
                                        ? setApproveForm({ ...approveForm, remarks: e.target.value })
                                        : setRejectForm({ reason: e.target.value })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="bg-gray-100 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                            <button
                                onClick={() => setShowBulkModal(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkAction}
                                disabled={actionLoading || (showBulkModal === 'approve' && !approveForm.department)}
                                className={`px-6 py-2 text-white rounded-lg font-bold disabled:opacity-50 ${showBulkModal === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                {actionLoading ? 'Processing...' : `Confirm Bulk ${showBulkModal === 'approve' ? 'Approve' : 'Reject'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIG MODAL */}
            {showConfigModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4">
                        <div className="bg-[#003366] text-white px-6 py-4 rounded-t-lg">
                            <h2 className="text-xl font-bold">⚙️ Auto Assignment Configuration</h2>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Review Window (Days)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={90}
                                    value={configForm.review_window_days}
                                    onChange={(e) => setConfigForm({ ...configForm, review_window_days: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Default time window for reviewing auto-categorized complaints
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Auto-Assign Threshold (%)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={configForm.auto_assign_threshold}
                                    onChange={(e) => setConfigForm({ ...configForm, auto_assign_threshold: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    (Future use) Confidence threshold for automatic assignment without review
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={configForm.enabled}
                                        onChange={(e) => setConfigForm({ ...configForm, enabled: e.target.checked })}
                                        className="w-5 h-5"
                                    />
                                    <span className="font-bold text-gray-700">Enable Auto-Categorization</span>
                                </label>
                            </div>
                        </div>
                        <div className="bg-gray-100 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfigModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateConfig}
                                disabled={actionLoading}
                                className="px-6 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004488] font-bold disabled:opacity-50"
                            >
                                {actionLoading ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
