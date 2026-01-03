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
            <div className="text-xl font-bold text-[#003366] uppercase tracking-widest animate-pulse">Loading Analytics...</div>
        </div>
    );

    const maxDeptCount = Math.max(...Object.values(deptCounts), 1);

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="h-32"></div>

            <div className="max-w-6xl mx-auto px-6">

                <header className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-[#003366] uppercase tracking-wide">Analytics & Reports</h1>
                    <p className="text-base text-gray-600 mt-2">Data Visualization and Export Center</p>
                </header>

                <AdminNav />

                {/* Department Chart */}
                <section className="bg-white rounded-lg shadow mb-10 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 text-center">
                        <h2 className="text-lg font-bold text-[#003366] uppercase tracking-wide">Department Load Distribution</h2>
                    </div>

                    <div className="p-6">
                        <div className="h-64 flex items-end gap-4 border-b-2 border-gray-200 pb-2 mb-4">
                            {Object.entries(deptCounts).map(([dept, count]) => {
                                const height = Math.max((count / maxDeptCount) * 100, 10);
                                return (
                                    <div key={dept} className="flex-1 min-w-[60px] flex flex-col items-center justify-end h-full">
                                        <div className="text-sm font-bold text-[#003366] mb-2">{count}</div>
                                        <div className="w-full bg-[#003366] rounded-t" style={{ height: `${height}%` }}></div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex gap-4">
                            {Object.keys(deptCounts).map((dept) => (
                                <div key={dept} className="flex-1 min-w-[60px] text-center">
                                    <p className="text-xs font-bold text-gray-500 uppercase truncate" title={dept}>{dept}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Performance Metrics */}
                <section className="bg-white rounded-lg shadow mb-10 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 text-center">
                        <h2 className="text-lg font-bold text-[#003366] uppercase tracking-wide">Performance Metrics</h2>
                    </div>

                    {analytics && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Resolution Rate */}
                                <div className="bg-green-50 rounded-lg p-6 text-center border border-green-200">
                                    <p className="text-xs font-bold text-green-800 uppercase tracking-wide mb-3">Resolution Rate</p>
                                    <p className="text-5xl font-bold text-green-700 mb-2">{analytics.resolution_rate}%</p>
                                    <p className="text-sm text-gray-600">Cases successfully closed</p>
                                </div>

                                {/* Priority Queue */}
                                <div className="bg-red-50 rounded-lg p-6 text-center border border-red-200">
                                    <p className="text-xs font-bold text-red-800 uppercase tracking-wide mb-3">Priority Queue</p>
                                    <p className="text-5xl font-bold text-red-700 mb-2">{analytics.high_priority_count}</p>
                                    <p className="text-sm text-gray-600">Critical cases pending</p>
                                </div>

                                {/* Processing Load */}
                                <div className="bg-blue-50 rounded-lg p-6 text-center border border-blue-200">
                                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-3">Processing Load</p>
                                    <p className="text-5xl font-bold text-blue-700 mb-2">{analytics.pending_count}</p>
                                    <p className="text-sm text-gray-600">Total pending cases</p>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Export Center */}
                <section className="bg-white rounded-lg shadow mb-16 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 text-center">
                        <h2 className="text-lg font-bold text-[#003366] uppercase tracking-wide">Export Center</h2>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border border-gray-200 rounded-lg p-6 text-center">
                                <div className="text-4xl mb-3 opacity-50">📊</div>
                                <h3 className="text-base font-bold text-gray-800 mb-2">Full Data Export (CSV)</h3>
                                <p className="text-sm text-gray-600 mb-4">Download complete database for analysis.</p>
                                <button onClick={downloadAdminExport} className="bg-[#003366] text-white px-6 py-3 rounded font-bold uppercase text-sm tracking-wide hover:bg-blue-900 transition-colors">
                                    Download CSV
                                </button>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-6 text-center">
                                <div className="text-4xl mb-3 opacity-50">📋</div>
                                <h3 className="text-base font-bold text-gray-800 mb-2">Summary Report</h3>
                                <p className="text-sm text-gray-600 mb-4">Generate executive summary with key metrics.</p>
                                <button onClick={() => window.print()} className="bg-gray-200 text-gray-700 px-6 py-3 rounded font-bold uppercase text-sm tracking-wide hover:bg-gray-300 transition-colors">
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
