"use client";

import { useRouter, useSearchParams } from "next/navigation";

const RANGES = [7, 30, 90];

export default function TimeRangeSelector({
  selected,
}: {
  selected: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setRange(days: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", String(days));
    router.push(`/dashboard/analytics?${params.toString()}`);
  }

  return (
    <div className="flex gap-2">
      {RANGES.map((days) => (
        <button
          key={days}
          onClick={() => setRange(days)}
          className={`px-3 py-1 rounded text-sm border ${
            selected === days
              ? "bg-black text-white"
              : "bg-white text-gray-700"
          }`}
        >
          {days}d
        </button>
      ))}
    </div>
  );
}
