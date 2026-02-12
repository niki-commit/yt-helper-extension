import { Providers } from "@/components/Providers";
import { DashboardLayout } from "./components/DashboardLayout";
import { Toaster } from "@/components/ui/sonner";

export function App() {
  return (
    <Providers>
      <DashboardLayout />
      <Toaster position="bottom-right" richColors expand={true} />
    </Providers>
  );
}
