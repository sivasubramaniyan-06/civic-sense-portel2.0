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
            const data = await getAdminComplaints({ priority: 'high' });
            const active = data.filter(g => g.status !== 'resolved');
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
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-2xl font-bold text-red-700 uppercase tracking-widest animate-pulse">Loading Priority Cases...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="h-28"></div>

            <div className="w-full px-8">
                <div className="max-w-6xl mx-auto">

                    {/* Page Header - Centered */}
                    <header className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-red-800 uppercase tracking-wide">Priority Session</h1>
                        <p className="text-lg text-white mt-4 bg-red-700 inline-block px-6 py-3 rounded-lg font-medium">
                            Critical grievances requiring immediate action
                        </p>
                    </header>

                    <AdminNav />

                    {/* Priority Cases */}
                    <section className="mb-16">
                        {priorityList.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-lg p-16 text-center">
                                <div className="text-8xl mb-6 opacity-30">✓</div>
                                <h2 className="text-4xl font-bold text-green-700 uppercase mb-4">Queue Cleared</h2>
                                <p className="text-xl text-gray-600 mb-8">No high-priority active complaints pending.</p>
                                <Link href="/admin/complaints" className="bg-[#003366] text-white px-10 py-5 rounded-lg font-bold uppercase text-lg tracking-wide hover:bg-blue-900 transition-colors inline-block">
                                    View All Complaints
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {priorityList.map((complaint, index) => (
                                    <div key={complaint.id} className="bg-white rounded-xl shadow-lg overflow-hidden border-l-8 border-red-600">
                                        {/* Header */}
                                        <div className="bg-red-100 px-8 py-6 flex justify-between items-center">
                                            <div className="flex items-center gap-6">
                                                <span className="bg-red-700 text-white px-5 py-2 rounded-lg font-bold text-lg uppercase">
                                                    Case #{index + 1}
                                                </span>
                                                <span className="font-mono text-gray-700 font-bold text-lg">
                                                    {complaint.id.substring(0, 8).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-bold text-red-700">{getWaitTime(complaint.created_at)}</p>
                                                <p className="text-sm uppercase text-gray-600 font-bold tracking-wide">Waiting Time</p>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-10">
                                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                                {/* Left: Details - Takes more space */}
                                                <div className="lg:col-span-3">
                                                    <h3 className="text-3xl font-bold text-gray-900 capitalize mb-4">
                                                        {complaint.category.replace('_', ' ')} Issue
                                                    </h3>
                                                    <p className="text-xl text-gray-600 mb-6">
                                                        <span className="font-bold">Location:</span> {complaint.location}
                                                    </p>
                                                    <div className="bg-gray-50 p-8 rounded-xl border-l-4 border-gray-400">
                                                        <p className="text-xl text-gray-800 italic leading-relaxed">
                                                            "{complaint.description}"
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Right: AI Analysis */}
                                                <div className="lg:col-span-2 bg-red-50 p-8 rounded-xl border-2 border-red-200">
                                                    <h4 className="text-base font-bold text-red-800 uppercase tracking-wide mb-4 border-b border-red-200 pb-2">
                                                        AI Assessment
                                                    </h4>
                                                    <p className="text-lg text-gray-800 leading-relaxed mb-6">
                                                        {complaint.ai_explanation || "Classified as HIGH priority based on safety-related or emergency keywords detected in the complaint."}
                                                    </p>

                                                    <h4 className="text-base font-bold text-red-800 uppercase tracking-wide mb-4 border-b border-red-200 pb-2">
                                                        Recommended Action
                                                    </h4>
                                                    <p className="text-lg text-gray-800 leading-relaxed">
                                                        Immediate officer assignment required. This case should be addressed within 24 hours.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Button - Centered and Large */}
                                            <div className="mt-10 text-center">
                                                <Link
                                                    href={`/admin/complaints/${complaint.id}`}
                                                    className="bg-red-700 text-white px-16 py-5 rounded-xl font-bold uppercase text-xl tracking-wider hover:bg-red-800 transition-colors inline-block shadow-lg"
                                                >
                                                    Assign Officer Now
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                </div>
            </div>
        </div>
    );
}
