// app/api/projects/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            events: true,
            trackedUsers: true,
          },
        },
        events: {
          take: 1,
          orderBy: { occurredAt: 'desc' },
          select: { occurredAt: true },
        },
      },
    });

    // Format the projects for the frontend
    const formattedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      apiKeyPreview: `${project.apiKey.substring(0, 8)}...`,
      status: 'active', // You might want to add status field to your Project model
      teamSize: 1, // Default - you might want to track this separately
      createdAt: project.createdAt,
      lastUpdated: project.events[0]?.occurredAt || project.createdAt,
      eventCount: project._count.events,
      userCount: project._count.trackedUsers,
      progress: 100, // Default - you might want to add this field
      color: getProjectColor(project.id), // Helper function for color
    }));

    return NextResponse.json(formattedProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// Helper function to assign consistent colors based on project ID
function getProjectColor(projectId: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-cyan-500',
  ];
  
  // Simple hash function to get consistent color for same project ID
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// POST endpoint for creating new projects
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    // Generate a unique API key
    const apiKey = `proj_${generateApiKey()}`;

    // For now, get the first organization
    // In a real app, you'd get the org from user session
    const org = await prisma.organization.findFirst();
    
    if (!org) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        apiKey,
        organizationId: org.id,
      },
      include: {
        _count: {
          select: {
            events: true,
            trackedUsers: true,
          },
        },
      },
    });

    // Format the response
    const formattedProject = {
      id: project.id,
      name: project.name,
      apiKeyPreview: `${project.apiKey.substring(0, 8)}...`,
      status: 'active',
      teamSize: 1,
      createdAt: project.createdAt,
      lastUpdated: project.createdAt,
      eventCount: project._count.events,
      userCount: project._count.trackedUsers,
      progress: 100,
      color: getProjectColor(project.id),
    };

    return NextResponse.json(formattedProject, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

// Helper function to generate API key
function generateApiKey(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}