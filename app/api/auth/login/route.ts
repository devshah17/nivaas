import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/auth";
import { sendMail } from "@/lib/mail/sendMail";

const otpGenerator = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const otpExpiration = (): Date => {
  return new Date(Date.now() + 10 * 60 * 1000);
};

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Please provide email and password" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Select password because it's not selected by default in the model
    const emailString = String(email).toLowerCase();
    const user = await User.findOne({ email: emailString }).select("+password");

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(String(password), user.password!);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      const otp = otpGenerator();
      const otpExpiry = otpExpiration();
      
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.otpAttempts = 0;
      await user.save();

      try {
        await sendMail({
          subject: "OTP Verification - Nivaas",
          to: user.email,
          templateName: "NivaasOTP",
          replacements: { name: user.name, otp },
          consoleMessage: `OTP email sent to ${user.email}`,
        });
      } catch (emailError) {
        console.log("Error sending OTP email:", emailError);
      }

      return NextResponse.json(
        { message: "User not verified. OTP has been sent to your email.", verify: false },
        { status: 200 }
      );
    }

    const token = await signToken({ userId: user._id.toString(), email: user.email });

    const response = NextResponse.json(
      { message: "Login successful", user: { id: user._id, name: user.name, email: user.email } },
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
