import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '../db/store';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle2, ShieldAlert, KeyRound, AlertTriangle } from 'lucide-react';
import type { ClientRequest } from '../db/schema';

// Individual file upload cell for client portal table
const ClientPortalUploadRow: React.FC<{
  req: ClientRequest;
  onUpload: (reqId: string, name: string, size: number) => void;
}> = ({ req, onUpload }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        onUpload(req.id, file.name, file.size);
      }
    },
  });

  return (
    <tr className="border-b border-black/6 hover:bg-black/[0.005] transition-colors duration-150">
      <td className="py-4">
        <div className="text-[13px] font-bold text-black">{req.document_requested}</div>
        <div className="text-[11px] text-black/40 font-mono mt-0.5">{req.period_context || 'N/A'}</div>
        {req.status === 'rejected' && req.manager_comment && (
          <div className="text-[10px] text-accent-red font-mono mt-1 font-bold">
            ⚠️ REJECTED: {req.manager_comment}
          </div>
        )}
      </td>
      <td className="py-4">
        <span className={`text-[9px] font-bold tracking-[0.05em] uppercase px-1.5 py-0.5 rounded-[2px] ${
          req.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-200' :
          req.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
          'bg-black/[0.03] text-black/55 border border-black/8'
        }`}>
          {req.priority}
        </span>
      </td>
      <td className="py-4">
        <span className={`text-[9px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-[2px] ${
          req.status === 'received' ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold' :
          req.status === 'verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
          req.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-200' :
          'bg-black/[0.03] text-black/40 border border-black/8'
        }`}>
          {req.status === 'received' ? 'Awaiting Verification' :
           req.status === 'verified' ? 'Accepted' :
           req.status === 'rejected' ? 'Re-upload Required' : 'Pending Upload'}
        </span>
      </td>
      <td className="py-4 pr-0 text-right w-[240px]">
        {req.status === 'verified' ? (
          <div className="flex items-center justify-end gap-1.5 text-emerald-600 text-[12px] font-bold">
            <CheckCircle2 size={14} />
            <span>Document Accepted</span>
          </div>
        ) : req.status === 'received' ? (
          <div className="text-[11px] text-black/40 italic">
            File received, checking credentials...
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border border-dashed rounded-[4px] p-2 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-accent-red bg-accent-red/[0.01]' 
                : 'border-black/15 bg-black/[0.01] hover:bg-black/[0.03] hover:border-black/25'
            }`}
          >
            <input {...getInputProps()} />
            <Upload size={12} className="mx-auto text-black/40 mb-1" />
            <span className="text-[10px] font-bold text-black/55 uppercase tracking-[0.04em]">
              {isDragActive ? "Drop File" : "Choose File"}
            </span>
          </div>
        )}
      </td>
    </tr>
  );
};

export const ClientPortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { clientPortalTokens, clientRequests, engagements, clients, firms, clientUploadDocument } = useAppStore();

  const tokenObj = clientPortalTokens.find(t => t.token === token);
  const isExpired = tokenObj ? new Date().toISOString() > tokenObj.expires_at : true;

  // OTP Lock state
  const [otpInput, setOtpInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [otpError, setOtpError] = useState('');

  if (!tokenObj || isExpired) {
    return (
      <div className="min-h-screen bg-black/[0.02] flex items-center justify-center p-6 selection:bg-accent-red/10 selection:text-accent-red">
        <div className="bg-white border border-black/8 rounded-[12px] p-8 max-w-md w-full shadow-2xl text-center space-y-4">
          <ShieldAlert className="mx-auto text-accent-red" size={44} />
          <h2 className="bebas-display text-[28px] text-black tracking-[0.04em]">Access Link Expired</h2>
          <p className="text-[13px] text-black/55 leading-relaxed">
            This client request portal link has either expired (14-day limit under security guidelines) or is invalid. Please contact your audit firm representative to request a new link.
          </p>
        </div>
      </div>
    );
  }

  const engagement = engagements.find(e => e.id === tokenObj.engagement_id);
  const client = engagement ? clients.find(c => c.id === engagement.client_id) : null;
  const firm = engagement ? firms.find(f => f.id === engagement.firm_id) : null;

  const currentRequests = clientRequests.filter(r => r.engagement_id === tokenObj.engagement_id && r.status !== 'pending-internal');

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === tokenObj.otp_code) {
      setIsVerified(true);
      setOtpError('');
    } else {
      setOtpError('Invalid 6-digit OTP code verification. Check with the auditor.');
    }
  };

  const handleClientUpload = (reqId: string, fileName: string, fileSize: number) => {
    clientUploadDocument(reqId, { fileName, fileSize });
  };

  // Skip OTP input step if token has no OTP configured (e.g. legacy token simulation)
  const showOtpScreen = !isVerified && !!tokenObj.otp_code;

  if (showOtpScreen) {
    return (
      <div className="min-h-screen bg-black/[0.02] flex items-center justify-center p-6 selection:bg-accent-red/10 selection:text-accent-red">
        <div className="bg-white border border-black/8 rounded-[12px] p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <KeyRound className="mx-auto text-black" size={32} />
            <h2 className="bebas-display text-[26px] text-black tracking-[0.04em]">Audit Portal Security</h2>
            <p className="text-[12px] text-black/45 leading-relaxed">
              Verify your identity. Enter the 6-digit OTP code shared by the audit firm: <span className="font-bold">{firm?.name}</span>.
            </p>
          </div>

          {otpError && (
            <div className="p-3 bg-red-50 border border-red-200 text-accent-red rounded-[2px] text-[12px] text-center font-mono">
              {otpError}
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase mb-2 text-center">
                OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="0 0 0 0 0 0"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.6em] text-[20px] font-mono px-3 py-3 bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-[2px] text-[12px] font-bold tracking-[0.04em] uppercase hover:bg-black/90 transition-colors"
            >
              Verify & Open Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/[0.015] flex flex-col justify-between selection:bg-accent-red/10 selection:text-accent-red">
      
      {/* Header */}
      <header className="py-6 px-8 bg-white border-b border-black/6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-0.5">
              <span className="bebas-display text-[24px] text-black tracking-[0.04em]">WPO</span>
              <span className="bebas-display text-[24px] text-accent-red tracking-[0.04em]">.PORTAL</span>
            </div>
            <div className="h-4 w-px bg-black/10"></div>
            <div className="text-[12px] font-bold text-black/60">{client?.name} Workspace</div>
          </div>
          
          <div className="text-right">
            <div className="text-[12px] font-bold text-black">{firm?.name}</div>
            <div className="text-[10px] text-black/40 uppercase tracking-[0.04em]">Audit Request Team</div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-8 py-8 space-y-6">
        
        {/* Banner info */}
        <div className="bg-white border border-black/6 rounded-[12px] p-5 flex items-start gap-3">
          <AlertTriangle className="text-accent-red mt-0.5 shrink-0" size={16} />
          <div className="text-[12px] text-black/65 leading-relaxed">
            <span className="font-bold text-black block mb-1">Direct Ingestion Secure Protocol</span>
            Documents uploaded here are validated for compliance and uploaded directly to the specific audit area. Do not upload encrypted or password-protected PDF/Excel sheets.
          </div>
        </div>

        {/* Requests Grid */}
        <div className="bg-white border border-black/6 rounded-[12px] p-6 space-y-5">
          <div className="border-b border-black/6 pb-3">
            <h2 className="bebas-display text-[20px] text-black tracking-[0.04em]">
              Requested Documents Ledger
            </h2>
            <p className="text-[11px] text-black/40 mt-1">
              Double check details, choose files to upload, and monitor their review states.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-black/15 text-left">
                  <th className="py-2 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">Requested Item</th>
                  <th className="py-2 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">Priority</th>
                  <th className="py-2 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">Status</th>
                  <th className="py-2 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase text-right">Document Upload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/6">
                {currentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[13px] text-black/35 italic">
                      No document request items are currently awaiting upload. Check with the auditor.
                    </td>
                  </tr>
                ) : (
                  currentRequests.map(req => (
                    <ClientPortalUploadRow
                      key={req.id}
                      req={req}
                      onUpload={handleClientUpload}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 border-t border-black/6 text-center text-[10px] text-black/25 uppercase tracking-[0.04em]">
        WPO.inc Secure Client Portal. "The software assists. The auditor decides. Always."
      </footer>
    </div>
  );
};
