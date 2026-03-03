import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Bike,
  Car,
  ChevronRight,
  Phone,
  Shield,
  Star,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { RideHistoryEntry } from "../App";

interface ProfilePageProps {
  userRole: "rider" | "driver";
  userName: string;
  userPhone: string;
  vehicleType?: "Bike" | "Auto" | "Cab";
  plateNumber?: string;
  rideHistory: RideHistoryEntry[];
  onSave: (name: string, phone: string) => void;
  onSwitchRole: () => void;
}

export default function ProfilePage({
  userRole,
  userName,
  userPhone,
  vehicleType,
  plateNumber,
  rideHistory,
  onSave,
  onSwitchRole,
}: ProfilePageProps) {
  const [name, setName] = useState(userName);
  const [phone, setPhone] = useState(userPhone);
  const [isSaving, setIsSaving] = useState(false);

  const initials =
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const completedRides = rideHistory.filter(
    (r) => r.status === "Completed",
  ).length;
  const avgRating =
    rideHistory
      .filter((r) => r.rating)
      .reduce((sum, r) => sum + (r.rating ?? 0), 0) /
      (rideHistory.filter((r) => r.rating).length || 1) || 4.8;

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onSave(name.trim(), phone.trim());
      toast.success("Profile saved!");
    }, 600);
  };

  const VehicleIcon = vehicleType === "Bike" ? Bike : Car;

  return (
    <div className="pb-24 space-y-4 view-transition">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-2xl bg-shell text-white p-6">
        <div className="bg-primary-glow absolute inset-0 pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <Avatar
            className="w-18 h-18 border-2 border-primary/40 shadow-orange-sm"
            style={{ width: 72, height: 72 }}
          >
            <AvatarFallback className="bg-primary/20 text-white text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white leading-tight">
              {name || "Your Name"}
            </h2>
            <p className="text-white/60 text-sm mt-0.5">
              {phone || "+91 XXXXX XXXXX"}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge
                className={`text-xs px-2 py-0.5 ${
                  userRole === "driver"
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "bg-success/20 text-success border-success/30"
                }`}
                variant="outline"
              >
                {userRole === "driver" ? "🚗 Driver" : "🧑 Rider"}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs bg-white/10 text-white border-white/20 px-2 py-0.5"
              >
                <Shield size={8} className="mr-1" />
                Verified
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="shadow-xs border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Car size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {completedRides}
              </p>
              <p className="text-xs text-muted-foreground">Total Rides</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xs border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
              <Star size={18} className="text-warning fill-warning" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {avgRating.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile */}
      <Card className="shadow-card border-border/50">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-base">Edit Profile</h3>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Full Name
            </Label>
            <div className="relative">
              <User
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                data-ocid="profile.name_input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="pl-9 h-11 bg-muted/50 border-border/60 focus:border-primary focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Phone Number
            </Label>
            <div className="relative">
              <Phone
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                data-ocid="profile.phone_input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                type="tel"
                className="pl-9 h-11 bg-muted/50 border-border/60 focus:border-primary focus:ring-primary/20"
              />
            </div>
          </div>

          <Button
            data-ocid="profile.save_button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-orange-sm"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Profile"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Driver Vehicle Info */}
      {userRole === "driver" && (
        <Card className="shadow-card border-border/50">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-base">Vehicle Details</h3>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <VehicleIcon size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{vehicleType || "Bike"}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {plateNumber || "KA 01 AB 1234"}
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-xs text-success border-success/30"
              >
                <Shield size={8} className="mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Switch Role */}
      <Card className="shadow-xs border-border/50">
        <CardContent className="p-0">
          <button
            type="button"
            data-ocid="profile.switch_role_button"
            onClick={onSwitchRole}
            className="w-full p-4 flex items-center justify-between group hover:bg-muted/50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <Car size={16} className="text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">
                  Switch Role
                </p>
                <p className="text-xs text-muted-foreground">
                  Switch to {userRole === "rider" ? "Driver" : "Rider"} mode
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-muted-foreground group-hover:text-foreground transition-colors"
            />
          </button>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center pt-2 pb-2">
        <p className="text-xs text-muted-foreground">
          RideGo v1.0 &mdash; Safe & Reliable Rides
        </p>
      </div>
    </div>
  );
}
