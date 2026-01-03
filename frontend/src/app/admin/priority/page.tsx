'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getStoredToken,
    getStoredUser,
    getAdminComplaints,
    type Grievance
} from '@/lib/api';
import AdminNav from '@/components/AdminNav';

export default function PrioritySessionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [priorityList, setPriorityList] = useState<Grievance[]>([]);

    useEffect(() => {
        const checkAuth = async () => {
            const token = getStoredToken();
            const user = getStoredUser();
            if (!token || user?.role !== 'admin') {
                router.push('/login');
                return;
            }
            loadData();
        };
        checkAuth();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch high priority only
            const data = await getAdminComplaints({ priority: 'high' });

            // Filter active complaints (not resolved)
            const active = data.filter(g => g.status !== 'resolved');

            // Sort by urgency (Oldest Created -> Most Urgent)
            active.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            setPriorityList(active);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const getWaitTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return `${days}d ${hours}h`;
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-red-800 font-bold text-lg animate-pulse">Loading Critical Incident Queue...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <div className="max-w-5xl mx-auto px-6 py-8">
                <header className="mb-6 border-b border-red-200 pb-4">
                    <h1 className="text-3xl font-extrabold text-[#8a1c1c] uppercase tracking-wider flex items-center gap-3">
                        <span className="w-4 h-8 bg-red-600 rounded"></span>
                        Priority Session Workflow
                    </h1>
                    <p className="text-red-700 mt-2 font-medium">Focus on critical, high-urgency grievances requiring immediate action.</p>
                </header>

                <AdminNav />

                <div className="space-y-8">
                    {priorityList.length === 0 ? (
                        <div className="bg-white p-12 rounded shadow-sm text-center border border-gray-200 mt-8">
                            <div className="inline-block p-4 bg-green-50 rounded-full mb-4">
                                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h2 className="text-2xl font-bold text-green-800 mb-2">Queue Cleared</h2>
                            <p className="text-gray-500">No high-priority active complaints pending.</p>
                        </div>
                    ) : (
                        priorityList.map((complaint, index) => (
                            <div key={complaint.id} className="bg-white border-l-8 border-red-600 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                                {/* Header Bar */}
                                <div className="bg-red-50 px-6 py-3 border-b border-red-100 flex justify-between items-center">
                                    <span className="font-mono text-xs font-bold text-red-800 bg-red-100 px-2 py-1 rounded">
                                        CASE #{complaint.id.substring(0, 8).toUpperCase()}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Wait Time:</span>
                                        <span className={`text-sm font-bold font-mono ${getWaitTime(complaint.created_at).includes('d') ? 'text-red-600' : 'text-gray-800'}`}>
                                            {getWaitTime(complaint.created_at)}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Content Info */}
                                    <div className="md:col-span-2 space-y-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-1 capitalize">
                                                {complaint.category.replace('_', ' ')} Incident
                                            </h3>
                                            <p className="text-sm text-gray-500 font-bold uppercase tracking-wide flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                                {complaint.location}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-6 rounded border-l-4 border-gray-300 italic text-gray-700 leading-relaxed text-lg">
                                            "{complaint.description}"
                                        </div>
                                    </div>

                                    {/* Decision Support */}
                                    <div className="space-y-4 bg-red-50 p-5 rounded border border-red-100 h-fit">
                                        <div>
                                            <h4 className="text-xs font-bold uppercase text-red-800 mb-2 tracking-wide border-b border-red-200 pb-1">AI Urgency Assessment</h4>
                                            <p className="text-sm text-gray-800 leading-snug font-medium">
                                                {complaint.ai_explanation || "Classified as critical based on structural analysis."}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold uppercase text-red-800 mb-2 tracking-wide border-b border-red-200 pb-1">Recommended Action</h4>
                                            <p className="text-sm text-gray-800 leading-snug">
                                                {complaint.status === 'submitted'
                                                    ? "Immediate assignment to Field Officer required."
                                                    : "Check status. Escalate if unresolved > 48h."}
                                            </p>
                                        </div>
                                        <div className="pt-4 mt-2 border-t border-red-200">
                                            <Link
                                                href={`/admin/complaints/${complaint.id}`}
                                                className="block w-full text-center bg-[#8a1c1c] text-white py-3 rounded font-bold hover:bg-red-800 transition-colors uppercase text-sm tracking-widest shadow-sm"
                                            >
                                                Take Action
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
