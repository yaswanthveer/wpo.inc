import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Firm, User, Client, Engagement, AuditArea, 
  WorkingPaper, Document, Procedure, AuditTrail, SupabaseSettings,
  PlanningData, ClientRequest, ClientPortalToken, Observation,
  ReviewNote, SubmissionLock, EngagementArchive, PostLockdownAddendum,
  TrashBinItem
} from './schema';

interface AppState {
  // Tables
  firms: Firm[];
  users: User[];
  clients: Client[];
  engagements: Engagement[];
  auditAreas: AuditArea[];
  workingPapers: WorkingPaper[];
  documents: Document[];
  procedures: Procedure[];
  auditTrail: AuditTrail[];
  
  // New tables for full lifecycle
  clientRequests: ClientRequest[];
  clientPortalTokens: ClientPortalToken[];
  observations: Observation[];
  reviewNotes: ReviewNote[];
  postLockdownAddenda: PostLockdownAddendum[];
  trashBin: TrashBinItem[];
  
  // App Config & Session
  currentUser: User | null;
  currentFirm: Firm | null;
  supabaseSettings: SupabaseSettings;
  
  // Actions
  onboardFirm: (firmData: { name: string; registrationNumber: string; city: string; state: string }, partnerName: string, partnerEmail: string) => void;
  loginUser: (email: string) => boolean;
  logoutUser: () => void;
  addStaff: (user: Omit<User, 'id' | 'firm_id' | 'created_at'>) => void;
  removeStaff: (userId: string) => void;
  
  createEngagement: (engagementData: {
    clientName: string;
    pan?: string;
    city?: string;
    industry?: string;
    financialYear: string;
    engagementType: 'Statutory Audit' | 'Tax Audit' | 'Internal Audit';
    partnerId?: string;
    managerId?: string;
  }) => string;
  
  updateEngagementStatus: (engagementId: string, status: Engagement['status']) => void;
  updateAuditAreaStatus: (areaId: string, status: AuditArea['status']) => void;
  
  updateWorkingPaper: (wpId: string, data: Partial<Pick<WorkingPaper, 'objective' | 'observations' | 'conclusion' | 'status' | 'prepared_by' | 'reviewed_by' | 'submission_lock' | 'version'>>) => void;
  updateDocumentStatus: (docId: string, status: Document['status'], note?: string, fileData?: { fileName: string; fileSize: number }) => void;
  updateProcedureStatus: (procId: string, status: Procedure['status'], skipReason?: string) => void;
  
  addAuditTrail: (action: string, detail: Record<string, any>, wpId?: string, engagementId?: string) => void;
  updateSupabaseSettings: (settings: SupabaseSettings) => void;

  // Stage 1 Actions
  updatePlanning: (engagementId: string, data: Partial<PlanningData>) => void;
  finalizePlanning: (engagementId: string) => void;

  // Stage 2 Actions
  addCustomAuditArea: (engagementId: string, name: string, objective: string) => void;
  updateAuditAreaName: (areaId: string, name: string) => void;
  deleteAuditArea: (areaId: string) => void;
  restoreAuditArea: (trashId: string) => void;
  updateAreaAssignment: (areaId: string, data: { assignerId?: string; assigneeId?: string; targetDate?: string }) => void;
  publishAuditProgram: (engagementId: string) => void;

  // Stage 3 Actions
  createClientRequest: (engagementId: string, areaId: string, documentRequested: string, periodContext: string, priority: 'High' | 'Medium' | 'Low') => void;
  approveClientRequest: (requestId: string) => void;
  deleteClientRequest: (requestId: string) => void;
  clonePriorYearRequests: (engagementId: string, sourceEngagementId: string) => void;
  generateClientPortalToken: (engagementId: string, clientEmail: string) => ClientPortalToken;
  clientUploadDocument: (requestId: string, fileData: { fileName: string; fileSize: number }) => void;
  verifyClientDocument: (requestId: string, accept: boolean, comment?: string) => void;

  // Stage 4 Actions
  addObservation: (wpId: string, title: string, financialImpact: number, findingsDescription: string, excelRowReference: string) => void;
  updateObservation: (obsId: string, data: Partial<Observation>) => void;
  deleteObservation: (obsId: string) => void;
  lockAndSubmitForReview: (wpId: string, data: { auditObjectiveAssessed: string; sampleSizeBasis: string; substantiveConclusion: SubmissionLock['substantive_conclusion']; positiveConfirmationChecked: boolean; leadSheetHash?: string }) => void;

  // Stage 5 Actions
  setObservationDisposition: (obsId: string, disposition: Observation['disposition'], reference?: string) => void;
  addReviewNote: (wpId: string, text: string) => void;
  rejectAndBounceBack: (wpId: string, reviewNoteText: string) => void;
  approveAndSignOff: (wpId: string) => void;

  // Stage 6 Actions
  setAuditReportDate: (engagementId: string, date: string) => { success: boolean; error?: string };
  addPostLockdownAddendum: (engagementId: string, data: { reason: string; content: string }) => void;
  checkAndApplyArchiveLock: (engagementId: string) => void;
}

