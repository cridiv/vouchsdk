'use client';
import React, { useState, useEffect } from 'react';
import { Briefcase, Receipt, Star, Clock, CheckCircle2, ShieldCheck, RefreshCw, Plus, Sparkles } from 'lucide-react';
import { StatementModal } from './StatementModal';

interface FreelancerPanelProps {
  currentUser: { email: string; name: string; role: string };
  activeTab: 'dashboard' | 'marketplace' | 'my-gigs' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'marketplace' | 'my-gigs' | 'settings') => void;
}

export const GIG_PRESETS = [
  { 
    id: 'dev', 
    name: 'Software Development', 
    icon: '💻', 
    gradient: 'from-[#6366f1] to-[#a855f7]',
    fallbackImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=400&auto=format&fit=crop'
  },
  { 
    id: 'design', 
    name: 'UI/UX Design', 
    icon: '🎨', 
    gradient: 'from-[#ec4899] to-[#f43f5e]',
    fallbackImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=400&auto=format&fit=crop'
  },
  { 
    id: 'writing', 
    name: 'Content Writing', 
    icon: '✍️', 
    gradient: 'from-[#f97316] to-[#eab308]',
    fallbackImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=400&auto=format&fit=crop'
  },
  { 
    id: 'marketing', 
    name: 'Growth Marketing', 
    icon: '🚀', 
    gradient: 'from-[#06b6d4] to-[#3b82f6]',
    fallbackImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop'
  },
];

