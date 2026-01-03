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

            let filters: any = {};
            if (activeTab !== 'all') filters.status = activeTab;
            const complaintsData = await getAdminComplaints(filters);
            setRecentComplaints(complaintsData.slice(0, 8));

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
        setLoading(false);
    };

    const generateInsights = () => {
        if (!analytics) return [];
        const insights = [];
        if (analytics.pending_count > 10) insights.push({ type: 'warning', title: 'HIGH BACKLOG', desc: `${analytics.pending_count} pending files require attention.` });
        if (analytics.high_priority_count > 5) insights.push({ type: 'critical', title: 'CRITICAL ALERT', desc: `${analytics.high_priority_count} High Priority cases pending.` });
        if (analytics.resolution_rate < 50) insights.push({ type: 'info', title: 'PERFORMANCE', desc: `Resolution ${analytics.resolution_rate}%. Needs improvement.` });
        if (insights.length === 0) insights.push({ type: 'success', title: 'SYSTEM OPTIMAL', desc: 'Operations within normal limits.' });
        return insights;
    };

    if (loading) return <div className="p-20 text-center text-[#003366] font-extrabold text-2xl uppercase tracking-widest">Loading Dashboard...</div>;

    const StatusTabs = () => (
        <div className="flex flex-wrap border-b-2 border-gray-200 mb-6 gap-6">
            {['all', 'submitted', 'assigned', 'in_progress', 'resolved'].map(t => (
                <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`pb-3 capitalize text-base font-bold transition-all border-b-4 ${activeTab === t
                            ? 'border-[#003366] text-[#003366]'
                            : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                        }`}
                >
                    {t === 'submitted' ? 'New Requests' : t.replace('_', ' ')}
                </button>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 font-sans pb-12">

            {/* Main Container */}
            <div className="max-w-[1600px] mx-auto px-8 py-10">

                {/* Header */}
                <header className="mb-10 border-b-2 border-gray-300 pb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-[#003366] tracking-tight uppercase">Admin Dashboard</h1>
                        <p className="text-sm text-gray-600 mt-2 uppercase tracking-widest font-bold">Public Grievance Monitoring System</p>
                    </div>
                    <div className="text-right">
                        <span className="bg-[#003366] text-white text-sm font-bold px-4 py-2 rounded shadow uppercase tracking-wide">System Online</span>
                        <div className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString()}</div>
                    </div>
                </header>

                <AdminNav />

                {/* KPI ROW */}
                {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        {/* Total */}
                        <div className="bg-white p-8 rounded-lg shadow-md border-t-8 border-blue-900 flex flex-col justify-between h-48 hover:shadow-xl transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl font-black text-blue-900 group-hover:scale-110 transition-transform">#</div>
                            <p className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Total Complaints</p>
                            <div className="mt-auto">
                                <p className="text-6xl font-black text-blue-900 leading-none mb-2">{analytics.total_complaints.toLocaleString()}</p>
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">Lifetime Record</span>
                            </div>
                        </div>
                        {/* Pending */}
                        <div className="bg-white p-8 rounded-lg shadow-md border-t-8 border-orange-500 flex flex-col justify-between h-48 hover:shadow-xl transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl font-black text-orange-600 group-hover:scale-110 transition-transform">!</div>
                            <p className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Pending Action</p>
                            <div className="mt-auto">
                                <p className="text-6xl font-black text-orange-600 leading-none mb-2">{analytics.pending_count.toLocaleString()}</p>
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">Active Files</span>
                            </div>
                        </div>
                        {/* High Priority */}
                        <div className="bg-white p-8 rounded-lg shadow-md border-t-8 border-red-700 flex flex-col justify-between h-48 hover:shadow-xl transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl font-black text-red-700 group-hover:scale-110 transition-transform">⚡</div>
                            <p className="text-sm font-black text-red-800 uppercase tracking-[0.2em] mb-4">Critical / High</p>
                            <div className="mt-auto">
                                <p className="text-6xl font-black text-red-700 leading-none mb-2">{analytics.high_priority_count.toLocaleString()}</p>
                                <span className="text-sm font-bold text-red-200 bg-red-800 px-2 py-1 rounded inline-block uppercase tracking-wide">Urgent</span>
                            </div>
                        </div>
                        {/* Resolved */}
                        <div className="bg-white p-8 rounded-lg shadow-md border-t-8 border-green-700 flex flex-col justify-between h-48 hover:shadow-xl transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl font-black text-green-700 group-hover:scale-110 transition-transform">✓</div>
                            <p className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Resolved</p>
                            <div className="mt-auto">
                                <p className="text-6xl font-black text-green-700 leading-none mb-2">{analytics.resolved_count.toLocaleString()}</p>
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">{analytics.resolution_rate}% Success Rate</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* CONTENT GRID */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

                    {/* LEFT PANEL (Span 2) */}
                    <div className="xl:col-span-2 space-y-10">

                        {/* COMPLAINTS OVERVIEW */}
                        <div className="bg-white rounded-lg shadow-md border border-gray-200">
                            <div className="px-8 py-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                <h2 className="text-xl font-black text-[#003366] uppercase tracking-wide flex items-center gap-2">
                                    <span className="w-2 h-6 bg-[#003366]"></span>
                                    Complaints Overview
                                </h2>
                                <Link href="/admin/complaints" className="bg-white border border-blue-200 text-blue-800 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-blue-50 transition-colors shadow-sm">
                                    View Full Registry &rarr;
                                </Link>
                            </div>
                            <div className="p-8">
                                <StatusTabs />
                                <div className="overflow-x-auto ring-1 ring-gray-100 rounded-lg">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead className="bg-[#003366] text-white uppercase text-xs font-bold tracking-wider">
                                            <tr>
                                                <th className="p-4 rounded-tl-lg">Reference ID</th>
                                                <th className="p-4">Category</th>
                                                <th className="p-4">Priority</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-right rounded-tr-lg">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {recentComplaints.length === 0 ? (
                                                <tr><td colSpan={5} className="p-12 text-center text-gray-500 font-bold italic">No records matching criteria.</td></tr>
                                            ) : (
                                                recentComplaints.map((c, idx) => (
                                                    <tr key={c.id} className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                        <td className="p-4 font-mono font-bold text-gray-700">#{c.id.substring(0, 8).toUpperCase()}</td>
                                                        <td className="p-4 capitalize font-semibold text-gray-800">{c.category.replace('_', ' ')}</td>
                                                        <td className="p-4">
                                                            <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-sm ${c.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                                    c.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                                                                        'bg-green-100 text-green-800'
                                                                }`}>{c.priority}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`text-xs font-bold uppercase tracking-wide ${c.status === 'resolved' ? 'text-green-700' : 'text-blue-700'
                                                                }`}>{c.status.replace('_', ' ')}</span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <Link href={`/admin/complaints/${c.id}`} className="text-white bg-[#003366] hover:bg-blue-800 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide shadow-sm transition-colors">
                                                                Manage
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* CHART SECTION */}
                        <div className="bg-white rounded-lg shadow-md border border-gray-200">
                            <div className="px-8 py-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                <h2 className="text-xl font-black text-[#003366] uppercase tracking-wide flex items-center gap-2">
                                    <span className="w-2 h-6 bg-[#003366]"></span>
                                    Department Load Distribution
                                </h2>
                                <button onClick={downloadAdminExport} className="text-xs font-bold text-gray-500 hover:text-[#003366] uppercase tracking-wide flex items-center gap-1">
                                    <span className="text-lg">⬇</span> Download Report
                                </button>
                            </div>
                            <div className="p-8">
                                <div className="h-96 w-full flex items-end gap-6 border-b-4 border-gray-200 pb-0 overflow-x-auto px-4">
                                    {Object.entries(deptCounts).map(([dept, count]) => {
                                        const max = Math.max(...Object.values(deptCounts)) || 1;
                                        const height = Math.max((count / max) * 100, 10);
                                        return (
                                            <div key={dept} className="flex-1 min-w-[60px] flex flex-col justify-end group h-full relative">
                                                <div className="w-full bg-gradient-to-t from-blue-900 to-blue-600 rounded-t-lg shadow-lg relative group-hover:to-blue-500 transition-all" style={{ height: `${height}%` }}>
                                                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white px-3 py-1 rounded text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-xl">
                                                        {count}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="flex gap-6 mt-4 px-4 overflow-x-auto pb-4">
                                    {Object.keys(deptCounts).map((dept) => (
                                        <div key={dept} className="flex-1 min-w-[60px] text-center">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider transform -rotate-45 origin-top-left translate-y-2 truncate" title={dept}>
                                                {dept}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT PANEL (Span 1) */}
                    <div className="space-y-8">

                        {/* AI & ACTIONS */}
                        <div className="bg-white rounded-lg shadow-md border border-gray-200 h-fit">
                            <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                                    <span className="text-xl">🤖</span> AI Intelligence
                                </h2>
                            </div>
                            <div className="p-8 space-y-6">
                                {generateInsights().map((insight, idx) => (
                                    <div key={idx} className={`p-6 rounded-lg border-l-8 shadow-sm ${insight.type === 'critical' ? 'bg-red-50 border-red-600' :
                                            insight.type === 'warning' ? 'bg-orange-50 border-orange-500' :
                                                insight.type === 'info' ? 'bg-blue-50 border-blue-500' :
                                                    'bg-green-50 border-green-500'
                                        }`}>
                                        <h4 className="font-black text-sm uppercase tracking-wide mb-2 text-gray-900">{insight.title}</h4>
                                        <p className="text-base text-gray-700 font-medium leading-relaxed">{insight.desc}</p>
                                    </div>
                                ))}

                                <div className="pt-8 mt-4 border-t-2 border-dashed border-gray-200">
                                    <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs mb-4">CRITICAL ACTIONS</h3>

                                    <div className="bg-red-50 border border-red-100 rounded-lg p-6 text-center shadow-inner mb-4">
                                        <h4 className="font-bold text-red-900 uppercase tracking-wide mb-2">Urgent Handling</h4>
                                        <p className="text-xs text-red-800 mb-4 opacity-80">Process high priority cases immediately.</p>
                                        <Link href="/admin/priority" className="block w-full bg-red-700 text-white font-black py-4 rounded shadow-lg hover:bg-red-800 transition-all uppercase text-sm tracking-widest transform hover:-translate-y-1">
                                            Start Priority Session
                                        </Link>
                                    </div>

                                    <button onClick={downloadAdminExport} className="w-full bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 rounded hover:bg-gray-50 transition-colors uppercase text-xs tracking-wider flex items-center justify-center gap-2">
                                        <span>Download Full Report</span>
                                        <span>⬇</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* System Status - Mini Card */}
                        <div className="bg-[#003366] rounded-lg shadow-lg p-6 text-white text-center">
                            <div className="text-4xl mb-2 opacity-50">🛡️</div>
                            <p className="font-bold uppercase tracking-widest text-xs opacity-70 mb-1">Security Level</p>
                            <h3 className="font-black text-xl uppercase tracking-wider text-green-400">Stable</h3>
                            <p className="text-[10px] mt-4 opacity-50">v1.2.0 - Authorized Personnel Only</p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
