import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Organization from "@/models/Organization";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const adminUser = await verifyToken(token);
    if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, email, phoneNumber } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    await connectToDatabase();
    
    const organization = await Organization.findById(id);
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const memberData = (organization.members as { user: { toString: () => string }; role: string; status: boolean }[]).find(m => m.user.toString() === adminUser.userId);
    if (!memberData || memberData.role !== "admin" || memberData.status !== true) {
      return NextResponse.json({ error: "Only admins can add members directly" }, { status: 403 });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Create an unverified user
      const tempPassword = await bcrypt.hash("temp_" + Math.random().toString(36).slice(2), 10);
      user = await User.create({
        name,
        email: email.toLowerCase(),
        phoneNumber,
        password: tempPassword,
        isVerified: false
      });
    } else if (phoneNumber && !user.phoneNumber) {
      // Optionally update phone number if it's missing on existing user
      user.phoneNumber = phoneNumber;
      await user.save();
    }

    const isMember = (organization.members as { user: { toString: () => string } }[]).some(m => m.user.toString() === user._id.toString());
    
    if (isMember) {
      const existingMember = (organization.members as { user: { toString: () => string }; status: boolean }[]).find(m => m.user.toString() === user._id.toString());
      if (existingMember && existingMember.status === true) {
        return NextResponse.json({ error: "User is already an active member" }, { status: 400 });
      } else {
        // Approve pending request automatically
        if (existingMember) existingMember.status = true;
      }
    } else {
      // Add new member directly
      organization.members.push({
        user: user._id as unknown as mongoose.Types.ObjectId,
        role: "member",
        status: true,
      });
    }

    await organization.save();

    return NextResponse.json({ message: "Member added successfully", user: { _id: user._id, name: user.name, email: user.email, isVerified: user.isVerified } }, { status: 200 });
  } catch (error: unknown) {
    console.error("POST add member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
