import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { NotificationType } from "@/hooks/useNotifications";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import {
  calculateAutoFare,
  calculateCabFare,
  calculateSportsCarFare,
} from "@/utils/fareUtils";
import {
  AlertCircle,
  Car,
  ChevronRight,
  Clock,
  MapPin,
  Navigation,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export interface AvailableRide {
  id: number;
  rider: string;
  pickup: string;
  drop: string;
  vehicleType: "Sports Car" | "Auto" | "Cab";
  fare: number;
  time: string;
  distanceKm?: number;
}

const _sportsCarMockFare = calculateSportsCarFare(4.5);
const _autoMockFare = calculateAutoFare(6.2);
const _cabMockFare = calculateCabFare(9.8);

const MOCK_RIDES: AvailableRide[] = [
  {
    id: 1,
    rider: "Priya S.",
    pickup: "Koramangala, Bengaluru",
    drop: "Indiranagar, Bengaluru",
    vehicleType: "Sports Car",
    fare: _sportsCarMockFare.totalFare,
    time: "2 min ago",
    distanceKm: 4.5,
  },
  {
    id: 2,
    rider: "Ravi K.",
    pickup: "HSR Layout, Bengaluru",
    drop: "Electronic City, Bengaluru",
    vehicleType: "Auto",
    fare: _autoMockFare.totalFare,
    time: "4 min ago",
    distanceKm: 6.2,
  },
  {
    id: 3,
    rider: "Anjali M.",
    pickup: "Whitefield, Bengaluru",
    drop: "MG Road, Bengaluru",
    vehicleType: "Cab",
    fare: _cabMockFare.totalFare,
    time: "6 min ago",
    distanceKm: 9.8,
  },
];

const VEHICLE_COLORS: Record<string, string> = {
  "Sports Car": "text-primary bg-primary/10 border-primary/20",
  Auto: "text-warning bg-warning/10 border-warning/20",
  Cab: "text-success bg-success/10 border-success/20",
};

interface DriverHomeProps {
  isOnline: boolean;
  onToggleOnline: (v: boolean) => void;
  onAcceptRide: (ride: AvailableRide) => void;
  onNotify?: (title: string, message: string, type?: NotificationType) => void;
}

export default function DriverHome({
  isOnline,
  onToggleOnline,
  onAcceptRide,
  onNotify,
}: DriverHomeProps) {
  const { playNewRideRequest, playRideAccepted } = useSoundEffects();

  const handleToggleOnline = (v: boolean) => {
    onToggleOnline(v);
    if (v) {
      playNewRideRequest();
      onNotify?.(
        "You are Online",
        "You can now receive ride requests",
        "success",
      );
      // Notify about the first available ride request
      if (MOCK_RIDES.length > 0) {
        const first = MOCK_RIDES[0];
        onNotify?.(
          "New Ride Request",
          `A rider needs a ${first.vehicleType} from ${first.pickup}`,
          "info",
        );
      }
    }
  };

  const handleAccept = (ride: AvailableRide) => {
    playRideAccepted();
    toast.success(`Ride accepted! Heading to ${ride.pickup}`);
    onAcceptRide(ride);
  };

  return (
    <div className="pb-24 space-y-5 view-transition">
      {/* Online Status Banner */}
      <div
        className={`
          relative overflow-hidden rounded-2xl p-5 transition-all duration-500
          ${isOnline ? "bg-shell text-white" : "bg-muted text-foreground"}
        `}
      >
        {isOnline && (
          <div className="bg-primary-glow absolute inset-0 pointer-events-none" />
        )}
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-success animate-pulse" : "bg-muted-foreground"}`}
              />
              <span
                className={`text-sm font-medium ${isOnline ? "text-white/80" : "text-muted-foreground"}`}
              >
                {isOnline ? "You're Online" : "You're Offline"}
              </span>
            </div>
            <h2
              className={`text-xl font-bold ${isOnline ? "text-white" : "text-foreground"}`}
            >
              {isOnline ? "Ready for rides!" : "Go online to start"}
            </h2>
            <p
              className={`text-sm mt-0.5 ${isOnline ? "text-white/60" : "text-muted-foreground"}`}
            >
              {isOnline
                ? "New ride requests will appear below"
                : "Toggle to receive ride requests"}
            </p>
          </div>
          <Switch
            data-ocid="driver.online_toggle"
            checked={isOnline}
            onCheckedChange={handleToggleOnline}
            className="data-[state=checked]:bg-primary scale-125"
          />
        </div>
      </div>

      {/* Stats Row */}
      {isOnline && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Today's Rides",
              value: "8",
              icon: Zap,
              color: "text-primary",
            },
            {
              label: "Earnings",
              value: "₹480",
              icon: ChevronRight,
              color: "text-success",
            },
            {
              label: "Rating",
              value: "4.8★",
              icon: Zap,
              color: "text-warning",
            },
          ].map((stat) => (
            <Card key={stat.label} className="shadow-xs border-border/50">
              <CardContent className="p-3 text-center">
                <p className={`text-base font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Available Rides */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-base text-foreground">
            {isOnline ? "Available Rides" : "Ride Requests"}
          </h3>
          {isOnline && (
            <Badge
              className="bg-primary/10 text-primary border-primary/20 text-xs"
              variant="outline"
            >
              {MOCK_RIDES.length} new
            </Badge>
          )}
        </div>

        {!isOnline ? (
          <Card className="border-dashed border-border/60">
            <CardContent className="p-8 text-center">
              <AlertCircle
                size={40}
                className="text-muted-foreground mx-auto mb-3 opacity-40"
              />
              <h4 className="font-semibold text-foreground mb-1">
                You're offline
              </h4>
              <p className="text-muted-foreground text-sm">
                Toggle the switch above to go online and start receiving ride
                requests.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {MOCK_RIDES.map((ride, idx) => {
              const VehicleIcon = Car;
              return (
                <Card
                  key={ride.id}
                  className="shadow-card border-border/50 hover:shadow-card-hover transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {ride.rider.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-foreground">
                            {ride.rider}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock
                              size={10}
                              className="text-muted-foreground"
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {ride.time}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0.5 border ${VEHICLE_COLORS[ride.vehicleType]}`}
                        >
                          <VehicleIcon size={9} className="mr-1" />
                          {ride.vehicleType}
                        </Badge>
                        <div className="text-right">
                          <span className="text-base font-bold text-primary block">
                            ₹{ride.fare}
                          </span>
                          {ride.distanceKm != null &&
                            (() => {
                              const calcFn =
                                ride.vehicleType === "Sports Car"
                                  ? calculateSportsCarFare
                                  : ride.vehicleType === "Auto"
                                    ? calculateAutoFare
                                    : calculateCabFare;
                              const { commission, driverEarnings } = calcFn(
                                ride.distanceKm,
                              );
                              return (
                                <span className="text-[10px] text-muted-foreground block leading-tight">
                                  Net{" "}
                                  <span className="text-success font-semibold">
                                    ₹{driverEarnings}
                                  </span>{" "}
                                  after ₹{commission} commission
                                </span>
                              );
                            })()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-success shrink-0" />
                        <span className="text-xs text-foreground truncate">
                          {ride.pickup}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-0.5">
                        <div className="w-3 flex justify-center">
                          <div className="w-px h-3 bg-border" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation
                          size={13}
                          className="text-destructive shrink-0"
                        />
                        <span className="text-xs text-foreground truncate">
                          {ride.drop}
                        </span>
                      </div>
                    </div>

                    <Button
                      data-ocid={`driver.accept_button.${idx + 1}`}
                      onClick={() => handleAccept(ride)}
                      className="w-full h-9 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-orange-sm"
                    >
                      Accept Ride
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
