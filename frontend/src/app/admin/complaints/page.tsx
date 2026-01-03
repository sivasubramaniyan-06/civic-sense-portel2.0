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
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    useEffect(() => {
        checkAuthAndLoad();
    }, [statusFilter]);

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
            if (statusFilter && statusFilter !== 'all') filters.status = statusFilter;
            if (priorityFilter) filters.priority = priorityFilter;
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

    const getPriorityStyle = (p: string) => {
        switch (p) {
            case 'high': return 'bg-red-100 text-red-800 border border-red-300';
            case 'medium': return 'bg-orange-100 text-orange-800 border border-orange-300';
            default: return 'bg-green-100 text-green-800 border border-green-300';
        }
    };

    const getStatusStyle = (s: string) => {
        switch (s) {
            case 'resolved': return 'text-green-700';
            case 'in_progress': return 'text-blue-700';
            case 'assigned': return 'text-purple-700';
            default: return 'text-orange-700';
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    const statusTabs = [
        { id: 'all', label: 'All' },
        { id: 'submitted', label: 'New' },
        { id: 'assigned', label: 'Assigned' },
        { id: 'in_progress', label: 'In Progress' },
        { id: 'resolved', label: 'Resolved' },
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            {/* HEADER OFFSET */}
            <div className="h-24"></div>

            {/* CENTERED CONTAINER */}
            <div className="max-w-[1280px] mx-auto px-8 pb-20">

                {/* PAGE TITLE */}
                <header className="text-center mb-10 pt-6">
                    <h1 className="text-4xl font-bold text-[#003366] uppercase tracking-wide">
                        MANAGE COMPLAINTS
                    </h1>
                    <p className="text-xl text-gray-600 mt-3">
                        View, assign, and update citizen grievances
                    </p>
                </header>

                {/* NAVIGATION TABS */}
                <AdminNav />

                {/* SEARCH AND FILTERS */}
                <section className="bg-white rounded-lg shadow-lg p-8 mb-10">
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-6 items-end">
                        {/* Search */}
                        <div className="flex-1 min-w-[300px]">
                            <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                                Search
                            </label>
                            <input
                                type="text"
                                placeholder="Complaint ID, keyword, location..."
                                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Priority Filter */}
                        <div className="w-48">
                            <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                                Priority
                            </label>
                            <select
                                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none"
                                value={priorityFilter}
                                onChange={e => setPriorityFilter(e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        {/* Search Button */}
                        <button
                            type="submit"
                            className="bg-[#003366] text-white px-10 py-4 rounded-lg font-bold uppercase text-base tracking-wide hover:bg-blue-900 transition-colors"
                        >
                            Search
                        </button>
                    </form>
                </section>

                {/* STATUS TABS */}
                <section className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="flex border-b-2 border-gray-200">
                        {statusTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id === 'all' ? '' : tab.id)}
                                className={`flex-1 py-5 text-base font-bold uppercase tracking-wide transition-all ${(tab.id === 'all' && !statusFilter) || statusFilter === tab.id
                                        ? 'bg-[#003366] text-white'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* TABLE */}
                    {loading ? (
                        <div className="p-20 text-center text-xl text-gray-500 font-bold uppercase tracking-wide">
                            Loading Records...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100 border-b-2 border-gray-200">
                                    <tr>
                                        <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">ID</th>
                                        <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">Category</th>
                                        <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">Priority</th>
                                        <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">Status</th>
                                        <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">Date</th>
                                        <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {complaints.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-20 text-center text-xl text-gray-500 italic">
                                                No complaints found matching current filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        complaints.map((c, idx) => (
                                            <tr key={c.id} className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                <td className="p-5 font-mono font-bold text-gray-700 text-base">
                                                    #{c.id.substring(0, 8).toUpperCase()}
                                                </td>
                                                <td className="p-5 capitalize font-semibold text-gray-800 text-base">
                                                    {c.category.replace('_', ' ')}
                                                </td>
                                                <td className="p-5">
                                                    <span className={`px-4 py-2 rounded text-sm font-bold uppercase ${getPriorityStyle(c.priority)}`}>
                                                        {c.priority}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <span className={`font-bold uppercase tracking-wide ${getStatusStyle(c.status)}`}>
                                                        {c.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-gray-600 text-base">
                                                    {formatDate(c.created_at)}
                                                </td>
                                                <td className="p-5 text-center">
                                                    <Link
                                                        href={`/admin/complaints/${c.id}`}
                                                        className="inline-block bg-[#003366] text-white px-8 py-3 rounded-lg font-bold uppercase text-sm tracking-wide hover:bg-blue-900 transition-colors"
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
                    )}

                    {/* Table Footer */}
                    <div className="px-8 py-5 bg-gray-50 border-t-2 border-gray-200 text-center">
                        <p className="text-base text-gray-600 font-medium">
                            Showing {complaints.length} record(s)
                        </p>
                    </div>
                </section>

            </div>
        </div>
    );
}
