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
        <nav className="bg-white rounded-lg shadow mb-8 p-2">
            <div className="flex flex-wrap justify-center gap-2">
                {navItems.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`px-6 py-3 text-sm font-bold uppercase tracking-wide rounded transition-all ${isActive(item.href)
                                ? 'bg-[#003366] text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
