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
            {/* Spacer for fixed header */}
            <div className="h-32"></div>

            <div className="max-w-6xl mx-auto px-6">

                {/* Page Header */}
                <header className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-[#003366] uppercase tracking-wide">Admin Dashboard</h1>
                    <p className="text-base text-gray-600 mt-2">System Overview and Operational Status</p>
                </header>

                <AdminNav />

                {/* KPI CARDS - Equal Size Grid */}
                <section className="mb-10">
                    <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wide mb-6 text-center">
                        Key Performance Indicators
                    </h2>

                    {analytics && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Total */}
                            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-800 text-center h-40 flex flex-col justify-between">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Complaints</p>
                                <p className="text-5xl font-bold text-blue-900">{analytics.total_complaints}</p>
                                <p className="text-xs text-gray-400 uppercase">Lifetime Records</p>
                            </div>

                            {/* Pending */}
                            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-orange-500 text-center h-40 flex flex-col justify-between">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pending Action</p>
                                <p className="text-5xl font-bold text-orange-600">{analytics.pending_count}</p>
                                <p className="text-xs text-gray-400 uppercase">Awaiting Processing</p>
                            </div>

                            {/* High Priority */}
                            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-red-600 text-center h-40 flex flex-col justify-between">
                                <p className="text-xs font-bold text-red-700 uppercase tracking-wide">High Priority</p>
                                <p className="text-5xl font-bold text-red-700">{analytics.high_priority_count}</p>
                                <p className="text-xs text-white bg-red-600 px-2 py-1 rounded uppercase inline-block mx-auto">Critical Cases</p>
                            </div>

                            {/* Resolved */}
                            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-600 text-center h-40 flex flex-col justify-between">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Resolved</p>
                                <p className="text-5xl font-bold text-green-700">{analytics.resolved_count}</p>
                                <p className="text-xs text-gray-400 uppercase">{analytics.resolution_rate}% Success Rate</p>
                            </div>
                        </div>
                    )}
                </section>

                {/* AI STATUS PANEL */}
                <section className="mb-10">
                    <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wide mb-6 text-center">
                        AI System Intelligence
                    </h2>

                    <div className={`bg-white rounded-lg shadow p-8 border-l-4 ${systemStatus.color === 'red' ? 'border-red-600' :
                            systemStatus.color === 'orange' ? 'border-orange-500' :
                                'border-green-600'
                        }`}>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-left">
                                <h3 className="text-2xl font-bold uppercase tracking-wide mb-2">
                                    System Status: <span className={
                                        systemStatus.color === 'red' ? 'text-red-700' :
                                            systemStatus.color === 'orange' ? 'text-orange-700' :
                                                'text-green-700'
                                    }>{systemStatus.status}</span>
                                </h3>
                                <p className="text-sm text-gray-600">Real-time AI monitoring and recommendations</p>
                            </div>
                            {analytics && (
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-[#003366]">{analytics.resolution_rate}%</p>
                                    <p className="text-xs uppercase text-gray-500 font-bold tracking-wide">Resolution Rate</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 space-y-3">
                            {systemStatus.alerts.map((alert, idx) => (
                                <div key={idx} className={`p-4 rounded text-sm font-medium flex items-center gap-3 ${systemStatus.color === 'red' ? 'bg-red-50 text-red-800' :
                                        systemStatus.color === 'orange' ? 'bg-orange-50 text-orange-800' :
                                            'bg-green-50 text-green-800'
                                    }`}>
                                    <span className="text-lg">{systemStatus.color === 'green' ? '✓' : '!'}</span>
                                    <span>{alert}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* QUICK ACTIONS - Equal Cards */}
                <section className="mb-16">
                    <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wide mb-6 text-center">
                        Quick Actions
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Manage Complaints */}
                        <Link href="/admin/complaints" className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition-shadow h-56 flex flex-col justify-between border border-gray-200">
                            <div>
                                <div className="text-4xl mb-3 opacity-50">📋</div>
                                <h3 className="text-base font-bold text-[#003366] uppercase tracking-wide mb-2">Manage Complaints</h3>
                                <p className="text-sm text-gray-600">View and process all grievance records</p>
                            </div>
                            <div className="bg-[#003366] text-white py-3 px-6 rounded font-bold uppercase text-sm tracking-wide">
                                Open Registry
                            </div>
                        </Link>

                        {/* Priority Session */}
                        <Link href="/admin/priority" className="bg-red-50 rounded-lg shadow p-6 text-center hover:shadow-lg transition-shadow h-56 flex flex-col justify-between border border-red-200">
                            <div>
                                <div className="text-4xl mb-3 opacity-50">⚡</div>
                                <h3 className="text-base font-bold text-red-800 uppercase tracking-wide mb-2">Priority Session</h3>
                                <p className="text-sm text-red-700">Handle critical cases immediately</p>
                            </div>
                            <div className="bg-red-700 text-white py-3 px-6 rounded font-bold uppercase text-sm tracking-wide">
                                Start Session
                            </div>
                        </Link>

                        {/* Analytics */}
                        <Link href="/admin/analytics" className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition-shadow h-56 flex flex-col justify-between border border-gray-200">
                            <div>
                                <div className="text-4xl mb-3 opacity-50">📊</div>
                                <h3 className="text-base font-bold text-[#003366] uppercase tracking-wide mb-2">Analytics & Reports</h3>
                                <p className="text-sm text-gray-600">View charts and export data</p>
                            </div>
                            <div className="bg-[#003366] text-white py-3 px-6 rounded font-bold uppercase text-sm tracking-wide">
                                View Analytics
                            </div>
                        </Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
