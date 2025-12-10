// app/(pages)/dashboard/projects/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  Loader2, 
  Activity,
  Key,
  Copy,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

// Define the Project type based on your API response
interface Project {
  id: string;
  name: string;
  description?: string;
  apiKeyPreview: string;
  status: string;
  teamSize: number;
  createdAt: string;
  lastUpdated: string;
  eventCount: number;
  userCount: number;
  progress: number;
  color: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  planning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'on-hold': 'bg-red-100 text-red-800 border-red-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
};

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'planning', label: 'Planning' },
];

// Modal component for creating new project
function CreateProjectModal({ isOpen, onClose, onProjectCreated }: {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create project');
      }

      const newProject = await response.json();
      onProjectCreated(newProject);
      onClose();
      setName('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 text-gray-900">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Create New Project</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g., Website Analytics"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Describe what this project is for..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="text-red-500 mt-0.5" size={16} />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// API Key Display Component
function ApiKeyDisplay({ apiKeyPreview }: { apiKeyPreview: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKeyPreview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <Key size={14} className="text-gray-400" />
      <code className="text-xs font-mono text-gray-600">{apiKeyPreview}</code>
      <button
        onClick={handleCopy}
        className="ml-auto p-1 hover:bg-gray-200 rounded transition-colors"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check size={14} className="text-green-600" />
        ) : (
          <Copy size={14} className="text-gray-400" />
        )}
      </button>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState<string | null>(null);

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/projects');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProjects(data);
      setFilteredProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Apply filters whenever search or status changes
  useEffect(() => {
    if (!projects.length) return;

    const filtered = projects.filter(project => {
      const matchesSearch = 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
      
      return matchesSearch && matchesStatus;
    });

    setFilteredProjects(filtered);
  }, [searchTerm, selectedStatus, projects]);

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    setFilteredProjects(prev => [newProject, ...prev]);
  };

  const handleCopyApiKey = async (apiKey: string, projectId: string) => {
    try {
      // In a real app, you'd fetch the full API key from your backend
      // For now, we'll just copy the preview
      await navigator.clipboard.writeText(apiKey);
      setCopiedApiKey(projectId);
      setTimeout(() => setCopiedApiKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Calculate stats
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    totalEvents: projects.reduce((sum, p) => sum + p.eventCount, 0),
    totalUsers: projects.reduce((sum, p) => sum + p.userCount, 0),
  };

  return (
    <div className="p-6 md:p-8 text-gray-900">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="mt-2 text-gray-600">
              Manage and track all your analytics projects
            </p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>

        {/* Stats Overview */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Projects</div>
                <div className="text-2xl font-bold mt-1">{stats.totalProjects}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Activity className="text-blue-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Active Projects</div>
                <div className="text-2xl font-bold mt-1">{stats.activeProjects}</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Activity className="text-green-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Events</div>
                <div className="text-2xl font-bold mt-1">{stats.totalEvents.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Activity className="text-purple-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Tracked Users</div>
                <div className="text-2xl font-bold mt-1">{stats.totalUsers.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Users className="text-orange-600" size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search projects by name or description..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <button
                key={status.value}
                onClick={() => setSelectedStatus(status.value)}
                className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  selectedStatus === status.value
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <Loader2 className="animate-spin mx-auto text-blue-600" size={32} />
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="text-red-500" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load projects</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">{error}</p>
          <button
            onClick={fetchProjects}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group"
              >
                <div className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full">
                  {/* Project header with color indicator */}
                  <div className={`h-2 ${project.color}`} />
                  
                  <div className="p-6">
                    {/* Project title and status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <Link href={`/dashboard/projects/${project.id}`}>
                          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {project.name}
                          </h3>
                        </Link>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {project.description}
                        </p>
                      </div>
                      <Link href={`/dashboard/projects/${project.id}`}>
                        <ArrowUpRight className="text-gray-400 group-hover:text-blue-500 transition-colors" size={20} />
                      </Link>
                    </div>

                    {/* Status badge */}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}>
                      {project.status}
                    </span>

                    {/* API Key */}
                    <div className="mt-4">
                      <ApiKeyDisplay apiKeyPreview={project.apiKeyPreview} />
                    </div>

                    {/* Project stats */}
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{project.eventCount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 mt-1">Events</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{project.userCount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 mt-1">Users</div>
                      </div>
                    </div>

                    {/* Project metadata */}
                    <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>
                          {format(new Date(project.lastUpdated), 'MMM d, yyyy')}
                        </span>
                      </div>
                      
                      <Link 
                        href={`/dashboard/projects/${project.id}`}
                        className="text-gray-400 group-hover:text-blue-500 transition-colors flex items-center gap-1"
                      >
                        View analytics
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredProjects.length === 0 && !loading && !error && (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                {searchTerm || selectedStatus !== 'all'
                  ? 'No projects match your search criteria. Try adjusting your filters.'
                  : 'You haven\'t created any projects yet. Get started by creating your first project!'}
              </p>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                Create Your First Project
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      {/* Create Project Button (mobile) */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}