import * as React from "react";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { ShadowRootContext } from "@/components/ui/ShadowTooltip";
import { cn } from "@/lib/utils";

interface CustomToasterProps extends ToasterProps {
  container?: HTMLElement | null;
}

const Toaster = ({ ...props }: CustomToasterProps) => {
  const { theme = "system" } = useTheme();
  const shadowRoot = React.useContext(ShadowRootContext);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      container={props.container || shadowRoot}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
