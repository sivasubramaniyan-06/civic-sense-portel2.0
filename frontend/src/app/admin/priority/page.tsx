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
            <div className="text-xl font-bold text-red-700 uppercase tracking-widest animate-pulse">Loading Priority Cases...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="h-32"></div>

            <div className="max-w-5xl mx-auto px-6">

                <header className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-red-800 uppercase tracking-wide">Priority Session</h1>
                    <p className="text-base text-red-700 mt-2 bg-red-100 inline-block px-4 py-2 rounded mt-4">
                        Critical grievances requiring immediate action
                    </p>
                </header>

                <AdminNav />

                {/* Priority Cases */}
                <section className="mb-16">
                    {priorityList.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <div className="text-5xl mb-4 opacity-30">✓</div>
                            <h2 className="text-2xl font-bold text-green-700 uppercase mb-2">Queue Cleared</h2>
                            <p className="text-gray-600 mb-6">No high-priority active complaints pending.</p>
                            <Link href="/admin/complaints" className="bg-[#003366] text-white px-6 py-3 rounded font-bold uppercase text-sm tracking-wide hover:bg-blue-900 transition-colors">
                                View All Complaints
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {priorityList.map((complaint, index) => (
                                <div key={complaint.id} className="bg-white rounded-lg shadow overflow-hidden border-l-4 border-red-600">
                                    {/* Header */}
                                    <div className="bg-red-50 px-6 py-4 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <span className="bg-red-700 text-white px-3 py-1 rounded font-bold text-sm uppercase">
                                                Case #{index + 1}
                                            </span>
                                            <span className="font-mono text-gray-600 font-bold text-sm">
                                                {complaint.id.substring(0, 8).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-red-700">{getWaitTime(complaint.created_at)}</p>
                                            <p className="text-xs uppercase text-gray-500 font-bold">Waiting</p>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="md:col-span-2">
                                                <h3 className="text-lg font-bold text-gray-900 capitalize mb-2">
                                                    {complaint.category.replace('_', ' ')} Issue
                                                </h3>
                                                <p className="text-sm text-gray-600 mb-4">
                                                    <span className="font-bold">Location:</span> {complaint.location}
                                                </p>
                                                <div className="bg-gray-50 p-4 rounded border-l-4 border-gray-300">
                                                    <p className="text-gray-800 italic">"{complaint.description}"</p>
                                                </div>
                                            </div>

                                            <div className="bg-red-50 p-4 rounded border border-red-200">
                                                <h4 className="text-xs font-bold text-red-800 uppercase tracking-wide mb-2">AI Assessment</h4>
                                                <p className="text-sm text-gray-800 mb-4">
                                                    {complaint.ai_explanation || "Critical based on keyword analysis."}
                                                </p>
                                                <h4 className="text-xs font-bold text-red-800 uppercase tracking-wide mb-2">Recommended</h4>
                                                <p className="text-sm text-gray-800">Immediate officer assignment required.</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 text-center">
                                            <Link href={`/admin/complaints/${complaint.id}`} className="bg-red-700 text-white px-8 py-3 rounded font-bold uppercase text-sm tracking-wide hover:bg-red-800 transition-colors inline-block">
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
    );
}
