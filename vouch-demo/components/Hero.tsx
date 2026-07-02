'use client'

import React, { useState } from 'react';
import { Brain, ArrowRight, Sparkles } from 'lucide-react';

const Hero = () => {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const openSignupModal = () => {
    setIsSignupModalOpen(true);
    document.body.style.overflow = 'hidden'; 
  };

  const closeSignupModal = () => {
    setIsSignupModalOpen(false);
    document.body.style.overflow = 'unset';
  };

  return (
    <>
      <main className="min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 relative overflow-hidden -mt-4">
        {/* Knowledge Network SVG Background */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 1920 1080" 
          preserveAspectRatio="xMidYMid slice"
          style={{ background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)' }}
        >
          <defs>
            {/* Gradient for orbital rings */}
            <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#374151', stopOpacity: 0.1 }} />
              <stop offset="50%" style={{ stopColor: '#6b7280', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#374151', stopOpacity: 0.1 }} />
            </linearGradient>
            
            {/* Glow effect for center brain */}
            <radialGradient id="brainGlow">
              <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.6 }} />
              <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0 }} />
            </radialGradient>
            
            {/* Knowledge node glows */}
            <radialGradient id="nodeGlow1">
              <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 0 }} />
            </radialGradient>
            
            <radialGradient id="nodeGlow2">
              <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0 }} />
            </radialGradient>
          </defs>
          
          {/* Central brain hub glow */}
          <circle 
            cx="960" 
            cy="540" 
            r="30" 
            fill="url(#brainGlow)" 
            opacity="0.5"
          />
          
          {/* Central brain hub */}
          <circle 
            cx="960" 
            cy="540" 
            r="8" 
            fill="#6366f1" 
            opacity="1"
          />
          
          {/* Knowledge network rings */}
          <circle cx="960" cy="540" r="300" fill="none" stroke="#6b7280" strokeWidth="2" opacity="0.25" />
          <circle cx="960" cy="540" r="420" fill="none" stroke="#4b5563" strokeWidth="2" opacity="0.22" />
          <circle cx="960" cy="540" r="580" fill="none" stroke="#6b7280" strokeWidth="2" opacity="0.2" />
          <circle cx="960" cy="540" r="780" fill="none" stroke="#4b5563" strokeWidth="2" opacity="0.18" />
          <circle cx="960" cy="540" r="1000" fill="none" stroke="#6b7280" strokeWidth="2" opacity="0.15" />
          <circle cx="960" cy="540" r="1250" fill="none" stroke="#4b5563" strokeWidth="2" opacity="0.12" />
          <circle cx="960" cy="540" r="1500" fill="none" stroke="#6b7280" strokeWidth="2" opacity="0.1" />
          <circle cx="960" cy="540" r="1800" fill="none" stroke="#4b5563" strokeWidth="2" opacity="0.08" />
          
          {/* Knowledge nodes scattered across network */}
          {/* Brain nodes with connecting lines */}
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
          
          <line x1="960" y1="540" x2="1660" y2="740" stroke="#a855f7" strokeWidth="1" opacity="0.1" />
          <circle cx="1660" cy="740" r="3" fill="#a855f7" opacity="0.5" />
          
          {/* Additional floating nodes */}
          <circle cx="700" cy="300" r="3" fill="#6366f1" opacity="0.6" />
          <circle cx="1200" cy="800" r="3.5" fill="#8b5cf6" opacity="0.5" />
          <circle cx="450" cy="950" r="2.5" fill="#a855f7" opacity="0.7" />
          <circle cx="1500" cy="200" r="4" fill="#6366f1" opacity="0.4" />
        </svg>
                
        {/* Content overlay */}
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="mb-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Your Knowledge,{' '}
              <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
                Multiplied
              </span>
            </h1>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mt-2">
              A{' '}
              <span className="bg-gradient-to-r from-purple-600 to-purple-600 text-white px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl inline-block transform -rotate-1">
                Marketplace
              </span>
              {' '}of AI Brains
            </h1>
          </div>
          
          <div className="space-y-4 mb-10">
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto font-light">
              Train your AI on anything. Share it with the world.
            </p>
            <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto">
              <span className="font-semibold text-white">Plica</span> lets you create personalized AI assistants trained on your documents, then publish them for others to use.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-row gap-3 sm:gap-4 items-center justify-center">
          <button 
            onClick={openSignupModal}
            className="group flex items-center gap-2 px-6 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-purple-600 text-white rounded-full font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-[8px_8px_20px_rgba(0,0,0,0.3),-8px_-8px_20px_rgba(99,102,241,0.1)] hover:shadow-[4px_4px_12px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(99,102,241,0.2)] active:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.3),inset_-6px_-6px_12px_rgba(99,102,241,0.1)] border border-indigo-500/20 hover:from-indigo-700 hover:to-purple-700"
          >
            <span>Get Started</span>
            <ArrowRight size={16} />
          </button>

          <button className="flex items-center gap-2 px-6 sm:px-10 py-3 sm:py-4 bg-black/5 backdrop-blur-sm text-white rounded-full font-semibold text-base sm:text-lg border-2 border-white/20 transition-all duration-300 transform hover:scale-105 shadow-[8px_8px_20px_rgba(0,0,0,0.4),-8px_-8px_20px_rgba(255,255,255,0.02)] hover:shadow-[4px_4px_12px_rgba(0,0,0,0.6),-4px_-4px_12px_rgba(255,255,255,0.05)] active:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.3),inset_-6px_-6px_12px_rgba(255,255,255,0.02)] hover:border-white/40 hover:bg-white/10">
            <span>Browse Marketplace</span>
          </button>
        </div>
        
        <div className="pb-12 sm:pb-16"></div>
      </main>

      {isSignupModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeSignupModal}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-purple-500/20" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-4">Join Plica</h2>
            <p className="text-gray-300 mb-6">Start building your AI knowledge marketplace today.</p>
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4 focus:outline-none focus:border-purple-500"
            />
            <button className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all">
              Get Early Access
            </button>
            <button onClick={closeSignupModal} className="w-full mt-3 text-gray-400 hover:text-white transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Hero;