"use client";

import { Upload, ChevronDown } from "lucide-react";

interface FileUploadProps {
  files: Array<{ id: string; name: string; url: string }>;
  onUpload?: (files: FileList) => void;
}

export function FileUpload({ files, onUpload }: FileUploadProps) {
  return (
    <div className="sf-card mb-4">
      <div className="sf-card-header">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Files ({files.length})</span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>
      <div className="sf-card-body">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <button className="sf-btn-neutral">
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </button>
          <p className="text-sm text-[#706e6b] mt-2">Or drop files</p>
        </div>
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file) => (
              <a
                key={file.id}
                href={file.url}
                className="block text-sm text-[#0176d3] hover:underline"
              >
                {file.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
