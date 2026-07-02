'use client';
import React, { useState, useEffect } from 'react';
import { X, Receipt, CheckCircle, RefreshCw, AlertCircle, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface StatementModalProps {
  isOpen: boolean;
  agreementId: string;
  onClose: () => void;
}

export const StatementModal: React.FC<StatementModalProps> = ({
  isOpen,
  agreementId,
  onClose,
}) => {
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatement = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/escrow/agreements/${agreementId}/statement`, {
        method: 'GET',
        headers: {
          'x-api-key': 'vouch_e62a93d67ead621439fcb0569e920c8e6988c7b533dc2845',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load statement: ${res.statusText}`);
      }

      const data = await res.json();
      setStatement(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && agreementId) {
      fetchStatement();
    }
  }, [isOpen, agreementId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans text-white">
      <div className="bg-[#0b0b0d] border border-white/10 rounded-3xl w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold">Escrow Ledger Statement</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
              <span className="text-sm text-gray-400 font-mono">Compiling ledger audit...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center p-4">
              <AlertCircle className="w-10 h-10 text-red-500" />
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={fetchStatement}
                className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
              >
                Retry Fetch
              </button>
            </div>
          ) : (
            <>
              {/* Top Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#111115] border border-white/5 rounded-2xl p-4">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Expected</span>
                  <p className="text-xl font-bold font-mono mt-1 text-white">₦{statement.totalExpected.toLocaleString()}</p>
                </div>
                <div className="bg-[#111115] border border-white/5 rounded-2xl p-4">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Received</span>
                  <p className="text-xl font-bold font-mono mt-1 text-green-400">₦{statement.amountReceived.toLocaleString()}</p>
                </div>
                <div className="bg-[#111115] border border-white/5 rounded-2xl p-4">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Shortfall</span>
                  <p className="text-xl font-bold font-mono mt-1 text-amber-500">₦{statement.shortfall.toLocaleString()}</p>
                </div>
                <div className="bg-[#111115] border border-white/5 rounded-2xl p-4">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Overpayment</span>
                  <p className="text-xl font-bold font-mono mt-1 text-red-400">₦{statement.overpayment.toLocaleString()}</p>
                </div>
              </div>

              {/* Status Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111115] border border-white/5 rounded-2xl p-4">
                <div>
                  <span className="text-xs text-gray-500 block">Agreement ID</span>
                  <span className="text-xs font-mono text-gray-300">{statement.agreementId}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 block mb-1">Escrow Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase ${
                    statement.status === 'FUNDED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    statement.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    statement.status === 'OVERFUNDED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    statement.status === 'DISBURSED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {statement.status}
                  </span>
                </div>
              </div>

              {/* Inbound Transfers Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Inbound Bank Transfers</h3>
                {statement.transfers.length === 0 ? (
                  <div className="bg-[#111115] border border-white/5 rounded-2xl p-6 text-center text-gray-500 text-sm">
                    No transactions registered yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {statement.transfers.map((t: any) => (
                      <div key={t.id} className="flex justify-between items-center bg-[#111115] border border-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-green-500/10 text-green-400 rounded-lg flex items-center justify-center">
                            <ArrowDownLeft className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{t.senderName || 'Anonymous Buyer'}</p>
                            <span className="text-xs text-gray-500 font-mono">{t.senderBank} | Ref: {t.reference}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold font-mono text-green-400">+₦{t.amount.toLocaleString()}</p>
                          <span className="text-xs text-gray-500 font-mono">{new Date(t.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Automatic Refunds Section */}
              {statement.refunds && statement.refunds.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Excess Refunds (Nomba Transfers)</h3>
                  <div className="space-y-2">
                    {statement.refunds.map((r: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-[#111115] border border-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 ${r.success ? 'bg-red-500/10 text-red-400' : 'bg-gray-800 text-gray-500'} rounded-lg flex items-center justify-center`}>
                            <ArrowUpRight className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Automatic Excess Refund</p>
                            <span className="text-xs text-gray-500 font-mono">
                              {r.success ? `Ref: ${r.reference}` : `Failed: ${r.reason}`}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold font-mono ${r.success ? 'text-red-400' : 'text-gray-500'}`}>
                            -₦{r.amount.toLocaleString()}
                          </p>
                          <span className="text-xs text-gray-500 font-mono">{new Date(r.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Timeline */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Escrow Audit Trail</h3>
                <div className="relative border-l border-white/5 pl-4 ml-2 space-y-4">
                  {statement.auditLogs.map((log: any, idx: number) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-500 border border-black"></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-purple-400">{log.eventType}</span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {log.eventType === 'ESCROW_CREATED' ? 'Virtual NUBAN Account generated and lock configured.' :
                           log.eventType === 'RECONCILIATION_MATCHED' ? `Inbound bank transfer reconciled. State updated to ${log.payload.newStatus}.` :
                           log.eventType === 'OVERPAYMENT_FLAGGED' ? `Excess payment of ₦${log.payload.automaticRefund?.refundAmount} flagged. Refund state: ${log.payload.automaticRefund?.success ? 'Disbursed' : 'Awaiting manual audit'}.` :
                           'Escrow ledger state transition logged.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
