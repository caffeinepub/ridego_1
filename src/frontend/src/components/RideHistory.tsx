import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Car,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  MapPin,
  Navigation,
  Receipt,
  Star,
  Wallet,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { RideHistoryEntry } from "../App";

interface RideHistoryProps {
  rideHistory: RideHistoryEntry[];
  userRole?: "rider" | "driver";
}

const STATUS_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    className: string;
    label: string;
  }
> = {
  Completed: {
    icon: CheckCircle,
    className: "bg-success/10 text-success border-success/20",
    label: "Completed",
  },
  Cancelled: {
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
    label: "Cancelled",
  },
  "In Progress": {
    icon: CheckCircle,
    className: "bg-primary/10 text-primary border-primary/20",
    label: "In Progress",
  },
};

function generateReceiptNumber(id: number): string {
  const num = (id * 31337) % 99999;
  return `RG-2026-${String(Math.abs(num)).padStart(5, "0")}`;
}

function PaymentBadge({
  method,
}: { method?: "Cash" | "UPI" | "Wallet" | string }) {
  if (method === "UPI") {
    return (
      <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-semibold px-1.5 py-0">
        UPI
      </Badge>
    );
  }
  if (method === "Wallet") {
    return (
      <Badge className="bg-success/15 text-success border-success/30 text-[10px] font-semibold px-1.5 py-0">
        <Wallet size={8} className="mr-1" />
        Wallet
      </Badge>
    );
  }
  return (
    <Badge className="bg-muted text-muted-foreground border-border text-[10px] font-semibold px-1.5 py-0">
      Cash
    </Badge>
  );
}

