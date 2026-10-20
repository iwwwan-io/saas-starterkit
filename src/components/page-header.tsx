import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

export interface PageHeaderProps {
  title: string;
  description?: string;
  tag?: string;
  category?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  tag = "saas/studio",
  category = "App Router • Next.js 16",
  className,
  children,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card/60 backdrop-blur-md border border-dashed border-border/80 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs",
        className
      )}
    >
      <div className="space-y-1 max-w-2xl">
        <div className="flex items-center gap-2 mb-2">
          {tag && (
            <Badge
              variant="outline"
              className="border-border text-foreground font-mono text-[10px]"
            >
              {tag}
            </Badge>
          )}
          {category && (
            <span className="text-xs text-muted-foreground">{category}</span>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-end">
          {children}
        </div>
      )}
    </div>
  );
}
