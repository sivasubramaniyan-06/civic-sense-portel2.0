'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getStoredUser,
    getStoredToken,
    removeStoredToken,
    getCurrentUser,
    getUserComplaints,
    type UserComplaintSummary
} from '@/lib/api';
import type { AuthUser } from '@/lib/api';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [complaints, setComplaints] = useState<UserComplaintSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [complaintsLoading, setComplaintsLoading] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const token = getStoredToken();
            const storedUser = getStoredUser();

            if (!token) {
                router.push('/login');
                return;
            }

            if (storedUser) {
                setUser(storedUser);
                setLoading(false);
                fetchComplaints();
                return;
            }

            // Verify token with server
            try {
                const result = await getCurrentUser(token);
                if (result.success && result.user) {
                    setUser(result.user as AuthUser);
                    fetchComplaints();
                } else {
                    removeStoredToken();
                    router.push('/login');
                }
            } catch {
                removeStoredToken();
                router.push('/login');
            }

            setLoading(false);
        };

        checkAuth();
    }, [router]);

    // Refetch complaints when page becomes visible (user returns from submission)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user) {
                fetchComplaints();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', () => user && fetchComplaints());

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user]);

    const fetchComplaints = async () => {
        setComplaintsLoading(true);
        try {
            const result = await getUserComplaints();
            if (result.success) {
                setComplaints(result.complaints);
            }
        } catch (err) {
            console.error('Failed to fetch complaints:', err);
        }
        setComplaintsLoading(false);
    };

    const handleLogout = () => {
        removeStoredToken();
        router.push('/');
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'submitted': return 'status-badge status-submitted';
            case 'assigned': return 'status-badge status-assigned';
            case 'in_progress': return 'status-badge status-in-progress';
            case 'resolved': return 'status-badge status-resolved';
            default: return 'status-badge';
        }
    };

    const getPriorityBadgeClass = (priority: string) => {
        switch (priority) {
            case 'high': return 'priority-badge priority-high';
            case 'medium': return 'priority-badge priority-medium';
            case 'low': return 'priority-badge priority-low';
            default: return 'priority-badge';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="page-content flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">⏳</div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="page-content">
            <div className="w-full max-w-[1200px] mx-auto px-6 md:px-8">
                {/* Welcome Section */}
                <div className="gov-card mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-[#003366]">
                                Welcome, {user.name}! 👋
                            </h1>
                            <p className="text-gray-600">{user.email}</p>
                            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                {user.role === 'admin' ? '👮 Admin' : '👤 Citizen'}
                            </span>
                        </div>
                        <button onClick={handleLogout} className="btn-outline">
                            Logout
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Link href="/lodge-grievance" className="gov-card hover:shadow-lg transition-shadow text-center p-4">
                        <div className="text-3xl mb-2">📝</div>
                        <h3 className="font-bold text-sm text-[#003366]">Lodge Grievance</h3>
                    </Link>

                    <Link href="/track-status" className="gov-card hover:shadow-lg transition-shadow text-center p-4">
                        <div className="text-3xl mb-2">🔍</div>
                        <h3 className="font-bold text-sm text-[#003366]">Track Status</h3>
                    </Link>

                    <Link href="/help" className="gov-card hover:shadow-lg transition-shadow text-center p-4">
                        <div className="text-3xl mb-2">❓</div>
                        <h3 className="font-bold text-sm text-[#003366]">Help & FAQ</h3>
                    </Link>

                    {user.role === 'admin' && (
                        <Link href="/admin" className="gov-card hover:shadow-lg transition-shadow text-center p-4 bg-[#800020] text-white">
                            <div className="text-3xl mb-2">👮</div>
                            <h3 className="font-bold text-sm">Admin Panel</h3>
                        </Link>
                    )}
                </div>

                {/* My Complaints Section */}
                <div className="gov-card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-[#003366]">📋 My Complaints</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">Total: {complaints.length}</span>
                            <button
                                onClick={fetchComplaints}
                                disabled={complaintsLoading}
                                className="text-sm text-[#003366] hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                                title="Refresh complaints"
                            >
                                <span className={complaintsLoading ? 'animate-spin' : ''}>🔄</span>
                                Refresh
                            </button>
                        </div>
                    </div>

                    {complaintsLoading ? (
                        <div className="text-center py-8">
                            <div className="text-3xl mb-2">⏳</div>
                            <p className="text-gray-500">Loading complaints...</p>
                        </div>
                    ) : complaints.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <div className="text-4xl mb-3">📭</div>
                            <h3 className="font-bold text-gray-700 mb-2">No complaints yet</h3>
                            <p className="text-gray-500 mb-4">You haven&apos;t submitted any grievances.</p>
                            <Link href="/lodge-grievance" className="btn-primary">
                                Lodge Your First Grievance
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="gov-table w-full">
                                <thead>
                                    <tr>
                                        <th>Complaint ID</th>
                                        <th>Category</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {complaints.map((complaint) => (
                                        <tr key={complaint.id}>
                                            <td className="font-mono text-sm">{complaint.id}</td>
                                            <td className="capitalize">{complaint.category.replace('_', ' ')}</td>
                                            <td>
                                                <span className={getPriorityBadgeClass(complaint.priority)}>
                                                    {complaint.priority.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={getStatusBadgeClass(complaint.status)}>
                                                    {complaint.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="text-sm">{formatDate(complaint.created_at)}</td>
                                            <td>
                                                <Link
                                                    href={`/dashboard/complaint/${complaint.id}`}
                                                    className="text-[#800020] hover:underline text-sm font-medium"
                                                >
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="gov-card mt-6">
                    <h3 className="font-bold text-[#003366] mb-3">📢 Important Information</h3>
                    <ul className="text-sm text-gray-600 space-y-2">
                        <li>• All grievances are processed within 48 hours</li>
                        <li>• You will receive updates via email</li>
                        <li>• Keep your complaint ID for tracking</li>
                        <li>• Contact helpdesk for urgent issues: 1800-XXX-XXXX</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
