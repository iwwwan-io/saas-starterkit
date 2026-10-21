import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { FileQuestion, LayoutDashboard, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      {/* Top Header */}
      <header className="w-full border-b border-dashed border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo href="/" size="md" />
          <ThemeToggle />
        </div>
      </header>

      {/* Center 404 Card */}
      <main className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md border-dashed border-border/80 bg-card/60 backdrop-blur-md shadow-lg text-center">
          <CardHeader className="space-y-3 pb-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <FileQuestion className="size-7" />
            </div>
            <div className="inline-block mx-auto rounded-full border border-dashed border-border px-3 py-0.5 text-xs font-mono text-muted-foreground">
              404 • Not Found
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Page Not Found
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              The page you are looking for doesn&apos;t exist or has been moved to another URL.
            </CardDescription>
          </CardHeader>

          <CardContent className="text-xs text-muted-foreground">
            Please verify the address in your browser bar or use one of the navigation links below to continue.
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-center gap-2 border-t border-dashed border-border/70 pt-4">
            <Link
              href="/"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "w-full sm:w-auto text-xs gap-1.5",
              })}
            >
              <ArrowLeft className="size-3.5" />
              Return Home
            </Link>
            <Link
              href="/dashboard"
              className={buttonVariants({
                variant: "default",
                size: "sm",
                className: "btn-studio-glow w-full sm:w-auto text-xs gap-1.5",
              })}
            >
              <LayoutDashboard className="size-3.5" />
              Go to Dashboard
            </Link>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
