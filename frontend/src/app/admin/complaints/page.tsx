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

export default function ManageComplaintsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [complaints, setComplaints] = useState<Grievance[]>([]);

    // Filters
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

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
        loadComplaints();
    };

    const loadComplaints = async () => {
        setLoading(true);
        try {
            const filters: AdminComplaintFilters = {};
            if (search) filters.search = search;
            if (statusFilter) filters.status = statusFilter;
            if (priorityFilter) filters.priority = priorityFilter;
            if (categoryFilter) filters.category = categoryFilter;

            const data = await getAdminComplaints(filters);
            setComplaints(data);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handleFilter = () => {
        loadComplaints();
    };

    const clearFilters = () => {
        setSearch('');
        setCategoryFilter('');
        setPriorityFilter('');
        setStatusFilter('');
        setTimeout(loadComplaints, 100);
    };

    const getPriorityStyle = (p: string) => {
        switch (p) {
            case 'high': return 'bg-red-100 text-red-800 border-red-300';
            case 'medium': return 'bg-orange-100 text-orange-800 border-orange-300';
            default: return 'bg-green-100 text-green-800 border-green-300';
        }
    };

    const getStatusStyle = (s: string) => {
        switch (s) {
            case 'resolved': return 'text-green-700';
            case 'in_progress': return 'text-blue-700';
            case 'assigned': return 'text-purple-700';
            default: return 'text-gray-700';
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Top Spacing */}
            <div className="pt-8"></div>

            <div className="max-w-7xl mx-auto px-8 pb-16">

                {/* Page Header */}
                <header className="mb-8">
                    <h1 className="text-4xl font-black text-[#003366] uppercase tracking-tight">Manage Complaints</h1>
                    <p className="text-lg text-gray-600 mt-2 font-medium">View, filter, and process all grievance records</p>
                </header>

                <AdminNav />

                {/* FILTERS SECTION */}
                <section className="bg-white rounded-xl shadow-lg p-8 mb-8">
                    <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide mb-6">Filter Records</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {/* Search */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Search</label>
                            <input
                                type="text"
                                placeholder="ID, keyword, location..."
                                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Category</label>
                            <select
                                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none"
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                <option value="roads">Roads</option>
                                <option value="water">Water</option>
                                <option value="electricity">Electricity</option>
                                <option value="sanitation">Sanitation</option>
                                <option value="health">Health</option>
                                <option value="education">Education</option>
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Priority</label>
                            <select
                                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none"
                                value={priorityFilter}
                                onChange={e => setPriorityFilter(e.target.value)}
                            >
                                <option value="">All Priorities</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Status</label>
                            <select
                                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="submitted">New</option>
                                <option value="assigned">Assigned</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={handleFilter}
                            className="bg-[#003366] text-white px-8 py-4 rounded-lg font-bold uppercase tracking-wider text-lg hover:bg-blue-900 transition-colors shadow-lg"
                        >
                            Apply Filters
                        </button>
                        <button
                            onClick={clearFilters}
                            className="bg-gray-200 text-gray-700 px-8 py-4 rounded-lg font-bold uppercase tracking-wider text-lg hover:bg-gray-300 transition-colors"
                        >
                            Clear All
                        </button>
                    </div>
                </section>

                {/* TABLE SECTION */}
                <section className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="px-8 py-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">
                            Complaints Registry ({complaints.length} Records)
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-16 text-center text-xl text-gray-500 font-bold">Loading records...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#003366] text-white uppercase text-sm font-bold tracking-wider">
                                    <tr>
                                        <th className="p-5">Reference ID</th>
                                        <th className="p-5">Category</th>
                                        <th className="p-5">Priority</th>
                                        <th className="p-5">Status</th>
                                        <th className="p-5">Date</th>
                                        <th className="p-5 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {complaints.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-16 text-center text-xl text-gray-500 font-bold italic">
                                                No complaints found matching filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        complaints.map((c, idx) => (
                                            <tr key={c.id} className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                <td className="p-5 font-mono font-bold text-gray-800 text-lg">
                                                    #{c.id.substring(0, 8).toUpperCase()}
                                                </td>
                                                <td className="p-5 capitalize font-semibold text-gray-700 text-lg">
                                                    {c.category.replace('_', ' ')}
                                                </td>
                                                <td className="p-5">
                                                    <span className={`px-4 py-2 rounded-full border-2 font-bold uppercase text-sm ${getPriorityStyle(c.priority)}`}>
                                                        {c.priority}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <span className={`font-bold uppercase tracking-wide ${getStatusStyle(c.status)}`}>
                                                        {c.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-gray-600 font-medium">
                                                    {formatDate(c.created_at)}
                                                </td>
                                                <td className="p-5 text-center">
                                                    <Link
                                                        href={`/admin/complaints/${c.id}`}
                                                        className="inline-block bg-[#003366] text-white px-6 py-3 rounded-lg font-bold uppercase text-sm tracking-wide hover:bg-blue-900 transition-colors shadow"
                                                    >
                                                        View / Manage
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 font-medium">
                        Showing {complaints.length} records
                    </div>
                </section>

            </div>
        </div>
    );
}
