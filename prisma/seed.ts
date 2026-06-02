import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultVenue = {
  name: "Biljardpalatset Göteborg AB",
  city: "Göteborg",
  venueType: "billiards_restaurant"
};

const legacyRuleKeys = [
  "opening_hours_placeholder",
  "deposit_policy_placeholder",
  "escalation_threshold",
  "package_rules_placeholder",
  "tone_of_voice_rules"
];

const defaultRules = [
  {
    key: "opening_hours",
    value:
      "Opening hours must be confirmed by venue staff before live use. Treat requests outside configured hours as staff-review items.",
    category: "opening_hours"
  },
  {
    key: "booking_policy",
    value:
      "Bookings should be prepared as staff-reviewable summaries. Confirm availability, table allocation and special requests before replying to guests.",
    category: "booking_rules"
  },
  {
    key: "deposit_policy",
    value:
      "Larger groups and private events may require a deposit. Staff confirm deposit amount, payment timing and cancellation terms before replying.",
    category: "payments"
  },
  {
    key: "group_booking_threshold",
    value: "8",
    category: "booking_rules"
  },
  {
    key: "large_group_escalation_threshold",
    value: "20",
    category: "human_review"
  },
  {
    key: "available_activities",
    value: JSON.stringify(["billiards", "restaurant", "event", "private_booking"]),
    category: "activities"
  },
  {
    key: "tone_of_voice",
    value:
      "Friendly, clear and professional. Be helpful without overpromising. Never imply that AI has confirmed a booking without staff approval.",
    category: "ai_tone"
  },
  {
    key: "human_review_rules",
    value:
      "Staff must review all guest-facing drafts, large group requests, deposit questions, unusual opening-hour requests and booking changes before anything is sent.",
    category: "human_review"
  },
  {
    key: "auto_reply_allowed",
    value: "false",
    category: "ai_safety"
  },
  {
    key: "ai_autonomy_level",
    value: "draft_only",
    category: "ai_safety"
  }
];

const defaultPackages = [
  {
    name: "Billiards group booking",
    description:
      "Billiards tables for small groups, with staff-confirmed availability and timing.",
    minGuests: 2,
    maxGuests: 12,
    priceDescription: "Pricing to be confirmed by venue staff.",
    active: true
  },
  {
    name: "Food and billiards event",
    description:
      "Combined billiards and restaurant option for groups that want food or drinks with the activity.",
    minGuests: 8,
    maxGuests: 40,
    priceDescription: "Food, drink and table pricing to be confirmed by staff.",
    active: true
  },
  {
    name: "Private event inquiry",
    description:
      "Staff-reviewed package path for larger events, private bookings and corporate groups.",
    minGuests: 20,
    maxGuests: null,
    priceDescription: "Custom quote required after staff review.",
    active: true
  }
];

async function main() {
  const venue = await prisma.venue.upsert({
    where: {
      name_city: {
        name: defaultVenue.name,
        city: defaultVenue.city
      }
    },
    update: defaultVenue,
    create: defaultVenue
  });

  await prisma.venueRule.deleteMany({
    where: {
      venueId: venue.id,
      key: {
        in: legacyRuleKeys
      }
    }
  });

  for (const rule of defaultRules) {
    await prisma.venueRule.upsert({
      where: {
        venueId_key: {
          venueId: venue.id,
          key: rule.key
        }
      },
      update: rule,
      create: {
        venueId: venue.id,
        ...rule
      }
    });
  }

  for (const venuePackage of defaultPackages) {
    await prisma.package.upsert({
      where: {
        venueId_name: {
          venueId: venue.id,
          name: venuePackage.name
        }
      },
      update: venuePackage,
      create: {
        venueId: venue.id,
        ...venuePackage
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
