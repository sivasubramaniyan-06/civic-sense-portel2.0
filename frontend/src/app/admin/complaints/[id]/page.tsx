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

    if (loading) return <div className="p-12 text-center text-gray-500 font-bold">Retrieving Record...</div>;
    if (!complaint) return <div className="p-12 text-center text-red-600 font-bold">Record Not Found</div>;

    const timelineReversed = complaint.timeline ? [...complaint.timeline].reverse() : [];

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/complaints" className="text-gray-500 hover:text-[#003366] font-semibold text-sm">
                            &larr; Back to Registry
                        </Link>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <h1 className="text-2xl font-extrabold text-[#003366]">Record #{complaint.id.substring(0, 8).toUpperCase()}</h1>
                    </div>
                    <div className="text-sm text-gray-400 font-mono">
                        Created: {new Date(complaint.created_at).toLocaleString()}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Main Info */}
                        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Complaint Details</h2>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-900 text-lg leading-relaxed mb-6 font-medium">{complaint.description}</p>

                                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                    <div className="border-b border-gray-100 pb-2">
                                        <span className="block text-gray-400 text-xs uppercase font-semibold mb-1">Category</span>
                                        <span className="font-bold text-gray-700 capitalize">{complaint.category.replace('_', ' ')}</span>
                                    </div>
                                    <div className="border-b border-gray-100 pb-2">
                                        <span className="block text-gray-400 text-xs uppercase font-semibold mb-1">Location</span>
                                        <span className="font-bold text-gray-700">{complaint.location}</span>
                                    </div>
                                    <div className="border-b border-gray-100 pb-2">
                                        <span className="block text-gray-400 text-xs uppercase font-semibold mb-1">Submitted By</span>
                                        <span className="font-bold text-gray-700">{complaint.submitter_name}</span>
                                    </div>
                                    <div className="border-b border-gray-100 pb-2">
                                        <span className="block text-gray-400 text-xs uppercase font-semibold mb-1">Contact</span>
                                        <span className="font-bold text-gray-700">{complaint.submitter_phone || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Analysis */}
                        <div className="bg-blue-50 rounded shadow-sm border border-blue-100 p-6">
                            <h2 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">AI Intelligence Report</h2>
                            <p className="text-sm text-blue-900 mb-4 leading-relaxed">{complaint.ai_explanation}</p>
                            <div className="flex flex-wrap gap-2">
                                {complaint.keywords_found.map(k => (
                                    <span key={k} className="bg-white text-blue-700 border border-blue-200 text-xs px-2 py-1 rounded font-mono font-medium">{k}</span>
                                ))}
                            </div>
                        </div>

                        {/* Media */}
                        {complaint.audio_path && (
                            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                    <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Voice Evidence</h2>
                                </div>
                                <div className="p-6">
                                    {(complaint as any).audio_language && (
                                        <div className="mb-4 inline-block bg-yellow-50 border border-yellow-200 px-3 py-1 rounded">
                                            <span className="text-xs text-yellow-800 font-bold uppercase tracking-wide mr-2">Detected Language</span>
                                            <span className="text-sm text-gray-800 font-medium">{(complaint as any).audio_language}</span>
                                        </div>
                                    )}
                                    <audio controls className="w-full h-10">
                                        <source src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/uploads/${complaint.audio_path}`} />
                                    </audio>
                                </div>
                            </div>
                        )}

                        {(complaint.lat || (complaint as any).lat) && (
                            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                    <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Geo-Location</h2>
                                </div>
                                <div className="h-80 w-full relative z-0">
                                    <LocationMap
                                        initialLat={(complaint.lat || (complaint as any).lat) as number}
                                        initialLng={(complaint.lng || (complaint as any).lng) as number}
                                        onLocationSelect={() => { }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Status & Timeline */}
                    <div className="space-y-8">
                        <div className="bg-white rounded shadow-sm border-t-4 border-[#003366] p-6">
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Current Status</h2>

                            <div className="flex items-center justify-between mb-6">
                                <div className="text-3xl font-bold capitalize text-gray-800">{complaint.status.replace('_', ' ')}</div>
                                <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wide ${complaint.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {complaint.priority}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        setAssignData({ department: complaint.department, officer_name: '', remarks: '' });
                                        setShowAssignModal(true);
                                    }}
                                    className="w-full py-3 bg-white border-2 border-yellow-500 text-yellow-700 font-bold rounded hover:bg-yellow-50 transition-colors uppercase text-sm tracking-wide"
                                >
                                    Assign Department
                                </button>
                                <button
                                    onClick={() => {
                                        setStatusData({ status: '', admin_remarks: '' });
                                        setShowStatusModal(true);
                                    }}
                                    className="w-full py-3 bg-[#003366] text-white font-bold rounded hover:bg-blue-900 transition-colors uppercase text-sm tracking-wide shadow-md"
                                >
                                    Update Status
                                </button>
                            </div>
                        </div>

                        {/* Status Timeline */}
                        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Activity Log</h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-0 border-l-2 border-gray-200 ml-2 pl-6 relative">
                                    {timelineReversed.map((entry, i) => (
                                        <div key={i} className="relative pb-8 last:pb-0">
                                            <div className="absolute -left-[31px] top-1 w-4 h-4 bg-white border-4 border-[#003366] rounded-full"></div>
                                            <p className="font-bold text-sm capitalize text-gray-800 mb-1">{entry.status.replace('_', ' ')}</p>
                                            <p className="text-xs text-gray-400 font-mono mb-2">{new Date(entry.timestamp).toLocaleString()}</p>
                                            {entry.remarks && <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic">"{entry.remarks}"</div>}
                                        </div>
                                    ))}
                                    {timelineReversed.length === 0 && (
                                        <p className="text-gray-400 text-sm italic">No history available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modals - Simplified for Professional Look */}
                {showAssignModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAssignModal(false)}>
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                            <h2 className="text-xl font-bold mb-4 text-[#003366]">Assign Complaint</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Select Department</label>
                                    <select className="form-select w-full border-gray-300 rounded" value={assignData.department} onChange={e => setAssignData({ ...assignData, department: e.target.value })}>
                                        <option value="">-- Select Department --</option>
                                        {['Public Works', 'Health', 'Education', 'Transport', 'Municipal', 'Revenue'].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Internal Remarks</label>
                                    <textarea className="form-textarea w-full border-gray-300 rounded" rows={3} value={assignData.remarks} onChange={e => setAssignData({ ...assignData, remarks: e.target.value })} placeholder="Add notes for the officer..."></textarea>
                                </div>
                                <div className="flex justify-end gap-3 mt-4">
                                    <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                    <button onClick={handleAssign} className="px-6 py-2 bg-[#003366] text-white rounded font-bold hover:bg-blue-900">Confirm Assignment</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showStatusModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowStatusModal(false)}>
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                            <h2 className="text-xl font-bold mb-4 text-[#003366]">Update Status</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">New Status</label>
                                    <select className="form-select w-full border-gray-300 rounded" value={statusData.status} onChange={e => setStatusData({ ...statusData, status: e.target.value })}>
                                        <option value="">-- Select Status --</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 mt-4">
                                    <button onClick={() => setShowStatusModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                    <button onClick={handleStatusUpdate} className="px-6 py-2 bg-[#003366] text-white rounded font-bold hover:bg-blue-900">Update Status</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
