import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, otp, password } = await req.json();

    if (!email || !otp || !password) {
      return NextResponse.json(
        { error: "Please provide email, OTP, and new password" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const emailString = String(email).toLowerCase();
    const user = await User.findOne({ email: emailString });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (String(user.otp) !== String(otp)) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (user.otpExpiry && new Date(user.otpExpiry).getTime() < Date.now()) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password), salt);

    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    
    // Also verify them if they weren't verified already
    if (!user.isVerified) {
      user.isVerified = true;
    }

    await user.save();

    const token = await signToken({ userId: user._id.toString(), email: user.email });

    const response = NextResponse.json(
      { message: "Password reset successfully", user: { id: user._id, name: user.name, email: user.email } },
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
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
