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
            {/* Top Spacing for Header */}
            <div className="pt-8"></div>

            <div className="max-w-7xl mx-auto px-8 pb-16">

                {/* Page Header */}
                <header className="mb-8">
                    <h1 className="text-4xl font-black text-[#003366] uppercase tracking-tight">Admin Dashboard</h1>
                    <p className="text-lg text-gray-600 mt-2 font-medium">System overview and operational status</p>
                </header>

                <AdminNav />

                {/* SECTION A: KPI CARDS */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide mb-6 border-l-4 border-[#003366] pl-4">
                        Key Performance Indicators
                    </h2>

                    {analytics && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {/* Total */}
                            <div className="bg-white rounded-xl shadow-lg p-8 border-t-8 border-blue-800 hover:shadow-xl transition-shadow">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Total Complaints</p>
                                <p className="text-6xl font-black text-blue-900 leading-none">{analytics.total_complaints.toLocaleString()}</p>
                                <p className="text-sm text-gray-400 mt-4 uppercase">Lifetime Records</p>
                            </div>

                            {/* Pending */}
                            <div className="bg-white rounded-xl shadow-lg p-8 border-t-8 border-orange-500 hover:shadow-xl transition-shadow">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Pending Action</p>
                                <p className="text-6xl font-black text-orange-600 leading-none">{analytics.pending_count.toLocaleString()}</p>
                                <p className="text-sm text-gray-400 mt-4 uppercase">Awaiting Processing</p>
                            </div>

                            {/* High Priority */}
                            <div className="bg-white rounded-xl shadow-lg p-8 border-t-8 border-red-700 hover:shadow-xl transition-shadow">
                                <p className="text-sm font-bold text-red-700 uppercase tracking-widest mb-4">High Priority</p>
                                <p className="text-6xl font-black text-red-700 leading-none">{analytics.high_priority_count.toLocaleString()}</p>
                                <p className="text-sm text-red-300 bg-red-700 px-3 py-1 rounded inline-block mt-4 uppercase font-bold">Critical Cases</p>
                            </div>

                            {/* Resolved */}
                            <div className="bg-white rounded-xl shadow-lg p-8 border-t-8 border-green-700 hover:shadow-xl transition-shadow">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Resolved</p>
                                <p className="text-6xl font-black text-green-700 leading-none">{analytics.resolved_count.toLocaleString()}</p>
                                <p className="text-sm text-gray-400 mt-4 uppercase">{analytics.resolution_rate}% Success Rate</p>
                            </div>
                        </div>
                    )}
                </section>

                {/* SECTION B: AI STATUS PANEL */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide mb-6 border-l-4 border-[#003366] pl-4">
                        AI System Intelligence
                    </h2>

                    <div className={`bg-white rounded-xl shadow-lg p-10 border-l-8 ${systemStatus.color === 'red' ? 'border-red-600 bg-red-50' :
                            systemStatus.color === 'orange' ? 'border-orange-500 bg-orange-50' :
                                'border-green-600 bg-green-50'
                        }`}>
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h3 className="text-3xl font-black uppercase tracking-wide mb-2">
                                    System Status: <span className={
                                        systemStatus.color === 'red' ? 'text-red-700' :
                                            systemStatus.color === 'orange' ? 'text-orange-700' :
                                                'text-green-700'
                                    }>{systemStatus.status}</span>
                                </h3>
                                <p className="text-lg text-gray-600">Real-time AI monitoring and recommendations</p>
                            </div>
                            {analytics && (
                                <div className="text-right">
                                    <p className="text-5xl font-black text-[#003366]">{analytics.resolution_rate}%</p>
                                    <p className="text-sm uppercase text-gray-500 font-bold tracking-wider">Resolution Rate</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {systemStatus.alerts.map((alert, idx) => (
                                <div key={idx} className={`p-5 rounded-lg text-lg font-medium flex items-center gap-4 ${systemStatus.color === 'red' ? 'bg-red-100 text-red-800' :
                                        systemStatus.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                                            'bg-green-100 text-green-800'
                                    }`}>
                                    <span className="text-2xl">{systemStatus.color === 'green' ? '✓' : '!'}</span>
                                    <span>{alert}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* SECTION C: QUICK ACTIONS */}
                <section>
                    <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide mb-6 border-l-4 border-[#003366] pl-4">
                        Quick Actions
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Link
                            href="/admin/complaints"
                            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all border-2 border-transparent hover:border-[#003366] group text-center"
                        >
                            <div className="text-5xl mb-4 opacity-50 group-hover:opacity-100 transition-opacity">📋</div>
                            <h3 className="text-xl font-bold text-[#003366] uppercase tracking-wide mb-2">Manage Complaints</h3>
                            <p className="text-gray-600">View and process all grievance records</p>
                            <div className="mt-6 bg-[#003366] text-white py-3 px-6 rounded-lg font-bold uppercase text-sm tracking-wider">
                                Open Registry
                            </div>
                        </Link>

                        <Link
                            href="/admin/priority"
                            className="bg-red-50 rounded-xl shadow-lg p-8 hover:shadow-xl transition-all border-2 border-red-200 hover:border-red-600 group text-center"
                        >
                            <div className="text-5xl mb-4 opacity-50 group-hover:opacity-100 transition-opacity">⚡</div>
                            <h3 className="text-xl font-bold text-red-800 uppercase tracking-wide mb-2">Priority Session</h3>
                            <p className="text-red-700">Handle critical cases immediately</p>
                            <div className="mt-6 bg-red-700 text-white py-3 px-6 rounded-lg font-bold uppercase text-sm tracking-wider">
                                Start Session
                            </div>
                        </Link>

                        <Link
                            href="/admin/analytics"
                            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all border-2 border-transparent hover:border-[#003366] group text-center"
                        >
                            <div className="text-5xl mb-4 opacity-50 group-hover:opacity-100 transition-opacity">📊</div>
                            <h3 className="text-xl font-bold text-[#003366] uppercase tracking-wide mb-2">Analytics & Reports</h3>
                            <p className="text-gray-600">View charts and export data</p>
                            <div className="mt-6 bg-[#003366] text-white py-3 px-6 rounded-lg font-bold uppercase text-sm tracking-wider">
                                View Analytics
                            </div>
                        </Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
