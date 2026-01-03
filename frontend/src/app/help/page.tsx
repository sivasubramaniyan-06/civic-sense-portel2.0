import Link from 'next/link';

export default function Help() {
    const faqs = [
        { q: 'How do I submit a grievance?', a: 'Click "Lodge Grievance", select category, describe issue, upload images, and submit. You\'ll get a Complaint ID.' },
        { q: 'How long to resolve?', a: 'High priority: 7 days. Medium: 15 days. Low: 30 days.' },
        { q: 'What is AI classification?', a: 'AI analyzes your description to assign department and priority automatically.' },
        { q: 'How to track status?', a: 'Go to "Track Status" and enter your Complaint ID.' },
        { q: 'Can I upload images?', a: 'Yes, photo evidence helps authorities address your issue better.' },
    ];

    const notGrievances = [
        'RTI Matters - Use RTI portal instead',
        'Court-related / Sub-judice matters',
        'Religious matters',
        'Mere Suggestions without grievance',
        'Service matters of Govt employees',
    ];

    return (
        <div className="page-content">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-2xl font-bold text-center text-[#003366] mb-8">Help & FAQ</h1>

                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <Link href="/lodge-grievance" className="gov-card text-center hover:shadow-lg">
                        <div className="text-3xl mb-2">📝</div>
                        <h3 className="font-bold">Lodge Grievance</h3>
                    </Link>
                    <Link href="/track-status" className="gov-card text-center hover:shadow-lg">
                        <div className="text-3xl mb-2">🔍</div>
                        <h3 className="font-bold">Track Status</h3>
                    </Link>
                    <div className="gov-card text-center">
                        <div className="text-3xl mb-2">📞</div>
                        <h3 className="font-bold">1800-XXX-XXXX</h3>
                    </div>
                </div>

                <div className="gov-card mb-8">
                    <h2 className="text-lg font-bold mb-4 border-b-2 border-[#800020] pb-2">FAQs</h2>
                    {faqs.map((faq, idx) => (
                        <details key={idx} className="border-b py-3">
                            <summary className="font-bold cursor-pointer">{faq.q}</summary>
                            <p className="text-gray-600 mt-2 pl-4">{faq.a}</p>
                        </details>
                    ))}
                </div>

                <div className="gov-card border-l-4 border-l-[#f59e0b] mb-8">
                    <h2 className="text-lg font-bold mb-4">⚠️ NOT Treated as Grievances</h2>
                    <ul className="space-y-2">
                        {notGrievances.map((item, idx) => (
                            <li key={idx} className="flex gap-2"><span className="text-red-500">✗</span>{item}</li>
                        ))}
                    </ul>
                </div>

                <div className="gov-card">
                    <h2 className="text-lg font-bold mb-4">Priority Levels</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-3 bg-red-50 rounded">
                            <span className="priority-badge priority-high">HIGH</span>
                            <p className="text-sm mt-2">Emergency/Safety - 7 days</p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded">
                            <span className="priority-badge priority-medium">MEDIUM</span>
                            <p className="text-sm mt-2">Utility issues - 15 days</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded">
                            <span className="priority-badge priority-low">LOW</span>
                            <p className="text-sm mt-2">General - 30 days</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
