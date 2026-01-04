'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, setStoredToken, setStoredUser } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);

            if (result.success && result.token && result.user) {
                setStoredToken(result.token);
                setStoredUser(result.user);

                // Redirect based on role
                if (result.user.role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/dashboard');
                }
            } else {
                setError(result.message || 'Login failed');
            }
        } catch {
            setError('Network error. Please try again.');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-8 pt-36 pb-12">
            {/* Card container - removed mt-20, using pt-36 on parent for fixed header offset */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md p-10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#003366] flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-[#003366]">Citizen Login</h1>
                    <p className="text-base text-gray-600 mt-2">Access your grievance dashboard</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-[#800020] font-medium hover:underline">
                            Register here
                        </Link>
                    </p>
                </div>

                <div className="mt-4 pt-4 border-t text-center">
                    <Link href="/admin" className="text-sm text-gray-500 hover:text-[#800020]">
                        🔒 Officer/Admin Login
                    </Link>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                    Demo: admin@civicsense.gov.in / admin123
                </p>
            </div>
        </div>
    );
}
