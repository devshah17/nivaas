import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { sendMail } from "@/lib/mail/sendMail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectToDatabase();
    const emailString = String(email).toLowerCase();
    const user = await User.findOne({ email: emailString });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpAttempts = 0;
    await user.save();

    try {
      await sendMail({
        subject: "Password Reset OTP - Nivaas",
        to: user.email,
        templateName: "NivaasOTP",
        replacements: { name: user.name, otp },
        consoleMessage: `Forgot password OTP email sent to ${user.email}`,
      });
    } catch (emailError) {
      console.log("Error sending OTP email:", emailError);
    }

    return NextResponse.json({ message: "OTP sent to email" }, { status: 200 });
  } catch (error: unknown) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
