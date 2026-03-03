import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useNotifications } from "@/hooks/useNotifications";
import {
  ArrowRight,
  Car,
  History,
  Home,
  LogOut,
  User,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AUTO_BASE_FARE,
  AUTO_PER_KM_RATE,
  CAB_BASE_FARE,
  CAB_PER_KM_RATE,
  SPORTSCAR_BASE_FARE,
  SPORTSCAR_PER_KM_RATE,
} from "./utils/fareUtils";

import ActiveRide from "./components/ActiveRide";
import DriverHome from "./components/DriverHome";
import type { AvailableRide } from "./components/DriverHome";
import DriverRatingModal from "./components/DriverRatingModal";
import NotificationCenter from "./components/NotificationCenter";
import ProfilePage from "./components/ProfilePage";
import RideBill from "./components/RideBill";
import type { RideBillProps } from "./components/RideBill";
import RideBooking from "./components/RideBooking";
import RideHistory from "./components/RideHistory";
import RiderHome from "./components/RiderHome";

// --- Types ---
export interface RideRequest {
  id: number;
  pickup: string;
  drop: string;
  vehicleType: "Sports Car" | "Auto" | "Cab";
  fare: number;
  status: string;
  distanceKm?: number;
}

export interface RideHistoryEntry {
  id: number;
  pickup: string;
  drop: string;
  vehicleType: "Sports Car" | "Auto" | "Cab";
  fare: number;
  status: "Completed" | "Cancelled" | "In Progress";
  rating: number | null;
  date: string;
  paymentMethod?: "Cash" | "UPI" | "Wallet";
  billDetails?: {
    distanceKm: number;
    baseFare: number;
    extraKmFare: number;
    waitingCharge: number;
    totalFare: number;
    paymentMethod: "Cash" | "UPI" | "Wallet";
    transactionId?: string;
  };
}

type View =
  | "home"
  | "rider-home"
  | "ride-booked"
  | "driver-home"
  | "driver-active"
  | "ride-history"
  | "profile";

type UserRole = "rider" | "driver" | null;
type VehicleType = "Sports Car" | "Auto" | "Cab";

// --- Mock seed ride history ---
const SEED_HISTORY: RideHistoryEntry[] = [
  {
    id: 101,
    pickup: "Koramangala",
    drop: "Indiranagar",
    vehicleType: "Sports Car",
    fare: 30,
    status: "Completed",
    rating: 5,
    date: "Today, 10:30 AM",
  },
  {
    id: 102,
    pickup: "HSR Layout",
    drop: "Silk Board",
    vehicleType: "Auto",
    fare: 50,
    status: "Completed",
    rating: 4,
    date: "Yesterday, 6:15 PM",
  },
  {
    id: 103,
    pickup: "Whitefield",
    drop: "Marathahalli",
    vehicleType: "Cab",
    fare: 80,
    status: "Cancelled",
    rating: null,
    date: "2 days ago",
  },
];