export default function RideHistory({
  rideHistory,
  userRole,
}: RideHistoryProps) {
  const [expandedRideId, setExpandedRideId] = useState<number | null>(null);

  const completedCount = rideHistory.filter(
    (r) => r.status === "Completed",
  ).length;
  const cancelledCount = rideHistory.filter(
    (r) => r.status === "Cancelled",
  ).length;
  const totalSpent = rideHistory
    .filter((r) => r.status === "Completed")
    .reduce((sum, r) => sum + r.fare, 0);

  const ratedEntries = rideHistory.filter(
    (r) => r.rating !== null && r.rating !== undefined,
  );
  const avgRating =
    ratedEntries.length > 0
      ? ratedEntries.reduce((sum, r) => sum + (r.rating ?? 0), 0) /
        ratedEntries.length
      : null;

  const showAvgRating = userRole === "driver" && ratedEntries.length > 0;

  return (
    <div className="pb-24 space-y-5 view-transition">
      {/* Summary Stats */}
      {rideHistory.length > 0 && (
        <div
          className={`grid gap-3 ${showAvgRating ? "grid-cols-4" : "grid-cols-3"}`}
        >
          <Card className="shadow-xs border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-base font-bold text-primary">
                {completedCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Completed
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-xs border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-base font-bold text-destructive">
                {cancelledCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Cancelled
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-xs border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-base font-bold text-success">₹{totalSpent}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {userRole === "driver" ? "Earned" : "Total Spent"}
              </p>
            </CardContent>
          </Card>
          {showAvgRating && avgRating !== null && (
            <Card
              data-ocid="history.avg_rating_card"
              className="shadow-xs border-border/50"
            >
              <CardContent className="p-3 text-center">
                <p className="text-base font-bold text-warning">
                  {avgRating.toFixed(1)} ★
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Avg Rating
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Ride List */}
      <div>
        <h3 className="font-semibold text-base text-foreground mb-3">
          All Rides
        </h3>

        {rideHistory.length === 0 ? (
          <Card
            data-ocid="history.empty_state"
            className="border-dashed border-border/60"
          >
            <CardContent className="p-10 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                <MapPin
                  size={28}
                  className="text-muted-foreground opacity-50"
                />
              </div>
              <h4 className="font-semibold text-foreground mb-1">
                No rides yet
              </h4>
              <p className="text-muted-foreground text-sm">
                Your completed rides will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rideHistory.map((ride, idx) => {
              const VehicleIcon = Car;
              const statusConfig = STATUS_CONFIG[ride.status];
              const StatusIcon = statusConfig?.icon ?? CheckCircle;
              const isExpanded = expandedRideId === ride.id;

              return (
                <Card
                  key={ride.id}
                  data-ocid={`history.ride.item.${idx + 1}`}
                  className="shadow-card border-border/50 hover:shadow-card-hover transition-shadow"
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <VehicleIcon size={14} className="text-primary" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-foreground">
                            {ride.vehicleType}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock size={9} className="text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">
                              {ride.date}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-primary">
                          ₹{ride.fare}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] border ${statusConfig?.className ?? ""}`}
                        >
                          <StatusIcon size={8} className="mr-1" />
                          {ride.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="bg-muted/50 rounded-lg p-2.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-success shrink-0" />
                        <span className="text-xs text-foreground font-medium truncate">
                          {ride.pickup}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pl-1.5">
                        <div className="w-px h-2.5 bg-border" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation
                          size={12}
                          className="text-destructive shrink-0"
                        />
                        <span className="text-xs text-foreground font-medium truncate">
                          {ride.drop}
                        </span>
                      </div>
                    </div>

                    {/* Rating */}
                    {ride.rating && (
                      <>
                        <Separator className="my-2" />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Driver rating
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={13}
                                className={
                                  star <= (ride.rating ?? 0)
                                    ? "text-warning fill-warning"
                                    : "text-muted-foreground/30"
                                }
                                fill={
                                  star <= (ride.rating ?? 0)
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Actions row */}
                    <div className="flex items-center gap-2 mt-2">
                      {/* View Bill button for completed rides */}
                      {ride.status === "Completed" && (
                        <button
                          type="button"
                          data-ocid={`history.ride.bill_button.${idx + 1}`}
                          onClick={() =>
                            setExpandedRideId(isExpanded ? null : ride.id)
                          }
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-primary font-semibold py-1.5 rounded-lg hover:bg-primary/8 transition-colors border border-primary/20"
                        >
                          <Receipt size={12} />
                          {isExpanded ? "Hide Bill" : "View Bill"}
                          {isExpanded ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          )}
                        </button>
                      )}

                      {/* Re-book button */}
                      {ride.status === "Completed" && (
                        <button
                          type="button"
                          className="flex-1 flex items-center justify-center gap-1 text-xs text-muted-foreground font-medium py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          Book again <ChevronRight size={12} />
                        </button>
                      )}
                    </div>

                    {/* Inline Bill Panel */}
                    <AnimatePresence>
                      {isExpanded && ride.status === "Completed" && (
                        <motion.div
                          key="bill-panel"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-border/60">
                            {/* Receipt header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Receipt size={13} className="text-primary" />
                                <span className="text-xs font-bold text-foreground">
                                  Ride Receipt
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {generateReceiptNumber(ride.id)}
                              </span>
                            </div>

                            {/* Bill breakdown */}
                            <div className="bg-muted/40 rounded-lg p-3 space-y-1.5">
                              {ride.billDetails ? (
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                      Base fare (1 km)
                                    </span>
                                    <span className="text-xs font-semibold text-foreground">
                                      ₹{ride.billDetails.baseFare}
                                    </span>
                                  </div>
                                  {ride.billDetails.extraKmFare > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-muted-foreground">
                                        Extra distance (
                                        {Math.max(
                                          0,
                                          ride.billDetails.distanceKm - 1,
                                        ).toFixed(1)}{" "}
                                        km)
                                      </span>
                                      <span className="text-xs font-semibold text-foreground">
                                        ₹{ride.billDetails.extraKmFare}
                                      </span>
                                    </div>
                                  )}
                                  {ride.billDetails.waitingCharge > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-warning">
                                        Waiting charges
                                      </span>
                                      <span className="text-xs font-semibold text-warning">
                                        +₹{ride.billDetails.waitingCharge}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
                                    <span className="text-xs font-bold text-foreground">
                                      Distance
                                    </span>
                                    <span className="text-xs font-semibold text-foreground">
                                      {ride.billDetails.distanceKm} km
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Ride fare
                                  </span>
                                  <span className="text-xs font-semibold text-foreground">
                                    ₹{ride.fare}
                                  </span>
                                </div>
                              )}

                              {/* Dashed divider */}
                              <div className="border-t border-dashed border-border/60 pt-1.5 mt-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-foreground">
                                    Total
                                  </span>
                                  <span className="text-sm font-black text-primary">
                                    ₹{ride.fare}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Payment method */}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-muted-foreground">
                                Payment
                              </span>
                              <PaymentBadge
                                method={
                                  ride.billDetails?.paymentMethod ??
                                  ride.paymentMethod ??
                                  "Cash"
                                }
                              />
                            </div>
                            {ride.billDetails?.transactionId && (
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] text-muted-foreground">
                                  Txn ID
                                </span>
                                <span className="text-[10px] font-mono text-success font-semibold">
                                  {ride.billDetails.transactionId}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
