import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { estimateETA, formatETA, getTrafficCondition } from "@/utils/etaUtils";
import {
  calculateAutoFare,
  calculateCabFare,
  calculateSportsCarFare,
} from "@/utils/fareUtils";
import {
  ArrowBigLeft,
  ArrowBigRight,
  ArrowRight,
  ArrowUp,
  Bike,
  Car,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Heart,
  Loader2,
  MapPin,
  Merge,
  Navigation,
  RotateCcw,
  Star,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { RideHistoryEntry, RideRequest } from "../App";

// Custom Auto-rickshaw icon (3-wheeler)
function AutoIcon({
  size = 22,
  className = "",
}: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label="Auto rickshaw"
    >
      <title>Auto rickshaw</title>
      <path d="M3 13h13V8l-3-3H3v8z" />
      <path d="M3 8h13" />
      <path d="M13 5v3" />
      <path d="M16 8h3l2 3v2h-5V8z" />
      <circle cx="6" cy="16" r="2" />
      <circle cx="18" cy="16" r="2" />
    </svg>
  );
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function shouldShowWeeklyBanner(): boolean {
  const currentWeek = `${new Date().getFullYear()}-W${getISOWeekNumber(new Date())}`;
  const stored = localStorage.getItem("ridego_last_banner_week");
  return stored !== currentWeek;
}

function dismissWeeklyBanner(): void {
  const currentWeek = `${new Date().getFullYear()}-W${getISOWeekNumber(new Date())}`;
  localStorage.setItem("ridego_last_banner_week", currentWeek);
}

interface RiderHomeProps {
  pickup: string;
  drop: string;
  selectedVehicle: "Sports Car" | "Auto" | "Cab";
  rideHistory: RideHistoryEntry[];
  paymentMethod: "Cash" | "UPI" | "Wallet";
  onPickupChange: (v: string) => void;
  onDropChange: (v: string) => void;
  onVehicleSelect: (v: "Sports Car" | "Auto" | "Cab") => void;
  onBookRide: (ride: RideRequest) => void;
  onPaymentMethodChange: (method: "Cash" | "UPI" | "Wallet") => void;
}

const STATUS_COLOR: Record<string, string> = {
  Completed: "bg-success/10 text-success border-success/20",
  Cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  "In Progress": "bg-primary/10 text-primary border-primary/20",
};

const PAYMENT_METHODS: {
  id: "Cash" | "UPI" | "Wallet";
  label: string;
  icon: string;
}[] = [
  { id: "Cash", label: "Cash", icon: "💵" },
  { id: "UPI", label: "UPI", icon: "📲" },
  { id: "Wallet", label: "Wallet", icon: "👛" },
];

// Haversine formula: straight-line km between two lat/lon points
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocode(
  query: string,
): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    );
    const data = await res.json();
    if (data?.[0])
      return {
        lat: Number.parseFloat(data[0].lat),
        lon: Number.parseFloat(data[0].lon),
      };
  } catch {
    /* ignore */
  }
  return null;
}

interface Coords {
  lat: number;
  lon: number;
}

interface RouteMapPanelProps {
  pickup: Coords;
  drop: Coords;
  distanceKm: number;
  pickupLabel: string;
  dropLabel: string;
  eta?: string;
  trafficLabel?: "Light" | "Moderate" | "Heavy";
}

function getMapZoom(distanceKm: number): number {
  if (distanceKm < 2) return 14;
  if (distanceKm < 5) return 13;
  if (distanceKm < 10) return 12;
  if (distanceKm < 20) return 11;
  if (distanceKm < 50) return 10;
  return 9;
}

const TRAFFIC_PILL: Record<
  "Light" | "Moderate" | "Heavy",
  { bg: string; text: string; dot: string }
> = {
  Light: {
    bg: "bg-success/10 border-success/25",
    text: "text-success",
    dot: "bg-success",
  },
  Moderate: {
    bg: "bg-warning/10 border-warning/25",
    text: "text-warning",
    dot: "bg-warning",
  },
  Heavy: {
    bg: "bg-destructive/10 border-destructive/25",
    text: "text-destructive",
    dot: "bg-destructive",
  },
};

