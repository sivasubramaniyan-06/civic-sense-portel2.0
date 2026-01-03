'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getStoredToken, getUserComplaintDetail, type Grievance } from '@/lib/api';

const LocationMap = dynamic(() => import('@/components/LocationMap'), { ssr: false });

export default function ComplaintDetailPage() {
    const router = useRouter();
    const params = useParams();
    const complaintId = params.id as string;

    const [complaint, setComplaint] = useState<Grievance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchComplaint = async () => {
            const token = getStoredToken();
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const result = await getUserComplaintDetail(complaintId);
                if (result.success) {
                    setComplaint(result.complaint);
                } else {
                    setError('Complaint not found');
                }
            } catch {
                setError('Failed to load complaint details');
            }
            setLoading(false);
        };

        if (complaintId) {
            fetchComplaint();
        }
    }, [complaintId, router]);

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
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const statusSteps = ['submitted', 'assigned', 'in_progress', 'resolved'];
    const currentStepIndex = complaint ? statusSteps.indexOf(complaint.status) : -1;

    if (loading) {
        return (
            <div className="page-content flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">⏳</div>
                    <p>Loading complaint details...</p>
                </div>
            </div>
        );
    }

    if (error || !complaint) {
        return (
            <div className="page-content flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">❌</div>
                    <p className="text-red-600 mb-4">{error || 'Complaint not found'}</p>
                    <Link href="/dashboard" className="btn-primary">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="w-full max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/dashboard" className="text-[#800020] hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>

                {/* Complaint Header Card */}
                <div className="gov-card mb-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-[#003366] mb-2">
                                Complaint #{complaint.id}
                            </h1>
                            <p className="text-gray-600">
                                Filed on {formatDate(complaint.created_at)}
                            </p>
                        </div>
                        <div className="flex gap-2 items-start">
                            <span className={getPriorityBadgeClass(complaint.priority)}>
                                {complaint.priority.toUpperCase()}
                            </span>
                            <span className={getStatusBadgeClass(complaint.status)}>
                                {complaint.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress Tracker */}
                <div className="gov-card mb-6">
                    <h2 className="text-lg font-bold text-[#003366] mb-4">📍 Progress Tracker</h2>
                    <div className="flex justify-between items-center relative">
                        {/* Progress Line */}
                        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0">
                            <div
                                className="h-full bg-[#800020] transition-all"
                                style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                            />
                        </div>

                        {statusSteps.map((step, index) => (
                            <div key={step} className="flex flex-col items-center z-10">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${index <= currentStepIndex ? 'bg-[#800020]' : 'bg-gray-300'
                                        }`}
                                >
                                    {index <= currentStepIndex ? '✓' : index + 1}
                                </div>
                                <span className={`text-xs mt-2 capitalize ${index <= currentStepIndex ? 'text-[#800020] font-medium' : 'text-gray-500'
                                    }`}>
                                    {step.replace('_', ' ')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Complaint Details */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="gov-card">
                        <h2 className="text-lg font-bold text-[#003366] mb-4">📋 Details</h2>
                        <div className="space-y-3">
                            <div>
                                <span className="text-gray-500 text-sm">Category</span>
                                <p className="font-medium capitalize">{complaint.category.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <span className="text-gray-500 text-sm">Department</span>
                                <p className="font-medium">{complaint.department}</p>
                            </div>
                            <div>
                                <span className="text-gray-500 text-sm">Location</span>
                                <p className="font-medium">{complaint.location}</p>
                            </div>
                            <div>
                                <span className="text-gray-500 text-sm">Last Updated</span>
                                <p className="font-medium">{formatDate(complaint.updated_at)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="gov-card">
                        <h2 className="text-lg font-bold text-[#003366] mb-4">📝 Description</h2>
                        <p className="text-gray-700 leading-relaxed">{complaint.description}</p>

                        {complaint.ai_explanation && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <span className="text-sm text-blue-600 font-medium">🤖 AI Analysis</span>
                                <p className="text-sm text-blue-800 mt-1">{complaint.ai_explanation}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Image Evidence */}
                {complaint.image_data && (
                    <div className="gov-card mb-6">
                        <h2 className="text-lg font-bold text-[#003366] mb-4">📸 Attached Evidence</h2>
                        <img
                            src={complaint.image_data}
                            alt="Complaint evidence"
                            className="max-w-full h-auto rounded-lg border max-h-96 object-contain"
                        />
                    </div>
                )}

                {/* Audio Evidence */}
                {/* Audio Evidence */}
                <div className="gov-card mb-6">
                    <h2 className="text-lg font-bold text-[#003366] mb-4">🎤 Voice Note</h2>
                    {complaint.audio_path ? (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            {complaint.audio_language && (
                                <p className="text-sm font-bold text-[#003366] mb-2">
                                    Voice Language: <span className="text-gray-700 font-normal">{complaint.audio_language}</span>
                                </p>
                            )}
                            <audio controls className="w-full">
                                <source src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/uploads/${complaint.audio_path}`} />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic text-sm">No voice note attached</p>
                    )}
                </div>

                {/* Location Map */}
                {(complaint.lat || (complaint as any).lat) && (
                    <div className="gov-card mb-6">
                        <h2 className="text-lg font-bold text-[#003366] mb-4">📍 Exact Location</h2>
                        <div className="h-[300px] rounded-lg overflow-hidden border border-gray-200">
                            <LocationMap
                                initialLat={(complaint.lat || (complaint as any).lat) as number}
                                initialLng={(complaint.lng || (complaint as any).lng) as number}
                                onLocationSelect={() => { }} // Read-only
                            />
                        </div>
                    </div>
                )}

                {/* Timeline */}
                <div className="gov-card mb-6">
                    <h2 className="text-lg font-bold text-[#003366] mb-4">📅 Timeline</h2>
                    {complaint.timeline && complaint.timeline.length > 0 ? (
                        <div className="space-y-4">
                            {complaint.timeline.map((entry, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-4 h-4 rounded-full ${index === 0 ? 'bg-[#800020]' : 'bg-gray-300'
                                            }`} />
                                        {index < complaint.timeline.length - 1 && (
                                            <div className="w-0.5 h-full bg-gray-200 mt-1" />
                                        )}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <div className="flex justify-between items-start">
                                            <span className={`text-sm font-medium capitalize ${index === 0 ? 'text-[#800020]' : 'text-gray-600'
                                                }`}>
                                                {entry.status.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {formatDate(entry.timestamp)}
                                            </span>
                                        </div>
                                        {entry.remarks && (
                                            <p className="text-sm text-gray-500 mt-1 italic">
                                                &quot;{entry.remarks}&quot;
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">No timeline entries yet</p>
                    )}
                </div>

                {/* Contact Info */}
                <div className="gov-card">
                    <h2 className="text-lg font-bold text-[#003366] mb-4">📞 Need Help?</h2>
                    <p className="text-gray-600 mb-2">
                        If you have questions about this complaint, contact our helpdesk:
                    </p>
                    <p className="font-bold text-[#800020]">1800-XXX-XXXX (Toll Free)</p>
                </div>
            </div>
        </div>
    );
}
