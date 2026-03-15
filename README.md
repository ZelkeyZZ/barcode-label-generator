# Barcode Label Generator

Generate printable EAN-13 barcode labels from an 8-digit SKU and prefix CSV.  
Automatically computes the EAN-13 check digit, renders the barcode (JsBarcode), supports CSV auto-reload via the File System Access API (fallback to file input), and provides product name search with pagination.

**Quick demo:** drop your CSV, search product names, click a SKU to render a label, then Print or Download as PNG.

---

## Features

- Load product CSV (File System Access API if available; fallback file picker). :contentReference[oaicite:2]{index=2}  
- CSV format: `SKU,Prefix,ProductName,Color,Size,Season` (see example below).  
- Builds product index for quick product-name search and paginated results.  
- Concatenate `Prefix + SKU`, compute EAN-13 check digit (standard 1/3 alternating weights), and render barcode using **JsBarcode**.  
- Print label (opens a print window) or download label as PNG (via **html2canvas**). :contentReference[oaicite:3]{index=3}  
- Simple, responsive label UI and styles in `main.css`. :contentReference[oaicite:4]{index=4}

---

## CSV format (example)

Create a CSV with a header row. Example:

```csv
SKU,Prefix,ProductName,Color,Size,Season
20178202,8802017,NOVA WHITE,WHITE,10,402
20391024,8802017,MELVIN BLUE,BLUE,9,401
```
