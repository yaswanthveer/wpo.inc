import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../db/store';
import { useDropzone } from 'react-dropzone';
import { 
  ArrowLeft, 
  FileDown, 
  Upload, 
  Check, 
  AlertTriangle, 
  FileText, 
  Info,
  X,
  Plus,
  Trash2,
  ShieldAlert
} from 'lucide-react';
import { exportWorkingPaperPdf } from '../utils/pdfExporter';
import type { Document as WpoDoc, Procedure } from '../db/schema';
import { computeSHA256 } from '../utils/hashUtils';

export const WorkingPaperView: React.FC = () => {
  const { wpId } = useParams<{ wpId: string }>();
  const navigate = useNavigate();
  const { 
    workingPapers, 
    auditAreas, 
    engagements, 
    clients, 
    documents, 
    procedures, 
    users,
    currentFirm,
    currentUser,
    observations: storeObservations,
    addObservation,
    deleteObservation,
    lockAndSubmitForReview,
    updateWorkingPaper,
    updateDocumentStatus,
    updateProcedureStatus
  } = useAppStore();

  const wp = workingPapers.find(w => w.id === wpId);
  const area = auditAreas.find(a => a.id === wp?.area_id);
  const engagement = engagements.find(e => e.id === wp?.engagement_id);
  const client = clients.find(c => c.id === engagement?.client_id);
  
  const wpDocs = documents.filter(d => d.working_paper_id === wpId);
  const wpProcs = procedures.filter(p => p.working_paper_id === wpId).sort((a,b) => a.sort_order - b.sort_order);
  const wpObservations = storeObservations.filter(o => o.working_paper_id === wpId);

  // Local state for Observations & Conclusion text notes
  const [obsText, setObsText] = useState(wp?.observations || '');
  const [conclusion, setConclusion] = useState(wp?.conclusion || '');
  const [activeTab, setActiveTab] = useState<'docs' | 'procs'>('docs');
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  
  // Handles alternative handling dialog for a document
  const [handlingDocId, setHandlingDocId] = useState<string | null>(null);
  const [altStatus, setAltStatus] = useState<WpoDoc['status']>('alternative');
  const [altNote, setAltNote] = useState('');

  // Handles skip reasoning dialog for a procedure
  const [skippingProcId, setSkippingProcId] = useState<string | null>(null);
  const [skipReason, setSkipReason] = useState('');

  // Interactive Observation Grid Form state
  const [isAddObsOpen, setIsAddObsOpen] = useState(false);
  const [obsTitle, setObsTitle] = useState('');
  const [obsImpact, setObsImpact] = useState('0');
  const [obsDesc, setObsDesc] = useState('');
  const [obsExcelRef, setObsExcelRef] = useState('');

  // Submission Lock Form state
  const [isSubmitLockOpen, setIsSubmitLockOpen] = useState(false);
  const [lockObjective, setLockObjective] = useState('');
  const [lockSampleSize, setLockSampleSize] = useState('');
  const [lockConclusion, setLockConclusion] = useState<'Satisfactory' | 'Modified' | 'Significant Unresolved Matters'>('Satisfactory');
  const [lockConfirmChecked, setLockConfirmChecked] = useState(false);

  // Sync state if WP changes
  useEffect(() => {
    if (wp) {
      setObsText(wp.observations || '');
      setConclusion(wp.conclusion || '');
      if (wp.submission_lock) {
        setLockObjective(wp.submission_lock.audit_objective_assessed);
        setLockSampleSize(wp.submission_lock.sample_size_basis);
        setLockConclusion(wp.submission_lock.substantive_conclusion);
      }
    }
  }, [wpId, wp]);

  if (!wp || !area || !engagement || !client) {
    return (
      <div className="text-center py-12 bg-white border border-black/6 rounded-[12px] max-w-xl mx-auto mt-20">
        <p className="text-xs text-black/40 italic">Working paper not found.</p>
        <Link to="/dashboard" className="text-xs text-accent-red hover:underline mt-4 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Check if locked
  const isLocked = wp.status === 'review' || wp.status === 'approved' || !!engagement.archive;

  const handleSaveDraft = () => {
    updateWorkingPaper(wp.id, {
      observations: obsText,
      conclusion: conclusion || undefined,
      prepared_by: currentUser?.id,
    });
    
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 2500);
  };

  const handleOpenSubmitLock = () => {
    // Audit regulations check: Warn if conclusion is completely blank
    if (!conclusion.trim()) {
      alert("WARNING: Under Standard on Auditing (SA) 230, you must record a professional conclusion before submitting a working paper for review.");
      return;
    }
    
    setLockObjective(wp.objective || '');
    setIsSubmitLockOpen(true);
  };

  const handleConfirmSubmitForReview = async () => {
    if (!lockConfirmChecked) {
      alert('You must check the positive confirmation box certifying SA 200 compliance.');
      return;
    }

    try {
      // Generate simulated hash for the raw files
      const rawFileString = `${wpDocs.map(d => d.file_name).join(',')}-${wpProcs.map(p => p.status).join(',')}`;
      const hash = `SHA-256:${(await computeSHA256(rawFileString)).slice(0, 16).toUpperCase()}`;

      lockAndSubmitForReview(wp.id, {
        auditObjectiveAssessed: lockObjective,
        sampleSizeBasis: lockSampleSize,
        substantiveConclusion: lockConclusion,
        positiveConfirmationChecked: true,
        leadSheetHash: hash,
      });

      // Update local observations and conclusion
      updateWorkingPaper(wp.id, {
        observations: obsText,
        conclusion: conclusion,
      });

      setIsSubmitLockOpen(false);
      alert("Working paper successfully sealed, hashed, and submitted to review queue.");
      navigate(`/engagement/${engagement.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to submit.');
    }
  };

  const handlePdfExport = async () => {
    if (!currentFirm) return;
    
    // Auto-save current edits first if not locked
    if (!isLocked) {
      updateWorkingPaper(wp.id, {
        observations: obsText,
        conclusion: conclusion || undefined,
      });
    }

    const preparedUser = users.find(u => u.id === wp.prepared_by);
    const reviewedUser = users.find(u => u.id === wp.reviewed_by);

    await exportWorkingPaperPdf(
      currentFirm,
      client,
      engagement,
      wp,
      wpDocs,
      wpProcs,
      preparedUser,
      reviewedUser
    );
  };

  // Dropzone Setup for simulated uploads
  const onDrop = (acceptedFiles: File[], docId: string) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      updateDocumentStatus(docId, 'obtained', undefined, {
        fileName: file.name,
        fileSize: file.size,
      });
      setHandlingDocId(null);
    }
  };

  const toggleProcedure = (procId: string, currentStatus: Procedure['status']) => {
    if (isLocked) return;
    if (currentStatus === 'done' || currentStatus === 'skipped') {
      updateProcedureStatus(procId, 'pending');
    } else {
      updateProcedureStatus(procId, 'done');
    }
  };

  const openSkipProcDialog = (procId: string) => {
    setSkippingProcId(procId);
    setSkipReason('');
  };

  const handleSkipProcSubmit = () => {
    if (!skipReason.trim()) {
      alert('A justification reason is required to bypass an audit procedure.');
      return;
    }
    if (skippingProcId) {
      updateProcedureStatus(skippingProcId, 'skipped', skipReason);
      setSkippingProcId(null);
    }
  };

  const openHandlingDocDialog = (doc: WpoDoc) => {
    setHandlingDocId(doc.id);
    setAltStatus(doc.status === 'pending' ? 'alternative' : doc.status);
    setAltNote(doc.note || '');
  };

  const handleAltDocSubmit = () => {
    if ((altStatus === 'alternative' || altStatus === 'skip-justified') && !altNote.trim()) {
      alert('Please provide professional notes detailing the alternative steps or justification.');
      return;
    }
    if (handlingDocId) {
      updateDocumentStatus(handlingDocId, altStatus, altNote);
      setHandlingDocId(null);
    }
  };

  const submitAddObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsTitle.trim() || !obsDesc.trim()) return;

    addObservation(wp.id, obsTitle, parseFloat(obsImpact) || 0, obsDesc, obsExcelRef);
    setObsTitle('');
    setObsImpact('0');
    setObsDesc('');
    setObsExcelRef('');
    setIsAddObsOpen(false);
  };

  const getDocStatusBadge = (status: WpoDoc['status']) => {
    switch (status) {
      case 'obtained':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'alternative':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'not-available':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'skip-justified':
        return 'bg-sky-50 text-sky-700 border border-sky-200';
      default:
        return 'bg-black/[0.02] text-black/40 border border-black/6';
    }
  };

  const getDocStatusLabel = (status: WpoDoc['status']) => {
    switch (status) {
      case 'obtained': return 'Obtained';
      case 'alternative': return 'Alt Procedure';
      case 'not-available': return 'Not Available';
      case 'skip-justified': return 'Skip Justified';
      default: return 'Pending';
    }
  };

  // Helper component for Dropzone
  const FileUploadField: React.FC<{ docId: string }> = ({ docId }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (files) => onDrop(files, docId),
      multiple: false,
    });

    return (
      <div 
        {...getRootProps()} 
        className={`border-dashed border border-black/15 rounded-[12px] bg-black/[0.01] p-4 text-center cursor-pointer transition-colors duration-200 ${
          isDragActive ? 'border-black/30 bg-black/[0.03]' : 'hover:border-black/25'
        }`}
      >
        <input {...getInputProps()} />
        <Upload size={18} className="mx-auto text-black/35 mb-1" />
        <p className="text-[11px] text-black/55">
          {isDragActive ? 'Drop file here...' : 'Click to select or drag PDF/XLS'}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center justify-between text-[12px] ui-enter-stagger">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="text-black/40 hover:text-black transition-colors duration-200">
            Engagements
          </Link>
          <span className="text-black/25">/</span>
          <Link to={`/engagement/${engagement.id}`} className="text-black/40 hover:text-black transition-colors duration-200">
            {client.name}
          </Link>
          <span className="text-black/25">/</span>
          <span className="text-black font-medium">{area.code} Working Paper</span>
        </div>

        <Link 
          to={`/engagement/${engagement.id}`}
          className="flex items-center gap-1 text-[11px] text-black/55 hover:text-black transition-colors duration-200"
        >
          <ArrowLeft size={12} />
          <span>Back to File</span>
        </Link>
      </nav>

      {/* LOCKOUT STATUS ALERT BANNER */}
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-[12px] p-4 flex items-center justify-between gap-4 animate-fadeInUp text-[12px] text-amber-800">
          <div className="flex items-center gap-2 font-mono">
            <Info className="text-amber-700 shrink-0" size={16} />
            <div>
              <strong>Audit Sheet Locked (Awaiting Review / Sign-off)</strong>
              {wp.submission_lock && (
                <span className="block text-[10px] text-black/55 mt-0.5">
                  Sealed with cryptstamp: <span className="font-bold text-black">{wp.submission_lock.lead_sheet_hash}</span> | Substantive Assessment: {wp.submission_lock.substantive_conclusion}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WP Header Panel */}
      <div className="bg-white border border-black/6 rounded-[12px] p-6 space-y-4 ui-enter-stagger" style={{ '--enter-delay': '0.06s' } as React.CSSProperties}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2.5">
              <span className="font-mono text-xs font-bold text-gold-accent bg-gold-light px-1.5 py-0.5 rounded-[2px]">{wp.reference_code}</span>
              <h1 className="text-[clamp(26px,3.2vw,36px)] bebas-display tracking-[0.04em] text-black">
                {wp.title} <span className="text-black/35 font-news text-[14px]">v{wp.version || 1}</span>
              </h1>
            </div>
            <p className="text-[12px] text-black/55 max-w-[850px] leading-relaxed">
              <strong>Objective:</strong> {wp.objective || 'Not specified.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {showSavedNotification && (
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 border border-emerald-200 rounded-[2px] font-medium animate-fadeInUp">
                Draft Saved
              </span>
            )}
            {!isLocked && (
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 border border-black/10 rounded-[2px] text-xs font-semibold text-black/55 hover:bg-black/[0.02] transition-colors duration-200 cursor-pointer"
              >
                Save Draft
              </button>
            )}
            <button
              onClick={handlePdfExport}
              className="flex items-center gap-1.5 px-4 py-2 border border-black/10 rounded-[2px] text-xs font-bold tracking-[0.04em] uppercase text-black/55 hover:text-black hover:border-black/20 transition-all duration-200 cursor-pointer bg-white"
            >
              <FileDown size={14} />
              <span>Export PDF</span>
            </button>
            {!isLocked && (
              <button
                onClick={handleOpenSubmitLock}
                className="bg-black text-white px-5 py-2 rounded-[2px] text-xs font-bold tracking-[0.04em] uppercase hover:bg-black/90 transition-all duration-200 cursor-pointer"
              >
                Submit for Review
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main split screens: left is docs & procedures checklists, right is observations & conclusion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: EVIDENCE & STEPS */}
        <div className="bg-white border border-black/6 rounded-[12px] p-6 space-y-6 ui-enter-stagger" style={{ '--enter-delay': '0.12s' } as React.CSSProperties}>
          {/* Tab Selection */}
          <div className="flex border-b border-black/6">
            <button
              onClick={() => setActiveTab('docs')}
              className={`pb-3 text-xs tracking-[0.04em] font-bold border-b-2 px-4 transition-all duration-200 -mb-[1px] cursor-pointer uppercase ${
                activeTab === 'docs' 
                  ? 'border-accent-red text-black' 
                  : 'border-transparent text-black/35 hover:text-black/55'
              }`}
            >
              Audit Evidence Documents ({wpDocs.filter(d => d.status !== 'pending').length}/{wpDocs.length})
            </button>
            <button
              onClick={() => setActiveTab('procs')}
              className={`pb-3 text-xs tracking-[0.04em] font-bold border-b-2 px-4 transition-all duration-200 -mb-[1px] cursor-pointer uppercase ${
                activeTab === 'procs' 
                  ? 'border-accent-red text-black' 
                  : 'border-transparent text-black/35 hover:text-black/55'
              }`}
            >
              Substantive Procedures ({wpProcs.filter(p => p.status !== 'pending').length}/{wpProcs.length})
            </button>
          </div>

          {/* TAB 1: DOCUMENTS CHECKLIST */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-black/[0.02] rounded-[12px] border border-black/6 text-[11px] text-black/55">
                <Info size={14} className="text-accent-red shrink-0" />
                <p>
                  <strong>Section 8 Rule:</strong> If a document is missing or not provided by the entity, never block progress. Select <em>Alternative Procedure</em> or <em>Skip</em> to supply justifications.
                </p>
              </div>

              <div className="divide-y divide-black/6">
                {wpDocs.map((doc) => (
                  <div key={doc.id} className="py-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          {doc.reference_code && (
                            <span className="font-mono text-[9px] bg-gold-light text-gold-accent px-1.5 py-0.5 rounded-[2px] font-bold border border-gold-accent/20">
                              {doc.reference_code}
                            </span>
                          )}
                          <h4 className="font-news text-xs font-semibold text-black">
                            {doc.name}
                          </h4>
                        </div>
                        {doc.status === 'obtained' && doc.file_name && (
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-mono mt-1">
                            <FileText size={10} />
                            <span>{doc.file_name} ({(doc.file_size || 0) > 1024 * 1024 ? `${((doc.file_size || 0) / 1024 / 1024).toFixed(1)}MB` : `${Math.round((doc.file_size || 0) / 1024)}KB`})</span>
                          </div>
                        )}
                        {(doc.status === 'alternative' || doc.status === 'skip-justified') && doc.note && (
                          <p className="text-[10px] text-amber-600 mt-1.5 italic pl-2 border-l-2 border-amber-300/40 font-mono">
                            <strong>Audit Note:</strong> {doc.note}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] uppercase tracking-[0.1em] font-bold px-2 py-0.5 rounded-[2px] ${getDocStatusBadge(doc.status)}`}>
                          {getDocStatusLabel(doc.status)}
                        </span>
                        
                        {!isLocked && (
                          <button
                            onClick={() => openHandlingDocDialog(doc)}
                            className="px-2 py-1 bg-white hover:bg-black/[0.03] rounded-[2px] text-[10px] text-black/55 border border-black/10 transition-colors duration-200 cursor-pointer font-bold uppercase tracking-[0.04em]"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Handle Dialog Box Inline */}
                    {handlingDocId === doc.id && (
                      <div className="p-4 bg-black/[0.02] rounded-[12px] border border-black/6 space-y-3 animate-fadeInUp">
                        <div className="flex justify-between items-center pb-1 border-b border-black/6">
                          <span className="text-[10px] uppercase font-bold tracking-[0.1em] text-black/35">How would you like to handle this document request?</span>
                          <button onClick={() => setHandlingDocId(null)} className="text-[10px] text-black/40 hover:text-black transition-colors duration-200 cursor-pointer">Close</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase block">1. File Upload (Obtain)</span>
                            <FileUploadField docId={doc.id} />
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase block">2. Status Override</span>
                            <div className="space-y-1">
                              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-black/55">
                                <input
                                  type="radio"
                                  name="doc_status"
                                  checked={altStatus === 'alternative'}
                                  onChange={() => setAltStatus('alternative')}
                                  className="accent-black"
                                />
                                <span>Alternative Procedure Performed</span>
                              </label>
                              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-black/55">
                                <input
                                  type="radio"
                                  name="doc_status"
                                  checked={altStatus === 'not-available'}
                                  onChange={() => setAltStatus('not-available')}
                                  className="accent-black"
                                />
                                <span>Not Available (Entity does not have it)</span>
                              </label>
                              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-black/55">
                                <input
                                  type="radio"
                                  name="doc_status"
                                  checked={altStatus === 'skip-justified'}
                                  onChange={() => setAltStatus('skip-justified')}
                                  className="accent-black"
                                />
                                <span>Skip — with Justification</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {altStatus !== 'obtained' && (
                          <div className="space-y-1">
                            <label className="block text-[10px] uppercase tracking-[0.1em] text-black/35 font-bold">Auditor Explanation note <span className="text-accent-red">*</span></label>
                            <textarea
                              rows={2}
                              value={altNote}
                              onChange={(e) => setAltNote(e.target.value)}
                              placeholder="Describe the alternative audit procedures performed or explain the justification for skipping..."
                              className="w-full px-3 py-1.5 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black transition-colors duration-200"
                            />
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setHandlingDocId(null)}
                            className="px-2.5 py-1 text-[10px] border border-black/10 rounded-[2px] bg-white hover:bg-black/[0.02] text-black/55 transition-colors duration-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAltDocSubmit}
                            className="px-3 py-1 text-[10px] bg-black text-white font-bold tracking-[0.04em] uppercase rounded-[2px] hover:bg-black/90 transition-colors duration-200 cursor-pointer"
                          >
                            Apply Selection
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PROCEDURES CHECKLIST */}
          {activeTab === 'procs' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-black/[0.02] rounded-[12px] border border-black/6 text-[11px] text-black/55">
                <AlertTriangle size={14} className="text-accent-red shrink-0" />
                <p>
                  Checking a procedure records your user initials and date. If a checklist step does not apply to this client, use the <strong>Skip</strong> action.
                </p>
              </div>

              <div className="divide-y divide-black/6">
                {wpProcs.map((proc, index) => (
                  <div key={proc.id} className="py-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <button
                          disabled={isLocked}
                          onClick={() => toggleProcedure(proc.id, proc.status)}
                          className={`mt-0.5 w-4 h-4 rounded-[2px] border flex items-center justify-center transition-colors duration-200 cursor-pointer shrink-0 ${
                            proc.status === 'done'
                              ? 'bg-emerald-650 border-emerald-600 text-white bg-emerald-600'
                              : 'bg-white border-black/10 hover:border-black/30'
                          }`}
                        >
                          {proc.status === 'done' && <Check size={11} />}
                        </button>

                        <div className="space-y-0.5">
                          <p className={`text-[12.5px] ${proc.status === 'done' ? 'line-through text-black/35' : 'text-black font-normal'}`}>
                            {index + 1}. {proc.description}
                          </p>
                          
                          {proc.status === 'done' && proc.performed_by && (
                            <span className="block text-[9px] text-emerald-600 font-bold tracking-[0.04em] uppercase">
                              Completed by {users.find(u => u.id === proc.performed_by)?.initials} on {proc.performed_at}
                            </span>
                          )}
                          {proc.status === 'skipped' && (
                            <div className="space-y-0.5 mt-1 text-[10px] text-amber-600 pl-2 border-l-2 border-amber-300/40 font-mono">
                              <span className="font-bold uppercase tracking-[0.1em] text-[9px] block">Skipped Step Justification:</span>
                              <p className="italic">{proc.skip_reason}</p>
                              {proc.performed_by && (
                                <span className="block text-[9px] font-bold text-black/40 mt-0.5 uppercase tracking-[0.04em]">
                                  Bypassed by {users.find(u => u.id === proc.performed_by)?.initials} on {proc.performed_at}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {!isLocked && (
                        proc.status !== 'done' && proc.status !== 'skipped' ? (
                          <button
                            onClick={() => openSkipProcDialog(proc.id)}
                            className="px-2 py-0.5 border border-black/10 text-[9px] text-black/40 hover:text-black/55 hover:bg-black/[0.02] rounded-[2px] font-bold cursor-pointer transition-colors duration-200 uppercase tracking-[0.04em]"
                          >
                            Skip
                          </button>
                        ) : proc.status === 'skipped' ? (
                          <button
                            onClick={() => toggleProcedure(proc.id, 'skipped')}
                            className="px-2 py-0.5 border border-black/10 text-[9px] text-black/40 hover:text-black/55 hover:bg-black/[0.02] rounded-[2px] font-bold cursor-pointer transition-colors duration-200 uppercase tracking-[0.04em]"
                          >
                            Reinstate
                          </button>
                        ) : null
                      )}
                    </div>

                    {/* Inline Skip Reasoning Dialog Box */}
                    {skippingProcId === proc.id && (
                      <div className="p-3 bg-black/[0.02] rounded-[12px] border border-black/6 space-y-2 animate-fadeInUp">
                        <span className="text-[10px] font-bold text-black/35 block uppercase tracking-[0.1em]">Audit Procedure Bypass Justification</span>
                        <textarea
                          rows={2}
                          value={skipReason}
                          onChange={(e) => setSkipReason(e.target.value)}
                          placeholder="Provide the rationale explaining why this substantive procedure does not apply or is covered elsewhere..."
                          className="w-full px-3 py-1.5 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black transition-colors duration-200"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSkippingProcId(null)}
                            className="px-2 py-0.5 text-[9px] border border-black/10 rounded-[2px] bg-white hover:bg-black/[0.02] text-black/55 transition-colors duration-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSkipProcSubmit}
                            className="px-3 py-0.5 text-[9px] bg-black text-white font-bold tracking-[0.04em] uppercase rounded-[2px] hover:bg-black/90 transition-colors duration-200 cursor-pointer"
                          >
                            Confirm Skip
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: FINDINGS & CONCLUSION */}
        <div className="space-y-6">
          
          {/* STAGE 4: INTERACTIVE OBSERVATION GRID LEDGER */}
          <div className="bg-white border border-black/6 rounded-[12px] p-6 space-y-4 ui-enter-stagger" style={{ '--enter-delay': '0.14s' } as React.CSSProperties}>
            <div className="flex justify-between items-center pb-2 border-b border-black/6">
              <h2 className="bebas-display text-[20px] tracking-[0.04em] text-black">
                Interactive Observations Grid
              </h2>
              {!isLocked && (
                <button
                  onClick={() => setIsAddObsOpen(true)}
                  className="flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-[2px] text-[10px] font-bold tracking-[0.04em] uppercase hover:bg-black/90 transition-colors cursor-pointer"
                >
                  <Plus size={11} />
                  <span>Log Error</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-black/6 space-y-3">
              {wpObservations.length === 0 ? (
                <div className="text-center py-6 text-[12.5px] text-black/40 italic">
                  No sample exceptions or variances logged in observations grid.
                </div>
              ) : (
                wpObservations.map(obs => (
                  <div key={obs.id} className="pt-3 first:pt-0 space-y-2 text-[12.5px]">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-black">{obs.title}</h4>
                          <span className={`text-[9px] font-bold tracking-[0.04em] uppercase px-1.5 py-0.5 rounded-[2px] ${
                            obs.disposition === 'rectified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            obs.disposition === 'waived' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                            obs.disposition === 'escalated' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-black/[0.03] text-black/40 border border-black/8'
                          }`}>
                            {obs.disposition || 'unaddressed'}
                          </span>
                        </div>
                        <p className="text-black/55 mt-1 font-mono text-[11px] leading-relaxed">
                          {obs.findings_description}
                        </p>
                      </div>
                      
                      {!isLocked && (
                        <button 
                          onClick={() => deleteObservation(obs.id)}
                          className="text-black/35 hover:text-accent-red p-1 cursor-pointer transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[10px] text-black/40 font-mono border-t border-black/[0.04] pt-1">
                      <span>Row Ref: {obs.excel_row_reference}</span>
                      <span className="font-bold text-black/55">Value Exposed: ₹{obs.financial_impact.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Observations Text Area (Senior Notes) */}
          <div className="bg-white border border-black/6 rounded-[12px] p-6 space-y-3 ui-enter-stagger" style={{ '--enter-delay': '0.18s' } as React.CSSProperties}>
            <div className="flex justify-between items-center pb-2 border-b border-black/6">
              <h2 className="bebas-display text-[20px] tracking-[0.04em] text-black">
                3. Audit Observations Draft
              </h2>
              <span className="text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">
                Free Text Memo
              </span>
            </div>
            
            <textarea
              rows={4}
              disabled={isLocked}
              value={obsText}
              onChange={(e) => setObsText(e.target.value)}
              placeholder="Record transactions verified, confirmations sent, discrepancies found..."
              className="w-full p-4 text-[13px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black leading-relaxed transition-colors duration-200 font-mono"
            />
          </div>

          {/* Conclusion Panel (Section 8 critical rules) */}
          <div className="bg-white border-2 border-accent-red/20 rounded-[12px] p-6 space-y-3 ui-enter-stagger" style={{ '--enter-delay': '0.24s' } as React.CSSProperties}>
            <div className="flex justify-between items-center pb-2 border-b border-black/6">
              <h2 className="bebas-display text-[20px] tracking-[0.04em] text-black flex items-center gap-1.5">
                <span>4. Audit Conclusion & Judgment</span>
                <span className="text-[8px] bg-accent-red/10 text-accent-red border border-accent-red/20 px-1.5 py-0.5 rounded-[2px] uppercase tracking-[0.1em] font-bold">
                  SA-230 Critical
                </span>
              </h2>
            </div>
            
            {/* Warning block */}
            <div className="p-3.5 bg-accent-red/5 border border-accent-red/10 rounded-[12px] flex items-start gap-2.5">
              <AlertTriangle size={15} className="text-accent-red shrink-0 mt-0.5" />
              <div className="text-[11px] text-accent-red leading-normal font-medium">
                <strong>Written by the auditor — professional judgment applies.</strong>
                <p className="text-[10px] text-black/55 font-normal mt-0.5">
                  WPO.inc does not auto-fill, suggest, or templates audit conclusions. You must document your own evaluation of the sufficiency of audit evidence.
                </p>
              </div>
            </div>

            <textarea
              rows={5}
              disabled={isLocked}
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="e.g., Based on our substantative testing, confirmation circularisation representing 72% of balances, and subsequent bank statements verification, we conclude that Trade Receivables are fairly stated in all material respects and conform with MSME Disclosure timelines..."
              className="w-full p-4 text-[13px] font-news italic bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black leading-relaxed transition-colors duration-200"
            />
          </div>
        </div>
      </div>
      
      {/* Page bottom banner containing Audit trail logs for this Working Paper */}
      <div className="bg-white border border-black/6 rounded-[12px] p-6 ui-enter-stagger" style={{ '--enter-delay': '0.30s' } as React.CSSProperties}>
        <h3 className="bebas-display text-[20px] tracking-[0.04em] text-black mb-3">
          Working Paper Audit Trail Logs (SA-230 Integrity Record)
        </h3>
        <div className="max-h-[160px] overflow-y-auto divide-y divide-black/6 pr-2">
          {useAppStore.getState().auditTrail
            .filter(t => t.working_paper_id === wpId)
            .map((t) => (
              <div key={t.id} className="py-2 text-[10px] flex items-baseline justify-between text-black/55">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-black/35">[{new Date(t.created_at).toLocaleTimeString()}]</span>
                  <span className="font-medium text-black">{t.action.replace(/_/g, ' ').toUpperCase()}</span>
                  <span className="text-[9px] text-black/35">({JSON.stringify(t.detail)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Auditor Initials: {t.user_id ? (users.find(u => u.id === t.user_id)?.initials || 'Sys') : 'Sys'}</span>
                  <span className="font-mono text-black/35">IP: {t.ip_address}</span>
                </div>
              </div>
            ))}
          {useAppStore.getState().auditTrail.filter(t => t.working_paper_id === wpId).length === 0 && (
            <p className="text-center text-[10px] text-black/40 italic py-4">No audit actions logged yet.</p>
          )}
        </div>
      </div>

      {/* STAGE 4: SUBMISSION LOCK DIALOG MODAL */}
      {isSubmitLockOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-black/8 rounded-[12px] w-full max-w-[550px] shadow-2xl p-7 space-y-4 animate-fadeInUp">
            <div className="flex justify-between items-center border-b border-black/6 pb-2">
              <h3 className="bebas-display text-[22px] text-black tracking-[0.04em]">Sealing & Submission Protocol</h3>
              <button onClick={() => setIsSubmitLockOpen(false)} className="text-black/30 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-[13px]">
              <div className="p-3.5 bg-red-50 border border-red-200 text-accent-red text-[11px] rounded-[12px] leading-relaxed">
                <ShieldAlert size={14} className="inline mr-1" />
                <strong>Professional Standards Warning:</strong> Submitting will hard-lock the worksheet. All upload, deletion, and edit privileges will be revoked. Lead review sheet will be cryptographically hashed.
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Core Audit Objective Assessed</label>
                <input
                  type="text"
                  required
                  placeholder="Describe objective assessed..."
                  value={lockObjective}
                  onChange={(e) => setLockObjective(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-black/10 rounded-[2px]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Sample Size & Basis of Selection (SA 530)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Selected top 15 receivables accounting for 72% of total value..."
                  value={lockSampleSize}
                  onChange={(e) => setLockSampleSize(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-black/10 rounded-[2px]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Substantive Audit Conclusion Category</label>
                <select
                  value={lockConclusion}
                  onChange={(e) => setLockConclusion(e.target.value as any)}
                  className="w-full bg-white border border-black/10 rounded-[2px] px-3 py-2 text-[13px]"
                >
                  <option value="Satisfactory">Satisfactory</option>
                  <option value="Modified">Modified</option>
                  <option value="Significant Unresolved Matters">Significant Unresolved Matters</option>
                </select>
              </div>

              {/* SA 200 Positive Confirmation check */}
              <label className="flex items-start gap-2.5 p-3.5 bg-black/[0.02] border border-black/6 rounded-[12px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={lockConfirmChecked}
                  onChange={(e) => setLockConfirmChecked(e.target.checked)}
                  className="mt-0.5 accent-black shrink-0"
                />
                <span className="text-[11px] text-black/60 leading-normal">
                  <strong>Positive Confirmation:</strong> I confirm under penalty of SA 200 and professional ethics that I have accurately logged all identified variances exceeding the trivial threshold inside the Interactive Observation Ledger.
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-black/6">
              <button
                type="button"
                onClick={() => setIsSubmitLockOpen(false)}
                className="px-4 py-2 border border-black/10 rounded-[2px] text-[11px] font-bold text-black/55 uppercase hover:bg-black/[0.02]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmitForReview}
                className="bg-black text-white px-5 py-2 rounded-[2px] text-[11px] font-bold tracking-[0.04em] uppercase hover:bg-black/90 transition-colors"
              >
                Seal & Lock File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD OBSERVATION DIALOG MODAL */}
      {isAddObsOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-black/8 rounded-[12px] w-full max-w-[500px] shadow-2xl p-6 space-y-4 animate-fadeInUp">
            <div className="flex justify-between items-center border-b border-black/6 pb-2">
              <h3 className="bebas-display text-[20px] text-black tracking-[0.04em]">Log Sample Exception / Variance</h3>
              <button onClick={() => setIsAddObsOpen(false)} className="text-black/30 hover:text-black"><X size={18} /></button>
            </div>

            <form onSubmit={submitAddObservation} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Observation / Discrepancy Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cut-off mismatch on sales invoices"
                  value={obsTitle}
                  onChange={(e) => setObsTitle(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-black/10 rounded-[2px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Financial Exposure (₹)</label>
                  <input
                    type="number"
                    required
                    value={obsImpact}
                    onChange={(e) => setObsImpact(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-white border border-black/10 rounded-[2px] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Excel Vouch Row Reference</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tab 'Sales', rows 45 to 80"
                    value={obsExcelRef}
                    onChange={(e) => setObsExcelRef(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-white border border-black/10 rounded-[2px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Detailed Findings Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the discrepancy details, physical evidence audited, audit policies breached..."
                  value={obsDesc}
                  onChange={(e) => setObsDesc(e.target.value)}
                  className="w-full p-3 text-[13px] bg-white border border-black/10 rounded-[2px] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddObsOpen(false)}
                  className="px-4 py-2 border border-black/10 rounded-[2px] text-[11px] font-bold text-black/55 uppercase hover:bg-black/[0.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-5 py-2 rounded-[2px] text-[11px] font-bold tracking-[0.04em] uppercase"
                >
                  Log Observation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
