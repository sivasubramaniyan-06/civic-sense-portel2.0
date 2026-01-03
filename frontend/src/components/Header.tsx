'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/lodge-grievance', label: 'Lodge Grievance' },
        { href: '/track-status', label: 'Track Status' },
        { href: '/help', label: 'Help' },
    ];

    return (
        <header className="gov-header-fixed">
            {/* Top Bar - Government Strip */}
            <div className="gov-top-strip">
                <div className="gov-container">
                    <div className="gov-top-strip-content">
                        <div className="gov-top-left">
                            <span>Government of India</span>
                            <span className="gov-divider">|</span>
                            <span>भारत सरकार</span>
                        </div>
                        <div className="gov-top-right">
                            <span>Screen Reader</span>
                            <span className="gov-divider">|</span>
                            <select className="gov-lang-select">
                                <option>English</option>
                                <option>हिंदी</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <div className="gov-main-header">
                <div className="gov-container">
                    <div className="gov-header-content">
                        {/* Logo and Title */}
                        <div className="gov-logo-section">
                            {/* Emblem */}
                            <div className="gov-emblem">
                                <svg viewBox="0 0 100 100" className="gov-emblem-svg">
                                    <circle cx="50" cy="50" r="45" fill="#fff" stroke="#800020" strokeWidth="2" />
                                    <text x="50" y="40" textAnchor="middle" fontSize="12" fill="#800020" fontWeight="bold">सत्यमेव</text>
                                    <text x="50" y="55" textAnchor="middle" fontSize="12" fill="#800020" fontWeight="bold">जयते</text>
                                    <text x="50" y="75" textAnchor="middle" fontSize="8" fill="#800020">🏛️</text>
                                </svg>
                            </div>
                            <div className="gov-title-section">
                                <h1 className="gov-portal-title">Civic Sense Portal</h1>
                                <p className="gov-portal-subtitle">AI-Powered Public Grievance Redressal System</p>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="gov-nav-desktop">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`gov-nav-item ${pathname === link.href ? 'active' : ''}`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {/* Admin Login Button */}
                            <Link
                                href="/admin"
                                className={`gov-nav-admin ${pathname === '/admin' ? 'active' : ''}`}
                            >
                                🔐 Admin Login
                            </Link>
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            className="gov-mobile-menu-btn"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            ☰
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <nav className="gov-nav-mobile">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`gov-nav-mobile-item ${pathname === link.href ? 'active' : ''}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Link
                        href="/admin"
                        className={`gov-nav-mobile-item gov-nav-mobile-admin ${pathname === '/admin' ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        🔐 Admin Login
                    </Link>
                </nav>
            )}
        </header>
    );
}
