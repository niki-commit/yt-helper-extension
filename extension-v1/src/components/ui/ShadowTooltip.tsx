import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";

/**
 * Shadow DOM compatible tooltip components.
 * These components accept an optional `container` prop to portal tooltips
 * into a specific DOM node (like a shadow root) instead of document.body.
 */

function ShadowTooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

interface ShadowTooltipProps extends React.ComponentProps<
  typeof TooltipPrimitive.Root
> {
  container?: HTMLElement | null;
}

// Export this Context so content.tsx can provide the container globally
const ShadowRootContext = React.createContext<HTMLElement | null>(null);

function useFullscreenStatus() {
  const [isFullscreen, setIsFullscreen] = React.useState(
    !!document.fullscreenElement
  );

  React.useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  return isFullscreen;
}

function ShadowTooltip({ container, children, ...props }: ShadowTooltipProps) {
  // Use a local provider if a container is explicitly passed, otherwise let children consume the global one
  if (container) {
    return (
      <ShadowTooltipProvider>
        <ShadowRootContext.Provider value={container}>
          <TooltipPrimitive.Root data-slot="tooltip" {...props}>
            {children}
          </TooltipPrimitive.Root>
        </ShadowRootContext.Provider>
      </ShadowTooltipProvider>
    );
  }

  return (
    <ShadowTooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props}>
        {children}
      </TooltipPrimitive.Root>
    </ShadowTooltipProvider>
  );
}

function ShadowTooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

interface ShadowTooltipContentProps extends React.ComponentProps<
  typeof TooltipPrimitive.Content
> {
  container?: HTMLElement | null;
  shortcut?: string | string[];
}

function getPlatformModifier() {
  if (typeof window === "undefined") return "Alt";
  const userAgent = window.navigator.userAgent.toLowerCase();
  if (userAgent.includes("mac")) return "⌥";
  return "Alt";
}

function ShadowTooltipContent({
  className,
  sideOffset = 4,
  children,
  container: propContainer,
  shortcut,
  ...props
}: ShadowTooltipContentProps) {
  // Consume the context (Global from content.tsx OR Local from ShadowTooltip prop)
  const contextContainer = React.useContext(ShadowRootContext);
  const container = (propContainer || contextContainer) as HTMLElement | null;
  const isFullscreen = useFullscreenStatus();

  // Disable tooltip in fullscreen to prevent z-index issues
  if (isFullscreen) {
    return null;
  }

  const modifier = getPlatformModifier();

  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-9999 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          <span>{children}</span>
          {shortcut && (
            <div className="flex items-center gap-0.5">
              <Kbd className="h-4 min-w-[16px] px-1 text-[9px]">{modifier}</Kbd>
              <span className="text-[10px] opacity-70">+</span>
              {Array.isArray(shortcut) ? (
                shortcut.map((s, i) => (
                  <Kbd key={i} className="h-4 min-w-[16px] px-1 text-[9px]">
                    {s}
                  </Kbd>
                ))
              ) : (
                <Kbd className="h-4 min-w-[16px] px-1 text-[9px]">
                  {shortcut}
                </Kbd>
              )}
            </div>
          )}
        </div>
        <TooltipPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
export {
  ShadowTooltip,
  ShadowTooltipTrigger,
  ShadowTooltipContent,
  ShadowTooltipProvider,
  ShadowRootContext,
};
