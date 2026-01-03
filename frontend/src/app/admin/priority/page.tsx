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
        return { days, hours, formatted: `${days}d ${hours}h` };
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-2xl font-bold text-red-800 uppercase tracking-widest animate-pulse">Loading Priority Cases...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Top Spacing */}
            <div className="pt-8"></div>

            <div className="max-w-5xl mx-auto px-8 pb-16">

                {/* Page Header */}
                <header className="mb-8">
                    <h1 className="text-4xl font-black text-red-800 uppercase tracking-tight">Priority Session</h1>
                    <p className="text-lg text-red-700 mt-2 font-medium bg-red-100 inline-block px-4 py-2 rounded-lg mt-4">
                        Critical grievances requiring immediate action
                    </p>
                </header>

                <AdminNav />

                {/* PRIORITY CASES */}
                <section>
                    {priorityList.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-lg p-16 text-center">
                            <div className="text-6xl mb-6 opacity-30">✓</div>
                            <h2 className="text-3xl font-black text-green-700 uppercase mb-4">Queue Cleared</h2>
                            <p className="text-xl text-gray-600">No high-priority active complaints pending.</p>
                            <Link href="/admin/complaints" className="inline-block mt-8 bg-[#003366] text-white px-8 py-4 rounded-lg font-bold uppercase tracking-wider hover:bg-blue-900 transition-colors">
                                View All Complaints
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {priorityList.map((complaint, index) => {
                                const wait = getWaitTime(complaint.created_at);
                                const isUrgent = wait.days >= 2;

                                return (
                                    <div
                                        key={complaint.id}
                                        className={`bg-white rounded-xl shadow-lg overflow-hidden border-l-8 ${isUrgent ? 'border-red-700' : 'border-orange-500'}`}
                                    >
                                        {/* Header */}
                                        <div className={`px-8 py-4 flex justify-between items-center ${isUrgent ? 'bg-red-100' : 'bg-orange-100'}`}>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-4 py-2 rounded-lg font-black text-sm uppercase ${isUrgent ? 'bg-red-700 text-white' : 'bg-orange-600 text-white'}`}>
                                                    Case #{index + 1}
                                                </span>
                                                <span className="font-mono text-gray-600 font-bold">
                                                    {complaint.id.substring(0, 8).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-2xl font-black ${isUrgent ? 'text-red-700' : 'text-orange-700'}`}>
                                                    {wait.formatted}
                                                </p>
                                                <p className="text-sm uppercase text-gray-600 font-bold">Waiting Time</p>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-8">
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                {/* Left: Details */}
                                                <div className="lg:col-span-2 space-y-6">
                                                    <div>
                                                        <h3 className="text-2xl font-black text-gray-900 capitalize mb-2">
                                                            {complaint.category.replace('_', ' ')} Issue
                                                        </h3>
                                                        <p className="text-lg text-gray-600 flex items-center gap-2">
                                                            <span className="font-bold">Location:</span> {complaint.location}
                                                        </p>
                                                    </div>

                                                    <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-gray-300">
                                                        <p className="text-xl text-gray-800 italic leading-relaxed">
                                                            "{complaint.description}"
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Right: AI Analysis */}
                                                <div className={`p-6 rounded-xl ${isUrgent ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
                                                    <h4 className={`text-sm font-black uppercase tracking-wider mb-4 ${isUrgent ? 'text-red-800' : 'text-orange-800'}`}>
                                                        AI Urgency Assessment
                                                    </h4>
                                                    <p className="text-lg text-gray-800 font-medium leading-relaxed mb-6">
                                                        {complaint.ai_explanation || "Classified as critical based on keyword analysis and impact prediction."}
                                                    </p>

                                                    <h4 className={`text-sm font-black uppercase tracking-wider mb-4 ${isUrgent ? 'text-red-800' : 'text-orange-800'}`}>
                                                        Recommended Action
                                                    </h4>
                                                    <p className="text-lg text-gray-800 font-medium">
                                                        {complaint.status === 'submitted'
                                                            ? "Immediate assignment to Field Officer required."
                                                            : "Expedite resolution. Check progress and escalate if needed."}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="mt-8 flex justify-end">
                                                <Link
                                                    href={`/admin/complaints/${complaint.id}`}
                                                    className={`px-10 py-5 rounded-xl font-black uppercase text-lg tracking-wider shadow-lg transition-all transform hover:-translate-y-1 ${isUrgent
                                                            ? 'bg-red-700 text-white hover:bg-red-800'
                                                            : 'bg-orange-600 text-white hover:bg-orange-700'
                                                        }`}
                                                >
                                                    Assign Officer Now
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
}
