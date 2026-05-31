import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultVenue = {
  name: "Biljardpalatset Göteborg AB",
  city: "Göteborg",
  venueType: "billiards_restaurant"
};

const defaultRules = [
  {
    key: "opening_hours_placeholder",
    value: "Opening hours to be confirmed by venue staff before live use.",
    category: "opening_hours"
  },
  {
    key: "deposit_policy_placeholder",
    value: "Deposit policy to be confirmed for larger groups and events.",
    category: "payments"
  },
  {
    key: "group_booking_threshold",
    value: "8",
    category: "booking_rules"
  },
  {
    key: "escalation_threshold",
    value: "20",
    category: "human_review"
  },
  {
    key: "package_rules_placeholder",
    value: "Package rules and availability must be verified by staff.",
    category: "packages"
  },
  {
    key: "tone_of_voice_rules",
    value:
      "Friendly, clear and professional. Never imply that AI has confirmed a booking without staff approval.",
    category: "ai_tone"
  }
];

const defaultPackages = [
  {
    name: "Billiards group booking",
    description: "Placeholder package for billiards reservations and group inquiries.",
    minGuests: 2,
    maxGuests: null,
    priceDescription: "Pricing to be confirmed by venue staff.",
    active: true
  },
  {
    name: "Food and billiards event",
    description:
      "Placeholder package for guests asking about billiards with food or event service.",
    minGuests: 8,
    maxGuests: null,
    priceDescription: "Food, drink and table pricing to be confirmed by staff.",
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

  await prisma.venueRule.deleteMany({ where: { venueId: venue.id } });
  await prisma.venueRule.createMany({
    data: defaultRules.map((rule) => ({
      venueId: venue.id,
      ...rule
    }))
  });

  await prisma.package.deleteMany({ where: { venueId: venue.id } });
  await prisma.package.createMany({
    data: defaultPackages.map((venuePackage) => ({
      venueId: venue.id,
      ...venuePackage
    }))
  });
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
