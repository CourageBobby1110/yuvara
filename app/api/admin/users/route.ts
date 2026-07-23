import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user?.role !== "admin" && session.user?.role !== "worker")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const users = await User.find({}).sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();

    // Only admins can update roles
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, role, password } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const envPassword = process.env.ROLE_UPDATE_PASSWORD || process.env.UPDATE_ROLE_PASSWORD;
    if (!envPassword) {
      return NextResponse.json(
        { error: "Role update password is not configured on the server." },
        { status: 500 }
      );
    }

    if (password !== envPassword) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
    }

    // Validate role
    if (!["user", "admin", "worker"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await dbConnect();
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();

    // Only admins can delete users
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, password } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (userId === session.user?.id) {
      return NextResponse.json(
        { error: "You cannot delete your own admin account." },
        { status: 400 }
      );
    }

    const envPassword = process.env.USER_DELETE_PASSWORD || process.env.DELETE_USER_PASSWORD;
    if (!envPassword) {
      console.error("[DELETE /api/admin/users] USER_DELETE_PASSWORD is not set in process.env");
      return NextResponse.json(
        { error: "User delete password is not configured on the server." },
        { status: 500 }
      );
    }

    if ((password || "").trim() !== envPassword.trim()) {
      console.warn("[DELETE /api/admin/users] Password mismatch");
      return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
    }

    await dbConnect();
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
