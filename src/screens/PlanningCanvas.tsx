import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../db/store';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export const PlanningCanvas: React.FC = () => {
  const { engagementId } = useParams<{ engagementId: string }>();
  const navigate = useNavigate();
  const { engagements, clients, updatePlanning, finalizePlanning } = useAppStore();

  const engagement = engagements.find(e => e.id === engagementId);
  const client = engagement ? clients.find(c => c.id === engagement.client_id) : null;

  if (!engagement || !client) {
    return (
      <div className="text-center py-12 bg-white border border-black/6 rounded-[12px] max-w-xl mx-auto mt-20">
        <AlertCircle className="mx-auto text-accent-red mb-3" size={32} />
        <p className="text-[14px] text-black/55 italic">Engagement not found.</p>
        <Link to="/dashboard" className="text-[12px] text-accent-red hover:underline mt-4 inline-block font-bold tracking-[0.04em] uppercase">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Local state for KOB textarea
  const [kob, setKob] = useState(engagement.planning?.knowledge_of_business || '');

  // File upload state for SA 210 Engagement Letter
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        updatePlanning(engagement.id, {
          engagement_letter_file: `letters/${crypto.randomUUID()}_${file.name}`,
          engagement_letter_name: file.name,
          engagement_letter_validated: true,
        });
      }
    },
  });

  const handleFinalize = () => {
    if (!engagement.planning?.engagement_letter_validated) {
      alert('Mandatory Requirement: Please upload the signed SA 210 Engagement Letter PDF before continuing.');
      return;
    }
    if (!kob.trim()) {
      alert('Mandatory Requirement: Please input core Knowledge of Business findings (SA 315) before initializing the workspace.');
      return;
    }

    // Save KOB & Finalize
    updatePlanning(engagement.id, { knowledge_of_business: kob });
    finalizePlanning(engagement.id);
    navigate(`/engagement/${engagement.id}`);
  };

  const isFinalized = engagement.planning?.planning_finalized;

  return (
    <div className="space-y-6 max-w-6xl mx-auto ui-enter-stagger">
      {/* Navigation Breadcrumbs */}
      <nav className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="text-black/40 hover:text-black transition-colors duration-200">
            Engagements
          </Link>
          <span className="text-black/20">/</span>
          <span className="text-black font-medium">{client.name}</span>
          <span className="text-black/20">/</span>
          <span className="text-black/40">SA 210 & SA 315 Planning</span>
        </div>
        <Link 
          to="/dashboard"
          className="flex items-center gap-1 text-[11px] text-black/55 hover:text-black transition-colors duration-200"
        >
          <ArrowLeft size={12} />
          <span>Back to Dashboard</span>
        </Link>
      </nav>

      {/* Header */}
      <div>
        <h1 className="bebas-display text-[clamp(26px,3.2vw,40px)] text-black leading-none tracking-[0.04em]">
          Audit Planning & Engagement Acceptance
        </h1>
        <p className="text-[12px] text-black/40 mt-1">
          Perform mandatory preconditions checks under Standards on Auditing (SA) 210 and risk assessment under SA 315.
        </p>
      </div>

      {/* Split canvas grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: SA 210 Engagement Terms */}
        <div className="bg-white border border-black/6 rounded-[12px] p-6 space-y-4">
          <div className="border-b border-black/6 pb-3">
            <h2 className="bebas-display text-[20px] text-black tracking-[0.04em]">
              1. Terms of Engagement (SA 210)
            </h2>
            <p className="text-[12px] text-black/40 mt-1">
              Verify client agreement to the terms. Upload the signed engagement letter.
            </p>
          </div>

          {/* Letter Upload Container */}
          {engagement.planning?.engagement_letter_validated ? (
            <div className="border border-emerald-200 bg-emerald-50/50 rounded-[12px] p-6 text-center space-y-3">
              <CheckCircle2 className="mx-auto text-emerald-600" size={36} />
              <div>
                <h4 className="text-[14px] text-emerald-800 font-bold">Engagement Letter Validated</h4>
                <p className="text-[12px] text-emerald-600 font-mono mt-1">
                  {engagement.planning?.engagement_letter_name}
                </p>
              </div>
              {!isFinalized && (
                <button
                  onClick={() => updatePlanning(engagement.id, {
                    engagement_letter_file: undefined,
                    engagement_letter_name: undefined,
                    engagement_letter_validated: false
                  })}
                  className="text-[11px] text-black/40 hover:text-accent-red font-bold tracking-[0.04em] uppercase transition-colors duration-200"
                >
                  Replace Document
                </button>
              )}
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-[12px] p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragActive 
                  ? 'border-accent-red bg-accent-red/[0.02]' 
                  : 'border-black/15 bg-black/[0.01] hover:bg-black/[0.03] hover:border-black/30'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto text-black/30 mb-3" size={28} />
              <p className="text-[13px] text-black/55 font-bold tracking-[0.01em]">
                {isDragActive ? "Drop the file here" : "Drag & Drop Signed Engagement Letter"}
              </p>
              <p className="text-[11px] text-black/30 mt-1">Accepts PDF files only. Validation required.</p>
            </div>
          )}

          <div className="p-4 bg-black/[0.02] border border-black/6 rounded-[12px] text-[11px] text-black/55 leading-relaxed">
            <span className="font-bold text-black/70 block uppercase tracking-[0.04em] mb-1">SA 210 Requirement checklist:</span>
            <ul className="list-disc pl-4 space-y-1">
              <li>Objective and scope of the audit of the financial statements verified.</li>
              <li>Responsibilities of the auditor and management clearly documented.</li>
              <li>Identification of the applicable financial reporting framework.</li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: SA 315 Knowledge of Business */}
        <div className="bg-white border border-black/6 rounded-[12px] p-6 space-y-4">
          <div className="border-b border-black/6 pb-3">
            <h2 className="bebas-display text-[20px] text-black tracking-[0.04em]">
              2. Knowledge of Entity's Business (SA 315)
            </h2>
            <p className="text-[12px] text-black/40 mt-1">
              Document significant accounting policies, internal controls, and specific field instructions.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase mb-2">
              Entity Background & Internal Control Assessment
            </label>
            <textarea
              rows={9}
              disabled={isFinalized}
              value={kob}
              onChange={(e) => setKob(e.target.value)}
              placeholder="e.g. The entity operates in the manufacturing sector. Standard policies include revenue recognition upon transfer of control (Ind AS 115). Key internal control controls observed: segregation of duties in payroll, monthly bank reconciliations, dual authorization for transactions exceeding ₹5 Lakhs..."
              className="w-full p-4 text-[13px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black leading-relaxed transition-colors duration-200 font-mono"
            />
          </div>

          <div className="p-4 bg-black/[0.02] border border-black/6 rounded-[12px] text-[11px] text-black/55 leading-relaxed">
            <span className="font-bold text-black/70 block uppercase tracking-[0.04em] mb-1">SA 315 Risk Checkpoints:</span>
            <p>Define policies for inventory valuation methods, fixed assets depreciation, statutory compliance cycles, and any specific instructions for the substantive audit testing team.</p>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="bg-white border border-black/6 rounded-[12px] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-[13px] font-bold text-black tracking-[0.01em]">
            Status: {isFinalized ? "Finalized & Locked" : "Draft Planning Mode"}
          </h4>
          <p className="text-[11px] text-black/40 mt-0.5">
            {isFinalized 
              ? `Workspace initialized on ${new Date(engagement.planning?.planning_finalized_at || '').toLocaleDateString()}` 
              : "All entries will lock permanently upon finalizing the planning program."
            }
          </p>
        </div>

        <div className="flex gap-3">
          {!isFinalized ? (
            <>
              <button
                onClick={() => {
                  updatePlanning(engagement.id, { knowledge_of_business: kob });
                  alert('Draft planning details saved successfully.');
                }}
                className="px-5 py-2.5 border border-black/10 rounded-[2px] text-[12px] font-bold text-black/50 hover:text-black hover:border-black/25 transition-colors duration-200 tracking-[0.04em] uppercase cursor-pointer"
              >
                Save Progress Draft
              </button>
              <button
                onClick={handleFinalize}
                className="bg-black text-white px-6 py-2.5 rounded-[2px] text-[12px] font-bold tracking-[0.04em] uppercase hover:bg-black/90 transition-colors duration-200 cursor-pointer"
              >
                Finalize Planning & Initialize Workspace
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate(`/engagement/${engagement.id}`)}
              className="bg-black text-white px-6 py-2.5 rounded-[2px] text-[12px] font-bold tracking-[0.04em] uppercase hover:bg-black/90 transition-colors duration-200 cursor-pointer"
            >
              Open Audit Workspace
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
