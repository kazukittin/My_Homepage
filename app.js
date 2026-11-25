const CONFIG = {
  search: {
    url: "https://www.google.com/search",
    queryParam: "q",
  },
  weather: {
    place: "東京",
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: "Asia/Tokyo",
  },
  news: {
    feedUrl: "https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja",
    maxItems: 12,
    corsProxy: "https://api.allorigins.win/raw?url=",
    jsonProxy: "https://api.rss2json.com/v1/api.json?rss_url=",
    categories: [
      { id: "top", label: "総合", feedUrl: "https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja" },
      { id: "technology", label: "テック", feedUrl: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=ja&gl=JP&ceid=JP:ja" },
      { id: "business", label: "ビジネス", feedUrl: "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ja&gl=JP&ceid=JP:ja" },
      { id: "entertainment", label: "エンタメ", feedUrl: "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=ja&gl=JP&ceid=JP:ja" },
      { id: "sports", label: "スポーツ", feedUrl: "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=ja&gl=JP&ceid=JP:ja" },
    ],
  },
  threadWatch: {
    corsProxy: "https://api.allorigins.win/raw?url=",
    intervalMs: 5 * 60 * 1000,
    fetchTimeoutMs: 25000,
  },
  links: [
    {
      category: "毎日",
      items: [
        { label: "Gmail", url: "https://mail.google.com/" },
        { label: "Googleドライブ", url: "https://drive.google.com/" },
      ],
    },
    {
      category: "作業",
      items: [
        { label: "GitHub", url: "https://github.com/" },
        { label: "ChatGPT", url: "https://chatgpt.com/" },
        { label: "Notion", url: "https://www.notion.so/" },
      ],
    },
    {
      category: "道具",
      items: [
        { label: "DeepL", url: "https://www.deepl.com/translator" },
        { label: "Google翻訳", url: "https://translate.google.com/" },
        { label: "MDN", url: "https://developer.mozilla.org/" },
      ],
    },
    {
      category: "メディア",
      items: [
        { label: "YouTube", url: "https://www.youtube.com/" },
        { label: "Spotify", url: "https://open.spotify.com/" },
        { label: "Amazon", url: "https://www.amazon.co.jp/" },
      ],
    },
  ],
};

const WEATHER_CODES = {
  0: ["☀️", "晴れ"],
  1: ["🌤️", "主に晴れ"],
  2: ["⛅", "一部くもり"],
  3: ["☁️", "くもり"],
  45: ["🌫️", "霧"],
  48: ["🌫️", "霧氷"],
  51: ["🌦️", "小雨"],
  53: ["🌦️", "小雨"],
  55: ["🌧️", "小雨"],
  61: ["🌧️", "雨"],
  63: ["🌧️", "雨"],
  65: ["🌧️", "強い雨"],
  71: ["🌨️", "雪"],
  73: ["🌨️", "雪"],
  75: ["❄️", "強い雪"],
  80: ["🌦️", "にわか雨"],
  81: ["🌦️", "にわか雨"],
  82: ["🌧️", "強いにわか雨"],
  95: ["⛈️", "雷雨"],
  96: ["⛈️", "雷雨"],
  99: ["⛈️", "雷雨"],
};

const pageKey = "private-start.activePage";
const shortcutsKey = "private-start.shortcuts";
const shortcutEditKey = "private-start.shortcutEditMode";
const newsCategoryKey = "private-start.newsCategory";
const newsCachePrefix = "private-start.newsCache.";
const newsCacheMaxAge = 15 * 60 * 1000;
const backgroundSettingsKey = "private-start.backgroundSettings";
const threadWatchKey = "private-start.threadWatch";

const BACKGROUND_PRESETS = {
  forest: {
    color: "#111412",
    background:
      "linear-gradient(120deg, rgba(142, 197, 163, 0.08), transparent 34%), linear-gradient(280deg, rgba(215, 164, 75, 0.06), transparent 40%), #111412",
  },
  slate: {
    color: "#111315",
    background:
      "linear-gradient(120deg, rgba(148, 163, 184, 0.1), transparent 34%), linear-gradient(280deg, rgba(94, 169, 255, 0.06), transparent 42%), #111315",
  },
  midnight: {
    color: "#0c1016",
    background:
      "linear-gradient(120deg, rgba(94, 169, 255, 0.11), transparent 36%), linear-gradient(280deg, rgba(174, 140, 255, 0.07), transparent 42%), #0c1016",
  },
  warm: {
    color: "#14120f",
    background:
      "linear-gradient(120deg, rgba(215, 164, 75, 0.11), transparent 34%), linear-gradient(280deg, rgba(142, 197, 163, 0.06), transparent 42%), #14120f",
  },
};

let shortcutGroups = loadShortcutGroups();
let newsRequestId = 0;
let activeNewsCategory = CONFIG.news.categories[0].id;
let weatherRequestId = 0;
let locationRequestId = 0;
let weatherLocation = readStored("private-start.weatherLocation") || CONFIG.weather;
if (!validLocation(weatherLocation)) weatherLocation = CONFIG.weather;

function readStored(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function writeStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
function validLocation(value) {
  return value && typeof value.place === "string" && Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90 && Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180;
}
function updatedLabel(time) {
  return new Date(time).toLocaleString("ja-JP", {month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"});
}
function numberLabel(value, suffix) {
  return Number.isFinite(value) ? Math.round(value) + suffix : "--" + suffix;
}

const elements = {
  headerClock: document.querySelector("#headerClock"),
  headerDate: document.querySelector("#headerDate"),
  navLinks: [...document.querySelectorAll("[data-page-target]")],
  pages: [...document.querySelectorAll(".page")],
  searchForm: document.querySelector("#searchForm"),
  searchInput: document.querySelector("#searchInput"),
  shortcutForm: document.querySelector("#shortcutForm"),
  categoryForm: document.querySelector("#categoryForm"),
  linksCard: document.querySelector("#linksCard"),
  shortcutEditToggle: document.querySelector("#shortcutEditToggle"),
  openShortcutModal: document.querySelector("#openShortcutModal"),
  closeShortcutModal: document.querySelector("#closeShortcutModal"),
  shortcutModal: document.querySelector("#shortcutModal"),
  shortcutLabel: document.querySelector("#shortcutLabel"),
  shortcutUrl: document.querySelector("#shortcutUrl"),
  shortcutCategory: document.querySelector("#shortcutCategory"),
  categoryName: document.querySelector("#categoryName"),
  categoryManager: document.querySelector("#categoryManager"),
  linkGroups: document.querySelector("#linkGroups"),
  weatherPlace: document.querySelector("#weatherPlace"),
  weatherIcon: document.querySelector("#weatherIcon"),
  weatherTemp: document.querySelector("#weatherTemp"),
  weatherSummary: document.querySelector("#weatherSummary"),
  weatherFeels: document.querySelector("#weatherFeels"),
  weatherWind: document.querySelector("#weatherWind"),
  weeklyWeatherList: document.querySelector("#weeklyWeatherList"),
  newsTabs: document.querySelector("#newsTabs"),
  newsList: document.querySelector("#newsList"),
  newsSourceLink: document.querySelector("#newsSourceLink"),
  backgroundPreset: document.querySelector("#backgroundPreset"),
  backgroundImageUrl: document.querySelector("#backgroundImageUrl"),
  saveBackgroundSettings: document.querySelector("#saveBackgroundSettings"),
  resetBackgroundSettings: document.querySelector("#resetBackgroundSettings"),
  exportShortcuts: document.querySelector("#exportShortcuts"),
  importShortcuts: document.querySelector("#importShortcuts"),
  shortcutImportFile: document.querySelector("#shortcutImportFile"),
  shortcutImportStatus: document.querySelector("#shortcutImportStatus"),
  threadWatchList: document.querySelector("#threadWatchList"),
  threadWatchBadge: document.querySelector("#threadWatchBadge"),
  threadWatchStatus: document.querySelector("#threadWatchStatus"),
  refreshThreads: document.querySelector("#refreshThreads"),
  threadWatchForm: document.querySelector("#threadWatchForm"),
  threadWatchUrl: document.querySelector("#threadWatchUrl"),
  threadWatchFormStatus: document.querySelector("#threadWatchFormStatus"),
  threadWatchManager: document.querySelector("#threadWatchManager"),
  threadNotifyPermission: document.querySelector("#threadNotifyPermission"),
  threadNotifyStatus: document.querySelector("#threadNotifyStatus"),
};

function setupPages() {
  const savedPage = localStorage.getItem(pageKey);
  const initialPage = elements.pages.some((page) => page.id === `page-${savedPage}`) ? savedPage : "main";
  showPage(initialPage);

  elements.navLinks.forEach((button) => {
    button.addEventListener("click", () => {
      const pageName = button.dataset.pageTarget;
      showPage(pageName);
      localStorage.setItem(pageKey, pageName);
    });
  });
}

function showPage(pageName) {
  elements.pages.forEach((page) => {
    const isActive = page.id === `page-${pageName}`;
    page.hidden = !isActive;
    page.classList.toggle("is-active", isActive);
  });

  elements.navLinks.forEach((button) => {
    const isActive = button.dataset.pageTarget === pageName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });

}
function updateClock() {
  const now = new Date();
  const time = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);
  const date = new Intl.DateTimeFormat("ja-JP", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  elements.headerClock.textContent = time;
  elements.headerClock.dateTime = now.toISOString();
  elements.headerDate.textContent = date;
}

function setupSearch() {
  elements.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = elements.searchInput.value.trim();

    if (!query) {
      elements.searchInput.focus();
      return;
    }

    const url = new URL(CONFIG.search.url);
    url.searchParams.set(CONFIG.search.queryParam, query);
    window.open(url.toString(), "_blank", "noopener");
  });
}

function setupShortcuts() {
  setShortcutEditMode(localStorage.getItem(shortcutEditKey) === "true");
  renderCategoryOptions();
  renderLinks();

  elements.shortcutEditToggle.addEventListener("click", () => {
    const nextState = !elements.linksCard.classList.contains("is-editing");
    setShortcutEditMode(nextState);
    localStorage.setItem(shortcutEditKey, String(nextState));
  });

  elements.openShortcutModal.addEventListener("click", () => {
    elements.shortcutModal.showModal();
    elements.shortcutLabel.focus();
  });

  elements.closeShortcutModal.addEventListener("click", () => {
    elements.shortcutModal.close();
  });

  elements.shortcutModal.addEventListener("click", (event) => {
    if (event.target === elements.shortcutModal) {
      elements.shortcutModal.close();
    }
  });

  elements.shortcutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const label = elements.shortcutLabel.value.trim();
    const url = normalizeUrl(elements.shortcutUrl.value.trim());
    const category = elements.shortcutCategory.value;

    if (!label || !url || !category) {
      return;
    }

    const group = shortcutGroups.find((item) => item.category === category);
    group.items.push({ label, url });
    saveShortcutGroups();
    renderLinks();
    elements.shortcutForm.reset();
    elements.shortcutCategory.value = category;
    elements.shortcutLabel.focus();
  });

  elements.categoryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const category = elements.categoryName.value.trim();

    if (!category || shortcutGroups.some((group) => group.category === category)) {
      return;
    }

    shortcutGroups.push({ category, items: [] });
    saveShortcutGroups();
    renderCategoryOptions();
    renderCategoryManager();
    renderLinks();
    elements.shortcutCategory.value = category;
    elements.categoryForm.reset();
  });

  elements.categoryManager.addEventListener("click", (event) => {
    const renameButton = event.target.closest("[data-rename-category]");
    const deleteButton = event.target.closest("[data-delete-category]");
    const moveButton = event.target.closest("[data-move-category]");
    if (!renameButton && !deleteButton && !moveButton) {
      return;
    }

    const groupIndex = Number((renameButton || deleteButton || moveButton).dataset.groupIndex);
    if (!Number.isInteger(groupIndex) || !shortcutGroups[groupIndex]) {
      return;
    }

    if (renameButton) {
      renameShortcutCategory(groupIndex);
    }

    if (deleteButton) {
      deleteShortcutCategory(groupIndex);
    }

    if (moveButton) {
      moveShortcutCategory(groupIndex, Number(moveButton.dataset.direction));
    }
  });

  elements.linkGroups.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-shortcut]");
    if (!deleteButton) {
      return;
    }

    const groupIndex = Number(deleteButton.dataset.groupIndex);
    const itemIndex = Number(deleteButton.dataset.itemIndex);
    shortcutGroups[groupIndex].items.splice(itemIndex, 1);
    saveShortcutGroups();
    renderLinks();
  });

  elements.linkGroups.addEventListener("change", (event) => {
    const moveSelect = event.target.closest("[data-move-shortcut]");
    if (!moveSelect) {
      return;
    }

    moveShortcutItem(
      Number(moveSelect.dataset.groupIndex),
      Number(moveSelect.dataset.itemIndex),
      Number(moveSelect.value)
    );
  });

  renderCategoryManager();
}

