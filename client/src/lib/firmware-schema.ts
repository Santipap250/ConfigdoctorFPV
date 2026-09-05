/**
 * Firmware-specific parameter schema for Config Diff's optional validation
 * mode.
 *
 * This is deliberately narrow and explicitly version-scoped, per the
 * project's own precondition for this feature: "target firmware schema and
 * explicit version handling." It covers one firmware/version
 * (Betaflight 2025.12) with a curated set of commonly-tuned parameters
 * transcribed from Betaflight's own official CLI reference — not every
 * parameter that firmware exposes, and not a guess at what other versions
 * support.
 *
 * A parameter absent from this schema is never treated as invalid — it is
 * reported as "unknown" (not validated), which is the conservative,
 * intentional default for anything this app has no sourced data for.
 * Likewise, a value flagged "out of range" is only ever described as
 * outside the documented range for this specific firmware version — never
 * as unsafe or wrong, since the same value may be entirely valid on a
 * different firmware version this schema doesn't cover.
 */

export const FIRMWARE_SCHEMA_VERSION = "Betaflight 2025.12";

export const FIRMWARE_SCHEMA_SOURCE = {
  url: "https://betaflight.com/docs/wiki/guides/current/Cli",
  publisher: "Betaflight (official documentation)",
  retrievedDate: "2026-09-05",
  note: "Betaflight 2025.12 CLI Variable Reference. Defaults and ranges are specific to this firmware version and may differ in older or newer releases.",
};

export type FirmwareParamScope = "master" | "profile" | "rateprofile";

export type FirmwareParamSpec =
  | { key: string; type: "number"; category: string; scope: FirmwareParamScope; default: string; min: number; max: number; description: string }
  | { key: string; type: "enum"; category: string; scope: FirmwareParamScope; default: string; enumValues: string[]; description: string };

