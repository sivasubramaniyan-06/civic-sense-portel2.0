'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { submitGrievance, checkDuplicate, classifyGrievance, uploadMedia } from '@/lib/api';
import type { ClassificationResult, DuplicateCheckResponse, GrievanceResponse } from '@/lib/api';

const LocationMap = dynamic(() => import('@/components/LocationMap'), { ssr: false });

const CATEGORIES = [
    { value: 'road', label: '🛣️ Road-related', description: 'Potholes, street lights, traffic signals, road damage' },
    { value: 'water', label: '💧 Water-related', description: 'Water supply, leakage, sewage, drainage' },
    { value: 'electricity', label: '⚡ Electricity', description: 'Power outage, faulty wires, transformer issues' },
    { value: 'sanitation', label: '🗑️ Sanitation', description: 'Garbage collection, cleanliness, public toilets' },
    { value: 'health_safety', label: '🏥 Health & Safety', description: 'Hospital issues, safety hazards, emergencies' },
    { value: 'others', label: '📋 Others', description: 'Other public service issues' },
];

const LOCATIONS = [
    'Central District',
    'North District',
    'South District',
    'East District',
    'West District',
    'Rural Area 1',
    'Rural Area 2',
];

export default function LodgeGrievance() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form data
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [imageBase64, setImageBase64] = useState('');
    const [imageName, setImageName] = useState('');

    // Media & Location
    const [audioBase64, setAudioBase64] = useState('');
    const [audioPath, setAudioPath] = useState('');
    const [audioMeta, setAudioMeta] = useState<any>(null);
    const [audioName, setAudioName] = useState('');
    const [audioLanguage, setAudioLanguage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [lat, setLat] = useState<number | undefined>(undefined);
    const [lng, setLng] = useState<number | undefined>(undefined);

    const [submitterName, setSubmitterName] = useState('');
    const [submitterPhone, setSubmitterPhone] = useState('');
    const [submitterEmail, setSubmitterEmail] = useState('');

    // AI Results
    const [classification, setClassification] = useState<ClassificationResult | null>(null);
    const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckResponse | null>(null);
    const [submitResult, setSubmitResult] = useState<GrievanceResponse | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageBase64(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('Audio file size must be less than 10MB');
                return;
            }
            // Validate file type
            const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/x-m4a', 'audio/webm'];
            if (!validTypes.includes(file.type)) {
                setError('Please upload MP3, WAV, or M4A audio file');
                return;
            }

            setAudioName(file.name);
            setLoading(true);
            try {
                // Get duration
                const getDuration = (f: File): Promise<number> => new Promise(resolve => {
                    const audio = new Audio();
                    audio.preload = 'metadata';
                    audio.onloadedmetadata = () => {
                        URL.revokeObjectURL(audio.src);
                        resolve(audio.duration);
                    };
                    audio.src = URL.createObjectURL(f);
                });

                const duration = await getDuration(file);
                const result = await uploadMedia(file);

                if (result.success) {
                    setAudioPath(result.path);
                    setAudioMeta({ ...result.metadata, duration });
                }
            } catch (err) {
                console.error(err);
                setError('Failed to upload audio file');
            }
            setLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const file = new File([blob], "voice_recording.webm", { type: "audio/webm" });

                setAudioName('voice_recording.webm');
                setLoading(true);
                try {
                    // Get duration
                    const getDuration = (f: File): Promise<number> => new Promise(resolve => {
                        const audio = new Audio();
                        audio.preload = 'metadata';
                        audio.onloadedmetadata = () => {
                            URL.revokeObjectURL(audio.src);
                            resolve(audio.duration);
                        };
                        audio.src = URL.createObjectURL(f);
                    });

                    const duration = await getDuration(file);
                    const result = await uploadMedia(file);

                    if (result.success) {
                        setAudioPath(result.path);
                        setAudioMeta({ ...result.metadata, duration });
                    }
                } catch (err) {
                    console.error(err);
                    setError('Failed to upload recording');
                }
                setLoading(false);

                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch {
            setError('Unable to access microphone. Please allow microphone access or upload a file.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
            setMediaRecorder(null);
        }
    };

    const handleLocationSelect = (selectedLat: number, selectedLng: number) => {
        setLat(selectedLat);
        setLng(selectedLng);
    };

    const removeAudio = () => {
        setAudioBase64('');
        setAudioPath('');
        setAudioMeta(null);
        setAudioName('');
        setAudioLanguage('');
    };

    const handleStep2Submit = async () => {
        if (description.length < 20) {
            setError('Please provide at least 20 characters in your description.');
            return;
        }
        if (!location) {
            setError('Please select a location.');
            return;
        }
        if (audioName && !audioLanguage) {
            setError('Please select the language of your voice note.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            // Run AI classification
            const classResult = await classifyGrievance(description, category);
            setClassification(classResult);

            // Check for duplicates
            const dupResult = await checkDuplicate(description, category);
            setDuplicateCheck(dupResult);

            setStep(3);
        } catch (err) {
            setError('Failed to analyze grievance. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFinalSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await submitGrievance({
                category,
                description,
                location,
                image_base64: imageBase64 || undefined,
                audio_base64: audioBase64 || undefined,
                audio_path: audioPath || undefined,
                audio_meta: audioMeta || undefined,
                audio_language: audioLanguage || undefined,
                lat: lat || undefined,
                lng: lng || undefined,
                submitter_name: submitterName || undefined,
                submitter_phone: submitterPhone || undefined,
                submitter_email: submitterEmail || undefined,
            });

            setSubmitResult(result);
            setStep(4);
        } catch (err) {
            setError('Failed to submit grievance. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content">
            <div className="w-full max-w-3xl mx-auto px-4">
                <h1 className="text-2xl font-bold text-center text-[#003366] mb-2">
                    Lodge Your Grievance
                </h1>
                <p className="text-center text-gray-600 mb-8">
                    Submit your public grievance in 3 simple steps
                </p>

                {/* Stepper */}
                <div className="stepper mb-8">
                    <div className={`step ${step >= 1 ? (step > 1 ? 'completed' : 'active') : ''}`}>
                        <span className="step-number">{step > 1 ? '✓' : '1'}</span>
                        <span className="step-label">Select Category</span>
                    </div>
                    <div className={`step ${step >= 2 ? (step > 2 ? 'completed' : 'active') : ''}`}>
                        <span className="step-number">{step > 2 ? '✓' : '2'}</span>
                        <span className="step-label">Describe Issue</span>
                    </div>
                    <div className={`step ${step >= 3 ? (step > 3 ? 'completed' : 'active') : ''}`}>
                        <span className="step-number">{step > 3 ? '✓' : '3'}</span>
                        <span className="step-label">Review & Submit</span>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="alert alert-error mb-4">
                        {error}
                    </div>
                )}

                {/* Step 1: Category Selection */}
                {step === 1 && (
                    <div className="gov-card">
                        <div className="gov-card-header">
                            <h2 className="text-lg font-bold">Step 1: What type of grievance is this?</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => {
                                        setCategory(cat.value);
                                        setStep(2);
                                    }}
                                    className={`p-4 border-2 rounded-lg text-left transition hover:border-[#800020] hover:bg-red-50 ${category === cat.value ? 'border-[#800020] bg-red-50' : 'border-gray-200'
                                        }`}
                                >
                                    <div className="font-bold text-lg">{cat.label}</div>
                                    <div className="text-sm text-gray-600">{cat.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Description & Details */}
                {step === 2 && (
                    <div className="gov-card">
                        <div className="gov-card-header">
                            <h2 className="text-lg font-bold">Step 2: Describe Your Grievance</h2>
                            <p className="text-sm text-gray-600">Category: {CATEGORIES.find(c => c.value === category)?.label}</p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Grievance Description *</label>
                            <textarea
                                className="form-textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Please describe your grievance in detail. Include relevant information like dates, specific locations, and any other details that will help us address your issue..."
                                rows={5}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                {description.length}/2000 characters (minimum 20)
                            </p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Location *</label>
                            <select
                                className="form-select"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            >
                                <option value="">Select Location</option>
                                {LOCATIONS.map((loc) => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group mb-6">
                            <label className="form-label">Pin Exact Location (Optional)</label>
                            <div className="h-[300px] mb-2">
                                <LocationMap
                                    onLocationSelect={handleLocationSelect}
                                    initialLat={lat || 28.6139}
                                    initialLng={lng || 77.2090}
                                />
                            </div>
                            {lat && lng && (
                                <p className="text-sm text-green-600">✓ Location pinned: {lat.toFixed(6)}, {lng.toFixed(6)}</p>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Upload Photo Proof (Optional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="form-input"
                            />
                            {imageName && (
                                <div className="mt-2">
                                    <p className="text-sm text-green-600">✓ {imageName} uploaded</p>
                                    {imageBase64 && (
                                        <img
                                            src={imageBase64}
                                            alt="Preview"
                                            className="mt-2 max-h-32 rounded border"
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="form-group mb-6">
                            <label className="form-label">Add Voice Note (Optional)</label>

                            {!isRecording && !audioName ? (
                                <div className="flex gap-4 items-center flex-wrap">
                                    <button
                                        onClick={startRecording}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                    >
                                        🎤 Start Recording
                                    </button>
                                    <span className="text-gray-400">or</span>
                                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                        📁 Upload Audio
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="audio/*"
                                            onChange={handleAudioUpload}
                                        />
                                    </label>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    {isRecording ? (
                                        <>
                                            <div className="animate-pulse text-red-600 font-bold flex items-center gap-2">
                                                🔴 Recording...
                                            </div>
                                            <button
                                                onClick={stopRecording}
                                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                            >
                                                Stop
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2 text-green-700">
                                                🎵 {audioName}
                                            </div>
                                            <button
                                                onClick={removeAudio}
                                                className="text-red-500 text-sm hover:underline"
                                            >
                                                Remove
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Language Selection */}
                            {audioName && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <label className="block text-sm font-bold text-[#003366] mb-2">
                                        Select Voice Note Language *
                                    </label>
                                    <select
                                        className="form-select w-full"
                                        value={audioLanguage}
                                        onChange={(e) => setAudioLanguage(e.target.value)}
                                    >
                                        <option value="">-- Select Language --</option>
                                        <option value="Tamil">Tamil</option>
                                        <option value="English">English</option>
                                        <option value="Hindi">Hindi</option>
                                        <option value="Telugu">Telugu</option>
                                        <option value="Malayalam">Malayalam</option>
                                        <option value="Kannada">Kannada</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            )}

                            <p className="text-xs text-gray-500 mt-1">Supported formats: MP3, WAV, M4A</p>
                        </div>

                        <hr className="my-6" />

                        <h3 className="font-bold mb-4">Contact Information (Optional)</h3>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={submitterName}
                                    onChange={(e) => setSubmitterName(e.target.value)}
                                    placeholder="Your name"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={submitterPhone}
                                    onChange={(e) => setSubmitterPhone(e.target.value)}
                                    placeholder="Contact number"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={submitterEmail}
                                    onChange={(e) => setSubmitterEmail(e.target.value)}
                                    placeholder="Email address"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between mt-6">
                            <button
                                onClick={() => setStep(1)}
                                className="btn-outline"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleStep2Submit}
                                disabled={loading}
                                className="btn-primary"
                            >
                                {loading ? 'Analyzing...' : 'Analyze & Continue →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review & Confirm */}
                {step === 3 && (
                    <div className="gov-card">
                        <div className="gov-card-header">
                            <h2 className="text-lg font-bold">Step 3: Review & Confirm</h2>
                        </div>

                        {/* Duplicate Warning */}
                        {duplicateCheck?.is_duplicate && (
                            <div className="alert alert-warning mb-6">
                                <strong>⚠️ Potential Duplicate Detected</strong>
                                <p>{duplicateCheck.message}</p>
                                <a
                                    href={`/track-status?id=${duplicateCheck.similar_complaint_id}`}
                                    className="text-blue-600 underline"
                                >
                                    Track existing complaint →
                                </a>
                            </div>
                        )}

                        {/* AI Classification */}
                        {classification && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <h3 className="font-bold text-[#003366] mb-3">🤖 AI Analysis Result</h3>
                                <div className="grid md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <span className="text-sm text-gray-600">Department:</span>
                                        <p className="font-bold">{classification.department}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-600">Priority:</span>
                                        <p>
                                            <span className={`priority-badge priority-${classification.priority}`}>
                                                {classification.priority.toUpperCase()}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-600">Keywords Found:</span>
                                        <p className="text-sm">{classification.keywords_found.join(', ') || 'None'}</p>
                                    </div>
                                </div>
                                <div className="text-sm bg-white p-3 rounded border">
                                    <strong>Explanation:</strong> {classification.explanation}
                                </div>
                            </div>
                        )}

                        {/* Summary */}
                        <div className="space-y-4">
                            <div>
                                <span className="text-sm text-gray-600">Category:</span>
                                <p className="font-bold">{CATEGORIES.find(c => c.value === category)?.label}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Location:</span>
                                <p className="font-bold">{location}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Description:</span>
                                <p className="bg-gray-50 p-3 rounded border mt-1">{description}</p>
                            </div>
                            {imageName && (
                                <div>
                                    <span className="text-sm text-gray-600">Attached Image:</span>
                                    <p className="font-bold">📎 {imageName}</p>
                                    {imageBase64 && (
                                        <img
                                            src={imageBase64}
                                            alt="Evidence preview"
                                            className="mt-2 max-h-40 rounded border"
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between mt-6">
                            <button
                                onClick={() => setStep(2)}
                                className="btn-outline"
                            >
                                ← Edit Details
                            </button>
                            <button
                                onClick={handleFinalSubmit}
                                disabled={loading}
                                className="btn-primary"
                            >
                                {loading ? 'Submitting...' : 'Submit Grievance ✓'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Success */}
                {step === 4 && submitResult && (
                    <div className="gov-card text-center">
                        <div className="text-6xl mb-4">✅</div>
                        <h2 className="text-2xl font-bold text-green-600 mb-4">
                            Grievance Submitted Successfully!
                        </h2>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                            <p className="text-sm text-gray-600 mb-2">Your Complaint ID</p>
                            <p className="text-3xl font-bold text-[#800020]">{submitResult.complaint_id}</p>
                            <p className="text-sm text-gray-600 mt-2">Please save this ID to track your grievance</p>
                        </div>

                        <p className="text-gray-600 mb-6">{submitResult.message}</p>

                        <div className="flex justify-center gap-4">
                            <a
                                href={`/track-status?id=${submitResult.complaint_id}`}
                                className="btn-primary"
                            >
                                Track Status
                            </a>
                            <a href="/lodge-grievance" className="btn-outline">
                                Submit Another
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
