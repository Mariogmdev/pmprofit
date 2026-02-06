import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatNumber, parseCurrencyString, getCurrencySymbol } from "@/lib/currency";
import { CurrencyCode } from "@/types";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: number;
  onChange: (value: number) => void;
  currency?: CurrencyCode;
  customSymbol?: string;
  showSymbol?: boolean;
}

/**
 * Currency-formatted input that:
 * - Shows formatted value (e.g., "$50,000") on blur
 * - Shows raw number on focus for easy editing
 * - Stores numeric value internally
 */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, currency = "COP", customSymbol, showSymbol = true, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");
    const [isFocused, setIsFocused] = React.useState(false);

    const symbol = showSymbol ? getCurrencySymbol(currency, customSymbol) : "";

    // Format value when not focused or when value changes externally
    React.useEffect(() => {
      if (!isFocused) {
        if (value > 0) {
          setDisplayValue(`${symbol}${formatNumber(value)}`);
        } else {
          setDisplayValue("");
        }
      }
    }, [value, isFocused, symbol]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Show raw number for editing
      setDisplayValue(value > 0 ? value.toString() : "");
      // Select all text for easy replacement
      setTimeout(() => e.target.select(), 0);
    };

    const handleBlur = () => {
      setIsFocused(false);
      const numValue = parseCurrencyString(displayValue);
      onChange(numValue);
      // Format will be applied by useEffect
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      // Allow typing numbers, dots, and commas
      setDisplayValue(inputValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow Enter to blur and format
      if (e.key === "Enter") {
        e.currentTarget.blur();
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn("text-right", className)}
        placeholder={`${symbol}0`}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
