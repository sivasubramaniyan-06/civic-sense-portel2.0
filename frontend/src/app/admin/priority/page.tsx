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
            <div className="text-red-800 font-bold text-lg animate-pulse">Loading Critical Incidents...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <header className="mb-8 border-b border-red-200 pb-4">
                    <h1 className="text-3xl font-extrabold text-[#8a1c1c] uppercase tracking-wider flex items-center gap-3">
                        <span className="w-4 h-8 bg-red-600 rounded"></span>
                        Priority Session
                    </h1>
                    <p className="text-red-700 mt-2 font-medium">Focus on critical, high-urgency grievances requiring immediate action.</p>
                </header>

                <AdminNav />

                <div className="space-y-6">
                    {priorityList.length === 0 ? (
                        <div className="bg-white p-12 rounded shadow-sm text-center border border-gray-200">
                            <h2 className="text-xl font-bold text-green-700 mb-2">All Clear</h2>
                            <p className="text-gray-500">No high-priority active complaints pending.</p>
                        </div>
                    ) : (
                        priorityList.map((complaint, index) => (
                            <div key={complaint.id} className="bg-white border-l-8 border-red-600 rounded shadow-sm p-8 relative hover:shadow-md transition-shadow">
                                <div className="absolute top-6 right-6 flex flex-col items-end">
                                    <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded mb-2 uppercase tracking-wide">
                                        High Priority
                                    </span>
                                    <span className="text-sm font-mono text-gray-500">
                                        Wait Time: <strong className={getWaitTime(complaint.created_at).includes('d') ? 'text-red-600' : 'text-gray-700'}>{getWaitTime(complaint.created_at)}</strong>
                                    </span>
                                </div>

                                <div className="mb-6 pr-40">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        Case #{index + 1} &middot; <span className="capitalize">{complaint.category.replace('_', ' ')}</span> Issue
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-3 font-semibold uppercase tracking-wide">{complaint.location}</p>
                                    <div className="bg-gray-50 p-4 rounded border border-gray-100 text-gray-800 italic border-l-4 border-l-gray-300">
                                        "{complaint.description}"
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-red-50 p-5 rounded border border-red-100 mb-6">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-red-800 mb-2 tracking-wide">Urgency Assessment</h4>
                                        <p className="text-sm text-gray-800 leading-relaxed">
                                            {complaint.ai_explanation || "Classified as critical based on keywords and predicted impact."}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-red-800 mb-2 tracking-wide">Protocol / Action</h4>
                                        <p className="text-sm text-gray-800 leading-relaxed">
                                            {complaint.status === 'submitted'
                                                ? "Assign to Field Officer effectively immediately."
                                                : "Expedite ongoing resolution with assigned department."}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2 border-t border-gray-100">
                                    <Link
                                        href={`/admin/complaints/${complaint.id}`}
                                        className="bg-[#8a1c1c] text-white px-8 py-3 rounded font-bold hover:bg-red-800 transition-colors uppercase text-sm tracking-widest shadow-sm"
                                    >
                                        Process Case &rarr;
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
