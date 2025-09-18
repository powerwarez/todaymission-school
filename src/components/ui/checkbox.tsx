import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "../../lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<
    typeof CheckboxPrimitive.Root
  >
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded border-2 border-gray-400 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 hover:border-gray-500",
      className
    )}
    {...props}>
    <CheckboxPrimitive.Indicator
      className={cn(
        "flex items-center justify-center text-white"
      )}>
      <Check className="h-3.5 w-3.5 font-bold" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