function setupShortcutImportExport() {
  elements.exportShortcuts.addEventListener("click", exportShortcutGroups);

  elements.importShortcuts.addEventListener("click", () => {
    elements.shortcutImportFile.click();
  });

  elements.shortcutImportFile.addEventListener("change", importShortcutGroups);
}

function setShortcutEditMode(isEditing) {
  elements.linksCard.classList.toggle("is-editing", isEditing);
  elements.shortcutEditToggle.textContent = isEditing ? "完了" : "編集";
  elements.shortcutEditToggle.setAttribute("aria-pressed", String(isEditing));
}

function renderCategoryOptions() {
  elements.shortcutCategory.innerHTML = shortcutGroups
    .map((group) => `<option value="${escapeAttribute(group.category)}">${escapeHtml(group.category)}</option>`)
    .join("");
}

function renderLegacyCategoryManager() {
  elements.categoryManager.innerHTML = shortcutGroups
    .map(
      (group, groupIndex) => `
        <div class="category-manager-row">
          <input type="text" value="${escapeAttribute(group.category)}" data-category-name="${groupIndex}" aria-label="${escapeAttribute(group.category)}のカテゴリ名">
          <button type="button" data-rename-category data-group-index="${groupIndex}">変更</button>
          <button type="button" data-delete-category data-group-index="${groupIndex}">削除</button>
        </div>
      `
    )
    .join("");
}

