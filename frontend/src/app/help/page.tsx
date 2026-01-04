'use client';

import Link from 'next/link';

export default function Help() {
    const faqs = [
        { q: 'How do I submit a grievance?', a: 'Click "Lodge Grievance", select category, describe issue, upload images, and submit. You will receive a Complaint ID for tracking.' },
        { q: 'How long does resolution take?', a: 'High priority: 7 days. Medium: 15 days. Low: 30 days. Timelines may vary based on complexity.' },
        { q: 'What is AI classification?', a: 'Our AI system analyzes your description to automatically assign the correct department and priority level.' },
        { q: 'How can I track my grievance status?', a: 'Go to "Track Status" page and enter your Complaint ID to view real-time updates.' },
        { q: 'Can I upload supporting documents?', a: 'Yes, you can upload photo evidence and voice notes to help authorities address your issue better.' },
    ];

    const notGrievances = [
        'RTI Matters - Use RTI portal instead',
        'Court-related / Sub-judice matters',
        'Religious matters',
        'Mere Suggestions without grievance',
        'Service matters of Government employees',
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            {/* Header offset */}
            <div className="h-32 w-full"></div>

            <div className="w-full max-w-[1000px] mx-auto px-8 pb-16">
                <header className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-[#003366] mb-3">Help & FAQ</h1>
                    <p className="text-lg text-gray-600">Find answers to common questions and get support</p>
                </header>

                {/* Quick Links */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <Link href="/lodge-grievance" className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 text-center hover:border-[#003366] hover:shadow-xl transition-all">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-[#003366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Lodge Grievance</h3>
                        <p className="text-sm text-gray-600 mt-2">Submit a new complaint</p>
                    </Link>
                    <Link href="/track-status" className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 text-center hover:border-[#003366] hover:shadow-xl transition-all">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Track Status</h3>
                        <p className="text-sm text-gray-600 mt-2">Check your complaint status</p>
                    </Link>
                    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Helpline</h3>
                        <p className="text-xl font-bold text-[#003366] mt-2">1800-XXX-XXXX</p>
                    </div>
                </div>

                {/* FAQs */}
                <section className="bg-white rounded-xl shadow-lg border border-gray-200 mb-12 overflow-hidden">
                    <div className="bg-[#003366] text-white px-8 py-5">
                        <h2 className="text-xl font-bold uppercase tracking-wide">Frequently Asked Questions</h2>
                    </div>
                    <div className="p-8">
                        {faqs.map((faq, idx) => (
                            <details key={idx} className="border-b border-gray-200 py-5 last:border-0">
                                <summary className="font-bold text-lg cursor-pointer text-gray-800 hover:text-[#003366]">{faq.q}</summary>
                                <p className="text-gray-600 mt-3 pl-4 leading-relaxed">{faq.a}</p>
                            </details>
                        ))}
                    </div>
                </section>

                {/* Not Grievances */}
                <section className="bg-white rounded-xl shadow-lg border-l-8 border-orange-500 mb-12 overflow-hidden">
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h2 className="text-xl font-bold text-gray-800">Issues NOT Treated as Grievances</h2>
                        </div>
                        <ul className="space-y-3">
                            {notGrievances.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-base text-gray-700">
                                    <span className="text-red-500 font-bold text-lg">×</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Priority Levels */}
                <section className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-100 px-8 py-5 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800">Resolution Priority Levels</h2>
                    </div>
                    <div className="p-8">
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                                <span className="inline-block px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-sm uppercase">HIGH</span>
                                <p className="text-base text-gray-700 mt-4">Emergency / Safety Issues</p>
                                <p className="text-2xl font-bold text-red-700 mt-2">7 Days</p>
                            </div>
                            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 text-center">
                                <span className="inline-block px-4 py-2 bg-orange-500 text-white font-bold rounded-lg text-sm uppercase">MEDIUM</span>
                                <p className="text-base text-gray-700 mt-4">Utility / Service Issues</p>
                                <p className="text-2xl font-bold text-orange-600 mt-2">15 Days</p>
                            </div>
                            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                                <span className="inline-block px-4 py-2 bg-green-600 text-white font-bold rounded-lg text-sm uppercase">LOW</span>
                                <p className="text-base text-gray-700 mt-4">General Complaints</p>
                                <p className="text-2xl font-bold text-green-700 mt-2">30 Days</p>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
