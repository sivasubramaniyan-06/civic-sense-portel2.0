'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path || pathname?.startsWith(path + '/');
    };

    const navItems = [
        { href: '/admin/dashboard', label: 'DASHBOARD' },
        { href: '/admin/complaints', label: 'COMPLAINTS' },
        { href: '/admin/priority', label: 'PRIORITY' },
        { href: '/admin/analytics', label: 'ANALYTICS' },
        { href: '/admin/team', label: 'TEAM' },
        { href: '/admin/help', label: 'HELP' },
    ];

    return (
        <nav className="w-full bg-white border-b-4 border-[#003366] mb-12">
            <div className="max-w-[1280px] mx-auto">
                <div className="flex">
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex-1 text-center px-4 py-4 text-sm font-bold tracking-wider transition-all border-r border-gray-200 last:border-r-0 ${isActive(item.href)
                                    ? 'bg-[#003366] text-white'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
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
