'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken, getStoredUser } from '@/lib/api';
import AdminNav from '@/components/AdminNav';

// Mock data for user-reported issues
const mockUserIssues = [
    { id: 'USR-001', userId: 'citizen_45', page: 'Lodge Grievance', errorType: 'Upload Failed', severity: 'high', description: 'Image upload stuck at 50%', timestamp: '2026-01-04 02:45:00', status: 'open' },
    { id: 'USR-002', userId: 'Anonymous', page: 'Track Status', errorType: 'UI Error', severity: 'medium', description: 'Status timeline not loading', timestamp: '2026-01-04 02:30:00', status: 'acknowledged' },
    { id: 'USR-003', userId: 'citizen_78', page: 'Lodge Grievance', errorType: 'Voice Note Failed', severity: 'high', description: 'Voice recording stops after 10 seconds', timestamp: '2026-01-04 01:15:00', status: 'open' },
    { id: 'USR-004', userId: 'citizen_12', page: 'Login', errorType: 'Language Issue', severity: 'low', description: 'Tamil translation missing on login page', timestamp: '2026-01-03 23:45:00', status: 'fixed' },
    { id: 'USR-005', userId: 'Anonymous', page: 'Upload', errorType: 'Upload Failed', severity: 'medium', description: 'PDF file rejected unexpectedly', timestamp: '2026-01-03 22:00:00', status: 'acknowledged' },
];

// Mock data for system-detected errors
const mockSystemErrors = [
    { category: 'Voice Processing', module: 'Speech-to-Text Engine', frequency: 23, aiSuggestion: 'Voice notes in regional languages (Tamil, Telugu) have 35% higher failure rate. Recommend expanding language model training dataset.' },
    { category: 'File Upload', module: 'Media Handler', frequency: 15, aiSuggestion: 'Large image files (>5MB) timeout frequently. Recommend implementing chunked upload or client-side compression.' },
    { category: 'Location Services', module: 'Map Component', frequency: 8, aiSuggestion: 'GPS location fetch fails on older Android devices. Consider adding manual pincode fallback.' },
    { category: 'Language Detection', module: 'NLP Classifier', frequency: 12, aiSuggestion: 'Mixed-language complaints (Hindi+English) often misclassified. Recommend hybrid language model.' },
];

