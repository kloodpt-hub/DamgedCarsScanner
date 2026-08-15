import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkCsrf } from "@/lib/csrf";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["USER", "ADMIN"]).optional().default("USER"),
});

const GENERIC_ERROR = "Registration failed. Please try again.";

export async function POST(request: NextRequest) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    let role = parsed.data.role;

    if (role === "ADMIN") {
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        role = "USER";
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    try {
      await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
      });
    } catch (error) {
      // Anti-enumeration: do not reveal whether the email is already in use.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return NextResponse.json({ error: GENERIC_ERROR }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
