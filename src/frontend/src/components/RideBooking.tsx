import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { NotificationType } from "@/hooks/useNotifications";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { estimateETA, formatETA, getTrafficCondition } from "@/utils/etaUtils";
import { calculateWaitingCharge } from "@/utils/fareUtils";
import {
  Bike,
  Car,
  CheckCircle,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Shield,
  ShieldAlert,
  Star,
  Timer,
  XCircle,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { RideRequest } from "../App";
import CallOverlay from "./CallOverlay";
import ChatWindow from "./ChatWindow";
import UPIPayment from "./UPIPayment";

interface MockDriver {
  name: string;
  vehicleType: string;
  plate: string;
  rating: number;
  phone: string;
}

const MOCK_DRIVER: MockDriver = {
  name: "Suresh Kumar",
  vehicleType: "Sports Car",
  plate: "KA 01 AB 1234",
  rating: 4.8,
  phone: "98765XXXXX",
};

// Custom Auto-rickshaw icon (3-wheeler)
function AutoIcon({
  size = 16,
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

function getVehicleIcon(vehicleType: string): React.ElementType {
  if (vehicleType === "Sports Car") return Bike;
  if (vehicleType === "Auto") return AutoIcon;
  return Car;
}

const STATUS_STEPS = [
  "Pending",
  "Accepted",
  "In Progress",
  "Completed",
] as const;
type RideStatus = (typeof STATUS_STEPS)[number];

interface RideBookingProps {
  currentRide: RideRequest;
  paymentMethod: "Cash" | "UPI" | "Wallet";
  onCancel: () => void;
  onComplete: () => void;
  onNotify?: (title: string, message: string, type?: NotificationType) => void;
}

export default function RideBooking({
  currentRide,
  paymentMethod,
  onCancel,
  onComplete,
  onNotify,
}: RideBookingProps) {
  const [searching, setSearching] = useState(true);
  const [status, setStatus] = useState<RideStatus>("Pending");
  const [driver] = useState<MockDriver>(MOCK_DRIVER);
  const [showUpiPayment, setShowUpiPayment] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showSosDialog, setShowSosDialog] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const waitingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // Grace period: 120 seconds from when driver is accepted
  const GRACE_PERIOD_SECONDS = 120;
  const [graceSeconds, setGraceSeconds] = useState(0);
  const graceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const graceRemaining = Math.max(0, GRACE_PERIOD_SECONDS - graceSeconds);
  const withinGracePeriod = graceSeconds < GRACE_PERIOD_SECONDS;
  const cancellationFee = Math.round(currentRide.fare * 0.2);

  const {
    playRideAccepted,
    playRideStarted,
    playRideCompleted,
    playRideCancelled,
  } = useSoundEffects();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearching(false);
      setStatus("Accepted");
      playRideAccepted();
      toast.success("Driver found! Suresh is on the way 🚗");
      onNotify?.("Driver Found!", "Suresh Kumar is on the way", "success");
    }, 2500);
    return () => clearTimeout(timer);
  }, [onNotify, playRideAccepted]);

  // Start waiting timer once driver is accepted (before ride starts)
  useEffect(() => {
    if (status === "Accepted") {
      waitingIntervalRef.current = setInterval(() => {
        setWaitingSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (waitingIntervalRef.current) {
        clearInterval(waitingIntervalRef.current);
        waitingIntervalRef.current = null;
      }
    }
    return () => {
      if (waitingIntervalRef.current) {
        clearInterval(waitingIntervalRef.current);
        waitingIntervalRef.current = null;
      }
    };
  }, [status]);

  // Start grace period countdown when driver is accepted
  useEffect(() => {
    if (status === "Accepted") {
      setGraceSeconds(0);
      graceIntervalRef.current = setInterval(() => {
        setGraceSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (graceIntervalRef.current) {
        clearInterval(graceIntervalRef.current);
        graceIntervalRef.current = null;
      }
    }
    return () => {
      if (graceIntervalRef.current) {
        clearInterval(graceIntervalRef.current);
        graceIntervalRef.current = null;
      }
    };
  }, [status]);

  const formatGraceCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleCancelRequest = () => {
    // If status is Accepted, show confirmation dialog; otherwise cancel immediately
    if (status === "Accepted") {
      setShowCancelDialog(true);
    } else {
      confirmCancel();
    }
  };

  const confirmCancel = () => {
    setShowCancelDialog(false);
    playRideCancelled();
    if (status === "Accepted" && !withinGracePeriod) {
      toast.error(
        `Ride cancelled. Cancellation fee of ₹${cancellationFee} applied.`,
      );
    } else {
      toast.error("Ride cancelled");
    }
    onNotify?.("Ride Cancelled", "Your ride has been cancelled", "warning");
    onCancel();
  };

  const handleComplete = () => {
    setStatus("Completed");
    if (paymentMethod === "UPI") {
      // Show UPI payment screen
      setShowUpiPayment(true);
    } else {
      // Cash / Wallet: complete immediately
      playRideCompleted();
      onNotify?.("Ride Completed", "Hope you had a great trip!", "success");
      setTimeout(() => {
        toast.success("Ride completed! Hope you had a great trip 🎉");
        onComplete();
      }, 800);
    }
  };

  const handleUpiSuccess = (transactionId: string, method: string) => {
    playRideCompleted();
    onNotify?.(
      "Payment Successful",
      `₹${currentRide.fare} paid via ${method}`,
      "success",
    );
    toast.success(
      `Payment of ₹${currentRide.fare} successful! Txn: ${transactionId}`,
    );
    onComplete();
  };

  const handleUpiBack = () => {
    setShowUpiPayment(false);
    setStatus("In Progress");
  };

  const handleStartRide = () => {
    setStatus("In Progress");
    playRideStarted();
    toast("Ride started! Have a safe journey 🚀");
    onNotify?.("Ride Started", "Your ride is now in progress", "info");
  };

  const handleSosConfirm = () => {
    setShowSosDialog(false);
    setSosActive(true);
    onNotify?.(
      "SOS Alert Triggered",
      "Emergency services have been notified",
      "warning",
    );
    toast.error("SOS triggered! Emergency contacts shown.");
  };

  const currentStepIdx = STATUS_STEPS.indexOf(status);

  const VehicleIcon = getVehicleIcon(currentRide.vehicleType);

  const waitingMinutes = Math.floor(waitingSeconds / 60);
  const waitingCharge = calculateWaitingCharge(waitingMinutes);
  const totalFareWithWaiting = currentRide.fare + waitingCharge;

  const formatWaitTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (showUpiPayment) {
    return (
      <UPIPayment
        fare={currentRide.fare}
        onSuccess={handleUpiSuccess}
        onBack={handleUpiBack}
      />
    );
  }

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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-ocid="rider.chat_button"
                  onClick={() => setShowChat(true)}
                  className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center hover:bg-success/20 transition-colors"
                  title="Chat with driver"
                >
                  <MessageCircle size={16} className="text-success" />
                </button>
                <button
                  type="button"
                  data-ocid="rider.call_button"
                  onClick={() => setShowCall(true)}
                  className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                  title="Call driver"
                >
                  <Phone size={16} className="text-primary" />
                </button>
              </div>
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
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1">
                <Clock size={12} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  {formatETA(
                    estimateETA(
                      currentRide.distanceKm ?? 5,
                      currentRide.vehicleType,
                    ),
                  )}
                </span>
              </div>
              {(() => {
                const traffic = getTrafficCondition();
                const colorMap = {
                  Light: "text-success",
                  Moderate: "text-warning",
                  Heavy: "text-destructive",
                } as const;
                return (
                  <span
                    className={`text-[10px] font-medium ${colorMap[traffic.label]}`}
                  >
                    {traffic.label} traffic
                  </span>
                );
              })()}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Fare</p>
              <p className="text-lg font-bold text-primary">
                ₹{totalFareWithWaiting}
              </p>
              {waitingCharge > 0 && (
                <p className="text-[10px] text-warning font-medium">
                  +₹{waitingCharge} waiting
                </p>
              )}
              <p className="text-[10px] text-amber-500/80 font-medium">
                *Toll fees extra
              </p>
            </div>
          </div>

          {/* Grace period banner - shown when driver is accepted */}
          {status === "Accepted" && (
            <div
              data-ocid="rider.grace_period.card"
              className={`mt-2 flex items-center justify-between rounded-lg px-3 py-2 border transition-colors duration-700 ${
                withinGracePeriod
                  ? "bg-success/8 border-success/25"
                  : "bg-warning/8 border-warning/25"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock
                  size={13}
                  className={`shrink-0 ${withinGracePeriod ? "text-success" : "text-warning"}`}
                />
                <div>
                  {withinGracePeriod ? (
                    <>
                      <p className="text-xs font-semibold text-success leading-tight">
                        Free cancellation window
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        No charge if cancelled within 2 min
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-warning leading-tight">
                        Cancellation fee applies
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        20% of fare = ₹{cancellationFee}
                      </p>
                    </>
                  )}
                </div>
              </div>
              {withinGracePeriod ? (
                <span
                  data-ocid="rider.grace_countdown.badge"
                  className="text-xs font-bold px-2 py-0.5 rounded-full border text-success border-success/40 bg-success/10 tabular-nums"
                >
                  {formatGraceCountdown(graceRemaining)}
                </span>
              ) : (
                <span
                  data-ocid="rider.grace_expired.badge"
                  className="text-xs font-bold px-2 py-0.5 rounded-full border text-warning border-warning/40 bg-warning/10"
                >
                  ₹{cancellationFee}
                </span>
              )}
            </div>
          )}

          {/* Waiting charge info when driver is accepted but ride not started */}
          {status === "Accepted" && waitingSeconds > 0 && (
            <div className="mt-2 flex items-center justify-between rounded-lg bg-warning/8 border border-warning/20 px-3 py-2">
              <div className="flex items-center gap-2">
                <Timer size={13} className="text-warning shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-warning">
                    Waiting: {formatWaitTime(waitingSeconds)}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {waitingMinutes < 5
                      ? `₹5 applies after ${5 - waitingMinutes} min`
                      : waitingMinutes < 10
                        ? `₹10 applies after ${10 - waitingMinutes} min`
                        : "Max waiting charge applied"}
                  </p>
                </div>
              </div>
              <span
                data-ocid="rider.waiting_charge.badge"
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${waitingCharge > 0 ? "text-warning border-warning/40 bg-warning/10" : "text-muted-foreground border-border"}`}
              >
                {waitingCharge > 0 ? `+₹${waitingCharge}` : "Free"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SOS Active Banner */}
      {sosActive && (status === "Accepted" || status === "In Progress") && (
        <Card
          data-ocid="rider.sos_active.card"
          className="border-2 border-destructive/70 bg-destructive/5 shadow-lg"
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-destructive flex items-center justify-center shrink-0 animate-pulse">
                  <ShieldAlert size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-destructive leading-tight">
                    SOS Alert Active
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Emergency services notified
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSosActive(false)}
                className="text-xs border-destructive/40 text-destructive hover:bg-destructive/10 h-7 px-2"
              >
                Deactivate SOS
              </Button>
            </div>
            <Separator className="bg-destructive/20" />
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Emergency Numbers
              </p>
              {[
                { label: "Police", number: "100" },
                { label: "Ambulance", number: "108" },
                { label: "Women Helpline", number: "1091" },
              ].map(({ label, number }) => (
                <a
                  key={number}
                  href={`tel:${number}`}
                  className="flex items-center justify-between rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 hover:bg-destructive/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-destructive shrink-0" />
                    <span className="text-sm font-medium text-foreground">
                      {label}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-destructive tabular-nums">
                    {number}
                  </span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
          {(status === "Accepted" || status === "In Progress") && (
            <Button
              data-ocid="rider.sos_button"
              onClick={() => setShowSosDialog(true)}
              variant="outline"
              className="w-full h-11 border-destructive/60 text-destructive bg-destructive/5 hover:bg-destructive/15 hover:border-destructive font-semibold"
            >
              <ShieldAlert size={16} className="mr-2" />
              SOS Emergency
            </Button>
          )}
          <Button
            data-ocid="rider.cancel_button"
            onClick={handleCancelRequest}
            variant="outline"
            className="w-full h-11 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/60"
          >
            <XCircle size={16} className="mr-2" />
            {status === "Accepted" && !withinGracePeriod
              ? `Cancel Ride (₹${cancellationFee} fee)`
              : "Cancel Ride"}
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

      {/* Chat Window */}
      {!searching && (
        <ChatWindow
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          otherPartyName={driver.name}
          myRole="rider"
        />
      )}

      {/* Call Overlay */}
      {!searching && (
        <CallOverlay
          isOpen={showCall}
          onClose={() => setShowCall(false)}
          calleeName={driver.name}
        />
      )}

      {/* SOS confirmation dialog */}
      <AlertDialog open={showSosDialog} onOpenChange={setShowSosDialog}>
        <AlertDialogContent data-ocid="rider.sos.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert size={20} className="shrink-0" />
              Emergency SOS
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This will immediately display emergency service contacts and
                  alert your emergency contacts about your current situation.
                </p>
                <div className="flex items-start gap-2 rounded-lg bg-destructive/8 border border-destructive/25 px-3 py-2">
                  <ShieldAlert
                    size={14}
                    className="text-destructive shrink-0 mt-0.5"
                  />
                  <span className="text-sm text-destructive font-medium">
                    Only use in a genuine emergency. False alarms may result in
                    penalties.
                  </span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="rider.sos.dialog.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="rider.sos.dialog.confirm_button"
              onClick={handleSosConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <ShieldAlert size={14} className="mr-1.5" />
              Trigger SOS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancellation confirmation dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent data-ocid="rider.cancel.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Ride?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {withinGracePeriod ? (
                <div className="space-y-2">
                  <p>You&apos;re within the free cancellation window.</p>
                  <div className="flex items-center gap-2 rounded-lg bg-success/8 border border-success/25 px-3 py-2">
                    <CheckCircle size={14} className="text-success shrink-0" />
                    <span className="text-sm font-medium text-success">
                      No charge — cancellation is free
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>The free cancellation window has expired.</p>
                  <div className="flex items-center gap-2 rounded-lg bg-warning/8 border border-warning/25 px-3 py-2">
                    <XCircle size={14} className="text-warning shrink-0" />
                    <span className="text-sm font-medium text-warning">
                      A 20% fee of ₹{cancellationFee} will be charged
                    </span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="rider.cancel.dialog.cancel_button">
              Keep Ride
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="rider.cancel.dialog.confirm_button"
              onClick={confirmCancel}
              className={
                withinGracePeriod
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-warning text-warning-foreground hover:bg-warning/90"
              }
            >
              {withinGracePeriod
                ? "Cancel Ride (Free)"
                : `Cancel Ride (₹${cancellationFee} fee)`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
