import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Organization from "@/models/Organization";
import RentalUnit from "@/models/RentalUnit";
import { verifyToken } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string, unitId: string }> }) {
  try {
    const { id, unitId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { tenant, rentAmount, moveInDate, clearTenant } = body;

    await connectToDatabase();
    const organization = await Organization.findById(id).lean();

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const memberData = (organization.members as { user: { toString: () => string }; role: string }[]).find((m) => m.user.toString() === user.userId);
    if (!memberData || memberData.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 });
    }

    let updateData: { tenant?: string | null; rentAmount?: number | null; moveInDate?: string | null } = {};
    if (clearTenant) {
      updateData = { tenant: null, rentAmount: null, moveInDate: null };
    } else {
      if (tenant !== undefined) updateData.tenant = tenant;
      if (rentAmount !== undefined) updateData.rentAmount = rentAmount;
      if (moveInDate !== undefined) updateData.moveInDate = moveInDate;
    }

    const unit = await RentalUnit.findOneAndUpdate(
      { _id: unitId, organization: id },
      { $set: updateData },
      { new: true }
    ).populate("tenant", "name email");

    if (!unit) {
      return NextResponse.json({ error: "Rental unit not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Unit updated", unit }, { status: 200 });

  } catch (error: unknown) {
    console.error("PATCH rental unit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, unitId: string }> }) {
  try {
    const { id, unitId } = await params;
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

    const memberData = (organization.members as { user: { toString: () => string }; role: string }[]).find((m) => m.user.toString() === user.userId);
    if (!memberData || memberData.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 });
    }

    const unit = await RentalUnit.findOneAndDelete({ _id: unitId, organization: id });
    if (!unit) {
      return NextResponse.json({ error: "Rental unit not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Unit deleted" }, { status: 200 });

  } catch (error: unknown) {
    console.error("DELETE rental unit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
