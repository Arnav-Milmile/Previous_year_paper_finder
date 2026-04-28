const PAGE_SIZE = 100;

const state = {
  course: "",
  branch: "",
  exam_category: "",
  session: "",
  semester: "",
  year: "",
};

const resultState = {
  mode: "browse",
  query: "",
  offset: 0,
  total: 0,
  papers: [],
  loading: false,
};

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatBytes(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index ? 1 : 0)} ${units[index]}`;
}

function paperMeta(paper) {
  return [
    paper.course,
    paper.branch,
    paper.exam_category,
    paper.session || paper.year,
    paper.semester,
    formatBytes(paper.file_size),
  ]
    .filter(Boolean)
    .join(" / ");
}

function setLoading(isLoading, message = "Loading papers...") {
  resultState.loading = isLoading;
  const status = $("#result-status");
  const loadMore = $("#load-more");
  if (status) status.textContent = isLoading ? message : "";
  if (loadMore) loadMore.disabled = isLoading;
}

function updateResultSummary() {
  const count = $("#result-count");
  const status = $("#result-status");
  const loadMore = $("#load-more");
  const shown = resultState.papers.length;
  const total = resultState.total;

  if (count) {
    count.textContent = total === 1 ? "1 paper" : `${total} papers`;
  }

  if (status && !resultState.loading) {
    if (!total) {
      status.textContent = "Try clearing one filter or searching by paper name.";
    } else if (shown < total) {
      status.textContent = `Showing ${shown} of ${total}.`;
    } else {
      status.textContent = `Showing all ${total}.`;
    }
  }

  if (loadMore) {
    loadMore.hidden = shown >= total || !total;
  }
}

function renderPapers(papers) {
  const container = $("#results");
  if (!container) return;

  if (!papers.length) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>No papers found.</strong>
        <span>The index is ready, but this combination has no matching PDFs.</span>
      </div>
    `;
    updateResultSummary();
    return;
  }

  container.innerHTML = papers
    .map(
      (paper) => `
        <article class="paper-row">
          <div>
            <h3>${escapeHtml(paper.subject || paper.filename)}</h3>
            <p>${escapeHtml(paperMeta(paper) || paper.ftp_path)}</p>
          </div>
          <a class="download-button" href="/api/papers/${paper.id}/download">Download</a>
        </article>
      `,
    )
    .join("");
  updateResultSummary();
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function optionList(values, fallback) {
  return [`<option value="">${fallback}</option>`]
    .concat(values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`))
    .join("");
}

function selectedParams(...keys) {
  const params = new URLSearchParams();
  keys.forEach((key) => {
    if (state[key]) params.set(key, state[key]);
  });
  return params;
}

async function fetchBrowsePage(reset = true) {
  resultState.mode = "browse";
  if (reset) {
    resultState.offset = 0;
    resultState.papers = [];
  }

  const params = selectedParams("course", "branch", "exam_category", "session", "semester", "year");
  const countParams = new URLSearchParams(params);
  params.set("limit", String(PAGE_SIZE));
  params.set("offset", String(resultState.offset));

  setLoading(true, reset ? "Loading papers..." : "Loading more papers...");
  try {
    const [papers, count] = await Promise.all([
      getJson(`/api/papers?${params.toString()}`),
      reset ? getJson(`/api/papers/count?${countParams.toString()}`) : Promise.resolve({ total: resultState.total }),
    ]);
    resultState.total = count.total;
    resultState.papers = reset ? papers : resultState.papers.concat(papers);
    resultState.offset = resultState.papers.length;
    renderPapers(resultState.papers);
  } catch {
    resultState.total = 0;
    resultState.papers = [];
    renderPapers([]);
  } finally {
    setLoading(false);
    updateResultSummary();
  }
}

async function fetchSearchPage(query, reset = true) {
  resultState.mode = "search";
  resultState.query = query;
  if (reset) {
    resultState.offset = 0;
    resultState.papers = [];
  }

  const params = new URLSearchParams({
    q: query,
    limit: String(PAGE_SIZE),
  });
  params.set("offset", String(resultState.offset));

  setLoading(true, reset ? "Searching papers..." : "Loading more matches...");
  try {
    const [papers, count] = await Promise.all([
      getJson(`/api/papers/search?${params.toString()}`),
      reset ? getJson(`/api/papers/search/count?q=${encodeURIComponent(query)}`) : Promise.resolve({ total: resultState.total }),
    ]);
    resultState.total = count.total;
    resultState.papers = reset ? papers : resultState.papers.concat(papers);
    resultState.offset = resultState.papers.length;
    renderPapers(resultState.papers);
  } catch {
    resultState.total = 0;
    resultState.papers = [];
    renderPapers([]);
  } finally {
    setLoading(false);
    updateResultSummary();
  }
}

async function loadFilters() {
  const courseSelect = $("#course-filter");
  if (!courseSelect) return;

  const courses = await getJson("/api/courses");
  courseSelect.innerHTML = optionList(courses, "All courses");
  await refreshDependentFilters();
}

async function refreshDependentFilters() {
  const branchSelect = $("#branch-filter");
  const examSelect = $("#exam-category-filter");
  const sessionSelect = $("#session-filter");
  const semesterSelect = $("#semester-filter");
  const yearSelect = $("#year-filter");
  if (!branchSelect || !examSelect || !sessionSelect || !semesterSelect || !yearSelect) return;

  const branches = await getJson(`/api/branches?${selectedParams("course").toString()}`);
  branchSelect.innerHTML = optionList(branches, "All branches");
  branchSelect.value = state.branch;

  const exams = await getJson(`/api/exam-categories?${selectedParams("course", "branch").toString()}`);
  examSelect.innerHTML = optionList(exams, "All exams");
  examSelect.value = state.exam_category;

  const sessions = await getJson(`/api/sessions?${selectedParams("course", "branch", "exam_category").toString()}`);
  sessionSelect.innerHTML = optionList(sessions, "All sessions");
  sessionSelect.value = state.session;

  const semesters = await getJson(
    `/api/semesters?${selectedParams("course", "branch", "exam_category", "session").toString()}`,
  );
  semesterSelect.innerHTML = optionList(semesters, "All semesters");
  semesterSelect.value = state.semester;

  const years = await getJson(
    `/api/years?${selectedParams("course", "branch", "exam_category", "semester").toString()}`,
  );
  yearSelect.innerHTML = optionList(years, "All years");
  yearSelect.value = state.year;
}

function clearAfter(key) {
  const order = ["course", "branch", "exam_category", "session", "semester", "year"];
  const index = order.indexOf(key);
  order.slice(index + 1).forEach((item) => {
    state[item] = "";
  });
}

function bindLoadMore() {
  const loadMore = $("#load-more");
  if (!loadMore) return;

  loadMore.addEventListener("click", () => {
    if (resultState.mode === "search") {
      fetchSearchPage(resultState.query, false);
    } else {
      fetchBrowsePage(false);
    }
  });
}

function bindSearchPage() {
  const form = $("#search-form");
  if (!form) return;

  bindLoadMore();
  fetchBrowsePage(true);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = $("#search-input").value.trim();
    if (query) fetchSearchPage(query, true);
  });
}

function bindBrowsePage() {
  const bindings = [
    ["course", $("#course-filter")],
    ["branch", $("#branch-filter")],
    ["exam_category", $("#exam-category-filter")],
    ["session", $("#session-filter")],
    ["semester", $("#semester-filter")],
    ["year", $("#year-filter")],
  ];
  const clearButton = $("#clear-filters");
  if (bindings.some(([, element]) => !element)) return;

  bindLoadMore();
  loadFilters().then(() => fetchBrowsePage(true)).catch(() => renderPapers([]));

  bindings.forEach(([key, element]) => {
    element.addEventListener("change", async () => {
      state[key] = element.value;
      clearAfter(key);
      setLoading(true, "Updating filters...");
      await refreshDependentFilters();
      await fetchBrowsePage(true);
    });
  });

  clearButton.addEventListener("click", async () => {
    Object.keys(state).forEach((key) => {
      state[key] = "";
    });
    $("#course-filter").value = "";
    setLoading(true, "Clearing filters...");
    await refreshDependentFilters();
    await fetchBrowsePage(true);
  });
}

bindSearchPage();
bindBrowsePage();
