import { ConditionalLayout } from "@/components/ConditionalLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConditionalLayout>{children}</ConditionalLayout>;
}
