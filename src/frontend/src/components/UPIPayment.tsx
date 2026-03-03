import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface UPIPaymentProps {
  fare: number;
  onSuccess: (transactionId: string, method: string) => void;
  onBack: () => void;
}

type Screen = "method" | "processing" | "success";

interface UPIApp {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  textColor: string;
}

const UPI_APPS: UPIApp[] = [
  {
    id: "gpay",
    name: "Google Pay",
    shortName: "G",
    color: "#4285F4",
    bgColor: "bg-[#4285F4]/15",
    textColor: "text-[#4285F4]",
  },
  {
    id: "phonepe",
    name: "PhonePe",
    shortName: "P",
    color: "#5f259f",
    bgColor: "bg-[#5f259f]/15",
    textColor: "text-[#5f259f]",
  },
  {
    id: "paytm",
    name: "Paytm",
    shortName: "T",
    color: "#00BAF2",
    bgColor: "bg-[#00BAF2]/15",
    textColor: "text-[#00BAF2]",
  },
  {
    id: "bhim",
    name: "BHIM UPI",
    shortName: "B",
    color: "#F57B1F",
    bgColor: "bg-[#F57B1F]/15",
    textColor: "text-[#F57B1F]",
  },
  {
    id: "other",
    name: "Other UPI ID",
    shortName: "@",
    color: "#9E9E9E",
    bgColor: "bg-white/10",
    textColor: "text-white/70",
  },
];

function generateTxnId(): string {
  return `TXN${Math.floor(1000000000 + Math.random() * 9000000000).toString()}`;
}

