# ProfileForge

Static GitHub Pages app for converting PDF CVs into Excel profile workbooks.

## What It Does

- Runs fully in the browser.
- Includes a demo mode with sample profiles, downloadable sample Excel files, live pipeline records, and screening preview.
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
- Shows a copyable Batch Receipt after demo or conversion runs with completed counts, output mode, and file names.
- Uses a polished office-ready interface with icon navigation, workflow graphics, enhanced upload surfaces, and richer review cards.
- Adds an Assistant Handoff strip with a copyable office SOP for staff using the app from a shared link.
- Shows a Smart Launchpad in the Results area with live PDF queue, template, output, and quality-flow preview.
- Includes Color Pop and Classic visual modes, with coherent styling across Converter, Pipeline, and Screening sections.
- Includes a polished floating back-to-top arrow for long workflow and launch pages.
- Adds a Launch Desk with simple USD membership pricing, launch checklist copy, and a small revenue preview calculator.
- Adds a Trust + Support footer with copyable product brief and privacy note for public launch readiness.
- Adds a floating Command Deck with searchable actions for demo mode, SOP, receipts, launch assets, pipeline, and screening.
- Adds Boardroom Mode with client-ready candidate rankings, skill heatmap, copyable memo, and downloadable HTML submission report.
- Adds Talent Galaxy, a visual candidate constellation with score/status mapping, copyable summary, and downloadable SVG map.
- Adds Client Portal Studio with editable client/campaign details, a live shortlist portal preview, copyable invite text, and downloadable portal HTML.
- Adds Submission Studio with client-ready email, WhatsApp summary, send rhythm, and downloadable submission pack HTML.
- Adds Interview Studio with panel agenda, candidate-specific questions, calendar invite text, scorecard copy, and downloadable interview kit HTML.
- Adds Closing Studio with client feedback request, candidate prep note, offer-fee planning, closing checklist, and downloadable close pack HTML.
- Adds Showtime Theater with live shortlist slides, speaker script, full-screen presentation mode, and downloadable deck HTML.
- Adds Founder Cockpit with workflow traction, traffic-to-revenue forecast, founder update copy, pitch copy, and downloadable launch pack HTML.
- Adds Viral Launch Engine with launch hooks, social post copy, outreach email copy, referral loop, 7-day sprint, and downloadable campaign kit HTML.
- Keeps the top brand header and workspace menu sticky while scrolling through long sections.
- Uses `profileforge.css` as the live stylesheet to avoid stale or corrupted `styles.css` deployments.
- Sets generated Excel output to Calibri 10.
- Sets every profile sheet to print as A4 portrait, fit to 1 page wide by 1 page tall, with print area `A1:C13`.

## GitHub Pages

Publish this folder as the root of a GitHub repository. The included workflow deploys the site to GitHub Pages on every push to `main`.

No backend server is required.
