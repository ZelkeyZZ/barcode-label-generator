# 🏷️ Barcode Label Generator

A high-performance, 100% client-side web utility engineered to generate, format, and print retail-compliant replacement labels for footwear inventory. 

This application features a reactive multi-pane layout separating the active label configuration workshop from a paginated global search index.

---

## 📦 The Origin Story (Built on the Warehouse Floor)

This project was born out of operational necessity during downtime in an inventory fulfillment warehouse. In logistics, shoes frequently require "reboxing" if the original manufacturer's packaging becomes water-damaged, crushed, or torn during transit. When a pair of shoes is migrated to a generic replacement box, the original barcode is lost—creating an un-scannable inventory bottleneck. 

To solve this without needing clunky enterprise warehouse management software, this lightweight utility was built to let floor staff drop an inventory CSV, instantly look up the shoe style, and print a perfect-fit replacement label to slap onto the new box.

---

## ⚡ Technical Highlights

While designed for rapid utility on the warehouse floor, the application features advanced browser API implementations and optimized programmatic architectures:

* **Automated Live Disk Polling:** Leveraging the modern **File System Access API** (`showOpenFilePicker`), the application safely acquires a continuous file handle. It actively monitors the file's metadata (`lastModified` and `size`) via a background interval loop, automatically hot-reloading changes in real-time when the underlying CSV database is updated on disk.
* **Algebraic EAN-13 Check Digit Calculation:** Instead of relying on pre-calculated data strings, the system dynamically concatenates a commercial corporate prefix with an 8-digit unique SKU, passing the array through an algorithmic check routine using alternating structural weights:
  $$\text{sum} = \sum_{i=0}^{11} d_i \times (1 \text{ if } i \text{ is even, else } 3)$$
  $$\text{checksum} = (10 - (\text{sum} \pmod{10})) \pmod{10}$$
  This ensures total compliance with retail hardware scanning systems prior to rendering.
* **Decoupled Print Injection Sandbox:** To prevent local layout breakage during document scaling, the print utility creates an isolated, document-managed window frame on the fly, injection-routing structural styles (`main.css`) alongside the targeted markup for absolute alignment.
* **Clientside Text Indexing & Pagination:** Built to parse massive datasets instantly without exhausting local memory footprints, the search logic generates an internal structural object index, breaking result queries down into precise $5\text{-item}$ visual data groups with responsive forward/backward navigational states.

---

## 📊 Expected CSV Data Schema

The CSV parser reads your localized text structures dynamically. To ensure frictionless indexing, your `.csv` manifest must follow this exact header column alignment:
  ```csv
  SKU,Prefix,ProductName,Color,Size,Season
  20178202,2004,NOVA,WHITE,10,402
  20391024,2044,MELVIN,BLUE,9,401
  ```
---

> ⚠️ Fallback Protocol: If a user’s browser environment does not support high-level File System API loops (e.g., legacy mobile views), the script seamlessly drops back to a standardized HTML5 file stream input listener, throwing temporal status reminders to keep data synchronized safely.

## 📐 Shoe Box Label Anatomy

The CSS grid and rendering structure (main.css) splits the canvas into distinct zones meticulously mapped to fit standard shoe box side profiles:
- Barcode Canvas: Generates high-contrast EAN-13 compliance stripes utilizing dynamic vectors via `JsBarcode`.  
- Left Metadata Stack: Displays localized Product/Model Name, the 8-digit SKU marker, and an oversized Season production tracking signature.  
- Right Inverted Section: Styled with a solid high-contrast black block housing oversized US sizing charts and alpha-numeric color specifications for instant legibility on tall warehouse shelves

## 📂 Production Code Architecture

The implementation relies purely on uncompiled native modules, removing the weight of excessive dependency node layers:

    barcode-label-generator/
    ├── assets/
    │   ├── main.css      # Component layouts, CSS variables, & responsive queries
    │   └── main.js       # Core state engine, file pollers, & calculation matrices
    ├── index.html        # Monolithic structural layout & CDN asset injections
    └── LICENSE           # Open-source MIT distribution terms

🚀 Local Initialization

Because this engine runs entirely on client-side logic without server-side database requirements, execution takes seconds:  
1. Clone the master repository to your operating partition:
    ```bash
   git clone [https://github.com/ZelkeyZZ/barcode-label-generator.git](https://github.com/ZelkeyZZ/barcode-label-generator.git)
2. Launch the deployment workspace directly inside any modern rendering environment:
- Double-click index.html to execute standard operations locally.
- Or host it over a lightweight network stream using Python modules:
    ```bash
     python3 -m http.server 8080
    
---

## 📄 Dependency Acknowledgments

* **JsBarcode** — High-density compliance vector rendering.
* **html2canvas** — Rasterizes high-fidelity HTML DOM matrices cleanly into downloadable PNG structures.
* **Inter Font Family** — System-optimized typography scale configurations.
