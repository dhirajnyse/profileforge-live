const PROFILE_FIELDS = [
  { id: "roleCode", label: "Role Code", defaultCell: "C2" },
  { id: "roleTitle", label: "Role Title", defaultCell: "C3" },
  { id: "candidateName", label: "Candidate Name", defaultCell: "C4" },
  { id: "yearsOfExperience", label: "Years of Experience", defaultCell: "C5" },
  { id: "relevantExperience", label: "Relevant Experience", defaultCell: "C6" },
  { id: "keySkills", label: "Key Skills", defaultCell: "C7" },
  { id: "certifications", label: "Certifications", defaultCell: "C8" },
  { id: "educationalQualifications", label: "Educational Qualifications", defaultCell: "C9" },
  { id: "previousEmployer", label: "Previous Employer", defaultCell: "C10" },
  { id: "projectsHandled", label: "Projects Handled", defaultCell: "C11" },
  { id: "note", label: "Note", defaultCell: "C13" },
];

const LONG_REVIEW_FIELDS = new Set(["relevantExperience", "keySkills", "projectsHandled", "note"]);
const PROFILE_NOTE =
  "We can provide detailed CV as there is a limited space in this format for projects listing, so we mentioned recent ones";
const FIELD_FALLBACKS = {
  roleCode: "Role code to be confirmed",
  yearsOfExperience: "Experience to be confirmed",
  keySkills: "Skills to be confirmed during screening.",
  certifications: "Certification details to be confirmed during screening.",
  educationalQualifications: "Education details to be confirmed during screening.",
  previousEmployer: "Employment history to be confirmed during screening.",
  projectsHandled: "Project details to be confirmed during screening.",
};

const DEFAULT_TEMPLATE_MAPPING = PROFILE_FIELDS.reduce((mapping, field) => {
  mapping[field.id] = field.defaultCell;
  return mapping;
}, {});

const state = {
  files: [],
  templateFile: null,
  templateMapping: { ...DEFAULT_TEMPLATE_MAPPING },
  reviewItems: [],
  objectUrls: [],
  pipeline: [],
  taskPlan: [],
  matchResults: [],
};

