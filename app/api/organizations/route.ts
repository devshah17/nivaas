import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Organization from "@/models/Organization";
import { verifyToken } from "@/lib/auth";
import crypto from "crypto";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const organizations = await Organization.find({
      "members.user": user.userId as string,
    }).lean().populate("creator", "name email");

    // Mask other members or specific fields if needed
    // But for listing, this is fine
    return NextResponse.json({ organizations }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET organizations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    await connectToDatabase();

    const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    const newOrg = await Organization.create({
      name,
      creator: user.userId as string,
      inviteCode,
      members: [
        {
          user: user.userId as string,
          role: "admin",
          status: true,
        },
      ],
    });

    return NextResponse.json({ message: "Organization created", organization: newOrg }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST organizations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
