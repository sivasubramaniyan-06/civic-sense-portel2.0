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
            <div className="text-[#003366] font-bold text-lg animate-pulse">Loading Analytics Dashboard...</div>
        </div>
    );

    const generateInsights = () => {
        if (!analytics) return [];
        const insights = [];

        if (analytics.pending_count > 10) {
            insights.push({
                type: 'warning',
                title: 'High Backlog Detected',
                desc: `${analytics.pending_count} complaints are pending. Assign more officers to clear the queue.`
            });
        }

        if (analytics.high_priority_count > 5) {
            insights.push({
                type: 'critical',
                title: 'Critical Attention Needed',
                desc: `There are ${analytics.high_priority_count} high-priority issues waiting. Use Priority Session immediately.`
            });
        }

        if (analytics.resolution_rate < 50) {
            insights.push({
                type: 'info',
                title: 'Low Resolution Rate',
                desc: `Current resolution rate is ${analytics.resolution_rate}%. Review departmental bottlenecks.`
            });
        }

        if (insights.length === 0) {
            insights.push({ type: 'success', title: 'System Healthy', desc: 'Complaints are being managed within expected service levels.' });
        }

        return insights;
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <header className="mb-8 flex justify-between items-end border-b border-gray-200 pb-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight">Analytics Overview</h1>
                        <p className="text-gray-500 text-sm mt-1">Real-time system insights and performance metrics</p>
                    </div>
                </header>

                <AdminNav />

                {/* KPI Cards */}
                {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {/* Total */}
                        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-blue-600">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Received</p>
                            <p className="text-4xl font-extrabold text-blue-900">{analytics.total_complaints}</p>
                        </div>
                        {/* Pending */}
                        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-orange-500">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Pending Action</p>
                            <p className="text-4xl font-extrabold text-orange-600">{analytics.pending_count}</p>
                        </div>
                        {/* Critical */}
                        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-red-600 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <div className="w-16 h-16 bg-red-600 rounded-full"></div>
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">High Priority</p>
                            <p className="text-4xl font-extrabold text-red-600">{analytics.high_priority_count}</p>
                        </div>
                        {/* Resolved */}
                        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-green-500">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Resolved</p>
                            <p className="text-4xl font-extrabold text-green-600">{analytics.resolved_count}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Charts Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Department Chart */}
                        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-[#003366] text-lg">Departmental Load</h3>
                                <button onClick={downloadAdminExport} className="text-xs font-bold text-white bg-[#003366] px-3 py-1.5 rounded hover:bg-blue-900 transition-colors uppercase tracking-wide">
                                    Export Data
                                </button>
                            </div>
                            <div className="h-64 flex items-end gap-2 border-b border-gray-200 pb-0 px-2">
                                {Object.entries(deptCounts).length > 0 ? (
                                    Object.entries(deptCounts).map(([dept, count]) => {
                                        const max = Math.max(...Object.values(deptCounts)) || 1;
                                        const height = Math.max((count / max) * 100, 5);
                                        return (
                                            <div key={dept} className="flex-1 flex flex-col items-center justify-end group">
                                                <div
                                                    className="w-full bg-blue-600 rounded-t hover:bg-blue-800 transition-colors relative"
                                                    style={{ height: `${height}%` }}
                                                >
                                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                        {count} Complaints
                                                    </div>
                                                </div>
                                                <div className="h-10 mt-2 w-full">
                                                    <p className="text-[10px] text-center font-medium text-gray-500 uppercase truncate px-1" title={dept}>
                                                        {dept}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">No data available</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Insights Column */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                                <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                                AI-Driven Insights
                            </h3>
                            <div className="space-y-4">
                                {generateInsights().map((insight, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-4 rounded border-l-4 ${insight.type === 'critical' ? 'bg-red-50 border-red-600' :
                                                insight.type === 'warning' ? 'bg-orange-50 border-orange-500' :
                                                    insight.type === 'success' ? 'bg-green-50 border-green-500' :
                                                        'bg-blue-50 border-blue-500'
                                            }`}
                                    >
                                        <h4 className={`font-bold text-sm mb-1 uppercase tracking-wide ${insight.type === 'critical' ? 'text-red-800' : 'text-gray-800'
                                            }`}>{insight.title}</h4>
                                        <p className="text-sm text-gray-700">{insight.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-[#003366] text-white p-6 rounded shadow-lg">
                            <h3 className="font-bold text-lg mb-2">Priority Workflow</h3>
                            <p className="text-sm text-blue-100 mb-4 opacity-90 leading-relaxed">
                                Access the dedicated session for handling critical grievances sorted by urgency.
                            </p>
                            <button
                                onClick={() => router.push('/admin/priority')}
                                className="w-full bg-white text-[#003366] font-bold py-3 px-4 rounded hover:bg-gray-100 transition-colors uppercase text-sm tracking-wide"
                            >
                                Start Priority Session
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
