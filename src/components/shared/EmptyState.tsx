"use client";

import { LucideIcon } from "lucide-react";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="h-12 w-12 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-3">
          <Icon className="h-5 w-5 text-[#9CA3AF]" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-black">{title}</h3>
      {description && (
        <p className="text-sm text-[#6B7280] mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
