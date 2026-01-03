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

    if (loading) return <div className="p-8 text-center">Loading session...</div>;

    return (
        <div className="page-content bg-red-50 min-h-screen">
            <div className="admin-container p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-red-800 flex items-center gap-2">
                            🚨 Priority Session
                        </h1>
                        <p className="text-red-600">Focus on critical, high-urgency grievances requiring immediate action.</p>
                    </div>
                </div>

                <AdminNav />

                <div className="space-y-6">
                    {priorityList.length === 0 ? (
                        <div className="bg-white p-12 rounded-lg text-center shadow-sm">
                            <h2 className="text-xl font-bold text-green-700 mb-2">🎉 All Clear!</h2>
                            <p className="text-gray-500">No high-priority active complaints. Great job!</p>
                        </div>
                    ) : (
                        priorityList.map((complaint, index) => (
                            <div key={complaint.id} className="bg-white border-l-4 border-red-600 rounded-lg shadow-sm p-6 relative">
                                <div className="absolute top-4 right-4 flex flex-col items-end">
                                    <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full mb-1">
                                        HIGH PRIORITY
                                    </span>
                                    <span className="text-sm text-gray-500 font-mono">
                                        Waiting: {getWaitTime(complaint.created_at)}
                                    </span>
                                </div>

                                <div className="mb-4 pr-32">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                        #{index + 1} - {complaint.category.replace('_', ' ')} Issue
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-2">{complaint.location}</p>
                                    <p className="text-gray-800 bg-gray-50 p-3 rounded border border-gray-100 italic">
                                        "{complaint.description}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-red-50 p-4 rounded mb-4">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-red-700 mb-1">Why is this urgent?</h4>
                                        <p className="text-sm text-gray-700">
                                            {complaint.ai_explanation || "Classified as High Priority by AI system based on keywords and impact assessment."}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-red-700 mb-1">Recommended Action</h4>
                                        <p className="text-sm text-gray-700">
                                            {complaint.status === 'submitted'
                                                ? "Immediate assignment to Field Officer required."
                                                : "Follow up with assigned department for status update."}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Link
                                        href={`/admin/complaints/${complaint.id}`}
                                        className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition"
                                    >
                                        Take Action Now &rarr;
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
