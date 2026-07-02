'use client';
import React, { useState, useEffect } from 'react';
import { LogOut, User, RefreshCw, Layers } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { BuyerPanel } from '@/components/BuyerPanel';
import { FreelancerPanel } from '@/components/FreelancerPanel';

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('current_user');
    if (!session) {
      window.location.href = '/auth';
    } else {
      setCurrentUser(JSON.parse(session));
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('current_user');
    window.location.href = '/auth';
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
      <div className="flex">
        {/* Sidebar */}
        <Sidebar onLogout={handleLogout} />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-6 sm:p-8 lg:p-10 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {/* Header Greeting */}
            <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5">
                  Welcome back, {currentUser.name}!
                </h1>
                <p className="text-sm text-gray-400">
                  Manage your secure escrow agreements protected by Vouch SDK
                </p>
              </div>

              {/* User profile pill */}
              <div className="flex items-center gap-3 bg-[#0a0a0c] border border-white/5 px-4 py-2 rounded-full">
                <div className="w-6.5 h-6.5 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-mono font-semibold tracking-wide text-gray-300">
                  {currentUser.role}
                </span>
              </div>
            </div>

            {/* Dashboard Panels */}
            {currentUser.role === 'BUYER' ? (
              <BuyerPanel currentUser={currentUser} />
            ) : (
              <FreelancerPanel currentUser={currentUser} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;