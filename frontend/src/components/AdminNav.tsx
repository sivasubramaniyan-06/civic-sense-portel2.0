'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
    const pathname = usePathname();

    // Check active path including subroutes
    const isActive = (path: string) => {
        return pathname === path || pathname?.startsWith(path + '/')
            ? 'bg-[#003366] text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-50 hover:text-[#003366]';
    };

    return (
        <nav className="bg-white shadow-sm mb-8 rounded-lg border border-gray-200 p-1">
            <div className="flex flex-wrap gap-1">
                <Link href="/admin/dashboard" className={`flex-1 min-w-[150px] text-center px-4 py-3 text-sm font-bold rounded-md transition-all ${isActive('/admin/dashboard')}`}>
                    Insights & Overview
                </Link>
                <Link href="/admin/complaints" className={`flex-1 min-w-[150px] text-center px-4 py-3 text-sm font-bold rounded-md transition-all ${isActive('/admin/complaints')}`}>
                    All Complaints
                </Link>
                <Link href="/admin/priority" className={`flex-1 min-w-[150px] text-center px-4 py-3 text-sm font-bold rounded-md transition-all ${isActive('/admin/priority')}`}>
                    Priority Session
                </Link>
            </div>
        </nav>
    );
}
