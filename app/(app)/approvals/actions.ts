"use server";

import { revalidatePath } from "next/cache";
import {
  allowedDraftApprovalStatuses,
  type DraftApprovalStatus
} from "@/lib/approvals/status";
import { prisma } from "@/lib/db/prisma";

export async function updateDraftReviewAction(formData: FormData) {
  const draftId = readString(formData, "draftId");
  const suggestedReply = readString(formData, "suggestedReply");
  const status = readStatus(formData, "status");

  if (!draftId || !suggestedReply || !status) {
    return;
  }

  await prisma.aIDraft.update({
    where: { id: draftId },
    data: {
      suggestedReply,
      status
    }
  });

  revalidatePath("/approvals");
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function readStatus(formData: FormData, key: string): DraftApprovalStatus | null {
  const value = readString(formData, key);

  return allowedDraftApprovalStatuses.includes(value as DraftApprovalStatus)
    ? (value as DraftApprovalStatus)
    : null;
}