function renderCategoryManager() {
  elements.categoryManager.innerHTML = shortcutGroups
    .map(
      (group, groupIndex) => `
        <div class="category-manager-row">
          <input type="text" value="${escapeAttribute(group.category)}" data-category-name="${groupIndex}" aria-label="${escapeAttribute(group.category)}のカテゴリ名">
          <button type="button" data-move-category data-group-index="${groupIndex}" data-direction="-1" ${groupIndex === 0 ? "disabled" : ""}>上へ</button>
          <button type="button" data-move-category data-group-index="${groupIndex}" data-direction="1" ${groupIndex === shortcutGroups.length - 1 ? "disabled" : ""}>下へ</button>
          <button type="button" data-rename-category data-group-index="${groupIndex}">変更</button>
          <button type="button" data-delete-category data-group-index="${groupIndex}">削除</button>
        </div>
      `
    )
    .join("");
}

function moveShortcutCategory(groupIndex, direction) {
  const nextIndex = groupIndex + direction;
  if (nextIndex < 0 || nextIndex >= shortcutGroups.length) {
    return;
  }

  const selectedCategory = shortcutGroups[groupIndex].category;
  const [group] = shortcutGroups.splice(groupIndex, 1);
  shortcutGroups.splice(nextIndex, 0, group);
  saveShortcutGroups();
  renderCategoryOptions();
  renderCategoryManager();
  renderLinks();
  elements.shortcutCategory.value = selectedCategory;
}

function renameShortcutCategory(groupIndex) {
  const input = elements.categoryManager.querySelector(`[data-category-name="${groupIndex}"]`);
  const nextName = input?.value.trim();
  const currentName = shortcutGroups[groupIndex].category;

  if (!nextName || nextName === currentName) {
    return;
  }

  if (shortcutGroups.some((group, index) => index !== groupIndex && group.category === nextName)) {
    input.focus();
    return;
  }

  shortcutGroups[groupIndex].category = nextName;
  saveShortcutGroups();
  renderCategoryOptions();
  renderCategoryManager();
  renderLinks();
  elements.shortcutCategory.value = nextName;
}

function deleteShortcutCategory(groupIndex) {
  if (shortcutGroups.length <= 1) {
    return;
  }

  const group = shortcutGroups[groupIndex];
  const hasItems = group.items.length > 0;
  if (hasItems && !window.confirm(`${group.category}のショートカットも削除します。よろしいですか？`)) {
    return;
  }

  shortcutGroups.splice(groupIndex, 1);
  saveShortcutGroups();
  renderCategoryOptions();
  renderCategoryManager();
  renderLinks();
}

function moveShortcutItem(groupIndex, itemIndex, targetGroupIndex) {
  if (
    !shortcutGroups[groupIndex]?.items[itemIndex] ||
    !shortcutGroups[targetGroupIndex] ||
    groupIndex === targetGroupIndex
  ) {
    renderLinks();
    return;
  }

  const [item] = shortcutGroups[groupIndex].items.splice(itemIndex, 1);
  shortcutGroups[targetGroupIndex].items.push(item);
  saveShortcutGroups();
  renderLinks();
}

function renderLinks() {
  elements.linkGroups.innerHTML = shortcutGroups
    .map((group, groupIndex) => {
      const categoryOptions = shortcutGroups
        .map(
          (targetGroup, targetIndex) =>
            `<option value="${targetIndex}" ${targetIndex === groupIndex ? "selected" : ""}>${escapeHtml(targetGroup.category)}</option>`
        )
        .join("");
      const items = group.items.length
        ? group.items
            .map(
              (item, itemIndex) => `
                <li class="shortcut-item">
                  <a class="shortcut-link" href="${escapeAttribute(item.url)}" target="_blank" rel="noopener">
                    <img class="shortcut-icon" src="${escapeAttribute(getShortcutIconUrl(item.url))}" alt="" loading="lazy">
                    <span class="shortcut-text">
                      <span>${escapeHtml(item.label)}</span>
                    </span>
                  </a>
                  <select class="shortcut-move" data-move-shortcut data-group-index="${groupIndex}" data-item-index="${itemIndex}" aria-label="${escapeAttribute(item.label)}の移動先">
                    ${categoryOptions}
                  </select>
                  <button class="shortcut-delete" type="button" data-delete-shortcut data-group-index="${groupIndex}" data-item-index="${itemIndex}" aria-label="${escapeAttribute(item.label)}を削除">削除</button>
                </li>
              `
            )
            .join("")
        : '<li class="shortcut-empty">まだありません</li>';

      return `
        <section class="link-group">
          <h3>${escapeHtml(group.category)}</h3>
          <ul class="shortcut-list">${items}</ul>
        </section>
      `;
    })
    .join("");
}

