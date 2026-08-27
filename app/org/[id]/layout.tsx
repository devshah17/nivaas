import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Organization from "@/models/Organization";
import { OrgProvider } from "@/components/OrgProvider";
import OrgNav from "./OrgNav";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  const user = await verifyToken(token);
  if (!user) {
    redirect("/login");
  }

  await connectToDatabase();

  const organization = await Organization.findById(id).lean();

  if (!organization) {
    redirect("/dashboard");
  }

  const memberData = (organization.members as unknown as { user: { toString: () => string }; role: string; status: boolean }[]).find(
    (m) => m.user.toString() === user.userId
  );

  if (!memberData) {
    redirect("/dashboard");
  }

  // Sanitize the organization object before passing to client component
  const safeOrg = {
    _id: organization._id.toString(),
    name: organization.name,
    inviteCode: organization.inviteCode,
    creator: organization.creator.toString(),
    tiffinPrice: organization.tiffinPrice || 0,
  };

  return (
    <OrgProvider org={safeOrg} role={memberData.role} status={memberData.status}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <OrgNav />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </OrgProvider>
  );
}
