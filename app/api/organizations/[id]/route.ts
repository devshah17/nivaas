import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Organization from "@/models/Organization";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const organization = await Organization.findById(id).populate("members.user", "name email");

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const memberData = organization.members.find((m) => (m.user as unknown as { _id: { toString: () => string } })._id.toString() === user.userId);

    if (!memberData) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Only admins see the full member list including pending, or we can just send it all
    // but mask pending for normal members
    return NextResponse.json({ 
      organization, 
      role: memberData.role,
      status: memberData.status 
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("GET organization error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { tiffinPrice } = body;

    await connectToDatabase();
    const organization = await Organization.findById(id);

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const memberData = organization.members.find((m) => m.user.toString() === user.userId);
    if (!memberData || memberData.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 });
    }

    if (tiffinPrice !== undefined) {
      organization.tiffinPrice = Number(tiffinPrice);
    }

    await organization.save();

    return NextResponse.json({ message: "Organization updated successfully", organization }, { status: 200 });

  } catch (error: unknown) {
    console.error("PATCH organization error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
