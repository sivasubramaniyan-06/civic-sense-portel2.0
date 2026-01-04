import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-[#1a1a2e] text-gray-300">
            {/* Main Footer Content */}
            <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
                    {/* About Section */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-5 uppercase tracking-wide">
                            About Civic Sense Portal
                        </h3>
                        <p className="text-gray-400 leading-relaxed mb-6">
                            An AI-powered public grievance redressal system designed to provide
                            transparent, efficient, and citizen-friendly complaint resolution
                            across multiple government departments.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <span className="bg-[#003366]/30 text-blue-300 px-3 py-1.5 rounded-lg text-sm font-medium">
                                🏛️ Government Portal
                            </span>
                            <span className="bg-[#003366]/30 text-blue-300 px-3 py-1.5 rounded-lg text-sm font-medium">
                                🤖 AI Powered
                            </span>
                        </div>
                    </div>

                    {/* Quick Links Section */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-5 uppercase tracking-wide">
                            Quick Links
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/" className="text-gray-400 hover:text-yellow-400 transition-colors inline-flex items-center gap-2">
                                    <span>→</span> Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/lodge-grievance" className="text-gray-400 hover:text-yellow-400 transition-colors inline-flex items-center gap-2">
                                    <span>→</span> Lodge Grievance
                                </Link>
                            </li>
                            <li>
                                <Link href="/track-status" className="text-gray-400 hover:text-yellow-400 transition-colors inline-flex items-center gap-2">
                                    <span>→</span> Track Status
                                </Link>
                            </li>
                            <li>
                                <Link href="/help" className="text-gray-400 hover:text-yellow-400 transition-colors inline-flex items-center gap-2">
                                    <span>→</span> Help &amp; FAQ
                                </Link>
                            </li>
                            <li>
                                <Link href="/admin" className="text-gray-400 hover:text-yellow-400 transition-colors inline-flex items-center gap-2">
                                    <span>→</span> Officer Login
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Us Section */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-5 uppercase tracking-wide">
                            Contact Us
                        </h3>
                        <ul className="space-y-4 text-gray-400">
                            <li className="flex items-start gap-3">
                                <span className="text-yellow-400 mt-0.5">📧</span>
                                <span>support@civicsense.gov.in</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-yellow-400 mt-0.5">📞</span>
                                <span>Toll Free: 1800-XXX-XXXX</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-yellow-400 mt-0.5">🕐</span>
                                <span>Mon-Fri: 9:00 AM - 6:00 PM</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-yellow-400 mt-0.5">📍</span>
                                <span>New Delhi, India</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-700 bg-[#0f0f1a]">
                <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-5">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                        <p>© 2026 Civic Sense Portal. All Rights Reserved.</p>
                        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                            <a href="#" className="hover:text-yellow-400 transition-colors">Privacy Policy</a>
                            <span className="hidden md:inline text-gray-600">|</span>
                            <a href="#" className="hover:text-yellow-400 transition-colors">Terms of Service</a>
                            <span className="hidden md:inline text-gray-600">|</span>
                            <a href="#" className="hover:text-yellow-400 transition-colors">Accessibility</a>
                            <span className="hidden md:inline text-gray-600">|</span>
                            <a href="#" className="hover:text-yellow-400 transition-colors">Sitemap</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