function loadShortcutGroups() {
  try {
    const stored = JSON.parse(localStorage.getItem(shortcutsKey));
    if (isValidShortcutGroups(stored)) {
      return stored;
    }
  } catch {
  }

  const defaults = structuredClone(CONFIG.links);
  localStorage.setItem(shortcutsKey, JSON.stringify(defaults));
  return defaults;
}

function saveShortcutGroups() {
  localStorage.setItem(shortcutsKey, JSON.stringify(shortcutGroups));
}

function exportShortcutGroups() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    shortcuts: shortcutGroups,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `shortcuts-${toDateInputValue(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(url);
  elements.shortcutImportStatus.textContent = "ショートカットをエクスポートしました。";
}

function importShortcutGroups() {
  const file = elements.shortcutImportFile.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      const importedGroups = Array.isArray(parsed) ? parsed : parsed.shortcuts;
      if (!isValidShortcutGroups(importedGroups)) {
        throw new Error("Invalid shortcut file.");
      }

      shortcutGroups = importedGroups;
      saveShortcutGroups();
      renderCategoryOptions();
      renderCategoryManager();
      renderLinks();
      elements.shortcutImportStatus.textContent = "ショートカットをインポートしました。";
    } catch {
      elements.shortcutImportStatus.textContent = "インポートできませんでした。JSONファイルを確認してください。";
    } finally {
      elements.shortcutImportFile.value = "";
    }
  });
  reader.readAsText(file);
}

function isValidShortcutGroups(groups) {
  return (
    Array.isArray(groups) &&
    groups.length > 0 &&
    groups.every(
      (group) =>
        typeof group?.category === "string" &&
        group.category.trim() &&
        Array.isArray(group.items) &&
        group.items.every((item) => typeof item?.label === "string" && typeof item?.url === "string")
    )
  );
}

function normalizeUrl(value) {
  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

function setupBackgroundSettings() {
  const settings = loadBackgroundSettings();
  elements.backgroundPreset.value = settings.preset;
  elements.backgroundImageUrl.value = settings.imageUrl;
  applyBackgroundSettings(settings);

  elements.saveBackgroundSettings.addEventListener("click", () => {
    const nextSettings = {
      preset: elements.backgroundPreset.value,
      imageUrl: elements.backgroundImageUrl.value.trim(),
    };
    saveBackgroundSettings(nextSettings);
    applyBackgroundSettings(nextSettings);
  });

  elements.resetBackgroundSettings.addEventListener("click", () => {
    localStorage.removeItem(backgroundSettingsKey);
    const defaultSettings = loadBackgroundSettings();
    elements.backgroundPreset.value = defaultSettings.preset;
    elements.backgroundImageUrl.value = "";
    applyBackgroundSettings(defaultSettings);
  });
}

function loadBackgroundSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(backgroundSettingsKey));
    const preset = BACKGROUND_PRESETS[settings?.preset] ? settings.preset : "forest";
    return {
      preset,
      imageUrl: typeof settings?.imageUrl === "string" ? settings.imageUrl : "",
    };
  } catch {
    return { preset: "forest", imageUrl: "" };
  }
}

function saveBackgroundSettings(settings) {
  localStorage.setItem(backgroundSettingsKey, JSON.stringify(settings));
}

function applyBackgroundSettings(settings) {
  const preset = BACKGROUND_PRESETS[settings.preset] || BACKGROUND_PRESETS.forest;
  document.documentElement.style.setProperty("--bg", preset.color);

  if (settings.imageUrl) {
    document.body.style.background = `linear-gradient(rgba(17, 20, 18, 0.72), rgba(17, 20, 18, 0.82)), url(${JSON.stringify(settings.imageUrl)}) center / cover fixed, ${preset.color}`;
    return;
  }

  document.body.style.background = preset.background;
}

function toDateInputValue(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}


async function loadWeather() {
  const requestId = ++weatherRequestId;
  const location = {...weatherLocation};
  const key = "private-start.weatherCache." + location.latitude + "," + location.longitude;
  const cached = readStored(key);
  const usableCache = cached?.data?.current && Date.now() - cached.savedAt < 6 * 60 * 60 * 1000 ? cached : null;
  const status = document.querySelector("#weatherStatus");
  elements.weatherPlace.textContent = location.place;
  if (usableCache) renderWeatherData(usableCache.data);
  else {
    elements.weatherTemp.textContent = "--°";
    elements.weatherSummary.textContent = "天気を取得中…";
    elements.weatherIcon.textContent = "--";
    document.querySelector("#weatherRain").textContent = "今日の降水確率 --%";
    document.querySelector("#hourlyRain").innerHTML = "";
    elements.weeklyWeatherList.innerHTML = "";
  }
  status.textContent = usableCache ? "前回取得 " + updatedLabel(usableCache.savedAt) + "・更新中" : "更新中…";
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({latitude:location.latitude,longitude:location.longitude,timezone:"auto",current:"temperature_2m,apparent_temperature,weather_code,wind_speed_10m",daily:"weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",hourly:"precipitation_probability,precipitation",forecast_days:"5"});
  try {
    const response = await fetchWithTimeout(url, 6000);
    const data = await response.json();
    if (requestId !== weatherRequestId) return;
    if (!data.current || !data.daily?.time?.length || !data.hourly?.time?.length) throw new Error("Incomplete weather");
    renderWeatherData(data);
    writeStored(key, {data, savedAt:Date.now()});
    status.textContent = "取得 " + updatedLabel(Date.now()) + "・時刻は現地時間";
  } catch {
    if (requestId !== weatherRequestId) return;
    status.textContent = usableCache ? "更新できませんでした・前回取得 " + updatedLabel(usableCache.savedAt) + " の予報を表示" : "取得できませんでした。再読み込みをお試しください。";
    if (!usableCache) elements.weatherSummary.textContent = "天気を取得できません";
  }
}

function renderWeatherData(data) {
  const current = data.current;
  const weather = WEATHER_CODES[current.weather_code] || ["🌡️", "天気情報"];
  elements.weatherIcon.textContent = weather[0];
  elements.weatherTemp.textContent = numberLabel(current.temperature_2m,"°");
  elements.weatherSummary.textContent = weather[1];
  elements.weatherFeels.textContent = "体感 " + numberLabel(current.apparent_temperature,"°");
  elements.weatherWind.textContent = "風 " + numberLabel(current.wind_speed_10m," km/h");
  document.querySelector("#weatherRain").textContent = "今日の降水確率 " + numberLabel(data.daily.precipitation_probability_max?.[0],"%");
  const currentHour = current.time.slice(0,13) + ":00";
  document.querySelector("#hourlyRain").innerHTML = data.hourly.time.map((time,i)=>({time,i})).filter(({time})=>time>=currentHour).slice(0,6).map(({time,i})=>
    '<div><span>'+escapeHtml(time.slice(11,16))+'</span><strong>'+numberLabel(data.hourly.precipitation_probability?.[i],'%')+'</strong><small>'+ (Number.isFinite(data.hourly.precipitation?.[i]) ? data.hourly.precipitation[i].toFixed(1) : '--')+' mm</small></div>'
  ).join('');
  renderWeeklyWeather(data.daily);
}

function setupWeatherSettings() {
  const form = document.querySelector("#weatherLocationForm");
  const results = document.querySelector("#weatherLocationResults");
  const status = document.querySelector("#weatherLocationStatus");
  status.textContent = "現在の地域：" + weatherLocation.place;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.querySelector("#weatherLocationQuery").value.trim();
    if (name.length < 2) { status.textContent = "地域名を2文字以上で入力してください。"; return; }
    const requestId = ++locationRequestId;
    results.replaceChildren();
    status.textContent = "地域を検索中…";
    try {
      const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
      url.search = new URLSearchParams({name,count:"8",language:"ja",format:"json"});
      const response = await fetchWithTimeout(url,6000);
      const data = await response.json();
      if (requestId !== locationRequestId) return;
      const places = (data.results || []).map(item=>({place:[item.name,item.admin1,item.country].filter(Boolean).join("・"),latitude:item.latitude,longitude:item.longitude})).filter(validLocation);
      status.textContent = places.length ? "表示する地域を選んでください。" : "見つかりませんでした。市区町村名やローマ字でお試しください。";
      places.forEach(place=>{
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = place.place;
        button.addEventListener("click",()=>{
          if (!writeStored("private-start.weatherLocation",place)) {status.textContent="地域を保存できませんでした。ブラウザーの保存設定を確認してください。"; return;}
          weatherLocation = place;
          status.textContent = "保存しました：" + place.place;
          results.replaceChildren();
          loadWeather();
        });
        results.append(button);
      });
    } catch { if (requestId === locationRequestId) status.textContent = "検索できませんでした。通信を確認して再検索してください。"; }
  });
  document.querySelector("#refreshWeather").addEventListener("click",loadWeather);
  document.querySelector("#refreshNews").addEventListener("click",()=>loadNewsCategory(activeNewsCategory));
  window.addEventListener("online",()=>{loadWeather();loadNewsCategory(activeNewsCategory);});
}

function renderWeeklyWeather(daily) {
  if (!daily?.time?.length) {
    elements.weeklyWeatherList.innerHTML = '<p class="feed-message">週間天気を取得できません</p>';
    return;
  }

  elements.weeklyWeatherList.innerHTML = daily.time
    .slice(1, 5)
    .map((dateText, index) => {
      const date = new Date(`${dateText}T00:00:00`);
      const dailyIndex = index + 1;
      const weather = WEATHER_CODES[Number(daily.weather_code[dailyIndex])] || ["🌡️", "天気情報"];
      const maxTemp = Math.round(daily.temperature_2m_max[dailyIndex]);
      const minTemp = Math.round(daily.temperature_2m_min[dailyIndex]);

      return `
        <div class="weekly-weather-day">
          <span>${escapeHtml(formatForecastDay(date))}</span>
          <span class="weekly-weather-icon">${escapeHtml(weather[0])}</span>
          <span class="weekly-weather-summary">${escapeHtml(weather[1])}</span>
          <span class="weekly-weather-temp">${maxTemp}° / ${minTemp}°</span>
        </div>
      `;
    })
    .join("");
}

async function loadNews() {
  renderNewsTabs();
  const savedCategory = localStorage.getItem(newsCategoryKey) || CONFIG.news.categories[0].id;
  await loadNewsCategory(savedCategory);
}

function renderNewsTabs() {
  elements.newsTabs.innerHTML = CONFIG.news.categories
    .map(
      (category) => `
        <button class="news-tab" role="tab" type="button" data-news-category="${escapeAttribute(category.id)}">
          ${escapeHtml(category.label)}
        </button>
      `
    )
    .join("");

  elements.newsTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-news-category]");
    if (!button) {
      return;
    }
    loadNewsCategory(button.dataset.newsCategory);
  });
}

async function loadNewsCategory(categoryId) {
  const requestId = ++newsRequestId;
  const category = CONFIG.news.categories.find((item) => item.id === categoryId) || CONFIG.news.categories[0];
  activeNewsCategory = category.id;
  try { localStorage.setItem(newsCategoryKey, category.id); } catch {}
  const status = document.querySelector("#newsStatus");
  const cached = loadNewsCache(category.id);
  elements.newsSourceLink.href = "https://news.google.com/home?hl=ja&gl=JP&ceid=JP:ja";
  if (cached) renderNewsFeed(cached.items);
  else elements.newsList.innerHTML = '<p class="feed-message">ニュースを読み込み中...</p>';
  status.textContent = cached ? "前回取得 " + updatedLabel(cached.savedAt) + "・更新中" : "更新中…";
  elements.newsTabs.querySelectorAll(".news-tab").forEach((button) => {
    const selected = button.dataset.newsCategory === category.id;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  elements.newsList.setAttribute("aria-busy", "true");
  try {
    const items = await fetchNewsItems(category.feedUrl);
    if (!items.length) throw new Error("News feed has no items");
    if (requestId !== newsRequestId) return;
    const saved = writeStored(newsCachePrefix + category.id, {items, savedAt: Date.now()});
    renderNewsFeed(items);
    status.textContent = "取得 " + updatedLabel(Date.now()) + (saved ? "" : "・端末への一時保存はできませんでした");
  } catch {
    if (requestId !== newsRequestId) return;
    status.textContent = cached ? "更新できませんでした・前回取得 " + updatedLabel(cached.savedAt) + " の記事を表示" : "取得できませんでした。再読み込みをお試しください。";
    if (!cached) elements.newsList.innerHTML = '<p class="feed-message">上の「開く」からGoogleニュースを確認できます。</p>';
  } finally {
    if (requestId === newsRequestId) elements.newsList.setAttribute("aria-busy", "false");
  }
}

function renderNewsFeed(items) {
  elements.newsList.innerHTML = items.slice(0, 4).map(renderNewsItem).join("");
}

function renderFeaturedNews(item) {
  return `
    <a class="featured-news-card" href="${escapeAttribute(item.url)}" target="_blank" rel="noopener">
      <span class="eyebrow">トップ記事</span>
      <strong>${escapeHtml(cleanNewsTitle(item.title))}</strong>
      <span>${escapeHtml(item.source)} ・ ${escapeHtml(formatNewsDate(item.publishedAt))}</span>
    </a>
  `;
}

async function fetchNewsItems(feedUrl = CONFIG.news.feedUrl) {
  try {
    const items = await fetchJsonFeedItems(feedUrl);
    if (!items.length) throw new Error("Empty news feed");
    return items;
  } catch (jsonError) {
    console.warn(jsonError);
    const xmlText = await fetchFeedText(feedUrl);
    return parseRssItems(xmlText);
  }
}

async function fetchJsonFeedItems(feedUrl) {
  const url = `${CONFIG.news.jsonProxy}${encodeURIComponent(feedUrl)}`;
  const response = await fetchWithTimeout(url, 4500);
  const data = await response.json();

  if (data.status !== "ok" || !Array.isArray(data.items)) {
    throw new Error("News JSON feed failed");
  }

  return data.items
    .slice(0, CONFIG.news.maxItems)
    .map((item) => ({
      title: item.title || "",
      url: item.link || "",
      source: item.author || item.source || "Googleニュース",
      publishedAt: item.pubDate || "",
    }))
    .filter((item) => item.title && item.url);
}

async function fetchFeedText(feedUrl) {
  try {
    const proxyUrl = `${CONFIG.news.corsProxy}${encodeURIComponent(feedUrl)}`;
    const proxyResponse = await fetchWithTimeout(proxyUrl, 5000);
    return await proxyResponse.text();
  } catch {
    const directResponse = await fetchWithTimeout(feedUrl, 2500);
    return await directResponse.text();
  }
}

function loadNewsCache(categoryId) {
  const cached = readStored(newsCachePrefix + categoryId);
  return Array.isArray(cached?.items) && cached.items.length && Number.isFinite(cached.savedAt) && Date.now() - cached.savedAt < 24 * 60 * 60 * 1000 ? cached : null;
}

function saveNewsCache(categoryId, items) {
  localStorage.setItem(
    `${newsCachePrefix}${categoryId}`,
    JSON.stringify({
      savedAt: Date.now(),
      items,
    })
  );
}

function parseRssItems(xmlText) {
  const documentXml = new DOMParser().parseFromString(xmlText, "application/xml");

  if (documentXml.querySelector("parsererror")) {
    throw new Error("News feed parse failed");
  }

  return [...documentXml.querySelectorAll("item")]
    .slice(0, CONFIG.news.maxItems)
    .map((item) => ({
      title: getXmlText(item, "title"),
      url: getXmlText(item, "link"),
      source: getXmlText(item, "source") || "Googleニュース",
      publishedAt: getXmlText(item, "pubDate"),
    }))
    .filter((item) => item.title && item.url);
}

function renderNewsItem(item) {
  return `
    <a class="news-item" href="${escapeAttribute(item.url)}" target="_blank" rel="noopener">
      <span class="news-title">${escapeHtml(cleanNewsTitle(item.title))}</span>
      <span class="news-meta">
        <span class="news-source">${escapeHtml(item.source)}</span>
        <span>${escapeHtml(formatNewsDate(item.publishedAt))}</span>
      </span>
    </a>
  `;
}

function renderNewsInsights(items) {
  const latestDate = getLatestNewsDate(items);
  const sourceStats = getNewsSourceStats(items).slice(0, 5);
  const keywords = getNewsKeywords(items).slice(0, 12);

  return `
    <section class="news-insight-card">
      <div>
        <p class="eyebrow">更新状況</p>
        <strong>${escapeHtml(`${items.length}件`)}</strong>
      </div>
      <span>${escapeHtml(latestDate ? `${formatNewsDate(latestDate.toISOString())} 更新` : "更新時刻なし")}</span>
    </section>
    <section class="news-insight-card">
      <div>
        <p class="eyebrow">ソース</p>
        <strong>${sourceStats.length}媒体</strong>
      </div>
      <div class="news-source-bars">
        ${sourceStats
          .map(
            (source) => `
              <div class="news-source-bar">
                <span>${escapeHtml(source.name)}</span>
                <strong>${source.count}</strong>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
    <section class="news-insight-card">
      <div>
        <p class="eyebrow">注目ワード</p>
        <strong>見出しから抽出</strong>
      </div>
      <div class="news-keywords">
        ${keywords.map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("") || "<span>まだありません</span>"}
      </div>
    </section>
  `;
}

function getLatestNewsDate(items) {
  return items
    .map((item) => new Date(item.publishedAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right - left)[0];
}

function getNewsSourceStats(items) {
  const counts = new Map();
  items.forEach((item) => {
    const source = item.source || "不明";
    counts.set(source, (counts.get(source) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "ja"));
}

function getNewsKeywords(items) {
  const ignoreWords = new Set([
    "ニュース",
    "Google",
    "Yahoo",
    "する",
    "した",
    "いる",
    "から",
    "まで",
    "について",
    "これ",
    "それ",
  ]);
  const counts = new Map();

  items.forEach((item) => {
    cleanNewsTitle(item.title)
      .replace(/[!-\/:-@[-`{-~、。・「」『』【】（）()［］\[\]0-9０-９]/g, " ")
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2 && !ignoreWords.has(word))
      .forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || right[0].length - left[0].length)
    .map(([word]) => word);
}

async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    // Keep the timeout active until the response body has arrived as well.
    const body = await response.text();
    return { json: async () => JSON.parse(body), text: async () => body };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function formatForecastDay(date) {
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    weekday: "short",
    day: "numeric",
  }).format(date);
}

function cleanNewsTitle(title) {
  return title.replace(/\s+-\s+[^-]+$/, "");
}

function getXmlText(parent, selector) {
  return parent.querySelector(selector)?.textContent?.trim() || "";
}

function formatNewsDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getShortcutIconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
  } catch {
    return "";
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

let threadWatchState = loadThreadWatchState();
let threadWatchBaseTitle = document.title;
let threadWatchChecking = false;

function loadThreadWatchState() {
  const stored = readStored(threadWatchKey);
  if (stored && Array.isArray(stored.threads)) {
    return { threads: stored.threads.filter(isValidThreadEntry) };
  }
  return { threads: [] };
}

function isValidThreadEntry(thread) {
  return (
    thread &&
    typeof thread.url === "string" &&
    typeof thread.code === "string" &&
    thread.code.length > 0
  );
}

function saveThreadWatchState() {
  writeStored(threadWatchKey, threadWatchState);
}

function threadCodeFromUrl(value) {
  try {
    let text = String(value).trim();
    if (text && !/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) {
      text = `https://${text}`;
    }
    const url = new URL(text);
    if (!/(^|\.)5chan\.jp$/.test(url.hostname)) {
      return "";
    }
    const code = url.pathname.split("/").filter(Boolean)[0] || "";
    return /^[A-Za-z0-9_-]+$/.test(code) ? code : "";
  } catch {
    return "";
  }
}

function normalizeThreadUrl(value) {
  const code = threadCodeFromUrl(value);
  return code ? `https://e.5chan.jp/${code}` : "";
}

function classifyThreadPost(attachmentInfos, linkHrefs, threadCode) {
  const kinds = [];
  const infos = Array.isArray(attachmentInfos) ? attachmentInfos : [];
  if (infos.some((info) => String(info).includes("画像"))) {
    kinds.push("画像");
  }
  if (infos.some((info) => String(info).includes("動画"))) {
    kinds.push("動画");
  }
  const selfPattern = new RegExp(`/${threadCode}/\\d+/?$`);
  const hasExternalLink = (Array.isArray(linkHrefs) ? linkHrefs : []).some((href) => {
    const value = String(href || "");
    if (!/^https?:\/\//i.test(value)) {
      return false;
    }
    return !selfPattern.test(value);
  });
  if (hasExternalLink) {
    kinds.push("リンク");
  }
  return kinds;
}

function parseThreadPage(htmlText, threadCode) {
  const documentXml = new DOMParser().parseFromString(htmlText, "text/html");
  const title = (documentXml.title || "").split("|")[0].trim();
  const posts = [...documentXml.querySelectorAll("article.resentry")]
    .map((article) => {
      const no = Number.parseInt(article.querySelector(".eno")?.textContent || "", 10);
      if (!Number.isInteger(no)) {
        return null;
      }
      const attachmentInfos = [...article.querySelectorAll(".filethumblist .info")].map(
        (node) => node.textContent || ""
      );
      const linkHrefs = [...article.querySelectorAll(".comment a[href]")].map((node) =>
        node.getAttribute("href")
      );
      return {
        no,
        kinds: classifyThreadPost(attachmentInfos, linkHrefs, threadCode),
        at: article.querySelector("time.date")?.getAttribute("datetime") || "",
      };
    })
    .filter(Boolean);
  return { title, posts };
}

async function fetchThreadHtml(thread) {
  const target = `${thread.url}/all`;
  const proxyUrl = `${CONFIG.threadWatch.corsProxy}${encodeURIComponent(target)}`;
  const response = await fetchWithTimeout(proxyUrl, CONFIG.threadWatch.fetchTimeoutMs);
  const text = await response.text();
  if (!text || !text.includes("resentry")) {
    throw new Error("Thread page could not be read");
  }
  return text;
}

async function checkThread(thread) {
  const htmlText = await fetchThreadHtml(thread);
  const { title, posts } = parseThreadPage(htmlText, thread.code);
  if (!posts.length) {
    throw new Error("Thread page has no posts");
  }
  if (title) {
    thread.title = title;
  }
  const maxNo = Math.max(...posts.map((post) => post.no));
  thread.lastTotal = maxNo;
  thread.lastChecked = Date.now();
  thread.error = "";
  if (!Number.isInteger(thread.lastSeen)) {
    thread.lastSeen = maxNo;
    return [];
  }
  const fresh = posts.filter(
    (post) => post.no > thread.lastSeen && post.kinds.length > 0
  );
  thread.lastSeen = Math.max(thread.lastSeen, maxNo);
  if (fresh.length) {
    const known = new Set((thread.pending || []).map((item) => item.no));
    thread.pending = [
      ...(thread.pending || []),
      ...fresh.filter((post) => !known.has(post.no)),
    ].slice(-30);
  }
  return fresh;
}

async function checkAllThreads(manual = false) {
  if (threadWatchChecking || !threadWatchState.threads.length) {
    if (!threadWatchState.threads.length) {
      renderThreadWatch();
    }
    return;
  }
  threadWatchChecking = true;
  elements.threadWatchStatus.textContent = "確認中…";
  const notified = [];
  try {
    for (const thread of threadWatchState.threads) {
      try {
        const fresh = await checkThread(thread);
        if (fresh.length) {
          notified.push({ thread, fresh });
        }
      } catch {
        thread.error = "取得できませんでした";
        thread.lastChecked = Date.now();
      }
    }
  } finally {
    threadWatchChecking = false;
    saveThreadWatchState();
    renderThreadWatch();
    notified.forEach(({ thread, fresh }) => notifyThreadUpdate(thread, fresh));
    if (manual) {
      elements.threadWatchStatus.textContent =
        "確認 " + updatedLabel(Date.now());
    }
  }
}

function notifyThreadUpdate(thread, fresh) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }
  const kinds = [...new Set(fresh.flatMap((post) => post.kinds))].join("・");
  try {
    new Notification(`${thread.title || "スレ"} に新しい${kinds}`, {
      body: `${fresh.length}件のレスに画像・動画・リンクが付きました`,
      tag: `thread-watch-${thread.code}`,
    });
  } catch {
  }
}

function renderThreadWatch() {
  const threads = threadWatchState.threads;
  const totalPending = threads.reduce(
    (sum, thread) => sum + (thread.pending || []).length,
    0
  );
  elements.threadWatchBadge.hidden = totalPending === 0;
  elements.threadWatchBadge.textContent = String(totalPending);
  document.title = totalPending
    ? `(${totalPending}) ${threadWatchBaseTitle}`
    : threadWatchBaseTitle;

  if (!threads.length) {
    elements.threadWatchStatus.textContent = "未登録";
    elements.threadWatchList.innerHTML =
      '<p class="feed-message">設定ページでスレのURLを登録してください</p>';
    renderThreadManager();
    return;
  }

  const lastChecked = Math.max(
    ...threads.map((thread) => thread.lastChecked || 0)
  );
  elements.threadWatchStatus.textContent = lastChecked
    ? "確認 " + updatedLabel(lastChecked)
    : "未確認";

  elements.threadWatchList.innerHTML = threads
    .map((thread, threadIndex) => {
      const pending = thread.pending || [];
      const pendingItems = pending.length
        ? `<ul class="thread-pending-list">${pending
            .map(
              (item) => `
              <li>
                <a href="${escapeAttribute(thread.url)}/${item.no}" target="_blank" rel="noopener">
                  <span>No.${item.no} ${escapeHtml(item.kinds.join("・"))}</span>
                  <span>${escapeHtml(item.at ? formatNewsDate(item.at) : "")}</span>
                </a>
              </li>`
            )
            .join("")}</ul>
           <button class="thread-clear-button" type="button" data-clear-thread="${threadIndex}">既読にする</button>`
        : '<p class="thread-none">新しい画像・動画・リンクはありません</p>';
      const meta = thread.error
        ? escapeHtml(thread.error)
        : `全${thread.lastTotal ?? "--"}件`;
      return `
        <section class="thread-item">
          <div class="thread-item-heading">
            <a href="${escapeAttribute(thread.url)}" target="_blank" rel="noopener">${escapeHtml(thread.title || thread.url)}</a>
            ${pending.length ? `<span class="thread-watch-badge">${pending.length}</span>` : ""}
          </div>
          <p class="thread-meta">${meta}</p>
          ${pendingItems}
        </section>
      `;
    })
    .join("");
  renderThreadManager();
}

function renderThreadManager() {
  if (!elements.threadWatchManager) {
    return;
  }
  elements.threadWatchManager.innerHTML = threadWatchState.threads
    .map(
      (thread, threadIndex) => `
        <div class="thread-manager-row">
          <span>${escapeHtml(thread.title || thread.url)}</span>
          <button type="button" data-delete-thread="${threadIndex}">削除</button>
        </div>
      `
    )
    .join("");
}

function setupThreadWatch() {
  renderThreadWatch();
  updateThreadNotifyStatus();

  elements.threadWatchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const url = normalizeThreadUrl(elements.threadWatchUrl.value);
    if (!url) {
      elements.threadWatchFormStatus.textContent =
        "いつもちゃんねるのスレURLを入力してください。";
      return;
    }
    if (threadWatchState.threads.some((thread) => thread.url === url)) {
      elements.threadWatchFormStatus.textContent = "そのスレは登録済みです。";
      return;
    }
    threadWatchState.threads.push({
      url,
      code: threadCodeFromUrl(url),
      title: "",
      lastSeen: null,
      lastTotal: null,
      lastChecked: 0,
      pending: [],
      error: "",
    });
    saveThreadWatchState();
    elements.threadWatchForm.reset();
    elements.threadWatchFormStatus.textContent =
      "追加しました。今の最新レスまでを既読として監視を始めます。";
    renderThreadWatch();
    await checkAllThreads();
  });

  elements.threadWatchManager.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-thread]");
    if (!deleteButton) {
      return;
    }
    const threadIndex = Number(deleteButton.dataset.deleteThread);
    if (!threadWatchState.threads[threadIndex]) {
      return;
    }
    threadWatchState.threads.splice(threadIndex, 1);
    saveThreadWatchState();
    renderThreadWatch();
  });

  elements.threadWatchList.addEventListener("click", (event) => {
    const clearButton = event.target.closest("[data-clear-thread]");
    if (!clearButton) {
      return;
    }
    const thread = threadWatchState.threads[Number(clearButton.dataset.clearThread)];
    if (!thread) {
      return;
    }
    thread.pending = [];
    saveThreadWatchState();
    renderThreadWatch();
  });

  elements.refreshThreads.addEventListener("click", () => checkAllThreads(true));

  elements.threadNotifyPermission.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      updateThreadNotifyStatus();
      return;
    }
    try {
      await Notification.requestPermission();
    } catch {
    }
    updateThreadNotifyStatus();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
      return;
    }
    const lastChecked = Math.max(
      0,
      ...threadWatchState.threads.map((thread) => thread.lastChecked || 0)
    );
    if (Date.now() - lastChecked >= CONFIG.threadWatch.intervalMs) {
      checkAllThreads();
    }
  });

  checkAllThreads();
  window.setInterval(() => checkAllThreads(), CONFIG.threadWatch.intervalMs);
}

function updateThreadNotifyStatus() {
  if (!elements.threadNotifyStatus) {
    return;
  }
  const base =
    "画像・動画・リンクが付いた新しいレスだけを通知します。このページを開いている間だけ、約5分おきに確認します。スレが終わって次スレに移ったら、URLを差し替えてください。";
  if (!("Notification" in window)) {
    elements.threadNotifyStatus.textContent =
      base + " このブラウザーは通知に対応していないため、カードのバッジ表示のみになります。";
    return;
  }
  const state =
    Notification.permission === "granted"
      ? "ブラウザ通知は許可されています。"
      : Notification.permission === "denied"
        ? "ブラウザ通知は拒否されています。カードのバッジ表示のみになります。"
        : "ブラウザ通知は未許可です。許可すると、新着時に通知も届きます。";
  elements.threadNotifyStatus.textContent = base + " " + state;
}

setupPages();
updateClock();
setupSearch();
setupShortcuts();
setupShortcutImportExport();
setupBackgroundSettings();
setupWeatherSettings();
loadWeather();
loadNews();
setupThreadWatch();

window.setInterval(updateClock, 1000);
