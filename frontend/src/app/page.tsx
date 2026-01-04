'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slider images/content - can be extended for future image uploads
  const slides = [
    {
      title: 'Citizen-Centric Governance',
      subtitle: 'Connecting Citizens with Government - Your Voice, Our Priority',
      image: '/slider/slide1.jpg'
    },
    {
      title: 'AI-Powered Grievance Redressal',
      subtitle: 'Smart classification and automatic routing to the right department',
      image: '/slider/slide2.jpg'
    },
    {
      title: 'Track Your Complaint',
      subtitle: 'Real-time status updates with complete timeline visibility',
      image: '/slider/slide3.jpg'
    },
    {
      title: 'Multiple Departments Connected',
      subtitle: 'PWD, Health, Transport, Education, Municipal, Revenue - All under one roof',
      image: '/slider/slide4.jpg'
    },
  ];

  const nextSlide = useCallback(() => setCurrentSlide((prev) => (prev + 1) % slides.length), [slides.length]);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  const goToSlide = (index: number) => setCurrentSlide(index);

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const departments = [
    'Public Works Department',
    'Municipal Corporation',
    'Health Department',
    'Transport Department',
    'Education Department',
    'Revenue Department',
    'Electricity Board',
    'Water Supply'
  ];

  const notGrievances = [
    'RTI (Right to Information) matters',
    'Court-related / Sub-judice matters',
    'Religious matters',
    'Mere suggestions without specific grievance',
    'Service matters of Government employees'
  ];

  return (
    <div className="landing-page">

      {/* ========== SECTION 1: HERO SLIDER ========== */}
      <section className="relative overflow-hidden">
        {/* Header offset */}
        <div className="h-20"></div>

        {/* Slider Container */}
        <div className="relative w-full" style={{ aspectRatio: '3/1', minHeight: '280px', maxHeight: '450px' }}>
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
            >
              {/* Full-width Banner Image */}
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-center"
              />

              {/* Action Buttons Overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent py-6">
                <div className="max-w-[1200px] mx-auto px-8">
                  <div className="flex flex-wrap gap-4 justify-center">
                    <Link
                      href="/lodge-grievance"
                      className="bg-yellow-500 hover:bg-yellow-400 text-[#003366] font-bold py-3 px-8 rounded-lg text-base md:text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                    >
                      Lodge Grievance
                    </Link>
                    <Link
                      href="/track-status"
                      className="bg-white/90 hover:bg-white text-[#003366] font-bold py-3 px-8 rounded-lg text-base md:text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                    >
                      Track Status
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-3xl transition-all backdrop-blur-sm"
          >
            ‹
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-3xl transition-all backdrop-blur-sm"
          >
            ›
          </button>

          {/* Dots Navigation */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-3 rounded-full transition-all shadow-md ${index === currentSlide ? 'bg-yellow-500 w-10' : 'bg-white/60 w-3 hover:bg-white/80'
                  }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ========== SECTION 2: KEY STATISTICS ========== */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#003366] uppercase tracking-wide">
              Key Statistics
            </h2>
            <div className="w-24 h-1 bg-yellow-500 mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 text-center border-2 border-blue-100 shadow-lg hover:shadow-xl transition-shadow">
              <p className="text-5xl md:text-6xl font-bold text-[#003366] mb-4">5,230+</p>
              <p className="text-base md:text-lg font-semibold text-gray-600 uppercase tracking-wide">Grievances Resolved</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 text-center border-2 border-green-100 shadow-lg hover:shadow-xl transition-shadow">
              <p className="text-5xl md:text-6xl font-bold text-green-700 mb-4">15</p>
              <p className="text-base md:text-lg font-semibold text-gray-600 uppercase tracking-wide">Departments Connected</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-8 text-center border-2 border-orange-100 shadow-lg hover:shadow-xl transition-shadow">
              <p className="text-5xl md:text-6xl font-bold text-orange-600 mb-4">48hrs</p>
              <p className="text-base md:text-lg font-semibold text-gray-600 uppercase tracking-wide">Avg. Response Time</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 text-center border-2 border-purple-100 shadow-lg hover:shadow-xl transition-shadow">
              <p className="text-5xl md:text-6xl font-bold text-purple-700 mb-4">92%</p>
              <p className="text-base md:text-lg font-semibold text-gray-600 uppercase tracking-wide">Citizen Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 3: CONNECTED DEPARTMENTS ========== */}
      <section className="py-20 bg-gray-50 border-t border-gray-200">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#003366] uppercase tracking-wide">
              Connected Departments
            </h2>
            <div className="w-24 h-1 bg-yellow-500 mx-auto mt-4"></div>
            <p className="text-lg text-gray-600 mt-4">Your grievance will be automatically routed to the right department</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {departments.map((dept, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl border-2 border-gray-200 text-center font-semibold text-gray-700 hover:border-[#003366] hover:text-[#003366] hover:shadow-lg transition-all cursor-default"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-[#003366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-sm md:text-base">{dept}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SECTION 4: GRIEVANCE REDRESSAL PROCESS ========== */}
      <section className="py-20 bg-white border-t border-gray-200">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#003366] uppercase tracking-wide">
              Grievance Redressal Process
            </h2>
            <div className="w-24 h-1 bg-yellow-500 mx-auto mt-4"></div>
            <p className="text-lg text-gray-600 mt-4">Simple 4-step process for quick resolution</p>
          </div>

          <div className="relative">
            {/* Connection Line - Desktop only */}
            <div className="hidden lg:block absolute top-20 left-[15%] right-[15%] h-1 bg-gray-200 z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative z-10">
              {[
                { step: '1', title: 'Submit Complaint', desc: 'Select category, describe issue, and upload supporting documents', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                { step: '2', title: 'AI Assessment', desc: 'Automatic priority classification and department routing by AI', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
                { step: '3', title: 'Action Taken', desc: 'Assigned officer investigates and takes necessary action', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
                { step: '4', title: 'Resolution', desc: 'Issue resolved and citizen notified with complete details', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center bg-white p-6 rounded-xl">
                  <div className="w-20 h-20 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-3xl mb-6 shadow-xl ring-4 ring-white relative z-10">
                    {s.step}
                  </div>
                  <div className="w-12 h-12 mb-4 text-[#003366]">
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon} />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
                  <p className="text-base text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 5: IMPORTANT NOTICE ========== */}
      <section className="py-20 bg-amber-50 border-t border-amber-200">
        <div className="max-w-[1000px] mx-auto px-8">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-amber-300 overflow-hidden">
            <div className="bg-[#003366] text-white py-5 px-8 flex items-center gap-4">
              <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide">Important Notice</h2>
            </div>
            <div className="p-8 md:p-10">
              <h3 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b-2 border-gray-200">
                Issues NOT treated as Grievances:
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                {notGrievances.map((item, index) => (
                  <li key={index} className="flex items-start gap-4 text-base md:text-lg text-gray-700">
                    <span className="text-red-500 font-bold text-2xl leading-none">×</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-amber-100 border-l-4 border-amber-600 p-5 rounded-r-lg">
                <p className="text-base text-amber-900">
                  <strong>Note:</strong> RTI requests and Court matters must be addressed through their designated independent legal channels.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 6: CALL TO ACTION ========== */}
      <section className="py-20 bg-gradient-to-br from-[#003366] via-[#004080] to-[#002244] text-white">
        <div className="max-w-[1200px] mx-auto px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to File a Complaint?</h2>
          <p className="text-xl text-blue-200 mb-12 max-w-2xl mx-auto">
            Submit your grievance online and track its progress in real-time. Our AI-powered system ensures quick resolution.
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            <Link
              href="/lodge-grievance"
              className="bg-yellow-500 hover:bg-yellow-400 text-[#003366] font-bold py-5 px-14 rounded-xl text-xl shadow-xl transform hover:-translate-y-1 transition-all"
            >
              Lodge New Grievance
            </Link>
            <Link
              href="/track-status"
              className="bg-transparent border-3 border-white hover:bg-white hover:text-[#003366] text-white font-bold py-5 px-14 rounded-xl text-xl shadow-xl transform hover:-translate-y-1 transition-all"
              style={{ borderWidth: '3px' }}
            >
              Track Application Status
            </Link>
          </div>
        </div>
      </section>

      {/* ========== SECTION 7: PORTAL INFO ========== */}
      <section className="py-16 bg-gray-100 border-t border-gray-300">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* About */}
            <div>
              <h3 className="text-xl font-bold text-[#003366] mb-4 uppercase">About Civic Sense Portal</h3>
              <p className="text-gray-600 leading-relaxed">
                An AI-powered public grievance redressal system designed to provide transparent, efficient, and citizen-friendly complaint resolution across multiple government departments.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold text-[#003366] mb-4 uppercase">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link href="/" className="text-gray-600 hover:text-[#003366] transition-colors">Home</Link></li>
                <li><Link href="/lodge-grievance" className="text-gray-600 hover:text-[#003366] transition-colors">Lodge Grievance</Link></li>
                <li><Link href="/track-status" className="text-gray-600 hover:text-[#003366] transition-colors">Track Status</Link></li>
                <li><Link href="/help" className="text-gray-600 hover:text-[#003366] transition-colors">Help & FAQ</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-xl font-bold text-[#003366] mb-4 uppercase">Contact Us</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#003366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  support@civicsense.gov.in
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#003366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Toll-Free: 1800-XXX-XXXX
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#003366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mon-Fri: 9:00 AM - 6:00 PM
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#003366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  New Delhi, India
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
