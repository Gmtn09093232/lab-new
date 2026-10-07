# Material Testing Laboratory — Report & Analysis System

A complete, professional web application for material testing laboratories. Built with **HTML5**, **CSS3**, and **Vanilla JavaScript** (no frameworks). Data is stored in the browser via `localStorage`.

## Project Structure

```
material-testing-laboratory/
├── index.html    # Application layout, forms, navigation
├── style.css     # Professional laboratory UI + print styles
├── app.js        # All logic, calculations, storage, charts
└── README.md     # This file
```

## Installation / How to Run

1. Download or clone the project folder.
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari).
3. No build step, server, or package manager is required.
4. Chart.js is loaded from CDN for graphs.

**Optional:** Serve via a local static server if preferred:

```bash
npx serve .
# or
python -m http.server 8080
```

## Quick Start

1. Open the application.
2. Go to **Settings → Load Demo Data** to populate sample materials and test results (clearly labelled DEMO).
3. Explore **Dashboard**, **Samples**, each test module, **Reports**, and **History**.

## Workflow

1. **Register Sample** — Samples page → New Sample (auto Report No. & Sample ID).
2. **Select requested tests** (UTM, Composition, Hardness, etc.).
3. **Enter test data** in the corresponding module, linked by Sample ID.
4. **Calculate** results (buttons on each form).
5. **Compare** against user-entered specification limits → PASS / FAIL / NOT SPECIFIED.
6. **Generate Report** — Reports page → select sample → Generate → Print / Save as PDF.
7. **Search & manage** history (View / Edit / Delete).

## Supported Tests

| Module | Capabilities |
|--------|--------------|
| **UTM** | Tensile & compression; round/rectangular; YS, UTS, %El, %RA; Load–Extension & Stress–Strain charts |
| **Composition** | Multi-element table; min/max specs; Pass/Fail; comparison bar chart |
| **Hardness** | Brinell, Rockwell B/C, Vickers; avg/min/max/range/std; chart |
| **Microstructure** | Preparation fields; observation notes; image upload (resized, stored as base64) |
| **Impact** | Charpy V/U, Izod; absorbed energy; multi-specimen stats; chart |
| **Surface Roughness** | Ra, Rz, Rq, Rt, Rp, Rv; multi-reading stats; chart |

## Engineering Calculations

### Cross-sectional Area
- Round: \( A = \pi d^2 / 4 \)
- Rectangular: \( A = w \times t \)
- Units: mm²

### Engineering Stress (MPa)
\[
\sigma = \frac{F_{\mathrm{kN}} \times 1000}{A_{\mathrm{mm}^2}}
\]

### Yield Strength / UTS
\[
YS = \frac{P_y}{A_0},\quad UTS = \frac{P_{\max}}{A_0}
\]

### Percentage Elongation
\[
\%El = \frac{L_f - L_0}{L_0} \times 100
\]

### Percentage Reduction of Area
\[
\%RA = \frac{A_0 - A_f}{A_0} \times 100
\]
(where \( A_f \) is from final diameter for round specimens)

### Impact Absorbed Energy
\[
E_{\mathrm{abs}} = E_{\mathrm{initial}} - E_{\mathrm{final}}
\]

### Statistics
Average, minimum, maximum, range, sample standard deviation (n−1).

### Pass/Fail
- Measured ≥ Min Spec **and** Measured ≤ Max Spec → **PASS**
- Otherwise → **FAIL**
- No limits entered → **NOT SPECIFIED**

**Important:** The application does **not** invent standards or automatic compliance. The user enters the applicable standard name and specification limits. Hardness scale conversions (if added later) must be labelled approximate.

## Report Numbers

Format: `MTL-YYYY-NNNN` (prefix configurable in Settings).  
Counter is stored in `localStorage` and never duplicates.

## Data Storage

All data lives in browser `localStorage` under keys:

- `mtl_samples`, `mtl_utm`, `mtl_composition`, `mtl_hardness`
- `mtl_microstructure`, `mtl_impact`, `mtl_roughness`
- `mtl_settings`, `mtl_report_counter`

The `Storage` object in `app.js` is the single abstraction layer. To migrate to **Supabase** (or any backend):

1. Replace `Storage.get` / `Storage.set` with async API calls.
2. Keep the same record shapes.
3. Update UI handlers to `await` the storage methods.
4. No need to rewrite forms, calculations, or report generation.

Example future shape:

```js
async get(key) {
  const { data } = await supabase.from(key).select('*');
  return data || [];
}
```

## Printing / PDF

Use the browser **Print** dialog (or the Print button on the report).  
Print CSS hides navigation and controls, formats for A4, and keeps tables together.  
Choose “Save as PDF” in the print dialog.

## Validation Highlights

- Required fields enforced
- Dimensions and loads must be positive / non-negative as appropriate
- Spec min cannot exceed max
- Unique report numbers
- Meaningful numeric ranges

## Units Supported

| Quantity | Units |
|----------|--------|
| Force | kN (primary), N |
| Stress | MPa |
| Length | mm, μm |
| Hardness | HB, HRB, HRC, HV |
| Energy | J |
| Roughness | μm |

## Future Improvements

- Backend (Supabase / Firebase) for multi-user and cloud sync
- User authentication and role-based access
- PDF generation via jsPDF or server-side
- Hardness conversion tables (clearly marked approximate)
- CSV / Excel import–export
- Digital signatures
- Audit trail / version history
- Offline PWA support
- Multi-language UI

## Browser Compatibility

Modern evergreen browsers (Chrome, Firefox, Edge, Safari).  
Requires JavaScript enabled and sufficient `localStorage` quota (images are resized before storage).

## License

Provided as a complete working example for laboratory use and education.  
Adapt and extend as needed for your organisation.

---

**Material Testing Laboratory v1.0** — Professional engineering calculations, clear separation of measured / calculated / specification data, and print-ready reports.
