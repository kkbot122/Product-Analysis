import { prisma } from "@/lib/prisma";

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { occurredAt: "desc" },
    take: 50,
    include: {
      trackedUser: true,
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Events Explorer</h1>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">Event</th>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-left">Properties</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t">
                <td className="px-3 py-2">{event.eventName}</td>
                <td className="px-3 py-2">{event.trackedUser.externalId}</td>
                <td className="px-3 py-2">
                  {event.occurredAt.toLocaleString()}
                </td>
                <td className="px-3 py-2 font-mono text-xs max-w-md truncate">
                  {JSON.stringify(event.properties)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
