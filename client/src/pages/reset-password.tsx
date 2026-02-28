import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Loader2, ArrowLeft, CheckCircle2, XCircle, Eye, EyeOff, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 lg:flex">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/[0.05]" />
          <div className="absolute bottom-20 -left-20 h-80 w-80 rounded-full bg-white/[0.05]" />
        </div>
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Veew Distributors</span>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight text-white">
            Set a new password
          </h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-white/70">
            Choose a strong password to keep your account secure.
          </p>
        </div>
        <div className="relative text-xs text-white/40">
          &copy; {new Date().getFullYear()} Veew Distributors. Nairobi, Kenya.
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Veew Distributors</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");

  const { data: tokenStatus, isLoading: verifying } = useQuery<{ valid: boolean; error?: string }>({
    queryKey: ["/api/auth/verify-reset-token", token],
    queryFn: async () => {
      const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
      return response.json();
    },
    enabled: !!token,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", data);
      return response.json();
    },
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Passwords Don't Match", description: "Please make sure your passwords match", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Password Too Short", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (!token) return;
    resetPasswordMutation.mutate({ token, password });
  };

  if (!token) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Invalid Link</h1>
          <p className="mt-2 text-sm text-muted-foreground">This password reset link is invalid or missing.</p>
          <Link href="/forgot-password" className="mt-8 w-full">
            <Button variant="outline" className="w-full" data-testid="button-request-new-link">Request a New Link</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (verifying) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Verifying reset link...</p>
        </div>
      </AuthShell>
    );
  }

  if (tokenStatus && !tokenStatus.valid) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Link Expired</h1>
          <p className="mt-2 text-sm text-muted-foreground">This password reset link has expired or has already been used.</p>
          <Link href="/forgot-password" className="mt-8 w-full">
            <Button variant="outline" className="w-full" data-testid="button-request-new-link">Request a New Link</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Password Reset</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your password has been successfully reset.</p>
          <Link href="/login" className="mt-8 w-full">
            <Button className="w-full" data-testid="button-go-to-login">Sign In with New Password</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="space-y-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
          <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Reset Password</h1>
        <p className="text-sm text-muted-foreground">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="h-11 pr-10"
              data-testid="input-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="h-11"
            data-testid="input-confirm-password"
          />
        </div>
        <Button
          type="submit"
          className="h-11 w-full text-base"
          disabled={resetPasswordMutation.isPending}
          data-testid="button-reset-password"
        >
          {resetPasswordMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="inline-flex items-center text-sm text-primary hover:underline" data-testid="link-back-to-login">
          <ArrowLeft className="mr-1 h-3 w-3" />
          Back to Sign In
        </Link>
      </div>
    </AuthShell>
  );
}
