"use client";

import { Button } from "@/components/ui/button";
import { FileText, Sheet } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onPdf?: () => void | Promise<void>;
  onExcel?: () => void | Promise<void>;
  pdfLabel?: string;
  excelLabel?: string;
}

export function ExportButtons({
  onPdf,
  onExcel,
  pdfLabel = "PDF",
  excelLabel = "Excel",
}: Props) {
  return (
    <div className="flex gap-2">
      {onExcel && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={async () => {
            try {
              await onExcel();
              toast.success("Excel exported");
            } catch (e: any) {
              toast.error(e?.message || "Excel export failed");
            }
          }}
        >
          <Sheet className="h-3.5 w-3.5" />
          {excelLabel}
        </Button>
      )}
      {onPdf && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={async () => {
            try {
              await onPdf();
              toast.success("PDF generated");
            } catch (e: any) {
              toast.error(e?.message || "PDF generation failed");
            }
          }}
        >
          <FileText className="h-3.5 w-3.5" />
          {pdfLabel}
        </Button>
      )}
    </div>
  );
}
