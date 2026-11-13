import { create } from "zustand";

import { COMPLIANCE_ADMIN, mockAuditLogs, mockComplianceFlags } from "@/data/compliance";
import type { AuditLog, ComplianceFlag, FlagAction } from "@/types/compliance";

/** Labels for enforcement actions, shared by the review UI and the audit log. */
export const flagActionLabels: Record<FlagAction, string> = {
  campaign_cancelled: "Campaign Cancelled",
  user_suspended: "User Suspended",
  user_restricted: "User Restricted",
  no_further_action: "No Further Action",
};

/** Audit log entry written for each enforcement action, besides "Violation confirmed". */
const actionAuditEntry = (flag: ComplianceFlag, action: FlagAction): Pick<AuditLog, "action" | "details"> | null => {
  switch (action) {
    case "campaign_cancelled":
      return { action: "Campaign cancelled", details: `Campaign ${flag.campaignId} cancelled and further delivery stopped.` };
    case "user_suspended":
      return { action: "User suspended", details: "Account suspended and further platform activity prevented." };
    case "user_restricted":
      return { action: "User restricted", details: "Account activity restricted pending further review." };
    default:
      return null;
  }
};

// In-memory compliance state so review decisions, notes and the audit log
// show across the compliance pages. Replace with service calls once the
// compliance API exists.
type ComplianceState = {
  flags: ComplianceFlag[];
  auditLogs: AuditLog[];
  startReview: (flagId: string) => void;
  /** Confirms a violation and records the enforcement action. */
  resolveFlag: (flagId: string, action: FlagAction) => void;
  /** Records "No Violation" and closes the flag. */
  dismissFlag: (flagId: string, reason: string) => void;
  addNote: (flagId: string, body: string) => void;
};

export const useCompliance = create<ComplianceState>()((set, get) => {
  const log = (entries: Pick<AuditLog, "action" | "recordId" | "details">[], at: string) => {
    let next = get().auditLogs.length;
    const created = entries.map((entry) => ({
      ...entry,
      id: `AUD-${String(++next).padStart(4, "0")}`,
      at,
      adminName: COMPLIANCE_ADMIN,
    }));
    // Newest first, so later entries in the same action come first.
    set((state) => ({ auditLogs: [...created.reverse(), ...state.auditLogs] }));
  };

  const updateFlag = (flagId: string, change: (flag: ComplianceFlag, now: string) => Partial<ComplianceFlag>) => {
    const now = new Date().toISOString();
    set((state) => ({
      flags: state.flags.map((flag) => (flag.id === flagId ? { ...flag, ...change(flag, now), updatedAt: now } : flag)),
    }));
    return now;
  };

  return {
    flags: mockComplianceFlags,
    auditLogs: mockAuditLogs,
    startReview: (flagId) => {
      const now = updateFlag(flagId, () => ({ status: "under_review" }));
      log([{ action: "Review started", recordId: flagId, details: "Flag moved to Under Review." }], now);
    },
    resolveFlag: (flagId, action) => {
      const flag = get().flags.find((item) => item.id === flagId);
      if (!flag) return;
      const now = updateFlag(flagId, (_, at) => ({ status: "resolved", action, closedBy: COMPLIANCE_ADMIN, closedAt: at }));
      const extra = actionAuditEntry(flag, action);
      log(
        [
          { action: "Violation confirmed", recordId: flagId, details: `Violation confirmed. ${flagActionLabels[action]} applied.` },
          ...(extra ? [{ ...extra, recordId: flagId }] : []),
        ],
        now,
      );
    },
    dismissFlag: (flagId, reason) => {
      const now = updateFlag(flagId, (_, at) => ({
        status: "dismissed",
        dismissedReason: reason,
        closedBy: COMPLIANCE_ADMIN,
        closedAt: at,
      }));
      log([{ action: "Flag dismissed", recordId: flagId, details: `No violation found. ${reason}` }], now);
    },
    addNote: (flagId, body) => {
      const now = updateFlag(flagId, (flag, at) => ({
        notes: [...flag.notes, { id: `${flagId}-n${Date.now()}`, authorName: COMPLIANCE_ADMIN, body, createdAt: at }],
      }));
      log([{ action: "Compliance note added", recordId: flagId, details: body }], now);
    },
  };
});
