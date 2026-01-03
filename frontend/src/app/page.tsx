'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

export default function Home() {
  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Citizen-Centric Governance',
      subtitle: 'Connecting Citizens with Government – Your Voice, Our Priority',
      icon: '🏛️',
      bg: 'slide-bg-1'
    },
    {
      title: 'Following are NOT treated as Grievances',
      subtitle: 'RTI matters, Court cases, Religious matters, Suggestions, Govt Employee service matters',
      icon: '⚠️',
      bg: 'slide-bg-2'
    },
    {
      title: 'Redress Process Flow',
      subtitle: 'Complaint → Assessment → Department Routing → Resolution → Closure',
      icon: '📋',
      bg: 'slide-bg-3'
    },
    {
      title: 'Automated Department Routing',
      subtitle: 'PWD, Health, Transport, Education, Municipal, Revenue – AI-assisted assignment',
      icon: '🏢',
      bg: 'slide-bg-4'
    },
    {
      title: 'Track and Monitor Your Grievance',
      subtitle: 'Real-time status updates with complete timeline visibility',
      icon: '🔍',
      bg: 'slide-bg-5'
    },
    {
      title: 'Appeal Mechanism',
      subtitle: 'Not satisfied? Raise appeal to Nodal Appellate Authority',
      icon: '⚖️',
      bg: 'slide-bg-6'
    }
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-slide every 4.5 seconds
  useEffect(() => {
    const interval = setInterval(nextSlide, 4500);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const features = [
    { icon: '🤖', title: 'AI-Based Classification', desc: 'Automatic categorization using intelligent keyword analysis' },
    { icon: '⚡', title: 'Priority-Based Redressal', desc: 'Critical issues are flagged and fast-tracked' },
    { icon: '🔍', title: 'Duplicate Prevention', desc: 'Smart detection prevents similar complaints' },
    { icon: '📸', title: 'Image-Supported', desc: 'Upload photo evidence with complaints' },
    { icon: '📊', title: 'Transparent Tracking', desc: 'Real-time status with timeline visibility' }
  ];

  const departments = [
    'Public Works Department (PWD)',
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
      {/* Hero Slider Section */}
      <section className="hero-slider">
        <div className="slider-container">
          {/* Slides */}
          <div className="slides-wrapper">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`slide ${index === currentSlide ? 'active' : ''} ${slide.bg}`}
              >
                <div className="slide-content">
                  <div className="slide-text">
                    <h1>{slide.title}</h1>
                    <p>{slide.subtitle}</p>
                    <div className="slide-buttons">
                      <Link href="/lodge-grievance" className="btn-gov-primary">
                        Lodge Grievance
                      </Link>
                      <Link href="/track-status" className="btn-gov-secondary">
                        Track Status
                      </Link>
                    </div>
                  </div>
                  <div className="slide-icon">
                    <span>{slide.icon}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button className="slider-arrow slider-arrow-left" onClick={prevSlide}>
            ‹
          </button>
          <button className="slider-arrow slider-arrow-right" onClick={nextSlide}>
            ›
          </button>

          {/* Dots Navigation */}
          <div className="slider-dots">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Key Statistics Section */}
      <section className="stats-section">
        <div className="gov-container">
          <h2 className="section-title">Key Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">5,230+</div>
              <div className="stat-label">Grievances Resolved</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">15</div>
              <div className="stat-label">Departments Connected</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">48hrs</div>
              <div className="stat-label">Avg. Response Time</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">92%</div>
              <div className="stat-label">Citizen Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Department Routing Section */}
      <section className="departments-section">
        <div className="gov-container">
          <h2 className="section-title">Connected Departments</h2>
          <div className="departments-grid">
            {departments.map((dept, index) => (
              <div key={index} className="department-card">
                <span className="dept-icon">🏢</span>
                <span className="dept-name">{dept}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="gov-container">
          <h2 className="section-title">Grievance Redressal Process</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Submit Complaint</h3>
              <p>Select category &amp; describe your issue</p>
            </div>
            <div className="step-connector"></div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>AI Assessment</h3>
              <p>Priority assigned &amp; routed to department</p>
            </div>
            <div className="step-connector"></div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Department Action</h3>
              <p>Assigned officer investigates &amp; resolves</p>
            </div>
            <div className="step-connector"></div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Resolution</h3>
              <p>Issue resolved &amp; citizen notified</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Civic Sense Portal Section */}
      <section className="features-section">
        <div className="gov-container">
          <h2 className="section-title">Why Civic Sense Portal?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notice Section */}
      <section className="notice-section">
        <div className="gov-container">
          <div className="notice-box">
            <h2>⚠️ IMPORTANT NOTICE</h2>
            <h3>Following are NOT treated as Grievances</h3>
            <ul>
              {notGrievances.map((item, index) => (
                <li key={index}>
                  <span className="notice-x">✗</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="notice-footer">
              For RTI requests, please visit the designated RTI portal. Court matters should be
              addressed through appropriate legal channels.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="quick-actions-section">
        <div className="gov-container">
          <div className="quick-actions-grid">
            <Link href="/lodge-grievance" className="quick-action-card">
              <div className="quick-action-icon">📝</div>
              <h3>Lodge New Grievance</h3>
              <p>Submit your complaint with AI assistance</p>
            </Link>
            <Link href="/track-status" className="quick-action-card">
              <div className="quick-action-icon">🔎</div>
              <h3>Track Your Complaint</h3>
              <p>Check status using Complaint ID</p>
            </Link>
            <Link href="/help" className="quick-action-card">
              <div className="quick-action-icon">❓</div>
              <h3>Help & FAQ</h3>
              <p>Get answers to common questions</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
