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
  calendar: {
    discoveryDoc: "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
    scopes: "https://www.googleapis.com/auth/calendar.events",
  },
  links: [
    {
      category: "毎日",
      items: [
        { label: "Gmail", url: "https://mail.google.com/" },
        { label: "Googleカレンダー", url: "https://calendar.google.com/" },
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

const CALENDAR_EVENT_TYPES = [
  { keyword: "日勤", className: "is-day-shift", colorId: "10" },
  { keyword: "宿直", className: "is-night-shift", colorId: "9" },
  { keyword: "遊び", className: "is-play-event", colorId: "6" },
  { keyword: "テスト", className: "is-test-event", colorId: "3" },
  { keyword: "その他", className: "is-other-event", colorId: "8" },
];

const CALENDAR_COLOR_CLASS_MAP = {
  3: "is-test-event",
  6: "is-play-event",
  8: "is-other-event",
  9: "is-night-shift",
  10: "is-day-shift",
};

const sidebarKey = "private-start.sidebarCollapsed";
const pageKey = "private-start.activePage";
const calendarConfigKey = "private-start.calendarApiConfig";
const shortcutsKey = "private-start.shortcuts";
const shortcutEditKey = "private-start.shortcutEditMode";
const newsCategoryKey = "private-start.newsCategory";
const newsCachePrefix = "private-start.newsCache.";
const newsCacheMaxAge = 15 * 60 * 1000;
const miniMemoKey = "private-start.miniMemo";
const calendarTokenKey = "private-start.calendarToken";
const calendarEventsCacheKey = "private-start.calendarEventsCache";
const calendarConsentKey = "private-start.calendarConsentGranted";
const backgroundSettingsKey = "private-start.backgroundSettings";

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
let tokenClient;
let gapiReady = false;
let gisReady = false;
let calendarSignedIn = false;
let calendarVisibleMonth = new Date();
let calendarEvents = [];
let silentCalendarAuthTried = false;
const calendarEventMap = new Map();

const elements = {
  appShell: document.querySelector(".app-shell"),
  sidebarToggle: document.querySelector("#sidebarToggle"),
  sidebarClock: document.querySelector("#sidebarClock"),
  sidebarDate: document.querySelector("#sidebarDate"),
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
  miniMemo: document.querySelector("#miniMemo"),
  miniMemoStatus: document.querySelector("#miniMemoStatus"),
  newsTabs: document.querySelector("#newsTabs"),
  featuredNews: document.querySelector("#featuredNews"),
  newsList: document.querySelector("#newsList"),
  newsSourceLink: document.querySelector("#newsSourceLink"),
  calendarClientId: document.querySelector("#calendarClientId"),
  calendarApiKey: document.querySelector("#calendarApiKey"),
  calendarBackendUrl: document.querySelector("#calendarBackendUrl"),
  calendarConfigEditToggle: document.querySelector("#calendarConfigEditToggle"),
  calendarAuthToggle: document.querySelector("#calendarAuthToggle"),
  calendarStatus: document.querySelector("#calendarStatus"),
  calendarOrigin: document.querySelector("#calendarOrigin"),
  eventForm: document.querySelector("#eventForm"),
  eventModal: document.querySelector("#eventModal"),
  closeEventModal: document.querySelector("#closeEventModal"),
  eventModalTitle: document.querySelector("#eventModalTitle"),
  eventId: document.querySelector("#eventId"),
  eventBaseDate: document.querySelector("#eventBaseDate"),
  eventTitle: document.querySelector("#eventTitle"),
  eventStart: document.querySelector("#eventStart"),
  eventEnd: document.querySelector("#eventEnd"),
  eventDescription: document.querySelector("#eventDescription"),
  addDayShift: document.querySelector("#addDayShift"),
  addNightShift: document.querySelector("#addNightShift"),
  cancelEventEdit: document.querySelector("#cancelEventEdit"),
  calendarEventList: document.querySelector("#calendarEventList"),
  prevMonth: document.querySelector("#prevMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  monthCalendarLabel: document.querySelector("#monthCalendarLabel"),
  monthGrid: document.querySelector("#monthGrid"),
  backgroundPreset: document.querySelector("#backgroundPreset"),
  backgroundImageUrl: document.querySelector("#backgroundImageUrl"),
  saveBackgroundSettings: document.querySelector("#saveBackgroundSettings"),
  resetBackgroundSettings: document.querySelector("#resetBackgroundSettings"),
};

function setupSidebar() {
  const isCollapsed = localStorage.getItem(sidebarKey) === "true";
  setSidebarCollapsed(isCollapsed);

  elements.sidebarToggle.addEventListener("click", () => {
    const nextState = !elements.appShell.classList.contains("is-sidebar-collapsed");
    setSidebarCollapsed(nextState);
    localStorage.setItem(sidebarKey, String(nextState));
  });
}

function setSidebarCollapsed(isCollapsed) {
  elements.appShell.classList.toggle("is-sidebar-collapsed", isCollapsed);
  elements.sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
  elements.sidebarToggle.setAttribute(
    "aria-label",
    isCollapsed ? "サイドバーを開く" : "サイドバーを折りたたむ"
  );
}

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

  elements.sidebarClock.textContent = time;
  elements.sidebarClock.dateTime = now.toISOString();
  elements.sidebarDate.textContent = date;
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

function setupMiniMemo() {
  elements.miniMemo.value = localStorage.getItem(miniMemoKey) || "";
  let saveTimer;

  elements.miniMemo.addEventListener("input", () => {
    localStorage.setItem(miniMemoKey, elements.miniMemo.value);
    elements.miniMemoStatus.textContent = "保存中...";
    elements.miniMemoStatus.classList.add("is-saving");

    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      elements.miniMemoStatus.textContent = "保存済み";
      elements.miniMemoStatus.classList.remove("is-saving");
    }, 500);
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

  renderCategoryManager();
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

function renderLinks() {
  elements.linkGroups.innerHTML = shortcutGroups
    .map((group, groupIndex) => {
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

function setupGoogleCalendar() {
  const config = loadCalendarConfig();
  elements.calendarClientId.value = config.clientId;
  elements.calendarApiKey.value = config.apiKey;
  elements.calendarBackendUrl.value = config.backendUrl || "";
  elements.calendarOrigin.textContent = getOAuthOrigin();
  setCalendarConfigEditing(false);
  updateCalendarStatus();
  renderCachedCalendarEvents();

  elements.calendarConfigEditToggle.addEventListener("click", () => {
    if (!isCalendarConfigEditing()) {
      setCalendarConfigEditing(true);
      return;
    }

    saveCalendarConfig({
      clientId: elements.calendarClientId.value.trim(),
      apiKey: elements.calendarApiKey.value.trim(),
      backendUrl: normalizeBackendUrl(elements.calendarBackendUrl.value.trim()),
    });
    setCalendarConfigEditing(false);
    initializeGoogleCalendar();
  });

  elements.calendarAuthToggle.addEventListener("click", () => {
    if (calendarSignedIn) {
      signoutGoogleCalendar();
    } else {
      authorizeGoogleCalendar();
    }
  });

  elements.eventForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCalendarEvent();
  });

  elements.addDayShift.addEventListener("click", () => {
    saveQuickShift("日勤", "08:30", "17:15", 0);
  });

  elements.addNightShift.addEventListener("click", () => {
    saveQuickShift("宿直", "08:30", "08:30", 1);
  });

  elements.cancelEventEdit.addEventListener("click", () => {
    resetEventForm();
    elements.eventModal.close();
  });

  elements.closeEventModal.addEventListener("click", () => {
    elements.eventModal.close();
  });

  elements.eventModal.addEventListener("click", (event) => {
    if (event.target === elements.eventModal) {
      elements.eventModal.close();
    }
  });

  elements.calendarEventList.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-event]");
    const deleteButton = event.target.closest("[data-delete-event]");
    if (editButton) {
      const eventData = calendarEventMap.get(editButton.dataset.eventId);
      if (eventData) {
        fillEventForm(eventData);
      }
    }
    if (deleteButton) {
      deleteCalendarEvent(deleteButton.dataset.eventId);
    }
  });

  elements.prevMonth.addEventListener("click", () => {
    calendarVisibleMonth = new Date(calendarVisibleMonth.getFullYear(), calendarVisibleMonth.getMonth() - 1, 1);
    if (calendarSignedIn) {
      listCalendarEvents();
    } else {
      renderMonthCalendar(calendarEvents);
    }
  });

  elements.nextMonth.addEventListener("click", () => {
    calendarVisibleMonth = new Date(calendarVisibleMonth.getFullYear(), calendarVisibleMonth.getMonth() + 1, 1);
    if (calendarSignedIn) {
      listCalendarEvents();
    } else {
      renderMonthCalendar(calendarEvents);
    }
  });

  elements.monthGrid.addEventListener("click", (event) => {
    const day = event.target.closest("[data-calendar-date]");
    if (!day) {
      return;
    }
    openEventModalForDate(day.dataset.calendarDate);
  });

  initializeGoogleCalendar();
  renderMonthCalendar([]);
}

function loadCalendarConfig() {
  try {
    return {
      clientId: "",
      apiKey: "",
      backendUrl: "",
      ...(JSON.parse(localStorage.getItem(calendarConfigKey)) || {}),
    };
  } catch {
    return { clientId: "", apiKey: "", backendUrl: "" };
  }
}

function isCalendarConfigEditing() {
  return elements.calendarConfigEditToggle.getAttribute("aria-pressed") === "true";
}

function setCalendarConfigEditing(isEditing) {
  elements.calendarConfigEditToggle.setAttribute("aria-pressed", String(isEditing));
  elements.calendarConfigEditToggle.textContent = isEditing ? "設定を保存" : "設定を編集";
  elements.calendarClientId.readOnly = !isEditing;
  elements.calendarApiKey.readOnly = !isEditing;
  elements.calendarBackendUrl.readOnly = !isEditing;
}

function saveCalendarConfig(config) {
  localStorage.setItem(calendarConfigKey, JSON.stringify(config));
}

function hasCalendarConfig() {
  const config = loadCalendarConfig();
  return Boolean(config.clientId && config.apiKey);
}

function hasCalendarBackend() {
  return Boolean(loadCalendarConfig().backendUrl);
}

function getCalendarBackendUrl() {
  return loadCalendarConfig().backendUrl.replace(/\/+$/, "");
}

function normalizeBackendUrl(value) {
  return value.replace(/\/+$/, "");
}

function getOAuthOrigin() {
  if (window.location.protocol === "file:" || window.location.origin === "null") {
    return "http://localhost:8000";
  }

  return window.location.origin;
}

function initializeGoogleCalendar() {
  if (hasCalendarBackend()) {
    checkBackendCalendarStatus();
    return;
  }

  if (!hasCalendarConfig()) {
    updateCalendarStatus("Client ID と API Key を保存すると連携できます。");
    return;
  }

  loadScript("https://apis.google.com/js/api.js", () => {
    gapi.load("client", async () => {
      const config = loadCalendarConfig();
      await gapi.client.init({
        apiKey: config.apiKey,
        discoveryDocs: [CONFIG.calendar.discoveryDoc],
      });
      gapiReady = true;
      setupTokenClient();
      const restored = await restoreCalendarToken();
      if (!restored) {
        updateCalendarAuthButton();
      }
      if (!calendarSignedIn) {
        updateCalendarStatus("前回の予定を表示中です。編集や最新取得にはログインしてください。");
      }
    });
  });

  loadScript("https://accounts.google.com/gsi/client", () => {
    gisReady = true;
    setupTokenClient();
  });
}

function setupTokenClient() {
  if (!gapiReady || !gisReady || tokenClient || !hasCalendarConfig()) {
    return;
  }

  const config = loadCalendarConfig();
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: config.clientId,
    scope: CONFIG.calendar.scopes,
    callback: async (response) => {
      if (response.error) {
        updateCalendarStatus("Google認証に失敗しました。");
        return;
      }
      calendarSignedIn = true;
      localStorage.setItem(calendarConsentKey, "true");
      saveCalendarToken(response);
      updateCalendarAuthButton();
      updateCalendarStatus("ログイン済み。予定を編集できます。");
      await listCalendarEvents();
    },
  });
}

function authorizeGoogleCalendar() {
  if (hasCalendarBackend()) {
    window.location.href = `${getCalendarBackendUrl()}/auth/google`;
    return;
  }

  if (!hasCalendarConfig()) {
    updateCalendarStatus("先に Client ID と API Key を保存してください。");
    return;
  }

  if (!tokenClient) {
    updateCalendarStatus("Google APIを読み込み中です。少し待ってから再度ログインしてください。");
    initializeGoogleCalendar();
    return;
  }

  tokenClient.requestAccessToken({ prompt: getCalendarAuthPrompt() });
}

function getCalendarAuthPrompt() {
  if (calendarSignedIn || localStorage.getItem(calendarConsentKey) === "true") {
    return "";
  }

  return "consent";
}

function trySilentCalendarAuth() {
  if (silentCalendarAuthTried || calendarSignedIn || !tokenClient) {
    return;
  }

  silentCalendarAuthTried = true;
  updateCalendarStatus("ログイン状態を確認しています...");
  tokenClient.requestAccessToken({ prompt: "" });
}

function renderCachedCalendarEvents() {
  const cachedEvents = loadCalendarEventsCache();
  if (!cachedEvents.length) {
    return;
  }

  calendarEvents = cachedEvents;
  renderCalendarEvents(getCurrentWeekEvents(calendarEvents));
  renderMonthCalendar(calendarEvents);
  updateCalendarStatus("前回取得した予定を表示中です。");
}

async function checkBackendCalendarStatus() {
  try {
    const status = await calendarBackendRequest("/auth/status");
    calendarSignedIn = Boolean(status.authenticated);
    updateCalendarAuthButton();
    if (calendarSignedIn) {
      updateCalendarStatus("バックエンド連携でログイン済みです。");
      await listCalendarEvents();
    } else {
      updateCalendarStatus("バックエンド連携を使います。ログインすると長期ログインできます。");
    }
  } catch {
    calendarSignedIn = false;
    updateCalendarAuthButton();
    updateCalendarStatus("バックエンドに接続できません。Backend URLを確認してください。");
  }
}

async function calendarBackendRequest(path, options = {}) {
  const response = await fetch(`${getCalendarBackendUrl()}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Calendar backend error: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function signoutGoogleCalendar() {
  if (hasCalendarBackend()) {
    calendarBackendRequest("/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem(calendarTokenKey);
    calendarSignedIn = false;
    updateCalendarAuthButton();
    updateCalendarStatus("ログアウトしました。");
    calendarEvents = [];
    renderCalendarEvents([]);
    renderMonthCalendar([]);
    return;
  }

  const token = typeof gapi === "undefined" ? null : gapi.client?.getToken?.();
  if (token) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken("");
  }
  localStorage.removeItem(calendarTokenKey);
  calendarSignedIn = false;
  updateCalendarAuthButton();
  updateCalendarStatus("ログアウトしました。");
  calendarEvents = [];
  renderCalendarEvents([]);
  renderMonthCalendar([]);
}

function updateCalendarAuthButton() {
  elements.calendarAuthToggle.textContent = calendarSignedIn ? "ログアウト" : "ログイン";
  elements.calendarAuthToggle.setAttribute("aria-pressed", String(calendarSignedIn));
}

async function listCalendarEvents() {
  if (!calendarSignedIn) {
    return;
  }

  const fetchRange = getCalendarFetchRange();
  if (hasCalendarBackend()) {
    const params = new URLSearchParams({
      timeMin: fetchRange.start.toISOString(),
      timeMax: fetchRange.end.toISOString(),
    });
    const items = await calendarBackendRequest(`/api/calendar?${params.toString()}`);
    calendarEvents = items || [];
    saveCalendarEventsCache(calendarEvents);
    renderCalendarEvents(getCurrentWeekEvents(calendarEvents));
    renderMonthCalendar(calendarEvents);
    return;
  }

  const response = await gapi.client.calendar.events.list({
    calendarId: "primary",
    timeMin: fetchRange.start.toISOString(),
    timeMax: fetchRange.end.toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults: 100,
    orderBy: "startTime",
  });

  calendarEvents = response.result.items || [];
  saveCalendarEventsCache(calendarEvents);
  renderCalendarEvents(getCurrentWeekEvents(calendarEvents));
  renderMonthCalendar(calendarEvents);
}

async function saveCalendarEvent() {
  if (!calendarSignedIn) {
    updateCalendarStatus("予定を保存するにはログインしてください。");
    return;
  }

  const event = buildCalendarEvent();
  if (!event.summary || !event.start.dateTime || !event.end.dateTime) {
    updateCalendarStatus("予定名、開始、終了を入力してください。");
    return;
  }

  if (elements.eventId.value) {
    if (hasCalendarBackend()) {
      await calendarBackendRequest(`/api/calendar/${encodeURIComponent(elements.eventId.value)}`, {
        method: "PATCH",
        body: JSON.stringify(event),
      });
    } else {
      await gapi.client.calendar.events.update({
        calendarId: "primary",
        eventId: elements.eventId.value,
        resource: event,
      });
    }
    updateCalendarStatus("予定を更新しました。");
  } else {
    await createCalendarEvent(event);
    updateCalendarStatus("予定を追加しました。");
  }

  resetEventForm();
  await listCalendarEvents();
}

async function createCalendarEvent(event) {
  if (hasCalendarBackend()) {
    return calendarBackendRequest("/api/calendar", {
      method: "POST",
      body: JSON.stringify(event),
    });
  }

  return gapi.client.calendar.events.insert({
    calendarId: "primary",
    resource: event,
  });
}

async function deleteCalendarEvent(eventId) {
  if (!calendarSignedIn || !eventId) {
    return;
  }

  if (hasCalendarBackend()) {
    await calendarBackendRequest(`/api/calendar/${encodeURIComponent(eventId)}`, { method: "DELETE" });
  } else {
    await gapi.client.calendar.events.delete({
      calendarId: "primary",
      eventId,
    });
  }
  updateCalendarStatus("予定を削除しました。");
  await listCalendarEvents();
}

function buildCalendarEvent() {
  const start = elements.eventStart.value;
  const end = elements.eventEnd.value;
  const summary = elements.eventTitle.value.trim();
  const eventType = getCalendarEventType(summary);
  const event = {
    summary,
    description: elements.eventDescription.value.trim(),
    start: {
      dateTime: start ? new Date(start).toISOString() : "",
      timeZone: CONFIG.weather.timezone,
    },
    end: {
      dateTime: end ? new Date(end).toISOString() : "",
      timeZone: CONFIG.weather.timezone,
    },
  };

  if (eventType.colorId) {
    event.colorId = eventType.colorId;
  }

  return event;
}

function renderCalendarEvents(events) {
  calendarEventMap.clear();
  if (!events.length) {
    elements.calendarEventList.innerHTML = '<p class="feed-message">予定はありません。</p>';
    return;
  }

  elements.calendarEventList.innerHTML = events
    .map((event) => {
      const start = event.start?.dateTime || event.start?.date || "";
      const eventData = {
        id: event.id,
        summary: event.summary || "",
        description: event.description || "",
        start,
        end: event.end?.dateTime || event.end?.date || "",
        colorId: event.colorId || "",
      };
      calendarEventMap.set(event.id, eventData);
      const eventType = getCalendarEventType(event.summary || "", event.colorId);
      return `
        <article class="calendar-event ${eventType.className}">
          <div>
            <strong>${escapeHtml(event.summary || "無題")}</strong>
            <span>${escapeHtml(formatCalendarDate(start))}</span>
          </div>
          <div class="calendar-event-actions">
            <button type="button" data-edit-event data-event-id="${escapeAttribute(event.id)}">編集</button>
            <button type="button" data-delete-event data-event-id="${escapeAttribute(event.id)}">削除</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderMonthCalendar(events) {
  const year = calendarVisibleMonth.getFullYear();
  const month = calendarVisibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  elements.monthCalendarLabel.textContent = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
  }).format(calendarVisibleMonth);

  elements.monthGrid.innerHTML = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const isCurrentMonth = date.getMonth() === month;
    const isToday = date.toDateString() === new Date().toDateString();
    const allDayEvents = events.filter((event) => eventOccursOnDate(event, date));
    const dayEvents = allDayEvents.slice(0, 3);
    const dayType = getDominantCalendarEventType(allDayEvents);

    return `
      <button class="month-day ${dayType.className}${isCurrentMonth ? "" : " is-muted"}${isToday ? " is-today" : ""}" type="button" data-calendar-date="${toDateInputValue(date)}">
        <span class="month-day-number">${date.getDate()}</span>
        <span class="month-day-events">
          ${dayEvents
            .map((event) => {
              const eventType = getCalendarEventType(event.summary || "", event.colorId);
              return `<span class="${eventType.className}">${escapeHtml(event.summary || "無題")}</span>`;
            })
            .join("")}
        </span>
      </button>
    `;
  }).join("");
}

