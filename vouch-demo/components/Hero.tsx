'use client'

import React from 'react';
import { ArrowRight, ShieldCheck, Landmark } from 'lucide-react';
import Link from 'next/link';

const Hero = () => {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 relative overflow-hidden -mt-4 text-white">
      {/* Premium Knowledge/Trust Network SVG Background */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 1920 1080" 
        preserveAspectRatio="xMidYMid slice"
        style={{ background: 'linear-gradient(135deg, #000000 0%, #050508 50%, #000000 100%)' }}
      >
        <defs>
          {/* Gradient for orbital rings */}
          <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#374151', stopOpacity: 0.1 }} />
            <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: '#374151', stopOpacity: 0.1 }} />
          </linearGradient>
          
          {/* Glow effect for central node */}
          <radialGradient id="shieldGlow">
            <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.8 }} />
            <stop offset="50%" style={{ stopColor: '#6366f1', stopOpacity: 0.4 }} />
            <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0 }} />
          </radialGradient>
          
          {/* Node glows */}
          <radialGradient id="nodeGlow1">
            <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 0 }} />
          </radialGradient>
          
          <radialGradient id="nodeGlow2">
            <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        
        {/* Central trust hub glow */}
        <circle cx="960" cy="540" r="30" fill="url(#shieldGlow)" opacity="0.5" />
        <circle cx="960" cy="540" r="8" fill="#8b5cf6" opacity="1" />
        
        {/* Orbital rings */}
        <circle cx="960" cy="540" r="300" fill="none" stroke="#6b7280" strokeWidth="1.5" opacity="0.2" />
        <circle cx="960" cy="540" r="450" fill="none" stroke="#4b5563" strokeWidth="1.5" opacity="0.18" />
        <circle cx="960" cy="540" r="650" fill="none" stroke="#6b7280" strokeWidth="1.2" opacity="0.12" />
        <circle cx="960" cy="540" r="900" fill="none" stroke="#4b5563" strokeWidth="1" opacity="0.1" />
        <circle cx="960" cy="540" r="1200" fill="none" stroke="#6b7280" strokeWidth="1" opacity="0.08" />
        
        {/* Connecting node lines */}
        <line x1="960" y1="540" x2="1260" y2="540" stroke="#6366f1" strokeWidth="1" opacity="0.15" />
        <circle cx="1260" cy="540" r="4" fill="#6366f1" opacity="0.8" />
        <circle cx="1260" cy="540" r="8" fill="url(#nodeGlow1)" opacity="0.3" />
        
        <line x1="960" y1="540" x2="960" y2="120" stroke="#8b5cf6" strokeWidth="1" opacity="0.15" />
        <circle cx="960" cy="120" r="5" fill="#8b5cf6" opacity="0.7" />
        <circle cx="960" cy="120" r="10" fill="url(#nodeGlow2)" opacity="0.3" />
        
        <line x1="960" y1="540" x2="540" y2="760" stroke="#a855f7" strokeWidth="1" opacity="0.15" />
        <circle cx="540" cy="760" r="3.5" fill="#a855f7" opacity="0.9" />
        
        <line x1="960" y1="540" x2="1380" y2="960" stroke="#6366f1" strokeWidth="1" opacity="0.12" />
        <circle cx="1380" cy="960" r="4" fill="#6366f1" opacity="0.6" />
        
        <line x1="960" y1="540" x2="260" y2="340" stroke="#8b5cf6" strokeWidth="1" opacity="0.12" />
        <circle cx="260" cy="340" r="5" fill="#8b5cf6" opacity="0.7" />
        
        {/* Floating background particles */}
        <circle cx="700" cy="300" r="3" fill="#6366f1" opacity="0.5" />
        <circle cx="1200" cy="800" r="3.5" fill="#8b5cf6" opacity="0.4" />
        <circle cx="450" cy="950" r="2.5" fill="#a855f7" opacity="0.6" />
        <circle cx="1500" cy="200" r="4" fill="#6366f1" opacity="0.3" />
      </svg>
              
      {/* Content overlay */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        {/* Trust Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-purple-950/30 border border-purple-500/20 text-purple-400 text-xs font-semibold font-mono mb-8">
          <ShieldCheck className="w-4 h-4" />
          <span>Protected by Vouch Escrow SDK</span>
        </div>

        {/* Headline */}
        <div className="mb-6">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Escrow Payments,{' '}
            <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              Secured
            </span>
          </h1>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mt-2">
            A{' '}
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 sm:px-4 py-1.5 rounded-xl inline-block transform -rotate-1 shadow-lg shadow-purple-500/20">
              Freelance Portal
            </span>
            {' '}with Protected Payouts
          </h1>
        </div>
        
        {/* Subtitle */}
        <p className="text-gray-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-12 font-light">
          Lock milestone budgets in secure virtual bank accounts instantly. Hire talent and deliver work without the risk of non-payment.
        </p>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link 
            href="/auth"
            className="group flex items-center gap-2 px-8 sm:px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-[8px_8px_20px_rgba(0,0,0,0.3)] hover:shadow-[4px_4px_12px_rgba(99,102,241,0.2)] border border-indigo-500/20"
          >
            <span>Get Started</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/auth"
            className="flex items-center gap-2 px-8 sm:px-10 py-4 bg-black/20 backdrop-blur-sm text-gray-300 rounded-full font-bold text-base sm:text-lg border border-white/10 hover:border-white/30 hover:text-white transition-all duration-300 transform hover:scale-105"
          >
            <Landmark className="w-5 h-5" />
            <span>View Escrow Ledger</span>
          </Link>
        </div>
      </div>
      
      <div className="pb-16 sm:pb-24"></div>
    </main>
  );
};

export default Hero;