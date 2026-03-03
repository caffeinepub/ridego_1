import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BanknoteIcon,
  Car,
  DollarSign,
  Download,
  IndianRupee,
  LogOut,
  Shield,
  Star,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface AdminPanelProps {
  onLogout: () => void;
}

// ---- Mock data ----

interface RiderData {
  id: number;
  name: string;
  phone: string;
  rides: number;
  status: "Active" | "Blocked";
}

interface DriverData {
  id: number;
  name: string;
  phone: string;
  vehicle: "Sports Car" | "Auto" | "Cab";
  rides: number;
  netEarnings: number;
  avgRating: number;
  status: "Active" | "Blocked" | "Restricted";
}

interface RideData {
  id: string;
  date: string;
  rider: string;
  driver: string;
  vehicle: "Sports Car" | "Auto" | "Cab";
  fare: number;
  payment: "Cash" | "UPI" | "Wallet";
  status: "Completed" | "Cancelled";
}

interface CommissionData {
  driver: string;
  vehicle: "Sports Car" | "Auto" | "Cab";
  trips: number;
  grossEarnings: number;
  commissionPerKm: number;
  totalDistanceKm: number;
  netPaid: number;
}

const MOCK_RIDERS: RiderData[] = [
  {
    id: 1,
    name: "Arjun Sharma",
    phone: "98765 43210",
    rides: 34,
    status: "Active",
  },
  {
    id: 2,
    name: "Priya Patel",
    phone: "87654 32109",
    rides: 18,
    status: "Active",
  },
  {
    id: 3,
    name: "Rahul Nair",
    phone: "76543 21098",
    rides: 7,
    status: "Blocked",
  },
  {
    id: 4,
    name: "Deepika Menon",
    phone: "65432 10987",
    rides: 22,
    status: "Active",
  },
  {
    id: 5,
    name: "Vivek Raju",
    phone: "54321 09876",
    rides: 11,
    status: "Active",
  },
  {
    id: 6,
    name: "Anita Reddy",
    phone: "43210 98765",
    rides: 3,
    status: "Blocked",
  },
];

const MOCK_DRIVERS: DriverData[] = [
  {
    id: 1,
    name: "Suresh Kumar",
    phone: "87654 32101",
    vehicle: "Sports Car",
    rides: 48,
    netEarnings: 8640,
    avgRating: 4.8,
    status: "Active",
  },
  {
    id: 2,
    name: "Ravi Shankar",
    phone: "76543 21012",
    vehicle: "Auto",
    rides: 62,
    netEarnings: 6820,
    avgRating: 4.5,
    status: "Active",
  },
  {
    id: 3,
    name: "Mohan Das",
    phone: "65432 10923",
    vehicle: "Cab",
    rides: 29,
    netEarnings: 12050,
    avgRating: 1.8,
    status: "Restricted",
  },
  {
    id: 4,
    name: "Ajay Pillai",
    phone: "54321 09834",
    vehicle: "Sports Car",
    rides: 14,
    netEarnings: 2520,
    avgRating: 4.2,
    status: "Active",
  },
  {
    id: 5,
    name: "Kiran Bhat",
    phone: "43210 98745",
    vehicle: "Auto",
    rides: 31,
    netEarnings: 3410,
    avgRating: 3.9,
    status: "Active",
  },
  {
    id: 6,
    name: "Naveen Kumar",
    phone: "32109 87656",
    vehicle: "Cab",
    rides: 8,
    netEarnings: 3200,
    avgRating: 4.1,
    status: "Blocked",
  },
];

