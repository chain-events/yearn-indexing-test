const MODES = new Set(["off", "observe", "restart"]);

export const resolveWatchdogMode = (value) => {
  const requestedMode = String(value ?? "off").toLowerCase();
  const mode = MODES.has(requestedMode) ? requestedMode : "off";

  return {
    requestedMode,
    mode,
    valid: requestedMode === mode,
  };
};
