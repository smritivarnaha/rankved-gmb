import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/backup — List stored backups OR trigger an export
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session as any).user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only SUPER_ADMIN can manage backups." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "export") {
    try {
      // Fetch everything
      const clients = await prisma.client.findMany();
      const locations = await prisma.location.findMany();
      const posts = await prisma.post.findMany();
      const promptTemplates = await prisma.promptTemplate.findMany();

      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        data: {
          clients,
          locations,
          posts,
          promptTemplates,
        }
      };

      // Create a record in DB as well
      const backupRecord = await prisma.backup.create({
        data: {
          name: `Backup_${new Date().toISOString().replace(/[:.]/g, "-")}`,
          data: backupData as any,
        }
      });

      return NextResponse.json({ success: true, backup: backupRecord });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Default: list backups
  const backups = await prisma.backup.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true } // Don't return huge JSON in the list
  });

  return NextResponse.json({ data: backups });
}

// POST /api/backup — Restore data from a JSON body or an existing backup ID
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session as any).user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only SUPER_ADMIN can manage backups." }, { status: 403 });
  }

  try {
    const body = await req.json();
    let backupData = body.data;

    // If only an ID was passed, fetch from DB
    if (body.backupId) {
      const record = await prisma.backup.findUnique({ where: { id: body.backupId } });
      if (!record) return NextResponse.json({ error: "Backup not found" }, { status: 404 });
      backupData = (record.data as any).data;
    }

    if (!backupData) return NextResponse.json({ error: "No backup data provided" }, { status: 400 });

    const { clients, locations, posts, promptTemplates } = backupData;

    // Restore strategy: Skip if exists (Non-destructive)
    let skippedCount = 0;
    let restoredCount = 0;

    // 1. Clients
    if (clients?.length) {
      for (const c of clients) {
        const existing = await prisma.client.findUnique({ where: { id: c.id } });
        if (!existing) {
          await prisma.client.create({ data: { ...c } });
          restoredCount++;
        } else {
          skippedCount++;
        }
      }
    }

    // 2. Locations (Profiles)
    if (locations?.length) {
      for (const l of locations) {
        try {
          const existing = await prisma.location.findUnique({ where: { id: l.id } });
          if (!existing) {
            await prisma.location.create({ data: { ...l } });
            restoredCount++;
          } else {
            skippedCount++;
          }
        } catch (err) {
          console.error(`Failed to restore location ${l.name}:`, err);
        }
      }
    }

    // 3. Posts
    if (posts?.length) {
      for (const p of posts) {
        // Only restore if the location exists in DB
        const loc = await prisma.location.findUnique({ where: { id: p.locationId } });
        if (!loc) continue;

        const existing = await prisma.post.findUnique({ where: { id: p.id } });
        if (!existing) {
          await prisma.post.create({ data: { ...p } });
          restoredCount++;
        } else {
          skippedCount++;
        }
      }
    }

    // 4. Prompt Templates
    if (promptTemplates?.length) {
      for (const t of promptTemplates) {
        const existing = await prisma.promptTemplate.findUnique({ where: { id: t.id } });
        if (!existing) {
          await prisma.promptTemplate.create({ data: { ...t } });
          restoredCount++;
        } else {
          skippedCount++;
        }
      }
    }

    return NextResponse.json({ success: true, restoredCount, skippedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/backup — Delete a stored backup
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session as any).user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only SUPER_ADMIN can manage backups." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    await prisma.backup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Special route for exporting/downloading a specific backup's raw JSON
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session as any).user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only SUPER_ADMIN can manage backups." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const record = await prisma.backup.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "Backup not found" }, { status: 404 });

  return NextResponse.json(record.data);
}
