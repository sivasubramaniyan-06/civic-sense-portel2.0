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
        if (!analytics) return { status: 'Loading', level: 'normal', message: 'Fetching system data...' };

        if (analytics.high_priority_count > 10 || analytics.resolution_rate < 30) {
            return {
                status: 'CRITICAL',
                level: 'critical',
                message: `Immediate attention required. ${analytics.high_priority_count} high priority cases pending. Resolution rate at ${analytics.resolution_rate}%.`
            };
        }
        if (analytics.pending_count > 20 || analytics.resolution_rate < 50) {
            return {
                status: 'WARNING',
                level: 'warning',
                message: `${analytics.pending_count} cases pending. Current resolution rate: ${analytics.resolution_rate}%. Consider allocating additional resources.`
            };
        }
        return {
            status: 'NORMAL',
            level: 'normal',
            message: `All systems operational. Resolution rate: ${analytics.resolution_rate}%. Operations within normal parameters.`
        };
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-100 pt-32 flex justify-center">
            <div className="text-2xl font-bold text-[#003366] uppercase tracking-widest">Loading Dashboard...</div>
        </div>
    );

    const systemStatus = getSystemStatus();

    return (
        <div className="min-h-screen bg-gray-100">
            {/* HEADER OFFSET - Ensures content starts below fixed header */}
            <div className="h-36"></div>

            {/* CENTERED CONTAINER */}
            <div className="max-w-[1280px] mx-auto px-8 pb-20">

                {/* A. PAGE TITLE */}
                <header className="text-center mb-10 pt-6">
                    <h1 className="text-4xl font-bold text-[#003366] uppercase tracking-wide">
                        ADMIN DASHBOARD
                    </h1>
                    <p className="text-xl text-gray-600 mt-3">
                        System Overview and Operational Status
                    </p>
                </header>

                {/* NAVIGATION TABS */}
                <AdminNav />

                {/* B. KPI CARDS ROW */}
                <section className="mb-14">
                    <h2 className="text-xl font-bold text-[#003366] uppercase tracking-wide mb-8 text-center border-b-2 border-gray-200 pb-4">
                        Key Performance Indicators
                    </h2>

                    {analytics && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {/* Total Complaints */}
                            <div className="bg-white rounded-lg shadow-lg border-l-8 border-blue-800 p-8">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                                    Total Complaints
                                </p>
                                <p className="text-6xl font-bold text-blue-900 mb-3">
                                    {analytics.total_complaints}
                                </p>
                                <p className="text-base text-gray-500 uppercase tracking-wide">
                                    Lifetime Records
                                </p>
                            </div>

                            {/* Pending Action */}
                            <div className="bg-white rounded-lg shadow-lg border-l-8 border-orange-500 p-8">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                                    Pending Action
                                </p>
                                <p className="text-6xl font-bold text-orange-600 mb-3">
                                    {analytics.pending_count}
                                </p>
                                <p className="text-base text-gray-500 uppercase tracking-wide">
                                    Awaiting Processing
                                </p>
                            </div>

                            {/* High Priority */}
                            <div className="bg-white rounded-lg shadow-lg border-l-8 border-red-700 p-8">
                                <p className="text-sm font-bold text-red-700 uppercase tracking-widest mb-4">
                                    High Priority
                                </p>
                                <p className="text-6xl font-bold text-red-700 mb-3">
                                    {analytics.high_priority_count}
                                </p>
                                <p className="text-base font-bold text-white bg-red-700 px-4 py-1 rounded inline-block uppercase">
                                    Critical Cases
                                </p>
                            </div>

                            {/* Resolved */}
                            <div className="bg-white rounded-lg shadow-lg border-l-8 border-green-700 p-8">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                                    Resolved
                                </p>
                                <p className="text-6xl font-bold text-green-700 mb-3">
                                    {analytics.resolved_count}
                                </p>
                                <p className="text-base text-gray-500 uppercase tracking-wide">
                                    {analytics.resolution_rate}% Success Rate
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* C. AI SYSTEM STATUS PANEL */}
                <section className="mb-14">
                    <h2 className="text-xl font-bold text-[#003366] uppercase tracking-wide mb-8 text-center border-b-2 border-gray-200 pb-4">
                        AI System Intelligence
                    </h2>

                    <div className={`rounded-lg shadow-lg p-10 ${systemStatus.level === 'critical' ? 'bg-red-50 border-l-8 border-red-700' :
                        systemStatus.level === 'warning' ? 'bg-orange-50 border-l-8 border-orange-500' :
                            'bg-green-50 border-l-8 border-green-600'
                        }`}>
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                            <div className="text-center lg:text-left flex-1">
                                <h3 className="text-3xl font-bold uppercase tracking-wide mb-4">
                                    System Status:
                                    <span className={`ml-3 ${systemStatus.level === 'critical' ? 'text-red-700' :
                                        systemStatus.level === 'warning' ? 'text-orange-700' :
                                            'text-green-700'
                                        }`}>
                                        {systemStatus.status}
                                    </span>
                                </h3>
                                <p className="text-xl text-gray-700 leading-relaxed">
                                    {systemStatus.message}
                                </p>
                            </div>

                            {analytics && (
                                <div className="bg-white rounded-lg shadow px-12 py-8 text-center">
                                    <p className="text-6xl font-bold text-[#003366]">{analytics.resolution_rate}%</p>
                                    <p className="text-sm uppercase text-gray-600 font-bold tracking-widest mt-2">Resolution Rate</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* D. QUICK ACTIONS */}
                <section>
                    <h2 className="text-xl font-bold text-[#003366] uppercase tracking-wide mb-8 text-center border-b-2 border-gray-200 pb-4">
                        Quick Actions
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Manage Complaints */}
                        <Link href="/admin/complaints" className="bg-white rounded-lg shadow-lg p-10 text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-[#003366] group">
                            <h3 className="text-2xl font-bold text-[#003366] uppercase tracking-wide mb-4">
                                Manage Complaints
                            </h3>
                            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                View, assign, and update citizen grievances in the central registry
                            </p>
                            <span className="inline-block bg-[#003366] text-white px-10 py-4 rounded-lg font-bold uppercase text-lg tracking-wide group-hover:bg-blue-900 transition-colors">
                                Open Registry
                            </span>
                        </Link>

                        {/* Priority Session */}
                        <Link href="/admin/priority" className="bg-red-50 rounded-lg shadow-lg p-10 text-center hover:shadow-xl transition-all border-2 border-red-200 hover:border-red-600 group">
                            <h3 className="text-2xl font-bold text-red-800 uppercase tracking-wide mb-4">
                                Priority Session
                            </h3>
                            <p className="text-lg text-red-700 mb-8 leading-relaxed">
                                Handle AI-ranked critical grievances requiring immediate officer action
                            </p>
                            <span className="inline-block bg-red-700 text-white px-10 py-4 rounded-lg font-bold uppercase text-lg tracking-wide group-hover:bg-red-800 transition-colors">
                                Start Session
                            </span>
                        </Link>

                        {/* Analytics */}
                        <Link href="/admin/analytics" className="bg-white rounded-lg shadow-lg p-10 text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-[#003366] group">
                            <h3 className="text-2xl font-bold text-[#003366] uppercase tracking-wide mb-4">
                                Analytics and Reports
                            </h3>
                            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                View department performance charts and export system data
                            </p>
                            <span className="inline-block bg-[#003366] text-white px-10 py-4 rounded-lg font-bold uppercase text-lg tracking-wide group-hover:bg-blue-900 transition-colors">
                                View Reports
                            </span>
                        </Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
