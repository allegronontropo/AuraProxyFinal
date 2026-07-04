import { auth } from "@/auth";
import { getProjectRouting } from "@/actions/routing";
import RoutingSection from "@/components/dashboard/RoutingSection";
import { redirect } from "next/navigation";

export default async function RoutingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const resolvedParams = await params;
  const { projectId } = resolvedParams;

  const result = await getProjectRouting(projectId);
  const fallbackModels = "fallbackModels" in (result ?? {}) ? result.fallbackModels : [];

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top bar */}
      <div className="h-[52px] shrink-0 bg-[#0d0d0f]/80 backdrop-blur-md border-b border-white/5 flex items-center px-6 z-10">
        <h1 className="text-[15px] font-medium text-white tracking-wide">Routing Configuration</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pb-8 pt-2 max-w-[900px] mx-auto">
          <RoutingSection
            projectId={projectId}
            initialFallbackModels={fallbackModels ?? []}
          />
        </div>
      </div>
    </div>
  );
}
