# ProfileForge

Static GitHub Pages app for converting PDF CVs into Excel profile workbooks.

## What It Does

- Runs fully in the browser.
- Accepts multiple PDF CVs or a folder of PDFs.
- Lets users manually reorder uploaded PDFs before extraction and Excel generation.
- Creates individual `.xlsx` profile files.
- Optionally creates one combined workbook with one sheet per PDF.
- Can also create a combined workbook where all profiles are stacked vertically or horizontally on one worksheet in upload order.
- Supports a custom `.xlsx` profile template while keeping the built-in template as default.
- Lets users map extracted fields to custom template cells and saves that mapping in the browser.
- Includes an optional review step so extracted profile fields can be edited before Excel generation.
- Adds a Profile Quality Gate during review, with readiness scores and quick checks for fields that need confirmation.
- Adds batch quality metrics and a downloadable QA CSV report for multi-CV review.
- Generates a copyable and downloadable Batch Intelligence Brief with top candidates, role mix, review focus, and duplicate-name warnings.
- Uses a polished office-ready interface with icon navigation, workflow graphics, enhanced upload surfaces, and richer review cards.
- Shows a Smart Launchpad in the Results area with live PDF queue, template, output, and quality-flow preview.
- Includes Color Pop and Classic visual modes, with coherent styling across Converter, Pipeline, and Screening sections.
- Includes a floating back-to-top arrow for long workflow and launch pages.
- Adds a Launch Desk with simple USD membership pricing, launch checklist copy, and a small revenue preview calculator.
- Sets generated Excel output to Calibri 10.
- Sets every profile sheet to print as A4 portrait, fit to 1 page wide by 1 page tall, with print area `A1:C13`.

## GitHub Pages

Publish this folder as the root of a GitHub repository. The included workflow deploys the site to GitHub Pages on every push to `main`.

No backend server is required.
