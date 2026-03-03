import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Bike,
  Car,
  CheckCircle,
  Download,
  MapPin,
  MessageSquare,
  Navigation,
  Receipt,
  Wallet,
} from "lucide-react";

import { motion } from "motion/react";
import type React from "react";

export interface RideBillProps {
  vehicleType: "Sports Car" | "Auto" | "Cab";
  pickup: string;
  drop: string;
  distanceKm: number;
  baseFare: number;
  extraKmFare: number;
  waitingCharge: number;
  totalFare: number;
  paymentMethod: "Cash" | "UPI" | "Wallet";
  transactionId?: string;
  rideDate: string;
  onDone: () => void;
}

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

function getVehicleIcon(
  vehicleType: string,
): React.ComponentType<{ size?: number; className?: string }> {
  if (vehicleType === "Sports Car") return Bike;
  if (vehicleType === "Auto") return AutoIcon;
  return Car;
}

function generateReceiptNumber(date: string): string {
  // Generate a pseudo-deterministic receipt number from date string
  const hash = date.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const num = (hash * 31337 + Date.now()) % 99999;
  return `RG-2026-${String(Math.abs(num)).padStart(5, "0")}`;
}

function PaymentMethodBadge({ method }: { method: "Cash" | "UPI" | "Wallet" }) {
  if (method === "UPI") {
    return (
      <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-semibold">
        UPI
      </Badge>
    );
  }
  if (method === "Wallet") {
    return (
      <Badge className="bg-success/15 text-success border-success/30 text-xs font-semibold">
        <Wallet size={10} className="mr-1" />
        Wallet
      </Badge>
    );
  }
  return (
    <Badge className="bg-muted text-muted-foreground border-border text-xs font-semibold">
      Cash
    </Badge>
  );
}

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function RideBill({
  vehicleType,
  pickup,
  drop,
  distanceKm,
  baseFare,
  extraKmFare,
  waitingCharge,
  totalFare,
  paymentMethod,
  transactionId,
  rideDate,
  onDone,
}: RideBillProps) {
  const VehicleIcon = getVehicleIcon(vehicleType);
  const receiptNumber = generateReceiptNumber(rideDate);
  const subtotal = baseFare + extraKmFare + waitingCharge;
  const commissionNote = `₹${Math.round(distanceKm)} (₹1/km × ${distanceKm} km)`;

  // Determine per-km rate label
  let perKmRate = 5;
  if (vehicleType === "Auto") perKmRate = 6;
  if (vehicleType === "Cab") perKmRate = 10;

  const extraKm = Math.max(0, distanceKm - 1);

  function handleDownloadPdf() {
    document
      .querySelector("[data-printable-bill]")
      ?.classList.add("printable-bill");
    window.print();
    // Remove class after print dialog closes
    setTimeout(() => {
      document
        .querySelector("[data-printable-bill]")
        ?.classList.remove("printable-bill");
    }, 1000);
  }

  function handleShareWhatsApp() {
    const lines: string[] = [
      "🧾 *RideGo Receipt*",
      `Receipt No: ${receiptNumber}`,
      `Date: ${rideDate}`,
      "",
      "📍 *Route*",
      `From: ${pickup}`,
      `To: ${drop}`,
      `Distance: ${distanceKm} km`,
      "",
      "💰 *Fare Breakdown*",
      `Base fare (first 1 km): ₹${baseFare}`,
    ];
    if (extraKm > 0) {
      lines.push(
        `Extra distance (${extraKm.toFixed(1)} km × ₹${perKmRate}/km): ₹${extraKmFare}`,
      );
    }
    if (waitingCharge > 0) {
      lines.push(`Waiting charges: ₹${waitingCharge}`);
    }
    lines.push(`*Total: ₹${totalFare}*`);
    lines.push("");
    lines.push(`💳 Payment: ${paymentMethod}`);
    if (transactionId) lines.push(`Txn ID: ${transactionId}`);
    lines.push("");
    lines.push("_Powered by RideGo_");

    const text = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function handleShareSMS() {
    const lines: string[] = [
      "RideGo Receipt",
      `Receipt No: ${receiptNumber}`,
      `Date: ${rideDate}`,
      "",
      "Route",
      `From: ${pickup}`,
      `To: ${drop}`,
      `Distance: ${distanceKm} km`,
      "",
      "Fare Breakdown",
      `Base fare (first 1 km): Rs.${baseFare}`,
    ];
    if (extraKm > 0) {
      lines.push(
        `Extra distance (${extraKm.toFixed(1)} km x Rs.${perKmRate}/km): Rs.${extraKmFare}`,
      );
    }
    if (waitingCharge > 0) {
      lines.push(`Waiting charges: Rs.${waitingCharge}`);
    }
    lines.push(`Total: Rs.${totalFare}`);
    lines.push("");
    lines.push(`Payment: ${paymentMethod}`);
    if (transactionId) lines.push(`Txn ID: ${transactionId}`);
    lines.push("");
    lines.push("Powered by RideGo");

    const body = encodeURIComponent(lines.join("\n"));
    window.open(`sms:?body=${body}`, "_self");
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 16 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      data-ocid="ride_bill.panel"
      data-printable-bill
      className="pb-28 space-y-4 view-transition"
    >
      {/* Receipt Header Card */}
      <Card className="shadow-card border-border/50 overflow-hidden">
        {/* Dashed top border accent */}
        <div className="h-1.5 bg-gradient-to-r from-primary/80 via-primary to-primary/60" />
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                <Receipt size={20} className="text-success" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground leading-tight">
                  Ride Receipt
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {rideDate}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Receipt No.
              </p>
              <p className="text-xs font-mono font-bold text-primary">
                {receiptNumber}
              </p>
            </div>
          </div>

          <Separator className="mb-4" />

          {/* Route */}
          <div className="bg-muted/40 rounded-xl p-3 space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                <MapPin size={10} className="text-success" />
              </div>
              <span className="text-xs font-medium text-foreground truncate">
                {pickup}
              </span>
            </div>
            <div className="flex items-center gap-2 pl-1">
              <div className="w-3 flex justify-center">
                <div className="w-px h-4 bg-border" />
              </div>
              <div className="flex items-center gap-1.5 ml-1">
                <VehicleIcon size={12} className="text-primary" />
                <span className="text-[10px] text-muted-foreground font-medium">
                  {distanceKm} km
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
                <Navigation size={10} className="text-destructive" />
              </div>
              <span className="text-xs font-medium text-foreground truncate">
                {drop}
              </span>
            </div>
          </div>

          {/* Fare Breakdown */}
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">
              Fare Breakdown
            </p>

            {/* Base fare */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-foreground">
                Base fare (first 1 km)
              </span>
              <span className="text-sm font-semibold text-foreground">
                ₹{baseFare}
              </span>
            </div>

            {/* Extra distance */}
            {extraKm > 0 && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-foreground">
                  Extra distance ({extraKm.toFixed(1)} km × ₹{perKmRate}/km)
                </span>
                <span className="text-sm font-semibold text-foreground">
                  ₹{extraKmFare}
                </span>
              </div>
            )}

            {/* Waiting charges */}
            {waitingCharge > 0 && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-warning">Waiting charges</span>
                <span className="text-sm font-semibold text-warning">
                  +₹{waitingCharge}
                </span>
              </div>
            )}

            {/* Subtotal */}
            <div className="flex items-center justify-between py-1.5 border-t border-border/60 mt-1 pt-2.5">
              <span className="text-sm font-medium text-muted-foreground">
                Subtotal
              </span>
              <span className="text-sm font-semibold text-foreground">
                ₹{subtotal}
              </span>
            </div>

            {/* Commission note */}
            <div className="flex items-center justify-between py-1 rounded-lg bg-muted/40 px-2 -mx-2">
              <span className="text-[11px] text-muted-foreground italic">
                Platform commission (₹1/km)
              </span>
              <span className="text-[11px] text-muted-foreground italic">
                {commissionNote}
              </span>
            </div>

            {/* Dashed divider */}
            <div className="border-t-2 border-dashed border-border/60 mt-2 mb-1" />

            {/* Total */}
            <div className="flex items-center justify-between py-2">
              <span className="text-base font-bold text-foreground">Total</span>
              <span className="text-2xl font-black text-primary">
                ₹{totalFare}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Card */}
      <Card className="shadow-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">
                Payment Method
              </p>
              <PaymentMethodBadge method={paymentMethod} />
            </div>
            {paymentMethod === "UPI" && transactionId ? (
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">
                  Transaction ID
                </p>
                <p className="text-xs font-mono text-success font-semibold">
                  {transactionId}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-success" />
                <span className="text-xs text-success font-semibold">Paid</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Toll note */}
      <p className="text-[11px] text-muted-foreground text-center px-4">
        * Toll fees, if any, are charged separately and not included in this
        receipt.
      </p>

      {/* Action Buttons */}
      <div className="space-y-2 print-hide">
        <div className="grid grid-cols-2 gap-2">
          <Button
            data-ocid="ride_bill.download_pdf_button"
            variant="outline"
            onClick={handleDownloadPdf}
            className="h-11 text-sm font-semibold border-border hover:bg-muted rounded-xl flex items-center gap-2"
          >
            <Download size={15} />
            Download PDF
          </Button>
          <Button
            data-ocid="ride_bill.sms_share_button"
            onClick={handleShareSMS}
            className="h-11 text-sm font-semibold rounded-xl flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white border-0"
          >
            <MessageSquare size={15} />
            Share via SMS
          </Button>
        </div>
        <Button
          data-ocid="ride_bill.whatsapp_share_button"
          onClick={handleShareWhatsApp}
          className="w-full h-11 text-sm font-semibold rounded-xl flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white border-0"
        >
          <WhatsAppIcon size={15} />
          Share via WhatsApp
        </Button>
      </div>

      {/* Done Button */}
      <Button
        data-ocid="ride_bill.done_button"
        onClick={onDone}
        className="w-full h-13 text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-orange rounded-xl print-hide"
      >
        <CheckCircle size={18} className="mr-2" />
        Done
      </Button>
    </motion.div>
  );
}