const DEFAULT_AREAS = [
  { code: 'GEN', name: 'General Information and Entity Understanding' },
  { code: 'RSK', name: 'Risk Assessment and Audit Planning' },
  { code: 'CAN', name: 'Cash and Bank Balances' },
  { code: 'TRE', name: 'Trade Receivables' },
  { code: 'INV', name: 'Inventories' },
  { code: 'REV', name: 'Revenue from Operations' },
  { code: 'PPE', name: 'Property, Plant and Equipment' },
  { code: 'LAD', name: 'Loans and Advances' },
  { code: 'EMP', name: 'Employee Benefits and Expenses' },
  { code: 'TAX', name: 'Taxes, Duties and Provisions' },
  { code: 'RPT', name: 'Related Party Transactions' },
  { code: 'CLO', name: 'Closing, Review and Sign-off' },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      firms: [],
      users: [],
      clients: [],
      engagements: [],
      auditAreas: [],
      workingPapers: [],
      documents: [],
      procedures: [],
      auditTrail: [],
      
      clientRequests: [],
      clientPortalTokens: [],
      observations: [],
      reviewNotes: [],
      postLockdownAddenda: [],
      trashBin: [],
      
      currentUser: null,
      currentFirm: null,
      supabaseSettings: {
        supabaseUrl: '',
        supabaseAnonKey: '',
        isEnabled: false,
      },

      onboardFirm: (firmData, partnerName, partnerEmail) => {
        const firmId = crypto.randomUUID();
        const partnerId = crypto.randomUUID();

        const newFirm: Firm = {
          id: firmId,
          name: firmData.name,
          registration_number: firmData.registrationNumber,
          city: firmData.city,
          state: firmData.state,
          created_at: new Date().toISOString(),
        };

        const newPartner: User = {
          id: partnerId,
          firm_id: firmId,
          full_name: partnerName,
          designation: 'Partner',
          initials: partnerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3),
          email: partnerEmail.toLowerCase().trim(),
          created_at: new Date().toISOString(),
        };

        set(state => ({
          firms: [...state.firms, newFirm],
          users: [...state.users, newPartner],
          currentFirm: newFirm,
          currentUser: newPartner,
        }));

        get().addAuditTrail('firm_onboarded', { firmName: newFirm.name, partnerName: newPartner.full_name });
      },

      loginUser: (email) => {
        const cleanedEmail = email.toLowerCase().trim();
        const user = get().users.find(u => u.email.toLowerCase() === cleanedEmail);
        if (user) {
          const firm = get().firms.find(f => f.id === user.firm_id);
          set({
            currentUser: user,
            currentFirm: firm || null,
          });
          get().addAuditTrail('user_login', { email: cleanedEmail });
          return true;
        }
        return false;
      },

      logoutUser: () => {
        const user = get().currentUser;
        if (user) {
          get().addAuditTrail('user_logout', { email: user.email });
        }
        set({ currentUser: null, currentFirm: null });
      },

      addStaff: (userData) => {
        const firm = get().currentFirm;
        if (!firm) return;

        const newUser: User = {
          ...userData,
          id: crypto.randomUUID(),
          firm_id: firm.id,
          initials: userData.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3),
          email: userData.email.toLowerCase().trim(),
          created_at: new Date().toISOString(),
        };

        set(state => ({
          users: [...state.users, newUser]
        }));

        get().addAuditTrail('staff_added', { name: newUser.full_name, designation: newUser.designation });
      },

      removeStaff: (userId) => {
        const target = get().users.find(u => u.id === userId);
        if (!target) return;

        set(state => ({
          users: state.users.filter(u => u.id !== userId)
        }));

        get().addAuditTrail('staff_removed', { name: target.full_name, designation: target.designation });
      },

      createEngagement: (engagementData) => {
        const firm = get().currentFirm;
        if (!firm) throw new Error("No firm context found");

        const clientId = crypto.randomUUID();
        const newClient: Client = {
          id: clientId,
          firm_id: firm.id,
          name: engagementData.clientName,
          pan: engagementData.pan,
          city: engagementData.city,
          industry: engagementData.industry,
          created_at: new Date().toISOString(),
        };

        const engagementId = crypto.randomUUID();
        const newEngagement: Engagement = {
          id: engagementId,
          firm_id: firm.id,
          client_id: clientId,
          financial_year: engagementData.financialYear,
          engagement_type: engagementData.engagementType,
          status: 'not-started',
          partner_id: engagementData.partnerId || get().currentUser?.id,
          manager_id: engagementData.managerId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          planning: {
            planning_finalized: false
          }
        };

        // Create standard audit areas
        const newAreas: AuditArea[] = DEFAULT_AREAS.map(area => ({
          id: crypto.randomUUID(),
          engagement_id: engagementId,
          code: area.code,
          name: area.name,
          status: 'pending',
          completion_pct: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        // Create working papers & documents & procedures for each area
        const newWps: WorkingPaper[] = [];
        const newDocs: Document[] = [];
        const newProcs: Procedure[] = [];

        newAreas.forEach(area => {
          const wpId = crypto.randomUUID();
          
          let title = `${area.name} Working Paper`;
          let objective = `To obtain reasonable assurance that the balances and disclosures in respect of ${area.name} are free from material misstatements and conform to applicable auditing guidelines.`;
          
          if (area.code === 'TRE') {
            title = 'Trade Receivables Audit Documentation';
            objective = 'To verify the existence, ownership, completeness, valuation, and presentation of Trade Receivables as at the balance sheet date, including checking MSME compliance.';
          } else if (area.code === 'CAN') {
            title = 'Cash and Bank Balances Documentation';
            objective = 'To verify cash balances on hand and confirm correctness of bank deposits and reconciliation statements.';
          }

          newWps.push({
            id: wpId,
            area_id: area.id,
            engagement_id: engagementId,
            reference_code: `WP-${area.code}-001`,
            title,
            objective,
            observations: area.code === 'TRE' 
              ? 'Preliminary review of receivables ledger shows standard credit cycles (30-60 days) for key institutional clients. Total debtor balances under review amount to ₹4.8 Crores. We have circularized confirmation letters for the top 15 debtors, representing 72% of the overall balance.'
              : `Review of ${area.name} is initiated. Default templates loaded.`,
            conclusion: undefined,
            status: 'draft',
            version: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          // Add default documents and procedures
          if (area.code === 'TRE') {
            const docsData = [
              { name: 'Trade Receivables Ledger', ref: 'TRE/D/01' },
              { name: 'Ageing Analysis as at year-end', ref: 'TRE/D/02' },
              { name: 'Debtor Confirmation Letters / Circularisation', ref: 'TRE/D/03' },
              { name: 'Subsequent Collection Evidence', ref: 'TRE/D/04' },
              { name: 'Board Approval for Provision', ref: 'TRE/D/05' },
              { name: 'Bad Debt Write-off Approvals', ref: 'TRE/D/06' },
            ];
            docsData.forEach(d => {
              newDocs.push({
                id: crypto.randomUUID(),
                working_paper_id: wpId,
                name: d.name,
                reference_code: d.ref,
                status: 'pending',
                created_at: new Date().toISOString(),
              });
            });

            const procsData = [
              'Obtain and agree trade receivables schedule to GL and trial balance',
              'Review ageing analysis and assess recoverability',
              'Evaluate adequacy of provision for doubtful debts',
              'Send confirmation letters or perform alternative procedure',
              'Trace subsequent collections to bank statements',
              'Verify debtors for related party nature and disclosure',
              'Review MSME compliance — balances beyond 45 days',
            ];
            procsData.forEach((p, idx) => {
              newProcs.push({
                id: crypto.randomUUID(),
                working_paper_id: wpId,
                description: p,
                status: 'pending',
                sort_order: idx,
                created_at: new Date().toISOString(),
              });
            });
          } else {
            newDocs.push({
              id: crypto.randomUUID(),
              working_paper_id: wpId,
              name: `${area.name} Lead Schedule / Reconciliation`,
              reference_code: `${area.code}/D/01`,
              status: 'pending',
              created_at: new Date().toISOString(),
            });
            newDocs.push({
              id: crypto.randomUUID(),
              working_paper_id: wpId,
              name: `Supporting Audit Evidence / Vouchers`,
              reference_code: `${area.code}/D/02`,
              status: 'pending',
              created_at: new Date().toISOString(),
            });

            newProcs.push({
              id: crypto.randomUUID(),
              working_paper_id: wpId,
              description: `Obtain lead schedule and reconcile it to the General Ledger and Trial Balance.`,
              status: 'pending',
              sort_order: 0,
              created_at: new Date().toISOString(),
            });
            newProcs.push({
              id: crypto.randomUUID(),
              working_paper_id: wpId,
              description: `Conduct substantive audit procedures, verify sample transactions, and review disclosure compliance.`,
              status: 'pending',
              sort_order: 1,
              created_at: new Date().toISOString(),
            });
          }
        });

        set(state => ({
          clients: [...state.clients, newClient],
          engagements: [...state.engagements, newEngagement],
          auditAreas: [...state.auditAreas, ...newAreas],
          workingPapers: [...state.workingPapers, ...newWps],
          documents: [...state.documents, ...newDocs],
          procedures: [...state.procedures, ...newProcs],
        }));

        get().addAuditTrail('engagement_created', { clientName: newClient.name, year: newEngagement.financial_year }, undefined, engagementId);

        return engagementId;
      },

      updateEngagementStatus: (engagementId, status) => {
        set(state => ({
          engagements: state.engagements.map(e => 
            e.id === engagementId 
              ? { ...e, status, updated_at: new Date().toISOString() } 
              : e
          )
        }));
        get().addAuditTrail('engagement_status_updated', { status }, undefined, engagementId);
      },

      updateAuditAreaStatus: (areaId, status) => {
        set(state => ({
          auditAreas: state.auditAreas.map(a => 
            a.id === areaId 
              ? { ...a, status, updated_at: new Date().toISOString() } 
              : a
          )
        }));
      },

      updateWorkingPaper: (wpId, data) => {
        const wp = get().workingPapers.find(w => w.id === wpId);
        if (!wp) return;

        set(state => ({
          workingPapers: state.workingPapers.map(w => 
            w.id === wpId 
              ? { ...w, ...data, updated_at: new Date().toISOString() } 
              : w
          )
        }));

        if (data.conclusion !== undefined) {
          get().addAuditTrail('conclusion_saved', { length: data.conclusion.length }, wpId, wp.engagement_id);
        }
        if (data.status && data.status !== wp.status) {
          get().addAuditTrail('wp_status_changed', { oldStatus: wp.status, newStatus: data.status }, wpId, wp.engagement_id);
        }

        // Recalculate Audit Area progress
        const areaId = wp.area_id;
        const areaProcs = get().procedures.filter(p => p.working_paper_id === wpId);
        const areaDocs = get().documents.filter(d => d.working_paper_id === wpId);
        
        const completedProcs = areaProcs.filter(p => p.status === 'done' || p.status === 'skipped').length;
        const handledDocs = areaDocs.filter(d => d.status !== 'pending').length;
        
        const totalItems = areaProcs.length + areaDocs.length;
        const completedItems = completedProcs + handledDocs;
        
        const completionPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        
        // auto update audit area status if needed
        let areaStatus: AuditArea['status'] = 'in-progress';
        if (completionPct === 100) {
          areaStatus = data.status === 'approved' ? 'complete' : (wp.status === 'review' || data.status === 'review' ? 'review' : 'in-progress');
        } else if (completionPct === 0) {
          areaStatus = 'pending';
        }

        set(state => ({
          auditAreas: state.auditAreas.map(a => 
            a.id === areaId 
              ? { ...a, completion_pct: completionPct, status: areaStatus, updated_at: new Date().toISOString() } 
              : a
          )
        }));
      },

      updateDocumentStatus: (docId, status, note, fileData) => {
        const doc = get().documents.find(d => d.id === docId);
        if (!doc) return;

        set(state => ({
          documents: state.documents.map(d => 
            d.id === docId 
              ? { 
                  ...d, 
                  status, 
                  note: note ?? d.note,
                  file_name: fileData?.fileName ?? d.file_name,
                  file_size: fileData?.fileSize ?? d.file_size,
                  file_path: fileData ? `documents/${crypto.randomUUID()}_${fileData.fileName}` : d.file_path,
                  uploaded_by: fileData ? get().currentUser?.id : d.uploaded_by,
                } 
              : d
          )
        }));

        const wp = get().workingPapers.find(w => w.id === doc.working_paper_id);
        get().addAuditTrail('document_status_changed', { 
          documentName: doc.name, 
          status, 
          noteProvided: !!note,
          fileName: fileData?.fileName 
        }, doc.working_paper_id, wp?.engagement_id);

        if (wp) {
          get().updateWorkingPaper(wp.id, {});
        }
      },

      updateProcedureStatus: (procId, status, skipReason) => {
        const proc = get().procedures.find(p => p.id === procId);
        if (!proc) return;

        set(state => ({
          procedures: state.procedures.map(p => 
            p.id === procId 
              ? { 
                  ...p, 
                  status, 
                  skip_reason: skipReason ?? p.skip_reason,
                  performed_by: status !== 'pending' ? get().currentUser?.id : undefined,
                  performed_at: status !== 'pending' ? new Date().toISOString().split('T')[0] : undefined
                } 
              : p
          )
        }));

        const wp = get().workingPapers.find(w => w.id === proc.working_paper_id);
        get().addAuditTrail('procedure_status_changed', { 
          procedureDesc: proc.description.substring(0, 60) + '...', 
          status, 
          skipReasonProvided: !!skipReason 
        }, proc.working_paper_id, wp?.engagement_id);

        if (wp) {
          get().updateWorkingPaper(wp.id, {});
        }
      },

      addAuditTrail: (action, detail, wpId, engagementId) => {
        const trail: AuditTrail = {
          id: crypto.randomUUID(),
          engagement_id: engagementId,
          working_paper_id: wpId,
          user_id: get().currentUser?.id,
          action,
          detail,
          ip_address: '192.168.1.51',
          created_at: new Date().toISOString(),
        };

        set(state => ({
          auditTrail: [trail, ...state.auditTrail]
        }));
      },

      updateSupabaseSettings: (settings) => {
        set({ supabaseSettings: settings });
        get().addAuditTrail('supabase_settings_updated', { isEnabled: settings.isEnabled });
      },

      // ── Stage 1 Actions ──
      updatePlanning: (engagementId, data) => {
        set(state => ({
          engagements: state.engagements.map(e => 
            e.id === engagementId 
              ? { 
                  ...e, 
                  planning: { 
                    ...e.planning, 
                    ...data 
                  },
                  updated_at: new Date().toISOString()
                } 
              : e
          )
        }));
        get().addAuditTrail('planning_updated', data, undefined, engagementId);
      },

      finalizePlanning: (engagementId) => {
        set(state => ({
          engagements: state.engagements.map(e => 
            e.id === engagementId 
              ? { 
                  ...e, 
                  planning: { 
                    ...e.planning, 
                    planning_finalized: true,
                    planning_finalized_at: new Date().toISOString()
                  },
                  status: 'in-progress',
                  updated_at: new Date().toISOString()
                } 
              : e
          )
        }));
        get().addAuditTrail('planning_finalized', {}, undefined, engagementId);
      },

      // ── Stage 2 Actions ──
      addCustomAuditArea: (engagementId, name, objective) => {
        const customAreaId = crypto.randomUUID();
        const code = `CST-${Math.floor(100 + Math.random() * 900)}`;
        
        const newArea: AuditArea = {
          id: customAreaId,
          engagement_id: engagementId,
          code,
          name,
          status: 'pending',
          completion_pct: 0,
          is_custom: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const wpId = crypto.randomUUID();
        const newWp: WorkingPaper = {
          id: wpId,
          area_id: customAreaId,
          engagement_id: engagementId,
          reference_code: `WP-${code}-001`,
          title: `${name} Custom Audit Documentation`,
          objective,
          status: 'draft',
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const newDoc: Document = {
          id: crypto.randomUUID(),
          working_paper_id: wpId,
          name: `${name} Custom Support Document`,
          reference_code: `${code}/D/01`,
          status: 'pending',
          created_at: new Date().toISOString(),
        };

        const newProc: Procedure = {
          id: crypto.randomUUID(),
          working_paper_id: wpId,
          description: `Verify and substantiate audit assertions relating to objective: ${objective}.`,
          status: 'pending',
          sort_order: 0,
          created_at: new Date().toISOString(),
        };

        set(state => ({
          auditAreas: [...state.auditAreas, newArea],
          workingPapers: [...state.workingPapers, newWp],
          documents: [...state.documents, newDoc],
          procedures: [...state.procedures, newProc],
        }));

        get().addAuditTrail('custom_area_injected', { name, code }, wpId, engagementId);
      },

      updateAuditAreaName: (areaId, name) => {
        set(state => ({
          auditAreas: state.auditAreas.map(a => 
            a.id === areaId 
              ? { ...a, name, updated_at: new Date().toISOString() } 
              : a
          )
        }));
        const area = get().auditAreas.find(a => a.id === areaId);
        if (area) {
          get().addAuditTrail('area_name_updated', { areaCode: area.code, newName: name }, undefined, area.engagement_id);
        }
      },

      deleteAuditArea: (areaId) => {
        const area = get().auditAreas.find(a => a.id === areaId);
        if (!area) return;

        const wp = get().workingPapers.find(w => w.area_id === areaId);
        const wpId = wp?.id;

        // Group cascading records for recovery
        const targetDocs = wpId ? get().documents.filter(d => d.working_paper_id === wpId) : [];
        const targetProcs = wpId ? get().procedures.filter(p => p.working_paper_id === wpId) : [];
        const targetReqs = get().clientRequests.filter(r => r.area_id === areaId);
        const targetObs = wpId ? get().observations.filter(o => o.working_paper_id === wpId) : [];
        const targetNotes = wpId ? get().reviewNotes.filter(n => n.working_paper_id === wpId) : [];

        const trashItem: TrashBinItem = {
          id: crypto.randomUUID(),
          deleted_at: new Date().toISOString(),
          type: 'audit_area',
          name: area.name,
          engagement_id: area.engagement_id,
          data: {
            area,
            workingPaper: wp,
            documents: targetDocs,
            procedures: targetProcs,
            clientRequests: targetReqs,
            observations: targetObs,
            reviewNotes: targetNotes,
          }
        };

        set(state => ({
          trashBin: [...state.trashBin, trashItem],
          auditAreas: state.auditAreas.filter(a => a.id !== areaId),
          workingPapers: state.workingPapers.filter(w => w.area_id !== areaId),
          documents: wpId ? state.documents.filter(d => d.working_paper_id !== wpId) : state.documents,
          procedures: wpId ? state.procedures.filter(p => p.working_paper_id !== wpId) : state.procedures,
          clientRequests: state.clientRequests.filter(r => r.area_id !== areaId),
          observations: wpId ? state.observations.filter(o => o.working_paper_id !== wpId) : state.observations,
          reviewNotes: wpId ? state.reviewNotes.filter(n => n.working_paper_id !== wpId) : state.reviewNotes,
        }));

        get().addAuditTrail('area_moved_to_trash', { areaCode: area.code, areaName: area.name, trashId: trashItem.id }, wpId, area.engagement_id);
      },

      restoreAuditArea: (trashId) => {
        const item = get().trashBin.find(t => t.id === trashId);
        if (!item) return;

        set(state => ({
          trashBin: state.trashBin.filter(t => t.id !== trashId),
          auditAreas: [...state.auditAreas, item.data.area],
          workingPapers: item.data.workingPaper ? [...state.workingPapers, item.data.workingPaper] : state.workingPapers,
          documents: [...state.documents, ...item.data.documents],
          procedures: [...state.procedures, ...item.data.procedures],
          clientRequests: [...state.clientRequests, ...item.data.clientRequests],
          observations: [...state.observations, ...item.data.observations],
          reviewNotes: [...state.reviewNotes, ...item.data.reviewNotes],
        }));

        get().addAuditTrail('area_restored_from_trash', { areaCode: item.data.area.code, areaName: item.data.area.name }, item.data.workingPaper?.id, item.engagement_id);
      },

      updateAreaAssignment: (areaId, data) => {
        set(state => ({
          auditAreas: state.auditAreas.map(a => 
            a.id === areaId 
              ? { 
                  ...a, 
                  assigner_id: data.assignerId ?? a.assigner_id,
                  assignee_id: data.assigneeId ?? a.assignee_id,
                  target_date: data.targetDate ?? a.target_date,
                  updated_at: new Date().toISOString()
                } 
              : a
          )
        }));
      },

      publishAuditProgram: (engagementId) => {
        set(state => ({
          engagements: state.engagements.map(e => 
            e.id === engagementId 
              ? { ...e, status: 'in-progress', updated_at: new Date().toISOString() } 
              : e
          )
        }));
        get().addAuditTrail('audit_program_published', {}, undefined, engagementId);
      },

      // ── Stage 3 Actions ──
      createClientRequest: (engagementId, areaId, documentRequested, periodContext, priority) => {
        const newReq: ClientRequest = {
          id: crypto.randomUUID(),
          engagement_id: engagementId,
          area_id: areaId,
          document_requested: documentRequested,
          period_context: periodContext,
          priority,
          status: 'pending-internal',
          requested_by: get().currentUser?.id || 'Unknown',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set(state => ({
          clientRequests: [...state.clientRequests, newReq]
        }));

        const area = get().auditAreas.find(a => a.id === areaId);
        get().addAuditTrail('client_request_created', { documentRequested, area: area?.code }, undefined, engagementId);
      },

      approveClientRequest: (requestId) => {
        set(state => ({
          clientRequests: state.clientRequests.map(r => 
            r.id === requestId 
              ? { ...r, status: 'approved', updated_at: new Date().toISOString() } 
              : r
          )
        }));
      },

      deleteClientRequest: (requestId) => {
        set(state => ({
          clientRequests: state.clientRequests.filter(r => r.id !== requestId)
        }));
      },

      clonePriorYearRequests: (engagementId, sourceEngagementId) => {
        const priorReqs = get().clientRequests.filter(r => r.engagement_id === sourceEngagementId);
        
        // Map old audit area codes to new ones
        const currentAreas = get().auditAreas.filter(a => a.engagement_id === engagementId);
        const sourceAreas = get().auditAreas.filter(a => a.engagement_id === sourceEngagementId);
        
        const clonedReqs: ClientRequest[] = [];
        
        priorReqs.forEach(oldReq => {
          const oldArea = sourceAreas.find(a => a.id === oldReq.area_id);
          if (!oldArea) return;
          const newArea = currentAreas.find(a => a.code === oldArea.code);
          if (!newArea) return;

          clonedReqs.push({
            id: crypto.randomUUID(),
            engagement_id: engagementId,
            area_id: newArea.id,
            document_requested: oldReq.document_requested,
            period_context: oldReq.period_context,
            priority: oldReq.priority,
            status: 'pending-internal',
            requested_by: get().currentUser?.id || 'Unknown',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });

        set(state => ({
          clientRequests: [...state.clientRequests, ...clonedReqs]
        }));
        get().addAuditTrail('prior_year_requests_cloned', { count: clonedReqs.length }, undefined, engagementId);
      },

      generateClientPortalToken: (engagementId, clientEmail) => {
        const existing = get().clientPortalTokens.find(t => t.engagement_id === engagementId && !t.is_used);
        if (existing) return existing;

        const token = crypto.randomUUID();
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // Simulated 6-digit OTP
        const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 14-day expiry
        
        const newToken: ClientPortalToken = {
          id: crypto.randomUUID(),
          engagement_id: engagementId,
          token,
          client_email: clientEmail,
          expires_at: expiresAt,
          otp_code: otpCode,
          is_used: false,
          created_at: new Date().toISOString(),
        };

        set(state => ({
          clientPortalTokens: [...state.clientPortalTokens, newToken],
          // Bulk approve all requests currently pending manager sign-off when link is shared
          clientRequests: state.clientRequests.map(r => 
            r.engagement_id === engagementId && r.status === 'pending-internal'
              ? { ...r, status: 'approved', updated_at: new Date().toISOString() } 
              : r
          )
        }));

        get().addAuditTrail('client_portal_shared', { email: clientEmail }, undefined, engagementId);
        return newToken;
      },

      clientUploadDocument: (requestId, fileData) => {
        const req = get().clientRequests.find(r => r.id === requestId);
        if (!req) return;

        set(state => ({
          clientRequests: state.clientRequests.map(r => 
            r.id === requestId 
              ? { 
                  ...r, 
                  status: 'received', 
                  client_uploaded_file: fileData.fileName,
                  client_uploaded_at: new Date().toISOString(),
                  updated_at: new Date().toISOString() 
                } 
              : r
          )
        }));

        get().addAuditTrail('client_uploaded_document', { fileName: fileData.fileName }, undefined, req.engagement_id);
      },

      verifyClientDocument: (requestId, accept, comment) => {
        const req = get().clientRequests.find(r => r.id === requestId);
        if (!req) return;

        if (accept) {
          // Ingest client document directly as a verified working paper document artifact
          const wps = get().workingPapers.filter(w => w.engagement_id === req.engagement_id);
          const area = get().auditAreas.find(a => a.id === req.area_id);
          const targetWp = wps.find(w => w.area_id === req.area_id);
          
          if (targetWp) {
            const newDocId = crypto.randomUUID();
            const newDoc: Document = {
              id: newDocId,
              working_paper_id: targetWp.id,
              name: req.document_requested,
              reference_code: `${area?.code}/D/C-${Math.floor(100 + Math.random() * 900)}`,
              status: 'obtained',
              file_name: req.client_uploaded_file,
              file_size: 1024 * 450, // mock file size: 450KB
              file_path: `documents/client_${crypto.randomUUID()}_${req.client_uploaded_file}`,
              uploaded_by: get().currentUser?.id || 'Client Portal',
              created_at: new Date().toISOString(),
            };

            set(state => ({
              documents: [...state.documents, newDoc],
              clientRequests: state.clientRequests.map(r => 
                r.id === requestId 
                  ? { ...r, status: 'verified', manager_verified: true, updated_at: new Date().toISOString() } 
                  : r
              )
            }));

            // Force update progress for working paper
            get().updateWorkingPaper(targetWp.id, {});
            get().addAuditTrail('client_document_verified', { documentName: req.document_requested, action: 'accepted' }, targetWp.id, req.engagement_id);
          }
        } else {
          // Reject document back to the client
          set(state => ({
            clientRequests: state.clientRequests.map(r => 
              r.id === requestId 
                ? { 
                    ...r, 
                    status: 'rejected', 
                    manager_comment: comment ?? 'Rejected by auditor.', 
                    client_uploaded_file: undefined,
                    client_uploaded_at: undefined,
                    updated_at: new Date().toISOString() 
                  } 
                : r
            )
          }));
          get().addAuditTrail('client_document_rejected', { documentName: req.document_requested, reason: comment }, undefined, req.engagement_id);
        }
      },

      // ── Stage 4 Actions ──
      addObservation: (wpId, title, financialImpact, findingsDescription, excelRowReference) => {
        const wp = get().workingPapers.find(w => w.id === wpId);
        if (!wp) return;

        const newObs: Observation = {
          id: crypto.randomUUID(),
          working_paper_id: wpId,
          engagement_id: wp.engagement_id,
          title,
          financial_impact: financialImpact,
          findings_description: findingsDescription,
          excel_row_reference: excelRowReference,
          disposition: 'pending',
          created_by: get().currentUser?.full_name || 'System',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set(state => ({
          observations: [...state.observations, newObs]
        }));
        get().addAuditTrail('observation_logged', { title, amount: financialImpact }, wpId, wp.engagement_id);
      },

      updateObservation: (obsId, data) => {
        set(state => ({
          observations: state.observations.map(o => 
            o.id === obsId 
              ? { ...o, ...data, updated_at: new Date().toISOString() } 
              : o
          )
        }));
      },

      deleteObservation: (obsId) => {
        set(state => ({
          observations: state.observations.filter(o => o.id !== obsId)
        }));
      },

      lockAndSubmitForReview: (wpId, data) => {
        const wp = get().workingPapers.find(w => w.id === wpId);
        if (!wp) return;

        // Force check: SA 200 Guardrail check must be true
        if (!data.positiveConfirmationChecked) {
          throw new Error("SA 200 Positive Confirmation must be explicitly checked before submitting.");
        }

        const newLock: SubmissionLock = {
          working_paper_id: wpId,
          audit_objective_assessed: data.auditObjectiveAssessed,
          sample_size_basis: data.sampleSizeBasis,
          substantive_conclusion: data.substantiveConclusion,
          positive_confirmation_checked: true,
          locked_at: new Date().toISOString(),
          locked_by: get().currentUser?.full_name || 'Unknown',
          lead_sheet_hash: data.leadSheetHash ?? `SHA-256:${crypto.randomUUID().slice(0, 16)}`,
          version: wp.version || 1,
        };

        // Update working paper: set status to review, append submission lock
        get().updateWorkingPaper(wpId, {
          status: 'review',
          submission_lock: newLock,
        });

        // Trigger area status update
        const area = get().auditAreas.find(a => a.id === wp.area_id);
        if (area) {
          get().updateAuditAreaStatus(area.id, 'review');
        }

        get().addAuditTrail('wp_submitted_for_review', { version: wp.version || 1 }, wpId, wp.engagement_id);
      },

      // ── Stage 5 Actions ──
      setObservationDisposition: (obsId, disposition, reference) => {
        set(state => ({
          observations: state.observations.map(o => 
            o.id === obsId 
              ? { 
                  ...o, 
                  disposition, 
                  disposition_reference: reference ?? o.disposition_reference,
                  updated_at: new Date().toISOString() 
                } 
              : o
          )
        }));
      },

      addReviewNote: (wpId, text) => {
        const wp = get().workingPapers.find(w => w.id === wpId);
        if (!wp) return;

        const newNote: ReviewNote = {
          id: crypto.randomUUID(),
          working_paper_id: wpId,
          author_id: get().currentUser?.id || 'Unknown',
          author_name: get().currentUser?.full_name || 'Reviewer',
          text,
          created_at: new Date().toISOString(),
        };

        set(state => ({
          reviewNotes: [...state.reviewNotes, newNote]
        }));
        get().addAuditTrail('review_note_added', { textSnippet: text.substring(0, 30) }, wpId, wp.engagement_id);
      },

      rejectAndBounceBack: (wpId, reviewNoteText) => {
        const wp = get().workingPapers.find(w => w.id === wpId);
        if (!wp) return;

        // Post review note
        get().addReviewNote(wpId, `REJECTION NOTE: ${reviewNoteText}`);

        // Increment version, set status to draft, clear submission lock (keep history archived implicitly)
        const nextVersion = (wp.version || 1) + 1;
        set(state => ({
          workingPapers: state.workingPapers.map(w => 
            w.id === wpId 
              ? { 
                  ...w, 
                  status: 'draft', 
                  version: nextVersion,
                  submission_lock: undefined,
                  updated_at: new Date().toISOString() 
                } 
              : w
          )
        }));

        // Reset area status back to in-progress
        const area = get().auditAreas.find(a => a.id === wp.area_id);
        if (area) {
          get().updateAuditAreaStatus(area.id, 'in-progress');
        }

        get().addAuditTrail('wp_rejected_bounce_back', { newVersion: nextVersion }, wpId, wp.engagement_id);
      },

      approveAndSignOff: (wpId) => {
        const wp = get().workingPapers.find(w => w.id === wpId);
        if (!wp) return;

        // Disposition lock guardrail: verify every observation has a selected disposition
        const obsList = get().observations.filter(o => o.working_paper_id === wpId);
        const unaddressedObs = obsList.find(o => !o.disposition || o.disposition === 'pending');
        if (unaddressedObs) {
          throw new Error("Cannot approve folder while observation line is left unaddressed (pending disposition).");
        }

        // Set status to approved, set reviewer
        get().updateWorkingPaper(wpId, {
          status: 'approved',
          reviewed_by: get().currentUser?.id
        });

        // Lock audit area status to complete
        const area = get().auditAreas.find(a => a.id === wp.area_id);
        if (area) {
          get().updateAuditAreaStatus(area.id, 'complete');
          // Trigger progress recalculation to stamp complete in AuditArea
          get().updateWorkingPaper(wpId, {});
        }

        get().addAuditTrail('wp_approved_signoff', {}, wpId, wp.engagement_id);
      },

      // ── Stage 6 Actions ──
      setAuditReportDate: (engagementId, date) => {
        const eng = get().engagements.find(e => e.id === engagementId);
        if (!eng) return { success: false, error: 'Engagement not found.' };

        // Open Query Blocker Check: no active reviewNotes or pendingClientRequests must exist
        const wps = get().workingPapers.filter(w => w.engagement_id === engagementId);
        const wpIds = wps.map(w => w.id);

        const openReviewNotes = get().reviewNotes.filter(n => wpIds.includes(n.working_paper_id));
        const pendingRequests = get().clientRequests.filter(r => r.engagement_id === engagementId && (r.status === 'pending-internal' || r.status === 'approved' || r.status === 'received' || r.status === 'rejected'));
        
        if (openReviewNotes.length > 0 || pendingRequests.length > 0) {
          return {
            success: false,
            error: `Open Query Sign-Off Blocker: Clean engagement files before signing report. Found ${openReviewNotes.length} open reviewer queries and ${pendingRequests.length} unverified client requests.`
          };
        }

        const assemblyDeadline = new Date(new Date(date).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const retentionExpires = new Date(new Date(date).getTime() + 7 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const archive: EngagementArchive = {
          engagement_id: engagementId,
          audit_report_date: date,
          assembly_deadline: assemblyDeadline,
          is_locked: false,
          retention_expires_at: retentionExpires,
        };

        set(state => ({
          engagements: state.engagements.map(e => 
            e.id === engagementId 
              ? { ...e, status: 'complete', archive, updated_at: new Date().toISOString() } 
              : e
          )
        }));

        get().addAuditTrail('audit_report_signed', { reportDate: date, assemblyDeadline }, undefined, engagementId);
        return { success: true };
      },

      addPostLockdownAddendum: (engagementId, data) => {
        const newAddendum: PostLockdownAddendum = {
          id: crypto.randomUUID(),
          engagement_id: engagementId,
          reason: data.reason,
          preparer_id: get().currentUser?.id || 'Unknown',
          reviewer_id: get().engagements.find(e => e.id === engagementId)?.partner_id || 'Unknown',
          content: data.content,
          ip_address: '192.168.1.51',
          created_at: new Date().toISOString(),
        };

        set(state => ({
          postLockdownAddenda: [...state.postLockdownAddenda, newAddendum]
        }));
        get().addAuditTrail('post_lockdown_addendum_added', { reasonSnippet: data.reason.substring(0, 30) }, undefined, engagementId);
      },

      checkAndApplyArchiveLock: (engagementId) => {
        const eng = get().engagements.find(e => e.id === engagementId);
        if (!eng || !eng.archive || eng.archive.is_locked) return;

        const deadline = new Date(eng.archive.assembly_deadline).getTime();
        const now = Date.now();

        if (now >= deadline) {
          set(state => ({
            engagements: state.engagements.map(e => 
              e.id === engagementId 
                ? { 
                    ...e, 
                    archive: e.archive ? { ...e.archive, is_locked: true, archive_locked_at: new Date().toISOString(), locked_by: 'System Hard Lock' } : undefined,
                    updated_at: new Date().toISOString()
                  } 
                : e
            )
          }));
          get().addAuditTrail('archive_hard_locked_system', {}, undefined, engagementId);
        }
      }
    }),
    {
      name: 'wpo-inc-storage',
    }
  )
);
