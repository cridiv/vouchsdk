'use client';
import React, { useState, useEffect } from 'react';
import { LogOut, User, RefreshCw, Briefcase, ShoppingBag, Plus, Settings, Shield, Menu, X, CheckCircle, ShieldAlert } from 'lucide-react';
import { BuyerPanel } from '@/components/BuyerPanel';
import { FreelancerPanel } from '@/components/FreelancerPanel';
import { Vouch } from '@/lib/vouch-sdk/vouch';
import Image from 'next/image';

const vouch = new Vouch('vouch_e62a93d67ead621439fcb0569e920c8e6988c7b533dc2845', {
  apiUrl: 'http://localhost:5000',
  verifyUrl: 'http://localhost:3001',
});

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'marketplace' | 'my-gigs' | 'settings'>('dashboard');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('current_user');
    if (!session) {
      window.location.href = '/auth';
    } else {
      const parsedUser = JSON.parse(session);
      
      // Fetch latest profile & verification status from SQLite db
      fetch(`/api/auth/profile?email=${encodeURIComponent(parsedUser.email)}`)
        .then(async (res) => {
          if (res.ok) {
            const profileData = await res.json();
            const updatedUser = {
              ...parsedUser,
              isVerified: profileData.isVerified
            };
            localStorage.setItem('current_user', JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
          } else {
            setCurrentUser(parsedUser);
          }
        })
        .catch((err) => {
          console.warn('SQLite Profile failed to load, falling back to session:', err);
          setCurrentUser(parsedUser);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('current_user');
    window.location.href = '/auth';
  };

  const handleVerifyIdentity = () => {
    if (!currentUser) return;
    setVerificationLoading(true);

    vouch.identity.verify(currentUser.email)
      .then(async (result: any) => {
        // Update user verified status in SQLite database via API
        const verifyRes = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email })
        });

        if (!verifyRes.ok) {
          throw new Error('Failed to update verification status in SQLite.');
        }

        const verifyData = await verifyRes.json();

        // Update session user status
        const updatedUser = { ...currentUser, isVerified: true };
        localStorage.setItem('current_user', JSON.stringify(updatedUser));

        setCurrentUser(updatedUser);
        alert('Biometric Identity successfully verified with Vouch! Plica security status: SECURE.');
      })
      .catch((err: any) => {
        if (err?.cancelled) {
          alert('Verification cancelled.');
        } else {
          alert(err?.message || 'Biometric verification failed. Please try again.');
        }
      })
      .finally(() => {
        setVerificationLoading(false);
      });
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center gap-3">
        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
        <span className="text-sm text-gray-400 font-mono">Restoring Plica session...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500 selection:text-white font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-black/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <Image src="/plica_logo.png" alt="Plica Logo" width={32} height={32} className="w-8 h-8" />
              <span className="text-white text-xl font-bold tracking-wider">PLICA</span>
            </div>
            
            <div className="flex items-center gap-1 bg-purple-950/10 border border-purple-500/10 px-2.5 py-0.5 rounded-full text-[10px] text-purple-400 font-mono">
              <Shield className="w-3 h-3" />
              <span>Vouch Protected</span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 ml-4">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-purple-600/10 text-purple-400 border border-purple-500/10'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Projects Escrow
              </button>

              {currentUser.role === 'BUYER' ? (
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeTab === 'marketplace'
                      ? 'bg-purple-600/10 text-purple-400 border border-purple-500/10'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Marketplace
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('my-gigs')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeTab === 'my-gigs'
                      ? 'bg-purple-600/10 text-purple-400 border border-purple-500/10'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  My Services
                </button>
              )}
            </nav>
          </div>

          {/* Right Profile Pill & Menu */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 bg-[#0a0a0c] border border-white/5 hover:border-white/10 px-4 py-2 rounded-full cursor-pointer transition-all active:scale-95"
            >
              <div className="w-6.5 h-6.5 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold text-xs uppercase">
                {currentUser.name.charAt(0)}
              </div>
              <span className="hidden sm:inline text-xs font-medium tracking-wide text-gray-300">
                {currentUser.name}
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                {currentUser.role}
              </span>
            </button>

            {/* Profile Dropdown */}
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-64 bg-[#0a0a0c] border border-white/5 rounded-2xl shadow-2xl p-4 space-y-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="pb-2 border-b border-white/5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</p>
                    <p className="text-sm font-bold text-white mt-1 truncate">{currentUser.name}</p>
                    <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold text-left cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span>Settings</span>
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-xs font-semibold text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
        {activeTab === 'settings' ? (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 flex items-center gap-2">
                <Settings className="w-7 h-7 text-purple-500" />
                <span>Account Settings</span>
              </h1>
              <p className="text-sm text-gray-400">
                Manage your credentials, credentials status and secure liveness settings.
              </p>
            </div>

            {/* Profile Information */}
            <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-bold border-b border-white/5 pb-4">Personal Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={currentUser.name}
                    readOnly
                    className="w-full bg-[#111115] border border-white/5 rounded-xl py-3 px-4 text-gray-400 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Email Address</label>
                  <input
                    type="text"
                    value={currentUser.email}
                    readOnly
                    className="w-full bg-[#111115] border border-white/5 rounded-xl py-3 px-4 text-gray-400 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Platform Role</label>
                  <input
                    type="text"
                    value={currentUser.role === 'BUYER' ? 'Buyer / Client' : 'Freelancer / Service Provider'}
                    readOnly
                    className="w-full bg-[#111115] border border-white/5 rounded-xl py-3 px-4 text-gray-400 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Identity Shielding (Vouch) */}
            <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-purple-400" />
                <h2 className="text-lg font-bold">Biometric Identity Verification</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Plica uses <strong>Vouch Biometric Face Verification</strong> to enforce trust and secure escrow agreements. 
                Verify your identity once using your device camera to protect payouts.
              </p>

              {currentUser.isVerified ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Biometric Identity Linked</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Your identity has been fully verified and linked to your profile via Vouch. Payouts are protected.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400 mt-0.5">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">Verification Required</h3>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        You have not completed biometric identity setup. Buyers and Freelancers will see your status as unverified, and payouts are restricted.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleVerifyIdentity}
                    disabled={verificationLoading}
                    className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-purple-500/10"
                  >
                    {verificationLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Initializing Scanner...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        <span>Verify Identity with Vouch</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-200">
            {currentUser.role === 'BUYER' ? (
              <BuyerPanel currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} />
            ) : (
              <FreelancerPanel currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;