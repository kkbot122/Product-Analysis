import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CopyButton from "@/components/CopyButton";


export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  // IMPORTANT: Await the params Promise
  const { projectId } = await params;

  console.log("✅ Received projectId:", projectId);

  if (!projectId) {
    console.error("❌ No projectId found");
    notFound();
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      organization: true,
      _count: {
        select: {
          events: true,
          trackedUsers: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }
  // Format the API key for display
  const maskedApiKey = `${project.apiKey.substring(
    0,
    8
  )}...${project.apiKey.substring(project.apiKey.length - 4)}`;

  // Recent events for the project
  const recentEvents = await prisma.event.findMany({
    where: { projectId: project.id },
    orderBy: { occurredAt: "desc" },
    take: 10,
    include: {
      trackedUser: true,
    },
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
        <p className="text-gray-500 mt-2">
          Project details and integration instructions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-gray-800">
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Events</p>
              <p className="text-3xl font-bold mt-2">
                {project._count.events.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                ></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unique Users</p>
              <p className="text-3xl font-bold mt-2">
                {project._count.trackedUsers.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0c-.966.028-1.932.044-2.9.044-4.97 0-9-2.239-9-5s4.03-5 9-5c.968 0 1.934.016 2.9.044"
                ></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-xl font-bold mt-2">
                {new Date(project.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(project.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-gray-800">
        {/* Left Column: Project Details */}
        <div className="space-y-8">
          {/* Project Information */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Project Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Project Name
                </label>
                <p className="text-lg font-semibold mt-1">{project.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Project ID
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 text-gray-800 px-3 py-2 rounded font-mono text-sm">
                    {project.id}
                  </code>
                  <CopyButton text={project.id} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Organization
                </label>
                <p className="text-lg font-semibold mt-1">
                  {project.organization.name}
                </p>
              </div>
            </div>
          </div>

          {/* API Key Section */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">API Key</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Use this API key to send events from your application.
                <span className="text-red-500 ml-1">Keep it secret!</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Display Key
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 text-gray-800 px-3 py-2 rounded font-mono text-sm flex-grow">
                    {maskedApiKey}
                  </code>
                  <CopyButton text={maskedApiKey} label="Copy" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Full API Key
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 text-gray-800 px-3 py-2 rounded font-mono text-sm flex-grow truncate">
                    {project.apiKey}
                  </code>
                  <CopyButton text={project.apiKey} />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click to copy the full API key for use in your code
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: SDK Installation */}
        <div className="space-y-8">
          {/* SDK Installation */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">SDK Installation</h2>

            {/* JavaScript/TypeScript */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">
                JavaScript/TypeScript
              </h3>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Install the SDK:</p>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>npm install @analytics/sdk</code>
                  </pre>
                  <CopyButton text="npm install @analytics/sdk" />
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Initialize and track events:
                </p>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {`import { Analytics } from '@analytics/sdk';

const analytics = new Analytics({
  apiKey: '${project.apiKey}',
  endpoint: '${
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  }/api/events'
});

// Track a page view
analytics.track('page_view', {
  userId: 'user_123',
  properties: { path: '/home' }
});

// Track a custom event
analytics.track('button_click', {
  userId: 'user_123',
  properties: { buttonId: 'signup' }
});`}
                  </pre>
                  <CopyButton
                    text={`import { Analytics } from '@analytics/sdk';

const analytics = new Analytics({
  apiKey: '${project.apiKey}',
  endpoint: '${
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  }/api/events'
});`}
                  />
                </div>
              </div>
            </div>

            {/* Direct API Calls */}
            <div>
              <h3 className="text-lg font-medium mb-3">Direct API Calls</h3>
              <p className="text-sm text-gray-600 mb-2">
                Send events directly via HTTP:
              </p>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`// Using fetch
fetch('${
                    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                  }/api/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    api_key: '${project.apiKey}',
    user_id: 'user_123',
    event_name: 'page_view',
    properties: { path: '/' }
  })
});`}
                </pre>
                <CopyButton
                  text={`fetch('${
                    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                  }/api/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    api_key: '${project.apiKey}',
    user_id: 'user_123',
    event_name: 'page_view',
    properties: { path: '/' }
  })
});`}
                />
              </div>
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Recent Events</h2>
            {recentEvents.length > 0 ? (
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{event.eventName}</span>
                        <div className="text-sm text-gray-500">
                          User: {event.trackedUser.externalId}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 text-right">
                        {new Date(event.occurredAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    {event.properties &&
                      Object.keys(event.properties).length > 0 && (
                        <div className="mt-1">
                          <div className="text-xs text-gray-500">
                            Properties:
                          </div>
                          <code className="text-xs bg-gray-50 p-1 rounded truncate block">
                            {JSON.stringify(event.properties)}
                          </code>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                <p>No events tracked yet</p>
                <p className="text-sm">Start sending events to see them here</p>
              </div>
            )}

            {recentEvents.length > 0 && (
              <div className="mt-4 text-center">
                <a
                  href="/dashboard/events"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all events →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
