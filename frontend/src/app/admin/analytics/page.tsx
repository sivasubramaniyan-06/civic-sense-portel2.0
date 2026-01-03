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

    if (loading) return (
        <div className="min-h-screen bg-gray-100 pt-32 flex justify-center">
            <div className="text-2xl font-bold text-[#003366] uppercase tracking-widest">Loading Analytics...</div>
        </div>
    );

    const maxDeptCount = Math.max(...Object.values(deptCounts), 1);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* HEADER OFFSET */}
            <div className="h-24"></div>

            {/* CENTERED CONTAINER */}
            <div className="max-w-[1280px] mx-auto px-8 pb-20">

                {/* PAGE TITLE */}
                <header className="text-center mb-10 pt-6">
                    <h1 className="text-4xl font-bold text-[#003366] uppercase tracking-wide">
                        ANALYTICS AND REPORTS
                    </h1>
                    <p className="text-xl text-gray-600 mt-3">
                        Department performance and system insights
                    </p>
                </header>

                {/* NAVIGATION TABS */}
                <AdminNav />

                {/* DEPARTMENT LOAD DISTRIBUTION CHART */}
                <section className="bg-white rounded-lg shadow-lg mb-14 overflow-hidden">
                    <div className="px-10 py-8 bg-gray-50 border-b-2 border-gray-200">
                        <h2 className="text-2xl font-bold text-[#003366] uppercase tracking-wide text-center">
                            Department Load Distribution
                        </h2>
                        <p className="text-lg text-gray-600 text-center mt-2">
                            Complaint volume by department
                        </p>
                    </div>

                    <div className="p-10">
                        {/* Chart */}
                        <div className="h-96 flex items-end gap-8 border-b-4 border-gray-200 pb-6 mb-8">
                            {Object.entries(deptCounts).length > 0 ? (
                                Object.entries(deptCounts).map(([dept, count]) => {
                                    const height = Math.max((count / maxDeptCount) * 100, 10);
                                    return (
                                        <div key={dept} className="flex-1 min-w-[100px] flex flex-col items-center justify-end h-full group">
                                            <div className="text-2xl font-bold text-[#003366] mb-4">{count}</div>
                                            <div
                                                className="w-full bg-[#003366] rounded-t-lg group-hover:bg-blue-700 transition-colors"
                                                style={{ height: `${height}%` }}
                                            ></div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="w-full text-center text-xl text-gray-500 py-20">
                                    No department data available
                                </div>
                            )}
                        </div>

                        {/* X-Axis Labels */}
                        <div className="flex gap-8">
                            {Object.keys(deptCounts).map((dept) => (
                                <div key={dept} className="flex-1 min-w-[100px] text-center">
                                    <p className="text-base font-bold text-gray-700 uppercase tracking-wide truncate" title={dept}>
                                        {dept}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* STATUS BREAKDOWN */}
                <section className="bg-white rounded-lg shadow-lg mb-14 overflow-hidden">
                    <div className="px-10 py-8 bg-gray-50 border-b-2 border-gray-200">
                        <h2 className="text-2xl font-bold text-[#003366] uppercase tracking-wide text-center">
                            Performance Metrics
                        </h2>
                        <p className="text-lg text-gray-600 text-center mt-2">
                            System efficiency and status breakdown
                        </p>
                    </div>

                    {analytics && (
                        <div className="p-10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                {/* Resolution Rate */}
                                <div className="bg-green-50 rounded-xl p-10 text-center border-2 border-green-200">
                                    <p className="text-base font-bold text-green-800 uppercase tracking-widest mb-6">
                                        Resolution Rate
                                    </p>
                                    <p className="text-8xl font-bold text-green-700 mb-4">
                                        {analytics.resolution_rate}%
                                    </p>
                                    <p className="text-lg text-gray-700">
                                        Cases successfully closed
                                    </p>
                                </div>

                                {/* Priority Queue */}
                                <div className="bg-red-50 rounded-xl p-10 text-center border-2 border-red-200">
                                    <p className="text-base font-bold text-red-800 uppercase tracking-widest mb-6">
                                        Priority Queue
                                    </p>
                                    <p className="text-8xl font-bold text-red-700 mb-4">
                                        {analytics.high_priority_count}
                                    </p>
                                    <p className="text-lg text-gray-700">
                                        Critical cases pending
                                    </p>
                                </div>

                                {/* Processing Load */}
                                <div className="bg-blue-50 rounded-xl p-10 text-center border-2 border-blue-200">
                                    <p className="text-base font-bold text-blue-800 uppercase tracking-widest mb-6">
                                        Processing Load
                                    </p>
                                    <p className="text-8xl font-bold text-blue-700 mb-4">
                                        {analytics.pending_count}
                                    </p>
                                    <p className="text-lg text-gray-700">
                                        Total pending cases
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* EXPORT CENTER */}
                <section className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="px-10 py-8 bg-gray-50 border-b-2 border-gray-200">
                        <h2 className="text-2xl font-bold text-[#003366] uppercase tracking-wide text-center">
                            Export Center
                        </h2>
                        <p className="text-lg text-gray-600 text-center mt-2">
                            Download reports and data files
                        </p>
                    </div>

                    <div className="p-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* CSV Export */}
                            <div className="border-2 border-gray-200 rounded-xl p-10 text-center hover:border-[#003366] transition-colors">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-[#003366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Full Data Export (CSV)</h3>
                                <p className="text-lg text-gray-600 mb-8">
                                    Download complete complaint database in CSV format for external analysis.
                                </p>
                                <button
                                    onClick={downloadAdminExport}
                                    className="bg-[#003366] text-white px-12 py-5 rounded-lg font-bold uppercase text-lg tracking-wide hover:bg-blue-900 transition-colors"
                                >
                                    Download CSV
                                </button>
                            </div>

                            {/* Print Report */}
                            <div className="border-2 border-gray-200 rounded-xl p-10 text-center hover:border-gray-400 transition-colors">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Print Summary Report</h3>
                                <p className="text-lg text-gray-600 mb-8">
                                    Generate a printable executive summary with key metrics and trends.
                                </p>
                                <button
                                    onClick={() => window.print()}
                                    className="bg-gray-300 text-gray-700 px-12 py-5 rounded-lg font-bold uppercase text-lg tracking-wide hover:bg-gray-400 transition-colors"
                                >
                                    Print Report
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
