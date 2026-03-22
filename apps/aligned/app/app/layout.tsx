import { AppLayoutShell } from "./app-layout-shell";
import { NativePushRegistration } from "./native-push-registration";
import { ScrollToTopOnNav } from "./scroll-to-top-on-nav";

export const dynamic = "force-dynamic";

export default function AppSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen h-[100dvh] w-full max-w-[100vw] flex-col overflow-hidden md:min-h-screen bg-[#e8f0ea]" style={{ overscrollBehaviorX: "none" }}>
      <NativePushRegistration />
      <ScrollToTopOnNav />
      <AppLayoutShell>{children}</AppLayoutShell>
    </div>
  );
}
