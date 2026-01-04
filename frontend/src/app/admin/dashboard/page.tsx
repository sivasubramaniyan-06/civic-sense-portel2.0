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

// Extended Analytics Interface
interface ExtendedAnalytics extends AdminAnalytics {
    emergency_cases: number;
    pending_assignments: number;
    sla_compliance: number;
    department_performance: Record<string, number>;
    today_submissions: number;
    avg_resolution_time: string;
}

// Recent Admin Activity
interface AdminActivity {
    id: string;
    type: 'role_change' | 'reassignment' | 'status_override' | 'compliance_flag' | 'emergency' | 'system';
    message: string;
    user: string;
    timestamp: string;
    priority: 'normal' | 'warning' | 'critical';
}

// Mock recent activities
const mockActivities: AdminActivity[] = [
    { id: '1', type: 'emergency', message: 'Emergency case CSP-20260105-E001 escalated to Priority Officer', user: 'System', timestamp: '2 min ago', priority: 'critical' },
    { id: '2', type: 'reassignment', message: 'Complaint CSP-20260105-73E573 reassigned from Field Officer to Priority Officer', user: 'Rajesh Kumar', timestamp: '15 min ago', priority: 'warning' },
    { id: '3', type: 'status_override', message: 'Status changed from IN_PROGRESS to RESOLVED with admin override', user: 'Priya Sharma', timestamp: '30 min ago', priority: 'normal' },
    { id: '4', type: 'compliance_flag', message: 'Compliance violation flagged for late resolution on CSP-20260104-XYZ', user: 'Sunita Reddy', timestamp: '1 hour ago', priority: 'warning' },
    { id: '5', type: 'role_change', message: 'New role "Assessment Officer" assigned to Kavitha Nair', user: 'Rajesh Kumar', timestamp: '2 hours ago', priority: 'normal' },
    { id: '6', type: 'system', message: 'Daily compliance report generated and distributed', user: 'System', timestamp: '3 hours ago', priority: 'normal' },
];

// Department Performance Data
const departmentPerformance = [
    { name: 'Water Supply', resolved: 85, pending: 12, sla: 92 },
    { name: 'Public Works', resolved: 72, pending: 18, sla: 78 },
    { name: 'Health', resolved: 90, pending: 5, sla: 95 },
    { name: 'Sanitation', resolved: 68, pending: 22, sla: 71 },
    { name: 'Electricity', resolved: 88, pending: 8, sla: 89 },
];

