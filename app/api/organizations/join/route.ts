import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Organization from "@/models/Organization";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { inviteCode, orgId } = await req.json();

    if (!inviteCode && !orgId) {
      return NextResponse.json({ error: "Invite code or Organization ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    const query = orgId ? { _id: orgId } : { inviteCode: inviteCode.toUpperCase() };
    const organization = await Organization.findOne(query);

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const isMember = (organization.members as { user: { toString: () => string } }[]).some(m => m.user.toString() === user.userId);

    if (isMember) {
      return NextResponse.json({ error: "Already a member or request pending" }, { status: 400 });
    }

    organization.members.push({
      user: user.userId as unknown as mongoose.Types.ObjectId,
      role: "member",
      status: false,
    });

    await organization.save();

    return NextResponse.json({ message: "Join request sent successfully", organization }, { status: 200 });
  } catch (error: unknown) {
    console.error("POST join organization error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
