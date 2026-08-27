import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Organization from "@/models/Organization";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    await connectToDatabase();

    const searchCriteria: Record<string, unknown> = {
      // Exclude organizations where this user is already an active member
      members: { $not: { $elemMatch: { user: user.userId, status: true } } }
    };

    if (query) {
      searchCriteria.name = { $regex: query, $options: "i" };
    }

    const total = await Organization.countDocuments(searchCriteria);
    const organizations = await Organization.find(searchCriteria)
      .skip(skip)
      .limit(limit)
      .select("_id name");

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ organizations, total, totalPages, currentPage: page }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET search organizations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
