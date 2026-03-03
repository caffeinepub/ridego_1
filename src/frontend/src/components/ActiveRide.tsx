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
import {
  calculateAutoFare,
  calculateCabFare,
  calculateSportsCarFare,
  calculateWaitingCharge,
} from "@/utils/fareUtils";
import {
  Car,
  CheckCircle,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Star,
  Timer,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import CallOverlay from "./CallOverlay";
import ChatWindow from "./ChatWindow";
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
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const waitingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const { playRideStarted, playRideCompleted, playRideCancelled } =
    useSoundEffects();

  // Grace period: 120 seconds from when ride is accepted
  const GRACE_PERIOD_SECONDS = 120;
  const [graceSeconds, setGraceSeconds] = useState(0);
  const graceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const graceRemaining = Math.max(0, GRACE_PERIOD_SECONDS - graceSeconds);
  const withinGracePeriod = graceSeconds < GRACE_PERIOD_SECONDS;
  const cancellationFee = Math.round(ride.fare * 0.2);

  // Waiting timer: runs while step is "Accepted"
  useEffect(() => {
    if (step === "Accepted") {
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
  }, [step]);

  // Grace period countdown: starts when ride is accepted
  useEffect(() => {
    if (step === "Accepted") {
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
  }, [step]);

  const waitingMinutes = Math.floor(waitingSeconds / 60);
  const waitingCharge = calculateWaitingCharge(waitingMinutes);

  const formatWaitTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatGraceCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const stepIdx = STEPS.indexOf(step);

  const handleStart = () => {
    setStep("Started");
    playRideStarted();
    toast("Ride started! Navigate to drop location 🗺️");
    onNotify?.("Ride Started", "Navigate to drop location", "info");
  };

  const getCommissionBreakdown = () => {
    const distKm = ride.distanceKm ?? 3;
    if (ride.vehicleType === "Auto") return calculateAutoFare(distKm);
    if (ride.vehicleType === "Cab") return calculateCabFare(distKm);
    return calculateSportsCarFare(distKm);
  };

  const handleComplete = () => {
    setStep("Completed");
    playRideCompleted();
    const { commission, driverEarnings } = getCommissionBreakdown();
    const netWithWaiting = driverEarnings + waitingCharge;
    onNotify?.(
      "Ride Completed",
      `Net earnings: ₹${netWithWaiting} (commission ₹${commission} deducted)`,
      "success",
    );
    setTimeout(() => {
      toast.success(`Ride completed! Net ₹${netWithWaiting} credited 💰`);
      onComplete();
    }, 1000);
  };

  const handleCancelRequest = () => {
    if (step === "Accepted") {
      setShowCancelDialog(true);
    } else {
      confirmCancel();
    }
  };

  const confirmCancel = () => {
    setShowCancelDialog(false);
    playRideCancelled();
    if (step === "Accepted" && !withinGracePeriod) {
      toast.error(
        `Ride cancelled. Cancellation fee of ₹${cancellationFee} applied.`,
      );
    } else {
      toast.error("Ride cancelled");
    }
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-ocid="driver.chat_button"
                onClick={() => setShowChat(true)}
                className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center hover:bg-success/20 transition-colors"
                title="Chat with rider"
              >
                <MessageCircle size={16} className="text-success" />
              </button>
              <button
                type="button"
                data-ocid="driver.call_button"
                onClick={() => setShowCall(true)}
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                title="Call rider"
              >
                <Phone size={16} className="text-primary" />
              </button>
            </div>
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
                const grossWithWaiting = totalFare + waitingCharge;
                const netWithWaiting = driverEarnings + waitingCharge;
                return (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Gross fare</p>
                    <p className="text-lg font-bold text-primary">
                      ₹{grossWithWaiting}
                    </p>
                    {waitingCharge > 0 && (
                      <p className="text-[10px] text-warning font-medium">
                        +₹{waitingCharge} waiting
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      Commission: -₹{commission}
                    </p>
                    <p className="text-xs font-semibold text-success">
                      Net ₹{netWithWaiting}
                    </p>
                    <p className="text-[10px] text-amber-500/80 font-medium">
                      *Toll fees extra
                    </p>
                  </div>
                );
              })()
            ) : (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Fare</p>
                <p className="text-lg font-bold text-primary">
                  ₹{ride.fare + waitingCharge}
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
            )}
          </div>

          {/* Grace period banner for driver */}
          {step === "Accepted" && (
            <div
              data-ocid="driver.grace_period.card"
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
                  data-ocid="driver.grace_countdown.badge"
                  className="text-xs font-bold px-2 py-0.5 rounded-full border text-success border-success/40 bg-success/10 tabular-nums"
                >
                  {formatGraceCountdown(graceRemaining)}
                </span>
              ) : (
                <span
                  data-ocid="driver.grace_expired.badge"
                  className="text-xs font-bold px-2 py-0.5 rounded-full border text-warning border-warning/40 bg-warning/10"
                >
                  ₹{cancellationFee}
                </span>
              )}
            </div>
          )}

          {/* Waiting charge panel for driver */}
          {step === "Accepted" && waitingSeconds > 0 && (
            <div className="mt-2 flex items-center justify-between rounded-lg bg-warning/8 border border-warning/20 px-3 py-2">
              <div className="flex items-center gap-2">
                <Timer size={13} className="text-warning shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-warning">
                    Waiting: {formatWaitTime(waitingSeconds)}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {waitingMinutes < 5
                      ? `₹5 applies in ${5 - waitingMinutes} min`
                      : waitingMinutes < 10
                        ? `₹10 applies in ${10 - waitingMinutes} min`
                        : "Max waiting charge applied"}
                  </p>
                </div>
              </div>
              <span
                data-ocid="driver.waiting_charge.badge"
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${waitingCharge > 0 ? "text-warning border-warning/40 bg-warning/10" : "text-muted-foreground border-border"}`}
              >
                {waitingCharge > 0 ? `+₹${waitingCharge}` : "Free"}
              </span>
            </div>
          )}
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
            data-ocid="driver.cancel_button"
            onClick={handleCancelRequest}
            variant="outline"
            className="w-full h-11 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/60"
          >
            <XCircle size={16} className="mr-2" />
            {step === "Accepted" && !withinGracePeriod
              ? `Cancel Ride (₹${cancellationFee} fee)`
              : "Cancel Ride"}
          </Button>
        </div>
      )}

      {step === "Completed" && (
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-3">
            <CheckCircle size={32} className="text-success" />
          </div>
          <h3 className="font-bold text-lg">Ride Completed!</h3>
          {(() => {
            const { commission, driverEarnings } = getCommissionBreakdown();
            const netWithWaiting = driverEarnings + waitingCharge;
            const grossWithWaiting = ride.fare + waitingCharge;
            return (
              <div className="mt-3 mx-auto max-w-xs rounded-xl bg-success/8 border border-success/25 p-4 text-left space-y-1.5">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Gross Fare</span>
                  <span className="font-medium text-foreground">
                    ₹{grossWithWaiting}
                  </span>
                </div>
                {waitingCharge > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Waiting Charge</span>
                    <span className="font-medium text-warning">
                      +₹{waitingCharge}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Commission (₹1/km)</span>
                  <span className="font-medium text-destructive">
                    -₹{commission}
                  </span>
                </div>
                <div className="border-t border-success/30 pt-1.5 flex justify-between">
                  <span className="text-sm font-bold text-foreground">
                    Net Earnings
                  </span>
                  <span className="text-base font-black text-success">
                    ₹{netWithWaiting}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Chat Window */}
      <ChatWindow
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        otherPartyName={MOCK_RIDER.name}
        myRole="driver"
      />

      {/* Call Overlay */}
      <CallOverlay
        isOpen={showCall}
        onClose={() => setShowCall(false)}
        calleeName={MOCK_RIDER.name}
      />

      {/* Cancellation confirmation dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent data-ocid="driver.cancel.dialog">
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
            <AlertDialogCancel data-ocid="driver.cancel.dialog.cancel_button">
              Keep Ride
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="driver.cancel.dialog.confirm_button"
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
