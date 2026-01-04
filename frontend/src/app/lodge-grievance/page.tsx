'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { submitGrievance, uploadMedia, getStoredUser, getStoredToken } from '@/lib/api';
import type { AuthUser, GrievanceResponse } from '@/lib/api';

const LocationMap = dynamic(() => import('@/components/LocationMap'), { ssr: false });

// Categories and their sub-categories
const CATEGORIES = {
    water: {
        label: 'Water Supply',
        icon: '💧',
        subCategories: ['No Water Supply', 'Contaminated Water', 'Low Pressure', 'Pipeline Leakage', 'Billing Issue', 'Other']
    },
    electricity: {
        label: 'Electricity',
        icon: '⚡',
        subCategories: ['Power Outage', 'Voltage Fluctuation', 'Street Light Issue', 'Meter Problem', 'Billing Dispute', 'Other']
    },
    road: {
        label: 'Roads & Transport',
        icon: '🛣️',
        subCategories: ['Pothole', 'Road Damage', 'Traffic Signal', 'Footpath Issue', 'Drainage Problem', 'Other']
    },
    sanitation: {
        label: 'Sanitation',
        icon: '🗑️',
        subCategories: ['Garbage Collection', 'Open Drain', 'Public Toilet', 'Sewage Overflow', 'Pest Control', 'Other']
    },
    health_safety: {
        label: 'Health & Safety',
        icon: '🏥',
        subCategories: ['Hospital Service', 'Ambulance Delay', 'Medical Store', 'Public Hygiene', 'Food Safety', 'Other']
    },
    others: {
        label: 'Others',
        icon: '📋',
        subCategories: ['Government Office', 'Public Property', 'Environment', 'Noise Pollution', 'Encroachment', 'Other']
    }
};

const DEPARTMENTS = [
    'Municipal Corporation',
    'Public Works Department (PWD)',
    'Water Supply Board',
    'Electricity Board',
    'Health Department',
    'Transport Department',
    'Sanitation Department',
    'Revenue Department',
    'Police Department',
    'Other'
];

const STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
    'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
    'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function LodgeGrievance() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [user, setUser] = useState<AuthUser | null>(null);

    // Step 1: Personal Details
    const [submitterName, setSubmitterName] = useState('');
    const [submitterEmail, setSubmitterEmail] = useState('');
    const [submitterPhone, setSubmitterPhone] = useState('');

    // Step 2: Grievance Classification
    const [category, setCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [department, setDepartment] = useState('');
    const [state, setState] = useState('');
    const [district, setDistrict] = useState('');
    const [city, setCity] = useState('');
    const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');

    // Step 3: Grievance Details
    const [problemTitle, setProblemTitle] = useState('');
    const [description, setDescription] = useState('');
    const [issueStartDate, setIssueStartDate] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [location, setLocation] = useState('');
    const [lat, setLat] = useState<number | undefined>(undefined);
    const [lng, setLng] = useState<number | undefined>(undefined);

    // Step 4: Evidence
    const [imageBase64, setImageBase64] = useState('');
    const [imageName, setImageName] = useState('');
    const [audioBase64, setAudioBase64] = useState('');
    const [audioPath, setAudioPath] = useState('');
    const [audioMeta, setAudioMeta] = useState<any>(null);
    const [audioName, setAudioName] = useState('');
    const [audioLanguage, setAudioLanguage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

    // Step 5: Declaration & Submit
    const [declaration, setDeclaration] = useState(false);

    // Form State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Success State
    const [submitted, setSubmitted] = useState(false);
    const [submissionResponse, setSubmissionResponse] = useState<GrievanceResponse | null>(null);

    useEffect(() => {
        // Auto-fill user details if logged in
        const storedUser = getStoredUser();
        const token = getStoredToken();
        if (token && storedUser) {
            setUser(storedUser);
            setSubmitterName(storedUser.name);
            setSubmitterEmail(storedUser.email);
        }
    }, []);

    // Validation functions
    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};
        if (!submitterName.trim()) newErrors.submitterName = 'Name is required';
        if (!submitterPhone.trim()) newErrors.submitterPhone = 'Phone number is required';
        else if (!/^[6-9]\d{9}$/.test(submitterPhone.replace(/\s/g, ''))) {
            newErrors.submitterPhone = 'Enter valid 10-digit mobile number';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors: Record<string, string> = {};
        if (!category) newErrors.category = 'Please select a category';
        if (!subCategory) newErrors.subCategory = 'Please select a sub-category';
        if (!department) newErrors.department = 'Please select a department';
        if (!state) newErrors.state = 'Please select a state';
        if (!city.trim()) newErrors.city = 'City is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = () => {
        const newErrors: Record<string, string> = {};
        if (!problemTitle.trim()) newErrors.problemTitle = 'Problem title is required';
        else if (problemTitle.length < 10) newErrors.problemTitle = 'Title must be at least 10 characters';
        if (!description.trim()) newErrors.description = 'Description is required';
        else if (description.length < 100) newErrors.description = 'Description must be at least 100 characters';
        if (!location.trim()) newErrors.location = 'Location address is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep5 = () => {
        const newErrors: Record<string, string> = {};
        if (!declaration) newErrors.declaration = 'Please confirm the declaration';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        setError('');
        let valid = false;
        switch (step) {
            case 1: valid = validateStep1(); break;
            case 2: valid = validateStep2(); break;
            case 3: valid = validateStep3(); break;
            case 4: valid = true; break; // Evidence is optional
            default: valid = true;
        }
        if (valid) setStep(step + 1);
    };

    const handlePrevStep = () => {
        setError('');
        setErrors({});
        setStep(step - 1);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return;
            }
            setImageName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => setImageBase64(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

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
                try {
                    const file = new File([blob], "recording.webm", { type: "audio/webm" });
                    const result = await uploadMedia(file);
                    if (result.success) {
                        setAudioPath(result.path);
                        setAudioMeta(result.metadata);
                    }
                } catch (e) { console.error(e); }
            };
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch {
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
            try {
                const result = await uploadMedia(file);
                if (result.success) {
                    setAudioPath(result.path);
                    setAudioMeta(result.metadata);
                }
            } catch (e) { console.error(e); }
        }
    };

    const removeAudio = () => {
        setAudioBase64('');
        setAudioPath('');
        setAudioMeta(null);
        setAudioName('');
        setAudioLanguage('');
    };

    const removeImage = () => {
        setImageBase64('');
        setImageName('');
    };

    const handleFinalSubmit = async () => {
        if (!validateStep5()) return;

        setError('');
        setLoading(true);

        // Build full description with all details
        const fullLocation = `${city}, ${district ? district + ', ' : ''}${state}`;
        const fullDescription = `
[Title: ${problemTitle}]
${description}

[Additional Info]
- Category: ${CATEGORIES[category as keyof typeof CATEGORIES]?.label || category}
- Sub-category: ${subCategory}
- Location: ${fullLocation}
- Address: ${location}
- Issue Start Date: ${issueStartDate || 'Not specified'}
- Recurring Issue: ${isRecurring ? 'Yes' : 'No'}
- Urgency: ${urgency.toUpperCase()}
        `.trim();

        try {
            const response = await submitGrievance({
                category: category || 'others',
                description: fullDescription,
                location: location || fullLocation,
                image_base64: imageBase64 || undefined,
                audio_base64: audioBase64 || undefined,
                audio_path: audioPath || undefined,
                audio_meta: audioMeta || undefined,
                audio_language: audioLanguage || undefined,
                lat,
                lng,
                submitter_name: submitterName || 'Anonymous',
                submitter_phone: submitterPhone,
                submitter_email: submitterEmail
            });

            setSubmissionResponse(response);
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Submission failed. Please try again.');
        }
        setLoading(false);
    };

    // Success Screen
    if (submitted && submissionResponse) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center">
                <div className="h-32 w-full"></div>
                <div className="w-full max-w-[1200px] mx-auto px-6 md:px-8 pb-16">
                    <div className="max-w-[700px] mx-auto">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                            {/* Success Header */}
                            <div className="bg-green-600 text-white px-8 py-6 text-center">
                                <div className="text-5xl mb-3">✅</div>
                                <h1 className="text-2xl font-bold">Grievance Submitted Successfully!</h1>
                            </div>

                            <div className="p-8">
                                {/* Tracking ID Card */}
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6 text-center">
                                    <p className="text-sm text-blue-600 font-medium mb-2">YOUR TRACKING ID</p>
                                    <p className="text-3xl font-bold text-[#003366] font-mono tracking-wider">
                                        {submissionResponse.complaint_id}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-3">
                                        Please save this ID for future reference
                                    </p>
                                </div>

                                {/* AI Classification */}
                                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <span>🤖</span> AI Classification Result
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Department:</span>
                                            <p className="font-semibold text-gray-800">{submissionResponse.classification.department}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Priority:</span>
                                            <p className={`font-semibold capitalize ${submissionResponse.classification.priority === 'high' ? 'text-red-600' :
                                                    submissionResponse.classification.priority === 'medium' ? 'text-orange-600' : 'text-green-600'
                                                }`}>
                                                {submissionResponse.classification.priority}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-500">Category:</span>
                                            <p className="font-semibold text-gray-800 capitalize">
                                                {submissionResponse.classification.detected_category.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">📋</span>
                                        <div>
                                            <p className="font-bold text-yellow-800">Current Status: SUBMITTED</p>
                                            <p className="text-sm text-yellow-700">Your grievance is being reviewed by the concerned department.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Link
                                        href={`/track-status?id=${submissionResponse.complaint_id}`}
                                        className="btn-primary text-center py-3"
                                    >
                                        🔍 Track Your Grievance
                                    </Link>
                                    <Link
                                        href="/dashboard"
                                        className="btn-outline text-center py-3"
                                    >
                                        📊 Go to Dashboard
                                    </Link>
                                </div>

                                {/* Info */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <p className="text-sm text-gray-600 text-center">
                                        📧 You will receive updates on your registered contact details.
                                        <br />
                                        📞 For urgent queries, call: <strong>1800-XXX-XXXX</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main Form
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col items-center">
            <div className="h-32 w-full"></div>

            <div className="w-full max-w-[1200px] mx-auto px-6 md:px-8 pb-16">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-[#003366] mb-2">Lodge Public Grievance</h1>
                    <p className="text-gray-600">Government of India - Public Grievance Redressal System</p>
                </header>

                {/* Form Container */}
                <div className="max-w-[900px] mx-auto">
                    {/* Progress Stepper */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                        <div className="flex items-center justify-between">
                            {['Personal Details', 'Classification', 'Issue Details', 'Evidence', 'Declaration'].map((label, idx) => (
                                <div key={idx} className="flex-1 flex items-center">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                                        ${step > idx + 1 ? 'bg-green-500 text-white' :
                                            step === idx + 1 ? 'bg-[#003366] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        {step > idx + 1 ? '✓' : idx + 1}
                                    </div>
                                    <span className={`hidden md:block ml-2 text-xs ${step === idx + 1 ? 'font-bold text-[#003366]' : 'text-gray-500'}`}>
                                        {label}
                                    </span>
                                    {idx < 4 && <div className={`flex-1 h-1 mx-2 ${step > idx + 1 ? 'bg-green-500' : 'bg-gray-200'}`}></div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="p-8">
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            {/* Step 1: Personal Details */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div className="border-b pb-4 mb-6">
                                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                            <span className="text-2xl">👤</span> Personal Details
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">Your contact information for updates</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`w-full p-3 border rounded-lg ${errors.submitterName ? 'border-red-500' : 'border-gray-300'} ${user ? 'bg-gray-100' : ''}`}
                                                value={submitterName}
                                                onChange={e => setSubmitterName(e.target.value)}
                                                readOnly={!!user}
                                                placeholder="Enter your full name"
                                            />
                                            {errors.submitterName && <p className="text-red-500 text-xs mt-1">{errors.submitterName}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                className={`w-full p-3 border rounded-lg border-gray-300 ${user ? 'bg-gray-100' : ''}`}
                                                value={submitterEmail}
                                                onChange={e => setSubmitterEmail(e.target.value)}
                                                readOnly={!!user}
                                                placeholder="email@example.com"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Mobile Number <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex">
                                                <span className="inline-flex items-center px-4 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                                                    +91
                                                </span>
                                                <input
                                                    type="tel"
                                                    className={`flex-1 p-3 border rounded-r-lg ${errors.submitterPhone ? 'border-red-500' : 'border-gray-300'}`}
                                                    value={submitterPhone}
                                                    onChange={e => setSubmitterPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                    placeholder="9876543210"
                                                    maxLength={10}
                                                />
                                            </div>
                                            {errors.submitterPhone && <p className="text-red-500 text-xs mt-1">{errors.submitterPhone}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Grievance Classification */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="border-b pb-4 mb-6">
                                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                            <span className="text-2xl">🏛️</span> Grievance Classification
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">Help us route your grievance to the right department</p>
                                    </div>

                                    {/* Category Selection */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">
                                            Category <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {Object.entries(CATEGORIES).map(([key, { label, icon }]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => { setCategory(key); setSubCategory(''); }}
                                                    className={`p-4 rounded-lg border-2 text-left transition-all ${category === key
                                                            ? 'border-[#003366] bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <span className="text-2xl">{icon}</span>
                                                    <p className="font-medium text-sm mt-1">{label}</p>
                                                </button>
                                            ))}
                                        </div>
                                        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                                    </div>

                                    {/* Sub-category */}
                                    {category && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Sub-category <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                className={`w-full p-3 border rounded-lg ${errors.subCategory ? 'border-red-500' : 'border-gray-300'}`}
                                                value={subCategory}
                                                onChange={e => setSubCategory(e.target.value)}
                                            >
                                                <option value="">Select sub-category</option>
                                                {CATEGORIES[category as keyof typeof CATEGORIES]?.subCategories.map(sub => (
                                                    <option key={sub} value={sub}>{sub}</option>
                                                ))}
                                            </select>
                                            {errors.subCategory && <p className="text-red-500 text-xs mt-1">{errors.subCategory}</p>}
                                        </div>
                                    )}

                                    {/* Department */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Department <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            className={`w-full p-3 border rounded-lg ${errors.department ? 'border-red-500' : 'border-gray-300'}`}
                                            value={department}
                                            onChange={e => setDepartment(e.target.value)}
                                        >
                                            <option value="">Select department</option>
                                            {DEPARTMENTS.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                        {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                                    </div>

                                    {/* Location */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                State <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                className={`w-full p-3 border rounded-lg ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                                                value={state}
                                                onChange={e => setState(e.target.value)}
                                            >
                                                <option value="">Select State</option>
                                                {STATES.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">District</label>
                                            <input
                                                type="text"
                                                className="w-full p-3 border border-gray-300 rounded-lg"
                                                value={district}
                                                onChange={e => setDistrict(e.target.value)}
                                                placeholder="Enter district"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                City/Town <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`w-full p-3 border rounded-lg ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                                                value={city}
                                                onChange={e => setCity(e.target.value)}
                                                placeholder="Enter city"
                                            />
                                            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                                        </div>
                                    </div>

                                    {/* Urgency */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">Urgency Level</label>
                                        <div className="flex gap-4">
                                            {[
                                                { value: 'low', label: 'Low', color: 'green' },
                                                { value: 'medium', label: 'Medium', color: 'orange' },
                                                { value: 'high', label: 'High / Emergency', color: 'red' }
                                            ].map(({ value, label, color }) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setUrgency(value as 'low' | 'medium' | 'high')}
                                                    className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${urgency === value
                                                            ? `border-${color}-500 bg-${color}-50 text-${color}-700`
                                                            : 'border-gray-200'
                                                        }`}
                                                >
                                                    <span className="font-medium">{label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Grievance Details */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <div className="border-b pb-4 mb-6">
                                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                            <span className="text-2xl">📝</span> Grievance Details
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">Describe your issue in detail</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Problem Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`w-full p-3 border rounded-lg ${errors.problemTitle ? 'border-red-500' : 'border-gray-300'}`}
                                            value={problemTitle}
                                            onChange={e => setProblemTitle(e.target.value)}
                                            placeholder="Brief title of your grievance (e.g., 'Broken water pipe on Main Road')"
                                        />
                                        {errors.problemTitle && <p className="text-red-500 text-xs mt-1">{errors.problemTitle}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Detailed Description <span className="text-red-500">*</span>
                                            <span className="text-gray-400 font-normal ml-2">(minimum 100 characters)</span>
                                        </label>
                                        <textarea
                                            className={`w-full p-4 border rounded-lg min-h-[150px] ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="Please provide a detailed description of the issue, including when it started, how it affects you, and any previous attempts to resolve it..."
                                        />
                                        <div className="flex justify-between mt-1">
                                            {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
                                            <p className={`text-xs ml-auto ${description.length < 100 ? 'text-orange-500' : 'text-green-600'}`}>
                                                {description.length} / 100+ characters
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">When did this issue start?</label>
                                            <input
                                                type="date"
                                                className="w-full p-3 border border-gray-300 rounded-lg"
                                                value={issueStartDate}
                                                onChange={e => setIssueStartDate(e.target.value)}
                                                max={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Is this a recurring issue?</label>
                                            <div className="flex gap-4 mt-3">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="recurring"
                                                        checked={!isRecurring}
                                                        onChange={() => setIsRecurring(false)}
                                                        className="text-[#003366]"
                                                    />
                                                    <span>No</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="recurring"
                                                        checked={isRecurring}
                                                        onChange={() => setIsRecurring(true)}
                                                        className="text-[#003366]"
                                                    />
                                                    <span>Yes, this happens regularly</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Exact Location / Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`w-full p-3 border rounded-lg mb-3 ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
                                            value={location}
                                            onChange={e => setLocation(e.target.value)}
                                            placeholder="Street address, landmark, or specific location"
                                        />
                                        {errors.location && <p className="text-red-500 text-xs mb-2">{errors.location}</p>}
                                        <div className="rounded-lg border border-gray-300 overflow-hidden h-48">
                                            <LocationMap
                                                initialLat={20.5937}
                                                initialLng={78.9629}
                                                onLocationSelect={(lat, lng) => {
                                                    setLat(lat);
                                                    setLng(lng);
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Click on the map to mark the exact location</p>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Evidence */}
                            {step === 4 && (
                                <div className="space-y-6">
                                    <div className="border-b pb-4 mb-6">
                                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                            <span className="text-2xl">📎</span> Supporting Evidence
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">Upload photos or voice recordings (optional)</p>
                                    </div>

                                    {/* Image Upload */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">Photo Evidence</label>
                                        {!imageBase64 ? (
                                            <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                                                <span className="text-4xl mb-2">📷</span>
                                                <span className="text-gray-600 font-medium">Click to upload image</span>
                                                <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                            </label>
                                        ) : (
                                            <div className="relative border border-green-300 rounded-lg p-4 bg-green-50">
                                                <div className="flex items-center gap-4">
                                                    <img src={imageBase64} alt="Evidence" className="w-24 h-24 object-cover rounded-lg" />
                                                    <div>
                                                        <p className="font-medium text-green-800">{imageName}</p>
                                                        <p className="text-sm text-green-600">Image uploaded successfully</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={removeImage}
                                                        className="ml-auto text-red-600 hover:text-red-800 p-2"
                                                    >
                                                        ✕ Remove
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Voice Note */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">Voice Note</label>
                                        {!audioName ? (
                                            <div className="space-y-3">
                                                <select
                                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                                    value={audioLanguage}
                                                    onChange={e => setAudioLanguage(e.target.value)}
                                                >
                                                    <option value="">Select language for voice note</option>
                                                    <option value="English">English</option>
                                                    <option value="Hindi">Hindi</option>
                                                    <option value="Tamil">Tamil</option>
                                                    <option value="Telugu">Telugu</option>
                                                    <option value="Kannada">Kannada</option>
                                                    <option value="Malayalam">Malayalam</option>
                                                    <option value="Bengali">Bengali</option>
                                                    <option value="Marathi">Marathi</option>
                                                    <option value="Gujarati">Gujarati</option>
                                                    <option value="Other">Other</option>
                                                </select>

                                                <div className="flex gap-4">
                                                    {!isRecording ? (
                                                        <button
                                                            type="button"
                                                            onClick={startRecording}
                                                            className="flex-1 flex items-center justify-center gap-2 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 hover:bg-red-100 transition-colors"
                                                        >
                                                            <span className="text-2xl">🎤</span>
                                                            <span className="font-medium">Record Voice</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={stopRecording}
                                                            className="flex-1 flex items-center justify-center gap-2 p-4 bg-red-600 rounded-lg text-white animate-pulse"
                                                        >
                                                            <span className="text-2xl">⏹️</span>
                                                            <span className="font-medium">Stop Recording</span>
                                                        </button>
                                                    )}
                                                    <label className="flex-1 flex items-center justify-center gap-2 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                                                        <span className="text-2xl">📁</span>
                                                        <span className="font-medium">Upload Audio</span>
                                                        <input type="file" className="hidden" accept="audio/*" onChange={handleAudioUpload} />
                                                    </label>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="border border-green-300 rounded-lg p-4 bg-green-50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-3xl">🎵</span>
                                                        <div>
                                                            <p className="font-medium text-green-800">{audioName}</p>
                                                            <p className="text-sm text-green-600">Language: {audioLanguage || 'Not specified'}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={removeAudio}
                                                        className="text-red-600 hover:text-red-800 p-2"
                                                    >
                                                        ✕ Remove
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Declaration */}
                            {step === 5 && (
                                <div className="space-y-6">
                                    <div className="border-b pb-4 mb-6">
                                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                            <span className="text-2xl">📋</span> Review & Declaration
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">Review your grievance and submit</p>
                                    </div>

                                    {/* Summary */}
                                    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                                        <h3 className="font-bold text-gray-800 border-b pb-2">Grievance Summary</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div><span className="text-gray-500">Name:</span> <span className="font-medium">{submitterName}</span></div>
                                            <div><span className="text-gray-500">Phone:</span> <span className="font-medium">+91 {submitterPhone}</span></div>
                                            <div><span className="text-gray-500">Category:</span> <span className="font-medium">{CATEGORIES[category as keyof typeof CATEGORIES]?.label}</span></div>
                                            <div><span className="text-gray-500">Sub-category:</span> <span className="font-medium">{subCategory}</span></div>
                                            <div><span className="text-gray-500">Department:</span> <span className="font-medium">{department}</span></div>
                                            <div><span className="text-gray-500">Urgency:</span> <span className={`font-medium capitalize ${urgency === 'high' ? 'text-red-600' : urgency === 'medium' ? 'text-orange-600' : 'text-green-600'}`}>{urgency}</span></div>
                                            <div className="col-span-2"><span className="text-gray-500">Location:</span> <span className="font-medium">{city}, {state}</span></div>
                                            <div className="col-span-2"><span className="text-gray-500">Title:</span> <span className="font-medium">{problemTitle}</span></div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block mb-1">Description:</span>
                                            <p className="text-sm bg-white p-3 rounded border">{description.slice(0, 200)}...</p>
                                        </div>
                                        {(imageBase64 || audioName) && (
                                            <div className="flex gap-4">
                                                {imageBase64 && <span className="text-green-600 text-sm">📷 1 Image attached</span>}
                                                {audioName && <span className="text-green-600 text-sm">🎵 Voice note attached</span>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Declaration Checkbox */}
                                    <div className={`p-4 rounded-lg border-2 ${errors.declaration ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={declaration}
                                                onChange={e => setDeclaration(e.target.checked)}
                                                className="mt-1 w-5 h-5 text-[#003366] rounded"
                                            />
                                            <span className="text-sm text-gray-700">
                                                I hereby declare that the information provided above is true and correct to the best of my knowledge.
                                                I understand that providing false information may result in rejection of my grievance and may attract
                                                legal action as per applicable laws.
                                            </span>
                                        </label>
                                        {errors.declaration && <p className="text-red-500 text-xs mt-2">{errors.declaration}</p>}
                                    </div>

                                    {/* Privacy Notice */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-800">
                                            <strong>Privacy Notice:</strong> Your personal information will be kept confidential and used only
                                            for processing your grievance. By submitting, you agree to our Terms of Service and Privacy Policy.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex gap-4 mt-8 pt-6 border-t">
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={handlePrevStep}
                                        className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                                    >
                                        ← Previous
                                    </button>
                                )}
                                {step < 5 ? (
                                    <button
                                        type="button"
                                        onClick={handleNextStep}
                                        className="flex-1 py-3 px-6 bg-[#003366] text-white rounded-lg font-bold hover:bg-blue-900 transition-colors"
                                    >
                                        Next →
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleFinalSubmit}
                                        disabled={loading}
                                        className="flex-1 py-3 px-6 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Submitting...' : '✓ Submit Grievance'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Help Section */}
                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            <strong>Need Help?</strong> Call our helpline at <strong>1800-XXX-XXXX</strong> (Toll-free)
                            or email us at <strong>support@civicsense.gov.in</strong>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
