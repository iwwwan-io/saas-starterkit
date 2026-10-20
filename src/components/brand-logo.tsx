import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

export interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  showText?: boolean;
  subtitle?: string;
  href?: string;
  className?: string;
  onClick?: () => void;
}

export function BrandLogo({
  size = "md",
  showBadge = true,
  showText = true,
  subtitle,
  href = "/",
  className,
  onClick,
}: BrandLogoProps) {
  const iconSizeClasses = {
    sm: "size-7 rounded-md",
    md: "size-8 rounded-lg",
    lg: "size-10 rounded-xl",
  }[size];

  const svgSize = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
  }[size];

  const textSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  const content = (
    <div className={cn("flex items-center gap-2.5 group select-none", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105 shrink-0",
          iconSizeClasses
        )}
      >
        <svg width="20" height="20" viewBox="0 0 328 329" fill="none" className={svgSize}>
          <rect y="0.5" width="328" height="328" rx="80" fill="currentColor" />
          <path
            d="M165 72V133C165 153 149 169 129 169H70"
            stroke="var(--background)"
            strokeWidth="24"
            strokeLinecap="round"
          />
          <path
            d="M167 265V205C167 185 183 169 203 169H261"
            stroke="var(--background)"
            strokeWidth="24"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className={cn("flex items-center gap-1.5 font-bold tracking-tight", textSize)}>
            <span>saas</span>
            <span className="text-muted-foreground font-normal">/studio</span>
            {showBadge && (
              <Badge
                variant="outline"
                className="text-[9px] px-1 py-0 font-mono text-muted-foreground border-border/80"
              >
                v2.4
              </Badge>
            )}
          </div>
          {subtitle && (
            <span className="text-[11px] text-muted-foreground leading-tight">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}
