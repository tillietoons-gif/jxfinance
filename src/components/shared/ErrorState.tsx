"use client";

import { CircleAlert, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data. Check your connection and try again.",
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-12 w-12 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-center mb-3">
        <CircleAlert className="h-5 w-5 text-[#6B7280]" />
      </div>
      <h3 className="text-sm font-semibold text-black">{title}</h3>
      <p className="text-sm text-[#6B7280] mt-1 max-w-sm">{description}</p>
      {onRetry && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-[#E5E7EB] text-[#374151] hover:border-black hover:bg-black hover:text-white"
            onClick={onRetry}
          >
            <RotateCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