const MOCK_RIDES: RideData[] = [
  {
    id: "RG-1001",
    date: "Today, 10:30 AM",
    rider: "Arjun Sharma",
    driver: "Suresh Kumar",
    vehicle: "Sports Car",
    fare: 85,
    payment: "UPI",
    status: "Completed",
  },
  {
    id: "RG-1002",
    date: "Today, 9:15 AM",
    rider: "Priya Patel",
    driver: "Ravi Shankar",
    vehicle: "Auto",
    fare: 48,
    payment: "Cash",
    status: "Completed",
  },
  {
    id: "RG-1003",
    date: "Today, 8:45 AM",
    rider: "Vivek Raju",
    driver: "Ajay Pillai",
    vehicle: "Sports Car",
    fare: 70,
    payment: "Wallet",
    status: "Cancelled",
  },
  {
    id: "RG-1004",
    date: "Yesterday, 7:20 PM",
    rider: "Deepika Menon",
    driver: "Mohan Das",
    vehicle: "Cab",
    fare: 130,
    payment: "UPI",
    status: "Completed",
  },
  {
    id: "RG-1005",
    date: "Yesterday, 5:10 PM",
    rider: "Anita Reddy",
    driver: "Kiran Bhat",
    vehicle: "Auto",
    fare: 36,
    payment: "Cash",
    status: "Completed",
  },
  {
    id: "RG-1006",
    date: "Yesterday, 3:40 PM",
    rider: "Rahul Nair",
    driver: "Suresh Kumar",
    vehicle: "Sports Car",
    fare: 95,
    payment: "UPI",
    status: "Cancelled",
  },
  {
    id: "RG-1007",
    date: "2 days ago",
    rider: "Priya Patel",
    driver: "Naveen Kumar",
    vehicle: "Cab",
    fare: 115,
    payment: "Cash",
    status: "Completed",
  },
  {
    id: "RG-1008",
    date: "2 days ago",
    rider: "Arjun Sharma",
    driver: "Ravi Shankar",
    vehicle: "Auto",
    fare: 54,
    payment: "Wallet",
    status: "Completed",
  },
  {
    id: "RG-1009",
    date: "3 days ago",
    rider: "Vivek Raju",
    driver: "Mohan Das",
    vehicle: "Cab",
    fare: 160,
    payment: "UPI",
    status: "Completed",
  },
  {
    id: "RG-1010",
    date: "3 days ago",
    rider: "Deepika Menon",
    driver: "Ajay Pillai",
    vehicle: "Sports Car",
    fare: 60,
    payment: "Cash",
    status: "Cancelled",
  },
];

const MOCK_COMMISSION: CommissionData[] = [
  {
    driver: "Suresh Kumar",
    vehicle: "Sports Car",
    trips: 48,
    grossEarnings: 9120,
    commissionPerKm: 1,
    totalDistanceKm: 480,
    netPaid: 8640,
  },
  {
    driver: "Ravi Shankar",
    vehicle: "Auto",
    trips: 62,
    grossEarnings: 7440,
    commissionPerKm: 1,
    totalDistanceKm: 620,
    netPaid: 6820,
  },
  {
    driver: "Mohan Das",
    vehicle: "Cab",
    trips: 29,
    grossEarnings: 12920,
    commissionPerKm: 1,
    totalDistanceKm: 290,
    netPaid: 12050,
  },
  {
    driver: "Ajay Pillai",
    vehicle: "Sports Car",
    trips: 14,
    grossEarnings: 2660,
    commissionPerKm: 1,
    totalDistanceKm: 140,
    netPaid: 2520,
  },
  {
    driver: "Kiran Bhat",
    vehicle: "Auto",
    trips: 31,
    grossEarnings: 3720,
    commissionPerKm: 1,
    totalDistanceKm: 310,
    netPaid: 3410,
  },
  {
    driver: "Naveen Kumar",
    vehicle: "Cab",
    trips: 8,
    grossEarnings: 3480,
    commissionPerKm: 1,
    totalDistanceKm: 80,
    netPaid: 3200,
  },
];

