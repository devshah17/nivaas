import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(payload.userId).select("-password");

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
