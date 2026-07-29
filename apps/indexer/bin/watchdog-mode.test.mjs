import { describe, expect, it } from "vitest";
import { resolveWatchdogMode } from "./watchdog-mode.mjs";

describe("watchdog mode", () => {
  it.each(["off", "observe", "restart"])("accepts %s", (mode) => {
    expect(resolveWatchdogMode(mode)).toEqual({
      requestedMode: mode,
      mode,
      valid: true,
    });
  });

  it("fails open for absent or invalid modes", () => {
    expect(resolveWatchdogMode()).toEqual({
      requestedMode: "off",
      mode: "off",
      valid: true,
    });
    expect(resolveWatchdogMode("delete-everything")).toEqual({
      requestedMode: "delete-everything",
      mode: "off",
      valid: false,
    });
  });
});
