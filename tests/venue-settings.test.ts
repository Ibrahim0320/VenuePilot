import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildVenueSettingsFromRules,
  createRuleInputsFromSettings,
  parseActivities,
  parseAutonomyLevel
} from "@/lib/settings/venue-settings";

describe("venue settings", () => {
  it("builds complete settings from partial rules using safe defaults", () => {
    const settings = buildVenueSettingsFromRules([
      { key: "group_booking_threshold", value: "10" },
      { key: "auto_reply_allowed", value: "true" },
      { key: "ai_autonomy_level", value: "low_risk_auto" }
    ]);

    assert.equal(settings.groupBookingThreshold, 10);
    assert.equal(settings.largeGroupEscalationThreshold, 20);
    assert.equal(settings.autoReplyAllowed, true);
    assert.equal(settings.aiAutonomyLevel, "low_risk_auto");
    assert.ok(settings.openingHours.length > 0);
    assert.deepEqual(settings.availableActivities, [
      "billiards",
      "restaurant",
      "event",
      "private_booking"
    ]);
  });

  it("round-trips settings into VenueRule inputs for persistence", () => {
    const settings = buildVenueSettingsFromRules([]);
    const rules = createRuleInputsFromSettings({
      ...settings,
      openingHours: "Monday-Friday 11:00-23:00",
      availableActivities: ["billiards", "restaurant"],
      aiAutonomyLevel: "draft_only"
    });

    assert.equal(
      rules.find((rule) => rule.key === "opening_hours")?.value,
      "Monday-Friday 11:00-23:00"
    );
    assert.equal(
      rules.find((rule) => rule.key === "available_activities")?.value,
      JSON.stringify(["billiards", "restaurant"])
    );
    assert.equal(
      rules.find((rule) => rule.key === "ai_autonomy_level")?.category,
      "ai_safety"
    );
  });

  it("rejects unknown activities and autonomy values", () => {
    assert.deepEqual(parseActivities('["billiards","karaoke","private_booking"]'), [
      "billiards",
      "private_booking"
    ]);
    assert.equal(parseAutonomyLevel("full_auto"), "draft_only");
    assert.equal(
      parseAutonomyLevel("full_auto_disabled_for_now"),
      "full_auto_disabled_for_now"
    );
  });
});
