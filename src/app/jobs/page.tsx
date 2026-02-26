"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, Search, ChevronDown, Plus } from "lucide-react";

interface Job {
  id: string;
  jobName: string;
  status: string;
  type: string | null;
  contractType: string | null;
  dueDate: string | null;
  customer: { id: string; name: string } | null;
  premises: { id: string; address: string } | null;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      // Use SQL Server direct connection
      const response = await fetch("/api/sqlserver/jobs");
      if (response.ok) {
        const result = await response.json();
        // Map SQL Server response to expected format
        const mappedJobs = (result.data || []).map((job: any) => ({
          id: job.id,
          externalId: job.jobNumber,
          jobName: job.description || "",
          status: job.status,
          type: job.type,
          premises: job.premises,
          customer: job.customer,
        }));
        setJobs(mappedJobs);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.jobName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.premises?.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-[#dddbda] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="sf-icon-job">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#3e3e3c]">Jobs</h1>
              <p className="text-sm text-[#706e6b]">
                {jobs.length} items • Sorted by Created Date
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="sf-btn-brand">
              <Plus className="w-4 h-4 mr-1" />
              New
            </button>
            <button className="sf-btn-neutral">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search this list..."
              className="sf-input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="px-6">
        <div className="sf-card">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0176d3]"></div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#3e3e3c]">No jobs found</h3>
              <p className="text-sm text-[#706e6b] mt-1">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Jobs will appear here once created or synced"}
              </p>
            </div>
          ) : (
            <table className="sf-table">
              <thead>
                <tr>
                  <th>Job Name</th>
                  <th>Customer</th>
                  <th>Account</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Contract Type</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-[#0176d3] hover:underline font-medium"
                      >
                        {job.jobName}
                      </Link>
                    </td>
                    <td>
                      {job.customer ? (
                        <Link
                          href={`/customers/${job.customer.id}`}
                          className="text-[#0176d3] hover:underline"
                        >
                          {job.customer.name}
                        </Link>
                      ) : (
                        <span className="text-[#939393]">—</span>
                      )}
                    </td>
                    <td>
                      {job.premises ? (
                        <Link
                          href={`/premises/${job.premises.id}`}
                          className="text-[#0176d3] hover:underline"
                        >
                          {job.premises.address}
                        </Link>
                      ) : (
                        <span className="text-[#939393]">—</span>
                      )}
                    </td>
                    <td>{job.status}</td>
                    <td>{job.type || <span className="text-[#939393]">—</span>}</td>
                    <td>{job.contractType || <span className="text-[#939393]">—</span>}</td>
                    <td>
                      {job.dueDate
                        ? new Date(job.dueDate).toLocaleDateString()
                        : <span className="text-[#939393]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
