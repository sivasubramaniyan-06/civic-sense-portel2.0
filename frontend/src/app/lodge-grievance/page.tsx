'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { submitGrievance, classifyGrievance, checkDuplicate, uploadMedia } from '@/lib/api';

const LocationMap = dynamic(() => import('@/components/LocationMap'), { ssr: false });

export default function LodgeGrievance() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [lat, setLat] = useState<number | undefined>(undefined);
    const [lng, setLng] = useState<number | undefined>(undefined);
    const [imageBase64, setImageBase64] = useState('');
    const [audioBase64, setAudioBase64] = useState('');
    const [audioPath, setAudioPath] = useState('');
    const [audioMeta, setAudioMeta] = useState<any>(null);
    const [audioName, setAudioName] = useState('');
    const [audioLanguage, setAudioLanguage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitterName, setSubmitterName] = useState('');
    const [submitterPhone, setSubmitterPhone] = useState('');

    // Guided Questions State (Client-side usage to append to description)
    const [safetyHazard, setSafetyHazard] = useState(false);
    const [blockedAccess, setBlockedAccess] = useState(false);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => setAudioBase64(reader.result as string);
                setAudioName('Recorded_Voice_Note.webm');

                // Duration extraction
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                try {
                    const arrayBuffer = await blob.arrayBuffer();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer); // get duration
                    await audioContext.close();

                    const file = new File([blob], "recording.webm", { type: "audio/webm" });
                    const result = await uploadMedia(file);
                    if (result.success) {
                        setAudioPath(result.path);
                        setAudioMeta({ ...result.metadata, duration: audioBuffer.duration });
                    }
                } catch (e) { console.error(e); }
            };
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            setError('Microphone access denied');
        }
    };

    const stopRecording = () => {
        mediaRecorder?.stop();
        setIsRecording(false);
    };

    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAudioName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => setAudioBase64(reader.result as string);
            reader.readAsDataURL(file);

            // Get duration
            const audio = new Audio(URL.createObjectURL(file));
            audio.onloadedmetadata = async () => {
                const result = await uploadMedia(file);
                if (result.success) {
                    setAudioPath(result.path);
                    setAudioMeta({ ...result.metadata, duration: audio.duration });
                }
            };
        }
    };

    const removeAudio = () => {
        setAudioBase64('');
        setAudioPath('');
        setAudioMeta(null);
        setAudioName('');
        setAudioLanguage('');
    };

    const handleStep1Submit = () => {
        if (description.length < 20) {
            setError('Please describe the issue in at least 20 characters.');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleStep2Submit = () => {
        if (!location) {
            setError('Please enter a location or select on map.');
            return;
        }
        if (audioName && !audioLanguage) {
            setError('Please select the language for your voice note.');
            return;
        }
        setError('');
        setStep(3);
    };

    const handleFinalSubmit = async () => {
        setError('');
        setLoading(true);

        // Append guided questions to description
        let finalDesc = description;
        if (safetyHazard) finalDesc += " [Safety Hazard Flagged]";
        if (blockedAccess) finalDesc += " [Blocking Access Flagged]";

        try {
            await submitGrievance({
                category: "Other", // Will be auto-classified
                description: finalDesc,
                location,
                image_base64: imageBase64 || undefined,
                audio_base64: audioBase64 || undefined,
                audio_path: audioPath || undefined,
                audio_meta: audioMeta || undefined,
                audio_language: audioLanguage || undefined,
                lat: lat,
                lng: lng,
                submitter_name: submitterName || "Anonymous",
                submitter_phone: submitterPhone
            });
            router.push('/track-status'); // Dashboard for user? Or success page?
            // User flow: Success -> Track Status (usually)
        } catch (err) {
            setError('Submission failed. Please try again.');
        }
        setLoading(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImageBase64(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 font-sans text-gray-800">
            <div className="max-w-2xl mx-auto px-6">
                <header className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-[#003366] mb-2">Lodge Public Grievance</h1>
                    <p className="text-gray-600">Step-by-step submission process</p>
                </header>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Progress Bar */}
                    <div className="bg-gray-100 flex h-2">
                        <div className={`flex-1 transition-colors ${step >= 1 ? 'bg-[#003366]' : 'bg-gray-200'}`}></div>
                        <div className={`flex-1 transition-colors ${step >= 2 ? 'bg-[#003366]' : 'bg-gray-200'}`}></div>
                        <div className={`flex-1 transition-colors ${step >= 3 ? 'bg-[#003366]' : 'bg-gray-200'}`}></div>
                    </div>

                    <div className="p-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded text-sm font-medium">
                                {error}
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Step 1: Issue Details</h2>

                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-gray-700">Describe the Issue <span className="text-red-500">*</span></label>
                                    <textarea
                                        className="w-full p-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[150px]"
                                        placeholder="Please provide details about the grievance..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    ></textarea>
                                    <p className="text-xs text-gray-500 text-right">{description.length} / 2000 characters</p>
                                </div>

                                <div className="space-y-3 bg-gray-50 p-4 rounded border border-gray-100">
                                    <p className="text-sm font-bold text-gray-700 mb-2">Does this issue involve: (Optional)</p>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={safetyHazard} onChange={e => setSafetyHazard(e.target.checked)} className="rounded text-[#003366] focus:ring-[#003366]" />
                                        <span className="text-sm">Public Safety Hazard</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={blockedAccess} onChange={e => setBlockedAccess(e.target.checked)} className="rounded text-[#003366] focus:ring-[#003366]" />
                                        <span className="text-sm">Blocking Public Access</span>
                                    </label>
                                </div>

                                <button onClick={handleStep1Submit} className="w-full bg-[#003366] text-white py-3 rounded font-bold hover:bg-blue-900 transition-colors">
                                    Next: Location Details &rarr;
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Step 2: Location & Evidence</h2>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Location Address <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Main Street, Sector 4..."
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                    />
                                </div>

                                {/* Full Width Map */}
                                <div className="rounded border border-gray-300 overflow-hidden h-64 w-full">
                                    <LocationMap
                                        initialLat={20.5937}
                                        initialLng={78.9629}
                                        onLocationSelect={(lat, lng) => {
                                            setLat(lat);
                                            setLng(lng);
                                            setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">Tap on map to pin exact location.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    {/* Image Upload */}
                                    <div className="border-t border-gray-200 pt-4">
                                        <label className="block text-sm font-bold text-gray-700 mb-3">Upload Photo (Optional)</label>
                                        <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                                            <span className="text-2xl mb-1">📷</span>
                                            <span className="text-sm text-gray-600 truncate max-w-[200px]">{imageBase64 ? 'Photo Selected' : 'Tap to Upload'}</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                    </div>

                                    {/* Voice Note */}
                                    <div className="border-t border-gray-200 pt-4">
                                        <label className="block text-sm font-bold text-gray-700 mb-3">Voice Note (Optional)</label>

                                        {!audioName ? (
                                            <div className="space-y-3">
                                                {/* Language Select First */}
                                                <select className="w-full p-2 border border-gray-300 rounded text-sm" value={audioLanguage} onChange={e => setAudioLanguage(e.target.value)}>
                                                    <option value="">Select Language (Required for Voice)</option>
                                                    <option value="English">English</option>
                                                    <option value="Tamil">Tamil</option>
                                                    <option value="Hindi">Hindi</option>
                                                    <option value="Telugu">Telugu</option>
                                                    <option value="Malayalam">Malayalam</option>
                                                    <option value="Kannada">Kannada</option>
                                                    <option value="Other">Other</option>
                                                </select>

                                                <div className="flex gap-2">
                                                    <button onClick={startRecording} className="flex-1 bg-red-100 text-red-700 py-2 rounded font-bold hover:bg-red-200 transition-colors text-sm flex items-center justify-center gap-1">
                                                        <span>🎤</span> Record
                                                    </button>
                                                    <label className="flex-1 cursor-pointer bg-gray-100 text-gray-700 py-2 rounded font-bold hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-1">
                                                        <span>📁</span> Upload
                                                        <input type="file" className="hidden" accept="audio/*" onChange={handleAudioUpload} />
                                                    </label>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-green-50 p-3 rounded border border-green-200 relative">
                                                <div className="text-xs font-bold text-green-800 uppercase mb-1">Attached</div>
                                                <div className="text-sm font-medium text-green-700 truncate mb-1">{audioName}</div>
                                                <div className="text-xs text-green-600 mb-2">Language: <strong>{audioLanguage || 'Not Selected'}</strong></div>
                                                <button onClick={removeAudio} className="text-xs text-red-600 underline font-bold">Remove</button>
                                            </div>
                                        )}
                                        {isRecording && (
                                            <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs font-bold animate-pulse text-center rounded border border-red-200">
                                                Recording... <button onClick={stopRecording} className="ml-2 underline">Stop</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setStep(1)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded font-bold hover:bg-gray-300 transition-colors">
                                        Back
                                    </button>
                                    <button onClick={handleStep2Submit} className="flex-1 bg-[#003366] text-white py-3 rounded font-bold hover:bg-blue-900 transition-colors">
                                        Next: Contact Info &rarr;
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Step 3: Contact Information</h2>
                                <p className="text-sm text-gray-500 mb-4">Optional: Provide details to receive status updates.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Your Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                            placeholder="John Doe"
                                            value={submitterName}
                                            onChange={e => setSubmitterName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                            placeholder="+91 XXXXX XXXXX"
                                            value={submitterPhone}
                                            onChange={e => setSubmitterPhone(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="bg-yellow-50 p-4 rounded border-l-4 border-yellow-400 mt-4 text-sm text-yellow-800">
                                    <strong>Privacy Note:</strong> Your contact details are kept confidential and used only for official communication regarding this grievance.
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setStep(2)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded font-bold hover:bg-gray-300 transition-colors">
                                        Back
                                    </button>
                                    <button onClick={handleFinalSubmit} disabled={loading} className="flex-1 bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 transition-colors disabled:opacity-50">
                                        {loading ? 'Submitting...' : 'Submit Grievance'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
