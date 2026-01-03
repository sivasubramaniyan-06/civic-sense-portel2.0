'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

// Icons using SVG for professional look
const Icons = {
  govt: <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  warning: <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  process: <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  routing: <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
  track: <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  scale: <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
};

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { title: 'Citizen-Centric Governance', subtitle: 'Connecting Citizens with Government - Your Voice, Our Priority', icon: Icons.govt },
    { title: 'Matter NOT Treated as Grievances', subtitle: 'RTI matters, Court cases, Religious matters, Suggestions, Govt Employee service matters', icon: Icons.warning },
    { title: 'Redress Process Flow', subtitle: 'Complaint - Assessment - Department Routing - Resolution - Closure', icon: Icons.process },
    { title: 'Automated Department Routing', subtitle: 'PWD, Health, Transport, Education, Municipal, Revenue - AI-assisted assignment', icon: Icons.routing },
    { title: 'Track and Monitor Your Grievance', subtitle: 'Real-time status updates with complete timeline visibility', icon: Icons.track },
    { title: 'Appeal Mechanism', subtitle: 'Not satisfied? Raise appeal to Nodal Appellate Authority', icon: Icons.scale }
  ];

  const nextSlide = useCallback(() => setCurrentSlide((prev) => (prev + 1) % slides.length), [slides.length]);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  const goToSlide = (index: number) => setCurrentSlide(index);

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const departments = ['Public Works Department', 'Municipal Corporation', 'Health Department', 'Transport Department', 'Education Department', 'Revenue Department', 'Electricity Board', 'Water Supply'];
  const notGrievances = ['RTI (Right to Information) matters', 'Court-related / Sub-judice matters', 'Religious matters', 'Mere suggestions without specific grievance', 'Service matters of Government employees'];

  return (
    <div className="landing-page font-sans text-gray-800">

      {/* HERO SLIDER SECTION */}
      <section className="relative bg-gradient-to-br from-[#003366] via-[#004080] to-[#002244] text-white overflow-hidden">
        {/* Header offset spacer */}
        <div className="h-20"></div>

        <div className="max-w-[1200px] mx-auto px-8 py-20">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`transition-all duration-700 ease-in-out ${index === currentSlide ? 'block opacity-100' : 'hidden opacity-0'}`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                {/* Left: Content - Takes 2 columns */}
                <div className="lg:col-span-2 text-center lg:text-left">
                  <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                    {slide.title}
                  </h1>
                  <p className="text-xl lg:text-2xl text-blue-200 mb-10 leading-relaxed">
                    {slide.subtitle}
                  </p>
                  <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
                    <Link
                      href="/lodge-grievance"
                      className="bg-yellow-500 hover:bg-yellow-400 text-[#003366] font-bold py-4 px-10 rounded-lg text-lg transition-all shadow-lg hover:shadow-xl"
                    >
                      Lodge Grievance
                    </Link>
                    <Link
                      href="/track-status"
                      className="bg-transparent border-2 border-white hover:bg-white hover:text-[#003366] text-white font-bold py-4 px-10 rounded-lg text-lg transition-all"
                    >
                      Track Status
                    </Link>
                  </div>
                </div>

                {/* Right: Icon */}
                <div className="hidden lg:flex justify-center items-center text-blue-300 opacity-60">
                  <div className="transform scale-[2]">
                    {slide.icon}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Slide Navigation Dots */}
          <div className="flex justify-center gap-3 mt-12">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? 'bg-yellow-500 w-8' : 'bg-white bg-opacity-40 hover:bg-opacity-60'}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white opacity-40 hover:opacity-100 text-5xl font-light p-2 transition-opacity"
          onClick={prevSlide}
        >
          ‹
        </button>
        <button
          className="absolute right-6 top-1/2 transform -translate-y-1/2 text-white opacity-40 hover:opacity-100 text-5xl font-light p-2 transition-opacity"
          onClick={nextSlide}
        >
          ›
        </button>
      </section>

      {/* KEY STATISTICS SECTION */}
      <section className="py-16 bg-white">
        <div className="max-w-[1200px] mx-auto px-8">
          <h2 className="text-3xl font-bold text-center text-[#003366] mb-4 uppercase tracking-wide">
            Key Statistics
          </h2>
          <div className="w-24 h-1 bg-yellow-500 mx-auto mb-12"></div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-8 text-center border-2 border-blue-100 shadow-sm hover:shadow-lg transition-shadow">
              <p className="text-5xl font-bold text-[#003366] mb-3">5,230+</p>
              <p className="text-base font-semibold text-gray-600 uppercase tracking-wide">Grievances Resolved</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-8 text-center border-2 border-green-100 shadow-sm hover:shadow-lg transition-shadow">
              <p className="text-5xl font-bold text-green-700 mb-3">15</p>
              <p className="text-base font-semibold text-gray-600 uppercase tracking-wide">Departments Connected</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-8 text-center border-2 border-orange-100 shadow-sm hover:shadow-lg transition-shadow">
              <p className="text-5xl font-bold text-orange-600 mb-3">48hrs</p>
              <p className="text-base font-semibold text-gray-600 uppercase tracking-wide">Avg. Response Time</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-8 text-center border-2 border-purple-100 shadow-sm hover:shadow-lg transition-shadow">
              <p className="text-5xl font-bold text-purple-700 mb-3">92%</p>
              <p className="text-base font-semibold text-gray-600 uppercase tracking-wide">Citizen Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONNECTED DEPARTMENTS SECTION */}
      <section className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-[1200px] mx-auto px-8">
          <h2 className="text-3xl font-bold text-center text-[#003366] mb-4 uppercase tracking-wide">
            Connected Departments
          </h2>
          <div className="w-24 h-1 bg-yellow-500 mx-auto mb-12"></div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {departments.map((dept, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg border-2 border-gray-200 text-center font-semibold text-gray-700 hover:border-[#003366] hover:text-[#003366] hover:shadow-md transition-all cursor-default"
              >
                {dept}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GRIEVANCE REDRESSAL PROCESS */}
      <section className="py-20 bg-white border-t border-gray-200">
        <div className="max-w-[1200px] mx-auto px-8">
          <h2 className="text-3xl font-bold text-center text-[#003366] mb-4 uppercase tracking-wide">
            Grievance Redressal Process
          </h2>
          <div className="w-24 h-1 bg-yellow-500 mx-auto mb-16"></div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-1 bg-gray-200"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {[
                { step: '1', title: 'Submit Complaint', desc: 'Select category and describe your issue with supporting documents' },
                { step: '2', title: 'AI Assessment', desc: 'Automatic routing and priority classification by AI system' },
                { step: '3', title: 'Action Taken', desc: 'Assigned officer investigates and resolves the issue' },
                { step: '4', title: 'Resolution', desc: 'Issue closed and citizen notified with resolution details' }
              ].map((s, i) => (
                <div key={i} className="relative flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-2xl mb-6 shadow-xl ring-4 ring-white relative z-10">
                    {s.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
                  <p className="text-base text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* IMPORTANT NOTICE SECTION */}
      <section className="py-16 bg-blue-50 border-t border-blue-100">
        <div className="max-w-[1000px] mx-auto px-8">
          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 overflow-hidden">
            <div className="bg-[#003366] text-white py-4 px-8 font-bold uppercase tracking-wide text-lg flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Important Notice
            </div>
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b-2 border-gray-200">
                Issues NOT treated as Grievances:
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {notGrievances.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-base text-gray-700">
                    <span className="text-red-500 font-bold text-lg">×</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-5 text-base text-amber-900 rounded-r-lg">
                <strong>Note:</strong> RTI requests and Court matters must be addressed through their designated independent legal channels.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION SECTION */}
      <section className="py-20 bg-[#003366] text-white">
        <div className="max-w-[1200px] mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to File a Complaint?</h2>
          <p className="text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
            Submit your grievance online and track its progress in real-time
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            <Link
              href="/lodge-grievance"
              className="bg-yellow-500 hover:bg-yellow-400 text-[#003366] font-bold py-5 px-12 rounded-xl text-xl shadow-lg transform hover:-translate-y-1 transition-all"
            >
              Lodge New Grievance
            </Link>
            <Link
              href="/track-status"
              className="bg-transparent border-3 border-white hover:bg-white hover:text-[#003366] text-white font-bold py-5 px-12 rounded-xl text-xl shadow-lg transform hover:-translate-y-1 transition-all"
              style={{ borderWidth: '3px' }}
            >
              Track Application Status
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
