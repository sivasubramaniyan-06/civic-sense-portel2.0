import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="gov-footer">
            {/* Main Footer */}
            <div className="gov-container">
                <div className="footer-grid">
                    {/* About */}
                    <div className="footer-section">
                        <h3 className="footer-title">About Civic Sense Portal</h3>
                        <p className="footer-text">
                            An AI-powered public grievance redressal system designed to provide
                            transparent, efficient, and citizen-friendly complaint resolution.
                        </p>
                        <div className="footer-badges">
                            <span className="footer-badge">🏛️ Government Portal</span>
                            <span className="footer-badge">🤖 AI Powered</span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-section">
                        <h3 className="footer-title">Quick Links</h3>
                        <ul className="footer-links">
                            <li><Link href="/">Home</Link></li>
                            <li><Link href="/lodge-grievance">Lodge Grievance</Link></li>
                            <li><Link href="/track-status">Track Status</Link></li>
                            <li><Link href="/help">Help &amp; FAQ</Link></li>
                            <li><Link href="/admin">Officer Login</Link></li>
                        </ul>
                    </div>

                    {/* Contact Us */}
                    <div className="footer-section">
                        <h3 className="footer-title">Contact Us</h3>
                        <ul className="footer-contact">
                            <li>📧 support@civicsense.gov.in</li>
                            <li>📞 Toll Free: 1800-XXX-XXXX</li>
                            <li>🕐 Mon-Fri: 9:00 AM - 5:00 PM</li>
                            <li>📍 New Delhi, India</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="footer-bottom">
                <div className="gov-container">
                    <div className="footer-bottom-content">
                        <p>© 2026 Civic Sense Portal. All Rights Reserved.</p>
                        <div className="footer-bottom-links">
                            <a href="#">Privacy Policy</a>
                            <span>|</span>
                            <a href="#">Terms of Service</a>
                            <span>|</span>
                            <a href="#">Accessibility</a>
                            <span>|</span>
                            <a href="#">Sitemap</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
