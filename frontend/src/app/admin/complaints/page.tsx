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
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
            {[
                { id: 'new', label: '🆕 New' },
                { id: 'assigned', label: '👤 Assigned' },
                { id: 'in_progress', label: '⏳ In Progress' },
                { id: 'resolved', label: '✅ Resolved' },
                { id: 'all', label: '📂 All' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id
                            ? 'border-[#003366] text-[#003366]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );

    const getPriorityClass = (p: string) => {
        switch (p) {
            case 'high': return 'bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold';
            case 'medium': return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs';
            case 'low': return 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs';
            default: return 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs';
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    if (loading && complaints.length === 0) {
        return <div className="p-8 text-center">Loading complaints...</div>;
    }

    return (
        <div className="page-content bg-gray-50 min-h-screen">
            <div className="admin-container p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-[#003366]">Manage Complaints</h1>
                        <p className="text-gray-600">View and update citizen grievances</p>
                    </div>
                </div>

                <AdminNav />

                <div className="gov-card">
                    {/* Toolbar */}
                    <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-md">
                            <input
                                type="text"
                                placeholder="Search ID, location, or description..."
                                className="form-input"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <button type="submit" className="btn-primary">Search</button>
                        </form>
                    </div>

                    <StatusTabs />

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                                <tr>
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Category</th>
                                    <th className="p-3">Description</th>
                                    <th className="p-3">Priority</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Date</th>
                                    <th className="p-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {complaints.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500">No complaints found.</td>
                                    </tr>
                                ) : (
                                    complaints.map(c => (
                                        <tr key={c.id} className="hover:bg-blue-50 transition-colors">
                                            <td className="p-3 font-mono text-xs">{c.id.substring(0, 8)}...</td>
                                            <td className="p-3 capitalize">{c.category.replace('_', ' ')}</td>
                                            <td className="p-3 max-w-xs truncate text-gray-600">{c.description}</td>
                                            <td className="p-3"><span className={getPriorityClass(c.priority)}>{c.priority.toUpperCase()}</span></td>
                                            <td className="p-3 capitalize">{c.status.replace('_', ' ')}</td>
                                            <td className="p-3 text-gray-500">{formatDate(c.created_at)}</td>
                                            <td className="p-3 text-right">
                                                <Link
                                                    href={`/admin/complaints/${c.id}`}
                                                    className="inline-block px-3 py-1 bg-white border border-[#003366] text-[#003366] rounded hover:bg-[#003366] hover:text-white transition-colors text-xs font-bold"
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
                </div>
            </div>
        </div>
    );
}
