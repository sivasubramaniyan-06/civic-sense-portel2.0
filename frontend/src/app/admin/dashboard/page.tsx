'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getStoredToken,
    getStoredUser,
    getAdminAnalytics,
    getAdminByDepartment,
    getAdminComplaints,
    downloadAdminExport,
    type AdminAnalytics,
    type Grievance
} from '@/lib/api';
import AdminNav from '@/components/AdminNav';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
    const [deptCounts, setDeptCounts] = useState<Record<string, number>>({});
    const [recentComplaints, setRecentComplaints] = useState<Grievance[]>([]);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        checkAuthAndLoad();
    }, [activeTab]);

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

            // Fetch complaints based on tab (simulated recent)
            let filters: any = {};
            if (activeTab !== 'all') filters.status = activeTab;

            // We fetch all but just show top 5-10 for dashboard overview
            const complaintsData = await getAdminComplaints(filters);
            setRecentComplaints(complaintsData.slice(0, 8)); // Top 8 recent

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
        setLoading(false);
    };

    const generateInsights = () => {
        if (!analytics) return [];
        const insights = [];
        if (analytics.pending_count > 10) insights.push({ type: 'warning', title: 'Backlog Alert', desc: `${analytics.pending_count} pending files.` });
        if (analytics.high_priority_count > 5) insights.push({ type: 'critical', title: 'Critical Rush', desc: `${analytics.high_priority_count} high priority cases.` });
        if (analytics.resolution_rate < 50) insights.push({ type: 'info', title: 'Performance', desc: `Resolution ${analytics.resolution_rate}%. Increase pace.` });
        if (insights.length === 0) insights.push({ type: 'success', title: 'System Normal', desc: 'Operations within limits.' });
        return insights;
    };

    if (loading) return <div className="p-12 text-center text-[#003366] font-bold text-xl">Loading Government Dashboard...</div>;

    const StatusTabs = () => (
        <div className="flex border-b border-gray-200 mb-4 gap-4">
            {['all', 'submitted', 'assigned', 'in_progress', 'resolved'].map(t => (
                <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`pb-2 capitalize text-sm font-bold border-b-2 transition-all ${activeTab === t
                            ? 'border-[#003366] text-[#003366]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    {t === 'submitted' ? 'New' : t.replace('_', ' ')}
                </button>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* Header Section */}
                <header className="mb-6 border-b border-gray-200 pb-4 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight uppercase">Admin Dashboard</h1>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-bold">Integrated Monitoring System</p>
                    </div>
                    <div className="text-right">
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">Live Status: Online</span>
                    </div>
                </header>

                <AdminNav />

                {/* KPI ROW (Full Width) */}
                {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Card */}
                        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-blue-800 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Grievances</p>
                            <div className="flex justify-between items-end">
                                <p className="text-4xl font-extrabold text-blue-900">{analytics.total_complaints.toLocaleString()}</p>
                                <span className="text-2xl opacity-20">📂</span>
                            </div>
                        </div>
                        {/* Pending Card */}
                        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-orange-500 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pending Action</p>
                            <div className="flex justify-between items-end">
                                <p className="text-4xl font-extrabold text-orange-600">{analytics.pending_count.toLocaleString()}</p>
                                <span className="text-2xl opacity-20">⏳</span>
                            </div>
                        </div>
                        {/* High Priority Card */}
                        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-red-600 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-red-700">High Priority</p>
                            <div className="flex justify-between items-end">
                                <p className="text-4xl font-extrabold text-red-700">{analytics.high_priority_count.toLocaleString()}</p>
                                <span className="text-2xl opacity-20">🚨</span>
                            </div>
                        </div>
                        {/* Resolved Card */}
                        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-green-600 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Resolved</p>
                            <div className="flex justify-between items-end">
                                <p className="text-4xl font-extrabold text-green-700">{analytics.resolved_count.toLocaleString()}</p>
                                <span className="text-2xl opacity-20">✅</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* MAIN GRID CONTENT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT PANEL (Span 8 - 66%) - Table & Charts */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* SECTION 1: Complaints Overview Table */}
                        <div className="bg-white rounded shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-[#003366] text-lg uppercase tracking-tight">Complaints Overview</h3>
                                <Link href="/admin/complaints" className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase">View All &rarr;</Link>
                            </div>
                            <div className="p-6">
                                <StatusTabs />
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="py-3 pl-2">ID</th>
                                                <th className="py-3">Category</th>
                                                <th className="py-3">Priority</th>
                                                <th className="py-3">Status</th>
                                                <th className="py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {recentComplaints.length === 0 ? (
                                                <tr><td colSpan={5} className="py-8 text-center text-gray-500 italic">No records found.</td></tr>
                                            ) : (
                                                recentComplaints.map(c => (
                                                    <tr key={c.id} className="hover:bg-blue-50 transition-colors">
                                                        <td className="py-3 pl-2 font-mono text-xs text-gray-600">#{c.id.substring(0, 8).toUpperCase()}</td>
                                                        <td className="py-3 capitalize text-gray-800 font-medium">{c.category.replace('_', ' ')}</td>
                                                        <td className="py-3">
                                                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${c.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    c.priority === 'medium' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                        'bg-green-50 text-green-700 border-green-200'
                                                                }`}>{c.priority}</span>
                                                        </td>
                                                        <td className="py-3 text-xs capitalize text-gray-600 font-medium">{c.status.replace('_', ' ')}</td>
                                                        <td className="py-3 text-right">
                                                            <Link href={`/admin/complaints/${c.id}`} className="text-[#003366] font-bold text-xs hover:underline">VIEW</Link>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: Department Load Chart */}
                        <div className="bg-white rounded shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="font-bold text-[#003366] text-lg uppercase tracking-tight">Department Load Distribution</h3>
                            </div>
                            <div className="p-6">
                                <div className="h-64 flex items-end gap-4 border-b-2 border-gray-100 pb-0">
                                    {Object.entries(deptCounts).length > 0 ? (
                                        Object.entries(deptCounts).map(([dept, count]) => {
                                            const max = Math.max(...Object.values(deptCounts)) || 1;
                                            const height = Math.max((count / max) * 100, 10);
                                            return (
                                                <div key={dept} className="flex-1 flex flex-col justify-end group h-full relative">
                                                    <div className="w-full bg-[#003366] rounded-t hover:bg-opacity-90 transition-all relative" style={{ height: `${height}%` }}>
                                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-700">{count}</div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : <div className="w-full text-center text-gray-400 py-20">No data available</div>}
                                </div>
                                <div className="flex gap-4 mt-2">
                                    {Object.keys(deptCounts).map((dept) => (
                                        <div key={dept} className="flex-1 text-center">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 truncate" title={dept}>{dept}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL (Span 4 - 33%) - Insights & Actions */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Insight Panel */}
                        <div className="bg-white rounded shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-100 bg-blue-50">
                                <h3 className="font-bold text-blue-900 text-sm uppercase tracking-wider">AI Intelligence</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                {generateInsights().map((insight, idx) => (
                                    <div key={idx} className={`p-4 rounded border-l-4 ${insight.type === 'critical' ? 'bg-red-50 border-red-500' :
                                            insight.type === 'warning' ? 'bg-orange-50 border-orange-500' :
                                                insight.type === 'info' ? 'bg-blue-50 border-blue-500' :
                                                    'bg-green-50 border-green-500'
                                        }`}>
                                        <h4 className="font-bold text-xs uppercase tracking-wide mb-1 text-gray-800">{insight.title}</h4>
                                        <p className="text-sm text-gray-700">{insight.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Priority Session Card */}
                        <div className="bg-[#8a1c1c] rounded shadow-sm text-white p-6 relative overflow-hidden">
                            <div className="absolute right-0 top-0 opacity-10 text-9xl leading-none">🚨</div>
                            <h3 className="font-bold text-lg uppercase tracking-wider mb-2 relative z-10">Priority Session</h3>
                            <p className="text-sm text-red-100 mb-6 relative z-10">Handle urgent and critical grievances requiring immediate officer intervention.</p>
                            <Link href="/admin/priority" className="block w-full bg-white text-[#8a1c1c] text-center font-bold py-3 rounded hover:bg-red-50 transition-colors uppercase text-sm tracking-widest shadow relative z-10">
                                Go to Session &rarr;
                            </Link>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Quick Actions</h3>
                            </div>
                            <div className="p-4 space-y-3">
                                <button onClick={downloadAdminExport} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-sm font-bold text-gray-700 flex justify-between items-center transition-colors">
                                    <span>Export CSV Report</span>
                                    <span>⬇</span>
                                </button>
                                <Link href="/admin/complaints" className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-sm font-bold text-gray-700 flex justify-between items-center transition-colors">
                                    <span>Assign Officers</span>
                                    <span>→</span>
                                </Link>
                                <div className="text-center text-xs text-gray-400 mt-2">v1.2.0 • Secured Access</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
