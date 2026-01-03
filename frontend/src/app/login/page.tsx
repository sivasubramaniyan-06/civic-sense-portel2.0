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
        <div className="page-content flex items-center justify-center">
            <div className="gov-card w-full max-w-md">
                <div className="text-center mb-6">
                    <div className="text-5xl mb-4">🔐</div>
                    <h1 className="text-xl font-bold text-[#800020]">Citizen Login</h1>
                    <p className="text-sm text-gray-600">Access your grievance dashboard</p>
                </div>

                {error && (
                    <div className="alert alert-error mb-4">
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
