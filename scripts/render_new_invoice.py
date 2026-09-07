import pypdfium2 as pdfium

pdf_path = "/home/z/Downloads/Invoice-INV-20260907-2310.pdf"
out_path = "/home/z/my-project/upload/invoice_new.png"

pdf = pdfium.PdfDocument(pdf_path)
page = pdf[0]
bitmap = page.render(scale=2.0)
img = bitmap.to_pil()
img.save(out_path, "PNG", optimize=True)
print(f"Saved to {out_path}, size={img.size}")
