import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user && session.user.isActive === false) {
    redirect("/suspended");
  }
  return <>{children}</>;
}
