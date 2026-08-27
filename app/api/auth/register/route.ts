import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { sendMail } from "@/lib/mail/sendMail";

const otpGenerator = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const otpExpiration = (): Date => {
  return new Date(Date.now() + 10 * 60 * 1000);
};

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Please provide all required fields" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const emailString = String(email).toLowerCase();
    const existingUser = await User.findOne({ email: emailString });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password), salt);

    const otp = otpGenerator();
    const otpExpiry = otpExpiration();

    const user = await User.create({
      name: String(name),
      email: emailString,
      password: hashedPassword,
      otp,
      otpExpiry,
      otpAttempts: 0,
      isVerified: false,
    });

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
      // We still return success but maybe log the error
    }

    return NextResponse.json(
      { message: "Registration successful. OTP sent to email.", user: { id: user._id, name: user.name, email: user.email } },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
