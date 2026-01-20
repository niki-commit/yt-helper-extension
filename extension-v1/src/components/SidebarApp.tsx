import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FileEdit } from "lucide-react";
import { NoteWorkspace } from "@/components/NoteWorkspace";
import { useTheme } from "@/hooks/useTheme";

export function SidebarApp() {
  const [value, setValue] = useState<string>("");
  const [initialTimestamp, setInitialTimestamp] = useState<number | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const handleOpen = (e: any) => {
      console.log("[VideoNotes] Sidebar received open event", e.detail);
      setInitialTimestamp(e.detail.currentTime ?? null);
      setValue("item-1"); // Auto-expand
    };

    window.addEventListener("VN_OPEN_SIDEBAR", handleOpen);
    return () => window.removeEventListener("VN_OPEN_SIDEBAR", handleOpen);
  }, []);

  return (
    <div
      className={`border-border bg-background/40 mb-4 overflow-hidden rounded-2xl border shadow-xl backdrop-blur-xl transition-all duration-300 ${resolvedTheme === "dark" ? "dark" : ""}`}
    >
      <Accordion
        type="single"
        collapsible
        value={value}
        onValueChange={setValue}
        className="w-full"
      >
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="hover:bg-accent/20 rounded-t-2xl px-4 py-3 transition-colors hover:no-underline">
            <div className="flex items-center gap-2">
              <h1 className="from-primary to-secondary-foreground bg-linear-to-r bg-clip-text text-sm font-bold text-transparent">
                VideoNotes
              </h1>
            </div>
          </AccordionTrigger>
          <AccordionContent className="bg-transparent px-4 pb-4">
            <div className="h-[520px] overflow-auto pt-2">
              <NoteWorkspace
                initialTimestamp={initialTimestamp}
                onSaveComplete={() => {
                  setValue(""); // Collapse
                  setInitialTimestamp(null);
                }}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
