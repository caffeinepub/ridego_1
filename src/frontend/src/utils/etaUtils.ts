/**
 * Traffic-aware ETA utilities for RideGo
 */

export type TrafficCondition = {
  label: "Light" | "Moderate" | "Heavy";
  multiplier: number;
};

/**
 * Determines traffic condition based on time of day.
 * Peak hours: 8–10 AM, 5–8 PM → Heavy
 * Shoulder hours: 7 AM, 11 AM, 4 PM, 9 PM → Moderate
 * Off-peak → Light
 */
export function getTrafficCondition(now: Date = new Date()): TrafficCondition {
  const hour = now.getHours();
  if (hour >= 8 && hour <= 10) return { label: "Heavy", multiplier: 1.6 };
  if (hour >= 17 && hour <= 20) return { label: "Heavy", multiplier: 1.6 };
  if (hour === 7 || hour === 11 || hour === 16 || hour === 21)
    return { label: "Moderate", multiplier: 1.3 };
  return { label: "Light", multiplier: 1.0 };
}

/**
 * Base speeds (km/h) per vehicle type
 */
const BASE_SPEEDS: Record<"Sports Car" | "Auto" | "Cab", number> = {
  "Sports Car": 35,
  Auto: 28,
  Cab: 30,
};

/**
 * Estimates ETA in minutes for a given distance, vehicle type, and time.
 */
export function estimateETA(
  distanceKm: number,
  vehicleType: "Sports Car" | "Auto" | "Cab",
  now: Date = new Date(),
): number {
  const { multiplier } = getTrafficCondition(now);
  const speedKmh = BASE_SPEEDS[vehicleType];
  const minutes = (distanceKm / speedKmh) * 60 * multiplier;
  return Math.ceil(minutes);
}

/**
 * Formats minutes into a human-readable ETA string.
 * Examples: "~5 min", "~1 hr 4 min"
 */
export function formatETA(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `~${hrs} hr`;
  return `~${hrs} hr ${mins} min`;
}
