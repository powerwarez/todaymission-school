import { cn } from "../../lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, VariantProps } from "class-variance-authority";
import React from "react";

const rainbowButtonVariants = cva(
  cn(
    "relative cursor-pointer group transition-all",
    "inline-flex items-center justify-center",
    "rounded-lg outline-none",
    "text-sm font-medium whitespace-nowrap",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0"
  ),
  {
    variants: {
      variant: {
        default:
          "text-white p-2 overflow-visible before:absolute before:bottom-[-8px] before:left-0 before:right-0 before:h-[6px] before:w-full before:animate-rainbow before:bg-[linear-gradient(90deg,#ff0000,#ff7f00,#ffff00,#00ff00,#0000ff,#4b0082,#9400d3)] before:bg-[length:200%] before:rounded-full before:[filter:blur(2px)] after:absolute after:bottom-[-8px] after:left-0 after:right-0 after:h-[4px] after:w-full after:animate-rainbow after:bg-[linear-gradient(90deg,#ff0000,#ff7f00,#ffff00,#00ff00,#0000ff,#4b0082,#9400d3)] after:bg-[length:200%] after:rounded-full",
        outline:
          "text-white p-2 overflow-visible before:absolute before:bottom-[-8px] before:left-0 before:right-0 before:h-[6px] before:w-full before:animate-rainbow before:bg-[linear-gradient(90deg,#ff0000,#ff7f00,#ffff00,#00ff00,#0000ff,#4b0082,#9400d3)] before:bg-[length:200%] before:rounded-full before:[filter:blur(2px)] after:absolute after:bottom-[-8px] after:left-0 after:right-0 after:h-[4px] after:w-full after:animate-rainbow after:bg-[linear-gradient(90deg,#ff0000,#ff7f00,#ffff00,#00ff00,#0000ff,#4b0082,#9400d3)] after:bg-[length:200%] after:rounded-full",
      },
      size: {
        default: "p-2",
        sm: "p-1.5 text-xs",
        lg: "p-3",
        icon: "p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface RainbowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof rainbowButtonVariants> {
  asChild?: boolean;
}

const RainbowButton = React.forwardRef<HTMLButtonElement, RainbowButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        data-slot="button"
        className={cn(rainbowButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

RainbowButton.displayName = "RainbowButton";

export { RainbowButton, rainbowButtonVariants, type RainbowButtonProps };
