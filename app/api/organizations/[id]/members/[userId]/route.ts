import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Organization from "@/models/Organization";
import { verifyToken } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string, userId: string }> }) {
  try {
    const { id, userId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { action, tiffinCycleStart, rentCycleStart } = await req.json(); // action can be 'approve', 'reject', 'remove', 'update-cycle'

    await connectToDatabase();

    const organization = await Organization.findById(id);

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const currentMember = organization.members.find((m) => m.user.toString() === user.userId);
    if (!currentMember || currentMember.role !== "admin") {
      return NextResponse.json({ error: "Only admins can manage members" }, { status: 403 });
    }

    const targetMemberIndex = organization.members.findIndex((m) => m.user.toString() === userId);
    
    if (targetMemberIndex === -1) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (action === "approve") {
      organization.members[targetMemberIndex].status = true;
      const currentDay = new Date().getDate();
      if (!organization.members[targetMemberIndex].tiffinCycleStart) {
        organization.members[targetMemberIndex].tiffinCycleStart = currentDay;
      }
      if (!organization.members[targetMemberIndex].rentCycleStart) {
        organization.members[targetMemberIndex].rentCycleStart = currentDay;
      }
    } else if (action === "update-cycle") {
      if (tiffinCycleStart !== undefined) organization.members[targetMemberIndex].tiffinCycleStart = tiffinCycleStart;
      if (rentCycleStart !== undefined) organization.members[targetMemberIndex].rentCycleStart = rentCycleStart;
    } else if (action === "reject" || action === "remove") {
      // Cannot remove the creator
      if (organization.creator.toString() === userId) {
        return NextResponse.json({ error: "Cannot remove the creator" }, { status: 400 });
      }
      organization.members.splice(targetMemberIndex, 1);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await organization.save();

    return NextResponse.json({ message: `Member ${action}d successfully` }, { status: 200 });

  } catch (error: unknown) {
    console.error("PUT update member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