function getCalendarEventType(summary, colorId = "") {
  const matchedType = CALENDAR_EVENT_TYPES.find((type) => summary.includes(type.keyword));
  if (matchedType) {
    return matchedType;
  }
  if (CALENDAR_COLOR_CLASS_MAP[colorId]) {
    return { className: CALENDAR_COLOR_CLASS_MAP[colorId], colorId };
  }
  if (summary.includes("日勤")) {
    return { className: "is-day-shift" };
  }
  if (summary.includes("宿直")) {
    return { className: "is-night-shift" };
  }
  return { className: "is-regular-event" };
}

function getDominantCalendarEventType(events) {
  return (
    CALENDAR_EVENT_TYPES.find((type) =>
      events.some((event) => (event.summary || "").includes(type.keyword))
    ) ||
    events
      .map((event) => getCalendarEventType(event.summary || "", event.colorId))
      .find((type) => type.className !== "is-regular-event") || { className: "is-regular-event" }
  );
}

function openEventModalForDate(dateText) {
  resetEventForm();
  const start = new Date(`${dateText}T09:00:00`);
  const end = new Date(`${dateText}T10:00:00`);
  elements.eventBaseDate.value = dateText;
  elements.eventStart.value = toDateTimeLocal(start.toISOString());
  elements.eventEnd.value = toDateTimeLocal(end.toISOString());
  elements.eventModalTitle.textContent = "予定を追加";
  elements.eventModal.showModal();
  elements.eventTitle.focus();
}

