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

    const handleFilter = () => loadComplaints();

    const clearFilters = () => {
        setSearch('');
        setCategoryFilter('');
        setPriorityFilter('');
        setStatusFilter('');
        setTimeout(loadComplaints, 100);
    };

    const getPriorityStyle = (p: string) => {
        switch (p) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-orange-100 text-orange-800';
            default: return 'bg-green-100 text-green-800';
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="h-28"></div>

            <div className="w-full px-8">
                <div className="max-w-6xl mx-auto">

                    {/* Page Header - Centered */}
                    <header className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-[#003366] uppercase tracking-wide">Manage Complaints</h1>
                        <p className="text-lg text-gray-600 mt-2">View, Filter, and Process Grievance Records</p>
                    </header>

                    <AdminNav />

                    {/* Filters */}
                    <section className="bg-white rounded-lg shadow-lg p-8 mb-10">
                        <h2 className="text-xl font-bold text-gray-700 uppercase tracking-wide mb-6 text-center">Filter Records</h2>

                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Search</label>
                                <input
                                    type="text"
                                    placeholder="ID, keyword..."
                                    className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Category</label>
                                <select className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                                    <option value="">All</option>
                                    <option value="roads">Roads</option>
                                    <option value="water">Water</option>
                                    <option value="electricity">Electricity</option>
                                    <option value="sanitation">Sanitation</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Priority</label>
                                <select className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                                    <option value="">All</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Status</label>
                                <select className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                    <option value="">All</option>
                                    <option value="submitted">New</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-center gap-6 mt-8">
                            <button onClick={handleFilter} className="bg-[#003366] text-white px-10 py-4 rounded-lg font-bold uppercase text-base tracking-wide hover:bg-blue-900 transition-colors">
                                Apply Filters
                            </button>
                            <button onClick={clearFilters} className="bg-gray-300 text-gray-700 px-10 py-4 rounded-lg font-bold uppercase text-base tracking-wide hover:bg-gray-400 transition-colors">
                                Clear All
                            </button>
                        </div>
                    </section>

                    {/* Table */}
                    <section className="bg-white rounded-lg shadow-lg overflow-hidden mb-16">
                        <div className="px-8 py-6 bg-gray-50 border-b border-gray-200 text-center">
                            <h2 className="text-xl font-bold text-gray-700 uppercase tracking-wide">
                                Complaints Registry ({complaints.length} Records)
                            </h2>
                        </div>

                        {loading ? (
                            <div className="p-16 text-center text-xl text-gray-500 font-bold">Loading...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-[#003366] text-white uppercase text-sm font-bold tracking-wide">
                                        <tr>
                                            <th className="p-5">ID</th>
                                            <th className="p-5">Category</th>
                                            <th className="p-5">Priority</th>
                                            <th className="p-5">Status</th>
                                            <th className="p-5">Date</th>
                                            <th className="p-5 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {complaints.length === 0 ? (
                                            <tr><td colSpan={6} className="p-16 text-center text-xl text-gray-500 italic">No records found.</td></tr>
                                        ) : (
                                            complaints.map((c, idx) => (
                                                <tr key={c.id} className={`hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                    <td className="p-5 font-mono font-bold text-gray-700 text-base">#{c.id.substring(0, 8).toUpperCase()}</td>
                                                    <td className="p-5 capitalize font-medium text-gray-700 text-base">{c.category.replace('_', ' ')}</td>
                                                    <td className="p-5">
                                                        <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase ${getPriorityStyle(c.priority)}`}>{c.priority}</span>
                                                    </td>
                                                    <td className="p-5 capitalize font-medium text-gray-600 text-base">{c.status.replace('_', ' ')}</td>
                                                    <td className="p-5 text-gray-500 text-base">{formatDate(c.created_at)}</td>
                                                    <td className="p-5 text-center">
                                                        <Link href={`/admin/complaints/${c.id}`} className="bg-[#003366] text-white px-6 py-3 rounded-lg font-bold uppercase text-sm tracking-wide hover:bg-blue-900 transition-colors inline-block">
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
                    </section>

                </div>
            </div>
        </div>
    );
}