function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const { notifications, unreadCount, notify, markAllRead, clearAll } =
    useNotifications();

  const [currentView, setCurrentView] = useState<View>("home");
  const [userRole, setUserRole] = useState<UserRole>(() =>
    getFromStorage<UserRole>("ridego_role", null),
  );
  const [userName, setUserName] = useState<string>(() =>
    getFromStorage<string>("ridego_name", ""),
  );
  const [userPhone, setUserPhone] = useState<string>(() =>
    getFromStorage<string>("ridego_phone", ""),
  );
  const [driverVehicleType, setDriverVehicleType] =
    useState<VehicleType>("Sports Car");
  const [plateNumber] = useState<string>("KA 01 AB 1234");

  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleType>("Sports Car");
  const [currentRide, setCurrentRide] = useState<RideRequest | null>(null);
  const [activeDriverRide, setActiveDriverRide] =
    useState<AvailableRide | null>(null);
  const [rideHistory, setRideHistory] =
    useState<RideHistoryEntry[]>(SEED_HISTORY);
  const [isOnline, setIsOnline] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Wallet">(
    "Cash",
  );
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingCompletedRide, setPendingCompletedRide] =
    useState<RideHistoryEntry | null>(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [pendingBillData, setPendingBillData] = useState<RideBillProps | null>(
    null,
  );

  // Persist role/name/phone
  useEffect(() => {
    localStorage.setItem("ridego_role", JSON.stringify(userRole));
  }, [userRole]);
  useEffect(() => {
    localStorage.setItem("ridego_name", JSON.stringify(userName));
  }, [userName]);
  useEffect(() => {
    localStorage.setItem("ridego_phone", JSON.stringify(userPhone));
  }, [userPhone]);

  // Navigate to correct dashboard when role is set
  useEffect(() => {
    if (userRole === "rider" && currentView === "home") {
      setCurrentView("rider-home");
    } else if (userRole === "driver" && currentView === "home") {
      setCurrentView("driver-home");
    }
  }, [userRole, currentView]);

  const navigate = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  // --- Role selection ---
  const handleSelectRole = (role: "rider" | "driver") => {
    setUserRole(role);
    if (!userName)
      setUserName(role === "rider" ? "Arjun Sharma" : "Suresh Kumar");
    if (!userPhone)
      setUserPhone(role === "rider" ? "98765XXXXX" : "87654XXXXX");
    notify("Welcome to RideGo", `You are now signed in as a ${role}`, "info");
    navigate(role === "rider" ? "rider-home" : "driver-home");
  };

  const handleSignOut = () => {
    setUserRole(null);
    setCurrentView("home");
    toast("Signed out successfully");
  };

  // --- Rider actions ---
  const handleBookRide = (ride: RideRequest) => {
    setCurrentRide(ride);
    navigate("ride-booked");
  };

  const handleRideCancelled = () => {
    if (currentRide) {
      const cancelled: RideHistoryEntry = {
        id: currentRide.id,
        pickup: currentRide.pickup,
        drop: currentRide.drop,
        vehicleType: currentRide.vehicleType,
        fare: currentRide.fare,
        status: "Cancelled",
        rating: null,
        date: "Just now",
      };
      setRideHistory((prev) => [cancelled, ...prev]);
    }
    setCurrentRide(null);
    navigate("rider-home");
  };

  const handleRideCompleted = () => {
    if (currentRide) {
      const distanceKm = currentRide.distanceKm ?? 3;
      const extraKm = Math.max(0, distanceKm - 1);

      let baseFare = SPORTSCAR_BASE_FARE;
      let extraKmFare = Math.round(extraKm * SPORTSCAR_PER_KM_RATE);
      if (currentRide.vehicleType === "Auto") {
        baseFare = AUTO_BASE_FARE;
        extraKmFare = Math.round(extraKm * AUTO_PER_KM_RATE);
      } else if (currentRide.vehicleType === "Cab") {
        baseFare = CAB_BASE_FARE;
        extraKmFare = Math.round(extraKm * CAB_PER_KM_RATE);
      }

      // Waiting charge is embedded in currentRide.fare
      const waitingCharge = Math.max(
        0,
        currentRide.fare - baseFare - extraKmFare,
      );
      const totalFare = currentRide.fare;

      const billDetails = {
        distanceKm,
        baseFare,
        extraKmFare,
        waitingCharge,
        totalFare,
        paymentMethod: paymentMethod,
      };

      const completed: RideHistoryEntry = {
        id: currentRide.id,
        pickup: currentRide.pickup,
        drop: currentRide.drop,
        vehicleType: currentRide.vehicleType,
        fare: currentRide.fare,
        status: "Completed",
        rating: null,
        date: "Just now",
        paymentMethod,
        billDetails,
      };
      setPendingCompletedRide(completed);

      const now = new Date();
      const rideDate = now.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      setPendingBillData({
        vehicleType: currentRide.vehicleType,
        pickup: currentRide.pickup,
        drop: currentRide.drop,
        distanceKm,
        baseFare,
        extraKmFare,
        waitingCharge,
        totalFare,
        paymentMethod,
        rideDate,
        onDone: handleBillDone,
      });
      setShowBillModal(true);
    } else {
      setCurrentRide(null);
      setPickup("");
      setDrop("");
      navigate("rider-home");
    }
  };

  const handleBillDone = () => {
    setShowBillModal(false);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = (rating: number, comment?: string) => {
    if (pendingCompletedRide) {
      const withRating: RideHistoryEntry = { ...pendingCompletedRide, rating };
      setRideHistory((prev) => [withRating, ...prev]);
      if (comment) {
        // comment stored locally, could be extended to backend
      }
    }
    setCurrentRide(null);
    setPendingCompletedRide(null);
    setShowRatingModal(false);
    setPickup("");
    setDrop("");
    notify(
      "Thanks for rating!",
      `You rated your driver ${rating} star${rating > 1 ? "s" : ""}`,
      "success",
    );
    navigate("rider-home");
  };

  const handleRatingSkip = () => {
    if (pendingCompletedRide) {
      setRideHistory((prev) => [pendingCompletedRide, ...prev]);
    }
    setCurrentRide(null);
    setPendingCompletedRide(null);
    setShowRatingModal(false);
    setPickup("");
    setDrop("");
    navigate("rider-home");
  };

  // --- Driver actions ---
  const handleAcceptRide = (ride: AvailableRide) => {
    setDriverVehicleType(ride.vehicleType);
    setActiveDriverRide(ride);
    navigate("driver-active");
  };

  const handleDriverRideComplete = () => {
    const earned: RideHistoryEntry = {
      id: Date.now(),
      pickup: activeDriverRide?.pickup ?? "Unknown",
      drop: activeDriverRide?.drop ?? "Unknown",
      vehicleType: activeDriverRide?.vehicleType ?? "Sports Car",
      fare: activeDriverRide?.fare ?? 0,
      status: "Completed",
      rating: null,
      date: "Just now",
    };
    setRideHistory((prev) => [earned, ...prev]);
    setActiveDriverRide(null);
    navigate("driver-home");
  };

  const handleDriverRideCancel = () => {
    setActiveDriverRide(null);
    navigate("driver-home");
  };

  const handleSaveProfile = (name: string, phone: string) => {
    setUserName(name);
    setUserPhone(phone);
  };

  const handleSwitchRole = () => {
    setUserRole(null);
    setCurrentRide(null);
    setActiveDriverRide(null);
    navigate("home");
  };

  const initials = userName
    ? userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  // ---- Render helpers ----

  // HOME screen
  if (currentView === "home") {
    return (
      <div className="min-h-screen bg-shell flex flex-col items-center justify-center relative overflow-hidden">
        <Toaster position="top-center" />
        {/* Background decorations */}
        <div className="absolute inset-0 bg-primary-glow pointer-events-none" />
        <div className="absolute top-20 right-8 w-32 h-32 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-20 left-8 w-40 h-40 rounded-full bg-primary/8 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center w-full max-w-sm px-6"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.1,
              duration: 0.5,
              type: "spring",
              stiffness: 200,
            }}
            className="mb-6 relative"
          >
            <div className="w-24 h-24 rounded-2xl bg-primary/20 border border-primary/30 backdrop-blur-sm flex items-center justify-center shadow-orange">
              <img
                src="/assets/generated/ridego-sportscar-icon-transparent.dim_512x512.png"
                alt="RideGo"
                className="w-20 h-20 object-contain"
              />
            </div>
          </motion.div>

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-2"
          >
            <h1 className="text-4xl font-black text-white tracking-tight">
              Ride<span className="text-gradient-orange">Go</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/50 text-sm mb-10 text-center"
          >
            Your ride, your way
          </motion.p>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-4 mb-10"
          >
            {[
              { icon: Zap, label: "Fast" },
              { icon: Car, label: "Reliable" },
              { icon: ArrowRight, label: "Affordable" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon size={18} className="text-primary" />
                </div>
                <span className="text-white/50 text-[10px] font-medium">
                  {label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full space-y-3"
          >
            <Button
              data-ocid="home.ride_button"
              onClick={() => handleSelectRole("rider")}
              className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-orange rounded-xl"
            >
              <Car size={20} className="mr-2" />I want to Ride
              <ArrowRight size={18} className="ml-auto" />
            </Button>

            <Button
              data-ocid="home.drive_button"
              onClick={() => handleSelectRole("driver")}
              variant="outline"
              className="w-full h-14 text-base font-bold border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 rounded-xl backdrop-blur-sm"
            >
              <ArrowRight size={20} className="mr-2 text-primary" />I want to
              Drive
              <ArrowRight size={18} className="ml-auto opacity-40" />
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-white/25 text-xs mt-8 text-center"
          >
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/60 hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // --- Main App Shell (after role selection) ---
  const isRider = userRole === "rider";
  const isDriver = userRole === "driver";

  // Bottom nav config
  type NavItem = { id: string; view: View; label: string; ocid: string };
  const riderNav: NavItem[] = [
    { id: "home", view: "rider-home", label: "Home", ocid: "nav.home_tab" },
    {
      id: "history",
      view: "ride-history",
      label: "My Rides",
      ocid: "nav.rides_tab",
    },
    {
      id: "profile",
      view: "profile",
      label: "Profile",
      ocid: "nav.profile_tab",
    },
  ];
  const driverNav: NavItem[] = [
    {
      id: "home",
      view: activeDriverRide ? "driver-active" : "driver-home",
      label: "Rides",
      ocid: "nav.home_tab",
    },
    {
      id: "history",
      view: "ride-history",
      label: "My Trips",
      ocid: "nav.rides_tab",
    },
    {
      id: "profile",
      view: "profile",
      label: "Profile",
      ocid: "nav.profile_tab",
    },
  ];
  const navItems = isRider ? riderNav : driverNav;

  const getNavIcon = (id: string) => {
    if (id === "home") return Home;
    if (id === "history") return History;
    return User;
  };

  const activeNavId =
    currentView === "rider-home" ||
    currentView === "driver-home" ||
    currentView === "driver-active"
      ? "home"
      : currentView === "ride-history"
        ? "history"
        : currentView === "profile"
          ? "profile"
          : "home";

  const pageTitle: Record<View, string> = {
    home: "RideGo",
    "rider-home": "Book a Ride",
    "ride-booked": "Your Ride",
    "driver-home": "Dashboard",
    "driver-active": "Active Ride",
    "ride-history": isRider ? "My Rides" : "My Trips",
    profile: "Profile",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster position="top-center" />

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-shell border-b border-white/10 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
        <div className="flex items-center h-14 px-4 gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <img
                src="/assets/generated/ridego-sportscar-icon-transparent.dim_512x512.png"
                alt="RideGo"
                className="w-6 h-6 object-contain"
              />
            </div>
            <span className="font-black text-white text-lg leading-none tracking-tight">
              Ride<span className="text-primary">Go</span>
            </span>
          </div>

          {/* Page title */}
          <span className="text-white/40 text-sm font-medium hidden sm:block ml-1">
            {pageTitle[currentView]}
          </span>

          <div className="flex items-center gap-2 ml-auto">
            {/* Role badge */}
            <Badge
              className={`text-xs hidden sm:flex ${
                isDriver
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-success/20 text-success border-success/30"
              }`}
              variant="outline"
            >
              {isDriver ? "Driver" : "Rider"}
            </Badge>

            {/* Online toggle for driver (in header too) */}
            {isDriver && currentView === "driver-home" && (
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${isOnline ? "bg-success animate-pulse" : "bg-muted-foreground"}`}
                />
                <span className="text-[10px] text-white/50 hidden sm:block">
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
            )}

            {/* Notification Center */}
            <NotificationCenter
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllRead={markAllRead}
              onClearAll={clearAll}
            />

            {/* Avatar */}
            <Avatar className="w-8 h-8 border border-white/20">
              <AvatarFallback className="bg-primary/20 text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Sign out */}
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-white/50 hover:text-white hover:bg-white/10"
              title="Sign out"
            >
              <LogOut size={15} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* RIDER VIEWS */}
              {currentView === "rider-home" && (
                <RiderHome
                  pickup={pickup}
                  drop={drop}
                  selectedVehicle={selectedVehicle}
                  rideHistory={rideHistory}
                  paymentMethod={paymentMethod}
                  onPickupChange={setPickup}
                  onDropChange={setDrop}
                  onVehicleSelect={setSelectedVehicle}
                  onBookRide={handleBookRide}
                  onPaymentMethodChange={setPaymentMethod}
                />
              )}

              {currentView === "ride-booked" &&
                currentRide &&
                !showBillModal && (
                  <RideBooking
                    currentRide={currentRide}
                    paymentMethod={paymentMethod}
                    onCancel={handleRideCancelled}
                    onComplete={handleRideCompleted}
                    onNotify={notify}
                  />
                )}

              {currentView === "ride-booked" &&
                showBillModal &&
                pendingBillData && (
                  <RideBill {...pendingBillData} onDone={handleBillDone} />
                )}

              {/* DRIVER VIEWS */}
              {currentView === "driver-home" && (
                <DriverHome
                  isOnline={isOnline}
                  onToggleOnline={setIsOnline}
                  onAcceptRide={handleAcceptRide}
                  onNotify={notify}
                />
              )}

              {currentView === "driver-active" && activeDriverRide && (
                <ActiveRide
                  ride={activeDriverRide}
                  onComplete={handleDriverRideComplete}
                  onCancel={handleDriverRideCancel}
                  onNotify={notify}
                  paymentMethod={paymentMethod}
                />
              )}

              {/* SHARED VIEWS */}
              {currentView === "ride-history" && (
                <RideHistory
                  rideHistory={rideHistory}
                  userRole={userRole ?? undefined}
                />
              )}

              {currentView === "profile" && userRole && (
                <ProfilePage
                  userRole={userRole}
                  userName={userName}
                  userPhone={userPhone}
                  vehicleType={driverVehicleType}
                  plateNumber={plateNumber}
                  rideHistory={rideHistory}
                  onSave={handleSaveProfile}
                  onSwitchRole={handleSwitchRole}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 z-50 bg-shell border-t border-white/10 safe-area-bottom">
        <div className="max-w-lg mx-auto px-2">
          <div className="flex items-stretch h-16">
            {navItems.map((item) => {
              const Icon = getNavIcon(item.id);
              const isActive = activeNavId === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  data-ocid={item.ocid}
                  onClick={() => navigate(item.view)}
                  className={`
                    flex-1 flex flex-col items-center justify-center gap-1 px-2 transition-all duration-200
                    ${isActive ? "text-primary" : "text-white/40 hover:text-white/70"}
                  `}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isActive ? "bg-primary/15" : ""
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] font-medium leading-none">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Driver Rating Modal */}
      <AnimatePresence>
        {showRatingModal && pendingCompletedRide && (
          <DriverRatingModal
            driverName="Suresh Kumar"
            onSubmit={handleRatingSubmit}
            onSkip={handleRatingSkip}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