async function saveQuickShift(title, startTime, endTime, endDateOffset) {
  if (!calendarSignedIn) {
    updateCalendarStatus("勤務予定を登録するにはログインしてください。");
    return;
  }

  const baseDate = elements.eventBaseDate.value || toDateInputValue(new Date());
  const start = new Date(`${baseDate}T${startTime}:00`);
  const end = new Date(`${baseDate}T${endTime}:00`);
  end.setDate(end.getDate() + endDateOffset);

  const eventType = getCalendarEventType(title);
  const event = {
    summary: title,
    description: "",
    start: {
      dateTime: start.toISOString(),
      timeZone: CONFIG.weather.timezone,
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: CONFIG.weather.timezone,
    },
  };

  if (eventType.colorId) {
    event.colorId = eventType.colorId;
  }

  await createCalendarEvent(event);

  updateCalendarStatus(`${title}を登録しました。`);
  elements.eventModal.close();
  await listCalendarEvents();
}

function getEventStartDate(event) {
  return new Date(event.start?.dateTime || event.start?.date || "");
}

function getEventEndDate(event) {
  return new Date(event.end?.dateTime || event.end?.date || event.start?.dateTime || event.start?.date || "");
}

function eventOccursOnDate(event, date) {
  if (event.start?.date) {
    const targetDate = toDateInputValue(date);
    const startDate = event.start.date;
    const endDate = event.end?.date || getNextDateInputValue(startDate);
    return targetDate >= startDate && targetDate < endDate;
  }

  const start = getEventStartDate(event);
  const end = getEventEndDate(event);
  if (Number.isNaN(start.getTime())) {
    return false;
  }

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const eventEnd = Number.isNaN(end.getTime()) ? new Date(start.getTime() + 1) : end;

  return start < dayEnd && eventEnd > dayStart;
}

