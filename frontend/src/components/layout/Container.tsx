import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

// Har page aur header same width + padding use kare, isliye ek jagah define
export default function Container({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10", className)}
      {...props}
    />
  );
}
