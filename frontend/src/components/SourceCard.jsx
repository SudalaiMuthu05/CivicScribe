import React from "react";
import { ExternalLink, FileText } from "lucide-react";

export default function SourceCard({ title, source, source_url }) {
  return (
    <div className="rounded-md border border-line bg-paper p-4">
      <div className="flex items-start gap-3">
        <FileText size={16} className="mt-0.5 shrink-0 text-ink-500" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-snug text-ink-900">{title}</p>
          <p className="mt-0.5 text-[13px] text-ink-500">{source}</p>
          {source_url && (
            <a
              href={source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:text-accent-dark"
            >
              View source
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
