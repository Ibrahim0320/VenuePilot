import { prisma } from "@/lib/db/prisma";
import type {
  BookingCopilotInput,
  BookingCopilotOutput
} from "@/lib/ai/booking-copilot-types";

export async function saveBookingCopilotResult({
  venueId,
  inquiry,
  output
}: {
  venueId: string;
  inquiry: BookingCopilotInput;
  output: BookingCopilotOutput;
}) {
  const savedInquiry = await prisma.bookingInquiry.create({
    data: {
      venueId,
      rawMessage: inquiry.rawMessage,
      customerName: inquiry.customerName || null,
      customerEmail: inquiry.customerEmail || null,
      customerPhone: inquiry.customerPhone || null,
      requestedDate: output.requestedDate
        ? new Date(`${output.requestedDate}T00:00:00.000Z`)
        : null,
      requestedTime: output.requestedTime,
      partySize: output.partySize,
      intent: output.intent,
      activityType: output.activityType,
      foodInterest: output.foodInterest,
      eventType: output.eventType,
      urgency: output.urgency,
      revenuePotential: output.revenuePotential,
      status: "draft_prepared"
    }
  });

  const draft = await prisma.aIDraft.create({
    data: {
      inquiryId: savedInquiry.id,
      suggestedReply: output.suggestedReply,
      internalSummary: output.internalSummary,
      recommendedActions: JSON.stringify({
        actions: output.recommendedActions,
        humanReviewReasons: output.humanReviewReasons
      }),
      requiresHumanReview: output.requiresHumanReview,
      riskLevel: output.riskLevel,
      status: "pending_review"
    }
  });

  return {
    inquiryId: savedInquiry.id,
    draftId: draft.id
  };
}