export const firmwareParamSchema: FirmwareParamSpec[] = [
  // Gyro Filters
  { key: "gyro_lpf1_type", type: "enum", category: "Gyro Filters", scope: "master", default: "PT1", enumValues: ["PT1", "BIQUAD", "PT2", "PT3"], description: "Filter type for gyro LPF1." },
  { key: "gyro_lpf1_static_hz", type: "number", category: "Gyro Filters", scope: "master", default: "250", min: 0, max: 1000, description: "Static cutoff for LPF1. 0 disables (recommended with RPM filtering)." },
  { key: "gyro_lpf1_dyn_min_hz", type: "number", category: "Gyro Filters", scope: "master", default: "250", min: 0, max: 1000, description: "Dynamic LPF1 minimum cutoff (low throttle)." },
  { key: "gyro_lpf1_dyn_max_hz", type: "number", category: "Gyro Filters", scope: "master", default: "500", min: 0, max: 1000, description: "Dynamic LPF1 maximum cutoff (full throttle)." },
  { key: "gyro_lpf1_dyn_expo", type: "number", category: "Gyro Filters", scope: "master", default: "5", min: 0, max: 10, description: "Expo curve for dynamic LPF1 cutoff vs throttle." },
  { key: "gyro_lpf2_type", type: "enum", category: "Gyro Filters", scope: "master", default: "PT1", enumValues: ["PT1", "BIQUAD", "PT2", "PT3"], description: "Filter type for gyro LPF2 (anti-aliasing)." },
  { key: "gyro_lpf2_static_hz", type: "number", category: "Gyro Filters", scope: "master", default: "500", min: 0, max: 1000, description: "LPF2 cutoff." },
  { key: "gyro_notch1_hz", type: "number", category: "Gyro Filters", scope: "master", default: "0", min: 0, max: 1000, description: "Centre frequency of static gyro notch 1. 0 disables." },
  { key: "gyro_notch1_cutoff", type: "number", category: "Gyro Filters", scope: "master", default: "0", min: 0, max: 1000, description: "Bandwidth of gyro notch 1." },
  { key: "gyro_notch2_hz", type: "number", category: "Gyro Filters", scope: "master", default: "0", min: 0, max: 1000, description: "Centre frequency of static gyro notch 2. 0 disables." },
  { key: "gyro_notch2_cutoff", type: "number", category: "Gyro Filters", scope: "master", default: "0", min: 0, max: 1000, description: "Bandwidth of gyro notch 2." },

  // Dynamic Notch Filter
  { key: "dyn_notch_count", type: "number", category: "Dynamic Notch", scope: "master", default: "3", min: 0, max: 7, description: "Number of independently tracked dynamic notches. 0 disables." },
  { key: "dyn_notch_q", type: "number", category: "Dynamic Notch", scope: "master", default: "300", min: 1, max: 1000, description: "Q factor - narrowness of each notch." },
  { key: "dyn_notch_min_hz", type: "number", category: "Dynamic Notch", scope: "master", default: "100", min: 20, max: 250, description: "Minimum frequency any notch will track." },
  { key: "dyn_notch_max_hz", type: "number", category: "Dynamic Notch", scope: "master", default: "600", min: 200, max: 1000, description: "Maximum frequency any notch will track." },

  // D-term & PID Output Filters
  { key: "dterm_lpf1_type", type: "enum", category: "D-term Filters", scope: "profile", default: "PT1", enumValues: ["PT1", "BIQUAD", "PT2", "PT3"], description: "Type for D-term LPF1." },
  { key: "dterm_lpf1_static_hz", type: "number", category: "D-term Filters", scope: "profile", default: "75", min: 0, max: 1000, description: "Static cutoff for D-term LPF1." },
  { key: "dterm_lpf1_dyn_min_hz", type: "number", category: "D-term Filters", scope: "profile", default: "75", min: 0, max: 1000, description: "Dynamic D-term LPF1 minimum cutoff." },
  { key: "dterm_lpf1_dyn_max_hz", type: "number", category: "D-term Filters", scope: "profile", default: "150", min: 0, max: 1000, description: "Dynamic D-term LPF1 maximum cutoff." },
  { key: "dterm_lpf1_dyn_expo", type: "number", category: "D-term Filters", scope: "profile", default: "5", min: 0, max: 10, description: "Expo curve for dynamic D-term LPF1 vs throttle." },
  { key: "dterm_lpf2_type", type: "enum", category: "D-term Filters", scope: "profile", default: "PT1", enumValues: ["PT1", "BIQUAD", "PT2", "PT3"], description: "Type for D-term LPF2." },
  { key: "dterm_lpf2_static_hz", type: "number", category: "D-term Filters", scope: "profile", default: "150", min: 0, max: 1000, description: "Cutoff for D-term LPF2 (always static)." },
  { key: "dterm_notch_hz", type: "number", category: "D-term Filters", scope: "profile", default: "0", min: 0, max: 1000, description: "Static D-term notch centre frequency. 0 disables." },
  { key: "dterm_notch_cutoff", type: "number", category: "D-term Filters", scope: "profile", default: "0", min: 0, max: 1000, description: "Static D-term notch bandwidth." },
  { key: "yaw_lowpass_hz", type: "number", category: "D-term Filters", scope: "profile", default: "100", min: 0, max: 500, description: "Low-pass filter on the final yaw PID output. 0 disables." },

  // PID Gains
  { key: "p_roll", type: "number", category: "PID Gains", scope: "profile", default: "45", min: 0, max: 250, description: "Roll P gain." },
  { key: "i_roll", type: "number", category: "PID Gains", scope: "profile", default: "80", min: 0, max: 250, description: "Roll I gain." },
  { key: "d_roll", type: "number", category: "PID Gains", scope: "profile", default: "30", min: 0, max: 250, description: "Roll base D." },
  { key: "d_max_roll", type: "number", category: "PID Gains", scope: "profile", default: "40", min: 0, max: 250, description: "Roll dynamic damping ceiling." },
  { key: "f_roll", type: "number", category: "PID Gains", scope: "profile", default: "120", min: 0, max: 1000, description: "Roll feed forward." },
  { key: "p_pitch", type: "number", category: "PID Gains", scope: "profile", default: "47", min: 0, max: 250, description: "Pitch P gain." },
  { key: "i_pitch", type: "number", category: "PID Gains", scope: "profile", default: "84", min: 0, max: 250, description: "Pitch I gain." },
  { key: "d_pitch", type: "number", category: "PID Gains", scope: "profile", default: "34", min: 0, max: 250, description: "Pitch base D." },
  { key: "d_max_pitch", type: "number", category: "PID Gains", scope: "profile", default: "46", min: 0, max: 250, description: "Pitch dynamic damping ceiling." },
  { key: "f_pitch", type: "number", category: "PID Gains", scope: "profile", default: "125", min: 0, max: 1000, description: "Pitch feed forward." },
  { key: "p_yaw", type: "number", category: "PID Gains", scope: "profile", default: "45", min: 0, max: 250, description: "Yaw P gain." },
  { key: "i_yaw", type: "number", category: "PID Gains", scope: "profile", default: "80", min: 0, max: 250, description: "Yaw I gain." },
  { key: "d_yaw", type: "number", category: "PID Gains", scope: "profile", default: "0", min: 0, max: 250, description: "Yaw D gain." },
  { key: "d_max_yaw", type: "number", category: "PID Gains", scope: "profile", default: "0", min: 0, max: 250, description: "Yaw D_max." },
  { key: "f_yaw", type: "number", category: "PID Gains", scope: "profile", default: "120", min: 0, max: 1000, description: "Yaw feed forward." },
  { key: "pidsum_limit", type: "number", category: "PID Gains", scope: "profile", default: "500", min: 100, max: 1000, description: "Clamps total P+I+D output." },
  { key: "pidsum_limit_yaw", type: "number", category: "PID Gains", scope: "profile", default: "400", min: 100, max: 1000, description: "Clamps total yaw PID output." },

  // TPA
  { key: "tpa_mode", type: "enum", category: "TPA", scope: "profile", default: "D", enumValues: ["PD", "D", "PDS"], description: "Which terms TPA attenuates." },
  { key: "tpa_rate", type: "number", category: "TPA", scope: "profile", default: "65", min: 0, max: 100, description: "Maximum attenuation percentage at full throttle." },
  { key: "tpa_breakpoint", type: "number", category: "TPA", scope: "profile", default: "1350", min: 1000, max: 2000, description: "Throttle level where TPA begins." },

  // Rates
  { key: "rates_type", type: "enum", category: "Rates", scope: "rateprofile", default: "ACTUAL", enumValues: ["BETAFLIGHT", "RACEFLIGHT", "KISS", "ACTUAL", "QUICK"], description: "Rate calculation system." },
  { key: "roll_rc_rate", type: "number", category: "Rates", scope: "rateprofile", default: "7", min: 1, max: 255, description: "Roll rate at stick center." },
  { key: "pitch_rc_rate", type: "number", category: "Rates", scope: "rateprofile", default: "7", min: 1, max: 255, description: "Pitch rate at stick center." },
  { key: "yaw_rc_rate", type: "number", category: "Rates", scope: "rateprofile", default: "7", min: 1, max: 255, description: "Yaw rate at stick center." },
  { key: "roll_expo", type: "number", category: "Rates", scope: "rateprofile", default: "0", min: 0, max: 100, description: "Roll expo." },
  { key: "pitch_expo", type: "number", category: "Rates", scope: "rateprofile", default: "0", min: 0, max: 100, description: "Pitch expo." },
  { key: "yaw_expo", type: "number", category: "Rates", scope: "rateprofile", default: "0", min: 0, max: 100, description: "Yaw expo." },
  { key: "roll_srate", type: "number", category: "Rates", scope: "rateprofile", default: "67", min: 0, max: 255, description: "Roll super rate." },
  { key: "pitch_srate", type: "number", category: "Rates", scope: "rateprofile", default: "67", min: 0, max: 255, description: "Pitch super rate." },
  { key: "yaw_srate", type: "number", category: "Rates", scope: "rateprofile", default: "67", min: 0, max: 255, description: "Yaw super rate." },
  { key: "throttle_limit_type", type: "enum", category: "Rates", scope: "rateprofile", default: "OFF", enumValues: ["OFF", "SCALE", "CLIP"], description: "Limits maximum throttle output." },
  { key: "throttle_limit_percent", type: "number", category: "Rates", scope: "rateprofile", default: "100", min: 25, max: 100, description: "Maximum throttle percentage when throttle_limit_type is active." },
  { key: "roll_rate_limit", type: "number", category: "Rates", scope: "rateprofile", default: "1998", min: 200, max: 1998, description: "Hard cap on roll rate in deg/s." },
  { key: "pitch_rate_limit", type: "number", category: "Rates", scope: "rateprofile", default: "1998", min: 200, max: 1998, description: "Hard cap on pitch rate." },
  { key: "yaw_rate_limit", type: "number", category: "Rates", scope: "rateprofile", default: "1998", min: 200, max: 1998, description: "Hard cap on yaw rate." },

  // Motor & ESC
  { key: "motor_pwm_protocol", type: "enum", category: "Motor & ESC", scope: "master", default: "DSHOT600", enumValues: ["PWM", "ONESHOT125", "ONESHOT42", "MULTISHOT", "BRUSHED", "DSHOT150", "DSHOT300", "DSHOT600", "PROSHOT1000", "DISABLED"], description: "ESC communication protocol." },
  { key: "motor_poles", type: "number", category: "Motor & ESC", scope: "master", default: "14", min: 4, max: 255, description: "Number of magnetic poles on the motor bell. Critical for RPM filter accuracy." },
  { key: "motor_kv", type: "number", category: "Motor & ESC", scope: "master", default: "1960", min: 1, max: 40000, description: "Motor KV rating." },
  { key: "motor_idle", type: "number", category: "Motor & ESC", scope: "master", default: "550", min: 0, max: 2000, description: "Idle throttle value sent to ESCs when armed." },
  { key: "motor_output_limit", type: "number", category: "Motor & ESC", scope: "profile", default: "100", min: 1, max: 100, description: "Caps per-motor output as a percentage." },
  { key: "thrust_linear", type: "number", category: "Motor & ESC", scope: "profile", default: "0", min: 0, max: 150, description: "Linearises the thrust curve at low throttle." },

  // RPM Filter
  { key: "rpm_filter_harmonics", type: "number", category: "RPM Filter", scope: "master", default: "3", min: 0, max: 3, description: "Number of RPM harmonics to filter per motor. 0 disables." },
  { key: "rpm_filter_q", type: "number", category: "RPM Filter", scope: "master", default: "500", min: 250, max: 3000, description: "Q factor (notch sharpness)." },
  { key: "rpm_filter_min_hz", type: "number", category: "RPM Filter", scope: "master", default: "100", min: 30, max: 200, description: "Below this frequency, notches are not applied." },

  // Dynamic Idle
  { key: "dyn_idle_min_rpm", type: "number", category: "Dynamic Idle", scope: "profile", default: "0", min: 0, max: 200, description: "Minimum motor RPM maintained by dynamic idle. Non-zero enables it." },

  // Battery
  { key: "vbat_max_cell_voltage", type: "number", category: "Battery", scope: "master", default: "430", min: 100, max: 500, description: "Maximum per-cell voltage for auto cell-count detection (x0.01V)." },
  { key: "vbat_warning_cell_voltage", type: "number", category: "Battery", scope: "master", default: "350", min: 100, max: 500, description: "Warning threshold voltage per cell (x0.01V)." },
  { key: "vbat_min_cell_voltage", type: "number", category: "Battery", scope: "master", default: "330", min: 100, max: 500, description: "Minimum cell voltage - triggers battery-critical alarm (x0.01V)." },

  // Failsafe
  { key: "failsafe_procedure", type: "enum", category: "Failsafe", scope: "master", default: "DROP", enumValues: ["AUTO-LAND", "DROP", "GPS-RESCUE"], description: "Stage 2 failsafe procedure." },
  { key: "failsafe_delay", type: "number", category: "Failsafe", scope: "master", default: "15", min: 1, max: 200, description: "Stage 1 guard duration in deciseconds." },
  { key: "failsafe_throttle", type: "number", category: "Failsafe", scope: "master", default: "1000", min: 750, max: 2250, description: "Throttle value applied during Landing Mode Stage 2." },
  { key: "failsafe_switch_mode", type: "enum", category: "Failsafe", scope: "master", default: "STAGE1", enumValues: ["STAGE1", "KILL", "STAGE2"], description: "Aux switch failsafe behavior." },
];

export type ParamCheckStatus = "unknown" | "in-range" | "out-of-range" | "invalid-value";
export type ParamCheckResult = { status: ParamCheckStatus; spec: FirmwareParamSpec | null };

/**
 * Check one key/value pair against the schema. A key not present in the
 * schema always returns "unknown" — this app has no sourced data on it, so
 * it makes no claim rather than guessing.
 */
export function checkParamValue(key: string, rawValue: string): ParamCheckResult {
  const spec = firmwareParamSchema.find((entry) => entry.key.toLowerCase() === key.toLowerCase()) ?? null;
  if (!spec) return { status: "unknown", spec: null };

  const value = rawValue.trim();
  if (spec.type === "enum") {
    const matches = spec.enumValues.some((candidate) => candidate.toLowerCase() === value.toLowerCase());
    return { status: matches ? "in-range" : "invalid-value", spec };
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return { status: "invalid-value", spec };
  if (numeric < spec.min || numeric > spec.max) return { status: "out-of-range", spec };
  return { status: "in-range", spec };
}