const els = {
  appStatus: document.querySelector("#appStatus"),
  pdfFiles: document.querySelector("#pdfFiles"),
  pdfFolder: document.querySelector("#pdfFolder"),
  themeToggle: document.querySelector("#themeToggle"),
  templateFile: document.querySelector("#templateFile"),
  templateModePill: document.querySelector("#templateModePill"),
  templateStatus: document.querySelector("#templateStatus"),
  templateMapper: document.querySelector("#templateMapper"),
  mappingGrid: document.querySelector("#mappingGrid"),
  saveMapping: document.querySelector("#saveMapping"),
  resetMapping: document.querySelector("#resetMapping"),
  combinedWorkbook: document.querySelector("#combinedWorkbook"),
  singleSheetWorkbook: document.querySelector("#singleSheetWorkbook"),
  stackingOptions: document.querySelector("#stackingOptions"),
  stackDirectionOptions: Array.from(document.querySelectorAll?.('input[name="stackDirection"]') || []),
  reviewBeforeExcel: document.querySelector("#reviewBeforeExcel"),
  chooseFiles: document.querySelector("#chooseFiles"),
  chooseFolder: document.querySelector("#chooseFolder"),
  chooseTemplate: document.querySelector("#chooseTemplate"),
  clearTemplate: document.querySelector("#clearTemplate"),
  dropzone: document.querySelector("#dropzone"),
  fileCount: document.querySelector("#fileCount"),
  selectedList: document.querySelector("#selectedList"),
  convertButton: document.querySelector("#convertButton"),
  jobStatus: document.querySelector("#jobStatus"),
  jobCounts: document.querySelector("#jobCounts"),
  progressFill: document.querySelector("#progressFill"),
  launchpad: document.querySelector("#launchpad"),
  reviewPanel: document.querySelector("#reviewPanel"),
  reviewSummary: document.querySelector("#reviewSummary"),
  qualitySummary: document.querySelector("#qualitySummary"),
  reviewList: document.querySelector("#reviewList"),
  generateReviewed: document.querySelector("#generateReviewed"),
  copyBatchBrief: document.querySelector("#copyBatchBrief"),
  downloadBatchBrief: document.querySelector("#downloadBatchBrief"),
  downloadQualityReport: document.querySelector("#downloadQualityReport"),
  clearReview: document.querySelector("#clearReview"),
  resultsBody: document.querySelector("#resultsBody"),
  downloadCombined: document.querySelector("#downloadCombined"),
  downloadZip: document.querySelector("#downloadZip"),
  metricProfiles: document.querySelector("#metricProfiles"),
  metricShortlist: document.querySelector("#metricShortlist"),
  metricFollowups: document.querySelector("#metricFollowups"),
  workflowPreset: document.querySelector("#workflowPreset"),
  taskPrompt: document.querySelector("#taskPrompt"),
  createPlan: document.querySelector("#createPlan"),
  taskBoard: document.querySelector("#taskBoard"),
  pipelineBody: document.querySelector("#pipelineBody"),
  exportPipeline: document.querySelector("#exportPipeline"),
  copyBrief: document.querySelector("#copyBrief"),
  clearPipeline: document.querySelector("#clearPipeline"),
  roleRequirement: document.querySelector("#roleRequirement"),
  runMatcher: document.querySelector("#runMatcher"),
  compareCandidates: document.querySelector("#compareCandidates"),
  candidatePicker: document.querySelector("#candidatePicker"),
  matchSummary: document.querySelector("#matchSummary"),
  comparisonBody: document.querySelector("#comparisonBody"),
  copyMatches: document.querySelector("#copyMatches"),
  exportMatches: document.querySelector("#exportMatches"),
  copyPricing: document.querySelector("#copyPricing"),
  copyLaunchChecklist: document.querySelector("#copyLaunchChecklist"),
  starterMembers: document.querySelector("#starterMembers"),
  proMembers: document.querySelector("#proMembers"),
  studioMembers: document.querySelector("#studioMembers"),
  launchMrr: document.querySelector("#launchMrr"),
  launchArr: document.querySelector("#launchArr"),
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

function convertButtonHtml(label) {
  return `<svg viewBox="0 0 24 24"><path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path></svg>${label}`;
}

function setConvertButtonReadyText() {
  els.convertButton.innerHTML = convertButtonHtml(els.reviewBeforeExcel.checked ? "Review CVs" : "Convert CVs");
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

function storageGet(key, fallback) {
  try {
    const raw = window.localStorage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function storageSet(key, value) {
  try {
    window.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage can be blocked in private browser contexts.
  }
}

function setThemeMode(mode) {
  const usePop = mode !== "classic";
  document.body?.classList?.toggle("theme-pop", usePop);
  if (els.themeToggle) {
    els.themeToggle.setAttribute("aria-pressed", String(usePop));
    els.themeToggle.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 3v18"></path><path d="M5 8h14"></path><path d="M5 16h14"></path></svg>${usePop ? "Color Pop" : "Classic"}`;
  }
  storageSet("profileforge.theme.v1", usePop ? "pop" : "classic");
}

function loadThemeMode() {
  setThemeMode(storageGet("profileforge.theme.v1", "pop"));
}

function loadTemplateMapping() {
  return normalizeTemplateMapping(storageGet("profileforge-template-mapping", DEFAULT_TEMPLATE_MAPPING));
}

function saveTemplateMapping(mapping) {
  storageSet("profileforge-template-mapping", normalizeTemplateMapping(mapping));
}

function downloadTextFile(fileName, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = createDownloadUrl(blob);
  link.download = fileName;
  link.click();
}

async function copyText(value) {
  const text = String(value || "");
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const input = document.createElement("textarea");
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

function formatUsd(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function launchMemberCount(input) {
  return Math.max(0, Number.parseInt(input?.value || "0", 10) || 0);
}

function renderLaunchRevenue() {
  if (!els.launchMrr || !els.launchArr) return;
  const mrr = launchMemberCount(els.starterMembers) * 7 + launchMemberCount(els.proMembers) * 15 + launchMemberCount(els.studioMembers) * 29;
  els.launchMrr.textContent = formatUsd(mrr);
  els.launchArr.textContent = `${formatUsd(mrr * 12)} yearly run rate`;
}

function launchPricingText() {
  return [
    "ProfileForge Founding Membership",
    "",
    "Starter - $7/month",
    "100 profiles/month, combined workbook exports, built-in ProfileForge template.",
    "",
    "Pro - $15/month",
    "500 profiles/month, custom Excel template mapping, quality report, and batch brief.",
    "",
    "Studio - $29/month",
    "2,000 profiles/month, team workflow and pipeline tools, priority template setup.",
    "",
    "Privacy note: ProfileForge processes PDFs in the browser. CV files are not uploaded to a server in this static version.",
  ].join("\n");
}

function launchChecklistText() {
  return [
    "ProfileForge Launch Checklist",
    "1. Connect the custom domain to GitHub Pages.",
    "2. Add support email and a short privacy note.",
    "3. Keep Pro as the recommended first paid plan.",
    "4. Start with Stripe, Gumroad, or PayPal checkout after first user feedback.",
    "5. Track first 10 users: profiles converted, templates requested, and missing fields reported.",
  ].join("\n");
}

function parseYearsNumber(value) {
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function isPlaceholderValue(value) {
  const text = String(value || "").trim();
  return !text || /not specified|extracted from cv|to be confirmed/i.test(text);
}

function candidateScore(profile) {
  const years = Math.min(parseYearsNumber(profile.yearsOfExperience), 15);
  const skills = String(profile.keySkills || "")
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean).length;
  const details = ["certifications", "educationalQualifications", "previousEmployer", "projectsHandled"].filter((key) => {
    return !isPlaceholderValue(profile[key]);
  }).length;
  return Math.min(98, Math.max(42, 42 + years * 3 + Math.min(skills, 12) * 2 + details * 4));
}

function nextBusinessDate(offsetDays = 1) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  while ([0, 6].includes(date.getDay())) {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().slice(0, 10);
}

function pipelineKey(item) {
  return `${item.sourceName || ""}:${item.candidateName || ""}:${item.roleCode || ""}`.toLowerCase();
}

function makePipelineItem(record) {
  const profile = record.profile;
  const score = candidateScore(profile);
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sourceName: record.sourceName,
    candidateName: profile.candidateName || "Candidate",
    roleCode: profile.roleCode || "",
    roleTitle: profile.roleTitle || "",
    yearsOfExperience: profile.yearsOfExperience || "",
    keySkills: profile.keySkills || "",
    relevantExperience: profile.relevantExperience || "",
    certifications: profile.certifications || "",
    educationalQualifications: profile.educationalQualifications || "",
    previousEmployer: profile.previousEmployer || "",
    projectsHandled: profile.projectsHandled || "",
    score,
    status: score >= 78 ? "Shortlist" : "Review",
    nextStep: score >= 78 ? "Prepare client submission pack" : "Verify CV details and role match",
    dueDate: nextBusinessDate(score >= 78 ? 1 : 2),
  };
}

function addPipelineRecords(records) {
  const existing = new Set(state.pipeline.map(pipelineKey));
  let added = 0;
  for (const record of records) {
    const item = makePipelineItem(record);
    const key = pipelineKey(item);
    if (existing.has(key)) continue;
    state.pipeline.push(item);
    existing.add(key);
    added += 1;
  }
  if (added) {
    savePipeline();
    renderPipeline();
    showToast(`${added} candidate${added === 1 ? "" : "s"} added to pipeline`);
  }
}

function savePipeline() {
  storageSet("profileforge.pipeline.v1", state.pipeline);
}

function loadPipeline() {
  state.pipeline = storageGet("profileforge.pipeline.v1", []);
}

function statusOptions(selected) {
  return ["Review", "Shortlist", "Interview", "Submitted", "Hold", "Rejected"]
    .map((status) => `<option value="${status}"${status === selected ? " selected" : ""}>${status}</option>`)
    .join("");
}

function renderPipeline() {
  if (!els.pipelineBody) return;
  if (!state.pipeline.length) {
    els.pipelineBody.innerHTML = '<tr class="empty-row"><td colspan="5">Awaiting converted profiles</td></tr>';
  } else {
    els.pipelineBody.innerHTML = state.pipeline
      .map(
        (item) => `
          <tr>
            <td>
              <strong>${escapeHtml(item.candidateName)}</strong>
              <div class="next-step">${escapeHtml(item.yearsOfExperience || "Years not listed")}</div>
            </td>
            <td>
              ${escapeHtml([item.roleCode, item.roleTitle].filter(Boolean).join(" - "))}
              <div class="next-step">${escapeHtml(trimToWords(item.keySkills || "", 95))}</div>
            </td>
            <td><span class="score-pill">${item.score}</span></td>
            <td>
              <select class="pipeline-status" data-id="${escapeHtml(item.id)}">
                ${statusOptions(item.status)}
              </select>
            </td>
            <td>
              <div>${escapeHtml(item.nextStep)}</div>
              <div class="next-step">${escapeHtml(item.dueDate)}</div>
            </td>
          </tr>
        `,
      )
      .join("");
  }

  const shortlist = state.pipeline.filter((item) => ["Shortlist", "Interview", "Submitted"].includes(item.status)).length;
  const followups = state.pipeline.filter((item) => !["Rejected", "Hold"].includes(item.status)).length;
  if (els.metricProfiles) els.metricProfiles.textContent = String(state.pipeline.length);
  if (els.metricShortlist) els.metricShortlist.textContent = String(shortlist);
  if (els.metricFollowups) els.metricFollowups.textContent = String(followups);
  if (els.exportPipeline) els.exportPipeline.disabled = !state.pipeline.length;
  if (els.copyBrief) els.copyBrief.disabled = !state.pipeline.length;
  if (els.clearPipeline) els.clearPipeline.disabled = !state.pipeline.length;
  if (els.runMatcher) els.runMatcher.disabled = !state.pipeline.length;
  if (els.compareCandidates) els.compareCandidates.disabled = !state.pipeline.length;
  if (els.copyMatches) els.copyMatches.disabled = !state.pipeline.length;
  if (els.exportMatches) els.exportMatches.disabled = !state.pipeline.length;
  renderCandidatePicker();
}

function updatePipelineStatus(id, status) {
  const item = state.pipeline.find((candidate) => candidate.id === id);
  if (!item) return;
  item.status = status;
  item.nextStep =
    {
      Review: "Verify CV details and role match",
      Shortlist: "Prepare client submission pack",
      Interview: "Schedule panel and prepare questions",
      Submitted: "Track client feedback",
      Hold: "Revisit after role calibration",
      Rejected: "Archive with reason",
    }[status] || item.nextStep;
  savePipeline();
  renderPipeline();
}

function pipelineText(item) {
  return [
    item.candidateName,
    item.roleCode,
    item.roleTitle,
    item.yearsOfExperience,
    item.keySkills,
    item.relevantExperience,
    item.certifications,
    item.educationalQualifications,
    item.previousEmployer,
    item.projectsHandled,
  ].join(" ");
}

const keywordStopwords = new Set([
  "and",
  "the",
  "for",
  "with",
  "from",
  "this",
  "that",
  "role",
  "candidate",
  "experience",
  "years",
  "year",
  "plus",
  "must",
  "have",
  "good",
  "strong",
  "able",
  "will",
  "work",
  "team",
  "using",
  "knowledge",
  "skills",
  "skill",
  "required",
  "requirements",
  "preferred",
  "responsible",
  "responsibilities",
]);

const shortSkillKeywords = new Set(["ai", "ml", "bi", "ui", "ux", "qa", "sql", "api", "aws", "etl", "nlp", "llm", "crm", "erp"]);

function extractKeywords(value) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/c\+\+/g, "cplusplus")
    .replace(/c#/g, "csharp")
    .replace(/\.net/g, "dotnet")
    .replace(/[^a-z0-9]+/g, " ");
  const words = normalized.split(/\s+/).filter(Boolean);
  const output = [];
  const seen = new Set();
  for (const word of words) {
    if (keywordStopwords.has(word)) continue;
    if (word.length < 3 && !shortSkillKeywords.has(word)) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    output.push(word);
  }
  return output.slice(0, 42);
}

function missingDataFields(item) {
  const checks = [
    ["Certifications", item.certifications],
    ["Education", item.educationalQualifications],
    ["Employer", item.previousEmployer],
    ["Projects", item.projectsHandled],
    ["Relevant experience", item.relevantExperience],
    ["Key skills", item.keySkills],
  ];
  return checks
    .filter(([, value]) => {
      return isPlaceholderValue(value);
    })
    .map(([label]) => label);
}

function roleMatchResults(requirement) {
  const requirementKeywords = extractKeywords(requirement);
  if (!requirementKeywords.length) return [];

  return state.pipeline
    .map((item) => {
      const candidateText = ` ${pipelineText(item).toLowerCase()} `;
      const matched = requirementKeywords.filter((keyword) => candidateText.includes(keyword));
      const missing = requirementKeywords.filter((keyword) => !matched.includes(keyword));
      const keywordFit = Math.round((matched.length / requirementKeywords.length) * 100);
      const fit = Math.min(99, Math.round(keywordFit * 0.72 + (Number(item.score) || 0) * 0.28));
      return {
        ...item,
        fit,
        matched,
        missingKeywords: missing,
        missingData: missingDataFields(item),
      };
    })
    .sort((a, b) => b.fit - a.fit || b.score - a.score);
}

function renderCandidatePicker() {
  if (!els.candidatePicker) return;
  if (!state.pipeline.length) {
    els.candidatePicker.innerHTML = '<div class="empty-state">Convert CVs to choose candidates</div>';
    return;
  }

  els.candidatePicker.innerHTML = state.pipeline
    .slice()
    .sort((a, b) => b.score - a.score)
    .map(
      (item) => `
        <label class="candidate-option">
          <input type="checkbox" value="${escapeHtml(item.id)}" />
          <span>
            <strong>${escapeHtml(item.candidateName)}</strong>
            <span>${escapeHtml([item.roleCode, item.roleTitle].filter(Boolean).join(" - ") || "Role not listed")}</span>
          </span>
        </label>
      `,
    )
    .join("");
}

function selectedCandidateIds() {
  return Array.from(els.candidatePicker?.querySelectorAll("input:checked") || []).map((input) => input.value);
}

function selectedCandidates() {
  const ids = selectedCandidateIds();
  if (!ids.length) return state.pipeline.slice().sort((a, b) => b.score - a.score).slice(0, 5);
  return state.pipeline.filter((item) => ids.includes(item.id));
}

function renderMatchSummary() {
  if (!els.matchSummary) return;
  if (!state.matchResults.length) {
    els.matchSummary.innerHTML = '<div class="empty-state">Run a role match to see ranked candidates</div>';
    return;
  }

  els.matchSummary.innerHTML = state.matchResults
    .slice(0, 5)
    .map(
      (item) => `
        <article class="match-card">
          <div>
            <strong>${escapeHtml(item.candidateName)}</strong>
            <p>${escapeHtml([item.roleCode, item.roleTitle].filter(Boolean).join(" - ") || "Role not listed")}</p>
            <div class="keyword-list">
              ${(item.matched.slice(0, 8).length ? item.matched.slice(0, 8) : ["no keyword hits"]).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("")}
            </div>
          </div>
          <div class="fit-meter">
            <strong>${item.fit}%</strong>
            <span>fit</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function runMatcher() {
  if (!state.pipeline.length) {
    showToast("Convert CVs first");
    return;
  }
  const requirement = els.roleRequirement?.value || "";
  state.matchResults = roleMatchResults(requirement);
  if (!state.matchResults.length) {
    showToast("Add clearer role requirements");
    return;
  }
  renderMatchSummary();
  renderComparison(state.matchResults.slice(0, 5));
  if (els.copyMatches) els.copyMatches.disabled = false;
  if (els.exportMatches) els.exportMatches.disabled = false;
  showToast("Role match complete");
}

function comparisonRows(candidates) {
  const matchById = new Map(state.matchResults.map((item) => [item.id, item]));
  return candidates.map((item) => matchById.get(item.id) || { ...item, fit: item.score || 0, matched: extractKeywords(item.keySkills || "").slice(0, 8), missingData: missingDataFields(item) });
}

function renderComparison(candidates = selectedCandidates()) {
  if (!els.comparisonBody) return;
  const rows = comparisonRows(candidates);
  if (!rows.length) {
    els.comparisonBody.innerHTML = '<tr class="empty-row"><td colspan="6">Select candidates and click Compare</td></tr>';
    return;
  }
  els.comparisonBody.innerHTML = rows
    .map(
      (item) => `
        <tr>
          <td><strong>${escapeHtml(item.candidateName)}</strong><div class="next-step">${escapeHtml(item.status || "Review")}</div></td>
          <td>${escapeHtml([item.roleCode, item.roleTitle].filter(Boolean).join(" - "))}</td>
          <td>${escapeHtml(item.yearsOfExperience || "Not listed")}</td>
          <td><span class="score-pill">${escapeHtml(item.fit || item.score || 0)}%</span></td>
          <td><div class="keyword-list">${(item.matched || []).slice(0, 10).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("") || "<span>review</span>"}</div></td>
          <td>${escapeHtml((item.missingData || missingDataFields(item)).join(", ") || "None flagged")}</td>
        </tr>
      `,
    )
    .join("");
}

function matchReportText() {
  const rows = state.matchResults.length ? state.matchResults : comparisonRows(selectedCandidates());
  if (!rows.length) return "No screening results yet.";
  return [
    "ProfileForge Role Match",
    `Requirement: ${els.roleRequirement?.value || ""}`,
    "",
    ...rows.map(
      (item, index) =>
        `${index + 1}. ${item.candidateName} - ${item.roleCode || item.roleTitle || "Role"} - fit ${item.fit || item.score || 0}% - matched: ${(item.matched || []).slice(0, 10).join(", ") || "review"} - missing data: ${(item.missingData || missingDataFields(item)).join(", ") || "none"}`,
    ),
  ].join("\n");
}

function matchReportCsv() {
  const rows = state.matchResults.length ? state.matchResults : comparisonRows(selectedCandidates());
  const headers = ["Candidate", "Role Code", "Role Title", "Years", "Fit", "Status", "Matched Keywords", "Missing Data", "Source"];
  return [headers, ...rows.map((item) => [item.candidateName, item.roleCode, item.roleTitle, item.yearsOfExperience, item.fit || item.score || 0, item.status, (item.matched || []).join("; "), (item.missingData || missingDataFields(item)).join("; "), item.sourceName])]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function pipelineCsv() {
  const headers = ["Candidate", "Role Code", "Role Title", "Years", "Score", "Status", "Next Step", "Due Date", "Source"];
  const rows = state.pipeline.map((item) => [
    item.candidateName,
    item.roleCode,
    item.roleTitle,
    item.yearsOfExperience,
    item.score,
    item.status,
    item.nextStep,
    item.dueDate,
    item.sourceName,
  ]);
  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function dailyBrief() {
  if (!state.pipeline.length) return "No candidates in pipeline.";
  const lines = state.pipeline
    .slice()
    .sort((a, b) => b.score - a.score)
    .map((item, index) => `${index + 1}. ${item.candidateName} - ${item.roleCode || item.roleTitle || "Role"} - ${item.status} - score ${item.score} - ${item.nextStep}`);
  return [`ProfileForge Daily Brief`, `Candidates: ${state.pipeline.length}`, "", ...lines].join("\n");
}

const workflowTemplates = {
  shortlist: [
    ["Review converted profiles", "Open Excel profiles and confirm candidate names, role codes, and missing fields.", "Assistant", 1],
    ["Rank candidates", "Sort by score, years, and role match; mark strong profiles as Shortlist.", "Recruiter", 1],
    ["Prepare pack", "Download combined workbook and attach selected individual profiles.", "Assistant", 1],
    ["Send summary", "Copy daily brief and share shortlist decisions.", "Recruiter", 2],
  ],
  interview: [
    ["Confirm panel", "Assign interviewer and reserve interview slot for shortlisted candidates.", "Recruiter", 1],
    ["Prepare questions", "Use role title and key skills to draft technical and screening questions.", "Hiring team", 1],
    ["Share profile", "Send profile workbook and CV notes to the panel.", "Assistant", 1],
    ["Record feedback", "Update candidate status after the interview.", "Recruiter", 2],
  ],
  followup: [
    ["Check pending candidates", "Filter pipeline for Review, Shortlist, Interview, and Submitted.", "Assistant", 1],
    ["Send reminders", "Follow up with candidate, client, or panel based on current status.", "Recruiter", 1],
    ["Update due dates", "Move completed items forward and keep open items visible.", "Assistant", 1],
    ["Share brief", "Copy daily brief for management update.", "Recruiter", 1],
  ],
  client: [
    ["Select profiles", "Choose candidates marked Shortlist or Interview.", "Recruiter", 1],
    ["Validate formatting", "Open print preview and confirm one-page profile output.", "Assistant", 1],
    ["Create submission", "Attach combined workbook and individual Excel profiles.", "Assistant", 1],
    ["Track response", "Move candidates to Submitted and set feedback follow-up.", "Recruiter", 3],
  ],
};

function createWorkflowPlan(preset, prompt) {
  const template = workflowTemplates[preset] || workflowTemplates.shortlist;
  const mentionsTomorrow = /tomorrow/i.test(prompt);
  const urgent = /\burgent|today|asap\b/i.test(prompt);
  const baseOffset = urgent ? 0 : mentionsTomorrow ? 1 : 1;
  return template.map(([title, detail, owner, offset], index) => ({
    title,
    detail,
    owner,
    dueDate: nextBusinessDate(baseOffset + Math.max(0, offset - 1)),
    priority: urgent || index === 0 ? "High" : "Normal",
  }));
}

function renderTaskPlan() {
  if (!els.taskBoard) return;
  if (!state.taskPlan.length) {
    els.taskBoard.innerHTML = '<div class="empty-state">No workflow plan yet</div>';
    return;
  }
  els.taskBoard.innerHTML = state.taskPlan
    .map(
      (task) => `
        <article class="task-card">
          <strong>${escapeHtml(task.title)}</strong>
          <p>${escapeHtml(task.detail)}</p>
          <div class="task-meta">
            <span>${escapeHtml(task.owner)}</span>
            <span>${escapeHtml(task.dueDate)}</span>
            <span>${escapeHtml(task.priority)}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function applyRecipe(recipe) {
  const prompts = {
    shortlist: "Prepare tomorrow shortlist pack for converted CVs and flag missing candidate details.",
    interview: "Prepare interview schedule and question pack for shortlisted candidates.",
    followup: "Create a follow-up desk for all candidates waiting on client, panel, or recruiter response.",
    client: "Prepare client submission pack with combined workbook, individual profiles, and summary brief.",
  };
  els.workflowPreset.value = recipe;
  els.taskPrompt.value = prompts[recipe] || prompts.shortlist;
  state.taskPlan = createWorkflowPlan(recipe, els.taskPrompt.value);
  renderTaskPlan();
}

function fileKey(file) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function addFiles(fileList) {
  const incoming = Array.from(fileList || []).filter((file) => /\.pdf$/i.test(file.name));
  const existingKeys = new Set(state.files.map(fileKey));
  for (const file of incoming) {
    const key = fileKey(file);
    if (!existingKeys.has(key)) {
      state.files.push(file);
      existingKeys.add(key);
    }
  }
  renderSelectedFiles();
  updateConvertState();
}

function reorderReviewItemsByFileOrder() {
  if (!state.reviewItems.length) return;
  const order = new Map(state.files.map((file, index) => [fileKey(file), index]));
  state.reviewItems.sort((left, right) => {
    const leftOrder = order.has(left.fileKey) ? order.get(left.fileKey) : Number.MAX_SAFE_INTEGER;
    const rightOrder = order.has(right.fileKey) ? order.get(right.fileKey) : Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
  renderReviewPanel();
}

function moveSelectedFile(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= state.files.length) return;
  const [file] = state.files.splice(index, 1);
  state.files.splice(targetIndex, 0, file);
  renderSelectedFiles();
  reorderReviewItemsByFileOrder();
  showToast("PDF order updated");
}

function removeSelectedFile(index) {
  const [removed] = state.files.splice(index, 1);
  if (removed) {
    const removedKey = fileKey(removed);
    state.reviewItems = state.reviewItems.filter((item) => item.fileKey !== removedKey);
  }
  renderSelectedFiles();
  reorderReviewItemsByFileOrder();
  renderReviewPanel();
  updateConvertState();
}

function updateTemplateUi() {
  const file = state.templateFile;
  if (file) {
    els.templateModePill.textContent = "Custom Excel Template";
    els.templateStatus.textContent = `${file.name} - ${formatBytes(file.size)}`;
    els.clearTemplate.hidden = false;
    els.templateMapper.hidden = false;
    renderTemplateMapper();
    updateLaunchpad();
    return;
  }
  els.templateModePill.textContent = "Built-in Profile Template";
  els.templateStatus.textContent = "Default ProfileForge template";
  els.clearTemplate.hidden = true;
  els.templateMapper.hidden = true;
  updateLaunchpad();
}

function handleTemplateFile(fileList) {
  const file = Array.from(fileList || []).find((item) => /\.xlsx$/i.test(item.name));
  if (!file) {
    showToast("Select an .xlsx template");
    return;
  }
  state.templateFile = file;
  updateTemplateUi();
  showToast("Custom template ready");
}

function renderTemplateMapper() {
  els.mappingGrid.innerHTML = PROFILE_FIELDS.map((field) => {
    const value = state.templateMapping[field.id] || field.defaultCell;
    return `
      <label class="map-row">
        <span>${escapeHtml(field.label)}</span>
        <input class="map-cell" data-map-field="${escapeHtml(field.id)}" type="text" value="${escapeHtml(value)}" inputmode="latin" spellcheck="false" />
      </label>
    `;
  }).join("");
}

function collectTemplateMappingFromUi() {
  const mapping = {};
  const invalid = [];
  for (const field of PROFILE_FIELDS) {
    const input = els.mappingGrid.querySelector(`[data-map-field="${field.id}"]`);
    const raw = String(input?.value || "").trim();
    const parsed = raw ? parseCellReference(raw) : null;
    if (!parsed) {
      invalid.push(field.label);
      mapping[field.id] = field.defaultCell;
      input?.classList.add("invalid");
      continue;
    }
    input?.classList.remove("invalid");
    mapping[field.id] = parsed.ref;
  }
  return { mapping, invalid };
}

function saveTemplateMappingFromUi() {
  const { mapping, invalid } = collectTemplateMappingFromUi();
  if (invalid.length) {
    showToast("Check highlighted cell addresses");
    return null;
  }
  state.templateMapping = mapping;
  saveTemplateMapping(mapping);
  renderTemplateMapper();
  showToast("Template mapping saved");
  return mapping;
}

async function readWorkbookTemplate() {
  if (!state.templateFile) return null;
  const { mapping, invalid } = collectTemplateMappingFromUi();
  if (invalid.length) {
    throw new Error("Check template cell addresses.");
  }
  state.templateMapping = mapping;
  saveTemplateMapping(mapping);
  return {
    name: state.templateFile.name,
    bytes: await state.templateFile.arrayBuffer(),
    mapping,
  };
}

function renderSelectedFiles() {
  els.fileCount.textContent = state.files.length ? `${state.files.length} PDF${state.files.length === 1 ? "" : "s"} selected` : "No PDFs selected";
  els.selectedList.innerHTML = "";
  state.files.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "selected-item";
    item.innerHTML = `
      <span class="selected-order">${index + 1}</span>
      <span class="selected-name">${escapeHtml(file.name)} - ${formatBytes(file.size)}</span>
      <div class="selected-actions">
        <button type="button" class="order-file" data-move="-1" aria-label="Move ${escapeHtml(file.name)} up" ${index === 0 ? "disabled" : ""}>^</button>
        <button type="button" class="order-file" data-move="1" aria-label="Move ${escapeHtml(file.name)} down" ${index === state.files.length - 1 ? "disabled" : ""}>v</button>
        <button type="button" class="remove-file" aria-label="Remove ${escapeHtml(file.name)}">x</button>
      </div>
    `;
    item.querySelectorAll("[data-move]").forEach((button) => {
      button.addEventListener("click", () => moveSelectedFile(index, Number(button.dataset.move)));
    });
    item.querySelector(".remove-file").addEventListener("click", () => {
      removeSelectedFile(index);
    });
    els.selectedList.appendChild(item);
  });
  updateLaunchpad();
}

function updateConvertState() {
  const librariesReady = Boolean(window.JSZip && window.pdfjsLib);
  els.convertButton.disabled = !librariesReady || !state.files.length;
  if (!els.convertButton.dataset?.busy) {
    setConvertButtonReadyText();
  }
  if (!librariesReady) {
    els.appStatus.textContent = "Libraries loading";
  }
  updateLaunchpad();
}

function syncCombinedOptions(source = "") {
  if (source === "combined" && !els.combinedWorkbook.checked) {
    els.singleSheetWorkbook.checked = false;
  } else if (els.singleSheetWorkbook.checked) {
    els.combinedWorkbook.checked = true;
  }
  const singleSheetAllowed = els.combinedWorkbook.checked;
  els.singleSheetWorkbook.disabled = !singleSheetAllowed;
  els.singleSheetWorkbook.closest?.(".option-row")?.classList.toggle("option-disabled", !singleSheetAllowed);
  const singleSheetActive = singleSheetAllowed && els.singleSheetWorkbook.checked;
  els.stackingOptions.classList.toggle("stacking-options-disabled", !singleSheetActive);
  els.stackingOptions.setAttribute("aria-disabled", String(!singleSheetActive));
  els.stackDirectionOptions.forEach((option) => {
    option.disabled = !singleSheetActive;
  });
  updateLaunchpad();
}

function selectedStackDirection() {
  return els.stackDirectionOptions.find((option) => option.checked)?.value || "vertical";
}

function launchpadCard(icon, label, value, detail, accent = "") {
  return `
    <div class="launch-card ${accent}">
      <span class="launch-icon">${icon}</span>
      <div>
        <small>${escapeHtml(label)}</small>
        <strong>${escapeHtml(value)}</strong>
        <p>${escapeHtml(detail)}</p>
      </div>
    </div>
  `;
}

function updateLaunchpad() {
  if (!els.launchpad) return;
  const hasActiveOutput = state.reviewItems.length || els.resultsBody?.querySelector?.("tr:not(.empty-row)");
  els.launchpad.hidden = Boolean(hasActiveOutput);
  if (hasActiveOutput) return;

  const pdfCount = state.files.length;
  const totalSize = state.files.reduce((total, file) => total + (file.size || 0), 0);
  const outputMode = els.singleSheetWorkbook.checked
    ? `One sheet - ${selectedStackDirection()}`
    : els.combinedWorkbook.checked
      ? "Combined workbook"
      : "Individual files";
  const outputDetail = els.singleSheetWorkbook.checked
    ? "Profiles placed in your uploaded order."
    : els.combinedWorkbook.checked
      ? "One workbook plus individual profile files."
      : "Only separate Excel files will be prepared.";
  const reviewMode = els.reviewBeforeExcel.checked ? "Review first" : "Direct convert";
  const nextAction = pdfCount ? (els.reviewBeforeExcel.checked ? "Ready to review" : "Ready to convert") : "Add CV PDFs";

  els.launchpad.innerHTML = `
    <div class="launch-heading">
      <div>
        <h3>Smart Launchpad</h3>
        <p>Live production preview before you run the batch.</p>
      </div>
      <span>${escapeHtml(nextAction)}</span>
    </div>
    <div class="launch-grid">
      ${launchpadCard('<svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z"></path><path d="M15 3v4h4"></path><path d="M9 13h6"></path><path d="M9 17h4"></path></svg>', "PDF queue", pdfCount ? `${pdfCount} selected` : "No PDFs", pdfCount ? formatBytes(totalSize) : "Choose files or folder", "blue")}
      ${launchpadCard('<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"></path><path d="M8 8h8"></path><path d="M8 12h8"></path><path d="M8 16h5"></path></svg>', "Template", state.templateFile ? "Custom" : "Built-in", state.templateFile ? state.templateFile.name : "ProfileForge default layout", "green")}
      ${launchpadCard('<svg viewBox="0 0 24 24"><path d="M4 7h16"></path><path d="M4 12h16"></path><path d="M4 17h10"></path><path d="M18 15l2 2-2 2"></path></svg>', "Output", outputMode, outputDetail, "gold")}
      ${launchpadCard('<svg viewBox="0 0 24 24"><path d="M9 11l2 2 4-5"></path><path d="M20 12a8 8 0 1 1-3-6.2"></path></svg>', "Quality flow", reviewMode, els.reviewBeforeExcel.checked ? "Quality Gate, QA CSV and brief enabled." : "Fast export without manual review.", "blue")}
    </div>
  `;
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

function isLikelyContactLine(line) {
  return /@|\b(?:phone|mobile|email|linkedin|github|location|address)\b/i.test(line);
}

function extractCertificationItems(certs, allLines) {
  const certPattern =
    /\b(certified|certification|certificate|aws|azure|google cloud|pmp|scrum|safe|itil|oracle|microsoft|cisco|salesforce|databricks|snowflake|power bi|tableau)\b/i;
  const fromSection = uniqueItems(certs.filter((line) => !/^certifications?$/i.test(line)));
  if (fromSection.length) return fromSection;
  return uniqueItems(
    allLines.filter((line) => {
      if (/^certifications?$/i.test(line) || isLikelyContactLine(line)) return false;
      return certPattern.test(line) && line.length <= 160;
    }),
  ).slice(0, 8);
}

function extractEducationText(education, allLines) {
  const educationText = trimToWords(education.map(stripBullet).join(" - "), 450);
  if (educationText) return educationText;
  const educationPattern =
    /\b(bachelor|master|b\.?\s?sc|m\.?\s?sc|b\.?\s?tech|m\.?\s?tech|b\.?\s?e\.?|m\.?\s?e\.?|bca|mca|mba|phd|doctorate|diploma|degree|university|college|institute)\b/i;
  const candidates = uniqueItems(
    allLines.filter((line) => {
      if (/^(education|certifications?|technical skills|work experience|professional summary)$/i.test(line)) return false;
      if (isLikelyContactLine(line)) return false;
      return educationPattern.test(line) && line.length <= 160;
    }),
  );
  return trimToWords(candidates.slice(0, 6).join(" - "), 450);
}

function extractEmployerItems(workLines, allLines) {
  const explicit = extractEmployers(workLines);
  if (explicit.length) return explicit;
  const employerPattern = /\b(llc|l\.l\.c|ltd|limited|inc|technologies|technology|solutions|systems|consulting|consultancy|bank|group|global|company|corp|corporation)\b/i;
  const candidates = uniqueItems(
    [...workLines, ...allLines].filter((line) => {
      if (/^[-*]|\b(responsible|developed|managed|built|designed|skills|education|certification)\b/i.test(line)) return false;
      if (isLikelyContactLine(line) || line.length > 120) return false;
      return employerPattern.test(line);
    }),
  );
  return candidates.slice(0, 5);
}

function inferProjectsText(workLines, relevantExperience) {
  const summarized = summarizeProjects(workLines);
  if (summarized) return summarized;
  const cleanWorkLines = uniqueItems(
    workLines.filter((line) => {
      if (/^(work experience|professional summary)$/i.test(line)) return false;
      if (isLikelyContactLine(line) || line.length < 20) return false;
      return !/^\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)/i.test(line);
    }),
  );
  const fromWork = trimToWords(cleanWorkLines.slice(0, 4).join("; "), 700);
  if (fromWork) return fromWork;
  return isPlaceholderValue(relevantExperience)
    ? ""
    : trimToWords(`Project exposure aligned to CV experience: ${relevantExperience}`, 700);
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

  const certificationItems = extractCertificationItems(certs, allLines);
  const educationText = extractEducationText(education, allLines);
  const employerItems = extractEmployerItems(work, allLines);

  const relevantExperience =
    trimToWords(summary.join(" "), 550) ||
    trimToWords(extractBullets(work).slice(0, 3).join("; "), 550) ||
    trimToWords(firstContent.slice(1, 5).join(" "), 550) ||
    "Relevant experience to be confirmed during screening.";
  const projectsHandled = inferProjectsText(work, relevantExperience);

  return {
    sourceName: fileName,
    roleCode: fileParts.roleCode || FIELD_FALLBACKS.roleCode,
    roleTitle: titleCaseLight(roleTitle),
    candidateName: titleCaseLight(candidateName),
    yearsOfExperience: extractYears(cleanText) || FIELD_FALLBACKS.yearsOfExperience,
    relevantExperience,
    keySkills: trimToWords(skillItems.join(", "), 850) || FIELD_FALLBACKS.keySkills,
    certifications: certificationItems.length ? trimToWords(certificationItems.join("; "), 550) : FIELD_FALLBACKS.certifications,
    educationalQualifications: educationText || FIELD_FALLBACKS.educationalQualifications,
    previousEmployer: employerItems.length ? employerItems.join("; ") : FIELD_FALLBACKS.previousEmployer,
    projectsHandled: projectsHandled || FIELD_FALLBACKS.projectsHandled,
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
    [null, "Note: ", profile.note || PROFILE_NOTE],
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

function parseCellReference(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/\$/g, "")
    .replace(/^.*!/, "")
    .toUpperCase();
  const match = cleaned.match(/^([A-Z]{1,3})([1-9]\d{0,6})$/);
  if (!match) return null;
  const column = columnNameToIndex(match[1]);
  const row = Number(match[2]);
  if (column < 1 || column > 16384 || row < 1 || row > 1048576) return null;
  return { ref: `${match[1]}${row}`, column, row };
}

function normalizeTemplateMapping(mapping = DEFAULT_TEMPLATE_MAPPING) {
  const normalized = {};
  for (const field of PROFILE_FIELDS) {
    const parsed = parseCellReference(mapping[field.id] || field.defaultCell);
    normalized[field.id] = parsed?.ref || field.defaultCell;
  }
  return normalized;
}

function templateContentArea(mapping = DEFAULT_TEMPLATE_MAPPING) {
  let maxColumn = 3;
  let maxRow = 13;
  for (const ref of Object.values(mapping)) {
    const parsed = parseCellReference(ref);
    if (!parsed) continue;
    maxColumn = Math.max(maxColumn, parsed.column);
    maxRow = Math.max(maxRow, parsed.row);
  }
  return {
    maxColumn,
    maxRow,
    ref: `A1:${columnName(maxColumn)}${maxRow}`,
    absoluteRef: `$A$1:$${columnName(maxColumn)}$${maxRow}`,
  };
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

function profileCellStyle(styleRowNumber, localCol) {
  let style = 2;
  if (styleRowNumber === 1) style = 1;
  else if (localCol === 1) style = 3;
  else if (localCol === 2 && styleRowNumber !== 13) style = 4;
  else if (styleRowNumber === 13 && localCol === 2) style = 5;
  else if (styleRowNumber === 13 && localCol === 3) style = 6;
  return style;
}

function rowCellsXml(rowNumber, values, styleRowNumber = rowNumber, colOffset = 0) {
  return values
    .map((value, index) => {
      const localCol = index + 1;
      return cellXml(rowNumber, colOffset + localCol, value, profileCellStyle(styleRowNumber, localCol));
    })
    .join("");
}

function rowXml(rowNumber, values, height, styleRowNumber = rowNumber, colOffset = 0) {
  const cells = rowCellsXml(rowNumber, values, styleRowNumber, colOffset);
  return `<row r="${rowNumber}" ht="${height}" customHeight="1">${cells}</row>`;
}

const PROFILE_ROW_HEIGHTS = [37.5, 22.5, 22.5, 22.5, 22.5, 66, 81, 51, 39, 36, 88.5, 9, 33];

function sheetXml(profile) {
  const rows = profileTable(profile).map((values, index) => rowXml(index + 1, values, PROFILE_ROW_HEIGHTS[index])).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  <dimension ref="A1:C13"/>
  <sheetViews><sheetView workbookViewId="0" showGridLines="0" defaultGridColor="0" colorId="1"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>
    <col min="1" max="1" width="5.25" customWidth="1"/>
    <col min="2" max="2" width="24.23" customWidth="1"/>
    <col min="3" max="3" width="96.23" customWidth="1"/>
  </cols>
  <sheetData>${rows}</sheetData>
  <printOptions horizontalCentered="1" gridLines="0"/>
  <pageMargins left="0.25" right="0.25" top="0.35" bottom="0.35" header="0.1" footer="0.1"/>
  <pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="1" horizontalDpi="300" verticalDpi="300"/>
  <headerFooter><oddFooter>&amp;L&amp;F&amp;C&amp;A&amp;R&amp;P/&amp;N</oddFooter></headerFooter>
</worksheet>`;
}

function stackedSheetData(records) {
  let rowNumber = 1;
  const rows = [];
  records.forEach((record, recordIndex) => {
    profileTable(record.profile).forEach((values, index) => {
      rows.push(rowXml(rowNumber, values, PROFILE_ROW_HEIGHTS[index], index + 1));
      rowNumber += 1;
    });
    if (recordIndex < records.length - 1) {
      rows.push(`<row r="${rowNumber}" ht="9" customHeight="1"/>`);
      rowNumber += 1;
    }
  });
  return { rows: rows.join(""), totalRows: Math.max(1, rowNumber - 1) };
}

function horizontalStackedSheetData(records) {
  const profileTables = records.map((record) => profileTable(record.profile));
  const rows = PROFILE_ROW_HEIGHTS.map((height, index) => {
    const rowNumber = index + 1;
    const cells = profileTables
      .map((table, recordIndex) => rowCellsXml(rowNumber, table[index], rowNumber, recordIndex * 4))
      .join("");
    return `<row r="${rowNumber}" ht="${height}" customHeight="1">${cells}</row>`;
  }).join("");
  return {
    rows,
    totalRows: 13,
    totalColumns: Math.max(3, records.length * 4 - 1),
  };
}

function stackedColsXml(totalColumns = 3) {
  const cols = [];
  for (let col = 1; col <= totalColumns; col += 1) {
    const position = (col - 1) % 4;
    if (position === 0) cols.push(`<col min="${col}" max="${col}" width="5.25" customWidth="1"/>`);
    else if (position === 1) cols.push(`<col min="${col}" max="${col}" width="24.23" customWidth="1"/>`);
    else if (position === 2) cols.push(`<col min="${col}" max="${col}" width="96.23" customWidth="1"/>`);
    else cols.push(`<col min="${col}" max="${col}" width="2.5" customWidth="1"/>`);
  }
  return `<cols>${cols.join("")}</cols>`;
}

function stackedSheetXml(records, direction = "vertical") {
  const horizontal = direction === "horizontal";
  const { rows, totalRows, totalColumns = 3 } = horizontal ? horizontalStackedSheetData(records) : stackedSheetData(records);
  const lastCell = `${columnName(totalColumns)}${totalRows}`;
  const pageSetup = horizontal
    ? '<pageSetup paperSize="9" orientation="portrait" fitToWidth="0" fitToHeight="1" horizontalDpi="300" verticalDpi="300"/>'
    : '<pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0" horizontalDpi="300" verticalDpi="300"/>';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  <dimension ref="A1:${lastCell}"/>
  <sheetViews><sheetView workbookViewId="0" showGridLines="0" defaultGridColor="0" colorId="1"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  ${horizontal ? stackedColsXml(totalColumns) : stackedColsXml(3)}
  <sheetData>${rows}</sheetData>
  <printOptions horizontalCentered="1" gridLines="0"/>
  <pageMargins left="0.25" right="0.25" top="0.35" bottom="0.35" header="0.1" footer="0.1"/>
  ${pageSetup}
  <headerFooter><oddFooter>&amp;L&amp;F&amp;C&amp;A&amp;R&amp;P/&amp;N</oddFooter></headerFooter>
</worksheet>`;
}

function verticalStackedSheetXml(records) {
  const { rows, totalRows } = stackedSheetData(records);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  <dimension ref="A1:C${totalRows}"/>
  <sheetViews><sheetView workbookViewId="0" showGridLines="0" defaultGridColor="0" colorId="1"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>
    <col min="1" max="1" width="5.25" customWidth="1"/>
    <col min="2" max="2" width="24.23" customWidth="1"/>
    <col min="3" max="3" width="96.23" customWidth="1"/>
  </cols>
  <sheetData>${rows}</sheetData>
  <printOptions horizontalCentered="1" gridLines="0"/>
  <pageMargins left="0.25" right="0.25" top="0.35" bottom="0.35" header="0.1" footer="0.1"/>
  <pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0" horizontalDpi="300" verticalDpi="300"/>
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
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F4E78"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD7DEE8"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor indexed="64"/></patternFill></fill>
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
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="4" borderId="0" applyFill="1"/></cellStyleXfs>
  <cellXfs count="7">
    <xf numFmtId="0" fontId="0" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
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
      const ref = sheet.printArea || `'${sheet.name.replace(/'/g, "''")}'!$A$1:$C$13`;
      return `<definedName name="_xlnm.Print_Area" localSheetId="${index}">${xmlEscape(ref)}</definedName>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView activeTab="0"/></bookViews>
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

async function createStackedWorkbookBlob(records, direction = "vertical") {
  const zip = new JSZip();
  const props = docPropsXml();
  const { totalRows, totalColumns = 3 } = direction === "horizontal" ? horizontalStackedSheetData(records) : stackedSheetData(records);
  const sheetName = "All Profiles";
  const sheets = [
    {
      name: sheetName,
      printArea: `'${sheetName}'!$A$1:$${columnName(totalColumns)}$${totalRows}`,
    },
  ];

  zip.file("[Content_Types].xml", contentTypesXml(1));
  zip.file("_rels/.rels", packageRelsXml());
  zip.file("docProps/core.xml", props.core);
  zip.file("docProps/app.xml", props.app);
  zip.file("xl/workbook.xml", workbookXml(sheets));
  zip.file("xl/_rels/workbook.xml.rels", workbookRelsXml(1));
  zip.file("xl/styles.xml", stylesXml());
  zip.file("xl/worksheets/sheet1.xml", stackedSheetXml(records, direction));

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

function xmlDecodeAttr(value) {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function xmlPrefix(xml, rootName) {
  return xml.match(new RegExp(`<([A-Za-z_][\\w.-]*:)?${rootName}\\b`, "i"))?.[1] || "";
}

function tagName(prefix, localName) {
  return `${prefix}${localName}`;
}

function columnNameToIndex(name) {
  return String(name || "")
    .toUpperCase()
    .split("")
    .reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0);
}

function excelSheetNameReference(sheetName, area = "$A$1:$C$13") {
  return `'${String(sheetName).replace(/'/g, "''")}'!${area}`;
}

function profileFieldValues(profile) {
  return {
    roleCode: profile.roleCode,
    roleTitle: profile.roleTitle,
    candidateName: profile.candidateName,
    yearsOfExperience: profile.yearsOfExperience,
    relevantExperience: profile.relevantExperience,
    keySkills: profile.keySkills,
    certifications: profile.certifications,
    educationalQualifications: profile.educationalQualifications,
    previousEmployer: profile.previousEmployer,
    projectsHandled: profile.projectsHandled,
    note: profile.note || PROFILE_NOTE,
  };
}

function profileQuality(profile) {
  const fields = profileFieldValues(profile);
  const issues = [];
  const addIssue = (field, label, text, weight) => issues.push({ field, label, text, weight });
  const skills = String(fields.keySkills || "")
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (isPlaceholderValue(fields.roleCode)) addIssue("roleCode", "Role code", "Confirm role code", 10);
  if (!String(fields.roleTitle || "").trim()) addIssue("roleTitle", "Role title", "Add role title", 8);
  if (!String(fields.candidateName || "").trim()) addIssue("candidateName", "Candidate", "Add candidate name", 14);
  if (!parseYearsNumber(fields.yearsOfExperience)) addIssue("yearsOfExperience", "Years", "Verify years of experience", 10);
  if (isPlaceholderValue(fields.relevantExperience) || String(fields.relevantExperience || "").length < 45) {
    addIssue("relevantExperience", "Experience", "Strengthen relevant experience", 12);
  }
  if (isPlaceholderValue(fields.keySkills) || skills.length < 4) addIssue("keySkills", "Skills", "Add more key skills", 12);
  if (isPlaceholderValue(fields.certifications)) addIssue("certifications", "Certifications", "Confirm certifications", 6);
  if (isPlaceholderValue(fields.educationalQualifications)) addIssue("educationalQualifications", "Education", "Confirm education", 8);
  if (isPlaceholderValue(fields.previousEmployer)) addIssue("previousEmployer", "Employer", "Confirm previous employer", 8);
  if (isPlaceholderValue(fields.projectsHandled) || String(fields.projectsHandled || "").length < 40) {
    addIssue("projectsHandled", "Projects", "Add project highlights", 10);
  }

  const penalty = issues.reduce((total, issue) => total + issue.weight, 0);
  const score = Math.max(45, Math.min(100, 100 - penalty));
  const tone = score >= 88 ? "ready" : score >= 72 ? "review" : "risk";
  const label = tone === "ready" ? "Ready" : tone === "review" ? "Review" : "Needs work";
  return { score, tone, label, issues };
}

function qualityGateHtml(quality) {
  const issueHtml = quality.issues.length
    ? quality.issues
        .slice(0, 5)
        .map((issue) => `<span title="${escapeHtml(issue.label)}">${escapeHtml(issue.text)}</span>`)
        .join("")
    : "<span>Ready for Excel</span>";
  const summary = quality.issues.length
    ? `${quality.issues.length} check${quality.issues.length === 1 ? "" : "s"} to review before final export`
    : "No quality issues flagged";

  return `
    <div class="quality-gate">
      <div class="quality-score ${escapeHtml(quality.tone)}">
        <strong>${quality.score}%</strong>
        <small>${escapeHtml(quality.label)}</small>
      </div>
      <div class="quality-copy">
        <strong>Profile Quality Gate</strong>
        <p>${escapeHtml(summary)}</p>
        <div class="quality-flags">${issueHtml}</div>
      </div>
    </div>
  `;
}

function profileTemplateCells(profile, mapping = DEFAULT_TEMPLATE_MAPPING) {
  const fields = profileFieldValues(profile);
  const normalized = normalizeTemplateMapping(mapping);
  const cells = {};
  for (const field of PROFILE_FIELDS) {
    cells[normalized[field.id]] = fields[field.id];
  }
  return cells;
}

function templateCellXml(prefix, ref, value, attrs = "") {
  const cleanAttrs = attrs
    .replace(/\s?r="[^"]*"/i, "")
    .replace(/\s?t="[^"]*"/i, "")
    .trim();
  const attrText = cleanAttrs ? ` ${cleanAttrs}` : "";
  const cell = tagName(prefix, "c");
  if (value === null || value === undefined || value === "") {
    return `<${cell} r="${ref}"${attrText}/>`;
  }
  const inlineString = tagName(prefix, "is");
  const text = tagName(prefix, "t");
  return `<${cell} r="${ref}"${attrText} t="inlineStr"><${inlineString}><${text}>${xmlEscape(value)}</${text}></${inlineString}></${cell}>`;
}

function ensureTemplateRow(xml, rowNumber, prefix) {
  const p = escapeRegExp(prefix);
  const row = tagName(prefix, "row");
  const sheetData = tagName(prefix, "sheetData");
  const rowPattern = new RegExp(`<${p}row\\b(?=[^>]*\\br="${rowNumber}")[^>]*(?:>[\\s\\S]*?<\\/${p}row>|\\s*\\/>)`, "i");
  if (rowPattern.test(xml)) return xml;

  const newRow = `<${row} r="${rowNumber}"></${row}>`;
  const sheetDataPattern = new RegExp(`(<${p}sheetData\\b[^>]*>)([\\s\\S]*?)(<\\/${p}sheetData>)`, "i");
  if (!sheetDataPattern.test(xml)) {
    return xml.replace(new RegExp(`(<\\/${p}worksheet>)`, "i"), `<${sheetData}>${newRow}</${sheetData}>$1`);
  }

  return xml.replace(sheetDataPattern, (match, open, body, close) => {
    const existingRows = Array.from(body.matchAll(new RegExp(`<${p}row\\b[^>]*(?:>[\\s\\S]*?<\\/${p}row>|\\s*\\/>)`, "gi")));
    let insertAt = body.length;
    for (const rowMatch of existingRows) {
      const existingNumber = Number(rowMatch[0].match(/\br="(\d+)"/i)?.[1]);
      if (existingNumber > rowNumber) {
        insertAt = rowMatch.index;
        break;
      }
    }
    return `${open}${body.slice(0, insertAt)}${newRow}${body.slice(insertAt)}${close}`;
  });
}

function insertTemplateCell(xml, ref, value, prefix) {
  const rowNumber = Number(ref.match(/\d+/)?.[0] || 0);
  const column = ref.match(/[A-Z]+/i)?.[0] || "A";
  const targetColumn = columnNameToIndex(column);
  const p = escapeRegExp(prefix);
  const row = tagName(prefix, "row");
  const rowPattern = new RegExp(`<${p}row\\b(?=[^>]*\\br="${rowNumber}")[^>]*(?:>[\\s\\S]*?<\\/${p}row>|\\s*\\/>)`, "i");

  xml = ensureTemplateRow(xml, rowNumber, prefix);
  return xml.replace(rowPattern, (rowXml) => {
    const cell = templateCellXml(prefix, ref, value);
    if (/\/>\s*$/.test(rowXml)) {
      const attrs = rowXml.match(new RegExp(`<${p}row\\b([^>]*)\\/>`, "i"))?.[1] || "";
      return `<${row}${attrs}>${cell}</${row}>`;
    }

    return rowXml.replace(new RegExp(`(<${p}row\\b[^>]*>)([\\s\\S]*?)(<\\/${p}row>)`, "i"), (match, open, body, close) => {
      const cells = Array.from(body.matchAll(new RegExp(`<${p}c\\b[^>]*(?:>[\\s\\S]*?<\\/${p}c>|\\s*\\/>)`, "gi")));
      let insertAt = body.length;
      for (const existingCell of cells) {
        const existingColumn = existingCell[0].match(/\br="([A-Z]+)\d+"/i)?.[1];
        if (existingColumn && columnNameToIndex(existingColumn) > targetColumn) {
          insertAt = existingCell.index;
          break;
        }
      }
      return `${open}${body.slice(0, insertAt)}${cell}${body.slice(insertAt)}${close}`;
    });
  });
}

function setTemplateCell(xml, ref, value) {
  const prefix = xmlPrefix(xml, "worksheet");
  const p = escapeRegExp(prefix);
  const cellPattern = new RegExp(`<${p}c\\b(?=[^>]*\\br="${ref}")[^>]*(?:>[\\s\\S]*?<\\/${p}c>|\\s*\\/>)`, "i");
  if (!cellPattern.test(xml)) {
    return insertTemplateCell(xml, ref, value, prefix);
  }
  return xml.replace(cellPattern, (match) => {
    const attrs = match.match(new RegExp(`<${p}c\\b([^>]*)`, "i"))?.[1] || "";
    return templateCellXml(prefix, ref, value, attrs);
  });
}

function replaceOrInsertSelfClosingXml(xml, tagLocalName, replacement, insertBeforeLocalName, prefix) {
  const p = escapeRegExp(prefix);
  const tag = tagName(prefix, tagLocalName);
  const tagPattern = new RegExp(`<${p}${tagLocalName}\\b[^>]*/>`, "i");
  if (tagPattern.test(xml)) {
    return xml.replace(tagPattern, replacement);
  }

  const openClosePattern = new RegExp(`<${p}${tagLocalName}\\b[^>]*>[\\s\\S]*?<\\/${p}${tagLocalName}>`, "i");
  if (openClosePattern.test(xml)) {
    return xml.replace(openClosePattern, replacement);
  }

  const insertPattern = new RegExp(`(<${p}${insertBeforeLocalName}\\b)`, "i");
  if (insertPattern.test(xml)) {
    return xml.replace(insertPattern, `${replacement}$1`);
  }

  return xml.replace(new RegExp(`(<\\/${p}worksheet>)`, "i"), `${replacement}$1`);
}

function templateSheetViewXml(prefix, attrs = "", selfClosing = true) {
  const cleanedAttrs = attrs
    .replace(/\s(?:showGridLines|defaultGridColor|colorId|workbookViewId)="[^"]*"/gi, "")
    .trim();
  const preserved = cleanedAttrs ? `${cleanedAttrs} ` : "";
  const close = selfClosing ? "/>" : ">";
  return `<${tagName(prefix, "sheetView")} ${preserved}workbookViewId="0" showGridLines="0" defaultGridColor="0" colorId="1"${close}`;
}

function limitTemplateWorksheetRange(xml, prefix, area = templateContentArea()) {
  const p = escapeRegExp(prefix);

  if (new RegExp(`<${p}dimension\\b[^>]*/>`, "i").test(xml)) {
    xml = xml.replace(new RegExp(`<${p}dimension\\b[^>]*/>`, "i"), `<${tagName(prefix, "dimension")} ref="${area.ref}"/>`);
  } else {
    xml = xml.replace(new RegExp(`(<${p}sheetViews\\b)`, "i"), `<${tagName(prefix, "dimension")} ref="${area.ref}"/>$1`);
  }

  if (new RegExp(`<${p}cols\\b[^>]*>[\\s\\S]*?<\\/${p}cols>`, "i").test(xml)) {
    xml = xml.replace(new RegExp(`<${p}cols\\b[^>]*>[\\s\\S]*?<\\/${p}cols>`, "i"), (colsBlock) => {
      const cols = [];
      for (const match of colsBlock.matchAll(new RegExp(`<${p}col\\b([^>]*)/>`, "gi"))) {
        const attrs = match[1];
        const min = Number(attrs.match(/\bmin="(\d+)"/i)?.[1] || 0);
        const max = Number(attrs.match(/\bmax="(\d+)"/i)?.[1] || min);
        if (min && max && min <= area.maxColumn && max >= 1) {
          const boundedAttrs = attrs
            .replace(/\bmin="\d+"/i, `min="${Math.max(1, min)}"`)
            .replace(/\bmax="\d+"/i, `max="${Math.min(area.maxColumn, max)}"`);
          cols.push(`<${tagName(prefix, "col")}${boundedAttrs}/>`);
        }
      }
      return cols.length ? `<${tagName(prefix, "cols")}>${cols.join("")}</${tagName(prefix, "cols")}>` : "";
    });
  } else {
    const fallbackCols = [
      `<${tagName(prefix, "cols")}>`,
      `<${tagName(prefix, "col")} min="1" max="1" width="5.25" customWidth="1"/>`,
      `<${tagName(prefix, "col")} min="2" max="2" width="24.23" customWidth="1"/>`,
      `<${tagName(prefix, "col")} min="3" max="${Math.min(area.maxColumn, 3)}" width="96.23" customWidth="1"/>`,
      `</${tagName(prefix, "cols")}>`,
    ].join("");
    xml = xml.replace(new RegExp(`(<${p}sheetData\\b)`, "i"), `${fallbackCols}$1`);
  }

  xml = xml
    .replace(new RegExp(`<${p}tableParts\\b[^>]*>[\\s\\S]*?<\\/${p}tableParts>`, "gi"), "")
    .replace(new RegExp(`<${p}autoFilter\\b[^>]*/>`, "gi"), "")
    .replace(new RegExp(`<${p}drawing\\b[^>]*/>`, "gi"), "")
    .replace(new RegExp(`<${p}legacyDrawing\\b[^>]*/>`, "gi"), "")
    .replace(new RegExp(`<${p}picture\\b[^>]*>[\\s\\S]*?<\\/${p}picture>`, "gi"), "")
    .replace(new RegExp(`<${p}picture\\b[^>]*/>`, "gi"), "");

  return xml.replace(new RegExp(`<${p}sheetData\\b[^>]*>([\\s\\S]*?)<\\/${p}sheetData>`, "i"), (match, body) => {
    const rows = body.replace(
      new RegExp(`<${p}row\\b([^>]*)>([\\s\\S]*?)<\\/${p}row>|<${p}row\\b([^>]*)\\/>`, "gi"),
      (rowMatch, openAttrs, content, selfAttrs) => {
        const attrs = openAttrs ?? selfAttrs ?? "";
        const rowNumber = Number(attrs.match(/\br="(\d+)"/i)?.[1]);
        if (!rowNumber || rowNumber < 1 || rowNumber > area.maxRow || content === undefined) {
          return "";
        }

        const cleanCell = (cellMatch, colName, rowRef) => {
          const colNumber = columnNameToIndex(colName);
          const cellRow = Number(rowRef);
          return colNumber >= 1 && colNumber <= area.maxColumn && cellRow >= 1 && cellRow <= area.maxRow ? cellMatch : "";
        };

        const cells = content
          .replace(new RegExp(`<${p}c\\b[^>]*\\br="([A-Z]+)(\\d+)"[^>]*>[\\s\\S]*?<\\/${p}c>`, "gi"), cleanCell)
          .replace(new RegExp(`<${p}c\\b[^>]*\\br="([A-Z]+)(\\d+)"[^>]*/>`, "gi"), cleanCell);
        const cleanedAttrs = attrs.replace(/\ss="[^"]*"/gi, "").replace(/\scustomFormat="[^"]*"/gi, "");
        return `<${tagName(prefix, "row")}${cleanedAttrs}>${cells}</${tagName(prefix, "row")}>`;
      },
    );
    return `<${tagName(prefix, "sheetData")}>${rows}</${tagName(prefix, "sheetData")}>`;
  });
}

function ensureTemplateSheetOutputSettings(xml, area = templateContentArea()) {
  const prefix = xmlPrefix(xml, "worksheet");
  const p = escapeRegExp(prefix);
  const footerXml = `<${tagName(prefix, "headerFooter")}><${tagName(prefix, "oddFooter")}>&amp;L&amp;F&amp;C&amp;A&amp;R&amp;P/&amp;N</${tagName(prefix, "oddFooter")}></${tagName(prefix, "headerFooter")}>`;

  if (new RegExp(`<${p}sheetPr\\b[^>]*/>`, "i").test(xml)) {
    xml = xml.replace(new RegExp(`<${p}sheetPr\\b([^>]*)/>`, "i"), `<${tagName(prefix, "sheetPr")}$1><${tagName(prefix, "pageSetUpPr")} fitToPage="1"/></${tagName(prefix, "sheetPr")}>`);
  } else if (new RegExp(`<${p}sheetPr\\b[^>]*>`, "i").test(xml)) {
    if (new RegExp(`<${p}pageSetUpPr\\b[^>]*/>`, "i").test(xml)) {
      xml = xml.replace(new RegExp(`<${p}pageSetUpPr\\b[^>]*/>`, "i"), `<${tagName(prefix, "pageSetUpPr")} fitToPage="1"/>`);
    } else {
      xml = xml.replace(new RegExp(`(<${p}sheetPr\\b[^>]*>)`, "i"), `$1<${tagName(prefix, "pageSetUpPr")} fitToPage="1"/>`);
    }
  } else {
    xml = xml.replace(new RegExp(`(<${p}worksheet\\b[^>]*>)`, "i"), `$1<${tagName(prefix, "sheetPr")}><${tagName(prefix, "pageSetUpPr")} fitToPage="1"/></${tagName(prefix, "sheetPr")}>`);
  }

  if (new RegExp(`<${p}sheetView\\b[^>]*/>`, "i").test(xml)) {
    xml = xml.replace(new RegExp(`<${p}sheetView\\b([^>]*)/>`, "i"), (match, attrs) => templateSheetViewXml(prefix, attrs, true));
  } else if (new RegExp(`<${p}sheetView\\b[^>]*>`, "i").test(xml)) {
    xml = xml.replace(new RegExp(`<${p}sheetView\\b([^>]*)>`, "i"), (match, attrs) => templateSheetViewXml(prefix, attrs, false));
  } else if (new RegExp(`<${p}sheetViews\\b[^>]*>`, "i").test(xml)) {
    xml = xml.replace(new RegExp(`(<${p}sheetViews\\b[^>]*>)`, "i"), `$1${templateSheetViewXml(prefix, "", true)}`);
  } else {
    xml = xml.replace(new RegExp(`(<${p}sheetFormatPr\\b)`, "i"), `<${tagName(prefix, "sheetViews")}>${templateSheetViewXml(prefix, "", true)}</${tagName(prefix, "sheetViews")}>$1`);
  }

  xml = replaceOrInsertSelfClosingXml(xml, "printOptions", `<${tagName(prefix, "printOptions")} horizontalCentered="1" gridLines="0"/>`, "pageMargins", prefix);
  xml = replaceOrInsertSelfClosingXml(
    xml,
    "pageMargins",
    `<${tagName(prefix, "pageMargins")} left="0.25" right="0.25" top="0.35" bottom="0.35" header="0.1" footer="0.1"/>`,
    "pageSetup",
    prefix,
  );

  const pageSetupXml = `<${tagName(prefix, "pageSetup")} paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="1" horizontalDpi="300" verticalDpi="300"/>`;
  if (new RegExp(`<${p}pageSetup\\b[^>]*/>`, "i").test(xml)) {
    xml = xml.replace(new RegExp(`<${p}pageSetup\\b[^>]*/>`, "i"), pageSetupXml);
  } else if (new RegExp(`<${p}pageSetup\\b[^>]*>[\\s\\S]*?<\\/${p}pageSetup>`, "i").test(xml)) {
    xml = xml.replace(new RegExp(`<${p}pageSetup\\b[^>]*>[\\s\\S]*?<\\/${p}pageSetup>`, "i"), pageSetupXml);
  } else if (new RegExp(`<${p}pageMargins\\b[^>]*/>`, "i").test(xml)) {
    xml = xml.replace(new RegExp(`(<${p}pageMargins\\b[^>]*/>)`, "i"), `$1${pageSetupXml}`);
  } else {
    xml = xml.replace(new RegExp(`(<\\/${p}worksheet>)`, "i"), `${pageSetupXml}$1`);
  }

  if (new RegExp(`<${p}headerFooter\\b[^>]*>[\\s\\S]*?<\\/${p}headerFooter>`, "i").test(xml)) {
    xml = xml.replace(new RegExp(`<${p}headerFooter\\b[^>]*>[\\s\\S]*?<\\/${p}headerFooter>`, "i"), footerXml);
  } else if (new RegExp(`<${p}pageSetup\\b[^>]*/>`, "i").test(xml)) {
    xml = xml.replace(new RegExp(`(<${p}pageSetup\\b[^>]*/>)`, "i"), `$1${footerXml}`);
  } else {
    xml = xml.replace(new RegExp(`(<\\/${p}worksheet>)`, "i"), `${footerXml}$1`);
  }

  return limitTemplateWorksheetRange(xml, prefix, area);
}

function setXmlAttr(attrs, name, value) {
  const pattern = new RegExp(`\\s${name}="[^"]*"`, "i");
  if (pattern.test(attrs)) {
    return attrs.replace(pattern, ` ${name}="${value}"`);
  }
  return `${attrs} ${name}="${value}"`;
}

function removeXmlAttr(attrs, name) {
  return attrs.replace(new RegExp(`\\s${name}="[^"]*"`, "i"), "");
}

function normalizeXfXml(xfXml, prefix, forceNoBorder) {
  const p = escapeRegExp(prefix);
  const xf = tagName(prefix, "xf");
  const alignment = tagName(prefix, "alignment");
  const openMatch = xfXml.match(new RegExp(`^<${p}xf\\b([^>]*?)(\\/?)>`, "i"));
  if (!openMatch) return xfXml;

  let attrs = openMatch[1] || "";
  if (forceNoBorder) {
    attrs = setXmlAttr(removeXmlAttr(removeXmlAttr(attrs, "borderId"), "applyBorder"), "borderId", "0");
  }
  attrs = setXmlAttr(attrs, "applyAlignment", "1");

  if (openMatch[2]) {
    return `<${xf}${attrs}><${alignment} vertical="center"/></${xf}>`;
  }

  let normalized = xfXml.replace(new RegExp(`^<${p}xf\\b[^>]*>`, "i"), `<${xf}${attrs}>`);
  if (new RegExp(`<${p}alignment\\b[^>]*/>`, "i").test(normalized)) {
    return normalized.replace(new RegExp(`<${p}alignment\\b([^>]*)/>`, "i"), (match, alignmentAttrs) => {
      const cleanAttrs = setXmlAttr(alignmentAttrs.replace(/\svertical="[^"]*"/i, ""), "vertical", "center");
      return `<${alignment}${cleanAttrs}/>`;
    });
  }
  if (new RegExp(`<${p}alignment\\b[^>]*>`, "i").test(normalized)) {
    return normalized.replace(new RegExp(`<${p}alignment\\b([^>]*)>`, "i"), (match, alignmentAttrs) => {
      const cleanAttrs = setXmlAttr(alignmentAttrs.replace(/\svertical="[^"]*"/i, ""), "vertical", "center");
      return `<${alignment}${cleanAttrs}>`;
    });
  }
  return normalized.replace(new RegExp(`(<\\/${p}xf>)`, "i"), `<${alignment} vertical="center"/>$1`);
}

function normalizeTemplateStylesXml(xml) {
  const prefix = xmlPrefix(xml, "styleSheet");
  const p = escapeRegExp(prefix);

  xml = xml.replace(new RegExp(`<${p}fonts\\b[^>]*>[\\s\\S]*?<\\/${p}fonts>`, "i"), (fontsXml) =>
    fontsXml
      .replace(new RegExp(`<${p}sz\\b[^>]*/>`, "gi"), `<${tagName(prefix, "sz")} val="10"/>`)
      .replace(new RegExp(`<${p}name\\b[^>]*/>`, "gi"), `<${tagName(prefix, "name")} val="Calibri"/>`),
  );

  xml = xml.replace(/\bvertical="top"/gi, 'vertical="center"');
  return xml.replace(new RegExp(`<${p}cellXfs\\b[^>]*>[\\s\\S]*?<\\/${p}cellXfs>`, "i"), (block) => {
    let isFirst = true;
    return block.replace(new RegExp(`<${p}xf\\b[^>]*(?:>[\\s\\S]*?<\\/${p}xf>|\\s*\\/>)`, "gi"), (xfXml) => {
      const updated = normalizeXfXml(xfXml, prefix, isFirst);
      isFirst = false;
      return updated;
    });
  });
}

function normalizeWorkbookTarget(target) {
  const cleaned = String(target || "").replace(/^\/+/, "").replace(/^\.\.\//, "");
  return cleaned.startsWith("xl/") ? cleaned : `xl/${cleaned}`;
}

function parseWorkbookSheets(workbookXml, relsXml) {
  const rels = new Map();
  for (const match of relsXml.matchAll(/<(?:[A-Za-z_][\w.-]*:)?Relationship\b([^>]*)\/>/g)) {
    const attrs = match[1];
    const id = attrs.match(/\bId="([^"]+)"/)?.[1];
    const target = attrs.match(/\bTarget="([^"]+)"/)?.[1];
    const type = attrs.match(/\bType="([^"]+)"/)?.[1] || "";
    if (!id || !target || !/worksheet/i.test(type)) continue;
    rels.set(id, normalizeWorkbookTarget(target));
  }

  const sheets = [];
  for (const match of workbookXml.matchAll(/<(?:[A-Za-z_][\w.-]*:)?sheet\b([^>]*)\/>/g)) {
    const attrs = match[1];
    const name = xmlDecodeAttr(attrs.match(/\bname="([^"]*)"/)?.[1]) || `Sheet${sheets.length + 1}`;
    const relId = attrs.match(/\br:id="([^"]+)"/)?.[1];
    const fallbackPath = `xl/worksheets/sheet${sheets.length + 1}.xml`;
    sheets.push({
      name,
      path: rels.get(relId) || fallbackPath,
    });
  }
  return sheets;
}

function ensureWorkbookRelationshipsNamespace(workbookXml, prefix) {
  if (/\bxmlns:r="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships"/i.test(workbookXml)) {
    return workbookXml;
  }
  const p = escapeRegExp(prefix);
  return workbookXml.replace(new RegExp(`(<${p}workbook\\b[^>]*)(>)`, "i"), '$1 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"$2');
}

function ensureTemplateWorkbookView(workbookXml, prefix) {
  const p = escapeRegExp(prefix);
  if (new RegExp(`<${p}bookViews\\b`, "i").test(workbookXml)) {
    return workbookXml;
  }
  return workbookXml.replace(new RegExp(`(<${p}sheets\\b)`, "i"), `<${tagName(prefix, "bookViews")}><${tagName(prefix, "workbookView")} activeTab="0"/></${tagName(prefix, "bookViews")}>$1`);
}

function ensureTemplateWorkbookPrintAreas(workbookXml, sheets, prefix) {
  const p = escapeRegExp(prefix);
  const definedNames = sheets
    .map(
      (sheet, index) =>
        `<${tagName(prefix, "definedName")} name="_xlnm.Print_Area" localSheetId="${index}">${xmlEscape(excelSheetNameReference(sheet.name, sheet.area?.absoluteRef || "$A$1:$C$13"))}</${tagName(prefix, "definedName")}>`,
    )
    .join("");

  if (new RegExp(`<${p}definedNames\\b[^>]*>[\\s\\S]*?<\\/${p}definedNames>`, "i").test(workbookXml)) {
    return workbookXml.replace(new RegExp(`<${p}definedNames\\b[^>]*>[\\s\\S]*?<\\/${p}definedNames>`, "i"), (block) => {
      const withoutPrintAreas = block.replace(
        new RegExp(`<${p}definedName\\b(?=[^>]*\\bname="_xlnm\\.Print_Area")[^>]*>[\\s\\S]*?<\\/${p}definedName>`, "gi"),
        "",
      );
      return withoutPrintAreas.replace(new RegExp(`(<\\/${p}definedNames>)`, "i"), (match) => `${definedNames}${match}`);
    });
  }

  return workbookXml.replace(
    new RegExp(`(<\\/${p}workbook>)`, "i"),
    (match) => `<${tagName(prefix, "definedNames")}>${definedNames}</${tagName(prefix, "definedNames")}>${match}`,
  );
}

function replaceTemplateWorkbookSheetsXml(workbookXml, sheets) {
  const prefix = xmlPrefix(workbookXml, "workbook");
  const p = escapeRegExp(prefix);
  const sheetNodes = sheets
    .map((sheet, index) => `<${tagName(prefix, "sheet")} name="${xmlAttr(sheet.name)}" sheetId="${index + 1}" r:id="rIdProfile${index + 1}"/>`)
    .join("");
  const sheetsXml = `<${tagName(prefix, "sheets")}>${sheetNodes}</${tagName(prefix, "sheets")}>`;

  workbookXml = ensureWorkbookRelationshipsNamespace(workbookXml, prefix);
  if (new RegExp(`<${p}sheets\\b[^>]*>[\\s\\S]*?<\\/${p}sheets>`, "i").test(workbookXml)) {
    workbookXml = workbookXml.replace(new RegExp(`<${p}sheets\\b[^>]*>[\\s\\S]*?<\\/${p}sheets>`, "i"), sheetsXml);
  } else {
    workbookXml = workbookXml.replace(new RegExp(`(<\\/${p}workbook>)`, "i"), `${sheetsXml}$1`);
  }

  return ensureTemplateWorkbookPrintAreas(ensureTemplateWorkbookView(workbookXml, prefix), sheets, prefix);
}

function templateWorkbookRelsXml(relsXml, sheetCount) {
  const sheetRels = Array.from(
    { length: sheetCount },
    (_, index) =>
      `<Relationship Id="rIdProfile${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
  ).join("");
  const cleaned = relsXml
    .replace(/<(?:[A-Za-z_][\w.-]*:)?Relationship\b(?=[^>]*\bType="[^"]*worksheet")[^>]*\/>/gi, "")
    .replace(/<(?:[A-Za-z_][\w.-]*:)?Relationship\b(?=[^>]*\bType="[^"]*calcChain")[^>]*\/>/gi, "");
  return cleaned.replace(/(<\/(?:[A-Za-z_][\w.-]*:)?Relationships>)/i, `${sheetRels}$1`);
}

function templateContentTypesXml(contentXml, sheetCount) {
  const sheetOverrides = Array.from(
    { length: sheetCount },
    (_, index) =>
      `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join("");
  const cleaned = contentXml
    .replace(/<(?:[A-Za-z_][\w.-]*:)?Override\b(?=[^>]*\bPartName="\/xl\/worksheets\/[^"]+\.xml")[^>]*\/>/gi, "")
    .replace(/<(?:[A-Za-z_][\w.-]*:)?Override\b(?=[^>]*\bPartName="\/xl\/calcChain\.xml")[^>]*\/>/gi, "");
  return cleaned.replace(/(<\/(?:[A-Za-z_][\w.-]*:)?Types>)/i, `${sheetOverrides}$1`);
}

function fillTemplateWorksheetXml(sheetXml, profile, mapping = DEFAULT_TEMPLATE_MAPPING) {
  let xml = sheetXml;
  const area = templateContentArea(mapping);
  for (const [ref, value] of Object.entries(profileTemplateCells(profile, mapping))) {
    xml = setTemplateCell(xml, ref, value);
  }
  return ensureTemplateSheetOutputSettings(xml, area);
}

async function createWorkbookFromTemplate(records, templateSource) {
  const templateBytes = templateSource.bytes || (await templateSource.arrayBuffer());
  const zip = await JSZip.loadAsync(templateBytes);
  const workbookFile = zip.file("xl/workbook.xml");
  const relsFile = zip.file("xl/_rels/workbook.xml.rels");
  const contentTypesFile = zip.file("[Content_Types].xml");
  const stylesFile = zip.file("xl/styles.xml");

  if (!workbookFile || !relsFile || !contentTypesFile || !stylesFile) {
    throw new Error("The uploaded template is not a valid .xlsx workbook.");
  }

  const workbookXmlText = await workbookFile.async("string");
  const relsXmlText = await relsFile.async("string");
  const workbookSheets = parseWorkbookSheets(workbookXmlText, relsXmlText);
  const baseSheetPath = workbookSheets[0]?.path || "xl/worksheets/sheet1.xml";
  const baseSheetFile = zip.file(baseSheetPath);
  if (!baseSheetFile) {
    throw new Error("The uploaded template does not contain a usable first sheet.");
  }

  const baseSheetXml = await baseSheetFile.async("string");
  const usedNames = new Set();
  const mapping = normalizeTemplateMapping(templateSource.mapping || DEFAULT_TEMPLATE_MAPPING);
  const area = templateContentArea(mapping);
  const sheets = records.map((record) => ({
    name: makeSheetName(record.sourceName, usedNames),
    profile: record.profile,
    area,
  }));

  Object.keys(zip.files).forEach((name) => {
    if (/^xl\/worksheets\/sheet\d+\.xml$/i.test(name) || /^xl\/worksheets\/_rels\/sheet\d+\.xml\.rels$/i.test(name)) {
      zip.remove(name);
    }
  });
  zip.remove("xl/calcChain.xml");

  sheets.forEach((sheet, index) => {
    zip.file(`xl/worksheets/sheet${index + 1}.xml`, fillTemplateWorksheetXml(baseSheetXml, sheet.profile, mapping));
  });

  zip.file("xl/workbook.xml", replaceTemplateWorkbookSheetsXml(workbookXmlText, sheets));
  zip.file("xl/_rels/workbook.xml.rels", templateWorkbookRelsXml(relsXmlText, sheets.length));
  zip.file("[Content_Types].xml", templateContentTypesXml(await contentTypesFile.async("string"), sheets.length));
  zip.file("xl/styles.xml", normalizeTemplateStylesXml(await stylesFile.async("string")));

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

async function createProfileWorkbookBlob(records, templateSource = null) {
  if (templateSource) {
    return createWorkbookFromTemplate(records, templateSource);
  }
  return createWorkbookBlob(records);
}

async function createCombinedWorkbookBlob(records, templateSource = null) {
  if (els.singleSheetWorkbook.checked) {
    return createStackedWorkbookBlob(records, selectedStackDirection());
  }
  return createProfileWorkbookBlob(records, templateSource);
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

function reviewProfileFromCard(item, index) {
  const card = els.reviewList.querySelector(`[data-review-index="${index}"]`);
  const profile = { ...item.profile };
  for (const field of PROFILE_FIELDS) {
    const input = card?.querySelector(`[data-review-field="${field.id}"]`);
    if (input && "value" in input) {
      profile[field.id] = String(input.value || "").trim();
    }
  }
  profile.note = profile.note || PROFILE_NOTE;
  return profile;
}

function currentReviewQualityItems() {
  return state.reviewItems
    .map((item, index) => {
      if (item.status !== "ready") {
        return {
          sourceName: item.sourceName,
          status: "Failed",
          candidateName: "",
          roleCode: "",
          roleTitle: "",
          yearsOfExperience: "",
          quality: { score: 0, tone: "risk", label: "Failed", issues: [{ text: item.error || "Unable to extract this PDF." }] },
        };
      }
      const profile = reviewProfileFromCard(item, index);
      return {
        sourceName: item.sourceName,
        status: "Ready",
        candidateName: profile.candidateName,
        roleCode: profile.roleCode,
        roleTitle: profile.roleTitle,
        yearsOfExperience: profile.yearsOfExperience,
        profile,
        quality: profileQuality(profile),
      };
    });
}

function qualitySummaryStats(items = currentReviewQualityItems()) {
  const readyItems = items.filter((item) => item.status === "Ready");
  const scores = readyItems.map((item) => item.quality.score);
  return {
    total: items.length,
    extracted: readyItems.length,
    failed: items.length - readyItems.length,
    average: scores.length ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length) : 0,
    ready: readyItems.filter((item) => item.quality.tone === "ready").length,
    review: readyItems.filter((item) => item.quality.tone === "review").length,
    risk: readyItems.filter((item) => item.quality.tone === "risk").length,
    flagged: readyItems.filter((item) => item.quality.issues.length).length,
  };
}

function qualitySummaryHtml(items = currentReviewQualityItems()) {
  const stats = qualitySummaryStats(items);
  if (!stats.total) return "";
  return `
    <div class="quality-command">
      <div class="quality-command-card primary">
        <span>Batch quality</span>
        <strong>${stats.average || 0}%</strong>
      </div>
      <div class="quality-command-card">
        <span>Ready</span>
        <strong>${stats.ready}</strong>
      </div>
      <div class="quality-command-card">
        <span>Review</span>
        <strong>${stats.review}</strong>
      </div>
      <div class="quality-command-card">
        <span>Needs work</span>
        <strong>${stats.risk + stats.failed}</strong>
      </div>
    </div>
  `;
}

function updateQualitySummary() {
  const items = currentReviewQualityItems();
  if (els.qualitySummary) els.qualitySummary.innerHTML = qualitySummaryHtml(items);
  const hasReady = items.some((item) => item.status === "Ready");
  if (els.copyBatchBrief) els.copyBatchBrief.disabled = !hasReady;
  if (els.downloadBatchBrief) els.downloadBatchBrief.disabled = !hasReady;
  if (els.downloadQualityReport) {
    els.downloadQualityReport.disabled = !hasReady;
  }
  return items;
}

function normalizedPersonName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(candidate|profile|cv)\b/g, "")
    .trim();
}

function reviewRoleMix(items) {
  const counts = new Map();
  for (const item of items.filter((entry) => entry.status === "Ready")) {
    const key = item.roleCode || item.roleTitle || "Unassigned role";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function duplicateCandidateWarnings(items) {
  const groups = new Map();
  for (const item of items.filter((entry) => entry.status === "Ready")) {
    const key = normalizedPersonName(item.candidateName);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}

function batchBriefText() {
  const items = currentReviewQualityItems();
  const stats = qualitySummaryStats(items);
  const readyItems = items.filter((item) => item.status === "Ready");
  const ranked = readyItems
    .slice()
    .sort((a, b) => b.quality.score - a.quality.score || candidateScore(b.profile || {}) - candidateScore(a.profile || {}))
    .slice(0, 8);
  const weak = items
    .filter((item) => item.status !== "Ready" || item.quality.tone === "risk" || item.quality.issues.length >= 3)
    .slice(0, 8);
  const roleMix = reviewRoleMix(items);
  const duplicates = duplicateCandidateWarnings(items);
  const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const lines = [
    "ProfileForge Batch Intelligence Brief",
    `Date: ${today}`,
    "",
    "Batch Summary",
    `- PDFs reviewed: ${stats.total}`,
    `- Profiles extracted: ${stats.extracted}`,
    `- Batch quality: ${stats.average || 0}%`,
    `- Ready: ${stats.ready}`,
    `- Review: ${stats.review}`,
    `- Needs work / failed: ${stats.risk + stats.failed}`,
    "",
    "Top Candidates",
    ...(ranked.length
      ? ranked.map((item, index) => `${index + 1}. ${item.candidateName || "Candidate"} - ${item.roleCode || item.roleTitle || "Role"} - quality ${item.quality.score}% - ${item.yearsOfExperience || "years to confirm"}`)
      : ["- No ready profiles yet."]),
    "",
    "Role Mix",
    ...(roleMix.length ? roleMix.map(([role, count]) => `- ${role}: ${count}`) : ["- No roles detected."]),
    "",
    "Review Focus",
    ...(weak.length
      ? weak.map((item, index) => `${index + 1}. ${item.candidateName || item.sourceName || "Profile"} - ${(item.quality.issues || []).map((issue) => issue.text).join("; ") || item.status}`)
      : ["- No major review issues flagged."]),
    "",
    "Duplicate Name Warnings",
    ...(duplicates.length
      ? duplicates.map((group) => `- ${group[0].candidateName}: ${group.map((item) => item.sourceName).join(" | ")}`)
      : ["- No duplicate candidate names detected."]),
    "",
    "Suggested Next Step",
    stats.risk + stats.failed
      ? "- Review the Needs work profiles first, then generate Excel and share the combined workbook."
      : "- Generate Excel and share the combined workbook with confidence.",
  ];

  return lines.join("\n");
}

function reviewQualityReportCsv() {
  const headers = ["Source PDF", "Candidate", "Role Code", "Role Title", "Years", "Quality Score", "Quality Status", "Checks To Review"];
  const rows = currentReviewQualityItems().map((item) => [
    item.sourceName,
    item.candidateName,
    item.roleCode,
    item.roleTitle,
    item.yearsOfExperience,
    item.quality.score || "",
    item.quality.label || item.status,
    (item.quality.issues || []).map((issue) => issue.text).join("; "),
  ]);
  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function reviewSummaryText() {
  if (!state.reviewItems.length) return "No profiles ready";
  const stats = qualitySummaryStats();
  const parts = [`${stats.extracted} profile${stats.extracted === 1 ? "" : "s"} ready`];
  if (stats.failed) parts.push(`${stats.failed} failed`);
  if (stats.extracted) parts.push(`quality ${stats.average}%`);
  if (stats.flagged) parts.push(`${stats.flagged} to review`);
  return parts.join(", ");
}

function refreshQualityGate(index) {
  const item = state.reviewItems[index];
  if (!item || item.status !== "ready") return;
  const card = els.reviewList.querySelector(`[data-review-index="${index}"]`);
  if (!card) return;
  const profile = reviewProfileFromCard(item, index);
  const quality = profileQuality(profile);
  const gate = card.querySelector(".quality-gate");
  if (gate) gate.outerHTML = qualityGateHtml(quality);

  const flaggedFields = new Set(quality.issues.map((issue) => issue.field));
  const reviewFields = card.querySelectorAll?.(".review-field") || [];
  reviewFields.forEach((field) => {
    field.classList.toggle("field-warning", flaggedFields.has(field.dataset.fieldId));
  });

  const stats = qualitySummaryStats(updateQualitySummary());
  const parts = [`${stats.extracted} profile${stats.extracted === 1 ? "" : "s"} ready`];
  if (stats.failed) parts.push(`${stats.failed} failed`);
  if (stats.extracted) parts.push(`quality ${stats.average}%`);
  if (stats.flagged) parts.push(`${stats.flagged} to review`);
  els.reviewSummary.textContent = parts.join(", ");
}

function renderReviewPanel() {
  if (!state.reviewItems.length) {
    els.reviewPanel.hidden = true;
    els.reviewSummary.textContent = "No profiles ready";
    if (els.qualitySummary) els.qualitySummary.innerHTML = "";
    els.reviewList.innerHTML = "";
    els.generateReviewed.disabled = true;
    if (els.copyBatchBrief) els.copyBatchBrief.disabled = true;
    if (els.downloadBatchBrief) els.downloadBatchBrief.disabled = true;
    if (els.downloadQualityReport) els.downloadQualityReport.disabled = true;
    updateLaunchpad();
    return;
  }

  const ready = state.reviewItems.filter((item) => item.status === "ready").length;
  els.reviewPanel.hidden = false;
  els.reviewSummary.textContent = reviewSummaryText();
  els.generateReviewed.disabled = ready === 0;
  updateQualitySummary();
  updateLaunchpad();

  els.reviewList.innerHTML = state.reviewItems
    .map((item, index) => {
      if (item.status === "error") {
        return `
          <article class="review-card error-card">
            <div class="review-card-head">
              <strong>${escapeHtml(item.sourceName)}</strong>
              ${statusBadge("error")}
            </div>
            <p>${escapeHtml(item.error || "Unable to extract this PDF.")}</p>
          </article>
        `;
      }

      const quality = profileQuality(item.profile);
      const flaggedFields = new Set(quality.issues.map((issue) => issue.field));
      return `
        <article class="review-card" data-review-index="${index}">
          <div class="review-card-head">
            <strong>${escapeHtml(item.sourceName)}</strong>
            ${statusBadge("done")}
          </div>
          ${qualityGateHtml(quality)}
          <div class="review-fields">
            ${PROFILE_FIELDS.map((field) => {
              const value = profileFieldValues(item.profile)[field.id] || "";
              const control = LONG_REVIEW_FIELDS.has(field.id)
                ? `<textarea data-review-field="${escapeHtml(field.id)}" rows="${field.id === "projectsHandled" ? 4 : 3}">${escapeHtml(value)}</textarea>`
                : `<input data-review-field="${escapeHtml(field.id)}" type="text" value="${escapeHtml(value)}" />`;
              return `
                <label class="review-field ${flaggedFields.has(field.id) ? "field-warning" : ""}" data-field-id="${escapeHtml(field.id)}">
                  <span>${escapeHtml(field.label)}</span>
                  ${control}
                </label>
              `;
            }).join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function collectReviewedRecords() {
  return state.reviewItems
    .map((item, index) => {
      if (item.status !== "ready") return null;
      const profile = reviewProfileFromCard(item, index);
      return { sourceName: item.sourceName, profile };
    })
    .filter(Boolean);
}

function clearReviewQueue() {
  state.reviewItems = [];
  renderReviewPanel();
}

function renderResults(results) {
  if (!results.length) {
    els.resultsBody.innerHTML = '<tr class="empty-row"><td colspan="5">Awaiting conversion</td></tr>';
    updateLaunchpad();
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
  updateLaunchpad();
}

async function extractProfilesForReview() {
  if (!window.JSZip || !window.pdfjsLib) {
    showToast("Libraries are still loading. Try again in a moment.");
    return;
  }

  clearObjectUrls();
  setDownloadLink(els.downloadCombined, null);
  setDownloadLink(els.downloadZip, null);
  state.reviewItems = [];
  renderReviewPanel();
  renderResults([]);
  els.convertButton.dataset.busy = "true";
  els.convertButton.disabled = true;
  els.convertButton.innerHTML = "Extracting";
  setProgress("Extracting PDFs", 0, state.files.length);

  for (let index = 0; index < state.files.length; index += 1) {
    const file = state.files[index];
    try {
      const text = await extractPdfText(file);
      const profile = parseProfile(text, file.name);
      profile.note = profile.note || PROFILE_NOTE;
      state.reviewItems.push({
        id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
        status: "ready",
        fileKey: fileKey(file),
        sourceName: file.name,
        profile,
      });
    } catch (error) {
      state.reviewItems.push({
        id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
        status: "error",
        fileKey: fileKey(file),
        sourceName: file.name,
        error: error.message,
      });
    }
    renderReviewPanel();
    setProgress("Extracting PDFs", index + 1, state.files.length);
  }

  const ready = state.reviewItems.filter((item) => item.status === "ready").length;
  const failed = state.reviewItems.length - ready;
  setProgress(failed ? "Review ready with errors" : "Ready for review", state.files.length, state.files.length);
  showToast(ready ? `${ready} profile${ready === 1 ? "" : "s"} ready to review` : "No profiles extracted");
  delete els.convertButton.dataset.busy;
  updateConvertState();
}

async function convertFilesDirectly() {
  if (!window.JSZip || !window.pdfjsLib) {
    showToast("Libraries are still loading. Try again in a moment.");
    return;
  }

  clearObjectUrls();
  setDownloadLink(els.downloadCombined, null);
  setDownloadLink(els.downloadZip, null);
  els.convertButton.dataset.busy = "true";
  els.convertButton.disabled = true;
  els.convertButton.innerHTML = "Converting";
  setProgress("Processing PDFs", 0, state.files.length);

  let templateSource = null;
  try {
    templateSource = await readWorkbookTemplate();
  } catch (error) {
    showToast(error.message || "Unable to read template");
    delete els.convertButton.dataset.busy;
    updateConvertState();
    return;
  }

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
      const xlsxBlob = await createProfileWorkbookBlob([{ sourceName: file.name, profile }], templateSource);
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
    const combinedBlob = await createCombinedWorkbookBlob(successful, templateSource);
    const combinedUrl = createDownloadUrl(combinedBlob);
    setDownloadLink(els.downloadCombined, combinedUrl);
  }

  if (successful.length) {
    addPipelineRecords(successful);
    if (els.combinedWorkbook.checked) {
      const combinedForZip = await createCombinedWorkbookBlob(successful, templateSource);
      zip.file("combined-cv-profiles.xlsx", combinedForZip);
    }
    const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    setDownloadLink(els.downloadZip, createDownloadUrl(zipBlob));
  }

  const failed = results.filter((result) => result.status === "error").length;
  setProgress(failed ? "Completed with errors" : "Complete", state.files.length, state.files.length);
  showToast(failed ? "Completed with errors" : "Conversion complete");
  delete els.convertButton.dataset.busy;
  updateConvertState();
}

async function generateReviewedExcel() {
  const records = collectReviewedRecords();
  if (!records.length) {
    showToast("No reviewed profiles ready");
    return;
  }

  clearObjectUrls();
  setDownloadLink(els.downloadCombined, null);
  setDownloadLink(els.downloadZip, null);
  els.generateReviewed.disabled = true;
  els.generateReviewed.dataset.busy = "true";
  els.generateReviewed.innerHTML = "Generating";
  setProgress("Generating Excel", 0, records.length);

  let templateSource = null;
  try {
    templateSource = await readWorkbookTemplate();
  } catch (error) {
    showToast(error.message || "Unable to read template");
    delete els.generateReviewed.dataset.busy;
    els.generateReviewed.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"></path><path d="M8 8h8"></path><path d="M8 12h8"></path><path d="M8 16h5"></path></svg>Generate Excel';
    renderReviewPanel();
    return;
  }

  const usedNames = new Set();
  const results = records.map((record) => ({ sourceName: record.sourceName, status: "processing" }));
  const successful = [];
  const zip = new JSZip();
  renderResults(results);

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    try {
      const xlsxBlob = await createProfileWorkbookBlob([record], templateSource);
      const fileName = makeResultFileName(record.profile, record.sourceName, usedNames);
      const url = createDownloadUrl(xlsxBlob);

      zip.file(fileName, xlsxBlob);
      successful.push(record);
      Object.assign(results[index], {
        status: "done",
        candidateName: record.profile.candidateName,
        roleCode: record.profile.roleCode,
        roleTitle: record.profile.roleTitle,
        yearsOfExperience: record.profile.yearsOfExperience,
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
    setProgress("Generating Excel", index + 1, records.length);
  }

  if (successful.length && els.combinedWorkbook.checked) {
    const combinedBlob = await createCombinedWorkbookBlob(successful, templateSource);
    setDownloadLink(els.downloadCombined, createDownloadUrl(combinedBlob));
  }

  if (successful.length) {
    addPipelineRecords(successful);
    if (els.combinedWorkbook.checked) {
      const combinedForZip = await createCombinedWorkbookBlob(successful, templateSource);
      zip.file("combined-cv-profiles.xlsx", combinedForZip);
    }
    const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    setDownloadLink(els.downloadZip, createDownloadUrl(zipBlob));
  }

  const failed = results.filter((result) => result.status === "error").length;
  setProgress(failed ? "Completed with errors" : "Complete", records.length, records.length);
  showToast(failed ? "Completed with errors" : "Excel files ready");
  delete els.generateReviewed.dataset.busy;
  els.generateReviewed.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"></path><path d="M8 8h8"></path><path d="M8 12h8"></path><path d="M8 16h5"></path></svg>Generate Excel';
  renderReviewPanel();
}

async function convertCvs() {
  if (els.reviewBeforeExcel.checked) {
    await extractProfilesForReview();
    return;
  }
  await convertFilesDirectly();
}

els.chooseFiles.addEventListener("click", () => els.pdfFiles.click());
els.chooseFolder.addEventListener("click", () => els.pdfFolder.click());
els.chooseTemplate.addEventListener("click", () => els.templateFile.click());
els.themeToggle?.addEventListener("click", () => {
  setThemeMode(document.body?.classList?.contains("theme-pop") ? "classic" : "pop");
});
els.pdfFiles.addEventListener("change", () => addFiles(els.pdfFiles.files));
els.pdfFolder.addEventListener("change", () => addFiles(els.pdfFolder.files));
els.combinedWorkbook.addEventListener("change", () => syncCombinedOptions("combined"));
els.singleSheetWorkbook.addEventListener("change", () => syncCombinedOptions("single"));
els.stackDirectionOptions.forEach((option) => option.addEventListener("change", updateLaunchpad));
els.reviewBeforeExcel.addEventListener("change", updateConvertState);
els.templateFile.addEventListener("change", () => handleTemplateFile(els.templateFile.files));
els.clearTemplate.addEventListener("click", () => {
  state.templateFile = null;
  els.templateFile.value = "";
  updateTemplateUi();
  showToast("Default template selected");
});
els.saveMapping.addEventListener("click", saveTemplateMappingFromUi);
els.resetMapping.addEventListener("click", () => {
  state.templateMapping = { ...DEFAULT_TEMPLATE_MAPPING };
  saveTemplateMapping(state.templateMapping);
  renderTemplateMapper();
  showToast("Template mapping reset");
});
els.generateReviewed.addEventListener("click", generateReviewedExcel);
els.clearReview.addEventListener("click", () => {
  clearReviewQueue();
  showToast("Review queue cleared");
});
els.copyBatchBrief.addEventListener("click", async () => {
  if (els.copyBatchBrief.disabled) return;
  await copyText(batchBriefText());
  showToast("Batch brief copied");
});
els.downloadBatchBrief.addEventListener("click", () => {
  if (els.downloadBatchBrief.disabled) return;
  downloadTextFile("profileforge-batch-brief.txt", batchBriefText(), "text/plain");
  showToast("Batch brief downloaded");
});
els.downloadQualityReport.addEventListener("click", () => {
  if (els.downloadQualityReport.disabled) return;
  downloadTextFile("profileforge-quality-report.csv", reviewQualityReportCsv(), "text/csv");
  showToast("Quality report downloaded");
});
els.reviewList.addEventListener("input", (event) => {
  const card = event.target.closest?.(".review-card[data-review-index]");
  if (!card) return;
  refreshQualityGate(Number(card.dataset.reviewIndex));
});
els.convertButton.addEventListener("click", convertCvs);
els.createPlan?.addEventListener("click", () => {
  state.taskPlan = createWorkflowPlan(els.workflowPreset.value, els.taskPrompt.value);
  renderTaskPlan();
  showToast("Workflow plan ready");
});
els.exportPipeline?.addEventListener("click", () => {
  if (!state.pipeline.length) return;
  downloadTextFile("profileforge-candidate-pipeline.csv", pipelineCsv(), "text/csv");
});
els.copyBrief?.addEventListener("click", async () => {
  if (!state.pipeline.length) return;
  await copyText(dailyBrief());
  showToast("Brief copied");
});
els.runMatcher?.addEventListener("click", runMatcher);
els.compareCandidates?.addEventListener("click", () => {
  if (!state.pipeline.length) return;
  renderComparison();
  showToast("Comparison ready");
});
els.copyMatches?.addEventListener("click", async () => {
  await copyText(matchReportText());
  showToast("Screening report copied");
});
els.exportMatches?.addEventListener("click", () => {
  downloadTextFile("profileforge-role-match.csv", matchReportCsv(), "text/csv");
});
els.copyPricing?.addEventListener("click", async () => {
  await copyText(launchPricingText());
  showToast("Pricing copied");
});
els.copyLaunchChecklist?.addEventListener("click", async () => {
  await copyText(launchChecklistText());
  showToast("Launch checklist copied");
});
[els.starterMembers, els.proMembers, els.studioMembers].forEach((input) => {
  input?.addEventListener("input", renderLaunchRevenue);
});
els.clearPipeline?.addEventListener("click", () => {
  state.pipeline = [];
  state.matchResults = [];
  savePipeline();
  renderPipeline();
  renderMatchSummary();
  renderComparison([]);
  showToast("Pipeline cleared");
});
els.pipelineBody?.addEventListener("change", (event) => {
  const target = event.target;
  if (!target.matches(".pipeline-status")) return;
  updatePipelineStatus(target.dataset.id, target.value);
});
document.querySelectorAll?.("[data-recipe]").forEach((button) => {
  button.addEventListener("click", () => applyRecipe(button.dataset.recipe));
});

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
loadThemeMode();
renderLaunchRevenue();
state.templateMapping = loadTemplateMapping();
renderTemplateMapper();
syncCombinedOptions();
updateTemplateUi();
loadPipeline();
renderPipeline();
renderTaskPlan();
setTimeout(updateConvertState, 1000);
