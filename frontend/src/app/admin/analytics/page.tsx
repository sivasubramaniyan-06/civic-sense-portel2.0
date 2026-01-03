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
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-2xl font-bold text-[#003366] uppercase tracking-widest animate-pulse">Loading Analytics...</div>
        </div>
    );

    const maxDeptCount = Math.max(...Object.values(deptCounts), 1);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Top Spacing */}
            <div className="pt-8"></div>

            <div className="max-w-7xl mx-auto px-8 pb-16">

                {/* Page Header */}
                <header className="mb-8">
                    <h1 className="text-4xl font-black text-[#003366] uppercase tracking-tight">Analytics & Reports</h1>
                    <p className="text-lg text-gray-600 mt-2 font-medium">Data visualization and export center</p>
                </header>

                <AdminNav />

                {/* SECTION A: Department Load Distribution */}
                <section className="bg-white rounded-xl shadow-lg mb-12 overflow-hidden">
                    <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-2xl font-black text-[#003366] uppercase tracking-wide">
                            Department Load Distribution
                        </h2>
                        <p className="text-gray-600 mt-1">Complaint volume by department</p>
                    </div>

                    <div className="p-8">
                        {/* Chart */}
                        <div className="h-96 flex items-end gap-6 border-b-4 border-gray-200 pb-4 mb-4">
                            {Object.entries(deptCounts).map(([dept, count]) => {
                                const height = Math.max((count / maxDeptCount) * 100, 10);
                                return (
                                    <div key={dept} className="flex-1 min-w-[80px] flex flex-col items-center justify-end group h-full">
                                        {/* Value Label */}
                                        <div className="text-xl font-black text-[#003366] mb-2">{count}</div>

                                        {/* Bar */}
                                        <div
                                            className="w-full bg-gradient-to-t from-blue-900 to-blue-500 rounded-t-lg shadow-lg group-hover:from-blue-800 group-hover:to-blue-400 transition-all"
                                            style={{ height: `${height}%` }}
                                        ></div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* X-Axis Labels */}
                        <div className="flex gap-6">
                            {Object.keys(deptCounts).map((dept) => (
                                <div key={dept} className="flex-1 min-w-[80px] text-center">
                                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wide truncate" title={dept}>
                                        {dept}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* SECTION B: Performance Metrics */}
                <section className="bg-white rounded-xl shadow-lg mb-12 overflow-hidden">
                    <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-2xl font-black text-[#003366] uppercase tracking-wide">
                            Performance Metrics
                        </h2>
                        <p className="text-gray-600 mt-1">System efficiency indicators</p>
                    </div>

                    {analytics && (
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Resolution Rate */}
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 text-center border border-green-200">
                                    <p className="text-sm font-bold text-green-800 uppercase tracking-widest mb-4">Resolution Rate</p>
                                    <div className="relative inline-block">
                                        <svg className="w-40 h-40" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                                            <circle
                                                cx="50" cy="50" r="45" fill="none" stroke="#16a34a" strokeWidth="10"
                                                strokeDasharray={`${analytics.resolution_rate * 2.83} 283`}
                                                strokeLinecap="round"
                                                transform="rotate(-90 50 50)"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-4xl font-black text-green-700">{analytics.resolution_rate}%</span>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 mt-4 font-medium">Cases successfully closed</p>
                                </div>

                                {/* Priority Handling */}
                                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-8 text-center border border-red-200">
                                    <p className="text-sm font-bold text-red-800 uppercase tracking-widest mb-4">Priority Queue</p>
                                    <p className="text-6xl font-black text-red-700 mb-4">{analytics.high_priority_count}</p>
                                    <p className="text-gray-600 font-medium">Critical cases pending</p>
                                    <div className="mt-6">
                                        <div className="bg-red-200 rounded-full h-3 w-full overflow-hidden">
                                            <div
                                                className="bg-red-600 h-full rounded-full"
                                                style={{ width: `${Math.min((analytics.high_priority_count / (analytics.pending_count || 1)) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-red-600 mt-2 font-bold uppercase">
                                            {Math.round((analytics.high_priority_count / (analytics.pending_count || 1)) * 100)}% of pending
                                        </p>
                                    </div>
                                </div>

                                {/* Processing Efficiency */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 text-center border border-blue-200">
                                    <p className="text-sm font-bold text-blue-800 uppercase tracking-widest mb-4">Processing Load</p>
                                    <p className="text-6xl font-black text-blue-700 mb-4">{analytics.pending_count}</p>
                                    <p className="text-gray-600 font-medium">Total pending cases</p>
                                    <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                                        <div className="bg-white rounded-lg p-3">
                                            <p className="font-black text-blue-700 text-lg">{analytics.total_complaints}</p>
                                            <p className="text-gray-500 uppercase text-xs font-bold">Total</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3">
                                            <p className="font-black text-green-700 text-lg">{analytics.resolved_count}</p>
                                            <p className="text-gray-500 uppercase text-xs font-bold">Resolved</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* SECTION C: Export Center */}
                <section className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-2xl font-black text-[#003366] uppercase tracking-wide">
                            Export Center
                        </h2>
                        <p className="text-gray-600 mt-1">Download reports and data files</p>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* CSV Export */}
                            <div className="border-2 border-gray-200 rounded-xl p-8 hover:border-[#003366] transition-colors group">
                                <div className="text-5xl mb-4 opacity-50 group-hover:opacity-100 transition-opacity">📊</div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Full Data Export (CSV)</h3>
                                <p className="text-gray-600 mb-6">Download complete complaint database in CSV format for external analysis.</p>
                                <button
                                    onClick={downloadAdminExport}
                                    className="w-full bg-[#003366] text-white py-4 rounded-lg font-bold uppercase tracking-wider text-lg hover:bg-blue-900 transition-colors shadow-lg"
                                >
                                    Download CSV
                                </button>
                            </div>

                            {/* Summary Report */}
                            <div className="border-2 border-gray-200 rounded-xl p-8 hover:border-[#003366] transition-colors group">
                                <div className="text-5xl mb-4 opacity-50 group-hover:opacity-100 transition-opacity">📋</div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Summary Report</h3>
                                <p className="text-gray-600 mb-6">Generate executive summary with key metrics and trends.</p>
                                <button
                                    onClick={() => window.print()}
                                    className="w-full bg-gray-200 text-gray-700 py-4 rounded-lg font-bold uppercase tracking-wider text-lg hover:bg-gray-300 transition-colors"
                                >
                                    Print Summary
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
