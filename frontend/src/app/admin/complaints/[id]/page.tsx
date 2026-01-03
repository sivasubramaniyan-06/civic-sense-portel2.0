'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
    getStoredToken,
    getStoredUser,
    getAdminComplaintDetail,
    assignComplaint,
    updateComplaintStatus,
    type Grievance
} from '@/lib/api';

const LocationMap = dynamic(() => import('@/components/LocationMap'), { ssr: false });

export default function AdminComplaintDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [complaint, setComplaint] = useState<Grievance | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);

    // Action States
    const [assignData, setAssignData] = useState({ department: '', officer_name: '', remarks: '' });
    const [statusData, setStatusData] = useState({ status: '', admin_remarks: '' });

    useEffect(() => {
        checkAuthAndLoad();
    }, [id]);

    const checkAuthAndLoad = async () => {
        const token = getStoredToken();
        const user = getStoredUser();
        if (!token || user?.role !== 'admin') {
            router.push('/login');
            return;
        }
        await loadData();
    };

    const loadData = async () => {
        try {
            const res = await getAdminComplaintDetail(id);
            if (res.success) {
                setComplaint(res.complaint);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleAssign = async () => {
        if (!complaint) return;
        try {
            await assignComplaint(complaint.id, assignData);
            setShowAssignModal(false);
            loadData(); // Reload to see changes
        } catch (e) {
            alert('Failed to assign');
        }
    };

    const handleStatusUpdate = async () => {
        if (!complaint) return;
        try {
            await updateComplaintStatus(complaint.id, statusData);
            setShowStatusModal(false);
            loadData();
        } catch (e) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading details...</div>;
    if (!complaint) return <div className="p-8 text-center">Complaint not found</div>;

    return (
        <div className="page-content bg-gray-50 min-h-screen">
            <div className="admin-container p-6 max-w-5xl mx-auto">
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/admin/complaints" className="text-gray-500 hover:text-[#003366]">
                        &larr; Back to List
                    </Link>
                    <h1 className="text-2xl font-bold text-[#003366]">Complaint #{complaint.id}</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Details */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Main Info */}
                        <div className="gov-card">
                            <h2 className="text-lg font-bold text-[#003366] mb-4 border-b pb-2">📋 Issue Details</h2>
                            <p className="text-gray-800 text-lg mb-4">{complaint.description}</p>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-gray-500">Category</span>
                                    <span className="font-semibold capitalize">{complaint.category.replace('_', ' ')}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Location</span>
                                    <span className="font-semibold">{complaint.location}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Submitted By</span>
                                    <span className="font-semibold">{complaint.submitter_name}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Date</span>
                                    <span className="font-semibold">{new Date(complaint.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* AI Analysis */}
                        <div className="gov-card bg-blue-50 border-blue-100">
                            <h2 className="text-sm font-bold text-[#003366] mb-2">🤖 AI Analysis</h2>
                            <p className="text-sm text-gray-700 mb-2">{complaint.ai_explanation}</p>
                            <div className="flex flex-wrap gap-2">
                                {complaint.keywords_found.map(k => (
                                    <span key={k} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{k}</span>
                                ))}
                            </div>
                        </div>

                        {/* Media */}
                        {complaint.audio_path && (
                            <div className="gov-card">
                                <h2 className="text-lg font-bold text-[#003366] mb-4">🎤 Voice Note</h2>
                                {(complaint as any).audio_language && (
                                    <p className="text-sm font-bold text-[#003366] mb-2">
                                        Language: <span className="font-normal text-gray-700">{(complaint as any).audio_language}</span>
                                    </p>
                                )}
                                <audio controls className="w-full">
                                    <source src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/uploads/${complaint.audio_path}`} />
                                </audio>
                            </div>
                        )}

                        {(complaint.lat || (complaint as any).lat) && (
                            <div className="gov-card">
                                <h2 className="text-lg font-bold text-[#003366] mb-4">📍 Location Map</h2>
                                <div className="h-64 rounded border overflow-hidden">
                                    <LocationMap
                                        initialLat={(complaint.lat || (complaint as any).lat) as number}
                                        initialLng={(complaint.lng || (complaint as any).lng) as number}
                                        onLocationSelect={() => { }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Status & Actions */}
                    <div className="space-y-6">
                        <div className="gov-card bg-white border-l-4 border-l-[#003366]">
                            <h2 className="text-lg font-bold text-[#003366] mb-4">Status</h2>
                            <div className="mb-4">
                                <span className={`inline-block px-3 py-1 rounded text-sm font-bold uppercase ${complaint.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {complaint.priority} Priority
                                </span>
                            </div>
                            <div className="mb-6">
                                <span className="block text-gray-500 text-sm mb-1">Current Status</span>
                                <span className="text-2xl font-bold capitalize text-gray-800">{complaint.status.replace('_', ' ')}</span>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        setAssignData({ department: complaint.department, officer_name: '', remarks: '' });
                                        setShowAssignModal(true);
                                    }}
                                    className="w-full btn-assign text-center py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                                >
                                    Assign Department
                                </button>
                                <button
                                    onClick={() => {
                                        setStatusData({ status: '', admin_remarks: '' });
                                        setShowStatusModal(true);
                                    }}
                                    className="w-full btn-progress text-center py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                                >
                                    Update Status
                                </button>
                            </div>
                        </div>

                        {/* Status Timeline */}
                        <div className="gov-card">
                            <h2 className="text-lg font-bold text-[#003366] mb-4">📅 Timeline</h2>
                            <div className="space-y-4 border-l-2 border-gray-200 ml-2 pl-4 relative">
                                {complaint.timeline && complaint.timeline.length > 0 ? (
                                    [...complaint.timeline].reverse().map((entry, i) => (
                                        <div key={i} className="relative">
                                            <div className="absolute -left-[21px] top-1 w-3 h-3 bg-[#003366] rounded-full"></div>
                                            <p className="font-bold text-sm capitalize">{entry.status.replace('_', ' ')}</p>
                                            <p className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</p>
                                            {entry.remarks && <p className="text-xs text-gray-700 mt-1 italic">"{entry.remarks}"</p>}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm">No history available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modals reuse same structure as Dashboard - simplified here for brevity but functional */}
                {/* Assign Modal */}
                {showAssignModal && (
                    <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h2 className="text-xl font-bold mb-4">Assign Complaint</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm mb-1">Department</label>
                                    <select className="form-input" value={assignData.department} onChange={e => setAssignData({ ...assignData, department: e.target.value })}>
                                        <option value="">Select Department</option>
                                        {['Public Works', 'Health', 'Education', 'Transport'].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button onClick={() => setShowAssignModal(false)} className="btn-outline">Cancel</button>
                                    <button onClick={handleAssign} className="btn-primary">Confirm Assignment</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Modal */}
                {showStatusModal && (
                    <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h2 className="text-xl font-bold mb-4">Update Status</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm mb-1">New Status</label>
                                    <select className="form-input" value={statusData.status} onChange={e => setStatusData({ ...statusData, status: e.target.value })}>
                                        <option value="">Select Status</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button onClick={() => setShowStatusModal(false)} className="btn-outline">Cancel</button>
                                    <button onClick={handleStatusUpdate} className="btn-primary">Update Status</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
