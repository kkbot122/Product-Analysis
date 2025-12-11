"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    exact: true,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
  },
  {
    label: "Events",
    href: "/dashboard/events",
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-100 border-r px-4 py-6 overflow-y-auto">
      {/* Brand */}
      <div className="mb-8">
        <div className="text-lg font-bold text-gray-900">
          Product Analytics
        </div>
        <div className="text-xs text-gray-500">
          Developer Dashboard
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          let isActive;
          if (item.exact) {
            isActive = pathname === item.href;
          } else {
            const routePattern = new RegExp(`^${item.href}(/|$)`);
            isActive = routePattern.test(pathname);
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-white text-gray-900 border shadow-sm"
                  : "text-gray-600 hover:bg-white hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Optional: Add padding at the bottom to ensure content isn't hidden */}
      <div className="pt-8">
        {/* You can add additional sidebar content here if needed */}
      </div>
    </aside>
  );
}