export default function UPIPayment({
  fare,
  onSuccess,
  onBack,
}: UPIPaymentProps) {
  const [screen, setScreen] = useState<Screen>("method");
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [customUpiId, setCustomUpiId] = useState("");
  const [txnId, setTxnId] = useState("");
  const [methodName, setMethodName] = useState("");
  const { playRideCompleted } = useSoundEffects();

  const isOtherSelected = selectedApp === "other";
  const canPay =
    selectedApp !== null &&
    (selectedApp !== "other" || customUpiId.trim().length > 4);

  const handlePay = () => {
    if (!canPay) return;

    const app = UPI_APPS.find((a) => a.id === selectedApp);
    const method =
      selectedApp === "other"
        ? `UPI (${customUpiId.trim()})`
        : (app?.name ?? "UPI");
    const newTxnId = generateTxnId();

    setMethodName(method);
    setTxnId(newTxnId);
    setScreen("processing");

    setTimeout(() => {
      setScreen("success");
      playRideCompleted();
    }, 2200);
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] flex flex-col bg-background">
      <AnimatePresence mode="wait">
        {screen === "method" && (
          <motion.div
            key="method"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col flex-1 pb-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pt-2">
              <button
                type="button"
                data-ocid="payment.back_button"
                onClick={onBack}
                className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors"
              >
                <ArrowLeft size={18} className="text-white/80" />
              </button>
              <h2 className="text-lg font-bold text-white">
                Choose Payment Method
              </h2>
            </div>

            {/* Fare display */}
            <div className="relative overflow-hidden rounded-2xl bg-shell mb-6 p-6 text-center">
              <div className="bg-primary-glow absolute inset-0 pointer-events-none" />
              <p className="relative text-white/60 text-sm font-medium mb-1">
                Amount to Pay
              </p>
              <p className="relative text-5xl font-black text-white tracking-tight">
                ₹<span className="text-primary">{fare}</span>
              </p>
              <p className="relative text-white/40 text-xs mt-2">
                Secure UPI Payment
              </p>
            </div>

            {/* UPI Apps */}
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">
              Pay via UPI
            </p>

            <div className="space-y-2 mb-4">
              {UPI_APPS.map((app) => {
                const isSelected = selectedApp === app.id;
                return (
                  <motion.button
                    key={app.id}
                    type="button"
                    onClick={() => setSelectedApp(app.id)}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all duration-200 cursor-pointer text-left
                      ${
                        isSelected
                          ? "border-primary bg-primary/8 shadow-[0_0_0_1px_rgba(var(--primary),0.2)]"
                          : "border-border/50 bg-card hover:border-border hover:bg-card/80"
                      }
                    `}
                  >
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${app.bgColor} ${app.textColor}`}
                      style={{ borderColor: `${app.color}40` }}
                    >
                      {app.shortName}
                    </div>

                    {/* Name */}
                    <span
                      className={`flex-1 font-semibold text-sm ${isSelected ? "text-white" : "text-foreground"}`}
                    >
                      {app.name}
                    </span>

                    {/* Radio indicator */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0
                        ${isSelected ? "border-primary bg-primary" : "border-border"}`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Custom UPI ID input (shown when "Other" is selected) */}
            <AnimatePresence>
              {isOtherSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="p-4 rounded-xl bg-card border border-border/50">
                    <label
                      htmlFor="upi-id-input"
                      className="text-xs text-muted-foreground font-medium block mb-2"
                    >
                      Enter UPI ID
                    </label>
                    <Input
                      id="upi-id-input"
                      data-ocid="payment.upi_id_input"
                      value={customUpiId}
                      onChange={(e) => setCustomUpiId(e.target.value)}
                      placeholder="e.g. user@upi"
                      className="h-11 bg-muted/50 border-border/60 focus:border-primary focus:ring-primary/20 font-mono text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Enter a valid UPI ID (e.g. name@okaxis, phone@ybl)
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pay Button */}
            <Button
              data-ocid="payment.pay_button"
              onClick={handlePay}
              disabled={!canPay}
              className="w-full h-14 font-bold text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-orange rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {canPay ? `Pay ₹${fare}` : "Select a Payment Method"}
            </Button>
          </motion.div>
        )}

        {screen === "processing" && (
          <motion.div
            key="processing"
            data-ocid="payment.processing_state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 flex flex-col items-center justify-center gap-6 text-center py-20"
          >
            {/* Animated pulse rings */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                transition={{
                  duration: 1.4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full bg-primary/20"
              />
              <motion.div
                animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                transition={{
                  duration: 1.4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: 0.3,
                }}
                className="absolute inset-0 rounded-full bg-primary/10"
              />
              <div className="relative w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                  className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary"
                />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Processing Payment...
              </h3>
              <p className="text-white/50 text-sm">
                Please don't close this screen
              </p>
              <p className="text-primary/80 text-xs mt-2 font-medium">
                ₹{fare} via {methodName}
              </p>
            </div>
          </motion.div>
        )}

        {screen === "success" && (
          <motion.div
            key="success"
            data-ocid="payment.success_state"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.35,
              ease: "easeOut",
              type: "spring",
              stiffness: 200,
            }}
            className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-12"
          >
            {/* Success checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.1,
                type: "spring",
                stiffness: 260,
                damping: 18,
              }}
              className="w-24 h-24 rounded-full bg-success/15 border-2 border-success/40 flex items-center justify-center mb-2"
            >
              <CheckCircle2 size={48} className="text-success" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h3 className="text-2xl font-black text-white mb-1">
                Payment Successful!
              </h3>
              <p className="text-success font-bold text-xl mb-4">
                ₹{fare} Paid
              </p>
            </motion.div>

            {/* Transaction details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="w-full max-w-xs rounded-2xl bg-card border border-border/50 p-5 space-y-3 text-left"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Amount</span>
                <span className="text-sm font-bold text-primary">₹{fare}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Via</span>
                <span className="text-sm font-semibold text-foreground truncate max-w-[160px]">
                  {methodName}
                </span>
              </div>
              <div className="border-t border-border/40 pt-2">
                <span className="text-[10px] text-muted-foreground block mb-0.5">
                  Transaction ID
                </span>
                <span className="text-xs font-mono text-white/70 break-all">
                  {txnId}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="w-full max-w-xs mt-2"
            >
              <Button
                data-ocid="payment.done_button"
                onClick={() => onSuccess(txnId, methodName)}
                className="w-full h-13 font-bold text-base bg-success hover:bg-success/90 text-white rounded-xl shadow-[0_4px_16px_rgba(0,200,100,0.3)]"
              >
                Done
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
