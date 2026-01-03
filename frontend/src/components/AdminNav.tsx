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
        { href: '/admin/analytics', label: 'Analytics' },
    ];

    return (
        <nav className="mb-10">
            <div className="flex justify-center">
                <div className="inline-flex bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200">
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`px-8 py-4 text-base font-bold uppercase tracking-wider transition-all border-r border-gray-200 last:border-r-0 ${isActive(item.href)
                                    ? 'bg-[#003366] text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
