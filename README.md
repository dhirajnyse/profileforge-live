# ProfileForge

Static GitHub Pages app for converting PDF CVs into Excel profile workbooks.

## What It Does

- Runs fully in the browser.
- Accepts multiple PDF CVs or a folder of PDFs.
- Creates individual `.xlsx` profile files.
- Optionally creates one combined workbook with one sheet per PDF.
- Sets generated Excel output to Calibri 10.
- Sets every profile sheet to print as A4 portrait, fit to 1 page wide by 1 page tall, with print area `A1:C13`.

## GitHub Pages

Publish this folder as the root of a GitHub repository. The included workflow deploys the site to GitHub Pages on every push to `main`.

No backend server is required.
