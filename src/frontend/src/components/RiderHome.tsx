import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Bike,
  Car,
  ChevronRight,
  Clock,
  MapPin,
  Navigation,
  Star,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { RideHistoryEntry, RideRequest } from "../App";

interface RiderHomeProps {
  pickup: string;
  drop: string;
  selectedVehicle: "Bike" | "Auto" | "Cab";
  rideHistory: RideHistoryEntry[];
  onPickupChange: (v: string) => void;
  onDropChange: (v: string) => void;
  onVehicleSelect: (v: "Bike" | "Auto" | "Cab") => void;
  onBookRide: (ride: RideRequest) => void;
}

const VEHICLES = [
  {
    type: "Bike" as const,
    icon: Bike,
    price: 30,
    desc: "Quick & affordable",
    eta: "2 min",
  },
  {
    type: "Auto" as const,
    icon: Car,
    price: 50,
    desc: "Comfortable 3-wheeler",
    eta: "4 min",
  },
  {
    type: "Cab" as const,
    icon: Car,
    price: 80,
    desc: "AC & spacious",
    eta: "6 min",
  },
];

const STATUS_COLOR: Record<string, string> = {
  Completed: "bg-success/10 text-success border-success/20",
  Cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  "In Progress": "bg-primary/10 text-primary border-primary/20",
};

export default function RiderHome({
  pickup,
  drop,
  selectedVehicle,
  rideHistory,
  onPickupChange,
  onDropChange,
  onVehicleSelect,
  onBookRide,
}: RiderHomeProps) {
  const [isLoading, setIsLoading] = useState(false);

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
      const fare =
        VEHICLES.find((v) => v.type === selectedVehicle)?.price ?? 30;
      onBookRide({
        id: Date.now(),
        pickup: pickup.trim(),
        drop: drop.trim(),
        vehicleType: selectedVehicle,
        fare,
        status: "Pending",
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

      {/* Book a Ride Card */}
      <Card className="shadow-card border-border/50">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-base text-foreground">
            Book a Ride
          </h3>

          {/* Pickup & Drop */}
          <div className="space-y-2">
            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-success"
              />
              <Input
                data-ocid="rider.pickup_input"
                value={pickup}
                onChange={(e) => onPickupChange(e.target.value)}
                placeholder="Enter pickup location"
                className="pl-9 h-11 bg-muted/50 border-border/60 focus:border-primary focus:ring-primary/20"
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
                    data-ocid={`rider.${v.type.toLowerCase()}_button`}
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
                    <span className="text-[10px] text-muted-foreground leading-tight text-center">
                      ~{v.eta}
                    </span>
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
