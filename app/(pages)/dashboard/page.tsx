// dashboard/page.tsx (NEW - main dashboard content)
export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
      <p className="mt-4 text-gray-600">
        Welcome to your product analytics dashboard. Select a section from the sidebar to begin.
      </p>
      
      {/* Add your dashboard widgets/kpis here */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="font-semibold text-gray-800">Quick Stats</h3>
          <p className="mt-2 text-sm text-gray-600">Your dashboard overview will appear here.</p>
        </div>
        {/* Add more widgets as needed */}
      </div>
    </div>
  );
}