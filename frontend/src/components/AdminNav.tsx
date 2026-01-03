'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path || pathname?.startsWith(path + '/');
    };

    const navItems = [
        { href: '/admin/dashboard', label: 'Dashboard' },
        { href: '/admin/complaints', label: 'Manage Complaints' },
        { href: '/admin/priority', label: 'Priority Session' },
        { href: '/admin/analytics', label: 'Analytics & Reports' },
    ];

    return (
        <nav className="bg-white border-b-2 border-gray-200 mb-8 shadow-sm">
            <div className="flex flex-wrap">
                {navItems.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`px-8 py-5 text-sm font-bold uppercase tracking-wider transition-all border-b-4 ${isActive(item.href)
                                ? 'border-[#003366] text-[#003366] bg-blue-50'
                                : 'border-transparent text-gray-500 hover:text-[#003366] hover:bg-gray-50'
                            }`}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
