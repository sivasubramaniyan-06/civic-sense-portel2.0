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

export default function AdminDashboardPage() {
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
            console.error('Failed to load data:', error);
        }
        setLoading(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-[#003366] font-bold text-lg animate-pulse">Loading Operational Insights...</div>
        </div>
    );

    const generateInsights = () => {
        if (!analytics) return [];
        const insights = [];

        if (analytics.pending_count > 10) {
            insights.push({
                type: 'warning',
                title: 'High Backlog Detected',
                desc: `${analytics.pending_count} complaints pending. Resource allocation needed.`
            });
        }

        if (analytics.high_priority_count > 5) {
            insights.push({
                type: 'critical',
                title: 'Critical Alert',
                desc: `${analytics.high_priority_count} high-priority issues require immediate attention.`
            });
        }

        if (analytics.resolution_rate < 50) {
            insights.push({
                type: 'info',
                title: 'Performance Metric',
                desc: `Resolution rate: ${analytics.resolution_rate}%. Identify bottlenecks.`
            });
        }

        if (insights.length === 0) {
            insights.push({ type: 'success', title: 'System Optimal', desc: 'All metrics within operational parameters.' });
        }

        return insights;
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            {/* Main Content Container */}
            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* Header Section */}
                <header className="mb-6 border-b border-gray-200 pb-4">
                    <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight">Operational Insights</h1>
                    <p className="text-sm text-gray-500 mt-1 uppercase tracking-wide">Public Grievance Redressal Monitoring System</p>
                </header>

                {/* Sub-Navigation */}
                <AdminNav />

                {/* SECTION 1: KPI SUMMARY */}
                {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Card */}
                        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-blue-800 flex flex-col justify-between h-32">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Registered</p>
                            <div className="flex justify-between items-end">
                                <p className="text-4xl font-extrabold text-blue-900">{analytics.total_complaints.toLocaleString()}</p>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Lifetime</span>
                            </div>
                        </div>
                        {/* Pending Card */}
                        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-orange-500 flex flex-col justify-between h-32">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pending Action</p>
                            <div className="flex justify-between items-end">
                                <p className="text-4xl font-extrabold text-orange-600">{analytics.pending_count.toLocaleString()}</p>
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Active</span>
                            </div>
                        </div>
                        {/* High Priority Card */}
                        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-red-600 flex flex-col justify-between h-32 relative overflow-hidden">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest relative z-10">Critical / High</p>
                            <div className="flex justify-between items-end relative z-10">
                                <p className="text-4xl font-extrabold text-red-700">{analytics.high_priority_count.toLocaleString()}</p>
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Urgent</span>
                            </div>
                        </div>
                        {/* Resolved Card */}
                        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-green-600 flex flex-col justify-between h-32">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Successfully Closed</p>
                            <div className="flex justify-between items-end">
                                <p className="text-4xl font-extrabold text-green-700">{analytics.resolved_count.toLocaleString()}</p>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{analytics.resolution_rate}% Rate</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* SECTION 2: ANALYTICS AREA (2-Column Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT (66% ~ 70% width): Chart Section */}
                    <div className="lg:col-span-2 bg-white rounded shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t">
                            <h3 className="font-bold text-[#003366] text-lg">Department Load Distribution</h3>
                            <button onClick={downloadAdminExport} className="text-xs font-bold text-white bg-[#003366] px-4 py-2 rounded hover:bg-blue-900 transition-colors uppercase tracking-wide">
                                Export Data (CSV)
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="h-64 flex items-end gap-4 border-b border-gray-200 pb-0 overflow-hidden relative">
                                {Object.entries(deptCounts).length > 0 ? (
                                    Object.entries(deptCounts).map(([dept, count]) => {
                                        const max = Math.max(...Object.values(deptCounts)) || 1;
                                        const percentage = Math.max((count / max) * 100, 10);
                                        return (
                                            <div key={dept} className="flex-1 flex flex-col items-center justify-end group h-full relative">
                                                <div
                                                    className="w-full bg-[#003366] bg-opacity-90 rounded-t transition-all duration-500 hover:bg-opacity-100 relative"
                                                    style={{ height: `${percentage}%` }}
                                                >
                                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 box-border">
                                                        {count}
                                                    </div>
                                                </div>

                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="w-full text-center text-gray-400 self-center">No Data Available</div>
                                )}
                            </div>
                            {/* X-Axis Labels */}
                            <div className="flex gap-4 mt-2 h-10 overflow-hidden">
                                {Object.keys(deptCounts).map((dept) => (
                                    <div key={dept} className="flex-1 text-center">
                                        <p className="text-[10px] uppercase font-bold text-gray-500 truncate" title={dept}>{dept}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT (33% ~ 30% width): Insights Panel */}
                    <div className="bg-white rounded shadow-sm border border-gray-200 h-fit">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 rounded-t">
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                <span className="w-2 h-5 bg-blue-600 rounded-full block"></span>
                                AI-Driven Insights
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {generateInsights().map((insight, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded border-l-4 shadow-sm ${insight.type === 'critical' ? 'bg-red-50 border-red-600' :
                                            insight.type === 'warning' ? 'bg-orange-50 border-orange-500' :
                                                insight.type === 'success' ? 'bg-green-50 border-green-500' :
                                                    'bg-blue-50 border-blue-500'
                                        }`}
                                >
                                    <h4 className={`font-bold text-xs uppercase tracking-wide mb-1 ${insight.type === 'critical' ? 'text-red-800' :
                                            insight.type === 'warning' ? 'text-orange-800' :
                                                insight.type === 'success' ? 'text-green-800' : 'text-blue-800'
                                        }`}>{insight.title}</h4>
                                    <p className="text-sm text-gray-800 leading-snug">{insight.desc}</p>
                                </div>
                            ))}

                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <button
                                    onClick={() => router.push('/admin/priority')}
                                    className="w-full bg-[#8a1c1c] text-white font-bold py-3 px-4 rounded hover:bg-red-800 transition-colors uppercase text-sm tracking-wide shadow"
                                >
                                    Start Priority Session &rarr;
                                </button>
                                <p className="text-xs text-center text-gray-500 mt-2">Redirects to Urgent Case Module</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
