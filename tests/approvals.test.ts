import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { allowedDraftApprovalStatuses } from "@/lib/approvals/status";

describe("approvals", () => {
  it("supports the configured draft review statuses", () => {
    assert.deepEqual(
      [...allowedDraftApprovalStatuses],
      ["pending_review", "approved", "rejected", "needs_follow_up", "handled_manually"]
    );
  });
});
