// app/(pages)/dashboard/layout.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/signin?callbackUrl=/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-50 ml-64">{children}</main>
    </div>
  );
}