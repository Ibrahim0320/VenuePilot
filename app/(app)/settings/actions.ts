"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import {
  ACTIVITY_OPTIONS,
  type ActivityValue,
  type VenueSettings,
  createRuleInputsFromSettings,
  parseAutonomyLevel
} from "@/lib/settings/venue-settings";

const settingsPath = "/settings";

export async function updateVenueRulesAction(formData: FormData) {
  const venueId = readRequiredString(formData, "venueId");

  if (!venueId) {
    return;
  }

  const selectedActivities = formData
    .getAll("availableActivities")
    .filter(isActivityValue);

  const settings: VenueSettings = {
    openingHours: readString(formData, "openingHours"),
    bookingPolicy: readString(formData, "bookingPolicy"),
    depositPolicy: readString(formData, "depositPolicy"),
    groupBookingThreshold: readPositiveInteger(formData, "groupBookingThreshold", 8),
    largeGroupEscalationThreshold: readPositiveInteger(
      formData,
      "largeGroupEscalationThreshold",
      20
    ),
    availableActivities: selectedActivities,
    toneOfVoice: readString(formData, "toneOfVoice"),
    humanReviewRules: readString(formData, "humanReviewRules"),
    autoReplyAllowed: formData.get("autoReplyAllowed") === "on",
    aiAutonomyLevel: parseAutonomyLevel(readString(formData, "aiAutonomyLevel"))
  };

  const rules = createRuleInputsFromSettings(settings);

  await prisma.$transaction(
    rules.map((rule) =>
      prisma.venueRule.upsert({
        where: {
          venueId_key: {
            venueId,
            key: rule.key
          }
        },
        create: {
          venueId,
          key: rule.key,
          value: rule.value,
          category: rule.category
        },
        update: {
          value: rule.value,
          category: rule.category
        }
      })
    )
  );

  revalidatePath(settingsPath);
}

export async function createPackageAction(formData: FormData) {
  const venueId = readRequiredString(formData, "venueId");
  const name = readString(formData, "name");

  if (!venueId || !name) {
    return;
  }

  await prisma.package.upsert({
    where: {
      venueId_name: {
        venueId,
        name
      }
    },
    create: {
      venueId,
      name,
      description: readString(formData, "description"),
      minGuests: readNullablePositiveInteger(formData, "minGuests"),
      maxGuests: readNullablePositiveInteger(formData, "maxGuests"),
      priceDescription: readString(formData, "priceDescription"),
      active: formData.get("active") === "on"
    },
    update: {
      description: readString(formData, "description"),
      minGuests: readNullablePositiveInteger(formData, "minGuests"),
      maxGuests: readNullablePositiveInteger(formData, "maxGuests"),
      priceDescription: readString(formData, "priceDescription"),
      active: formData.get("active") === "on"
    }
  });

  revalidatePath(settingsPath);
}

export async function updatePackageAction(formData: FormData) {
  const packageId = readRequiredString(formData, "packageId");
  const venueId = readRequiredString(formData, "venueId");
  const name = readString(formData, "name");

  if (!packageId || !venueId || !name) {
    return;
  }

  await prisma.package.update({
    where: {
      id: packageId,
      venueId
    },
    data: {
      name,
      description: readString(formData, "description"),
      minGuests: readNullablePositiveInteger(formData, "minGuests"),
      maxGuests: readNullablePositiveInteger(formData, "maxGuests"),
      priceDescription: readString(formData, "priceDescription"),
      active: formData.get("active") === "on"
    }
  });

  revalidatePath(settingsPath);
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function readRequiredString(formData: FormData, key: string): string {
  return readString(formData, key);
}

function readPositiveInteger(
  formData: FormData,
  key: string,
  fallback: number
): number {
  const value = Number.parseInt(readString(formData, key), 10);

  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function readNullablePositiveInteger(formData: FormData, key: string): number | null {
  const rawValue = readString(formData, key);

  if (!rawValue) {
    return null;
  }

  const value = Number.parseInt(rawValue, 10);

  return Number.isFinite(value) && value >= 0 ? value : null;
}

function isActivityValue(value: FormDataEntryValue): value is ActivityValue {
  return (
    typeof value === "string" &&
    ACTIVITY_OPTIONS.some((option) => option.value === value)
  );
}
