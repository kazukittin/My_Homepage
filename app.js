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

const sidebarKey = "private-start.sidebarCollapsed";
const pageKey = "private-start.activePage";
const shortcutsKey = "private-start.shortcuts";
const shortcutEditKey = "private-start.shortcutEditMode";
const newsCategoryKey = "private-start.newsCategory";
const newsCachePrefix = "private-start.newsCache.";
const newsCacheMaxAge = 15 * 60 * 1000;
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
  elements.newsSourceLink.href = "https://news.google.com/home?hl=ja&gl=JP&ceid=JP:ja";
  const cached = loadNewsCache(category.id);

  if (cached) {
    renderNewsFeed(cached.items);
  } else {
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
      elements.newsList.innerHTML = '<p class="feed-message">ニュースを取得できません</p>';
    }
    console.warn(error);
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
setupShortcuts();
setupShortcutImportExport();
setupBackgroundSettings();
loadWeather();
loadNews();

window.setInterval(updateClock, 1000);
