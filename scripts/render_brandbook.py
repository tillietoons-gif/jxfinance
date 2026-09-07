import pypdfium2 as pdfium
import os

pdf_path = "/home/z/my-project/upload/jacxi_brand_book_by_pomelli.pdf"
out_dir = "/home/z/my-project/upload/brandbook"
os.makedirs(out_dir, exist_ok=True)

pdf = pdfium.PdfDocument(pdf_path)
print(f"Total pages: {len(pdf)}")
for i in range(len(pdf)):
    page = pdf[i]
    bitmap = page.render(scale=2.0)
    img = bitmap.to_pil()
    out_path = f"{out_dir}/page_{i+1}.png"
    img.save(out_path, "PNG", optimize=True)
    print(f"Page {i+1}: {img.size} -> {out_path}")
