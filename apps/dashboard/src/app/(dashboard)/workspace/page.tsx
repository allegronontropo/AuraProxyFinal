import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getProjectsByUser } from "@/lib/queries";
import { WorkspaceSelectorClient } from "./WorkspaceSelectorClient";

export const metadata = {
  title: "Select Workspace - Aura Proxy",
  description: "Choose a workspace to manage your AI routing.",
};

export default async function WorkspacePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await getProjectsByUser(session.user.id);

  const user = {
    name: session.user.name ?? "User",
    email: session.user.email ?? "",
    initials: (session.user.name ?? session.user.email ?? "U")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
  };

  return <WorkspaceSelectorClient projects={projects} user={user} />;
}
