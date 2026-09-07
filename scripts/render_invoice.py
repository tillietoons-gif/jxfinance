import pypdfium2 as pdfium
import os

pdf_path = "/home/z/my-project/upload/Invoice_INV-2026-0240_2026-08-03.pdf"
out_path = "/home/z/my-project/upload/invoice_reference.png"

pdf = pdfium.PdfDocument(pdf_path)
page = pdf[0]
# render at 2x scale for clarity
bitmap = page.render(scale=2.0)
img = bitmap.to_pil()
img.save(out_path, "PNG", optimize=True)
print(f"Saved to {out_path}, size={img.size}")
