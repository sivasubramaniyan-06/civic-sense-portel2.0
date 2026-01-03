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
    const [allComplaints, setAllComplaints] = useState<Grievance[]>([]);

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
            // Fetch all complaints (not just high priority)
            const data = await getAdminComplaints({});
            // Filter only active (non-resolved) complaints
            const active = data.filter(g => g.status !== 'resolved');
            setAllComplaints(active);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    // Categorize complaints by priority
    const highPriority = allComplaints.filter(c => c.priority === 'high');
    const mediumPriority = allComplaints.filter(c => c.priority === 'medium');
    const lowPriority = allComplaints.filter(c => c.priority === 'low');

    // Sort each category by oldest first
    highPriority.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    mediumPriority.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    lowPriority.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const getWaitTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return { days, hours, formatted: `${days}d ${hours}h`, isCritical: days >= 2 };
    };

    // AI reason generators based on priority
    const getHighPriorityReason = (complaint: Grievance) => {
        const reasons = [];
        if (complaint.description.toLowerCase().includes('accident')) reasons.push('Accident-related incident detected');
        if (complaint.description.toLowerCase().includes('hospital')) reasons.push('Healthcare facility impacted');
        if (complaint.description.toLowerCase().includes('elderly') || complaint.description.toLowerCase().includes('child')) reasons.push('Vulnerable population affected');
        if (complaint.description.toLowerCase().includes('danger') || complaint.description.toLowerCase().includes('unsafe')) reasons.push('Safety risk identified');
        if (getWaitTime(complaint.created_at).days >= 2) reasons.push('Extended waiting time exceeds SLA');
        if (reasons.length === 0) reasons.push('Classified HIGH based on keyword severity and impact analysis');
        return reasons.join('. ') + '.';
    };

    const getMediumPriorityReason = (complaint: Grievance) => {
        const reasons = [];
        if (complaint.category === 'water' || complaint.category === 'electricity') reasons.push('Essential service disruption');
        if (getWaitTime(complaint.created_at).days >= 1) reasons.push('Moderate waiting time');
        if (reasons.length === 0) reasons.push('Standard priority based on category and impact assessment');
        return reasons.join('. ') + '.';
    };

    const getLowPriorityReason = (complaint: Grievance) => {
        return 'Routine processing: Low risk, informational, or minor impact identified.';
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-100 pt-40 flex justify-center">
            <div className="text-2xl font-bold text-red-800 uppercase tracking-widest">Loading Priority Session...</div>
        </div>
    );

    // Reusable Priority Card Component
    const PriorityCard = ({
        complaint,
        index,
        priority,
        reason,
        timeline,
        ctaText,
        ctaColor
    }: {
        complaint: Grievance,
        index: number,
        priority: 'high' | 'medium' | 'low',
        reason: string,
        timeline?: string,
        ctaText: string,
        ctaColor: string
    }) => {
        const wait = getWaitTime(complaint.created_at);
        const borderColor = priority === 'high' ? 'border-red-700' : priority === 'medium' ? 'border-orange-500' : 'border-green-600';
        const headerBg = priority === 'high' ? 'bg-red-100' : priority === 'medium' ? 'bg-orange-50' : 'bg-green-50';
        const badgeBg = priority === 'high' ? 'bg-red-700' : priority === 'medium' ? 'bg-orange-500' : 'bg-green-600';
        const waitColor = priority === 'high' ? 'text-red-700' : priority === 'medium' ? 'text-orange-700' : 'text-green-700';
        const reasonBg = priority === 'high' ? 'bg-red-50 border-red-200' : priority === 'medium' ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200';
        const reasonTitle = priority === 'high' ? 'text-red-800 border-red-200' : priority === 'medium' ? 'text-orange-800 border-orange-200' : 'text-green-800 border-green-200';

        return (
            <div className={`bg-white rounded-lg shadow-lg overflow-hidden border-l-8 ${borderColor} mb-6`}>
                {/* Card Header */}
                <div className={`px-8 py-5 flex flex-wrap justify-between items-center gap-4 ${headerBg}`}>
                    <div className="flex items-center gap-4">
                        <span className={`px-5 py-2 rounded-lg font-bold text-base uppercase text-white ${badgeBg}`}>
                            Case {index + 1}
                        </span>
                        <span className="font-mono text-gray-700 font-bold text-base">
                            ID: {complaint.id.substring(0, 8).toUpperCase()}
                        </span>
                        <span className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-bold text-sm uppercase">
                            {complaint.category.replace('_', ' ')}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className={`text-3xl font-bold ${waitColor}`}>{wait.formatted}</p>
                        <p className="text-xs uppercase text-gray-600 font-bold tracking-wide">Waiting</p>
                    </div>
                </div>

                {/* Card Body */}
                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Details */}
                        <div className="lg:col-span-2">
                            <p className="text-lg text-gray-600 mb-4">
                                <span className="font-bold">Location:</span> {complaint.location}
                            </p>
                            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-gray-300">
                                <p className="text-lg text-gray-800 italic leading-relaxed">
                                    "{complaint.description.length > 200 ? complaint.description.substring(0, 200) + '...' : complaint.description}"
                                </p>
                            </div>
                        </div>

                        {/* Right: AI Reason */}
                        <div className={`rounded-lg p-6 border-2 ${reasonBg}`}>
                            <h4 className={`text-sm font-bold uppercase tracking-wide mb-3 pb-2 border-b ${reasonTitle}`}>
                                AI Urgency Assessment
                            </h4>
                            <p className="text-base text-gray-800 leading-relaxed mb-4">
                                {complaint.ai_explanation || reason}
                            </p>
                            {timeline && (
                                <p className="text-sm font-bold text-gray-600 uppercase">
                                    Timeline: {timeline}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6 text-right">
                        <Link
                            href={`/admin/complaints/${complaint.id}`}
                            className={`inline-block px-10 py-4 rounded-lg font-bold uppercase text-base tracking-wide shadow transition-colors text-white ${ctaColor}`}
                        >
                            {ctaText}
                        </Link>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* HEADER OFFSET */}
            <div className="h-36"></div>

            {/* CENTERED CONTAINER */}
            <div className="max-w-[1280px] mx-auto px-8 pb-20">

                {/* PAGE TITLE */}
                <header className="text-center mb-10 pt-6">
                    <h1 className="text-4xl font-bold text-[#003366] uppercase tracking-wide">
                        PRIORITY SESSION
                    </h1>
                    <p className="text-xl text-gray-600 mt-3">
                        AI-Ranked Grievances Categorized by Urgency Level
                    </p>
                </header>

                {/* NAVIGATION TABS */}
                <AdminNav />

                {/* 1. AI PRIORITY SUMMARY BAR */}
                <section className="bg-white rounded-lg shadow-lg p-8 mb-12">
                    <h2 className="text-xl font-bold text-[#003366] uppercase tracking-wide mb-6 text-center">
                        AI Priority Summary
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* High Priority Count */}
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
                            <p className="text-5xl font-bold text-red-700 mb-2">{highPriority.length}</p>
                            <p className="text-base font-bold text-red-800 uppercase tracking-wide">High Priority</p>
                            <p className="text-sm text-red-600 mt-1">Immediate Action</p>
                        </div>

                        {/* Medium Priority Count */}
                        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 text-center">
                            <p className="text-5xl font-bold text-orange-600 mb-2">{mediumPriority.length}</p>
                            <p className="text-base font-bold text-orange-800 uppercase tracking-wide">Medium Priority</p>
                            <p className="text-sm text-orange-600 mt-1">Action Within 48-72h</p>
                        </div>

                        {/* Low Priority Count */}
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
                            <p className="text-5xl font-bold text-green-600 mb-2">{lowPriority.length}</p>
                            <p className="text-base font-bold text-green-800 uppercase tracking-wide">Low Priority</p>
                            <p className="text-sm text-green-600 mt-1">Routine Processing</p>
                        </div>
                    </div>

                    <p className="text-center text-base text-gray-600 bg-gray-100 py-3 px-6 rounded-lg">
                        AI categorization is based on urgency keywords, waiting time, category severity, and potential public impact.
                    </p>
                </section>

                {/* 2. PRIORITY CATEGORIES */}

                {/* SECTION 1: HIGH PRIORITY */}
                <section className="mb-14">
                    <div className="bg-red-700 text-white px-8 py-5 rounded-t-lg">
                        <h2 className="text-2xl font-bold uppercase tracking-wide">
                            HIGH PRIORITY - Immediate Action Required
                        </h2>
                        <p className="text-base text-red-100 mt-2">
                            AI Criteria: Safety risk, emergency keywords, vulnerable population, extended waiting time
                        </p>
                    </div>

                    <div className="bg-red-50 border-2 border-red-200 border-t-0 rounded-b-lg p-8">
                        {highPriority.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-xl font-bold text-green-700">No high priority cases pending</p>
                            </div>
                        ) : (
                            highPriority.map((complaint, index) => (
                                <PriorityCard
                                    key={complaint.id}
                                    complaint={complaint}
                                    index={index}
                                    priority="high"
                                    reason={getHighPriorityReason(complaint)}
                                    timeline="Within 24 hours"
                                    ctaText="Assign Officer Now"
                                    ctaColor="bg-red-700 hover:bg-red-800"
                                />
                            ))
                        )}
                    </div>
                </section>

                {/* SECTION 2: MEDIUM PRIORITY */}
                <section className="mb-14">
                    <div className="bg-orange-500 text-white px-8 py-5 rounded-t-lg">
                        <h2 className="text-2xl font-bold uppercase tracking-wide">
                            MEDIUM PRIORITY - Action Required Soon
                        </h2>
                        <p className="text-base text-orange-100 mt-2">
                            AI Criteria: Service disruption, repeated complaints, moderate public impact
                        </p>
                    </div>

                    <div className="bg-orange-50 border-2 border-orange-200 border-t-0 rounded-b-lg p-8">
                        {mediumPriority.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-xl font-bold text-gray-500">No medium priority cases pending</p>
                            </div>
                        ) : (
                            mediumPriority.map((complaint, index) => (
                                <PriorityCard
                                    key={complaint.id}
                                    complaint={complaint}
                                    index={index}
                                    priority="medium"
                                    reason={getMediumPriorityReason(complaint)}
                                    timeline="Within 48-72 hours"
                                    ctaText="Assign / Schedule"
                                    ctaColor="bg-orange-500 hover:bg-orange-600"
                                />
                            ))
                        )}
                    </div>
                </section>

                {/* SECTION 3: LOW PRIORITY */}
                <section className="mb-14">
                    <div className="bg-green-600 text-white px-8 py-5 rounded-t-lg">
                        <h2 className="text-2xl font-bold uppercase tracking-wide">
                            LOW PRIORITY - Routine Processing
                        </h2>
                        <p className="text-base text-green-100 mt-2">
                            AI Criteria: Informational requests, low risk, minor impact, standard processing
                        </p>
                    </div>

                    <div className="bg-green-50 border-2 border-green-200 border-t-0 rounded-b-lg p-8">
                        {lowPriority.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-xl font-bold text-gray-500">No low priority cases pending</p>
                            </div>
                        ) : (
                            lowPriority.map((complaint, index) => (
                                <PriorityCard
                                    key={complaint.id}
                                    complaint={complaint}
                                    index={index}
                                    priority="low"
                                    reason={getLowPriorityReason(complaint)}
                                    timeline="Standard Queue"
                                    ctaText="Queue for Processing"
                                    ctaColor="bg-green-600 hover:bg-green-700"
                                />
                            ))
                        )}
                    </div>
                </section>

                {/* 3. AI DECISION FACTORS INFO BOX */}
                <section className="bg-white rounded-lg shadow-lg p-10">
                    <h2 className="text-xl font-bold text-[#003366] uppercase tracking-wide mb-6 text-center border-b-2 border-gray-200 pb-4">
                        AI Decision Factors
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                            <p className="font-bold text-gray-800">Keyword Severity</p>
                            <p className="text-sm text-gray-600 mt-1">Emergency, danger, accident</p>
                        </div>

                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <p className="font-bold text-gray-800">Category Type</p>
                            <p className="text-sm text-gray-600 mt-1">Health, safety, utilities</p>
                        </div>

                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="font-bold text-gray-800">Waiting Time</p>
                            <p className="text-sm text-gray-600 mt-1">SLA compliance check</p>
                        </div>

                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <p className="font-bold text-gray-800">Historical Patterns</p>
                            <p className="text-sm text-gray-600 mt-1">Repeated issues</p>
                        </div>

                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <p className="font-bold text-gray-800">Location Sensitivity</p>
                            <p className="text-sm text-gray-600 mt-1">High-traffic areas</p>
                        </div>
                    </div>

                    <p className="text-center text-base text-gray-500 mt-8 bg-gray-100 py-3 px-6 rounded-lg">
                        The AI system continuously analyzes incoming complaints and adjusts priority scores based on the above factors.
                    </p>
                </section>

            </div>
        </div>
    );
}