export const FreelancerPanel: React.FC<FreelancerPanelProps> = ({ currentUser, activeTab, setActiveTab }) => {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myGigs, setMyGigs] = useState<any[]>([]);
  
  // Gig Form State
  const [gigName, setGigName] = useState('');
  const [gigDescription, setGigDescription] = useState('');
  const [gigCategory, setGigCategory] = useState('Software Development');
  const [gigPrice, setGigPrice] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('dev');
  const [gigImageUrl, setGigImageUrl] = useState('');

  // Ledger statement modal states
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [showStatement, setShowStatement] = useState(false);

  const loadAgreements = async () => {
    setLoading(true);
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('agreement_'));
    const localIds = keys.map((k) => k.replace('agreement_', ''));

    if (localIds.length === 0) {
      setAgreements([]);
      setLoading(false);
      return;
    }

    try {
      const fetchPromises = localIds.map(async (id) => {
        try {
          const res = await fetch(`http://localhost:5000/escrow/agreements/${id}`, {
            method: 'GET',
            headers: {
              'x-api-key': 'vouch_e62a93d67ead621439fcb0569e920c8e6988c7b533dc2845',
            },
          });
          if (res.ok) {
            return await res.json();
          }
        } catch {}
        // Fallback to local cache
        const cached = localStorage.getItem(`agreement_${id}`);
        return cached ? JSON.parse(cached) : null;
      });

      const results = await Promise.all(fetchPromises);
      
      // Filter agreements where this freelancer is the seller (sellerExternalId)
      const freelancerJobs = results
        .filter(Boolean)
        .filter((a: any) => a.sellerExternalId === currentUser.email)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
      setAgreements(freelancerJobs);
    } catch (err) {
      console.error('Error loading freelancer agreements:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMyGigs = async () => {
    try {
      const res = await fetch(`/api/gigs?freelancerEmail=${encodeURIComponent(currentUser.email)}`);
      if (res.ok) {
        const data = await res.json();
        setMyGigs(data);
      }
    } catch (err) {
      console.error('Failed to load gigs:', err);
    }
  };

  useEffect(() => {
    loadAgreements();
    loadMyGigs();
  }, [currentUser.email]);

  const handleCreateGig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gigName || !gigDescription || !gigPrice) {
      alert('Please fill out all fields.');
      return;
    }

    const priceNum = parseFloat(gigPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Price must be greater than 0.');
      return;
    }

    const newGig = {
      id: 'gig_' + Math.random().toString(36).substring(2, 9),
      name: gigName,
      description: gigDescription,
      serviceType: gigCategory,
      price: priceNum,
      presetId: selectedPreset,
      freelancerEmail: currentUser.email,
      freelancerName: currentUser.name
    };

    try {
      const res = await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGig)
      });

      if (!res.ok) {
        throw new Error('Failed to save gig to database');
      }

      // Reset Form
      setGigName('');
      setGigDescription('');
      setGigPrice('');
      setSelectedPreset('dev');

      await loadMyGigs();
      alert('Your service gig is live! Buyers can now hire you in the Plica marketplace.');
    } catch (err: any) {
      alert(err.message || 'Error listing gig.');
    }
  };

  if (activeTab === 'my-gigs') {
    return (
      <div className="space-y-10 animate-in fade-in duration-200">
        
        {/* Create Gig form */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 sm:p-8 relative">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>List a New Service (Gig)</span>
          </h2>

          <form onSubmit={handleCreateGig} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Service Name (Title)</label>
                <input
                  type="text"
                  placeholder="e.g. Clean & Modern UI/UX Web Design"
                  value={gigName}
                  onChange={(e) => setGigName(e.target.value)}
                  className="w-full bg-[#111115] border border-white/5 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Starting Rate (₦ / NGN)</label>
                <input
                  type="number"
                  placeholder="15000"
                  value={gigPrice}
                  onChange={(e) => setGigPrice(e.target.value)}
                  className="w-full bg-[#111115] border border-white/5 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50 font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Service Type (Category)</label>
                <select
                  value={gigCategory}
                  onChange={(e) => {
                    setGigCategory(e.target.value);
                    const matchingPreset = GIG_PRESETS.find(p => p.name === e.target.value);
                    if (matchingPreset) setSelectedPreset(matchingPreset.id);
                  }}
                  className="w-full bg-[#111115] border border-white/5 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
                >
                  {GIG_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.name}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Theme Preset Selection */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Card Style Theme</label>
                <div className="grid grid-cols-4 gap-3">
                  {GIG_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(preset.id);
                        setGigCategory(preset.name);
                      }}
                      className={`h-12 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer border ${
                        selectedPreset === preset.id
                          ? 'border-purple-500 bg-purple-500/10 scale-105 shadow-md shadow-purple-500/5'
                          : 'border-white/5 bg-[#111115] opacity-60 hover:opacity-100'
                      }`}
                      title={preset.name}
                    >
                      {preset.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Service Description</label>
              <textarea
                rows={3}
                placeholder="Describe what services you offer, deliverables, timelines, and tools used..."
                value={gigDescription}
                onChange={(e) => setGigDescription(e.target.value)}
                className="w-full bg-[#111115] border border-white/5 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:shadow-purple-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Gig to Marketplace</span>
            </button>
          </form>
        </div>

        {/* List of active gigs created */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Your Active Services</h2>
          {myGigs.length === 0 ? (
            <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-12 text-center text-gray-500 text-sm">
              You haven't listed any services yet. Fill out the form above to add your first gig.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myGigs.map((gig) => {
                const preset = GIG_PRESETS.find(p => p.id === gig.presetId) || GIG_PRESETS[0];
                return (
                  <div
                    key={gig.id}
                    className="bg-[#0a0a0c] border border-white/5 rounded-3xl overflow-hidden hover:border-purple-500/25 transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Gig Card Top Illustration */}
                    <div className={`h-28 bg-gradient-to-br ${preset.gradient} flex items-center justify-center text-4xl relative`}>
                      <span>{preset.icon}</span>
                      <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white">
                        {gig.serviceType}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-bold text-base text-white line-clamp-1">{gig.name}</h3>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{gig.description}</p>
                      </div>

                      <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 font-mono">Rate starts at</span>
                        <span className="font-bold text-purple-400 font-mono text-base">₦{gig.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback: Dashboard
  return (
    <div className="space-y-6 text-white font-sans animate-in fade-in duration-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Assigned Projects & Jobs</h2>
        <button
          onClick={loadAgreements}
          className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
        </div>
      ) : agreements.length === 0 ? (
        <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-12 text-center text-gray-500 text-sm">
          No jobs assigned to your email ({currentUser.email}) yet. Have a buyer hire you to start.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agreements.map((agreement) => {
            const milestone = agreement.milestones?.[0];
            const isDisbursed = milestone?.status === 'DISBURSED';
            const shortfall = Math.max(0, agreement.totalAmount - (agreement.amountReceived ?? 0));

            return (
              <div
                key={agreement.id}
                className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-purple-500/25 transition-all duration-300 relative"
              >
                <div>
                  {/* Header */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-white truncate max-w-[200px]">
                        {milestone?.title.replace('Milestone 1: ', '') || 'Project Job'}
                      </h3>
                      <span className="text-xs text-gray-500 font-mono block mt-0.5">Client: {agreement.buyerExternalId}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                      agreement.status === 'FUNDED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      agreement.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      agreement.status === 'OVERFUNDED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      agreement.status === 'DISBURSED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {agreement.status}
                    </span>
                  </div>

                  {/* Payment Protection status */}
                  <div className="bg-[#111115] border border-white/5 rounded-2xl p-4 space-y-3 mb-5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Milestone Payout:</span>
                      <span className="font-bold font-mono">₦{agreement.totalAmount.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 pt-2.5 border-t border-white/5">
                      {shortfall > 0 ? (
                        <div className="flex items-center gap-1.5 text-xs text-amber-500">
                          <Clock className="w-4 h-4 animate-pulse" />
                          <span>Awaiting Client Escrow Deposit</span>
                        </div>
                      ) : isDisbursed ? (
                        <div className="flex items-center gap-1.5 text-xs text-blue-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Payment Disbursed to Bank</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-green-400">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Escrow Locked & Protected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      setSelectedAgreementId(agreement.id);
                      setShowStatement(true);
                    }}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl text-sm border border-white/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>View Escrow Ledger</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedAgreementId && (
        <StatementModal
          isOpen={showStatement}
          agreementId={selectedAgreementId}
          onClose={() => {
            setShowStatement(false);
            setSelectedAgreementId(null);
          }}
        />
      )}
    </div>
  );
};
