"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect away from register
  useEffect(() => {
    if (!isSessionPending && session?.user) {
      router.replace("/dashboard");
    }
  }, [session, isSessionPending, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to create account.");
      } else {
        toast.success("Account created successfully!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // If already authenticated, show redirect state
  if (session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-studio-grid font-sans">
        <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card/80 backdrop-blur-md border border-dashed border-border/80 shadow-xs text-xs text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span>Already signed in. Redirecting to dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-studio-grid font-sans">
      {/* Top Bar with Home link & Theme Toggle */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between border-b border-dashed border-border/60">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to home
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Register Card in Studio Blueprint Frame */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Studio Brand Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <BrandLogo href="/" size="md" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Create your account</h1>
            <p className="text-xs text-muted-foreground">Start building your production SaaS in minutes</p>
          </div>

          <Card className="border-dashed border-border/80 bg-card/80 backdrop-blur-md shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold">Register</CardTitle>
              <CardDescription className="text-xs">
                Set up your profile to start creating organizations and subscriptions.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    minLength={8}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-studio-glow text-xs font-semibold gap-2 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>
              </CardContent>
            </form>

            <CardFooter className="pt-2 border-t border-dashed border-border/60 flex justify-center">
              <p className="text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-foreground font-semibold underline underline-offset-4 hover:text-primary transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-dashed border-border/60">
        saas/studio v2.4 &bull; Built with Better Auth &amp; Drizzle ORM
      </footer>
    </div>
  );
}
