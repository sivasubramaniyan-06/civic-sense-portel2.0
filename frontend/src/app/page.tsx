'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

// Icons using SVG for professional look
const Icons = {
  govt: <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  warning: <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  process: <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  routing: <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
  track: <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  scale: <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
  ai: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
  flash: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  camera: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  chart: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>,
};

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { title: 'Citizen-Centric Governance', subtitle: 'Connecting Citizens with Government – Your Voice, Our Priority', icon: Icons.govt, bg: 'slide-bg-1' },
    { title: 'Matter NOT Treated as Grievances', subtitle: 'RTI matters, Court cases, Religious matters, Suggestions, Govt Employee service matters', icon: Icons.warning, bg: 'slide-bg-2' },
    { title: 'Redress Process Flow', subtitle: 'Complaint → Assessment → Department Routing → Resolution → Closure', icon: Icons.process, bg: 'slide-bg-3' },
    { title: 'Automated Department Routing', subtitle: 'PWD, Health, Transport, Education, Municipal, Revenue – AI-assisted assignment', icon: Icons.routing, bg: 'slide-bg-4' },
    { title: 'Track and Monitor Your Grievance', subtitle: 'Real-time status updates with complete timeline visibility', icon: Icons.track, bg: 'slide-bg-5' },
    { title: 'Appeal Mechanism', subtitle: 'Not satisfied? Raise appeal to Nodal Appellate Authority', icon: Icons.scale, bg: 'slide-bg-6' }
  ];

  const nextSlide = useCallback(() => setCurrentSlide((prev) => (prev + 1) % slides.length), [slides.length]);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  const goToSlide = (index: number) => setCurrentSlide(index);

  useEffect(() => {
    const interval = setInterval(nextSlide, 4500);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const features = [
    { icon: Icons.ai, title: 'AI-Based Classification', desc: 'Automatic categorization using intelligent keywords' },
    { icon: Icons.flash, title: 'Priority-Based Redressal', desc: 'Critical issues are flagged and fast-tracked' },
    { icon: Icons.process, title: 'Duplicate Prevention', desc: 'Smart detection prevents similar complaints' },
    { icon: Icons.camera, title: 'Image-Supported', desc: 'Upload photo evidence with complaints' },
    { icon: Icons.chart, title: 'Transparent Tracking', desc: 'Real-time status with timeline visibility' }
  ];

  const departments = ['Public Works Department', 'Municipal Corporation', 'Health Department', 'Transport Department', 'Education Department', 'Revenue Department', 'Electricity Board', 'Water Supply'];
  const notGrievances = ['RTI (Right to Information) matters', 'Court-related / Sub-judice matters', 'Religious matters', 'Mere suggestions without specific grievance', 'Service matters of Government employees'];

  return (
    <div className="landing-page font-sans text-gray-800">
      {/* Hero Slider */}
      <section className="hero-slider relative h-[500px] overflow-hidden bg-[#003366] text-white">
        <div className="slider-container h-full">
          {slides.map((slide, index) => (
            <div key={index} className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex items-center justify-center ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
              <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-bold leading-tight">{slide.title}</h1>
                  <p className="text-lg md:text-xl text-blue-100">{slide.subtitle}</p>
                  <div className="flex gap-4 mt-6">
                    <Link href="/lodge-grievance" className="bg-yellow-500 hover:bg-yellow-400 text-[#003366] font-bold py-3 px-8 rounded-lg transition-colors">
                      Lodge Grievance
                    </Link>
                    <Link href="/track-status" className="bg-transparent border-2 border-white hover:bg-white hover:text-[#003366] text-white font-bold py-3 px-8 rounded-lg transition-colors">
                      Track Status
                    </Link>
                  </div>
                </div>
                <div className="hidden md:flex justify-center text-blue-200 opacity-80">
                  <div className="transform scale-150">{slide.icon}</div>
                </div>
              </div>
            </div>
          ))}

          <button className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 text-white opacity-50 hover:opacity-100 text-4xl p-2" onClick={prevSlide}>‹</button>
          <button className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 text-white opacity-50 hover:opacity-100 text-4xl p-2" onClick={nextSlide}>›</button>

          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, index) => (
              <button key={index} className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? 'bg-yellow-500' : 'bg-white bg-opacity-30'}`} onClick={() => goToSlide(index)} />
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-[#003366] mb-12 uppercase tracking-wide">Key Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { num: '5,230+', label: 'Grievances Resolved' },
              { num: '15', label: 'Departments Connected' },
              { num: '48hrs', label: 'Avg. Response Time' },
              { num: '92%', label: 'Citizen Satisfaction' }
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 bg-gray-50 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-[#003366] mb-1">{stat.num}</div>
                <div className="text-sm font-medium text-gray-600 uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-[#003366] mb-12 uppercase tracking-wide">Connected Departments</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {departments.map((dept, index) => (
              <div key={index} className="bg-white p-4 rounded border border-gray-200 text-center text-sm font-semibold text-gray-700 hover:border-[#003366] hover:text-[#003366] transition-colors cursor-default">
                {dept}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-[#003366] mb-12 uppercase tracking-wide">Grievance Redressal Process</h2>
          <div className="flex flex-col md:flex-row justify-between items-center relative gap-8">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 hidden md:block -z-0"></div>
            {[
              { step: '1', title: 'Submit Complaint', desc: 'Select category & describe issue' },
              { step: '2', title: 'AI Assessment', desc: 'Auto-routing & priority check' },
              { step: '3', title: 'Action Taken', desc: 'Officer resolves the issue' },
              { step: '4', title: 'Resolution', desc: 'Issue closed & notified' }
            ].map((s, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center bg-white p-4 max-w-xs">
                <div className="w-12 h-12 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-lg mb-4 shadow-lg ring-4 ring-white">
                  {s.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notices */}
      <section className="py-16 bg-blue-50 border-t border-blue-100">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 overflow-hidden max-w-4xl mx-auto">
            <div className="bg-blue-600 text-white py-3 px-6 font-bold uppercase tracking-wide text-sm flex items-center gap-2">
              <span>⚠️</span> Important Notice
            </div>
            <div className="p-8">
              <h3 className="font-bold text-gray-800 mb-4 text-lg border-b pb-2">Issues NOT treated as Grievances:</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {notGrievances.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-500 font-bold">✗</span> {item}
                  </li>
                ))}
              </ul>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 text-sm text-amber-800">
                <strong>Note:</strong> RTI requests and Court matters must be addressed through their designated independent legal channels.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 bg-[#003366] text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-8">Ready to File a Complaint?</h2>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/lodge-grievance" className="bg-yellow-500 hover:bg-yellow-400 text-[#003366] font-bold py-4 px-8 rounded-lg shadow-lg transform hover:-translate-y-1 transition-all">
              Lodge New Grievance
            </Link>
            <Link href="/track-status" className="bg-transparent border-2 border-white hover:bg-white hover:text-[#003366] text-white font-bold py-4 px-8 rounded-lg shadow-lg transform hover:-translate-y-1 transition-all">
              Track Application Status
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
