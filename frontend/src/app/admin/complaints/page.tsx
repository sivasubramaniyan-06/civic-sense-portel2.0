'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getStoredToken,
    getStoredUser,
    getAdminComplaints,
    type Grievance,
    type AdminComplaintFilters
} from '@/lib/api';
import AdminNav from '@/components/AdminNav';

export default function AdminComplaintsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [complaints, setComplaints] = useState<Grievance[]>([]);
    const [activeTab, setActiveTab] = useState('new');
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('');

    useEffect(() => {
        checkAuthAndLoad();
    }, [activeTab]);

    useEffect(() => {
        if (!loading) loadComplaints();
    }, [deptFilter]);

    const checkAuthAndLoad = async () => {
        const token = getStoredToken();
        const user = getStoredUser();

        if (!token || user?.role !== 'admin') {
            router.push('/login');
            return;
        }

        loadComplaints();
    };

    const loadComplaints = async () => {
        setLoading(true);
        try {
            const filters: AdminComplaintFilters = {};
            if (activeTab !== 'all') {
                filters.status = activeTab === 'new' ? 'submitted' : activeTab;
            }
            if (search) filters.search = search;
            if (deptFilter) (filters as any).department = deptFilter;

            const data = await getAdminComplaints(filters);
            setComplaints(data);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadComplaints();
    };

    const StatusTabs = () => (
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto gap-4 no-scrollbar">
            {[
                { id: 'new', label: 'New Requests' },
                { id: 'assigned', label: 'Assigned' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'resolved', label: 'Resolved' },
                { id: 'all', label: 'All Records' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 font-bold text-sm whitespace-nowrap transition-all border-b-4 ${activeTab === tab.id
                            ? 'border-[#003366] text-[#003366]'
                            : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );

    const getPriorityClass = (p: string) => {
        switch (p) {
            case 'high': return 'bg-red-50 text-red-700 border border-red-200';
            case 'medium': return 'bg-orange-50 text-orange-700 border border-orange-200';
            case 'low': return 'bg-green-50 text-green-700 border border-green-200';
            default: return 'bg-gray-50 text-gray-700 border border-gray-200';
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    if (loading && complaints.length === 0) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-[#003366] font-bold text-lg animate-pulse">Loading Registry...</div>
        </div>
    );

    const departments = ['Public Works', 'Health', 'Education', 'Transport', 'Municipal', 'Revenue'];

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">

                <header className="mb-6 border-b border-gray-200 pb-4">
                    <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight">Central Complaints Registry</h1>
                    <p className="text-sm text-gray-500 mt-1 uppercase tracking-wide">Manage and Update Grievance Records</p>
                </header>

                <AdminNav />

                <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-4 justify-between items-center">
                        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-lg">
                            <input
                                type="text"
                                placeholder="Ref ID, Keyword, Location..."
                                className="flex-1 form-input py-2 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#003366] shadow-sm"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <button type="submit" className="bg-[#003366] text-white px-5 py-2 rounded text-sm font-bold hover:bg-blue-900 transition-colors shadow-sm">SEARCH</button>
                        </form>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 uppercase">Filter:</span>
                            <select
                                className="form-select py-2 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#003366] shadow-sm min-w-[200px]"
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                            >
                                <option value="">All Departments</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="px-6 pt-6 bg-white">
                        <StatusTabs />
                    </div>

                    <div className="flex-1 overflow-x-auto w-full">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-xs sticky top-0 bg-gray-50 z-10">
                                <tr>
                                    <th className="p-4 w-32 whitespace-nowrap">Reference ID</th>
                                    <th className="p-4 w-40 whitespace-nowrap">Category</th>
                                    <th className="p-4 min-w-[300px]">Description / Subject</th>
                                    <th className="p-4 w-28 whitespace-nowrap">Priority</th>
                                    <th className="p-4 w-32 whitespace-nowrap">Status</th>
                                    <th className="p-4 w-32 whitespace-nowrap">Received Date</th>
                                    <th className="p-4 w-24 text-right whitespace-nowrap">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {complaints.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-gray-500 italic">
                                            No complaints found matching current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    complaints.map(c => (
                                        <tr key={c.id} className="hover:bg-blue-50 transition-colors group">
                                            <td className="p-4 font-mono text-xs text-gray-500 font-medium">#{c.id.substring(0, 8).toUpperCase()}</td>
                                            <td className="p-4">
                                                <span className="font-semibold text-gray-700 capitalize text-xs bg-gray-100 px-2 py-1 rounded inline-block whitespace-nowrap">
                                                    {c.category.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <p className="line-clamp-2 text-gray-800 font-medium leading-snug">{c.description}</p>
                                                <p className="text-xs text-gray-400 mt-1 font-medium">{c.location}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border shadow-sm ${getPriorityClass(c.priority)}`}>
                                                    {c.priority}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`capitalize font-bold text-xs flex items-center gap-1 ${c.status === 'resolved' ? 'text-green-700' : 'text-gray-600'
                                                    }`}>
                                                    <span className={`w-2 h-2 rounded-full ${c.status === 'resolved' ? 'bg-green-500' :
                                                            c.status === 'in_progress' ? 'bg-blue-500' :
                                                                'bg-gray-400'
                                                        }`}></span>
                                                    {c.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500 text-xs font-mono whitespace-nowrap">{formatDate(c.created_at)}</td>
                                            <td className="p-4 text-right">
                                                <Link
                                                    href={`/admin/complaints/${c.id}`}
                                                    className="inline-block px-4 py-1.5 border border-[#003366] rounded text-[#003366] bg-transparent hover:bg-[#003366] hover:text-white text-xs font-bold transition-all shadow-sm uppercase tracking-wide"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Footer */}
                    <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 font-medium flex justify-between items-center">
                        <span>System Generated Report</span>
                        <span>Total Records: {complaints.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
