'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getGrievance } from '@/lib/api';
import type { Grievance } from '@/lib/api';

export default function TrackStatus() {
    const searchParams = useSearchParams();
    const [complaintId, setComplaintId] = useState(searchParams.get('id') || '');
    const [grievance, setGrievance] = useState<Grievance | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            setComplaintId(id);
            handleSearch(id);
        }
    }, [searchParams]);

    const handleSearch = async (id?: string) => {
        const searchId = id || complaintId;
        if (!searchId.trim()) {
            setError('Please enter a Complaint ID');
            return;
        }

        setLoading(true);
        setError('');
        setSearched(true);

        try {
            const result = await getGrievance(searchId.trim());
            setGrievance(result);
        } catch (err: unknown) {
            setGrievance(null);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Grievance not found. Please check the Complaint ID.');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    const statusSteps = ['submitted', 'assigned', 'in_progress', 'resolved'];
    const currentStepIndex = grievance ? statusSteps.indexOf(grievance.status) : -1;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            {/* Header offset */}
            <div className="h-32 w-full"></div>

            <div className="w-full max-w-[1200px] mx-auto px-6 md:px-8 pb-16">
                <header className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-[#003366] mb-3">
                        Track Your Grievance
                    </h1>
                    <p className="text-lg text-gray-600">
                        Enter your Complaint ID to check the status of your grievance
                    </p>
                </header>

                {/* Search Box */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            className="form-input flex-1"
                            value={complaintId}
                            onChange={(e) => setComplaintId(e.target.value.toUpperCase())}
                            placeholder="Enter Complaint ID (e.g., CSP-20260103-ABC123)"
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            onClick={() => handleSearch()}
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? 'Searching...' : 'Track'}
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && searched && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                {/* Results */}
                {grievance && (
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="gov-card">
                            <div className="gov-card-header flex justify-between items-center">
                                <h2 className="text-lg font-bold">Complaint: {grievance.id}</h2>
                                <span className={`status-badge status-${grievance.status}`}>
                                    {grievance.status.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between mb-2">
                                    {statusSteps.map((s, idx) => (
                                        <div
                                            key={s}
                                            className={`text-center flex-1 ${idx <= currentStepIndex ? 'text-[#800020]' : 'text-gray-400'}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${idx <= currentStepIndex ? 'bg-[#800020] text-white' : 'bg-gray-200'
                                                }`}>
                                                {idx < currentStepIndex ? '✓' : idx + 1}
                                            </div>
                                            <span className="text-xs mt-1 block capitalize">{s.replace('_', ' ')}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#800020] transition-all"
                                        style={{ width: `${((currentStepIndex + 1) / statusSteps.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-gray-600">Category</span>
                                    <p className="font-bold capitalize">{grievance.category.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Priority</span>
                                    <p>
                                        <span className={`priority-badge priority-${grievance.priority}`}>
                                            {grievance.priority.toUpperCase()}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Department</span>
                                    <p className="font-bold">{grievance.department}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Location</span>
                                    <p className="font-bold">{grievance.location}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Submitted On</span>
                                    <p className="font-bold">{formatDate(grievance.created_at)}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Last Updated</span>
                                    <p className="font-bold">{formatDate(grievance.updated_at)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="gov-card">
                            <h3 className="font-bold mb-2">Grievance Description</h3>
                            <p className="bg-gray-50 p-4 rounded border">{grievance.description}</p>
                        </div>

                        {/* AI Analysis */}
                        <div className="gov-card">
                            <h3 className="font-bold mb-2">🤖 AI Analysis</h3>
                            <p className="text-sm text-gray-600">{grievance.ai_explanation}</p>
                            {grievance.keywords_found.length > 0 && (
                                <div className="mt-2">
                                    <span className="text-sm text-gray-600">Keywords detected: </span>
                                    {grievance.keywords_found.map((kw, idx) => (
                                        <span key={idx} className="inline-block bg-gray-100 px-2 py-1 rounded text-sm mr-1 mt-1">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Attached Image */}
                        {grievance.image_data && (
                            <div className="gov-card">
                                <h3 className="font-bold mb-2">📷 Attached Evidence</h3>
                                <img
                                    src={grievance.image_data}
                                    alt="Grievance evidence"
                                    className="max-h-64 rounded border"
                                />
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="gov-card">
                            <h3 className="font-bold mb-4">📅 Timeline</h3>
                            <div className="timeline">
                                {grievance.timeline.map((entry, idx) => (
                                    <div key={idx} className={`timeline-item ${idx < grievance.timeline.length - 1 ? '' : 'completed'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className={`status-badge status-${entry.status}`}>
                                                    {entry.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                                {entry.remarks && (
                                                    <p className="text-sm text-gray-600 mt-1">{entry.remarks}</p>
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-500">{formatDate(entry.timestamp)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Duplicate Warning */}
                        {grievance.is_duplicate && grievance.similar_to && (
                            <div className="alert alert-warning">
                                ⚠️ This grievance was flagged as potentially similar to complaint {grievance.similar_to}
                            </div>
                        )}
                    </div>
                )}

                {/* No Search Yet */}
                {!searched && (
                    <div className="text-center text-gray-500">
                        <div className="text-6xl mb-4">🔍</div>
                        <p>Enter your Complaint ID above to track your grievance status</p>
                    </div>
                )}
            </div>
        </div>
    );
}
