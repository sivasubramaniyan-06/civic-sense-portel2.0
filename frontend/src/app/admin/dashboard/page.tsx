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

        // Simple auth check
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

    if (loading) return <div className="p-8 text-center text-xl">Loading Dashboard...</div>;

    const generateInsights = () => {
        if (!analytics) return [];
        const insights = [];

        if (analytics.pending_count > 10) {
            insights.push({
                type: 'warning',
                title: 'High Backlog Detected',
                desc: `${analytics.pending_count} complaints are pending. Consider assigning more officers.`
            });
        }

        if (analytics.high_priority_count > 5) {
            insights.push({
                type: 'critical',
                title: 'Critical Attention Needed',
                desc: `There are ${analytics.high_priority_count} high-priority issues waiting. Use the Priority Session tab.`
            });
        }

        if (analytics.resolution_rate < 50) {
            insights.push({
                type: 'info',
                title: 'Low Resolution Rate',
                desc: `Current resolution rate is ${analytics.resolution_rate}%. Review closing procedures.`
            });
        }

        if (insights.length === 0) {
            insights.push({ type: 'success', title: 'System Healthy', desc: 'Complaints are being managed effectively.' });
        }

        return insights;
    };

    return (
        <div className="page-content bg-gray-50 min-h-screen">
            <div className="admin-container p-6 max-w-7xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-[#003366]">Admin Dashboard</h1>
                    <p className="text-gray-600">Overview and analytical insights</p>
                </header>

                <AdminNav />

                {/* KPI Cards */}
                {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium uppercase">Total Complaints</p>
                                <p className="text-3xl font-bold text-gray-900">{analytics.total_complaints}</p>
                            </div>
                            <div className="text-2xl bg-blue-50 p-3 rounded-full">📋</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium uppercase">Pending</p>
                                <p className="text-3xl font-bold text-orange-600">{analytics.pending_count}</p>
                            </div>
                            <div className="text-2xl bg-orange-50 p-3 rounded-full">⏳</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between border-l-4 border-l-red-500">
                            <div>
                                <p className="text-gray-500 text-sm font-medium uppercase">High Priority</p>
                                <p className="text-3xl font-bold text-red-600">{analytics.high_priority_count}</p>
                            </div>
                            <div className="text-2xl bg-red-50 p-3 rounded-full">🚨</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium uppercase">Resolved</p>
                                <p className="text-3xl font-bold text-green-600">{analytics.resolved_count}</p>
                            </div>
                            <div className="text-2xl bg-green-50 p-3 rounded-full">✅</div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Charts Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Department Chart */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-[#003366]">📊 Complaints by Department</h3>
                                <button onClick={downloadAdminExport} className="text-sm text-blue-600 hover:underline">
                                    Download CSV
                                </button>
                            </div>
                            <div className="h-48 flex items-end gap-2 border-b border-gray-300 pb-2">
                                {Object.entries(deptCounts).length > 0 ? (
                                    Object.entries(deptCounts).map(([dept, count]) => {
                                        const max = Math.max(...Object.values(deptCounts)) || 1;
                                        const height = Math.max((count / max) * 100, 5);
                                        return (
                                            <div key={dept} className="flex-1 flex flex-col items-center justify-end group">
                                                <div
                                                    className="w-full bg-[#003366] rounded-t hover:bg-[#002244] transition-all relative group-hover:opacity-80"
                                                    style={{ height: `${height}%` }}
                                                    title={`${dept}: ${count}`}
                                                >
                                                    <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {count}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] mt-2 text-center truncate w-full h-8 leading-tight text-gray-600">
                                                    {dept}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="w-full text-center text-gray-500 self-center">No data available</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Insights Column */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-700">🤖 AI Insights & Recommendations</h3>
                        {generateInsights().map((insight, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-lg border-l-4 shadow-sm ${insight.type === 'critical' ? 'bg-red-50 border-red-500' :
                                        insight.type === 'warning' ? 'bg-orange-50 border-orange-500' :
                                            insight.type === 'success' ? 'bg-green-50 border-green-500' :
                                                'bg-blue-50 border-blue-500'
                                    }`}
                            >
                                <h4 className={`font-bold text-sm mb-1 ${insight.type === 'critical' ? 'text-red-800' :
                                        insight.type === 'warning' ? 'text-orange-800' :
                                            insight.type === 'success' ? 'text-green-800' :
                                                'text-blue-800'
                                    }`}>{insight.title}</h4>
                                <p className="text-sm text-gray-700 leading-snug">{insight.desc}</p>
                            </div>
                        ))}

                        <div className="bg-gradient-to-br from-[#003366] to-[#004488] p-6 rounded-lg shadow text-white mt-6">
                            <h3 className="font-bold text-lg mb-2">🚀 Pro Tip</h3>
                            <p className="text-sm opacity-90 mb-4">
                                Use the Priority Session to clear urgent tasks first. It sorts complaints by age and severity automatically.
                            </p>
                            <button
                                onClick={() => router.push('/admin/priority')}
                                className="w-full bg-white text-[#003366] font-bold py-2 rounded hover:bg-gray-100 transition"
                            >
                                Go to Priority Session
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
