import { Coffee, Youtube, LifeBuoy, Instagram, Twitter } from "lucide-react";
import {
  ShadowTooltip,
  ShadowTooltipContent,
  ShadowTooltipTrigger,
} from "@/components/ui/ShadowTooltip";
import { EXTERNAL_LINKS } from "@/lib/constants";

interface SupportIconRowProps {
  size?: number;
}

export function SupportIconRow({ size = 16 }: SupportIconRowProps) {
  return (
    <div className="flex items-center gap-1">
      <ShadowTooltip>
        <ShadowTooltipTrigger asChild>
          <a
            href={EXTERNAL_LINKS.COFFEE}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground rounded-md p-1.5 transition-colors hover:text-orange-500"
          >
            <Coffee height={size} width={size} />
          </a>
        </ShadowTooltipTrigger>
        <ShadowTooltipContent side="bottom">
          <p>Buy me a coffee</p>
        </ShadowTooltipContent>
      </ShadowTooltip>

      <ShadowTooltip>
        <ShadowTooltipTrigger asChild>
          <a
            href={EXTERNAL_LINKS.X}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground rounded-md p-1.5 transition-colors hover:text-sky-500"
          >
            <Twitter height={size} width={size} />
          </a>
        </ShadowTooltipTrigger>
        <ShadowTooltipContent side="bottom">
          <p>Follow on X</p>
        </ShadowTooltipContent>
      </ShadowTooltip>

      <ShadowTooltip>
        <ShadowTooltipTrigger asChild>
          <a
            href={EXTERNAL_LINKS.INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground rounded-md p-1.5 transition-colors hover:text-pink-500"
          >
            <Instagram height={size} width={size} />
          </a>
        </ShadowTooltipTrigger>
        <ShadowTooltipContent side="bottom">
          <p>Follow on Instagram</p>
        </ShadowTooltipContent>
      </ShadowTooltip>

      <ShadowTooltip>
        <ShadowTooltipTrigger asChild>
          <a
            href={EXTERNAL_LINKS.BUG_REPORT}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground rounded-md p-1.5 transition-colors hover:text-blue-500"
          >
            <LifeBuoy height={size} width={size} />
          </a>
        </ShadowTooltipTrigger>
        <ShadowTooltipContent side="bottom">
          <p>Feedback/Report a bug</p>
        </ShadowTooltipContent>
      </ShadowTooltip>

      <ShadowTooltip>
        <ShadowTooltipTrigger asChild>
          <a
            href={EXTERNAL_LINKS.TUTORIAL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground rounded-md p-1.5 transition-colors hover:text-red-500"
          >
            <Youtube height={size} width={size} />
          </a>
        </ShadowTooltipTrigger>
        <ShadowTooltipContent side="bottom">
          <p>Video Tutorial</p>
        </ShadowTooltipContent>
      </ShadowTooltip>
    </div>
  );
}
