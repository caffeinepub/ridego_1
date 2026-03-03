export const SPORTSCAR_BASE_FARE = 20;
export const SPORTSCAR_BASE_KM = 1;
export const SPORTSCAR_PER_KM_RATE = 5;
export const COMMISSION_PER_KM = 1;

export const AUTO_BASE_FARE = 30;
export const AUTO_BASE_KM = 1;
export const AUTO_PER_KM_RATE = 6;

export const CAB_BASE_FARE = 50;
export const CAB_BASE_KM = 1;
export const CAB_PER_KM_RATE = 10;

export function calculateSportsCarFare(distanceKm: number): {
  totalFare: number;
  commission: number;
  driverEarnings: number;
  distanceKm: number;
} {
  const roundedKm = Math.round(distanceKm * 10) / 10;
  const totalFare =
    SPORTSCAR_BASE_FARE +
    Math.max(0, roundedKm - SPORTSCAR_BASE_KM) * SPORTSCAR_PER_KM_RATE;
  const commission = Math.round(roundedKm * COMMISSION_PER_KM);
  const driverEarnings = totalFare - commission;
  return { totalFare, commission, driverEarnings, distanceKm: roundedKm };
}

export function calculateAutoFare(distanceKm: number): {
  totalFare: number;
  commission: number;
  driverEarnings: number;
  distanceKm: number;
} {
  const roundedKm = Math.round(distanceKm * 10) / 10;
  const totalFare =
    AUTO_BASE_FARE + Math.max(0, roundedKm - AUTO_BASE_KM) * AUTO_PER_KM_RATE;
  const commission = Math.round(roundedKm * COMMISSION_PER_KM);
  const driverEarnings = totalFare - commission;
  return { totalFare, commission, driverEarnings, distanceKm: roundedKm };
}

export function calculateCabFare(distanceKm: number): {
  totalFare: number;
  commission: number;
  driverEarnings: number;
  distanceKm: number;
} {
  const roundedKm = Math.round(distanceKm * 10) / 10;
  const totalFare =
    CAB_BASE_FARE + Math.max(0, roundedKm - CAB_BASE_KM) * CAB_PER_KM_RATE;
  const commission = Math.round(roundedKm * COMMISSION_PER_KM);
  const driverEarnings = totalFare - commission;
  return { totalFare, commission, driverEarnings, distanceKm: roundedKm };
}
