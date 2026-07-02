'use client';
import React, { useState, useEffect } from 'react';
import { Briefcase, Receipt, Star, Clock, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { StatementModal } from './StatementModal';

interface FreelancerPanelProps {
  currentUser: { email: string; name: string; role: string };
}

export const FreelancerPanel: React.FC<FreelancerPanelProps> = ({ currentUser }) => {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
    loadAgreements();
  }, []);

  return (
    <div className="space-y-6 text-white font-sans">
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
