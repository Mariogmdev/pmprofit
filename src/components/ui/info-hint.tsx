import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface InfoHintProps {
  title: string;
  /** Plain-language explanation of how the number is calculated */
  children: React.ReactNode;
  className?: string;
}

/** Small (i) icon that opens a plain-language explanation of a calculation. */
export const InfoHint = ({ title, children, className }: InfoHintProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        aria-label={`Cómo se calcula: ${title}`}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
    </PopoverTrigger>
    <PopoverContent side="top" className="w-80 text-xs leading-relaxed">
      <p className="mb-1.5 text-sm font-semibold text-foreground">{title}</p>
      <div className="space-y-1.5 text-muted-foreground">{children}</div>
    </PopoverContent>
  </Popover>
);
