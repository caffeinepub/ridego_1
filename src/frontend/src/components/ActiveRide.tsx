import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { NotificationType } from "@/hooks/useNotifications";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { calculateSportsCarFare } from "@/utils/fareUtils";
import {
  Car,
  CheckCircle,
  MapPin,
  Navigation,
  Phone,
  Star,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AvailableRide } from "./DriverHome";

interface ActiveRideProps {
  ride: AvailableRide;
  paymentMethod?: "Cash" | "UPI" | "Wallet";
  onComplete: () => void;
  onCancel: () => void;
  onNotify?: (title: string, message: string, type?: NotificationType) => void;
}

type RideStep = "Accepted" | "Started" | "Completed";

const STEPS: RideStep[] = ["Accepted", "Started", "Completed"];

const PAYMENT_BADGE_STYLE: Record<"Cash" | "UPI" | "Wallet", string> = {
  Cash: "text-foreground border-border/60",
  UPI: "text-[#a78bfa] border-[#a78bfa]/30 bg-[#a78bfa]/8",
  Wallet: "text-[#60a5fa] border-[#60a5fa]/30 bg-[#60a5fa]/8",
};

export default function ActiveRide({
  ride,
  paymentMethod = "Cash",
  onComplete,
  onCancel,
  onNotify,
}: ActiveRideProps) {
  const [step, setStep] = useState<RideStep>("Accepted");
  const { playRideStarted, playRideCompleted, playRideCancelled } =
    useSoundEffects();

  const stepIdx = STEPS.indexOf(step);

  const handleStart = () => {
    setStep("Started");
    playRideStarted();
    toast("Ride started! Navigate to drop location 🗺️");
    onNotify?.("Ride Started", "Navigate to drop location", "info");
  };

  const handleComplete = () => {
    setStep("Completed");
    playRideCompleted();
    onNotify?.(
      "Ride Completed",
      `You earned ₹${ride.fare} for this trip`,
      "success",
    );
    setTimeout(() => {
      toast.success(`Ride completed! ₹${ride.fare} earned 💰`);
      onComplete();
    }, 1000);
  };

  const handleCancel = () => {
    playRideCancelled();
    toast.error("Ride cancelled");
    onNotify?.("Ride Cancelled", "The ride has been cancelled", "warning");
    onCancel();
  };

  const VehicleIcon = Car;

  const MOCK_RIDER = {
    name: ride.rider,
    phone: "93847XXXXX",
    rating: 4.6,
  };

  return (
    <div className="pb-24 space-y-4 view-transition">
      {/* Status Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-shell text-white p-5">
        <div className="bg-primary-glow absolute inset-0 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-white/60 text-sm">Active Ride</span>
          </div>
          <h2 className="text-xl font-bold">
            {step === "Accepted" && "Heading to Pickup"}
            {step === "Started" && "Ride in Progress"}
            {step === "Completed" && "Ride Completed!"}
          </h2>
          <p className="text-white/60 text-sm mt-0.5">
            {ride.pickup} → {ride.drop}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="shadow-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            {STEPS.map((s, idx) => {
              const isDone = idx < stepIdx;
              const isActive = idx === stepIdx;
              return (
                <div
                  key={s}
                  className="flex-1 flex flex-col items-center gap-1.5 relative"
                >
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`absolute top-4 left-1/2 w-full h-0.5 transition-colors duration-500 ${isDone ? "bg-success" : "bg-border"}`}
                    />
                  )}
                  <div
                    className={`
                      relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                      ${isDone ? "bg-success text-white" : isActive ? "bg-primary text-white shadow-orange-sm" : "bg-muted text-muted-foreground"}
                    `}
                  >
                    {isDone ? <CheckCircle size={14} /> : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] font-medium text-center leading-tight ${isDone || isActive ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {s}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rider Details */}
      <Card className="shadow-card border-border/50">
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
            Rider Details
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center shrink-0 border-2 border-border">
              <User size={24} className="text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-base">{MOCK_RIDER.name}</h4>
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={12} fill="currentColor" className="text-warning" />
                <span className="text-sm font-semibold">
                  {MOCK_RIDER.rating}
                </span>
                <span className="text-xs text-muted-foreground">
                  rider rating
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {MOCK_RIDER.phone}
              </p>
            </div>
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <Phone size={16} className="text-primary" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Route Details */}
      <Card className="shadow-card border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <MapPin size={14} className="text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="text-sm font-medium">{ride.pickup}</p>
              </div>
            </div>
            <div className="ml-4 w-px h-4 bg-border" />
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <Navigation size={14} className="text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Drop</p>
                <p className="text-sm font-medium">{ride.drop}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VehicleIcon size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {ride.vehicleType}
              </span>
            </div>
            <Badge
              variant="outline"
              className={`text-xs ${PAYMENT_BADGE_STYLE[paymentMethod]}`}
            >
              {paymentMethod}
            </Badge>
            {ride.vehicleType === "Sports Car" ? (
              (() => {
                const distKm = ride.distanceKm ?? 3;
                const { totalFare, commission, driverEarnings } =
                  calculateSportsCarFare(distKm);
                return (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Gross fare</p>
                    <p className="text-lg font-bold text-primary">
                      ₹{totalFare}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Commission: -₹{commission}
                    </p>
                    <p className="text-xs font-semibold text-success">
                      Net ₹{driverEarnings}
                    </p>
                  </div>
                );
              })()
            ) : (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Fare</p>
                <p className="text-lg font-bold text-primary">₹{ride.fare}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {step !== "Completed" && (
        <div className="space-y-2">
          {step === "Accepted" && (
            <Button
              data-ocid="driver.start_button"
              onClick={handleStart}
              className="w-full h-12 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-orange"
            >
              Start Ride
            </Button>
          )}
          {step === "Started" && (
            <Button
              data-ocid="driver.complete_button"
              onClick={handleComplete}
              className="w-full h-12 font-semibold bg-success hover:bg-success/90 text-white"
            >
              <CheckCircle size={16} className="mr-2" />
              Complete Ride
            </Button>
          )}
          <Button
            onClick={handleCancel}
            variant="outline"
            className="w-full h-11 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/60"
          >
            <XCircle size={16} className="mr-2" />
            Cancel Ride
          </Button>
        </div>
      )}

      {step === "Completed" && (
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-3">
            <CheckCircle size={32} className="text-success" />
          </div>
          <h3 className="font-bold text-lg">Ride Completed!</h3>
          <p className="text-muted-foreground text-sm mt-1">
            You earned ₹{ride.fare} for this trip
          </p>
        </div>
      )}
    </div>
  );
}
