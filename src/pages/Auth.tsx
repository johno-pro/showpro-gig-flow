import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Check if user is arriving from password reset email
  useEffect(() => {
    // Check URL hash for password recovery
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setShowUpdatePassword(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowUpdatePassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't redirect if updating password
  useEffect(() => {
    if (user && !showUpdatePassword) {
      navigate("/");
    }
  }, [user, showUpdatePassword, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      toast.error("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(email, password);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password. Please check your credentials and try again.");
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("Please check your email and confirm your account before signing in.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Signed in successfully!");
      navigate("/");
    }

    setIsLoading(false);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 10) {
      return "Password must be at least 10 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      toast.error("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created successfully!");
      navigate("/");
    }

    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      toast.error(`Failed to send reset email: ${error.message}`);
    } else {
      toast.success("Password reset email sent! Check your inbox (and spam folder).");
      setShowResetPassword(false);
    }

    setIsLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast.error(`Failed to send magic link: ${error.message}`);
    } else {
      toast.success("Magic link sent! Check your inbox to sign in.");
      setShowMagicLink(false);
    }

    setIsLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      setShowUpdatePassword(false);
      navigate("/");
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="mb-1 text-2xl font-bold">ShowPro</h1>
          <p className="text-sm text-muted-foreground">Entertainment Booking System</p>
        </div>

        <Card className="max-h-[calc(100vh-180px)] overflow-y-auto">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Welcome</CardTitle>
            <CardDescription className="text-sm">
              {showUpdatePassword
                ? "Enter your new password"
                : showResetPassword 
                ? "Enter your email to reset your password"
                : showMagicLink
                ? "Enter your email to receive a magic link"
                : "Sign in to your account or create a new one"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            {showUpdatePassword ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be 10+ characters with uppercase, lowercase, number, and special character
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Updating password..." : "Update Password"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowUpdatePassword(false)}
                >
                  Back to Sign In
                </Button>
              </form>
            ) : showResetPassword ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending reset email..." : "Send Reset Email"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowResetPassword(false)}
                >
                  Back to Sign In
                </Button>
              </form>
            ) : showMagicLink ? (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email">Email</Label>
                  <Input
                    id="magic-email"
                    name="email"
                    type="email"
                    placeholder="julie@ents.pro"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send a sign-in link to this email. No password needed.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending magic link..." : "Send Magic Link"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowMagicLink(false)}
                >
                  Back to Sign In
                </Button>
              </form>
            ) : (
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                    <div className="text-center space-y-1">
                      <Button
                        type="button"
                        variant="link"
                        className="text-primary underline h-auto py-1"
                        onClick={() => setShowResetPassword(true)}
                      >
                        Forgot Password?
                      </Button>
                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">or</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowMagicLink(true)}
                      >
                        Sign in with Magic Link
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be 10+ characters with uppercase, lowercase, number, and special character
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
