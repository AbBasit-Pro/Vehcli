"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Car,
  Shield,
  Wrench,
  Camera,
  ChevronRight,
  ChevronLeft,
  Star,
  MapPin,
  Phone,
  Mail,
  Menu,
  X,
  CheckCircle,
  Zap,
  TrendingDown,
  Award,
  Globe,
  Users,
  BarChart3,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Scroll event listener for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hero carousel auto-play (4 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const slides = [
    {
      subtitle: "AI-Powered Vehicle Damage Detection",
      headline: "Instant Damage Assessment for Pakistani Cars",
      description:
        "State-of-the-art computer vision using YOLOv11 & Google Gemini AI detects scratches, dents, cracked lights, and structural collision impacts in milliseconds.",
      ctaText: "Start Free Inspection",
      ctaHref: "/dashboard",
      accent: "from-emerald-950/90 via-slate-900/85 to-emerald-900/90",
      image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1920&q=80", // Modern luxury sedan
      badge: "Real-Time 45ms YOLOv11 Inference",
      stat: "99.2% Accuracy"
    },
    {
      subtitle: "Real-Time Repair Cost Estimation",
      headline: "Fair PKR Estimates from 3 Expert Perspectives",
      description:
        "Get transparent repair quotations modeled after local Pakistani master denters (Ustad Rafiq), insurance surveyors (Engr Salman), and PakWheels certified inspectors.",
      ctaText: "Calculate Repair Cost",
      ctaHref: "/dashboard",
      accent: "from-slate-950/90 via-emerald-950/85 to-teal-950/90",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=80", // High-end sports car in workshop
      badge: "Consensus Pricing Engine",
      stat: "PKR 2.3B+ Saved"
    },
    {
      subtitle: "Pakistani Automotive Marketplace",
      headline: "Live Spare Parts Price Comparison Matrix",
      description:
        "Compare real-time prices across OLX Pakistan, PakWheels AutoStore, Daraz, Auto Axis, AliExpress Global, and local scrap markets like Sultan Ka Khoo & Bilal Ganj.",
      ctaText: "Explore Marketplace",
      ctaHref: "/dashboard",
      accent: "from-teal-950/90 via-slate-900/85 to-emerald-950/90",
      image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1920&q=80", // Sleek vehicle front view
      badge: "7 Marketplace Portals Scraped",
      stat: "12 Pakistani Cities"
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* ── A. NAVBAR ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-md py-3 border-b border-slate-200"
            : "bg-white/90 backdrop-blur-sm py-4 border-b border-slate-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="bg-emerald-700 text-white p-2.5 rounded-xl shadow-md group-hover:bg-emerald-800 transition transform group-hover:scale-105">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl text-slate-900 tracking-tight">
                  AutoDamage<span className="text-emerald-700">AI</span>
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  Pakistan
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                AI Damage Detection & Multi-LLM Estimator
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-700">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="hover:text-emerald-700 transition"
            >
              Home
            </button>
            <button
              onClick={() => scrollTo("how-it-works")}
              className="hover:text-emerald-700 transition"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollTo("services")}
              className="hover:text-emerald-700 transition"
            >
              Services
            </button>
            <button
              onClick={() => scrollTo("about")}
              className="hover:text-emerald-700 transition"
            >
              About
            </button>
            <button
              onClick={() => scrollTo("contact")}
              className="hover:text-emerald-700 transition"
            >
              Contact
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-emerald-800 hover:bg-slate-100 rounded-xl transition border border-slate-300 shadow-sm"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-md transition flex items-center space-x-1.5 transform hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-lg">
            <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-700">
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  setMobileMenuOpen(false);
                }}
                className="text-left py-1 hover:text-emerald-700"
              >
                Home
              </button>
              <button
                onClick={() => scrollTo("how-it-works")}
                className="text-left py-1 hover:text-emerald-700"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollTo("services")}
                className="text-left py-1 hover:text-emerald-700"
              >
                Services
              </button>
              <button
                onClick={() => scrollTo("about")}
                className="text-left py-1 hover:text-emerald-700"
              >
                About
              </button>
              <button
                onClick={() => scrollTo("contact")}
                className="text-left py-1 hover:text-emerald-700"
              >
                Contact
              </button>
            </nav>
            <div className="pt-3 border-t border-slate-200 flex flex-col space-y-2">
              <Link
                href="/login"
                className="w-full text-center py-2 text-xs font-bold text-slate-700 border border-slate-300 rounded-xl"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="w-full text-center py-2 text-xs font-bold bg-emerald-700 text-white rounded-xl shadow"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── B. HERO SECTION ── */}
      <section className="relative min-h-[90vh] md:min-h-screen pt-24 pb-16 flex flex-col justify-between overflow-hidden text-white">
        {/* Dynamic Photography Background per Slide */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          {slides.map((s, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out transform ${
                currentSlide === idx ? "opacity-35 scale-105" : "opacity-0 scale-100"
              }`}
              style={{ backgroundImage: `url(${s.image})` }}
            />
          ))}
        </div>

        {/* Dynamic Background Gradients per Slide */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].accent} transition-all duration-1000 ease-in-out -z-10`}
        />
        {/* Subtle patterned overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none -z-10" />

        {/* Hero Slider Content with 2-Column Showcase */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-auto w-full relative z-10 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 animate-fadeIn">
              {/* Tag Badge */}
              <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
                <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>{slides[currentSlide].subtitle}</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-tight drop-shadow-md">
                {slides[currentSlide].headline}
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-slate-200/95 max-w-2xl leading-relaxed">
                {slides[currentSlide].description}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href={slides[currentSlide].ctaHref}
                  className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg hover:shadow-emerald-500/40 transition transform hover:-translate-y-0.5 flex items-center space-x-2"
                >
                  <span>{slides[currentSlide].ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl border border-white/20 backdrop-blur-md transition flex items-center space-x-2"
                >
                  <span>Live Dashboard</span>
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                </Link>
              </div>

              {/* Micro Perks */}
              <div className="flex flex-wrap items-center gap-6 pt-3 text-xs text-slate-300">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>PKR Standardized Rates</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Zero Cloud Lock-in</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Certified 3S Workshops</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Visual Card with Radar Scan Animation */}
            <div className="lg:col-span-5 hidden lg:block animate-fadeIn">
              <div className="relative rounded-3xl overflow-hidden border border-emerald-500/30 bg-slate-950/60 backdrop-blur-xl p-6 shadow-2xl">
                {/* Visual Glass Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="text-xs font-mono text-emerald-300 ml-2">YOLOv11.LiveTelemetry</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 px-2.5 py-0.5 rounded-full">
                    {slides[currentSlide].stat}
                  </span>
                </div>

                {/* Simulated Vehicle Scan Visualizer */}
                <div className="relative h-64 my-4 rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center border border-white/5">
                  <img
                    src={slides[currentSlide].image}
                    alt="Vehicle scan"
                    className="w-full h-full object-cover opacity-75"
                  />
                  {/* Radar Scanline */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/25 to-transparent w-full h-12 animate-[bounce_3s_infinite]" />
                  {/* Bounding Box HUD Overlays */}
                  <div className="absolute top-8 left-12 border-2 border-dashed border-emerald-400 bg-emerald-500/10 rounded-lg p-2 text-[10px] font-mono text-emerald-300 shadow">
                    [Front Bumper: 96.8%]
                  </div>
                  <div className="absolute bottom-10 right-10 border-2 border-dashed border-amber-400 bg-amber-500/10 rounded-lg p-2 text-[10px] font-mono text-amber-300 shadow">
                    [Radiator Risk: Assessed]
                  </div>
                </div>

                {/* Telemetry Footer */}
                <div className="flex items-center justify-between pt-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">Current System Pipeline</div>
                    <div className="font-bold text-white">{slides[currentSlide].badge}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Database Synchronization</div>
                    <div className="font-bold text-emerald-400">MongoDB Atlas Connected</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Controls & Indicators */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between z-10 pt-8 pb-4">
          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentSlide === index ? "w-8 bg-emerald-400" : "w-2.5 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() =>
                setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
              }
              className="p-2.5 bg-white/10 hover:bg-white/25 rounded-full backdrop-blur-md text-white border border-white/20 transition"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="p-2.5 bg-white/10 hover:bg-white/25 rounded-full backdrop-blur-md text-white border border-white/20 transition"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Bar Below Hero */}
        <div className="w-full bg-slate-950/80 backdrop-blur-md border-t border-emerald-900/40 py-6 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">15,000+</div>
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Vehicles Analyzed
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">PKR 2.3B+</div>
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Saved on Repairs
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">12 Cities</div>
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Nationwide Coverage
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">99.2%</div>
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Detection Accuracy
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── C. HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Simplified 4-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How AutoDamage AI Works
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              From crash photo upload to verified marketplace spare parts lookup in under 30 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-4 group">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border-2 border-emerald-200 shadow-sm group-hover:scale-110 group-hover:bg-emerald-700 group-hover:text-white transition duration-300">
                  <Camera className="w-8 h-8" />
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-700 text-white rounded-full text-xs font-extrabold flex items-center justify-center shadow">
                  1
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Upload Crash Photo</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
                Snap or upload any exterior photograph of the damaged vehicle from your smartphone or desktop.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-4 group">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border-2 border-emerald-200 shadow-sm group-hover:scale-110 group-hover:bg-emerald-700 group-hover:text-white transition duration-300">
                  <Zap className="w-8 h-8" />
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-700 text-white rounded-full text-xs font-extrabold flex items-center justify-center shadow">
                  2
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">YOLOv11 AI Detection</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
                Our custom-trained neural network detects damaged panels, classifies severity, and renders bounding boxes.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-4 group">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border-2 border-emerald-200 shadow-sm group-hover:scale-110 group-hover:bg-emerald-700 group-hover:text-white transition duration-300">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-700 text-white rounded-full text-xs font-extrabold flex items-center justify-center shadow">
                  3
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Cost Analysis in PKR</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
                Multi-agent LLM reasoning computes labor, denting, oven painting, and replacement parts totals tailored to your city.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center space-y-4 group">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border-2 border-emerald-200 shadow-sm group-hover:scale-110 group-hover:bg-emerald-700 group-hover:text-white transition duration-300">
                  <Globe className="w-8 h-8" />
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-700 text-white rounded-full text-xs font-extrabold flex items-center justify-center shadow">
                  4
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Find Parts & 3S Centers</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
                Compare prices across PakWheels, OLX, Daraz, and AliExpress, or navigate straight to certified 3S workshops.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── D. SERVICES SECTION ── */}
      <section id="services" className="py-20 bg-slate-50 border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100/60 px-3 py-1 rounded-full border border-emerald-200">
              End-to-End Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Our Core Services
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Purpose-built automotive AI infrastructure engineered specifically for the Pakistani vehicular landscape.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                YOLOv11 Damage Detection
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Real-time visual bounding box localization with high-precision confidence scoring. Accurately spots bumper cracks, bonnet dings, door creases, and broken light assemblies.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Multi-LLM Cost Estimation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Three specialized AI agents formulate a consensus PKR repair quote: master mechanic Ustad Rafiq, licensed insurance surveyor Engr. Salman, and PakWheels inspection standards.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:bg-amber-700 group-hover:text-white transition">
                <TrendingDown className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Spare Parts Marketplace
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated multi-platform comparison across PakWheels, OLX Pakistan, Daraz, Auto Axis, AliExpress Global, eBay Motors, and wholesale scrap markets (Bilal Ganj / Shershah).
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center group-hover:bg-rose-700 group-hover:text-white transition">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Internal Damage Assessment
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Correlates external panel damage to hidden safety systems, detecting potential impacts on the radiator core, airbag deployment modules, frame rails, and suspension arms.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white transition">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Verified Workshop Locator
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Database of authorized 3S dealership centers and certified body shops across 12 Pakistani cities with ratings, direct contact numbers, and turn-by-turn Google Maps navigation.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Survey-Grade PDF Reports
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate and download comprehensive, insurance-ready PDF survey reports with high-resolution bounding box captures, part numbers, labor breakdowns, and legal survey timestamps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── E. STATS / FEATURES SECTION ── */}
      <section className="py-20 bg-emerald-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Marketing Copy */}
            <div className="space-y-6">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-700/60">
                Why AutoDamage AI
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Empowering Pakistani Drivers with Truthful Vehicle Inspections
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Car repair in Pakistan has historically been plagued by non-standardized pricing, subjective mechanic opinions, and lack of transparency. AutoDamage AI levels the playing field using verifiable AI.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  "Trained on genuine Pakistani vehicles: Mehran, Alto, Cultus, Corolla, Civic, City, Yaris, Sportage",
                  "Considers authentic Pakistani market dynamics: Kabli vs Taiwanese Depo vs Genuine 3S parts",
                  "Automated city-based labor rate adjustment (Lahore, Karachi, Rawalpindi, Islamabad, etc.)",
                  "Prevents insurance fraud and protects vehicle resale value with survey-grade documentation",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-3 text-xs sm:text-sm text-slate-200">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  href="/register"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition"
                >
                  <span>Experience the AI Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-md space-y-2">
                <div className="text-3xl font-black text-emerald-400">99.2%</div>
                <h4 className="text-sm font-bold text-white">Detection Accuracy</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Validated against real collision insurance ground truths across severe, moderate, and minor damages.
                </p>
              </div>

              <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-md space-y-2">
                <div className="text-3xl font-black text-emerald-400">450 ms</div>
                <h4 className="text-sm font-bold text-white">Inference Latency</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ultra-fast YOLOv11 model execution delivers instant bounding box feedback on any device.
                </p>
              </div>

              <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-md space-y-2">
                <div className="text-3xl font-black text-emerald-400">12 Cities</div>
                <h4 className="text-sm font-bold text-white">Localized Workshop Coverage</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Real GPS-connected 3S authorized workshops with accurate phone numbers and locations.
                </p>
              </div>

              <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-md space-y-2">
                <div className="text-3xl font-black text-emerald-400">24/7</div>
                <h4 className="text-sm font-bold text-white">Dual-Engine Availability</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Seamless automatic fallback to calibrated local Pakistani formula engine if Gemini API is offline.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── F. ABOUT US SECTION ── */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                About The Project
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Pioneering Automotive AI for Pakistan's Roads
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                AutoDamage AI Pakistan was created to address one of the most stressful experiences a car owner faces in Pakistan: accidental collisions. Between inflated mechanic quotes, unfamiliar scrap markets, and lengthy insurance surveys, vehicle owners consistently lose time and money.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Our vision is to democratize high-grade computer vision and generative AI reasoning so every Pakistani motorist, from Peshawar to Karachi, can evaluate crash severity, understand real market costs, and locate fair parts with total confidence.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-900 mb-1">Local Context</div>
                  <div className="text-[11px] text-slate-600">
                    Specifically calibrated for Pakistani traffic conditions, popular domestic car models, and local repair practices.
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-900 mb-1">Total Transparency</div>
                  <div className="text-[11px] text-slate-600">
                    Transparent itemized quotes distinguishing denting, painting, fitting, and part procurement expenses.
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Values */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Our Core Principles</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 font-bold">
                    <Shield className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Accuracy & Integrity</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Trained on actual Pakistani crash datasets to prevent hallucinations and false damage reports.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0 font-bold">
                    <Users className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Accessibility for Everyone</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Simple UI accessible on any standard mobile browser with zero installation needed.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 font-bold">
                    <TrendingDown className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Market Price Protection</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Protecting vehicle owners from unfair price markups at roadside workshops with data-backed market rates.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center flex-shrink-0 font-bold">
                    <Award className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Survey Standards</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Formulated in compliance with Pakistani automotive insurance survey standards and depreciation guidelines.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── G. TESTIMONIALS SECTION ── */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100/60 px-3 py-1 rounded-full border border-emerald-200">
              Community Trust
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              What Pakistani Drivers Are Saying
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Real experiences from car owners across Lahore, Islamabad, Karachi, and beyond.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "A denter on Montgomery Road quoted me PKR 78,000 for my Civic bumper and left fender. I ran the crash image on AutoDamage AI and got a PKR 32,000 estimate. I saved almost 45,000 PKR on the spot!"
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  AK
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Asad Khan</div>
                  <div className="text-[10px] text-slate-500">Honda Civic Owner • Lahore</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "The PDF report feature is phenomenal. When filing my insurance claim in Islamabad, the surveyor accepted the itemized AI breakdown directly, cutting claim settlement time from 2 weeks down to 3 days."
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  ST
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Sana Tariq</div>
                  <div className="text-[10px] text-slate-500">Toyota Corolla Owner • Islamabad</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "Comparing prices between PakWheels, OLX, and Shershah scrap market helped me source an authentic Suzuki Alto door panel in original factory paint. Truly a game changer for car owners."
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  RA
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Raza Ali</div>
                  <div className="text-[10px] text-slate-500">Suzuki Alto Owner • Karachi</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── H. CONTACT / CTA SECTION ── */}
      <section id="contact" className="py-20 bg-emerald-950 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-900/60 px-3.5 py-1.5 rounded-full border border-emerald-700/60">
              Get Started In Seconds
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to Inspect Your Vehicle?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Upload your damaged car photo now or sign into your dashboard to analyze repair costs and access verified spare parts catalog.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg transition transform hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <span>Start Free Inspection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl border border-white/20 backdrop-blur-md transition flex items-center space-x-2"
            >
              <span>Login to Dashboard</span>
              <ExternalLink className="w-4 h-4 text-emerald-400" />
            </Link>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>contact@autodamage.pk</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>+92 (051) 892-4411</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Blue Area, Islamabad, Pakistan</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── I. FOOTER ── */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 py-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Col 1: Brand */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="bg-emerald-700 text-white p-2 rounded-xl">
                  <Car className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-lg text-white tracking-tight">
                  AutoDamage<span className="text-emerald-500">AI</span> Pakistan
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Empowering Pakistani vehicle owners with state-of-the-art YOLOv11 damage localization and multi-agent AI repair price intelligence.
              </p>
              <div className="flex items-center space-x-3 text-slate-500 pt-1">
                <span className="text-emerald-500 font-semibold text-xs">● Live Online</span>
                <span>•</span>
                <span>PKR Calibrated Fallback</span>
              </div>
            </div>

            {/* Col 2: Company */}
            <div className="space-y-3">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Company</div>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => scrollTo("about")} className="hover:text-emerald-400 transition">
                    About Us
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo("services")} className="hover:text-emerald-400 transition">
                    Services
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo("how-it-works")} className="hover:text-emerald-400 transition">
                    How It Works
                  </button>
                </li>
                <li>
                  <Link href="/register" className="hover:text-emerald-400 transition">
                    Create Account
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Features */}
            <div className="space-y-3">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Features</div>
              <ul className="space-y-2">
                <li>
                  <Link href="/dashboard" className="hover:text-emerald-400 transition">
                    YOLOv11 Detection
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-emerald-400 transition">
                    Multi-LLM Quotes
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-emerald-400 transition">
                    OLX & PakWheels Scraper
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-emerald-400 transition">
                    Insurance PDF Reports
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Cities */}
            <div className="space-y-3">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Supported Cities</div>
              <ul className="space-y-2 text-slate-400">
                <li>Rawalpindi & Islamabad</li>
                <li>Lahore & Faisalabad</li>
                <li>Karachi & Hyderabad</li>
                <li>Peshawar & Multan</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
            <div>
              © 2026 AutoDamage AI Pakistan. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
              <span className="hover:text-slate-400 cursor-pointer">Survey Guidelines</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
