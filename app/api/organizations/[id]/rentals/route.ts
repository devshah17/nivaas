import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Organization from "@/models/Organization";
import RentalUnit from "@/models/RentalUnit";
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
    const organization = await Organization.findById(id).lean();

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const memberData = (organization.members as { user: { toString: () => string }; role: string; status: boolean }[]).find((m) => m.user.toString() === user.userId);
    if (!memberData || memberData.status !== true) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Customers only see their own rentals
    const query: Record<string, unknown> = { organization: id };
    if (memberData.role !== "admin") {
      query.tenant = user.userId;
    }

    const units = await RentalUnit.find(query).populate("tenant", "name email").sort({ roomName: 1, bedName: 1 }).lean();

    return NextResponse.json({ units }, { status: 200 });

  } catch (error: unknown) {
    console.error("GET rentals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { roomName, bedName } = body;

    if (!roomName || !bedName) {
      return NextResponse.json({ error: "Room and Bed name are required" }, { status: 400 });
    }

    await connectToDatabase();
    const organization = await Organization.findById(id).lean();

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const memberData = (organization.members as { user: { toString: () => string }; role: string }[]).find((m) => m.user.toString() === user.userId);
    if (!memberData || memberData.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 });
    }

    const existing = await RentalUnit.findOne({ organization: id, roomName, bedName });
    if (existing) {
      return NextResponse.json({ error: "This room and bed combination already exists." }, { status: 400 });
    }

    const unit = await RentalUnit.create({
      organization: id,
      roomName,
      bedName
    });

    return NextResponse.json({ message: "Rental unit created", unit }, { status: 201 });

  } catch (error: unknown) {
    console.error("POST rentals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
