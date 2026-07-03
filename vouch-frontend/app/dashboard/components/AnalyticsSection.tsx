import { 
  Activity, Shield, Clock, CheckCircle, Database, Lock, UserCheck, 
  DollarSign, RefreshCw 
} from "lucide-react";

export function AnalyticsSection({ stats, logs, onRefresh }: { stats: any; logs: any[]; onRefresh?: () => void }) {
  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  const getEventStyle = (eventType: string) => {
    switch (eventType) {
      case 'ESCROW_CREATED':
        return { text: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', label: 'Escrow Created' };
      case 'RECONCILIATION_MATCHED':
        return { text: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', label: 'Payment Match' };
      case 'OVERPAYMENT_FLAGGED':
        return { text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Overfunded Excess' };
      case 'DISBURSEMENT_COMPLETED':
        return { text: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Payout Released' };
      case 'IDENTITY_VERIFIED':
        return { text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'KYC Verified' };
      case 'FRAUD_RISK_CHECKED':
        return { text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Fraud Shield Scan' };
      default:
        return { text: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20', label: eventType };
    }
  };

  const currentEscrowVal = stats?.totalEscrowValue || 0;
  const activeContractsCount = stats?.activeAgreements || 0;
  const verifiedUsersCount = stats?.identitiesVerifiedTotal || 0;
  const fraudChecksCount = stats?.totalChecksToday || 0;
  const blockedCount = stats?.redBlocksToday || 0;

  return (
    <div className="space-y-6 w-full mt-10 font-dm-sans">
      <div className="flex items-center justify-between mb-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1 text-left">
          <p className="text-xl font-syne text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#58A0B4]" />
            Live Trust Analytics
          </p>
          <span className="text-xs text-gray-500">
            Real-time infrastructure performance and webhook state changes.
          </span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-mono border border-white/10 text-white rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        )}
      </div>

      {/* Grid Cards for Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Metric 1 */}
        <div className="bg-white/[0.02] border border-white/5 hover:border-[#58A0B4]/30 rounded-3xl p-5 text-left transition-all duration-300">
          <div className="flex justify-between items-start text-gray-500 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Locked Escrow Volume</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">₦{currentEscrowVal.toLocaleString()}</p>
          <span className="text-[10px] text-gray-500 block mt-1">Sum of all secured balances</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white/[0.02] border border-white/5 hover:border-[#58A0B4]/30 rounded-3xl p-5 text-left transition-all duration-300">
          <div className="flex justify-between items-start text-gray-500 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Active Contracts</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{activeContractsCount}</p>
          <span className="text-[10px] text-gray-500 block mt-1">Pending milestone settlements</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white/[0.02] border border-white/5 hover:border-[#58A0B4]/30 rounded-3xl p-5 text-left transition-all duration-300">
          <div className="flex justify-between items-start text-gray-500 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Verified Platform Users</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{verifiedUsersCount}</p>
          <span className="text-[10px] text-gray-500 block mt-1">Passed liveness biometric scan</span>
        </div>

        {/* Metric 4 */}
        <div className="bg-white/[0.02] border border-white/5 hover:border-[#58A0B4]/30 rounded-3xl p-5 text-left transition-all duration-300">
          <div className="flex justify-between items-start text-gray-500 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">AI Scans (Fraud blocks)</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {fraudChecksCount} <span className="text-red-500 text-sm font-normal">({blockedCount} blocked)</span>
          </p>
          <span className="text-[10px] text-gray-500 block mt-1">NestJS Fraud checking velocity</span>
        </div>
      </div>

      {/* Live Logs Stream */}
      <div className="flex flex-col gap-4 rounded-3xl bg-white/[0.02] border border-white/5 px-6 py-6 w-full mt-4 text-left">
        <div>
          <h3 className="text-lg font-syne text-white mb-1">Live Audit Trail Feed</h3>
          <p className="text-xs text-gray-500">
            Developer key events matched and cataloged inside the local Vouch core instance.
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-2 max-h-[350px] overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm border border-dashed border-white/5 rounded-2xl bg-black/20">
              No developer events registered yet. Fire webhooks in Plica to populate logs.
            </div>
          ) : (
            logs.map((log) => {
              const style = getEventStyle(log.eventType);
              return (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.03] transition-colors px-4 py-3 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase border ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                    <div>
                      <p className="text-xs font-mono text-white/95">{log.agreementId ? `Agreement: ${log.agreementId.substring(0, 8)}` : 'Platform Action'}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {log.eventType === 'ESCROW_CREATED' ? `NUBAN virtual account generated for buyer.` :
                         log.eventType === 'RECONCILIATION_MATCHED' ? `Payment reconciled from buyer bank transfer.` :
                         log.eventType === 'OVERPAYMENT_FLAGGED' ? `Excess amount identified. Automatic refund initiated.` :
                         log.eventType === 'DISBURSEMENT_COMPLETED' ? `Funds disbursed to freelancer's bank account.` :
                         log.eventType === 'IDENTITY_VERIFIED' ? `Liveness verification passed.` :
                         `Infrastructure log transitioned.`}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-600 font-mono sm:text-right shrink-0">
                    {formatTime(log.createdAt)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
