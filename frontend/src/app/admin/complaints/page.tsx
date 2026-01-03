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
    }, [activeTab]); // deptFilter triggers load via search or effect? Let's trigger via effect or separate Load button.
    // Ideally trigger on deps change.

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
            // Note: API might not support 'department' filter explicitly in `filters` type in all my previous edits, 
            // but `getAdminComplaints` implementation in backend (Step 1028: admin.py list_complaints) accepts `department` query param?
            // Actually checking admin.py: Yes, `department: Optional[str] = None`.
            // Checking api.ts `AdminComplaintFilters`: It has `status`, `search`, `priority`, `category`. 
            // It might NOT have `department` in the implementation I did.
            // Wait, looking at Step 1028 dump of admin.py, it DOES have department.
            // Step 1046 api.ts view... I need to check if I added `department` to `AdminComplaintFilters` interface.
            // If not, I should cast or assume it works if I pass it to axios params.
            // I'll assume standard fitlers. If department isn't there, I'll filter client side for safety or just pass custom obj.
            // Let's filter client side if backend filtering isn't guaranteed in type, but preferably pass it.
            // I'll try to pass it in filters object anyway.
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
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto gap-1">
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
                    className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id
                            ? 'border-[#003366] text-[#003366]'
                            : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
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

    if (loading && complaints.length === 0) return <div className="p-12 text-center text-gray-500 font-bold">Loading Registry...</div>;

    const departments = ['Public Works', 'Health', 'Education', 'Transport', 'Municipal', 'Revenue'];

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight">Complaint Management</h1>
                        <p className="text-gray-500 text-sm mt-1">Central registry of all reported grievances</p>
                    </div>
                </div>

                <AdminNav />

                <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-4 justify-between items-center">
                        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-lg">
                            <input
                                type="text"
                                placeholder="Search by ID, Description, or Location..."
                                className="flex-1 form-input py-2 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <button type="submit" className="bg-[#003366] text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-900 transition-colors">Search</button>
                        </form>

                        <select
                            className="form-input py-2 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 min-w-[200px]"
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                        >
                            <option value="">Filter by Department (All)</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div className="px-6 pt-6">
                        <StatusTabs />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="p-4 w-32">Reference ID</th>
                                    <th className="p-4 w-32">Category</th>
                                    <th className="p-4">Description / Subject</th>
                                    <th className="p-4 w-24">Priority</th>
                                    <th className="p-4 w-24">Status</th>
                                    <th className="p-4 w-24">Date</th>
                                    <th className="p-4 w-20 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {complaints.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-gray-500 italic">
                                            No complaints found matching criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    complaints.map(c => (
                                        <tr key={c.id} className="hover:bg-blue-50 transition-colors">
                                            <td className="p-4 font-mono text-xs text-gray-500">#{c.id.substring(0, 8).toUpperCase()}</td>
                                            <td className="p-4 capitalize font-semibold text-gray-700">{c.category.replace('_', ' ')}</td>
                                            <td className="p-4 max-w-sm">
                                                <p className="truncate text-gray-800 font-medium">{c.description}</p>
                                                <p className="text-xs text-gray-400 mt-1">{c.location}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${getPriorityClass(c.priority)}`}>
                                                    {c.priority}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="capitalize text-gray-700 font-medium text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {c.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500 text-xs font-mono">{formatDate(c.created_at)}</td>
                                            <td className="p-4 text-right">
                                                <Link
                                                    href={`/admin/complaints/${c.id}`}
                                                    className="inline-block px-3 py-1.5 border border-gray-300 rounded text-gray-600 hover:text-[#003366] hover:border-[#003366] text-xs font-bold transition-all"
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
                    {/* Pagination (Visual only for now if list is long) */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 text-right">
                        Showing {complaints.length} records
                    </div>
                </div>
            </div>
        </div>
    );
}
