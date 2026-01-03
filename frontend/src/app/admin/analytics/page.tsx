'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    getStoredToken,
    getStoredUser,
    getAdminAnalytics,
    getAdminByDepartment,
    downloadAdminExport,
    type AdminAnalytics
} from '@/lib/api';
import AdminNav from '@/components/AdminNav';

export default function AnalyticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
    const [deptCounts, setDeptCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        checkAuthAndLoad();
    }, []);

    const checkAuthAndLoad = async () => {
        const token = getStoredToken();
        const user = getStoredUser();
        if (!token || user?.role !== 'admin') {
            router.push('/login');
            return;
        }
        loadData();
    };

    const loadData = async () => {
        try {
            const [analyticsData, deptData] = await Promise.all([
                getAdminAnalytics(),
                getAdminByDepartment()
            ]);
            setAnalytics(analyticsData);
            setDeptCounts(deptData);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
        setLoading(false);
    };

    // Get bottleneck department
    const getBottleneckDept = () => {
        if (Object.keys(deptCounts).length === 0) return null;
        const sorted = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);
        return sorted[0];
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-100 pt-40 flex justify-center">
            <div className="text-2xl font-bold text-[#003366] uppercase tracking-widest">Loading Analytics...</div>
        </div>
    );

    const maxDeptCount = Math.max(...Object.values(deptCounts), 1);
    const bottleneck = getBottleneckDept();

    return (
        <div className="min-h-screen bg-gray-100">
            {/* HEADER OFFSET */}
            <div className="h-36"></div>

            {/* CENTERED CONTAINER */}
            <div className="max-w-[1200px] mx-auto px-8 pb-20">

                {/* SECTION 1: PAGE HEADER */}
                <header className="text-center mb-8 pt-6">
                    <h1 className="text-4xl font-bold text-[#003366] uppercase tracking-wide">
                        ANALYTICS & REPORTS
                    </h1>
                    <p className="text-xl text-gray-600 mt-3">
                        Department Performance and System Insights
                    </p>
                    <div className="w-32 h-1 bg-[#003366] mx-auto mt-6"></div>
                </header>

                {/* NAVIGATION TABS */}
                <AdminNav />

                {/* SECTION 2: KPI SUMMARY ROW */}
                {analytics && (
                    <section className="mb-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Resolution Rate */}
                            <div className="bg-white rounded-xl shadow-lg border-l-8 border-green-600 p-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-6xl font-bold text-green-700">{analytics.resolution_rate}%</p>
                                        <p className="text-base font-bold text-gray-600 uppercase tracking-wide mt-1">Resolution Rate</p>
                                        <p className="text-sm text-gray-500 mt-1">Cases Successfully Closed</p>
                                    </div>
                                </div>
                            </div>

                            {/* Priority Queue */}
                            <div className="bg-white rounded-xl shadow-lg border-l-8 border-red-600 p-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-6xl font-bold text-red-700">{analytics.high_priority_count}</p>
                                        <p className="text-base font-bold text-gray-600 uppercase tracking-wide mt-1">Priority Queue</p>
                                        <p className="text-sm text-gray-500 mt-1">Critical Cases Pending</p>
                                    </div>
                                </div>
                            </div>

                            {/* Processing Load */}
                            <div className="bg-white rounded-xl shadow-lg border-l-8 border-blue-600 p-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-6xl font-bold text-blue-700">{analytics.pending_count}</p>
                                        <p className="text-base font-bold text-gray-600 uppercase tracking-wide mt-1">Processing Load</p>
                                        <p className="text-sm text-gray-500 mt-1">Total Pending Cases</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* SECTION 3: DEPARTMENT LOAD DISTRIBUTION */}
                <section className="bg-white rounded-xl shadow-lg mb-12 overflow-hidden">
                    <div className="px-10 py-6 bg-gray-50 border-b-2 border-gray-200">
                        <h2 className="text-2xl font-bold text-[#003366] uppercase tracking-wide text-center">
                            Department Load Distribution
                        </h2>
                        <p className="text-base text-gray-600 text-center mt-2">
                            Complaint volume by department
                        </p>
                    </div>

                    <div className="p-10">
                        {Object.keys(deptCounts).length > 0 ? (
                            <>
                                {/* Chart Area */}
                                <div className="h-80 flex items-end justify-center gap-10 border-b-4 border-gray-200 pb-6 mb-8">
                                    {Object.entries(deptCounts).map(([dept, count]) => {
                                        const height = Math.max((count / maxDeptCount) * 100, 15);
                                        return (
                                            <div key={dept} className="flex flex-col items-center justify-end h-full" style={{ minWidth: '100px' }}>
                                                <div className="text-2xl font-bold text-[#003366] mb-4">{count}</div>
                                                <div
                                                    className="w-20 bg-gradient-to-t from-blue-800 to-blue-500 rounded-t-lg shadow-lg hover:from-blue-700 hover:to-blue-400 transition-all cursor-pointer"
                                                    style={{ height: `${height}%` }}
                                                    title={`${dept}: ${count} complaints`}
                                                ></div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* X-Axis Labels */}
                                <div className="flex justify-center gap-10">
                                    {Object.keys(deptCounts).map((dept) => (
                                        <div key={dept} style={{ minWidth: '100px' }} className="text-center">
                                            <p className="text-base font-bold text-gray-700 uppercase tracking-wide">
                                                {dept}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-20 text-xl text-gray-500">
                                No department data available
                            </div>
                        )}
                    </div>
                </section>

                {/* SECTION 4: PERFORMANCE INSIGHTS */}
                <section className="bg-white rounded-xl shadow-lg mb-12 overflow-hidden">
                    <div className="px-10 py-6 bg-gray-50 border-b-2 border-gray-200">
                        <h2 className="text-2xl font-bold text-[#003366] uppercase tracking-wide text-center">
                            System Performance Insights
                        </h2>
                    </div>

                    <div className="p-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Resolution Status */}
                            <div className={`rounded-xl p-8 border-2 ${analytics && analytics.resolution_rate >= 50
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-orange-50 border-orange-200'
                                }`}>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${analytics && analytics.resolution_rate >= 50 ? 'bg-green-200' : 'bg-orange-200'
                                        }`}>
                                        <svg className={`w-6 h-6 ${analytics && analytics.resolution_rate >= 50 ? 'text-green-700' : 'text-orange-700'
                                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800">Resolution Summary</h3>
                                </div>
                                <p className="text-lg text-gray-700 leading-relaxed">
                                    {analytics && analytics.resolution_rate >= 50
                                        ? `System is performing well with a ${analytics?.resolution_rate}% resolution rate. ${analytics?.resolved_count} cases have been successfully resolved out of ${analytics?.total_complaints} total complaints.`
                                        : `Resolution rate is at ${analytics?.resolution_rate}%. Consider allocating additional resources to improve case closure speed.`
                                    }
                                </p>
                            </div>

                            {/* Bottleneck Analysis */}
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800">Bottleneck Analysis</h3>
                                </div>
                                <p className="text-lg text-gray-700 leading-relaxed">
                                    {bottleneck
                                        ? `The "${bottleneck[0]}" department has the highest load with ${bottleneck[1]} pending complaints. Consider prioritizing resource allocation to this department.`
                                        : 'No significant bottleneck detected. Load is distributed evenly across departments.'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* AI Recommendation */}
                        <div className="mt-8 bg-gray-100 border-l-8 border-[#003366] rounded-lg p-8">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#003366] flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-[#003366] uppercase tracking-wide mb-2">AI Insight</h4>
                                    <p className="text-lg text-gray-700 leading-relaxed">
                                        {analytics && analytics.high_priority_count > 5
                                            ? 'High priority queue is elevated. Recommend initiating a Priority Session to address critical cases immediately. Departments with high load may require resource reallocation.'
                                            : analytics && analytics.resolution_rate < 50
                                                ? 'Resolution rate is below target. Consider reviewing pending cases older than 48 hours and assigning dedicated officers for faster closure.'
                                                : 'System is operating within normal parameters. Continue monitoring department load distribution for early bottleneck detection.'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 5: EXPORT CENTER */}
                <section className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="px-10 py-6 bg-gray-50 border-b-2 border-gray-200">
                        <h2 className="text-2xl font-bold text-[#003366] uppercase tracking-wide text-center">
                            Export Center
                        </h2>
                        <p className="text-base text-gray-600 text-center mt-2">
                            Download reports and data files
                        </p>
                    </div>

                    <div className="p-10">
                        <div className="flex flex-wrap justify-center gap-8">
                            {/* Export CSV */}
                            <button
                                onClick={downloadAdminExport}
                                className="flex items-center gap-4 bg-[#003366] text-white px-10 py-5 rounded-xl font-bold uppercase text-lg tracking-wide hover:bg-blue-900 transition-colors shadow-lg"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export CSV
                            </button>

                            {/* Export PDF */}
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-4 bg-red-700 text-white px-10 py-5 rounded-xl font-bold uppercase text-lg tracking-wide hover:bg-red-800 transition-colors shadow-lg"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                Export PDF
                            </button>

                            {/* View Detailed Report */}
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-4 bg-gray-600 text-white px-10 py-5 rounded-xl font-bold uppercase text-lg tracking-wide hover:bg-gray-700 transition-colors shadow-lg"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                View Detailed Report
                            </button>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
