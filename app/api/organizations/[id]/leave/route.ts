import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Organization from "@/models/Organization";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const organization = await Organization.findById(id);

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (organization.creator.toString() === user.userId) {
      return NextResponse.json({ error: "Creator cannot leave the organization" }, { status: 400 });
    }

    const memberIndex = organization.members.findIndex((m) => m.user.toString() === user.userId);
    
    if (memberIndex === -1) {
      return NextResponse.json({ error: "Not a member" }, { status: 404 });
    }

    organization.members.splice(memberIndex, 1);
    await organization.save();

    return NextResponse.json({ message: "Left organization successfully" }, { status: 200 });

  } catch (error: unknown) {
    console.error("POST leave org error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
