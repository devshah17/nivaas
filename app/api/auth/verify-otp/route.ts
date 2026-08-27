import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Please provide email and OTP" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const emailString = String(email).toLowerCase();
    const user = await User.findOne({ email: emailString });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "User is already verified" },
        { status: 400 }
      );
    }

    if (user.otpAttempts && user.otpAttempts >= 3) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new OTP." },
        { status: 429 }
      );
    }

    if (String(user.otp) !== String(otp)) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      );
    }

    if (user.otpExpiry && new Date(user.otpExpiry).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "OTP expired" },
        { status: 400 }
      );
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    await user.save();

    const token = await signToken({ userId: user._id.toString(), email: user.email });

    const response = NextResponse.json(
      { message: "OTP verified successfully", user: { id: user._id, name: user.name, email: user.email } },
      { status: 200 }
    );

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
