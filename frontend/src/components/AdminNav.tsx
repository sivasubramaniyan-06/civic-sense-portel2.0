'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        // Simple exact match or sub-path match
        return pathname === path || pathname?.startsWith(path + '/')
            ? 'bg-[#003366] text-white'
            : 'text-[#003366] hover:bg-gray-100';
    };

    return (
        <nav className="bg-white shadow-sm mb-6 rounded-lg overflow-hidden border border-gray-200">
            <div className="flex flex-wrap">
                <Link href="/admin/dashboard" className={`px-6 py-3 font-medium transition-colors ${isActive('/admin/dashboard')}`}>
                    📊 Insights
                </Link>
                <Link href="/admin/complaints" className={`px-6 py-3 font-medium transition-colors ${isActive('/admin/complaints')}`}>
                    📋 All Complaints
                </Link>
                <Link href="/admin/priority" className={`px-6 py-3 font-medium transition-colors ${isActive('/admin/priority')}`}>
                    🚨 Priority Session
                </Link>
            </div>
        </nav>
    );
}
