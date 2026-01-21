"use client";

import { useState } from "react";
import { ThumbsUp, MessageSquare, Search, RefreshCw } from "lucide-react";

interface Activity {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  action: string;
  timestamp: string;
  content?: React.ReactNode;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const [activeTab, setActiveTab] = useState<"post" | "poll" | "question">("post");
  const [comment, setComment] = useState("");

  return (
    <div className="sf-card">
      {/* Composer */}
      <div className="p-4 border-b border-[#dddbda]">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab("post")}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === "post"
                ? "bg-[#0176d3] text-white"
                : "text-[#706e6b] hover:bg-gray-100"
            }`}
          >
            Post
          </button>
          <button
            onClick={() => setActiveTab("poll")}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === "poll"
                ? "bg-[#0176d3] text-white"
                : "text-[#706e6b] hover:bg-gray-100"
            }`}
          >
            Poll
          </button>
          <button
            onClick={() => setActiveTab("question")}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === "question"
                ? "bg-[#0176d3] text-white"
                : "text-[#706e6b] hover:bg-gray-100"
            }`}
          >
            Question
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Share an update..."
            className="sf-input flex-1"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button className="sf-btn-brand">Share</button>
        </div>
      </div>

      {/* Search and refresh */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#dddbda]">
        <div className="flex items-center gap-2">
          <button className="text-sm text-[#706e6b]">Sort</button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search this feed..."
              className="pl-8 pr-3 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <button className="p-1 hover:bg-gray-100 rounded">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Activity list */}
      <div className="divide-y divide-[#dddbda]">
        {activities.map((activity) => (
          <div key={activity.id} className="p-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#032d60] rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                {activity.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <a href="#" className="text-[#0176d3] font-medium hover:underline">
                    {activity.user.name}
                  </a>{" "}
                  <span className="text-[#706e6b]">{activity.action}</span>
                </p>
                <p className="text-xs text-[#939393] mt-0.5">{activity.timestamp}</p>
                {activity.content && (
                  <div className="mt-3">{activity.content}</div>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <button className="flex items-center gap-1 text-sm text-[#706e6b] hover:text-[#0176d3]">
                    <ThumbsUp className="w-4 h-4" />
                    Like
                  </button>
                  <button className="flex items-center gap-1 text-sm text-[#706e6b] hover:text-[#0176d3]">
                    <MessageSquare className="w-4 h-4" />
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comment input */}
      <div className="p-4 border-t border-[#dddbda]">
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
          <input
            type="text"
            placeholder="Write a comment..."
            className="sf-input flex-1"
          />
        </div>
      </div>
    </div>
  );
}
