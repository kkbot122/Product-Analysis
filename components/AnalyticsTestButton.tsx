"use client";

import { useEffect } from "react";
import { init, identify, track } from "@/lib/analytics-sdk";

export function AnalyticsTestButton({
  apiKey,
}: {
  apiKey: string;
}) {
  useEffect(() => {
    init(apiKey, {
      debug: true,
      // Optional: override if your API is on a different domain
      // endpoint: "http://localhost:3000/api/events",
    });

    // Hard-coded user for now
    identify("test_user_123");
  }, [apiKey]);

  return (
    <button
      onClick={() =>
        track("test_button_clicked", {
          source: "AnalyticsTestButton",
        })
      }
      className="px-4 py-2 rounded bg-blue-600 text-white text-sm"
    >
      Send test event
    </button>
  );
}
