'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Copy, Receipt, Send, ShieldAlert, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { StatementModal } from './StatementModal';

// Web Crypto HMAC-SHA256 Helper
async function generateHmac(body: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(body);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, msgData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface BuyerPanelProps {
  currentUser: { email: string; name: string; role: string };
}

export const BuyerPanel: React.FC<BuyerPanelProps> = ({ currentUser }) => {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [freelancerEmail, setFreelancerEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Ledger statement modal states
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [showStatement, setShowStatement] = useState(false);

  // Load created agreements from localStorage
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
        // Fallback to local cache if offline/backend down
        const cached = localStorage.getItem(`agreement_${id}`);
        return cached ? JSON.parse(cached) : null;
      });

      const results = await Promise.all(fetchPromises);
      setAgreements(results.filter(Boolean).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error('Error loading agreements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgreements();
  }, []);

  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!title || !freelancerEmail || !amount) {
      setError('Please fill in all project fields.');
      setSubmitting(false);
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be greater than 0.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/escrow/agreements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'vouch_e62a93d67ead621439fcb0569e920c8e6988c7b533dc2845',
        },
        body: JSON.stringify({
          buyerExternalId: currentUser.email,
          sellerExternalId: freelancerEmail,
          buyerEmail: currentUser.email,
          buyerName: currentUser.name,
          totalAmount: numAmount,
          milestones: [
            {
              title: `Milestone 1: ${title}`,
              amount: numAmount,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create agreement.');
      }

      // Save ID to local storage so we can load it on reload
      localStorage.setItem(`agreement_${data.agreementId}`, JSON.stringify(data));

      setTitle('');
      setFreelancerEmail('');
      setAmount('');
      await loadAgreements();
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend escrow service.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulatePayment = async (agreement: any, customAmount?: number) => {
    const payAmt = customAmount || agreement.totalAmount;
    
    // Construct real webhook payload structure
    const payload = {
      eventType: 'virtual_account.funded',
      requestId: 'sim-' + Math.random().toString(36).substring(2, 10),
      data: {
        accountNumber: agreement.nombaVirtualAccountNo,
        amount: payAmt * 100, // kobo
        senderName: currentUser.name,
        senderBank: 'Wema Bank',
        senderAccount: '0123456789',
      },
    };

    const rawBody = JSON.stringify(payload);
    
    try {
      const signature = await generateHmac(rawBody, 'NombaHackathon2026');

      const res = await fetch('http://localhost:5000/escrow/webhooks/nomba', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'nomba-signature': signature,
        },
        body: rawBody,
      });

      if (!res.ok) {
        throw new Error('Simulation failed.');
      }

      // Quick delay to allow async reconciliation before reloading
      setTimeout(() => loadAgreements(), 1500);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    }
  };

  const handleReleaseFunds = async (agreementId: string, milestoneId: string) => {
    if (!confirm('Are you sure you want to approve this milestone and release funds to the freelancer?')) return;

    try {
      const res = await fetch(`http://localhost:5000/escrow/agreements/${agreementId}/milestones/${milestoneId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'vouch_e62a93d67ead621439fcb0569e920c8e6988c7b533dc2845',
        },
        body: JSON.stringify({
          externalUserId: currentUser.email,
          sellerAccountNumber: '0554772814', // Mock seller payout details
          sellerBankCode: '058',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Release failed.');
      }

      await loadAgreements();
    } catch (err: any) {
      alert(`Payout failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-10 text-white font-sans">
      {/* Create Project Section */}
      <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 sm:p-8 relative">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span>Hire Freelancer (Secure Escrow)</span>
        </h2>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-950/25 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateAgreement} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Project Title</label>
            <input
              type="text"
              placeholder="e.g. Design Logo Asset Pack"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#111115] border border-white/5 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Freelancer Email</label>
            <input
              type="email"
              placeholder="freelancer@example.com"
              value={freelancerEmail}
              onChange={(e) => setFreelancerEmail(e.target.value)}
              className="w-full bg-[#111115] border border-white/5 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Budget (₦ / NGN)</label>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-[#111115] border border-white/5 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50 font-mono"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Create</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Active Escrow Contracts Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Your Active Hires</h2>
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
            No projects generated yet. Fill out the budget form above to start a secure escrow.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agreements.map((agreement) => {
              const shortfall = Math.max(0, agreement.totalAmount - (agreement.amountReceived ?? 0));
              const milestone = agreement.milestones?.[0];
              const isDisbursed = milestone?.status === 'DISBURSED';

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
                          {milestone?.title.replace('Milestone 1: ', '') || 'Project Contract'}
                        </h3>
                        <span className="text-xs font-mono text-gray-500 block mt-0.5">ID: {agreement.id.substring(0, 8)}</span>
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

                    {/* Funding summary */}
                    <div className="bg-[#111115] border border-white/5 rounded-2xl p-4 space-y-2.5 mb-5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Total Budget:</span>
                        <span className="font-bold font-mono">₦{agreement.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Amount Funded:</span>
                        <span className="font-bold font-mono text-green-400">₦{(agreement.amountReceived ?? 0).toLocaleString()}</span>
                      </div>
                      {shortfall > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Remaining Shortfall:</span>
                          <span className="font-bold font-mono text-amber-500">₦{shortfall.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Virtual Account display for funding */}
                    {shortfall > 0 && agreement.nombaVirtualAccountNo && (
                      <div className="bg-purple-950/20 border border-purple-500/20 rounded-2xl p-4 space-y-2 mb-5">
                        <div className="flex items-center gap-1.5 text-xs text-purple-400 font-bold uppercase tracking-wide">
                          <Send className="w-3.5 h-3.5" />
                          <span>Escrow Payment Details</span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Fund the escrow by transferring money to this Nomba NUBAN account:
                        </p>
                        <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-lg mt-2">
                          <span className="text-sm font-bold font-mono tracking-wider">{agreement.nombaVirtualAccountNo}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(agreement.nombaVirtualAccountNo);
                              alert('NUBAN copied to clipboard!');
                            }}
                            className="p-1 hover:bg-white/5 rounded text-purple-400 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 font-mono mt-1">
                          <span>Bank: {agreement.nombaBank || 'Nombank MFB'}</span>
                          <span>Ref: {agreement.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="flex gap-3 mt-4">
                    {/* View Statement button */}
                    <button
                      onClick={() => {
                        setSelectedAgreementId(agreement.id);
                        setShowStatement(true);
                      }}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl text-sm border border-white/5 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Ledger</span>
                    </button>

                    {/* Simulate Payment shortcut */}
                    {shortfall > 0 && (
                      <div className="flex gap-1 flex-1">
                        <button
                          onClick={() => handleSimulatePayment(agreement)}
                          className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                        >
                          Fund
                        </button>
                        <button
                          onClick={() => handleSimulatePayment(agreement, agreement.totalAmount + 500)}
                          className="px-3 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          title="Simulate Overpayment of +₦500"
                        >
                          +500
                        </button>
                      </div>
                    )}

                    {/* Release funds to seller */}
                    {shortfall === 0 && !isDisbursed && (
                      <button
                        onClick={() => handleReleaseFunds(agreement.id, milestone.id)}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Release Payout</span>
                      </button>
                    )}

                    {isDisbursed && (
                      <div className="flex-1 py-3 bg-blue-950/20 text-blue-400 border border-blue-500/10 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Settled to Freelancer</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
