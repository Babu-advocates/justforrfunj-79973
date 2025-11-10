import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminVerificationProps {
  children: React.ReactNode;
}

const AdminVerification = ({ children }: AdminVerificationProps) => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    // Check if already verified in this session
    const verified = sessionStorage.getItem("adminVerified");
    if (verified === "true") {
      setIsVerified(true);
    }
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const adminEmail = localStorage.getItem("adminEmail");
      
      if (!adminEmail) {
        toast.error("Admin email not found. Please login again.");
        return;
      }

      const { data, error } = await supabase
        .from("admin_accounts")
        .select("verification_password")
        .eq("email", adminEmail)
        .single();

      if (error) throw error;

      if (data.verification_password === password) {
        setIsVerified(true);
        sessionStorage.setItem("adminVerified", "true");
        toast.success("Verification successful!");
      } else {
        toast.error("Incorrect verification password");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification failed");
    } finally {
      setLoading(false);
      setPassword("");
    }
  };

  const handleSendOTP = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setResetLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-verification-password-reset-otp",
        {
          body: { email },
        }
      );

      if (error) throw error;

      toast.success("OTP sent to your email");
      setOtpSent(true);
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      toast.error("Please fill all fields");
      return;
    }

    setResetLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "verify-otp-and-reset-verification-password",
        {
          body: { email, otp, newPassword },
        }
      );

      if (error) throw error;

      toast.success("Verification password reset successfully!");
      setShowForgotPassword(false);
      setEmail("");
      setOtp("");
      setNewPassword("");
      setOtpSent(false);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  if (isVerified) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="relative min-h-screen">
        {/* Main content with reduced opacity */}
        <div className="opacity-10 pointer-events-none transition-opacity duration-300">
          {children}
        </div>

        {/* Verification overlay - only covers main content, not sidebar */}
        <div 
          className="fixed top-0 bottom-0 flex items-center justify-center bg-background/95 backdrop-blur-md z-50 transition-opacity duration-300"
          style={{ 
            left: 'var(--sidebar-width, 0px)',
            right: 0
          }}
        >
          <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full border">
            <h2 className="text-2xl font-bold mb-2 text-center text-foreground">
              Admin Verification Required
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              Enter verification password to access this page
            </p>
            
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label htmlFor="verification-password" className="block text-sm font-medium mb-2 text-foreground">
                  Verification Password
                </label>
                <PasswordInput
                  id="verification-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter verification password"
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify"}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full text-sm"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot Verification Password?
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/admin-dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Verification Password</DialogTitle>
            <DialogDescription>
              {!otpSent
                ? "Enter your admin email to receive an OTP"
                : "Enter the OTP and your new verification password"}
            </DialogDescription>
          </DialogHeader>

          {!otpSent ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Admin Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your admin email"
                  required
                />
              </div>
              <Button
                onClick={handleSendOTP}
                disabled={resetLoading}
                className="w-full"
              >
                {resetLoading ? "Sending..." : "Send OTP"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium mb-2">
                  OTP Code
                </label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  required
                  maxLength={6}
                />
              </div>
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium mb-2">
                  New Verification Password
                </label>
                <PasswordInput
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOtpSent(false)}
                  className="w-full"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full"
                >
                  {resetLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminVerification;
