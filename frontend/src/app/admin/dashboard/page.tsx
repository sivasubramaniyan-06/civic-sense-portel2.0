'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getStoredToken,
    getStoredUser,
    getAdminAnalytics,
    type AdminAnalytics
} from '@/lib/api';
import AdminNav from '@/components/AdminNav';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);

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
            const analyticsData = await getAdminAnalytics();
            setAnalytics(analyticsData);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
        setLoading(false);
    };

    const getSystemStatus = () => {
        if (!analytics) return { status: 'Loading', color: 'gray', alerts: [] };

        const alerts: string[] = [];
        if (analytics.pending_count > 20) alerts.push(`High backlog: ${analytics.pending_count} pending cases`);
        if (analytics.high_priority_count > 10) alerts.push(`Critical: ${analytics.high_priority_count} high priority cases need attention`);
        if (analytics.resolution_rate < 50) alerts.push(`Low resolution rate: ${analytics.resolution_rate}% - needs improvement`);

        if (alerts.length > 2) return { status: 'Critical', color: 'red', alerts };
        if (alerts.length > 0) return { status: 'Warning', color: 'orange', alerts };
        return { status: 'Optimal', color: 'green', alerts: ['All systems operating within normal parameters'] };
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-2xl font-bold text-[#003366] uppercase tracking-widest animate-pulse">Loading Dashboard...</div>
        </div>
    );

    const systemStatus = getSystemStatus();

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="h-28"></div>

            <div className="w-full px-8">
                <div className="max-w-6xl mx-auto">

                    {/* Page Header - Centered */}
                    <header className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-[#003366] uppercase tracking-wide">Admin Dashboard</h1>
                        <p className="text-lg text-gray-600 mt-2">System Overview and Operational Status</p>
                    </header>

                    <AdminNav />

                    {/* KPI CARDS */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-700 uppercase tracking-wide mb-6 text-center">
                            Key Performance Indicators
                        </h2>

                        {analytics && (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-blue-800 text-center">
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Total Complaints</p>
                                    <p className="text-6xl font-bold text-blue-900 mb-2">{analytics.total_complaints}</p>
                                    <p className="text-sm text-gray-400 uppercase">Lifetime Records</p>
                                </div>

                                <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-orange-500 text-center">
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Pending Action</p>
                                    <p className="text-6xl font-bold text-orange-600 mb-2">{analytics.pending_count}</p>
                                    <p className="text-sm text-gray-400 uppercase">Awaiting Processing</p>
                                </div>

                                <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-red-600 text-center">
                                    <p className="text-sm font-bold text-red-700 uppercase tracking-wide mb-4">High Priority</p>
                                    <p className="text-6xl font-bold text-red-700 mb-2">{analytics.high_priority_count}</p>
                                    <p className="text-sm text-white bg-red-600 px-3 py-1 rounded uppercase inline-block">Critical</p>
                                </div>

                                <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-green-600 text-center">
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Resolved</p>
                                    <p className="text-6xl font-bold text-green-700 mb-2">{analytics.resolved_count}</p>
                                    <p className="text-sm text-gray-400 uppercase">{analytics.resolution_rate}% Rate</p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* AI STATUS */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-gray-700 uppercase tracking-wide mb-6 text-center">
                            AI System Intelligence
                        </h2>

                        <div className={`bg-white rounded-lg shadow-lg p-8 border-l-8 ${systemStatus.color === 'red' ? 'border-red-600' :
                                systemStatus.color === 'orange' ? 'border-orange-500' :
                                    'border-green-600'
                            }`}>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="text-center md:text-left">
                                    <h3 className="text-3xl font-bold uppercase tracking-wide mb-2">
                                        System Status: <span className={
                                            systemStatus.color === 'red' ? 'text-red-700' :
                                                systemStatus.color === 'orange' ? 'text-orange-700' :
                                                    'text-green-700'
                                        }>{systemStatus.status}</span>
                                    </h3>
                                    <p className="text-lg text-gray-600">Real-time AI monitoring and recommendations</p>
                                </div>
                                {analytics && (
                                    <div className="text-center bg-gray-100 px-8 py-4 rounded-lg">
                                        <p className="text-5xl font-bold text-[#003366]">{analytics.resolution_rate}%</p>
                                        <p className="text-sm uppercase text-gray-500 font-bold tracking-wide">Resolution Rate</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 space-y-3">
                                {systemStatus.alerts.map((alert, idx) => (
                                    <div key={idx} className={`p-4 rounded-lg text-base font-medium flex items-center gap-3 ${systemStatus.color === 'red' ? 'bg-red-50 text-red-800' :
                                            systemStatus.color === 'orange' ? 'bg-orange-50 text-orange-800' :
                                                'bg-green-50 text-green-800'
                                        }`}>
                                        <span className="text-xl">{systemStatus.color === 'green' ? '✓' : '!'}</span>
                                        <span>{alert}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* QUICK ACTIONS */}
                    <section className="mb-16">
                        <h2 className="text-xl font-bold text-gray-700 uppercase tracking-wide mb-6 text-center">
                            Quick Actions
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Link href="/admin/complaints" className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#003366]">
                                <div className="text-5xl mb-4 opacity-50">📋</div>
                                <h3 className="text-xl font-bold text-[#003366] uppercase tracking-wide mb-3">Manage Complaints</h3>
                                <p className="text-base text-gray-600 mb-6">View and process all grievance records</p>
                                <div className="bg-[#003366] text-white py-4 px-8 rounded-lg font-bold uppercase text-base tracking-wide">
                                    Open Registry
                                </div>
                            </Link>

                            <Link href="/admin/priority" className="bg-red-50 rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow border-2 border-red-200 hover:border-red-600">
                                <div className="text-5xl mb-4 opacity-50">⚡</div>
                                <h3 className="text-xl font-bold text-red-800 uppercase tracking-wide mb-3">Priority Session</h3>
                                <p className="text-base text-red-700 mb-6">Handle critical cases immediately</p>
                                <div className="bg-red-700 text-white py-4 px-8 rounded-lg font-bold uppercase text-base tracking-wide">
                                    Start Session
                                </div>
                            </Link>

                            <Link href="/admin/analytics" className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#003366]">
                                <div className="text-5xl mb-4 opacity-50">📊</div>
                                <h3 className="text-xl font-bold text-[#003366] uppercase tracking-wide mb-3">Analytics & Reports</h3>
                                <p className="text-base text-gray-600 mb-6">View charts and export data</p>
                                <div className="bg-[#003366] text-white py-4 px-8 rounded-lg font-bold uppercase text-base tracking-wide">
                                    View Analytics
                                </div>
                            </Link>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
