import { prisma } from "@/lib/prisma";
import PageViewsChart from "./page-views-chart";
import PageBreakdownTable from "./page-breakdown-table";
import TimeRangeSelector from "./time-range-selector";
import EventBreakdownTable from "./event-breakdown-table";
import FunnelTable from "./funnel-table";
import RetentionTable from "./retention-table";
import KpiRow from "./kpi-row";
import Section from "./section";

// In Next.js 15, searchParams is a Promise
export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; retentionEvent?: string }>;
}) {
  // Await the searchParams Promise first
  const resolvedSearchParams = await searchParams;

  const project = await prisma.project.findFirst();
  if (!project) {
    return <div className="p-6">No project found</div>;
  }

  // Now use resolvedSearchParams
  const range = Number(resolvedSearchParams.range) || 30;
  const retentionEvent =
    resolvedSearchParams.retentionEvent || "signup_completed";

  const since = new Date();
  since.setDate(since.getDate() - range);

  // Define your funnel steps
  const FUNNEL_STEPS = ["page_view", "signup_started", "signup_completed"];

  // Fetch events INCLUDING sessionId
  const events = await prisma.event.findMany({
    where: {
      projectId: project.id,
      occurredAt: { gte: since },
    },
    select: {
      eventName: true,
      occurredAt: true,
      properties: true,
      sessionId: true, // 👈 ADD THIS LINE
      trackedUser: {
        select: {
          id: true,
        },
      },
    },
    orderBy: { occurredAt: "asc" },
  });

  const viewsByDate: Record<string, number> = {};
  const viewsByPath: Record<string, number> = {};
  const eventsByName: Record<string, number> = {};

  // -------- MULTI-STEP FUNNEL --------
  // stepIndex -> Set of users
  const funnelSteps: Record<number, Set<string>> = {};
  const stepTimes: Record<string, Record<number, Date>> = {};

  // Initialize funnel steps
  for (let i = 0; i < FUNNEL_STEPS.length; i++) {
    funnelSteps[i] = new Set();
  }

  // -------- RETENTION BY EVENT --------
  // First occurrence of retention event per user
  const cohortStart: Record<string, Date> = {};

  // Activity map per user (days)
  const activityByUser: Record<string, Set<string>> = {};

  // -------- SESSION ANALYTICS --------
  type Session = {
    start: Date;
    end: Date;
    pages: string[];
  };

  const sessions: Record<string, Session> = {};

  for (const event of events) {
    const userId = event.trackedUser.id;

    // Event breakdown
    eventsByName[event.eventName] = (eventsByName[event.eventName] ?? 0) + 1;

    // Track activity for retention
    const day = event.occurredAt.toISOString().slice(0, 10);
    if (!activityByUser[userId]) {
      activityByUser[userId] = new Set();
    }
    activityByUser[userId].add(day);

    // Track cohort start (only for selected retention event)
    if (event.eventName === retentionEvent && !cohortStart[userId]) {
      cohortStart[userId] = event.occurredAt;
    }

    // Page views tracking
    if (event.eventName === "page_view") {
      const date = event.occurredAt.toISOString().slice(0, 10);
      viewsByDate[date] = (viewsByDate[date] ?? 0) + 1;

      const path =
        typeof event.properties === "object" &&
        event.properties !== null &&
        "path" in event.properties
          ? String((event.properties as any).path)
          : "unknown";

      viewsByPath[path] = (viewsByPath[path] ?? 0) + 1;
    }

    // -------- SESSION TRACKING --------
    if (event.sessionId) {
      if (!sessions[event.sessionId]) {
        sessions[event.sessionId] = {
          start: event.occurredAt,
          end: event.occurredAt,
          pages: [],
        };
      }

      const session = sessions[event.sessionId];
      session.start =
        event.occurredAt < session.start ? event.occurredAt : session.start;
      session.end =
        event.occurredAt > session.end ? event.occurredAt : session.end;

      if (
        event.eventName === "page_view" &&
        event.properties &&
        typeof event.properties === "object" &&
        "path" in event.properties
      ) {
        session.pages.push(String((event.properties as any).path));
      }
    }

    // -------- FUNNEL LOGIC PROCESSING --------
    const stepIndex = FUNNEL_STEPS.indexOf(event.eventName);
    if (stepIndex === -1) continue;

    if (!stepTimes[userId]) {
      stepTimes[userId] = {};
    }

    // Step 0: always allowed (first step in funnel)
    if (stepIndex === 0) {
      if (!stepTimes[userId][0]) {
        stepTimes[userId][0] = event.occurredAt;
        funnelSteps[0].add(userId);
      }
      continue;
    }

    // Step N: must have completed step N-1 first
    const prevTime = stepTimes[userId][stepIndex - 1];
    if (!prevTime) continue;

    if (!stepTimes[userId][stepIndex]) {
      if (event.occurredAt > prevTime) {
        stepTimes[userId][stepIndex] = event.occurredAt;
        funnelSteps[stepIndex].add(userId);
      }
    }
  }

  // ----- Retention calculation -----
  const dayOffsets = [1, 3, 7];
  const cohortUsers = Object.keys(cohortStart);

  const retention = dayOffsets.map((offset) => {
    let retained = 0;

    for (const userId of cohortUsers) {
      const startDate = cohortStart[userId];
      const startDay = startDate.toISOString().slice(0, 10);

      const target = new Date(startDay);
      target.setDate(target.getDate() + offset);
      const targetDay = target.toISOString().slice(0, 10);

      if (activityByUser[userId]?.has(targetDay)) {
        retained++;
      }
    }

    return {
      day: offset,
      retained,
      percentage:
        cohortUsers.length === 0 ? 0 : (retained / cohortUsers.length) * 100,
    };
  });

  // ----- Session analytics calculation -----
  const sessionList = Object.values(sessions);
  const sessionCount = sessionList.length;
  const avgDuration =
    sessionCount === 0
      ? 0
      : sessionList.reduce(
          (sum, session) =>
            sum + (session.end.getTime() - session.start.getTime()),
          0
        ) / sessionCount;
  const avgPages =
    sessionCount === 0
      ? 0
      : sessionList.reduce((sum, session) => sum + session.pages.length, 0) /
        sessionCount;

  // Entry / exit pages
  const entryPages: Record<string, number> = {};
  const exitPages: Record<string, number> = {};

  for (const session of sessionList) {
    if (session.pages.length === 0) continue;

    const entry = session.pages[0];
    const exit = session.pages[session.pages.length - 1];

    entryPages[entry] = (entryPages[entry] ?? 0) + 1;
    exitPages[exit] = (exitPages[exit] ?? 0) + 1;
  }

  // Prepare data for rendering
  const chartData = Object.entries(viewsByDate).map(([date, count]) => ({
    date,
    count,
  }));

  const pagebreakdownData = Object.entries(viewsByPath)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count);

  const eventBreakdownData = Object.entries(eventsByName)
    .map(([eventName, count]) => ({ eventName, count }))
    .sort((a, b) => b.count - a.count);

  // Generate funnel data from multi-step funnel
  const funnelData = FUNNEL_STEPS.map((step, index) => ({
    step,
    users: funnelSteps[index].size,
  }));

  // -------- KPI METRICS --------

  // Total page views
  const totalPageViews = events.filter(
    (e) => e.eventName === "page_view"
  ).length;

  // Conversion rate (funnel)
  const funnelStart = funnelData[0]?.users ?? 0;
  const funnelEnd = funnelData[funnelData.length - 1]?.users ?? 0;

  const conversionRate =
    funnelStart === 0 ? 0 : (funnelEnd / funnelStart) * 100;

  // Day 1 retention
  const day1Retention = retention.find((r) => r.day === 1)?.percentage ?? 0;

  return (
    <div className="p-6 space-y-10 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Product Analytics</h1>
        <TimeRangeSelector selected={range} />
      </div>

      {/* KPI Row */}
      <KpiRow
        kpis={[
          { label: "Sessions", value: sessionCount },
          { label: "Page Views", value: totalPageViews },
          {
            label: "Conversion Rate",
            value: `${conversionRate.toFixed(1)}%`,
          },
          {
            label: "Day-1 Retention",
            value: `${day1Retention.toFixed(1)}%`,
          },
        ]}
      />

      {/* Traffic */}
      <Section
        title="Traffic"
        description="How users arrive and move through your product"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PageViewsChart data={chartData} />
          <PageBreakdownTable data={pagebreakdownData} />
        </div>
      </Section>

      {/* Behavior */}
      <Section
        title="Behavior"
        description="What actions users take inside the product"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EventBreakdownTable data={eventBreakdownData} />
          <FunnelTable data={funnelData} />
        </div>
      </Section>

      {/* Retention */}
      <Section
        title="Retention"
        description="How many users come back after their first activity"
      >
        <RetentionTable cohortSize={cohortUsers.length} data={retention} />
      </Section>
    </div>
  );
}
