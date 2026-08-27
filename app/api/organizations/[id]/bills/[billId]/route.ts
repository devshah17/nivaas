import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Organization from "@/models/Organization";
import Bill from "@/models/Bill";
import TiffinEntry from "@/models/TiffinEntry";
import { verifyToken } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string, billId: string }> }) {
  try {
    const { id, billId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { status, otherCharges, otherChargesNote } = body;

    await connectToDatabase();
    const organization = await Organization.findById(id).lean();

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const memberData = (organization.members as { user: { toString: () => string }; role: string }[]).find(m => m.user.toString() === user.userId);
    if (!memberData || memberData.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 });
    }

    const bill = await Bill.findOne({ _id: billId, organization: id });
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    if (status !== undefined) {
      bill.status = status;
      if (status === "paid") {
        await TiffinEntry.updateMany(
          { lunchBill: billId, organization: id },
          { $set: { lunchPaymentStatus: "paid" } }
        );
        await TiffinEntry.updateMany(
          { dinnerBill: billId, organization: id },
          { $set: { dinnerPaymentStatus: "paid" } }
        );
      } else {
        await TiffinEntry.updateMany(
          { lunchBill: billId, organization: id },
          { $set: { lunchPaymentStatus: "unpaid" } }
        );
        await TiffinEntry.updateMany(
          { dinnerBill: billId, organization: id },
          { $set: { dinnerPaymentStatus: "unpaid" } }
        );
      }
    }
    if (otherCharges !== undefined) {
      bill.otherCharges = Number(otherCharges);
      bill.totalAmount = bill.tiffinTotal + bill.rentAmount + bill.otherCharges;
    }
    if (otherChargesNote !== undefined) bill.otherChargesNote = otherChargesNote;

    await bill.save();

    return NextResponse.json({ message: "Bill updated", bill }, { status: 200 });

  } catch (error: unknown) {
    console.error("PATCH bill error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
