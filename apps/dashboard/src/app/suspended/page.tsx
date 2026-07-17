import { Button } from "@/components/ui/button";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SuspendedPage() {
  const session = await auth();
  
  if (session?.user?.isActive === true) {
    redirect("/workspace");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="max-w-md p-8 text-center space-y-4 border border-red-500/20 bg-red-500/5 rounded-xl">
        <h1 className="text-3xl font-bold text-red-500">Account Suspended</h1>
        <p className="text-zinc-400">
          Your account has been suspended by an administrator. You can no longer access the dashboard or make API requests.
        </p>
        <div className="pt-4">
          <Link href="/api/auth/signout">
             <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10">Sign Out</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