function eventOccursInRange(event, start, end) {
  if (event.start?.date) {
    const eventStart = parseDateInputAsLocal(event.start.date);
    const eventEnd = parseDateInputAsLocal(event.end?.date || getNextDateInputValue(event.start.date));
    return eventStart < end && eventEnd > start;
  }

  const eventStart = getEventStartDate(event);
  const eventEnd = getEventEndDate(event);
  if (Number.isNaN(eventStart.getTime())) {
    return false;
  }

  const safeEventEnd = Number.isNaN(eventEnd.getTime()) ? new Date(eventStart.getTime() + 1) : eventEnd;
  return eventStart < end && safeEventEnd > start;
}

function getCurrentWeekEvents(events) {
  const start = getWeekStart(new Date());
  const end = getWeekEnd(new Date());
  return events.filter((event) => eventOccursInRange(event, start, end));
}

function fillEventForm(event) {
  elements.eventId.value = event.id;
  elements.eventTitle.value = event.summary;
  elements.eventDescription.value = event.description;
  elements.eventStart.value = toDateTimeLocal(event.start);
  elements.eventEnd.value = toDateTimeLocal(event.end);
  elements.eventModalTitle.textContent = "予定を編集";
  elements.eventModal.showModal();
  updateCalendarStatus("予定を編集中です。");
}

