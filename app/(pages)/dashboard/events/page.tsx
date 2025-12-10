"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  apiKey: string;
}

interface TrackedUser {
  externalId: string;
}

interface Event {
  id: string;
  eventName: string;
  occurredAt: Date;
  properties: any;
  trackedUser: TrackedUser;
}

export default function EventsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectParam = searchParams.get("project");

  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const [eventFilter, setEventFilter] = useState<string>("");

  // Calculate filtered events
  const filteredEvents = events.filter(
    (event) =>
      eventFilter === "" ||
      event.eventName.toLowerCase().includes(eventFilter.toLowerCase())
  );

  // Get unique event names for the selected project (optional dropdown)
  const eventNames = [
    ...new Set(events.map((event) => event.eventName)),
  ].sort();

  // Update these calculations to use filteredEvents instead of events
  const totalEvents = filteredEvents.length;

  const uniqueUsers = new Set(
    filteredEvents.map((event) => event.trackedUser.externalId)
  ).size;

  const lastEventTime =
    filteredEvents.length > 0
      ? new Date(
          Math.max(
            ...filteredEvents.map((e) => new Date(e.occurredAt).getTime())
          )
        )
      : null;

  // Format time ago
  const formatTimeAgo = (date: Date | null) => {
    if (!date) return "Never";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Fetch all projects on component mount
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.status}`);
        }
        const data = await response.json();
        setProjects(data);

        // Set initial selected project
        const initialProjectId = projectParam || data[0]?.id || "";
        setSelectedProjectId(initialProjectId);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    }

    fetchProjects();
  }, []);

  // Fetch events when selected project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    async function fetchEvents() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/events?project=${selectedProjectId}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.status}`);
        }
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [selectedProjectId]);

  // Handle project selection change
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjectId = e.target.value;
    setSelectedProjectId(newProjectId);

    // Update URL with the new project ID
    const params = new URLSearchParams();
    if (newProjectId) {
      params.set("project", newProjectId);
    }
    router.push(`/dashboard/events?${params.toString()}`);
  };

  return (
    <div className="p-6 text-gray-900">
      <h1 className="text-2xl font-bold mb-4">Events Explorer</h1>

      {/* Project selector */}
      <div className="mb-6">
        <label className="text-sm font-medium mr-2">Project:</label>
        <select
          name="project"
          value={selectedProjectId}
          onChange={handleProjectChange}
          className="border rounded px-2 py-1"
          disabled={projects.length === 0}
        >
          {projects.length === 0 ? (
            <option value="">Loading projects...</option>
          ) : (
            projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Event name filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Filter by Event:</label>
          <input
            type="text"
            placeholder="e.g., page_view, button_click"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="border rounded px-3 py-1 text-sm flex-grow max-w-xs"
          />
          {eventFilter && (
            <button
              onClick={() => setEventFilter("")}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
        {eventNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-xs text-gray-500 mr-2">Quick filters:</span>
            {eventNames.slice(0, 5).map((eventName) => (
              <button
                key={eventName}
                onClick={() => setEventFilter(eventName)}
                className={`text-xs px-2 py-1 rounded-full ${
                  eventFilter === eventName
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {eventName}
              </button>
            ))}
            {eventNames.length > 5 && (
              <span className="text-xs text-gray-400">
                +{eventNames.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Metrics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-gray-800">
        {/* Total Events Card */}
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Events</p>
              <p className="text-2xl font-bold mt-1">
                {loading ? "..." : totalEvents.toLocaleString()}
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
          <p className="text-xs text-gray-400 mt-2">
            {eventFilter
              ? `Filtered by: ${eventFilter}`
              : "Events captured in the last 50"}
          </p>
        </div>

        {/* Unique Users Card */}
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unique Users</p>
              <p className="text-2xl font-bold mt-1">
                {loading ? "..." : uniqueUsers.toLocaleString()}
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
          <p className="text-xs text-gray-400 mt-2">
            {eventFilter
              ? "Distinct users in filtered events"
              : "Distinct users with events"}
          </p>
        </div>

        {/* Last Event Time Card */}
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Last Event</p>
              <p className="text-2xl font-bold mt-1">
                {loading
                  ? "..."
                  : lastEventTime
                  ? formatTimeAgo(lastEventTime)
                  : "Never"}
              </p>
              {lastEventTime && (
                <p className="text-xs text-gray-500 mt-1">
                  {lastEventTime.toLocaleString()}
                </p>
              )}
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {eventFilter
              ? "Most recent filtered event"
              : "Time since last event"}
          </p>
        </div>
      </div>

      {/* Events Summary */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          Recent Events{" "}
          {filteredEvents.length > 0 && `(${filteredEvents.length})`}
        </h2>
        <div className="flex items-center gap-4">
          {eventFilter && (
            <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
              Filter: "{eventFilter}" ({filteredEvents.length} events)
            </div>
          )}
          {eventNames.length > 0 && !eventFilter && (
            <div className="text-sm text-gray-500">
              {eventNames.length} unique event types
            </div>
          )}
          {!loading && filteredEvents.length > 0 && (
            <span className="text-sm text-gray-500">
              Showing {Math.min(filteredEvents.length, 50)} events
            </span>
          )}
        </div>
      </div>

      {/* Events table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Event</th>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Time</th>
              <th className="px-4 py-3 text-left font-medium">Properties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && events.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                    Loading events...
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{event.eventName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {event.trackedUser.externalId}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">
                        {new Date(event.occurredAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.occurredAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs bg-gray-50 p-2 rounded max-w-md truncate">
                        {JSON.stringify(event.properties)}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredEvents.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center text-gray-400">
                        <svg
                          className="w-12 h-12 mb-2"
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
                        <p className="text-lg font-medium">
                          {eventFilter
                            ? "No events match your filter"
                            : "No events found"}
                        </p>
                        <p className="text-sm">
                          {eventFilter
                            ? "Try a different event name"
                            : "Start tracking events to see them here"}
                        </p>
                        {eventFilter && (
                          <button
                            onClick={() => setEventFilter("")}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            Clear filter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
