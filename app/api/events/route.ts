// app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { api_key, user_id, event_name, properties, timestamp } = body;

    // Validation
    if (!api_key || !user_id || !event_name) {
      return NextResponse.json(
        { error: "api_key, user_id, and event_name are required" },
        { status: 400 }
      );
    }

    // Find project
    const project = await prisma.project.findUnique({
      where: { apiKey: api_key },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    // Create/update user and event in transaction
    await prisma.$transaction(async (tx) => {
      // Upsert tracked user
      const trackedUser = await tx.trackedUser.upsert({
        where: {
          projectId_externalId: {
            projectId: project.id,
            externalId: user_id,
          },
        },
        update: {
          lastSeenAt: new Date(),
        },
        create: {
          projectId: project.id,
          externalId: user_id,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        },
      });

      // Create event
      await tx.event.create({
        data: {
          projectId: project.id,
          trackedUserId: trackedUser.id,
          eventName: event_name,
          properties: properties ?? {},
          occurredAt: timestamp ? new Date(timestamp) : new Date(),
        },
      });
    });

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Event ingestion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}