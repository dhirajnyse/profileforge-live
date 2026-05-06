const state = {
  files: [],
  objectUrls: [],
};

const els = {
  appStatus: document.querySelector("#appStatus"),
  pdfFiles: document.querySelector("#pdfFiles"),
  pdfFolder: document.querySelector("#pdfFolder"),
  combinedWorkbook: document.querySelector("#combinedWorkbook"),
  chooseFiles: document.querySelector("#chooseFiles"),
  chooseFolder: document.querySelector("#chooseFolder"),
  dropzone: document.querySelector("#dropzone"),
  fileCount: document.querySelector("#fileCount"),
  selectedList: document.querySelector("#selectedList"),
  convertButton: document.querySelector("#convertButton"),
  jobStatus: document.querySelector("#jobStatus"),
  jobCounts: document.querySelector("#jobCounts"),
  progressFill: document.querySelector("#progressFill"),
  resultsBody: document.querySelector("#resultsBody"),
  downloadCombined: document.querySelector("#downloadCombined"),
  downloadZip: document.querySelector("#downloadZip"),
  toast: document.querySelector("#toast"),
};

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 3400);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function xmlAttr(value) {
  return xmlEscape(value).replace(/"/g, "&quot;");
}

function setProgress(message, completed, total) {
  const percent = total ? Math.round((completed / total) * 100) : 0;
  els.jobStatus.textContent = message;
  els.jobCounts.textContent = `${completed} / ${total}`;
  els.progressFill.style.width = `${percent}%`;
}

function clearObjectUrls() {
  for (const url of state.objectUrls) URL.revokeObjectURL(url);
  state.objectUrls = [];
}

function createDownloadUrl(blob) {
  const url = URL.createObjectURL(blob);
  state.objectUrls.push(url);
  return url;
}

function setDownloadLink(element, url) {
  if (url) {
    element.href = url;
    element.classList.remove("disabled");
    element.setAttribute("aria-disabled", "false");
    return;
  }
  element.href = "#";
  element.classList.add("disabled");
  element.setAttribute("aria-disabled", "true");
}

function addFiles(fileList) {
  const incoming = Array.from(fileList || []).filter((file) => /\.pdf$/i.test(file.name));
  const existingKeys = new Set(state.files.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
  for (const file of incoming) {
    const key = `${file.name}:${file.size}:${file.lastModified}`;
    if (!existingKeys.has(key)) {
      state.files.push(file);
      existingKeys.add(key);
    }
  }
  renderSelectedFiles();
  updateConvertState();
}

function renderSelectedFiles() {
  els.fileCount.textContent = state.files.length ? `${state.files.length} PDF${state.files.length === 1 ? "" : "s"} selected` : "No PDFs selected";
  els.selectedList.innerHTML = "";
  state.files.slice(0, 80).forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "selected-item";
    item.innerHTML = `
      <span>${escapeHtml(file.name)} - ${formatBytes(file.size)}</span>
      <button type="button" class="remove-file" aria-label="Remove ${escapeHtml(file.name)}">x</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      state.files.splice(index, 1);
      renderSelectedFiles();
      updateConvertState();
    });
    els.selectedList.appendChild(item);
  });
  if (state.files.length > 80) {
    const more = document.createElement("div");
    more.className = "selected-item";
    more.textContent = `${state.files.length - 80} more PDFs`;
    els.selectedList.appendChild(more);
  }
}

function updateConvertState() {
  const librariesReady = Boolean(window.JSZip && window.pdfjsLib);
  els.convertButton.disabled = !librariesReady || !state.files.length;
  if (!librariesReady) {
    els.appStatus.textContent = "Libraries loading";
  }
}

function normalizeLine(line) {
  return String(line || "").replace(/\s+/g, " ").trim();
}

function normalizeText(text) {
  return text
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanPdfText(value) {
  const replacements = {
    "\u00e2\u20ac\u201c": "-",
    "\u00e2\u20ac\u201d": "-",
    "\u00e2\u20ac\u00a2": "-",
    "\u00c2\u00b7": " | ",
    "\u00c2": "",
    "\u2013": "-",
    "\u2014": "-",
    "\u2022": "-",
  };
  let output = String(value || "");
  for (const [source, target] of Object.entries(replacements)) {
    output = output.replaceAll(source, target);
  }
  return output;
}

function linesOf(text) {
  return normalizeText(text)
    .split(/\n+/)
    .map(normalizeLine)
    .filter(Boolean);
}

function squash(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function trimToWords(value, maxChars) {
  const text = squash(value);
  if (text.length <= maxChars) return text;
  const sliced = text.slice(0, maxChars + 1);
  const lastSpace = sliced.lastIndexOf(" ");
  return `${sliced.slice(0, lastSpace > maxChars * 0.65 ? lastSpace : maxChars).trim()}...`;
}

function stripBullet(line) {
  return normalizeLine(line.replace(/^[-*]\s+/, "").replace(/^\d+[.)]\s+/, ""));
}

function titleCaseLight(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => (part.length <= 2 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
    .join(" ");
}

function sectionLines(allLines, heading, stopHeadings) {
  const start = allLines.findIndex((line) => line.toUpperCase() === heading);
  if (start === -1) return [];
  let end = allLines.length;
  for (let index = start + 1; index < allLines.length; index += 1) {
    if (stopHeadings.includes(allLines[index].toUpperCase())) {
      end = index;
      break;
    }
  }
  return allLines.slice(start + 1, end);
}

function uniqueItems(items) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const clean = stripBullet(item).replace(/[:;,.]+$/g, "").trim();
    if (!clean || clean.length < 2) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(clean);
  }
  return output;
}

function safeName(value, fallback = "file") {
  const cleaned = String(value || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return cleaned || fallback;
}

function parseFileParts(fileName) {
  const base = fileName.replace(/\.[^.]+$/, "");
  const parts = base.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
  const roleCode = parts.find((part) => /^[A-Z]{1,5}-ROLE-\d+/i.test(part)) || "";
  const level = roleCode && parts.length >= 3 ? parts[1] : "";
  const candidateName = roleCode && parts.length >= 3 ? parts.slice(2).join(" - ") : roleCode && parts.length === 2 ? parts[1] : "";
  return { roleCode, level, candidateName };
}

function extractYears(text) {
  const match = text.match(/(\d{1,2}\+?)\s*(?:years|yrs)\b/i);
  return match ? `${match[1]} years` : "";
}

function extractEmployers(workLines) {
  const monthPattern = "January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec";
  const dateLine = new RegExp(`\\b(${monthPattern})\\s+\\d{4}\\b`, "i");
  const employers = [];

  for (let index = 0; index < workLines.length - 1; index += 1) {
    if (!dateLine.test(workLines[index])) continue;
    const next = workLines.slice(index + 1).find((line) => line && !/^[-*]\s+/.test(line));
    if (!next || dateLine.test(next)) continue;
    const employer = next
      .split(/\s+(?:\||·)\s+/)[0]
      .replace(/\s+-\s+(Dubai|Trivandrum|United Arab Emirates|UAE|India|Kerala).*$/i, "")
      .trim();
    if (employer && !employers.some((item) => item.toLowerCase() === employer.toLowerCase())) {
      employers.push(employer);
    }
  }

  return employers;
}

function extractBullets(section) {
  const bullets = [];
  let current = "";
  for (const line of section) {
    if (/^[-*]\s+/.test(line)) {
      if (current) bullets.push(current);
      current = stripBullet(line);
    } else if (current) {
      current = `${current} ${line}`;
    }
  }
  if (current) bullets.push(current);
  return bullets.map(squash).filter(Boolean);
}

function summarizeProjects(workLines) {
  const bullets = extractBullets(workLines);
  const priority = bullets.filter((bullet) =>
    /\b(led|developed|enhanced|built|designed|migrat|automat|dashboard|api|gis|claims|analytics|managed|streamlined)\b/i.test(bullet),
  );
  const selected = (priority.length ? priority : bullets).slice(0, 6);
  return trimToWords(selected.join("; "), 700);
}

function parseProfile(text, fileName) {
  const cleanText = normalizeText(cleanPdfText(text));
  const allLines = linesOf(cleanText);
  const fileParts = parseFileParts(fileName);
  const firstContent = allLines.filter((line) => !/^(location|email|phone)\s*:/i.test(line));
  const pdfName = firstContent[0] || "";
  const headline = firstContent[1] || "";
  const headlineRole = headline.split("|")[0]?.trim() || "";
  const candidateName = fileParts.candidateName || pdfName || safeName(fileName, "Candidate").replace(/-/g, " ");
  const level = fileParts.level || "";
  const roleTitle = [level, headlineRole].filter(Boolean).join(" ").trim() || headlineRole || level || "Candidate Profile";

  const headings = ["TECHNICAL SKILLS", "WORK EXPERIENCE", "CERTIFICATIONS", "EDUCATION", "PROFESSIONAL SUMMARY"];
  const summary = sectionLines(allLines, "PROFESSIONAL SUMMARY", headings.filter((heading) => heading !== "PROFESSIONAL SUMMARY"));
  const skills = sectionLines(allLines, "TECHNICAL SKILLS", headings.filter((heading) => heading !== "TECHNICAL SKILLS"));
  const work = sectionLines(allLines, "WORK EXPERIENCE", headings.filter((heading) => heading !== "WORK EXPERIENCE"));
  const certs = sectionLines(allLines, "CERTIFICATIONS", headings.filter((heading) => heading !== "CERTIFICATIONS"));
  const education = sectionLines(allLines, "EDUCATION", headings.filter((heading) => heading !== "EDUCATION"));

  const skillItems = uniqueItems(
    skills.flatMap((line) => {
      if (/[:]\s*$/.test(line)) return [];
      return line.split(/\s*,\s*/);
    }),
  );
  if (!skillItems.length && headline.includes("|")) {
    skillItems.push(...uniqueItems(headline.split("|").slice(1)));
  }

  const certificationItems = uniqueItems(certs);
  const educationText = trimToWords(education.map(stripBullet).join(" - "), 450);
  const employerItems = extractEmployers(work);

  const relevantExperience =
    trimToWords(summary.join(" "), 550) ||
    trimToWords(extractBullets(work).slice(0, 3).join("; "), 550) ||
    "Relevant experience extracted from CV.";

  return {
    sourceName: fileName,
    roleCode: fileParts.roleCode || "",
    roleTitle: titleCaseLight(roleTitle),
    candidateName: titleCaseLight(candidateName),
    yearsOfExperience: extractYears(cleanText) || "",
    relevantExperience,
    keySkills: trimToWords(skillItems.join(", "), 850),
    certifications: certificationItems.length ? trimToWords(certificationItems.join("; "), 550) : "Not specified in CV.",
    educationalQualifications: educationText || "Not specified in CV.",
    previousEmployer: employerItems.length ? employerItems.join("; ") : "Not specified in CV.",
    projectsHandled: summarizeProjects(work) || "Not specified in CV.",
  };
}

function textItemsToLines(items) {
  const entries = items
    .map((item) => ({
      text: item.str || "",
      x: item.transform?.[4] || 0,
      y: item.transform?.[5] || 0,
    }))
    .filter((item) => item.text.trim());

  entries.sort((a, b) => (Math.abs(b.y - a.y) > 3 ? b.y - a.y : a.x - b.x));

  const lines = [];
  for (const entry of entries) {
    const last = lines[lines.length - 1];
    if (!last || Math.abs(last.y - entry.y) > 3) {
      lines.push({ y: entry.y, entries: [entry] });
    } else {
      last.entries.push(entry);
    }
  }

  return lines
    .map((line) =>
      line.entries
        .sort((a, b) => a.x - b.x)
        .map((entry) => entry.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

async function extractPdfText(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(textItemsToLines(content.items).join("\n"));
  }
  return pages.join("\n\n");
}

function profileTable(profile) {
  return [
    ["#", "Category", "Details"],
    [1, "Role Code", profile.roleCode],
    [2, "Role Title", profile.roleTitle],
    [3, "Candidate Name", profile.candidateName],
    [4, "Years of Experience", profile.yearsOfExperience],
    [5, "Relevant Experience", profile.relevantExperience],
    [6, "Key Skills", profile.keySkills],
    [7, "Certifications", profile.certifications],
    [8, "Educational Qualifications", profile.educationalQualifications],
    [9, "Previous Employer", profile.previousEmployer],
    [10, "Projects Handled", profile.projectsHandled],
    [null, null, null],
    [null, "Note: ", "We can provide detailed CV as there is a limited space in this format for projects listing, so we mentioned recent ones"],
  ];
}

function columnName(index) {
  let value = "";
  let current = index;
  while (current > 0) {
    const rem = (current - 1) % 26;
    value = String.fromCharCode(65 + rem) + value;
    current = Math.floor((current - 1) / 26);
  }
  return value;
}

function cellXml(row, col, value, style) {
  const ref = `${columnName(col)}${row}`;
  if (value === null || value === undefined || value === "") {
    return `<c r="${ref}" s="${style}"/>`;
  }
  if (typeof value === "number") {
    return `<c r="${ref}" s="${style}" t="n"><v>${value}</v></c>`;
  }
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
}

function rowXml(rowNumber, values, height) {
  const cells = values
    .map((value, index) => {
      const col = index + 1;
      let style = 2;
      if (rowNumber === 1) style = 1;
      else if (col === 1) style = 3;
      else if (col === 2 && rowNumber !== 13) style = 4;
      else if (rowNumber === 13 && col === 2) style = 5;
      else if (rowNumber === 13 && col === 3) style = 6;
      return cellXml(rowNumber, col, value, style);
    })
    .join("");
  return `<row r="${rowNumber}" ht="${height}" customHeight="1">${cells}</row>`;
}

function sheetXml(profile) {
  const heights = [37.5, 22.5, 22.5, 22.5, 22.5, 66, 81, 51, 39, 36, 88.5, 9, 33];
  const rows = profileTable(profile).map((values, index) => rowXml(index + 1, values, heights[index])).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  <dimension ref="A1:C13"/>
  <sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>
    <col min="1" max="1" width="5.25" customWidth="1"/>
    <col min="2" max="2" width="24.23" customWidth="1"/>
    <col min="3" max="3" width="96.23" customWidth="1"/>
  </cols>
  <sheetData>${rows}</sheetData>
  <printOptions horizontalCentered="1"/>
  <pageMargins left="0.25" right="0.25" top="0.35" bottom="0.35" header="0.1" footer="0.1"/>
  <pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="1" horizontalDpi="300" verticalDpi="300"/>
  <headerFooter><oddFooter>&amp;L&amp;F&amp;C&amp;A&amp;R&amp;P/&amp;N</oddFooter></headerFooter>
</worksheet>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font><sz val="10"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="10"/><name val="Calibri"/><family val="2"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F4E78"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD7DEE8"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border/>
    <border>
      <left style="thin"><color rgb="FF279BF5"/></left>
      <right style="thin"><color rgb="FF279BF5"/></right>
      <top style="thin"><color rgb="FF279BF5"/></top>
      <bottom style="thin"><color rgb="FF279BF5"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="7">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`;
}

function makeSheetName(sourceName, usedNames) {
  const base = sourceName.replace(/\.[^.]+$/, "");
  const cleaned = base
    .replace(/[:\\/?*[\]]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^'+|'+$/g, "")
    .trim();
  let root = (cleaned || "Profile").slice(0, 31).trim() || "Profile";
  let candidate = root;
  let counter = 2;
  while (usedNames.has(candidate.toLowerCase())) {
    const suffix = ` ${counter}`;
    candidate = `${root.slice(0, 31 - suffix.length).trim()}${suffix}`;
    counter += 1;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function workbookXml(sheets) {
  const sheetNodes = sheets
    .map((sheet, index) => `<sheet name="${xmlAttr(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
    .join("");
  const printAreas = sheets
    .map((sheet, index) => {
      const ref = `'${sheet.name.replace(/'/g, "''")}'!$A$1:$C$13`;
      return `<definedName name="_xlnm.Print_Area" localSheetId="${index}">${xmlEscape(ref)}</definedName>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheetNodes}</sheets>
  <definedNames>${printAreas}</definedNames>
</workbook>`;
}

function workbookRelsXml(sheetCount) {
  const sheetRels = Array.from({ length: sheetCount }, (_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheetRels}
  <Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function contentTypesXml(sheetCount) {
  const sheetOverrides = Array.from({ length: sheetCount }, (_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheetOverrides}
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

function packageRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function docPropsXml() {
  const now = new Date().toISOString();
  return {
    core: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>CV Profile Converter</dc:creator>
  <cp:lastModifiedBy>CV Profile Converter</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`,
    app: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>CV Profile Converter</Application>
</Properties>`,
  };
}

async function createWorkbookBlob(records) {
  const zip = new JSZip();
  const usedNames = new Set();
  const sheets = records.map((record) => ({
    name: makeSheetName(record.sourceName, usedNames),
    profile: record.profile,
  }));
  const props = docPropsXml();

  zip.file("[Content_Types].xml", contentTypesXml(sheets.length));
  zip.file("_rels/.rels", packageRelsXml());
  zip.file("docProps/core.xml", props.core);
  zip.file("docProps/app.xml", props.app);
  zip.file("xl/workbook.xml", workbookXml(sheets));
  zip.file("xl/_rels/workbook.xml.rels", workbookRelsXml(sheets.length));
  zip.file("xl/styles.xml", stylesXml());
  sheets.forEach((sheet, index) => zip.file(`xl/worksheets/sheet${index + 1}.xml`, sheetXml(sheet.profile)));

  const bytes = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  return bytes;
}

function makeResultFileName(profile, sourceName, usedNames) {
  const base = safeName([profile.roleCode, profile.candidateName || sourceName, "Profile"].filter(Boolean).join("-"), safeName(sourceName, "profile"));
  let candidate = `${base}.xlsx`;
  let counter = 2;
  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${base}-${counter}.xlsx`;
    counter += 1;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function statusBadge(status) {
  return `<span class="badge ${status}">${status}</span>`;
}

function renderResults(results) {
  if (!results.length) {
    els.resultsBody.innerHTML = '<tr class="empty-row"><td colspan="5">Awaiting conversion</td></tr>';
    return;
  }

  els.resultsBody.innerHTML = results
    .map((result) => {
      const fileCell =
        result.status === "done"
          ? `<a class="file-link" href="${result.url}" download="${escapeHtml(result.fileName)}">${escapeHtml(result.fileName)}</a>`
          : result.status === "error"
            ? escapeHtml(result.error || "Error")
            : statusBadge("processing");
      return `
        <tr>
          <td>${escapeHtml(result.sourceName || "")}</td>
          <td>${escapeHtml(result.candidateName || "")}</td>
          <td>${escapeHtml([result.roleCode, result.roleTitle].filter(Boolean).join(" - "))}</td>
          <td>${escapeHtml(result.yearsOfExperience || "")}</td>
          <td>${fileCell}</td>
        </tr>
      `;
    })
    .join("");
}

async function convertCvs() {
  if (!window.JSZip || !window.pdfjsLib) {
    showToast("Libraries are still loading. Try again in a moment.");
    return;
  }

  clearObjectUrls();
  setDownloadLink(els.downloadCombined, null);
  setDownloadLink(els.downloadZip, null);
  els.convertButton.disabled = true;
  els.convertButton.innerHTML = "Converting";
  setProgress("Processing PDFs", 0, state.files.length);

  const usedNames = new Set();
  const results = state.files.map((file) => ({ sourceName: file.name, status: "processing" }));
  renderResults(results);

  const successful = [];
  const zip = new JSZip();

  for (let index = 0; index < state.files.length; index += 1) {
    const file = state.files[index];
    try {
      const text = await extractPdfText(file);
      const profile = parseProfile(text, file.name);
      const xlsxBlob = await createWorkbookBlob([{ sourceName: file.name, profile }]);
      const fileName = makeResultFileName(profile, file.name, usedNames);
      const url = createDownloadUrl(xlsxBlob);

      zip.file(fileName, xlsxBlob);
      successful.push({ sourceName: file.name, profile });
      Object.assign(results[index], {
        status: "done",
        candidateName: profile.candidateName,
        roleCode: profile.roleCode,
        roleTitle: profile.roleTitle,
        yearsOfExperience: profile.yearsOfExperience,
        fileName,
        url,
      });
    } catch (error) {
      Object.assign(results[index], {
        status: "error",
        error: error.message,
      });
    }
    renderResults(results);
    setProgress("Processing PDFs", index + 1, state.files.length);
  }

  if (successful.length && els.combinedWorkbook.checked) {
    const combinedBlob = await createWorkbookBlob(successful);
    const combinedUrl = createDownloadUrl(combinedBlob);
    setDownloadLink(els.downloadCombined, combinedUrl);
  }

  if (successful.length) {
    if (els.combinedWorkbook.checked) {
      const combinedForZip = await createWorkbookBlob(successful);
      zip.file("combined-cv-profiles.xlsx", combinedForZip);
    }
    const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    setDownloadLink(els.downloadZip, createDownloadUrl(zipBlob));
  }

  const failed = results.filter((result) => result.status === "error").length;
  setProgress(failed ? "Completed with errors" : "Complete", state.files.length, state.files.length);
  showToast(failed ? "Completed with errors" : "Conversion complete");
  els.convertButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path></svg>Convert CVs';
  updateConvertState();
}

els.chooseFiles.addEventListener("click", () => els.pdfFiles.click());
els.chooseFolder.addEventListener("click", () => els.pdfFolder.click());
els.pdfFiles.addEventListener("change", () => addFiles(els.pdfFiles.files));
els.pdfFolder.addEventListener("change", () => addFiles(els.pdfFolder.files));
els.convertButton.addEventListener("click", convertCvs);

["dragenter", "dragover"].forEach((eventName) => {
  els.dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.dropzone.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  els.dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.dropzone.classList.remove("dragging");
  });
});

els.dropzone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));

window.addEventListener("load", updateConvertState);
setTimeout(updateConvertState, 1000);