export default function AdminHelpPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userIssues, setUserIssues] = useState(mockUserIssues);
    const [systemErrors] = useState(mockSystemErrors);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = getStoredToken();
        const user = getStoredUser();
        if (!token || user?.role !== 'admin') {
            router.push('/login');
            return;
        }
        setLoading(false);
    };

    const updateIssueStatus = (id: string, newStatus: string) => {
        setUserIssues(prev => prev.map(issue =>
            issue.id === id ? { ...issue, status: newStatus } : issue
        ));
    };

    const getSeverityStyle = (severity: string) => {
        switch (severity) {
            case 'high': return 'bg-red-100 text-red-800 border border-red-300';
            case 'medium': return 'bg-orange-100 text-orange-800 border border-orange-300';
            default: return 'bg-green-100 text-green-800 border border-green-300';
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'open': return 'bg-red-600 text-white';
            case 'acknowledged': return 'bg-yellow-500 text-white';
            case 'fixed': return 'bg-green-600 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-100 pt-40 flex justify-center">
            <div className="text-2xl font-bold text-[#003366] uppercase tracking-widest">Loading...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100">
            {/* HEADER OFFSET */}
            <div className="h-36"></div>

            {/* CENTERED CONTAINER */}
            <div className="max-w-[1280px] mx-auto px-8 pb-20">

                {/* PAGE TITLE */}
                <header className="text-center mb-10 pt-6">
                    <h1 className="text-4xl font-bold text-[#003366] uppercase tracking-wide">
                        ADMIN HELP & USER ISSUES MONITOR
                    </h1>
                    <p className="text-xl text-gray-600 mt-3">
                        Monitor portal issues, user errors, and system health
                    </p>
                    <div className="w-32 h-1 bg-[#003366] mx-auto mt-6"></div>
                </header>

                {/* NAVIGATION TABS */}
                <AdminNav />

                {/* SECTION 1: USER-REPORTED ISSUES */}
                <section className="bg-white rounded-xl shadow-lg mb-12 overflow-hidden">
                    <div className="px-10 py-6 bg-red-50 border-b-2 border-red-200">
                        <h2 className="text-2xl font-bold text-red-800 uppercase tracking-wide text-center">
                            User-Reported Issues and System Errors
                        </h2>
                        <p className="text-base text-red-700 text-center mt-2">
                            Real-time issues faced by citizens while using the portal
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 border-b-2 border-gray-200">
                                <tr>
                                    <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">Issue ID</th>
                                    <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">User</th>
                                    <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">Page</th>
                                    <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">Error Type</th>
                                    <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">Severity</th>
                                    <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">Description</th>
                                    <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">Time</th>
                                    <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">Status</th>
                                    <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {userIssues.map((issue, idx) => (
                                    <tr key={issue.id} className={`hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                        <td className="p-5 font-mono font-bold text-gray-700">{issue.id}</td>
                                        <td className="p-5 text-gray-600">{issue.userId}</td>
                                        <td className="p-5 text-gray-700 font-medium">{issue.page}</td>
                                        <td className="p-5 text-gray-700">{issue.errorType}</td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${getSeverityStyle(issue.severity)}`}>
                                                {issue.severity}
                                            </span>
                                        </td>
                                        <td className="p-5 text-gray-600 text-sm max-w-xs truncate" title={issue.description}>{issue.description}</td>
                                        <td className="p-5 text-gray-500 text-sm font-mono">{issue.timestamp.split(' ')[1]}</td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${getStatusStyle(issue.status)}`}>
                                                {issue.status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-center">
                                            {issue.status === 'open' && (
                                                <button
                                                    onClick={() => updateIssueStatus(issue.id, 'acknowledged')}
                                                    className="bg-yellow-500 text-white px-4 py-2 rounded text-xs font-bold uppercase hover:bg-yellow-600"
                                                >
                                                    Acknowledge
                                                </button>
                                            )}
                                            {issue.status === 'acknowledged' && (
                                                <button
                                                    onClick={() => updateIssueStatus(issue.id, 'fixed')}
                                                    className="bg-green-600 text-white px-4 py-2 rounded text-xs font-bold uppercase hover:bg-green-700"
                                                >
                                                    Mark Fixed
                                                </button>
                                            )}
                                            {issue.status === 'fixed' && (
                                                <span className="text-green-600 font-bold text-xs uppercase">Resolved</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* SECTION 2: SYSTEM DETECTED ERRORS */}
                <section className="bg-white rounded-xl shadow-lg mb-12 overflow-hidden">
                    <div className="px-10 py-6 bg-blue-50 border-b-2 border-blue-200">
                        <h2 className="text-2xl font-bold text-blue-800 uppercase tracking-wide text-center">
                            System Detected Errors (AI Assisted)
                        </h2>
                        <p className="text-base text-blue-700 text-center mt-2">
                            Automated error detection with AI-powered recommendations
                        </p>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {systemErrors.map((error, idx) => (
                                <div key={idx} className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{error.category}</h3>
                                            <p className="text-sm text-gray-500">Module: {error.module}</p>
                                        </div>
                                        <div className="text-center bg-red-100 px-4 py-2 rounded-lg">
                                            <p className="text-3xl font-bold text-red-700">{error.frequency}</p>
                                            <p className="text-xs text-red-600 uppercase font-bold">Occurrences</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-100 rounded-lg p-4 border-l-4 border-[#003366]">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#003366] flex items-center justify-center flex-shrink-0">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#003366] uppercase mb-1">AI Insight</p>
                                                <p className="text-sm text-gray-700 leading-relaxed">{error.aiSuggestion}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* SECTION 3: QUICK STATS */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-8 border-red-600 text-center">
                        <p className="text-4xl font-bold text-red-700">{userIssues.filter(i => i.status === 'open').length}</p>
                        <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mt-2">Open Issues</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-8 border-yellow-500 text-center">
                        <p className="text-4xl font-bold text-yellow-600">{userIssues.filter(i => i.status === 'acknowledged').length}</p>
                        <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mt-2">In Progress</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-8 border-green-600 text-center">
                        <p className="text-4xl font-bold text-green-700">{userIssues.filter(i => i.status === 'fixed').length}</p>
                        <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mt-2">Fixed</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-8 border-blue-600 text-center">
                        <p className="text-4xl font-bold text-blue-700">{systemErrors.reduce((acc, e) => acc + e.frequency, 0)}</p>
                        <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mt-2">System Errors</p>
                    </div>
                </section>

                {/* FAQ SECTION (Kept from original) */}
                <section className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="px-10 py-6 bg-gray-50 border-b-2 border-gray-200">
                        <h2 className="text-2xl font-bold text-[#003366] uppercase tracking-wide text-center">
                            Admin FAQs and Guidelines
                        </h2>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">How do I assign a complaint to a department?</h3>
                            <p className="text-gray-600">Navigate to Manage Complaints, click on "View" for any complaint, then use the "Assign Department" button to select the appropriate department.</p>
                        </div>
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">What does HIGH priority mean?</h3>
                            <p className="text-gray-600">HIGH priority complaints are flagged by AI due to safety-related keywords, emergency situations, or vulnerable population involvement. These require action within 24 hours.</p>
                        </div>
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">How do I export complaint data?</h3>
                            <p className="text-gray-600">Go to Analytics and Reports, scroll to the Export Center section, and click "Export CSV" to download all complaint data.</p>
                        </div>
                        <div className="pb-2">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Who do I contact for technical issues?</h3>
                            <p className="text-gray-600">For technical issues, contact the IT Support team at support@civicsense.gov.in or raise a ticket through the internal helpdesk system.</p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
