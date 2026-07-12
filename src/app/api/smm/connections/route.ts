import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { encryptToken } from "@/lib/encryption";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    let client = null;

    if (session && session.user?.id) {
      // Verify user has access to this client
      const userRole = session.user.role;
      const isSuperAdmin = userRole === "SUPER_ADMIN";
      const isAgencyOwner = userRole === "AGENCY_OWNER";

      client = await prisma.client.findFirst({
        where: {
          id: clientId,
          OR: isSuperAdmin ? undefined : [
            { userId: session.user.id },
            { smmAssignedUsers: { some: { id: session.user.id } } }
          ]
        }
      });
    } else {
      // Unauthenticated access from client self-onboarding link
      client = await prisma.client.findFirst({
        where: {
          id: clientId,
          status: "ACTIVE"
        }
      });
    }

    if (!client) {
      return NextResponse.json({ error: "Client not found or access denied" }, { status: 404 });
    }

    const accounts = await prisma.socialAccount.findMany({
      where: { clientId },
      orderBy: { platform: "asc" }
    });

    // Mask access tokens for security
    const sanitizedAccounts = accounts.map(acc => ({
      ...acc,
      accessToken: acc.accessToken ? "••••••••••••••••" : null
    }));

    return NextResponse.json({ data: sanitizedAccounts });
  } catch (error: any) {
    console.error("GET SMM Connections Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId, platform, accountId, accountName, accessToken, avatarUrl, status } = body;

    if (!clientId || !platform || !accountId || !accountName) {
      return NextResponse.json({ error: "Missing required fields: clientId, platform, accountId, and accountName are required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    let client = null;

    if (session && session.user?.id) {
      // Verify access to client
      client = await prisma.client.findFirst({
        where: {
          id: clientId,
          OR: session.user.role === "SUPER_ADMIN" ? undefined : [
            { userId: session.user.id },
            { smmAssignedUsers: { some: { id: session.user.id } } }
          ]
        }
      });
    } else {
      // Unauthenticated access from client self-onboarding link
      client = await prisma.client.findFirst({
        where: {
          id: clientId,
          status: "ACTIVE"
        }
      });
    }

    if (!client) {
      return NextResponse.json({ error: "Client not found or access denied" }, { status: 404 });
    }

    const encryptedTokenVal = accessToken ? encryptToken(accessToken) : encryptToken("simulated_mock_token_12345");

    const account = await prisma.socialAccount.upsert({
      where: {
        platform_accountId: {
          platform,
          accountId
        }
      },
      update: {
        accountName,
        accessToken: encryptedTokenVal,
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(accountName)}`,
        status: status || "CONNECTED",
        clientId
      },
      create: {
        clientId,
        platform,
        accountId,
        accountName,
        accessToken: encryptedTokenVal,
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(accountName)}`,
        status: status || "CONNECTED"
      }
    });

    return NextResponse.json({ data: { ...account, accessToken: "••••••••••••••••" } }, { status: 201 });
  } catch (error: any) {
    console.error("POST SMM Connection Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clientId = searchParams.get("clientId");

    if (!id) {
      return NextResponse.json({ error: "Connection ID is required" }, { status: 400 });
    }

    // Verify ownership
    const account = await prisma.socialAccount.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!account) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    let allowed = false;

    if (session && session.user?.id) {
      // Allow owner, super admin, or assigned user to disconnect
      const userRole = session.user.role;
      const isSuperAdmin = userRole === "SUPER_ADMIN";
      const isAgencyOwner = userRole === "AGENCY_OWNER";
      
      if (isSuperAdmin || isAgencyOwner || account.client.userId === session.user.id) {
        allowed = true;
      } else {
        const assigned = await prisma.client.findFirst({
          where: {
            id: account.clientId,
            smmAssignedUsers: { some: { id: session.user.id } }
          }
        });
        if (assigned) allowed = true;
      }
    } else {
      // Unauthenticated access from client self-onboarding link
      if (clientId && clientId === account.clientId && account.client.status === "ACTIVE") {
        allowed = true;
      }
    }

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden: Access denied to client workspace" }, { status: 403 });
    }

    await prisma.socialAccount.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Social account disconnected successfully" });
  } catch (error: any) {
    console.error("DELETE SMM Connection Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