function RouteMapPanel({
  pickup,
  drop,
  distanceKm,
  pickupLabel,
  dropLabel,
  eta,
  trafficLabel,
}: RouteMapPanelProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const midLat = (pickup.lat + drop.lat) / 2;
  const midLon = (pickup.lon + drop.lon) / 2;
  const zoom = getMapZoom(distanceKm);

  const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${midLat},${midLon}&zoom=${zoom}&size=600x200&markers=${pickup.lat},${pickup.lon},red-pushpin|${drop.lat},${drop.lon},ltblue-pushpin`;

  const trafficStyle = trafficLabel ? TRAFFIC_PILL[trafficLabel] : null;

  return (
    <motion.div
      data-ocid="rider.route_map.card"
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-xl border border-border/60 bg-muted/30 shadow-sm"
    >
      {/* Map image area */}
      <div
        className="relative w-full"
        style={{ aspectRatio: "3/1", minHeight: 100 }}
      >
        {/* Skeleton shown while loading */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-muted animate-pulse rounded-t-xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-xs">Loading map...</span>
            </div>
          </div>
        )}
        {imageError ? (
          <div className="absolute inset-0 bg-muted/60 rounded-t-xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <MapPin size={20} className="opacity-40" />
              <span className="text-xs">Map unavailable</span>
            </div>
          </div>
        ) : (
          <img
            src={mapUrl}
            alt={`Route from ${pickupLabel} to ${dropLabel}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
            className={`w-full h-full object-cover rounded-t-xl transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            style={{ display: "block" }}
          />
        )}
      </div>

      {/* Route summary row */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-background/60 border-t border-border/40">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="w-2 h-2 rounded-full bg-success shrink-0" />
          <span className="text-xs text-foreground font-medium truncate">
            {pickupLabel}
          </span>
        </div>
        <div className="shrink-0 text-muted-foreground/60 text-[10px] font-bold">
          →
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
          <span className="text-xs text-foreground font-medium truncate">
            {dropLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary whitespace-nowrap">
            {distanceKm} km
          </div>
          {trafficStyle && trafficLabel && (
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold whitespace-nowrap ${trafficStyle.bg} ${trafficStyle.text}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${trafficStyle.dot}`}
              />
              {trafficLabel}
            </div>
          )}
          {eta && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 border border-border/50 text-[10px] font-semibold text-foreground whitespace-nowrap">
              <Clock size={9} />
              {eta}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// --- OSRM directions ---

interface OsrmStep {
  maneuver: {
    type: string;
    modifier?: string;
  };
  name: string;
  distance: number;
}

function getManeuverIcon(type: string, modifier?: string) {
  if (type === "turn") {
    if (
      modifier === "left" ||
      modifier === "sharp left" ||
      modifier === "slight left"
    )
      return ArrowBigLeft;
    if (
      modifier === "right" ||
      modifier === "sharp right" ||
      modifier === "slight right"
    )
      return ArrowBigRight;
  }
  if (type === "depart") return Navigation;
  if (type === "arrive") return MapPin;
  if (type === "roundabout" || type === "rotary") return RotateCcw;
  if (type === "merge") return Merge;
  if (type === "continue" || type === "new name") return ArrowUp;
  if (type === "straight") return ArrowUp;
  return ArrowRight;
}

function formatStepDistance(meters: number): string {
  if (meters < 100) return "< 100 m";
  if (meters < 1000) return `${Math.round(meters / 100) * 100} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

interface DirectionsPanelProps {
  pickup: Coords;
  drop: Coords;
}

function DirectionsPanel({ pickup, drop }: DirectionsPanelProps) {
  const [steps, setSteps] = useState<OsrmStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(false);

    const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lon},${pickup.lat};${drop.lon},${drop.lat}?steps=true&overview=false`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const legs = data?.routes?.[0]?.legs ?? [];
        const allSteps: OsrmStep[] = [];
        for (const leg of legs) {
          for (const step of leg.steps ?? []) {
            allSteps.push(step);
          }
        }
        setSteps(allSteps);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pickup.lat, pickup.lon, drop.lat, drop.lon]);

  const MAX_DEFAULT = 8;
  const visibleSteps = expanded ? steps : steps.slice(0, MAX_DEFAULT);
  const hasMore = steps.length > MAX_DEFAULT;

  return (
    <motion.div
      data-ocid="rider.directions.card"
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="overflow-hidden rounded-xl border border-border/60 bg-card/60 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
        <Navigation size={14} className="text-primary shrink-0" />
        <span className="text-sm font-semibold text-foreground">
          Directions
        </span>
        {!isLoading && !error && steps.length > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground font-medium">
            {steps.length} steps
          </span>
        )}
      </div>

      <div className="px-4 py-3 space-y-0">
        {isLoading ? (
          /* Loading skeleton */
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                data-ocid="rider.directions.loading_state"
                className="flex items-center gap-3 animate-pulse"
              >
                <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
                <div className="w-6 h-6 rounded-md bg-muted shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2.5 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p
            data-ocid="rider.directions.error_state"
            className="text-xs text-muted-foreground text-center py-2"
          >
            Directions unavailable
          </p>
        ) : steps.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            No directions found
          </p>
        ) : (
          <>
            {visibleSteps.map((step, idx) => {
              const Icon = getManeuverIcon(
                step.maneuver.type,
                step.maneuver.modifier,
              );
              const streetName = step.name || "Continue";
              const modifier = step.maneuver.modifier
                ? ` (${step.maneuver.modifier})`
                : "";
              const stepKey = `step-${idx}-${step.maneuver.type}-${step.name}`;
              return (
                <div
                  key={stepKey}
                  className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0"
                >
                  {/* Step number */}
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-primary">
                      {idx + 1}
                    </span>
                  </div>
                  {/* Icon */}
                  <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-foreground/70" />
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {streetName}
                      {modifier && (
                        <span className="text-muted-foreground font-normal">
                          {modifier}
                        </span>
                      )}
                    </p>
                  </div>
                  {/* Distance */}
                  <div className="shrink-0 text-[10px] text-muted-foreground font-medium">
                    {formatStepDistance(step.distance)}
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <button
                type="button"
                data-ocid="rider.directions.show_all_button"
                onClick={() => setExpanded((prev) => !prev)}
                className="w-full flex items-center justify-center gap-1.5 pt-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp size={13} />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown size={13} />
                    Show all {steps.length} steps
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function RiderHome({
  pickup,
  drop,
  selectedVehicle,
  rideHistory,
  paymentMethod,
  onPickupChange,
  onDropChange,
  onVehicleSelect,
  onBookRide,
  onPaymentMethodChange,
}: RiderHomeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number>(
    () => Math.round((Math.random() * 13 + 2) * 10) / 10,
  );
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<Coords | null>(null);
  const [dropCoords, setDropCoords] = useState<Coords | null>(null);
  const pickupRef = useRef<HTMLInputElement>(null);
  const distanceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Recalculate distance when both pickup and drop are filled
  useEffect(() => {
    // Clear coords if either input is cleared
    if (!pickup.trim()) {
      setPickupCoords(null);
    }
    if (!drop.trim()) {
      setDropCoords(null);
    }
    if (!pickup.trim() || !drop.trim()) return;
    if (distanceDebounceRef.current) clearTimeout(distanceDebounceRef.current);
    distanceDebounceRef.current = setTimeout(async () => {
      setIsCalculatingDistance(true);
      const [resolvedPickup, resolvedDrop] = await Promise.all([
        geocode(pickup.trim()),
        geocode(drop.trim()),
      ]);
      if (resolvedPickup && resolvedDrop) {
        const km = haversineKm(
          resolvedPickup.lat,
          resolvedPickup.lon,
          resolvedDrop.lat,
          resolvedDrop.lon,
        );
        setDistanceKm(Math.round(km * 10) / 10);
        setPickupCoords(resolvedPickup);
        setDropCoords(resolvedDrop);
      } else {
        setPickupCoords(null);
        setDropCoords(null);
      }
      setIsCalculatingDistance(false);
    }, 800);
    return () => {
      if (distanceDebounceRef.current)
        clearTimeout(distanceDebounceRef.current);
    };
  }, [pickup, drop]);

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          );
          const data = await res.json();
          const address =
            data.address?.road ||
            data.address?.suburb ||
            data.address?.neighbourhood ||
            data.address?.city_district ||
            data.address?.city ||
            data.display_name ||
            `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          onPickupChange(address);
          toast.success("Current location detected");
        } catch {
          onPickupChange(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          toast.success("Location set to GPS coordinates");
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        setIsFetchingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error(
            "Location permission denied. Please allow location access.",
          );
        } else {
          toast.error("Unable to fetch your location");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    setShowBanner(shouldShowWeeklyBanner());
  }, []);

  const handleDismissBanner = () => {
    dismissWeeklyBanner();
    setShowBanner(false);
  };

  const handleChooseRide = () => {
    handleDismissBanner();
    setTimeout(() => {
      pickupRef.current?.focus();
      pickupRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);
  };

  const sportsCarFareInfo = calculateSportsCarFare(distanceKm);
  const autoFareInfo = calculateAutoFare(distanceKm);
  const cabFareInfo = calculateCabFare(distanceKm);

  const trafficCondition = getTrafficCondition();

  const VEHICLES: {
    type: "Sports Car" | "Auto" | "Cab";
    icon: React.ElementType;
    price: number;
    desc: string;
    eta: string;
    formula: string;
  }[] = [
    {
      type: "Sports Car" as const,
      icon: Bike,
      price: sportsCarFareInfo.totalFare,
      desc: "Quick & affordable",
      eta: formatETA(estimateETA(distanceKm, "Sports Car")),
      formula: "₹20 base + ₹5/km",
    },
    {
      type: "Auto" as const,
      icon: AutoIcon,
      price: autoFareInfo.totalFare,
      desc: "Comfortable 3-wheeler",
      eta: formatETA(estimateETA(distanceKm, "Auto")),
      formula: "₹30 base + ₹6/km",
    },
    {
      type: "Cab" as const,
      icon: Car,
      price: cabFareInfo.totalFare,
      desc: "AC & spacious",
      eta: formatETA(estimateETA(distanceKm, "Cab")),
      formula: "₹50 base + ₹10/km",
    },
  ];

  const handleBook = () => {
    if (!pickup.trim()) {
      toast.error("Please enter pickup location");
      return;
    }
    if (!drop.trim()) {
      toast.error("Please enter drop location");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      let fare: number;
      if (selectedVehicle === "Sports Car") {
        fare = calculateSportsCarFare(distanceKm).totalFare;
      } else if (selectedVehicle === "Auto") {
        fare = calculateAutoFare(distanceKm).totalFare;
      } else {
        fare = calculateCabFare(distanceKm).totalFare;
      }
      onBookRide({
        id: Date.now(),
        pickup: pickup.trim(),
        drop: drop.trim(),
        vehicleType: selectedVehicle,
        fare,
        status: "Pending",
        distanceKm,
      });
      toast.success("Searching for drivers...");
    }, 600);
  };

  const recentRides = rideHistory.slice(0, 3);

  return (
    <div className="pb-24 space-y-5 view-transition">
      {/* Hero greeting strip */}
      <div className="relative overflow-hidden rounded-2xl bg-shell text-shell-foreground p-5">
        <div className="bg-primary-glow absolute inset-0 pointer-events-none" />
        <p className="text-sm text-white/60 mb-1">Good morning 👋</p>
        <h2 className="text-xl font-bold text-white">Where to?</h2>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
          <Zap size={64} className="text-primary" />
        </div>
      </div>

      {/* Weekly Happy Customer Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            data-ocid="rider.weekly_banner.card"
            key="weekly-banner"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-600/5 shadow-[0_4px_24px_rgba(245,158,11,0.12)]">
              {/* Decorative glow orbs */}
              <div className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 rounded-full bg-amber-400/20 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-orange-500/15 blur-xl" />

              {/* Dismiss button */}
              <button
                type="button"
                data-ocid="rider.weekly_banner.close_button"
                onClick={handleDismissBanner}
                aria-label="Dismiss weekly message"
                className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200"
              >
                <X size={13} />
              </button>

              <div className="relative p-4 pr-10">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{
                      duration: 1.8,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                    className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_2px_10px_rgba(245,158,11,0.4)]"
                  >
                    <Heart
                      size={18}
                      className="text-white"
                      fill="currentColor"
                    />
                  </motion.div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-amber-100 leading-tight mb-0.5">
                      Happy to have you, Valued Rider! 🎉
                    </p>
                    <p className="text-xs text-amber-200/75 leading-relaxed">
                      Thank you for riding with RideGo this week. Ready for your
                      next journey?
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-3">
                  <button
                    type="button"
                    data-ocid="rider.weekly_banner.primary_button"
                    onClick={handleChooseRide}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_2px_12px_rgba(245,158,11,0.35)] hover:shadow-[0_4px_16px_rgba(245,158,11,0.45)] hover:from-amber-400 hover:to-orange-400 transition-all duration-200 active:scale-95"
                  >
                    <Zap size={12} />
                    Choose Your Ride
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book a Ride Card */}
      <Card className="shadow-card border-border/50">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-base text-foreground">
            Book a Ride
          </h3>

          {/* Pickup & Drop */}
          <div className="space-y-2">
            <div className="relative">
              <button
                type="button"
                data-ocid="rider.fetch_location_button"
                onClick={handleFetchLocation}
                disabled={isFetchingLocation}
                title="Tap to use current location"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-success/10 hover:bg-success/25 transition-colors disabled:opacity-60 disabled:cursor-not-allowed z-10"
              >
                {isFetchingLocation ? (
                  <Loader2 size={14} className="animate-spin text-success" />
                ) : (
                  <MapPin size={14} className="text-success" />
                )}
              </button>
              <Input
                ref={pickupRef}
                data-ocid="rider.pickup_input"
                value={pickup}
                onChange={(e) => onPickupChange(e.target.value)}
                placeholder="Tap green pin for current location"
                className="pl-9 pr-4 h-11 bg-muted/50 border-border/60 focus:border-primary focus:ring-primary/20"
              />
            </div>

            <div className="relative flex items-center gap-2">
              <div className="absolute left-3 h-full flex flex-col items-center justify-center pointer-events-none">
                <div className="w-px h-2 bg-border" />
              </div>
              <Navigation
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-destructive"
              />
              <Input
                data-ocid="rider.drop_input"
                value={drop}
                onChange={(e) => onDropChange(e.target.value)}
                placeholder="Enter drop location"
                className="pl-9 h-11 bg-muted/50 border-border/60 focus:border-primary focus:ring-primary/20"
              />
            </div>
          </div>

          <Separator />

          {/* Distance display */}
          {(pickup.trim() || drop.trim()) && (
            <div className="flex items-center justify-center">
              <div
                data-ocid="rider.distance_badge"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary"
              >
                {isCalculatingDistance ? (
                  <>
                    <Loader2 size={11} className="animate-spin" />
                    <span>Calculating distance...</span>
                  </>
                ) : (
                  <>
                    <Navigation size={11} />
                    <span>{distanceKm} km</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Route Map */}
          <AnimatePresence>
            {pickupCoords && dropCoords && !isCalculatingDistance && (
              <>
                <RouteMapPanel
                  pickup={pickupCoords}
                  drop={dropCoords}
                  distanceKm={distanceKm}
                  pickupLabel={pickup.trim()}
                  dropLabel={drop.trim()}
                  eta={formatETA(estimateETA(distanceKm, selectedVehicle))}
                  trafficLabel={trafficCondition.label}
                />
                <DirectionsPanel pickup={pickupCoords} drop={dropCoords} />
              </>
            )}
          </AnimatePresence>

          {/* Vehicle Selection */}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">
              Choose Vehicle
            </p>
            <div className="grid grid-cols-3 gap-2">
              {VEHICLES.map((v) => {
                const Icon = v.icon;
                const isSelected = selectedVehicle === v.type;
                return (
                  <button
                    type="button"
                    key={v.type}
                    data-ocid={`rider.${v.type === "Sports Car" ? "sportscar" : v.type.toLowerCase()}_button`}
                    onClick={() => onVehicleSelect(v.type)}
                    className={`
                      relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer
                      ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-orange-sm"
                          : "border-border bg-background hover:border-primary/40 hover:bg-primary/3"
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                    )}
                    <Icon
                      size={22}
                      className={
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }
                    />
                    <span
                      className={`text-xs font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}
                    >
                      {v.type}
                    </span>
                    <span className="text-xs font-bold text-primary">
                      ₹{v.price}
                    </span>
                    <span className="text-[9px] text-muted-foreground leading-tight text-center">
                      {v.formula}
                    </span>
                    <span className="text-[9px] text-amber-500/80 leading-tight text-center font-medium">
                      *Toll fees extra
                    </span>
                    <span className="text-[9px] text-muted-foreground leading-tight text-center flex items-center gap-0.5">
                      {isCalculatingDistance ? (
                        <Loader2 size={9} className="animate-spin" />
                      ) : (
                        `~${distanceKm} km`
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">
              Payment
            </p>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map((method) => {
                const isActive = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    data-ocid={`rider.payment_${method.id.toLowerCase()}_tab`}
                    onClick={() => onPaymentMethodChange(method.id)}
                    className={`
                      flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full border-2 text-xs font-semibold transition-all duration-200
                      ${
                        isActive
                          ? "border-primary bg-primary/15 text-primary shadow-[0_0_0_1px_rgba(var(--primary),0.2)]"
                          : "border-border/50 bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }
                    `}
                  >
                    <span>{method.icon}</span>
                    <span>{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            data-ocid="rider.book_button"
            onClick={handleBook}
            disabled={isLoading}
            className="w-full h-12 font-semibold text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-orange transition-all duration-200"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Booking...
              </span>
            ) : (
              "Book Ride"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Rides */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-base text-foreground">
            Recent Rides
          </h3>
          {rideHistory.length > 3 && (
            <button
              type="button"
              className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
            >
              View all <ChevronRight size={12} />
            </button>
          )}
        </div>

        {recentRides.length === 0 ? (
          <Card className="border-dashed border-border/60">
            <CardContent className="p-6 text-center">
              <MapPin
                size={32}
                className="text-muted-foreground mx-auto mb-2 opacity-40"
              />
              <p className="text-muted-foreground text-sm">No rides yet</p>
              <p className="text-muted-foreground text-xs mt-1">
                Book your first ride above!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentRides.map((ride, idx) => (
              <Card
                key={ride.id}
                data-ocid={`rider.ride.item.${idx + 1}`}
                className="shadow-xs border-border/50 hover:shadow-card transition-shadow"
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin size={14} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                          <span className="truncate">{ride.pickup}</span>
                          <ChevronRight size={10} className="shrink-0" />
                          <span className="truncate">{ride.drop}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">
                            {ride.vehicleType}
                          </span>
                          <span className="text-xs text-primary font-semibold">
                            ₹{ride.fare}
                          </span>
                          {ride.rating && (
                            <span className="flex items-center gap-0.5 text-xs text-warning font-medium">
                              <Star size={10} fill="currentColor" />
                              {ride.rating}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock size={10} className="text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">
                            {ride.date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={`text-[10px] shrink-0 border ${STATUS_COLOR[ride.status] ?? ""}`}
                      variant="outline"
                    >
                      {ride.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick location chips */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">
          Popular in Bengaluru
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            "Koramangala",
            "Indiranagar",
            "HSR Layout",
            "Whitefield",
            "Electronic City",
          ].map((loc) => (
            <button
              type="button"
              key={loc}
              onClick={() => {
                if (!pickup) onPickupChange(loc);
                else onDropChange(loc);
              }}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-muted/50 text-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors"
            >
              {loc}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
