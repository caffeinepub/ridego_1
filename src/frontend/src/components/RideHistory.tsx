import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Car,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Download,
  MapPin,
  Navigation,
  Printer,
  Receipt,
  Search,
  Star,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
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

type PaymentFilter = "All" | "Cash" | "UPI" | "Wallet";
type StatusFilter = "All" | "Completed" | "Cancelled";
type DateFilter = "All" | "Today" | "Yesterday" | "This Week";

export default function RideHistory({
  rideHistory,
  userRole,
}: RideHistoryProps) {
  const [expandedRideId, setExpandedRideId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All");

  const paymentOptions: PaymentFilter[] = ["All", "Cash", "UPI", "Wallet"];
  const statusOptions: StatusFilter[] = ["All", "Completed", "Cancelled"];
  const dateOptions: DateFilter[] = ["All", "Today", "Yesterday", "This Week"];

  // Filtered rides
  const filteredRides = useMemo(() => {
    return rideHistory.filter((ride) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          ride.pickup.toLowerCase().includes(q) ||
          ride.drop.toLowerCase().includes(q) ||
          ride.vehicleType.toLowerCase().includes(q) ||
          String(ride.fare).includes(q);
        if (!matches) return false;
      }

      // Payment filter
      if (paymentFilter !== "All") {
        const method =
          ride.billDetails?.paymentMethod ?? ride.paymentMethod ?? "Cash";
        if (method !== paymentFilter) return false;
      }

      // Status filter
      if (statusFilter !== "All") {
        if (ride.status !== statusFilter) return false;
      }

      // Date filter
      if (dateFilter !== "All") {
        const d = ride.date?.toLowerCase() ?? "";
        if (
          dateFilter === "Today" &&
          !d.includes("today") &&
          !d.includes("just now")
        )
          return false;
        if (dateFilter === "Yesterday" && !d.includes("yesterday"))
          return false;
        if (dateFilter === "This Week") {
          const isRecent =
            d.includes("today") ||
            d.includes("just now") ||
            d.includes("yesterday") ||
            d.includes("days ago") ||
            d.includes("hour");
          if (!isRecent) return false;
        }
      }

      return true;
    });
  }, [rideHistory, searchQuery, paymentFilter, statusFilter, dateFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    paymentFilter !== "All" ||
    statusFilter !== "All" ||
    dateFilter !== "All";

  const clearFilters = () => {
    setSearchQuery("");
    setPaymentFilter("All");
    setStatusFilter("All");
    setDateFilter("All");
  };

  const completedCount = filteredRides.filter(
    (r) => r.status === "Completed",
  ).length;
  const cancelledCount = filteredRides.filter(
    (r) => r.status === "Cancelled",
  ).length;
  const totalSpent = filteredRides
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

  // ── Export helpers ──────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const today = new Date().toISOString().slice(0, 10);
    const headers = [
      "Ride#",
      "Date",
      "Vehicle",
      "Pickup",
      "Drop",
      "Distance(km)",
      "Fare(₹)",
      "Payment",
      "Status",
    ];
    const csvEscape = (val: string | number) => {
      const s = String(val);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const rows = filteredRides.map((ride) =>
      [
        ride.id,
        ride.date,
        ride.vehicleType,
        ride.pickup,
        ride.drop,
        ride.billDetails?.distanceKm ?? "-",
        ride.fare,
        ride.billDetails?.paymentMethod ?? ride.paymentMethod ?? "Cash",
        ride.status,
      ]
        .map(csvEscape)
        .join(","),
    );
    const csv = [headers.map(csvEscape).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ridego-history-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = filteredRides
      .map(
        (ride) => `
        <tr>
          <td>${ride.id}</td>
          <td>${ride.date ?? "-"}</td>
          <td>${ride.vehicleType}</td>
          <td>${ride.pickup}</td>
          <td>${ride.drop}</td>
          <td>${ride.billDetails?.distanceKm ?? "-"}</td>
          <td>₹${ride.fare}</td>
          <td>${ride.billDetails?.paymentMethod ?? ride.paymentMethod ?? "Cash"}</td>
          <td class="status-${ride.status.toLowerCase().replace(" ", "-")}">${ride.status}</td>
        </tr>`,
      )
      .join("");
    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>RideGo – Ride History</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; padding: 32px; }
    header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; border-bottom: 2px solid #f97316; padding-bottom: 16px; }
    .logo { width: 40px; height: 40px; background: #f97316; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .logo span { color: #fff; font-weight: 900; font-size: 18px; }
    h1 { font-size: 22px; font-weight: 800; color: #111; }
    .subtitle { font-size: 12px; color: #888; margin-top: 2px; }
    .meta { font-size: 11px; color: #aaa; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead { background: #f97316; color: #fff; }
    thead th { padding: 9px 10px; text-align: left; font-weight: 700; }
    tbody tr:nth-child(even) { background: #fafafa; }
    tbody td { padding: 8px 10px; border-bottom: 1px solid #eee; }
    .status-completed { color: #16a34a; font-weight: 700; }
    .status-cancelled { color: #dc2626; font-weight: 700; }
    .status-in-progress { color: #f97316; font-weight: 700; }
    footer { margin-top: 24px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <header>
    <div class="logo"><span>R</span></div>
    <div>
      <h1>RideGo</h1>
      <div class="subtitle">Ride History Export</div>
    </div>
  </header>
  <p class="meta">Exported on ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })} · ${filteredRides.length} ride${filteredRides.length !== 1 ? "s" : ""}</p>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Date</th><th>Vehicle</th><th>Pickup</th><th>Drop</th>
        <th>Dist (km)</th><th>Fare</th><th>Payment</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <footer>Generated by RideGo · caffeine.ai</footer>
  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`);
    win.document.close();
  };

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

      {/* Filter Panel */}
      {rideHistory.length > 0 && (
        <Card className="shadow-xs border-border/50">
          <CardContent className="p-3 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                data-ocid="history.search_input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by location or vehicle..."
                className="pl-9 h-9 text-xs bg-muted/50 border-border/60 focus:border-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Date filter chips */}
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1.5">
                Date
              </p>
              <div className="flex flex-wrap gap-1.5">
                {dateOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    data-ocid={`history.date_filter.${opt.toLowerCase().replace(" ", "_")}`}
                    onClick={() => setDateFilter(opt)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                      dateFilter === opt
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment filter chips */}
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1.5">
                Payment
              </p>
              <div className="flex flex-wrap gap-1.5">
                {paymentOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    data-ocid={`history.payment_filter.${opt.toLowerCase()}`}
                    onClick={() => setPaymentFilter(opt)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                      paymentFilter === opt
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Status filter chips */}
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1.5">
                Status
              </p>
              <div className="flex flex-wrap gap-1.5">
                {statusOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    data-ocid={`history.status_filter.${opt.toLowerCase()}`}
                    onClick={() => setStatusFilter(opt)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                      statusFilter === opt
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button
                data-ocid="history.clear_filters_button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="w-full h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <X size={12} />
                Clear all filters
              </Button>
            )}

            {/* Export buttons — only when there are results */}
            {filteredRides.length > 0 && (
              <div className="border-t border-border/40 pt-2.5">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-2">
                  Export
                </p>
                <div className="flex gap-2">
                  <Button
                    data-ocid="history.export_csv_button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="flex-1 h-8 text-xs gap-1.5 border-border/60 bg-muted/30 hover:bg-muted/60 hover:text-foreground text-muted-foreground"
                  >
                    <Download size={12} />
                    Export CSV
                  </Button>
                  <Button
                    data-ocid="history.export_pdf_button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportPDF}
                    className="flex-1 h-8 text-xs gap-1.5 border-border/60 bg-muted/30 hover:bg-muted/60 hover:text-foreground text-muted-foreground"
                  >
                    <Printer size={12} />
                    Export PDF
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ride List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-base text-foreground">
            {hasActiveFilters
              ? `Results (${filteredRides.length})`
              : "All Rides"}
          </h3>
          {hasActiveFilters && filteredRides.length !== rideHistory.length && (
            <span className="text-xs text-muted-foreground">
              of {rideHistory.length} total
            </span>
          )}
        </div>

        {filteredRides.length === 0 ? (
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
                {hasActiveFilters ? "No matching rides" : "No rides yet"}
              </h4>
              <p className="text-muted-foreground text-sm">
                {hasActiveFilters
                  ? "Try adjusting your filters to find rides."
                  : "Your completed rides will appear here."}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 text-xs text-primary font-semibold hover:underline"
                >
                  Clear filters
                </button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredRides.map((ride, idx) => {
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
