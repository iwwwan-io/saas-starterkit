import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  badge,
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "border-dashed border-border/80 bg-card/60 backdrop-blur-md shadow-xs hover:border-primary/50 transition-all group",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div className="flex items-center gap-1.5">
          {badge && (
            <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 border-border/70">
              {badge}
            </Badge>
          )}
          {Icon && (
            <div className="p-1 rounded-md text-muted-foreground group-hover:text-primary transition-colors">
              <Icon className="size-4" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-extrabold tracking-tight">{value}</div>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