export default function AdminDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<ExtendedAnalytics | null>(null);
    const [activities] = useState<AdminActivity[]>(mockActivities);

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
            // Extend with mock data for demo
            setAnalytics({
                ...analyticsData,
                emergency_cases: 3,
                pending_assignments: 8,
                sla_compliance: 87,
                department_performance: { water: 85, road: 72, health: 90 },
                today_submissions: 12,
                avg_resolution_time: '18h 24m'
            });
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

    const getActivityIcon = (type: AdminActivity['type']) => {
        const icons: Record<string, string> = {
            role_change: '👤',
            reassignment: '🔄',
            status_override: '⚡',
            compliance_flag: '🚩',
            emergency: '🚨',
            system: '⚙️'
        };
        return icons[type] || '📋';
    };

    const getActivityColor = (priority: AdminActivity['priority']) => {
        switch (priority) {
            case 'critical': return 'border-red-400 bg-red-50';
            case 'warning': return 'border-orange-400 bg-orange-50';
            default: return 'border-gray-200 bg-white';
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-100 pt-32 flex justify-center">
            <div className="text-2xl font-bold text-[#003366] uppercase tracking-widest">Loading Dashboard...</div>
        </div>
    );

    const systemStatus = getSystemStatus();

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="h-36"></div>

            <div className="max-w-[1400px] mx-auto px-8 pb-20">
                {/* PAGE TITLE */}
                <header className="text-center mb-10 pt-6">
                    <h1 className="text-4xl font-bold text-[#003366] uppercase tracking-wide">
                        ADMIN COMMAND CENTER
                    </h1>
                    <p className="text-xl text-gray-600 mt-3">
                        System Overview, Metrics & Operational Control
                    </p>
                    <div className="w-32 h-1 bg-[#003366] mx-auto mt-6"></div>
                </header>

                <AdminNav />

                {/* ADMIN QUICK ACTIONS PANEL */}
                <section className="mb-10">
                    <div className="bg-gradient-to-r from-[#003366] to-[#005599] rounded-xl shadow-xl p-6">
                        <h2 className="text-white font-bold text-lg uppercase tracking-wide mb-4 flex items-center gap-2">
                            <span className="text-2xl">⚡</span> Quick Actions
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <Link href="/admin/complaints" className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg p-4 text-center text-white transition-all group">
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📋</div>
                                <span className="font-medium text-sm">Assign Complaints</span>
                            </Link>
                            <Link href="/admin/priority" className="bg-red-500/80 hover:bg-red-500 backdrop-blur rounded-lg p-4 text-center text-white transition-all group border border-red-400">
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🚨</div>
                                <span className="font-medium text-sm">Emergency Cases</span>
                                {analytics && analytics.emergency_cases > 0 && (
                                    <span className="ml-1 bg-white text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                        {analytics.emergency_cases}
                                    </span>
                                )}
                            </Link>
                            <Link href="/admin/team" className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg p-4 text-center text-white transition-all group">
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">👥</div>
                                <span className="font-medium text-sm">Team Management</span>
                            </Link>
                            <button className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg p-4 text-center text-white transition-all group">
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📊</div>
                                <span className="font-medium text-sm">System Logs</span>
                            </button>
                            <button className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg p-4 text-center text-white transition-all group">
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📑</div>
                                <span className="font-medium text-sm">Compliance Reports</span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* ADMIN METRICS CARDS */}
                <section className="mb-10">
                    <h2 className="text-xl font-bold text-[#003366] uppercase tracking-wide mb-6 text-center border-b-2 border-gray-200 pb-4">
                        Key Performance Metrics
                    </h2>

                    {analytics && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {/* Total Active */}
                            <div className="bg-white rounded-lg shadow-lg border-l-4 border-blue-600 p-5">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Active Complaints</p>
                                <p className="text-4xl font-bold text-blue-700">{analytics.total_complaints - analytics.resolved_count}</p>
                                <p className="text-xs text-gray-500 mt-1">Across all depts</p>
                            </div>

                            {/* Emergency Cases */}
                            <div className="bg-red-50 rounded-lg shadow-lg border-l-4 border-red-600 p-5">
                                <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">🚨 Emergency</p>
                                <p className="text-4xl font-bold text-red-700">{analytics.emergency_cases}</p>
                                <p className="text-xs text-red-600 mt-1 font-medium">Requires immediate action</p>
                            </div>

                            {/* Pending Assignments */}
                            <div className="bg-orange-50 rounded-lg shadow-lg border-l-4 border-orange-500 p-5">
                                <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-2">Pending Assign</p>
                                <p className="text-4xl font-bold text-orange-600">{analytics.pending_assignments}</p>
                                <p className="text-xs text-orange-600 mt-1">Awaiting officer</p>
                            </div>

                            {/* SLA Compliance */}
                            <div className="bg-white rounded-lg shadow-lg border-l-4 border-green-600 p-5">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">SLA Compliance</p>
                                <p className="text-4xl font-bold text-green-700">{analytics.sla_compliance}%</p>
                                <p className="text-xs text-green-600 mt-1">Within target</p>
                            </div>

                            {/* High Priority */}
                            <div className="bg-white rounded-lg shadow-lg border-l-4 border-purple-600 p-5">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">High Priority</p>
                                <p className="text-4xl font-bold text-purple-700">{analytics.high_priority_count}</p>
                                <p className="text-xs text-gray-500 mt-1">Critical cases</p>
                            </div>

                            {/* Today's Submissions */}
                            <div className="bg-white rounded-lg shadow-lg border-l-4 border-teal-600 p-5">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Today&apos;s New</p>
                                <p className="text-4xl font-bold text-teal-700">{analytics.today_submissions}</p>
                                <p className="text-xs text-gray-500 mt-1">Submissions</p>
                            </div>
                        </div>
                    )}
                </section>

                {/* TWO COLUMN LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    {/* AI SYSTEM STATUS */}
                    <div className="lg:col-span-2">
                        <section className="h-full">
                            <h2 className="text-xl font-bold text-[#003366] uppercase tracking-wide mb-6 text-center border-b-2 border-gray-200 pb-4">
                                AI System Intelligence
                            </h2>

                            <div className={`rounded-lg shadow-lg p-8 h-[calc(100%-60px)] ${systemStatus.level === 'critical' ? 'bg-red-50 border-l-8 border-red-700' :
                                    systemStatus.level === 'warning' ? 'bg-orange-50 border-l-8 border-orange-500' :
                                        'bg-green-50 border-l-8 border-green-600'
                                }`}>
                                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 h-full">
                                    <div className="text-center lg:text-left flex-1">
                                        <h3 className="text-2xl font-bold uppercase tracking-wide mb-3">
                                            System Status:
                                            <span className={`ml-3 ${systemStatus.level === 'critical' ? 'text-red-700' :
                                                    systemStatus.level === 'warning' ? 'text-orange-700' :
                                                        'text-green-700'
                                                }`}>
                                                {systemStatus.status}
                                            </span>
                                        </h3>
                                        <p className="text-lg text-gray-700 leading-relaxed">{systemStatus.message}</p>

                                        {analytics && (
                                            <div className="mt-4 flex flex-wrap gap-4">
                                                <div className="bg-white rounded-lg px-4 py-2 shadow text-center">
                                                    <p className="text-2xl font-bold text-[#003366]">{analytics.resolution_rate}%</p>
                                                    <p className="text-xs text-gray-500 uppercase">Resolution Rate</p>
                                                </div>
                                                <div className="bg-white rounded-lg px-4 py-2 shadow text-center">
                                                    <p className="text-2xl font-bold text-[#003366]">{analytics.avg_resolution_time}</p>
                                                    <p className="text-xs text-gray-500 uppercase">Avg. Resolution</p>
                                                </div>
                                                <div className="bg-white rounded-lg px-4 py-2 shadow text-center">
                                                    <p className="text-2xl font-bold text-[#003366]">{analytics.total_complaints}</p>
                                                    <p className="text-xs text-gray-500 uppercase">Total Cases</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* RECENT ADMIN ACTIVITY */}
                    <div>
                        <section className="h-full">
                            <h2 className="text-xl font-bold text-[#003366] uppercase tracking-wide mb-6 text-center border-b-2 border-gray-200 pb-4">
                                Recent Activity
                            </h2>

                            <div className="bg-white rounded-lg shadow-lg p-4 h-[calc(100%-60px)] overflow-y-auto">
                                <div className="space-y-3">
                                    {activities.map(activity => (
                                        <div key={activity.id} className={`border-l-4 rounded-r-lg p-3 ${getActivityColor(activity.priority)}`}>
                                            <div className="flex items-start gap-2">
                                                <span className="text-lg">{getActivityIcon(activity.type)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-800 leading-tight">{activity.message}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-gray-500">{activity.user}</span>
                                                        <span className="text-xs text-gray-400">•</span>
                                                        <span className="text-xs text-gray-500">{activity.timestamp}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* DEPARTMENT PERFORMANCE */}
                <section className="mb-10">
                    <h2 className="text-xl font-bold text-[#003366] uppercase tracking-wide mb-6 text-center border-b-2 border-gray-200 pb-4">
                        Department Performance Overview
                    </h2>

                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b-2 border-gray-200">
                                <tr>
                                    <th className="p-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wide">Department</th>
                                    <th className="p-4 text-center text-sm font-bold text-gray-600 uppercase tracking-wide">Resolved</th>
                                    <th className="p-4 text-center text-sm font-bold text-gray-600 uppercase tracking-wide">Pending</th>
                                    <th className="p-4 text-center text-sm font-bold text-gray-600 uppercase tracking-wide">SLA %</th>
                                    <th className="p-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wide">Performance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {departmentPerformance.map((dept, idx) => (
                                    <tr key={dept.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="p-4 font-bold text-gray-800">{dept.name}</td>
                                        <td className="p-4 text-center">
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded font-bold">{dept.resolved}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded font-bold ${dept.pending > 15 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                                                }`}>{dept.pending}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded font-bold ${dept.sla >= 90 ? 'bg-green-100 text-green-800' :
                                                    dept.sla >= 75 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>{dept.sla}%</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${dept.sla >= 90 ? 'bg-green-500' :
                                                                dept.sla >= 75 ? 'bg-yellow-500' :
                                                                    'bg-red-500'
                                                            }`}
                                                        style={{ width: `${dept.sla}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-600 w-10">{dept.sla}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* NAVIGATION CARDS */}
                <section>
                    <h2 className="text-xl font-bold text-[#003366] uppercase tracking-wide mb-6 text-center border-b-2 border-gray-200 pb-4">
                        Administrative Modules
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Link href="/admin/complaints" className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-[#003366] group">
                            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <span className="text-3xl">📋</span>
                            </div>
                            <h3 className="text-lg font-bold text-[#003366] uppercase tracking-wide mb-2">Manage Complaints</h3>
                            <p className="text-sm text-gray-600 mb-4">View, assign, and update citizen grievances</p>
                            <span className="text-[#003366] font-bold text-sm uppercase">Open Registry →</span>
                        </Link>

                        <Link href="/admin/priority" className="bg-red-50 rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-all border-2 border-red-200 hover:border-red-600 group">
                            <div className="w-16 h-16 bg-red-200 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:bg-red-300 transition-colors">
                                <span className="text-3xl">🚨</span>
                            </div>
                            <h3 className="text-lg font-bold text-red-800 uppercase tracking-wide mb-2">Priority Session</h3>
                            <p className="text-sm text-red-700 mb-4">Handle AI-ranked critical grievances</p>
                            <span className="text-red-700 font-bold text-sm uppercase">Start Session →</span>
                        </Link>

                        <Link href="/admin/analytics" className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-[#003366] group">
                            <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                <span className="text-3xl">📊</span>
                            </div>
                            <h3 className="text-lg font-bold text-[#003366] uppercase tracking-wide mb-2">Analytics & Reports</h3>
                            <p className="text-sm text-gray-600 mb-4">View performance charts and export data</p>
                            <span className="text-[#003366] font-bold text-sm uppercase">View Reports →</span>
                        </Link>

                        <Link href="/admin/team" className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-[#003366] group">
                            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                <span className="text-3xl">👥</span>
                            </div>
                            <h3 className="text-lg font-bold text-[#003366] uppercase tracking-wide mb-2">Team & Roles</h3>
                            <p className="text-sm text-gray-600 mb-4">Manage officers and permissions</p>
                            <span className="text-[#003366] font-bold text-sm uppercase">Manage Team →</span>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
