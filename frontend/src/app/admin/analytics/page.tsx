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
            <div className="h-28"></div>

            <div className="w-full px-8">
                <div className="max-w-6xl mx-auto">

                    {/* Page Header - Centered */}
                    <header className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-[#003366] uppercase tracking-wide">Analytics & Reports</h1>
                        <p className="text-lg text-gray-600 mt-2">Data Visualization and Export Center</p>
                    </header>

                    <AdminNav />

                    {/* Department Chart */}
                    <section className="bg-white rounded-lg shadow-lg mb-10 overflow-hidden">
                        <div className="px-8 py-6 bg-gray-50 border-b border-gray-200 text-center">
                            <h2 className="text-xl font-bold text-[#003366] uppercase tracking-wide">Department Load Distribution</h2>
                        </div>

                        <div className="p-8">
                            <div className="h-80 flex items-end gap-6 border-b-4 border-gray-200 pb-4 mb-6">
                                {Object.entries(deptCounts).map(([dept, count]) => {
                                    const height = Math.max((count / maxDeptCount) * 100, 10);
                                    return (
                                        <div key={dept} className="flex-1 min-w-[80px] flex flex-col items-center justify-end h-full">
                                            <div className="text-xl font-bold text-[#003366] mb-3">{count}</div>
                                            <div className="w-full bg-[#003366] rounded-t-lg" style={{ height: `${height}%` }}></div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex gap-6">
                                {Object.keys(deptCounts).map((dept) => (
                                    <div key={dept} className="flex-1 min-w-[80px] text-center">
                                        <p className="text-sm font-bold text-gray-600 uppercase truncate" title={dept}>{dept}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Performance Metrics */}
                    <section className="bg-white rounded-lg shadow-lg mb-10 overflow-hidden">
                        <div className="px-8 py-6 bg-gray-50 border-b border-gray-200 text-center">
                            <h2 className="text-xl font-bold text-[#003366] uppercase tracking-wide">Performance Metrics</h2>
                        </div>

                        {analytics && (
                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="bg-green-50 rounded-xl p-10 text-center border-2 border-green-200">
                                        <p className="text-sm font-bold text-green-800 uppercase tracking-wide mb-4">Resolution Rate</p>
                                        <p className="text-7xl font-bold text-green-700 mb-3">{analytics.resolution_rate}%</p>
                                        <p className="text-base text-gray-600">Cases successfully closed</p>
                                    </div>

                                    <div className="bg-red-50 rounded-xl p-10 text-center border-2 border-red-200">
                                        <p className="text-sm font-bold text-red-800 uppercase tracking-wide mb-4">Priority Queue</p>
                                        <p className="text-7xl font-bold text-red-700 mb-3">{analytics.high_priority_count}</p>
                                        <p className="text-base text-gray-600">Critical cases pending</p>
                                    </div>

                                    <div className="bg-blue-50 rounded-xl p-10 text-center border-2 border-blue-200">
                                        <p className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">Processing Load</p>
                                        <p className="text-7xl font-bold text-blue-700 mb-3">{analytics.pending_count}</p>
                                        <p className="text-base text-gray-600">Total pending cases</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Export Center */}
                    <section className="bg-white rounded-lg shadow-lg mb-16 overflow-hidden">
                        <div className="px-8 py-6 bg-gray-50 border-b border-gray-200 text-center">
                            <h2 className="text-xl font-bold text-[#003366] uppercase tracking-wide">Export Center</h2>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="border-2 border-gray-200 rounded-xl p-10 text-center hover:border-[#003366] transition-colors">
                                    <div className="text-6xl mb-4 opacity-50">📊</div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-3">Full Data Export (CSV)</h3>
                                    <p className="text-base text-gray-600 mb-6">Download complete database for analysis.</p>
                                    <button onClick={downloadAdminExport} className="bg-[#003366] text-white px-10 py-4 rounded-lg font-bold uppercase text-base tracking-wide hover:bg-blue-900 transition-colors">
                                        Download CSV
                                    </button>
                                </div>

                                <div className="border-2 border-gray-200 rounded-xl p-10 text-center hover:border-gray-400 transition-colors">
                                    <div className="text-6xl mb-4 opacity-50">📋</div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-3">Summary Report</h3>
                                    <p className="text-base text-gray-600 mb-6">Generate executive summary with key metrics.</p>
                                    <button onClick={() => window.print()} className="bg-gray-300 text-gray-700 px-10 py-4 rounded-lg font-bold uppercase text-base tracking-wide hover:bg-gray-400 transition-colors">
                                        Print Summary
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