function resetEventForm() {
  elements.eventForm.reset();
  elements.eventId.value = "";
  elements.eventBaseDate.value = "";
  elements.eventModalTitle.textContent = "予定を追加";
}

function updateCalendarStatus(message) {
  elements.calendarStatus.textContent = message || "Client ID と API Key を保存すると連携できます。";
}

function formatCalendarDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toDateTimeLocal(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function loadScript(src, onload) {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    existing.addEventListener("load", onload, { once: true });
    return;
  }

  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.defer = true;
  script.onload = onload;
  document.head.appendChild(script);
}

function saveCalendarToken(response) {
  if (!response.access_token) {
    return;
  }

  localStorage.setItem(
    calendarTokenKey,
    JSON.stringify({
      access_token: response.access_token,
      expires_at: Date.now() + Number(response.expires_in || 0) * 1000,
    })
  );
}

function loadCalendarEventsCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(calendarEventsCacheKey));
    return Array.isArray(cache?.items) ? cache.items : [];
  } catch {
    return [];
  }
}

function saveCalendarEventsCache(items) {
  localStorage.setItem(
    calendarEventsCacheKey,
    JSON.stringify({
      savedAt: Date.now(),
      items,
    })
  );
}

async function restoreCalendarToken() {
  try {
    const token = JSON.parse(localStorage.getItem(calendarTokenKey));
    if (!token?.access_token || Date.now() > token.expires_at - 60000) {
      localStorage.removeItem(calendarTokenKey);
      return false;
    }

    gapi.client.setToken({ access_token: token.access_token });
    calendarSignedIn = true;
    updateCalendarAuthButton();
    updateCalendarStatus("ログイン状態を復元しました。");
    await listCalendarEvents();
    return true;
  } catch {
    localStorage.removeItem(calendarTokenKey);
    return false;
  }
}

