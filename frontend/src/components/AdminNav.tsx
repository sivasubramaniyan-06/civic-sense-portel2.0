'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
    const pathname = usePathname();

    // Check active path including subroutes
    const isActive = (path: string) => {
        return pathname === path || pathname?.startsWith(path + '/')
            ? 'bg-[#003366] text-white shadow hover:bg-[#002244]'
            : 'bg-white text-gray-600 hover:text-[#003366] hover:bg-gray-100 border border-gray-200';
    };

    return (
        <div className="sticky top-20 z-30 bg-gray-50 pb-4 pt-2 -mx-2 px-2">
            <nav className="flex flex-wrap gap-2">
                <Link href="/admin/dashboard" className={`flex-1 min-w-[140px] text-center px-4 py-3 text-sm font-bold rounded shadow-sm transition-all duration-200 uppercase tracking-wide ${isActive('/admin/dashboard')}`}>
                    Dashboard
                </Link>
                <Link href="/admin/complaints" className={`flex-1 min-w-[140px] text-center px-4 py-3 text-sm font-bold rounded shadow-sm transition-all duration-200 uppercase tracking-wide ${isActive('/admin/complaints')}`}>
                    Manage Complaints
                </Link>
                <Link href="/admin/priority" className={`flex-1 min-w-[140px] text-center px-4 py-3 text-sm font-bold rounded shadow-sm transition-all duration-200 uppercase tracking-wide ${isActive('/admin/priority')}`}>
                    Priority Session
                </Link>
                {/* Analytics links to dashboard for now as requested features are there */}
                <Link href="/admin/dashboard" className={`flex-1 min-w-[140px] text-center px-4 py-3 text-sm font-bold rounded shadow-sm transition-all duration-200 uppercase tracking-wide ${pathname === '/admin/analytics' ? 'bg-[#003366] text-white' : 'bg-white text-gray-600 hover:text-[#003366] hover:bg-gray-100 border border-gray-200'}`}>
                    Analytics
                </Link>
            </nav>
        </div>
    );
}
