"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTrialAccessPassword } from "@/lib/env";
import { createTrialAccessToken, trialAccessCookie } from "@/lib/trial-access";

export async function unlockTrialAccessAction(formData: FormData) {
  const configuredPassword = getTrialAccessPassword();
  const submittedPassword = readString(formData, "password");
  const nextPath = normalizeNextPath(readString(formData, "next"));

  if (!configuredPassword) {
    redirect(nextPath);
  }

  if (submittedPassword !== configuredPassword) {
    redirect(`/trial-login?error=invalid&next=${encodeURIComponent(nextPath)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(trialAccessCookie, await createTrialAccessToken(configuredPassword), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/"
  });

  redirect(nextPath);
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function normalizeNextPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  if (value.startsWith("/trial-login")) {
    return "/dashboard";
  }

  return value;
}