function getWeekStart(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function getWeekEnd(date) {
  const end = getWeekStart(date);
  end.setDate(end.getDate() + 7);
  return end;
}

function getMonthCalendarRange(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstDay.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 42);
  return { start, end };
}

function getCalendarFetchRange() {
  const monthRange = getMonthCalendarRange(calendarVisibleMonth);
  const weekStart = getWeekStart(new Date());
  const weekEnd = getWeekEnd(new Date());
  return {
    start: monthRange.start < weekStart ? monthRange.start : weekStart,
    end: monthRange.end > weekEnd ? monthRange.end : weekEnd,
  };
}

function toDateInputValue(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function parseDateInputAsLocal(value) {
  return new Date(`${value}T00:00:00`);
}

function getNextDateInputValue(value) {
  const date = parseDateInputAsLocal(value);
  date.setDate(date.getDate() + 1);
  return toDateInputValue(date);
}

async function loadWeather() {
  elements.weatherPlace.textContent = CONFIG.weather.place;

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", CONFIG.weather.latitude);
  url.searchParams.set("longitude", CONFIG.weather.longitude);
  url.searchParams.set("timezone", CONFIG.weather.timezone);
  url.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,wind_speed_10m");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("forecast_days", "5");

  try {
    const response = await fetchWithTimeout(url, 6000);
    const data = await response.json();
    const current = data.current;
    const code = Number(current.weather_code);
    const weather = WEATHER_CODES[code] || ["🌡️", "天気情報"];

    elements.weatherIcon.textContent = weather[0];
    elements.weatherTemp.textContent = `${Math.round(current.temperature_2m)}°`;
    elements.weatherSummary.textContent = weather[1];
    elements.weatherFeels.textContent = `体感 ${Math.round(current.apparent_temperature)}°`;
    elements.weatherWind.textContent = `風 ${Math.round(current.wind_speed_10m)} km/h`;
    renderWeeklyWeather(data.daily);
  } catch (error) {
    elements.weatherIcon.textContent = "--";
    elements.weatherTemp.textContent = "--°";
    elements.weatherSummary.textContent = "天気を取得できません";
    elements.weatherFeels.textContent = "体感 --°";
    elements.weatherWind.textContent = "風 -- km/h";
    elements.weeklyWeatherList.innerHTML = '<p class="feed-message">週間天気を取得できません</p>';
    console.warn(error);
  }
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
        <button class="news-tab" type="button" data-news-category="${escapeAttribute(category.id)}">
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
  const category = CONFIG.news.categories.find((item) => item.id === categoryId) || CONFIG.news.categories[0];
  localStorage.setItem(newsCategoryKey, category.id);
  elements.newsSourceLink.href = category.feedUrl;
  const cached = loadNewsCache(category.id);

  if (cached) {
    renderNewsFeed(cached.items);
  } else {
    elements.featuredNews.innerHTML = "";
    elements.newsList.innerHTML = '<p class="feed-message">ニュースを読み込み中...</p>';
  }

  elements.newsTabs.querySelectorAll(".news-tab").forEach((button) => {
    const isActive = button.dataset.newsCategory === category.id;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  try {
    const items = await fetchNewsItems(category.feedUrl);
    if (!items.length) {
      throw new Error("News feed has no items");
    }

    saveNewsCache(category.id, items);
    renderNewsFeed(items);
  } catch (error) {
    if (!cached) {
      elements.featuredNews.innerHTML = "";
      elements.newsList.innerHTML = '<p class="feed-message">ニュースを取得できません</p>';
    }
    console.warn(error);
  }
}

function renderNewsFeed(items) {
  const [featured, ...rest] = items;
  elements.featuredNews.innerHTML = renderFeaturedNews(featured);
  elements.newsList.innerHTML = rest.map(renderNewsItem).join("");
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
    return fetchJsonFeedItems(feedUrl);
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
  try {
    const cached = JSON.parse(localStorage.getItem(`${newsCachePrefix}${categoryId}`));
    if (cached?.items?.length && Date.now() - cached.savedAt < newsCacheMaxAge) {
      return cached;
    }
  } catch {
    localStorage.removeItem(`${newsCachePrefix}${categoryId}`);
  }

  return null;
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

async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return response;
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

setupSidebar();
setupPages();
updateClock();
setupSearch();
setupMiniMemo();
setupShortcuts();
setupBackgroundSettings();
setupGoogleCalendar();
loadWeather();
loadNews();

window.setInterval(updateClock, 1000);
