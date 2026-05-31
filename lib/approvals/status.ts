export const allowedDraftApprovalStatuses = [
  "pending_review",
  "approved",
  "rejected",
  "needs_follow_up",
  "handled_manually"
] as const;

export type DraftApprovalStatus = (typeof allowedDraftApprovalStatuses)[number];