// ---- Sub-components ----

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  bgColor,
  index,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bg-card border-white/10">
        <CardContent className="pt-4 pb-4 px-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-white/50 text-xs font-medium mb-1">{label}</p>
              <p className="text-2xl font-black text-white">{value}</p>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgColor}`}
            >
              <Icon size={18} className={iconColor} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Active" || status === "Completed") {
    return (
      <Badge className="bg-success/20 text-success border-success/30 text-xs">
        {status}
      </Badge>
    );
  }
  if (status === "Blocked" || status === "Cancelled") {
    return (
      <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">
        {status}
      </Badge>
    );
  }
  if (status === "Restricted") {
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
        {status}
      </Badge>
    );
  }
  return <Badge variant="outline">{status}</Badge>;
}

function VehicleBadge({ vehicle }: { vehicle: "Sports Car" | "Auto" | "Cab" }) {
  const colors: Record<string, string> = {
    "Sports Car": "bg-primary/15 text-primary border-primary/30",
    Auto: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    Cab: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };
  return (
    <Badge
      variant="outline"
      className={`text-xs ${colors[vehicle] ?? "bg-white/10 text-white/60 border-white/20"}`}
    >
      {vehicle}
    </Badge>
  );
}

// ---- Tab panels ----

function DashboardTab() {
  const stats = [
    {
      label: "Total Rides",
      value: 156,
      icon: Car,
      iconColor: "text-primary",
      bgColor: "bg-primary/15",
    },
    {
      label: "Active Riders",
      value: 34,
      icon: Users,
      iconColor: "text-blue-400",
      bgColor: "bg-blue-500/15",
    },
    {
      label: "Active Drivers",
      value: 18,
      icon: TrendingUp,
      iconColor: "text-green-400",
      bgColor: "bg-green-500/15",
    },
    {
      label: "Total Earnings",
      value: "₹45,820",
      icon: IndianRupee,
      iconColor: "text-yellow-400",
      bgColor: "bg-yellow-500/15",
    },
    {
      label: "Commission Collected",
      value: "₹4,582",
      icon: DollarSign,
      iconColor: "text-emerald-400",
      bgColor: "bg-emerald-500/15",
    },
    {
      label: "Cancelled Rides",
      value: 12,
      icon: XCircle,
      iconColor: "text-red-400",
      bgColor: "bg-red-500/15",
    },
  ];

  return (
    <div data-ocid="admin.dashboard.section">
      <h2 className="text-white font-bold text-base mb-4">Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} index={i} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold">
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Sports Car rides", amount: 18240, pct: 40 },
              { label: "Auto rides", amount: 16380, pct: 36 },
              { label: "Cab rides", amount: 11200, pct: 24 },
            ].map(({ label, amount, pct }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">{label}</span>
                  <span className="text-white font-medium">
                    ₹{amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold">
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "UPI", amount: 21940, pct: 48, color: "bg-green-400" },
              { label: "Cash", amount: 14620, pct: 32, color: "bg-yellow-400" },
              { label: "Wallet", amount: 9260, pct: 20, color: "bg-blue-400" },
            ].map(({ label, amount, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">{label}</span>
                  <span className="text-white font-medium">
                    ₹{amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className={`h-full ${color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RidersTab() {
  const [riders, setRiders] = useState<RiderData[]>(MOCK_RIDERS);

  const toggleBlock = (id: number) => {
    setRiders((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === "Active" ? "Blocked" : "Active" }
          : r,
      ),
    );
  };

  return (
    <div data-ocid="admin.riders.section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-base">Riders</h2>
        <Badge className="bg-white/10 text-white/60 border-white/20 text-xs">
          {riders.length} total
        </Badge>
      </div>
      <Card className="bg-card border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50 text-xs font-semibold">
                  Name
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold">
                  Phone
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold text-center">
                  Rides
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold">
                  Status
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riders.map((rider, i) => (
                <TableRow
                  key={rider.id}
                  data-ocid={`admin.riders.row.${i + 1}`}
                  className="border-white/5 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="text-white text-sm font-medium py-3">
                    {rider.name}
                  </TableCell>
                  <TableCell className="text-white/60 text-xs py-3">
                    {rider.phone}
                  </TableCell>
                  <TableCell className="text-white/80 text-sm text-center py-3 font-semibold">
                    {rider.rides}
                  </TableCell>
                  <TableCell className="py-3">
                    <StatusBadge status={rider.status} />
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <Button
                      data-ocid={`admin.riders.toggle.${i + 1}`}
                      size="sm"
                      variant="outline"
                      onClick={() => toggleBlock(rider.id)}
                      className={`text-xs h-7 px-3 ${
                        rider.status === "Active"
                          ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                          : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                      }`}
                    >
                      {rider.status === "Active" ? "Block" : "Unblock"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function DriversTab() {
  const [drivers, setDrivers] = useState<DriverData[]>(MOCK_DRIVERS);

  const toggleBlock = (id: number) => {
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status:
                d.status === "Active" || d.status === "Restricted"
                  ? "Blocked"
                  : "Active",
            }
          : d,
      ),
    );
  };

  return (
    <div data-ocid="admin.drivers.section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-base">Drivers</h2>
        <Badge className="bg-white/10 text-white/60 border-white/20 text-xs">
          {drivers.length} total
        </Badge>
      </div>
      <Card className="bg-card border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50 text-xs font-semibold">
                  Name
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold">
                  Vehicle
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold text-center">
                  Rides
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold text-right">
                  Net Earnings
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold text-center">
                  Rating
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold">
                  Status
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver, i) => (
                <TableRow
                  key={driver.id}
                  data-ocid={`admin.drivers.row.${i + 1}`}
                  className="border-white/5 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="py-3">
                    <div>
                      <p className="text-white text-sm font-medium">
                        {driver.name}
                      </p>
                      <p className="text-white/40 text-xs">{driver.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <VehicleBadge vehicle={driver.vehicle} />
                  </TableCell>
                  <TableCell className="text-white/80 text-sm text-center py-3 font-semibold">
                    {driver.rides}
                  </TableCell>
                  <TableCell className="text-white text-sm text-right py-3 font-semibold">
                    ₹{driver.netEarnings.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Star
                        size={12}
                        className="text-yellow-400 fill-yellow-400"
                      />
                      <span className="text-white/80 text-xs">
                        {driver.avgRating.toFixed(1)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <StatusBadge status={driver.status} />
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <Button
                      data-ocid={`admin.drivers.toggle.${i + 1}`}
                      size="sm"
                      variant="outline"
                      onClick={() => toggleBlock(driver.id)}
                      className={`text-xs h-7 px-3 ${
                        driver.status === "Blocked"
                          ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                          : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                      }`}
                    >
                      {driver.status === "Blocked" ? "Unblock" : "Block"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

type RideFilter = "All" | "Completed" | "Cancelled";

function RidesTab() {
  const [filter, setFilter] = useState<RideFilter>("All");

  const filteredRides =
    filter === "All"
      ? MOCK_RIDES
      : MOCK_RIDES.filter((r) => r.status === filter);

  return (
    <div data-ocid="admin.rides.section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-base">All Rides</h2>
        <Badge className="bg-white/10 text-white/60 border-white/20 text-xs">
          {filteredRides.length} rides
        </Badge>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-4">
        {(["All", "Completed", "Cancelled"] as RideFilter[]).map((f) => (
          <Button
            key={f}
            data-ocid={`admin.rides.filter.${f.toLowerCase()}`}
            size="sm"
            onClick={() => setFilter(f)}
            variant={filter === f ? "default" : "outline"}
            className={`text-xs h-8 px-3 ${
              filter === f
                ? "bg-primary text-white border-primary"
                : "border-white/15 text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            {f}
          </Button>
        ))}
      </div>

      <Card className="bg-card border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50 text-xs font-semibold">
                  ID
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold">
                  Date
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold">
                  Rider
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold">
                  Driver
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold">
                  Vehicle
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold text-right">
                  Fare
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold">
                  Payment
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRides.map((ride, i) => (
                <TableRow
                  key={ride.id}
                  data-ocid={`admin.rides.row.${i + 1}`}
                  className="border-white/5 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="text-white/60 text-xs py-3 font-mono">
                    {ride.id}
                  </TableCell>
                  <TableCell className="text-white/60 text-xs py-3 whitespace-nowrap">
                    {ride.date}
                  </TableCell>
                  <TableCell className="text-white text-sm py-3">
                    {ride.rider}
                  </TableCell>
                  <TableCell className="text-white/80 text-sm py-3">
                    {ride.driver}
                  </TableCell>
                  <TableCell className="py-3">
                    <VehicleBadge vehicle={ride.vehicle} />
                  </TableCell>
                  <TableCell className="text-white text-sm text-right py-3 font-semibold">
                    ₹{ride.fare}
                  </TableCell>
                  <TableCell className="text-white/60 text-xs py-3">
                    {ride.payment}
                  </TableCell>
                  <TableCell className="py-3">
                    <StatusBadge status={ride.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function CommissionTab() {
  const totals = MOCK_COMMISSION.reduce(
    (acc, row) => ({
      trips: acc.trips + row.trips,
      grossEarnings: acc.grossEarnings + row.grossEarnings,
      commission: acc.commission + (row.grossEarnings - row.netPaid),
      netPaid: acc.netPaid + row.netPaid,
    }),
    { trips: 0, grossEarnings: 0, commission: 0, netPaid: 0 },
  );

  const handleExportCSV = () => {
    const headers = [
      "Driver",
      "Vehicle",
      "Trips",
      "Gross Earnings (₹)",
      "Commission (₹)",
      "Net Paid (₹)",
    ];
    const rows = MOCK_COMMISSION.map((row) => [
      row.driver,
      row.vehicle,
      row.trips,
      row.grossEarnings,
      row.grossEarnings - row.netPaid,
      row.netPaid,
    ]);
    const totalRow = [
      "TOTAL",
      "",
      totals.trips,
      totals.grossEarnings,
      totals.commission,
      totals.netPaid,
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
      totalRow.join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ridego-commission-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div data-ocid="admin.commission.section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-base">Commission Summary</h2>
        <Button
          data-ocid="admin.commission.export_button"
          size="sm"
          onClick={handleExportCSV}
          className="text-xs h-8 px-3 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
          variant="outline"
        >
          <Download size={13} className="mr-1.5" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="bg-card border-white/10">
          <CardContent className="pt-3 pb-3 px-3 text-center">
            <p className="text-white/50 text-[10px] uppercase tracking-wide mb-1">
              Total Trips
            </p>
            <p className="text-white font-black text-xl">{totals.trips}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-white/10">
          <CardContent className="pt-3 pb-3 px-3 text-center">
            <p className="text-white/50 text-[10px] uppercase tracking-wide mb-1">
              Gross
            </p>
            <p className="text-primary font-black text-lg">
              ₹{totals.grossEarnings.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-3 pb-3 px-3 text-center">
            <p className="text-emerald-400/70 text-[10px] uppercase tracking-wide mb-1">
              Commission
            </p>
            <p className="text-emerald-400 font-black text-lg">
              ₹{totals.commission.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50 text-xs font-semibold">
                  Driver
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold">
                  Vehicle
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold text-center">
                  Trips
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold text-right">
                  Gross
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold text-right">
                  Commission
                </TableHead>
                <TableHead className="text-white/50 text-xs font-semibold text-right">
                  Net Paid
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_COMMISSION.map((row, i) => (
                <TableRow
                  key={row.driver}
                  data-ocid={`admin.commission.row.${i + 1}`}
                  className="border-white/5 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="text-white text-sm font-medium py-3">
                    {row.driver}
                  </TableCell>
                  <TableCell className="py-3">
                    <VehicleBadge vehicle={row.vehicle} />
                  </TableCell>
                  <TableCell className="text-white/80 text-sm text-center py-3 font-semibold">
                    {row.trips}
                  </TableCell>
                  <TableCell className="text-white/80 text-sm text-right py-3">
                    ₹{row.grossEarnings.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-emerald-400 text-sm text-right py-3 font-semibold">
                    ₹{(row.grossEarnings - row.netPaid).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-white text-sm text-right py-3 font-bold">
                    ₹{row.netPaid.toLocaleString("en-IN")}
                  </TableCell>
                </TableRow>
              ))}

              {/* Total row */}
              <TableRow className="border-t border-primary/30 bg-primary/5 hover:bg-primary/10">
                <TableCell className="text-primary text-sm font-black py-3">
                  TOTAL
                </TableCell>
                <TableCell className="py-3" />
                <TableCell className="text-primary text-sm text-center py-3 font-black">
                  {totals.trips}
                </TableCell>
                <TableCell className="text-primary text-sm text-right py-3 font-black">
                  ₹{totals.grossEarnings.toLocaleString("en-IN")}
                </TableCell>
                <TableCell className="text-emerald-400 text-sm text-right py-3 font-black">
                  ₹{totals.commission.toLocaleString("en-IN")}
                </TableCell>
                <TableCell className="text-primary text-sm text-right py-3 font-black">
                  ₹{totals.netPaid.toLocaleString("en-IN")}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ---- Main AdminPanel ----

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-shell border-b border-white/10 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
        <div className="flex items-center h-14 px-4 gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield size={14} className="text-primary" />
            </div>
            <span className="font-black text-white text-lg leading-none tracking-tight">
              Ride<span className="text-primary">Go</span>
            </span>
          </div>

          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-bold ml-1">
            Admin Panel
          </Badge>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-white/40 text-xs hidden sm:block">admin</span>
            <Button
              data-ocid="admin.logout_button"
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-white/50 hover:text-white hover:bg-white/10 gap-1.5 text-xs"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Tabs defaultValue="dashboard">
              <TabsList
                data-ocid="admin.tabs"
                className="bg-white/5 border border-white/10 mb-6 flex-wrap h-auto p-1 gap-1"
              >
                <TabsTrigger
                  data-ocid="admin.dashboard.tab"
                  value="dashboard"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white text-white/50 text-xs px-3 py-2"
                >
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  data-ocid="admin.riders.tab"
                  value="riders"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white text-white/50 text-xs px-3 py-2"
                >
                  Riders
                </TabsTrigger>
                <TabsTrigger
                  data-ocid="admin.drivers.tab"
                  value="drivers"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white text-white/50 text-xs px-3 py-2"
                >
                  Drivers
                </TabsTrigger>
                <TabsTrigger
                  data-ocid="admin.rides.tab"
                  value="rides"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white text-white/50 text-xs px-3 py-2"
                >
                  Rides
                </TabsTrigger>
                <TabsTrigger
                  data-ocid="admin.commission.tab"
                  value="commission"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white text-white/50 text-xs px-3 py-2"
                >
                  Commission
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard">
                <DashboardTab />
              </TabsContent>
              <TabsContent value="riders">
                <RidersTab />
              </TabsContent>
              <TabsContent value="drivers">
                <DriversTab />
              </TabsContent>
              <TabsContent value="rides">
                <RidesTab />
              </TabsContent>
              <TabsContent value="commission">
                <CommissionTab />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-3 px-4">
        <p className="text-white/20 text-[10px] text-center">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/40 hover:text-primary/70 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
