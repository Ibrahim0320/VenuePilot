export const trialAccessCookie = "venuepilot_trial_access";

export async function createTrialAccessToken(password: string): Promise<string> {
  const input = new TextEncoder().encode(`venuepilot-trial:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", input);

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
