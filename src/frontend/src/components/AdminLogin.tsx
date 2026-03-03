import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Shield, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface AdminLoginProps {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate brief auth check
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);

    if (username === "admin" && password === "admin123") {
      onLogin();
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-shell flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-primary-glow pointer-events-none" />
      <div className="absolute top-20 right-8 w-40 h-40 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-20 left-8 w-48 h-48 rounded-full bg-primary/8 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/3 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm px-4"
      >
        {/* Logo section */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-4 shadow-orange">
            <Shield size={28} className="text-primary" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Ride<span className="text-gradient-orange">Go</span>
          </h1>
          <Badge className="mt-2 bg-primary/20 text-primary border-primary/30 text-xs">
            Admin Portal
          </Badge>
        </motion.div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-white/10 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-xl font-bold">
                Admin Login
              </CardTitle>
              <CardDescription className="text-white/40 text-sm">
                Enter your admin credentials to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <User
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                    />
                    <Input
                      data-ocid="admin_login.username_input"
                      type="text"
                      placeholder="admin"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError("");
                      }}
                      className="pl-9 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-primary/50 focus:ring-primary/20"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                    />
                    <Input
                      data-ocid="admin_login.password_input"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      className="pl-9 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-primary/50 focus:ring-primary/20"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <motion.div
                    data-ocid="admin_login.error_state"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                    <p className="text-destructive text-xs font-medium">
                      {error}
                    </p>
                  </motion.div>
                )}

                <Button
                  data-ocid="admin_login.submit_button"
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-orange mt-2"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Shield size={16} />
                      Login as Admin
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-white/20 text-xs mt-6 text-center"
        >
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/50 hover:text-primary transition-colors"
          >
            caffeine.ai
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
