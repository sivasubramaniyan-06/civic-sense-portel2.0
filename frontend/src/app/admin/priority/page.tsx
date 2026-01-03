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
            // Fetch high priority complaints
            const data = await getAdminComplaints({ priority: 'high' });

            // Filter only active (non-resolved) complaints
            const active = data.filter(g => g.status !== 'resolved');

            // Sort by oldest first (longest waiting)
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
        return { days, hours, formatted: `${days}d ${hours}h`, isCritical: days >= 2 };
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-100 pt-32 flex justify-center">
            <div className="text-2xl font-bold text-red-800 uppercase tracking-widest">Loading Priority Cases...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100">
            {/* HEADER OFFSET */}
            <div className="h-36"></div>

            {/* CENTERED CONTAINER */}
            <div className="max-w-[1280px] mx-auto px-8 pb-20">

                {/* PAGE TITLE */}
                <header className="text-center mb-10 pt-6">
                    <h1 className="text-4xl font-bold text-red-800 uppercase tracking-wide">
                        PRIORITY SESSION
                    </h1>
                    <p className="text-xl text-red-700 mt-3">
                        AI-ranked critical grievances requiring immediate action
                    </p>
                    <div className="mt-4 inline-block bg-red-100 border-2 border-red-300 px-6 py-3 rounded-lg">
                        <span className="text-lg font-bold text-red-800">
                            {priorityList.length} Critical Case(s) Pending
                        </span>
                    </div>
                </header>

                {/* NAVIGATION TABS */}
                <AdminNav />

                {/* PRIORITY CASES LIST */}
                <section>
                    {priorityList.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-lg p-20 text-center">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-green-700 uppercase mb-4">Queue Cleared</h2>
                            <p className="text-xl text-gray-600 mb-10">No high-priority active complaints pending at this time.</p>
                            <Link href="/admin/complaints" className="inline-block bg-[#003366] text-white px-12 py-5 rounded-lg font-bold uppercase text-lg tracking-wide hover:bg-blue-900 transition-colors">
                                View All Complaints
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {priorityList.map((complaint, index) => {
                                const wait = getWaitTime(complaint.created_at);

                                return (
                                    <div
                                        key={complaint.id}
                                        className={`bg-white rounded-lg shadow-lg overflow-hidden border-l-8 ${wait.isCritical ? 'border-red-700' : 'border-orange-500'
                                            }`}
                                    >
                                        {/* Card Header */}
                                        <div className={`px-10 py-6 flex flex-wrap justify-between items-center gap-4 ${wait.isCritical ? 'bg-red-100' : 'bg-orange-50'
                                            }`}>
                                            <div className="flex items-center gap-6">
                                                <span className={`px-6 py-3 rounded-lg font-bold text-lg uppercase ${wait.isCritical ? 'bg-red-700 text-white' : 'bg-orange-500 text-white'
                                                    }`}>
                                                    Case {index + 1}
                                                </span>
                                                <span className="font-mono text-gray-700 font-bold text-lg">
                                                    ID: {complaint.id.substring(0, 8).toUpperCase()}
                                                </span>
                                                <span className={`px-4 py-2 rounded font-bold text-sm uppercase ${wait.isCritical ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'
                                                    }`}>
                                                    {wait.isCritical ? 'CRITICAL' : 'HIGH'} PRIORITY
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-4xl font-bold ${wait.isCritical ? 'text-red-700' : 'text-orange-700'}`}>
                                                    {wait.formatted}
                                                </p>
                                                <p className="text-sm uppercase text-gray-600 font-bold tracking-wide">Waiting Time</p>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-10">
                                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                                                {/* Left: Complaint Details (3 cols) */}
                                                <div className="lg:col-span-3">
                                                    <h3 className="text-3xl font-bold text-gray-900 capitalize mb-4">
                                                        {complaint.category.replace('_', ' ')} Issue
                                                    </h3>
                                                    <p className="text-xl text-gray-600 mb-6">
                                                        <span className="font-bold">Location:</span> {complaint.location}
                                                    </p>
                                                    <div className="bg-gray-50 p-8 rounded-lg border-l-4 border-gray-400">
                                                        <p className="text-xl text-gray-800 italic leading-relaxed">
                                                            "{complaint.description}"
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Right: AI Analysis (2 cols) */}
                                                <div className={`lg:col-span-2 rounded-lg p-8 ${wait.isCritical ? 'bg-red-50 border-2 border-red-200' : 'bg-orange-50 border-2 border-orange-200'
                                                    }`}>
                                                    <div className="mb-8">
                                                        <h4 className={`text-base font-bold uppercase tracking-wide mb-4 pb-2 border-b ${wait.isCritical ? 'text-red-800 border-red-200' : 'text-orange-800 border-orange-200'
                                                            }`}>
                                                            AI Urgency Assessment
                                                        </h4>
                                                        <p className="text-lg text-gray-800 leading-relaxed">
                                                            {complaint.ai_explanation ||
                                                                `This complaint has been classified as HIGH priority due to safety-related keywords and potential public impact detected in the grievance text.`
                                                            }
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <h4 className={`text-base font-bold uppercase tracking-wide mb-4 pb-2 border-b ${wait.isCritical ? 'text-red-800 border-red-200' : 'text-orange-800 border-orange-200'
                                                            }`}>
                                                            Recommended Action
                                                        </h4>
                                                        <p className="text-lg text-gray-800 leading-relaxed">
                                                            {wait.isCritical
                                                                ? 'URGENT: This case has exceeded 48 hours. Immediate field officer assignment and resolution required.'
                                                                : 'Assign to appropriate department officer within 24 hours. Monitor for status updates.'
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="mt-10 text-center">
                                                <Link
                                                    href={`/admin/complaints/${complaint.id}`}
                                                    className={`inline-block px-16 py-5 rounded-lg font-bold uppercase text-xl tracking-wider shadow-lg transition-colors ${wait.isCritical
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
