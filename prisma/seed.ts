import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const venue = await prisma.venue.upsert({
    where: { slug: "biljardpalatset-goteborg" },
    update: {
      name: "Biljardpalatset Goteborg",
      legalName: "Biljardpalatset Goteborg AB",
      timezone: "Europe/Stockholm"
    },
    create: {
      slug: "biljardpalatset-goteborg",
      name: "Biljardpalatset Goteborg",
      legalName: "Biljardpalatset Goteborg AB",
      timezone: "Europe/Stockholm"
    }
  });

  await prisma.user.upsert({
    where: { email: "manager@biljardpalatset.example" },
    update: {
      venueId: venue.id,
      name: "Venue Manager",
      role: "manager"
    },
    create: {
      venueId: venue.id,
      name: "Venue Manager",
      email: "manager@biljardpalatset.example",
      role: "manager"
    }
  });

  await prisma.openingHour.deleteMany({ where: { venueId: venue.id } });
  await prisma.openingHour.createMany({
    data: [
      { venueId: venue.id, weekday: 1, opensAt: "15:00", closesAt: "23:00" },
      { venueId: venue.id, weekday: 2, opensAt: "15:00", closesAt: "23:00" },
      { venueId: venue.id, weekday: 3, opensAt: "15:00", closesAt: "23:00" },
      { venueId: venue.id, weekday: 4, opensAt: "15:00", closesAt: "23:00" },
      { venueId: venue.id, weekday: 5, opensAt: "15:00", closesAt: "01:00" },
      { venueId: venue.id, weekday: 6, opensAt: "12:00", closesAt: "01:00" },
      { venueId: venue.id, weekday: 0, opensAt: "12:00", closesAt: "22:00" }
    ]
  });

  await prisma.venueRule.upsert({
    where: { venueId_key: { venueId: venue.id, key: "human_approval" } },
    update: {
      value: "required",
      label: "Human approval",
      description: "Guest-facing AI drafts must be approved by staff."
    },
    create: {
      venueId: venue.id,
      key: "human_approval",
      label: "Human approval",
      value: "required",
      description: "Guest-facing AI drafts must be approved by staff."
    }
  });

  await prisma.venuePackage.upsert({
    where: { venueId_name: { venueId: venue.id, name: "Billiards booking" } },
    update: {
      description: "Standard billiards reservation placeholder."
    },
    create: {
      venueId: venue.id,
      name: "Billiards booking",
      description: "Standard billiards reservation placeholder."
    }
  });

  await prisma.venueArea.upsert({
    where: { venueId_name: { venueId: venue.id, name: "Main billiards floor" } },
    update: {
      description: "Primary area for billiards bookings."
    },
    create: {
      venueId: venue.id,
      name: "Main billiards floor",
      description: "Primary area for billiards bookings."
    }
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
