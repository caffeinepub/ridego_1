import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Bike,
  Car,
  CheckCircle,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Shield,
  Star,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { RideRequest } from "../App";

interface MockDriver {
  name: string;
  vehicleType: string;
  plate: string;
  rating: number;
  phone: string;
}

const MOCK_DRIVER: MockDriver = {
  name: "Suresh Kumar",
  vehicleType: "Bike",
  plate: "KA 01 AB 1234",
  rating: 4.8,
  phone: "98765XXXXX",
};

const STATUS_STEPS = [
  "Pending",
  "Accepted",
  "In Progress",
  "Completed",
] as const;
type RideStatus = (typeof STATUS_STEPS)[number];

interface RideBookingProps {
  currentRide: RideRequest;
  onCancel: () => void;
  onComplete: () => void;
}

export default function RideBooking({
  currentRide,
  onCancel,
  onComplete,
}: RideBookingProps) {
  const [searching, setSearching] = useState(true);
  const [status, setStatus] = useState<RideStatus>("Pending");
  const [driver] = useState<MockDriver>(MOCK_DRIVER);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearching(false);
      setStatus("Accepted");
      toast.success("Driver found! Suresh is on the way 🏍️");
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleCancel = () => {
    toast.error("Ride cancelled");
    onCancel();
  };

  const handleComplete = () => {
    setStatus("Completed");
    setTimeout(() => {
      toast.success("Ride completed! Hope you had a great trip 🎉");
      onComplete();
    }, 800);
  };

  const handleStartRide = () => {
    setStatus("In Progress");
    toast("Ride started! Have a safe journey 🚀");
  };

  const currentStepIdx = STATUS_STEPS.indexOf(status);

  const VehicleIcon = currentRide.vehicleType === "Bike" ? Bike : Car;

  return (
    <div className="pb-24 space-y-4 view-transition">
      {/* Status Banner */}
      {searching ? (
        <div className="relative overflow-hidden rounded-2xl bg-shell text-white p-6 text-center">
          <div className="bg-primary-glow absolute inset-0 pointer-events-none" />
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <h2 className="text-lg font-bold">Searching for Driver...</h2>
            <p className="text-white/60 text-sm mt-1">Please wait a moment</p>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-shell text-white p-5">
          <div className="bg-primary-glow absolute inset-0 pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center shrink-0">
              <CheckCircle size={24} className="text-success" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Driver Found!</h2>
              <p className="text-white/60 text-sm">
                {driver.name} is heading to you
              </p>
            </div>
            <Badge className="ml-auto bg-success/20 text-success border-success/30 text-xs">
              {status}
            </Badge>
          </div>
        </div>
      )}

      {/* Ride Progress Steps */}
      {!searching && (
        <Card className="shadow-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between relative">
              {STATUS_STEPS.slice(0, 3).map((step, idx) => {
                const isDone = idx < currentStepIdx;
                const isActive = idx === currentStepIdx;
                return (
                  <div
                    key={step}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                        ${isDone ? "bg-success text-white" : isActive ? "bg-primary text-white shadow-orange-sm" : "bg-muted text-muted-foreground"}
                      `}
                    >
                      {isDone ? <CheckCircle size={14} /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] font-medium text-center ${isDone || isActive ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {step}
                    </span>
                    {idx < 2 && (
                      <div
                        className={`absolute top-4 left-0 right-0 h-0.5 -z-10 ${isDone ? "bg-success" : "bg-border"}`}
                        style={{
                          left: `calc(${((idx + 1) / 3) * 100}% - 30%)`,
                          width: "30%",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver Details */}
      {!searching && (
        <Card className="shadow-card border-border/50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Your Driver
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-primary">
                  {driver.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-base text-foreground">
                  {driver.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1">
                    <Star
                      size={12}
                      fill="currentColor"
                      className="text-warning"
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {driver.rating}
                    </span>
                  </div>
                  <Separator orientation="vertical" className="h-3" />
                  <VehicleIcon size={12} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {driver.vehicleType}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-0 font-mono"
                  >
                    {driver.plate}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-0 text-success border-success/30"
                  >
                    <Shield size={8} className="mr-1" />
                    Verified
                  </Badge>
                </div>
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
      )}

      {/* Ride Details */}
      <Card className="shadow-card border-border/50">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Ride Details
          </h3>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <MapPin size={14} className="text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="text-sm font-medium text-foreground">
                  {currentRide.pickup}
                </p>
              </div>
            </div>

            <div className="ml-4 w-px h-4 bg-border" />

            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <Navigation size={14} className="text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Drop</p>
                <p className="text-sm font-medium text-foreground">
                  {currentRide.drop}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VehicleIcon size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {currentRide.vehicleType}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Est. 12 min</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Fare</p>
              <p className="text-lg font-bold text-primary">
                ₹{currentRide.fare}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!searching && status !== "Completed" && (
        <div className="space-y-2">
          {status === "Accepted" && (
            <Button
              onClick={handleStartRide}
              className="w-full h-12 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-orange"
            >
              Start Ride
            </Button>
          )}
          {status === "In Progress" && (
            <Button
              data-ocid="rider.complete_button"
              onClick={handleComplete}
              className="w-full h-12 font-semibold bg-success hover:bg-success/90 text-success-foreground"
            >
              <CheckCircle size={16} className="mr-2" />
              Ride Completed
            </Button>
          )}
          <Button
            data-ocid="rider.cancel_button"
            onClick={handleCancel}
            variant="outline"
            className="w-full h-11 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/60"
          >
            <XCircle size={16} className="mr-2" />
            Cancel Ride
          </Button>
        </div>
      )}

      {status === "Completed" && (
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-3">
            <CheckCircle size={32} className="text-success" />
          </div>
          <h3 className="font-bold text-lg text-foreground">Ride Completed!</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Thank you for riding with RideGo
          </p>
        </div>
      )}
    </div>
  );
}
