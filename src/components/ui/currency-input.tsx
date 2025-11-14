import { Input } from "@/components/ui/input";
import { formatGBP, parseGBP } from "@/lib/currency";
import { forwardRef, useState } from "react";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number | string;
  onChange?: (value: number) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, onBlur, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(() => 
      value ? formatGBP(value) : ''
    );
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = () => {
      setIsFocused(true);
      // Show raw number when focused
      if (displayValue) {
        const num = parseGBP(displayValue);
        setDisplayValue(num.toString());
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      const num = parseFloat(e.target.value);
      
      if (!isNaN(num)) {
        setDisplayValue(formatGBP(num));
        onChange?.(num);
      } else {
        setDisplayValue('');
        onChange?.(0);
      }
      
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      setDisplayValue(input);
      
      const num = parseFloat(input);
      if (!isNaN(num)) {
        onChange?.(num);
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="£0.00"
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
