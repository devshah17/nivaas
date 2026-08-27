import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Organization from "@/models/Organization";
import TiffinEntry from "@/models/TiffinEntry";
import { verifyToken } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const month = searchParams.get("month");

    await connectToDatabase();
    const organization = await Organization.findById(id).lean();

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    const memberData = (organization.members as { user: { toString: () => string }; role: string; status: boolean }[]).find(
      (m) => m.user.toString() === user.userId,
    );
    if (!memberData || memberData.status !== true) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const query: Record<string, unknown> = { organization: id };

    // If not admin, only fetch their own entries
    if (memberData.role !== "admin") {
      query.customer = user.userId;
    }

    if (date) {
      query.date = date;
    } else if (month) {
      query.date = { $regex: `^${month}` };
    } else {
      return NextResponse.json(
        { error: "Date or month parameter is required" },
        { status: 400 },
      );
    }

    const entries = await TiffinEntry.find(query)
      .populate("customer", "name email")
      .lean();

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET tiffins error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      customerId,
      date,
      lunchStatus,
      lunchExtra,
      dinnerStatus,
      dinnerExtra,
    } = body;

    if (!customerId || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const organization = await Organization.findById(id).lean();

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    const memberData = (organization.members as { user: { toString: () => string }; role: string; status: boolean }[]).find(
      (m) => m.user.toString() === user.userId,
    );
    if (!memberData || memberData.status !== true) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Customers can only update their own records
    if (memberData.role !== "admin" && customerId !== user.userId) {
      return NextResponse.json(
        { error: "Not authorized to update other customers' entries" },
        { status: 403 },
      );
    }

    // Update or create
    const entry = await TiffinEntry.findOneAndUpdate(
      { organization: id, customer: customerId, date },
      {
        $set: {
          lunchStatus: lunchStatus ?? "none",
          lunchExtra: lunchExtra ?? 0,
          dinnerStatus: dinnerStatus ?? "none",
          dinnerExtra: dinnerExtra ?? 0,
        },
      },
      { new: true, upsert: true },
    );

    return NextResponse.json(
      { message: "Entry updated", entry },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("PATCH tiffins error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
