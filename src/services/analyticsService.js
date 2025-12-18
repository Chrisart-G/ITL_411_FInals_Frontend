// src/services/analyticsService.js
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");

function buildUrl(path, params = {}) {
  if (!API_BASE) throw new Error("VITE_API_BASE_URL is not set");
  const url = new URL(`${API_BASE}/${String(path).replace(/^\/+/, "")}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  return url;
}

async function apiGet(path, params = {}) {
  const url = buildUrl(path, params);
  const res = await fetch(url.toString(), { credentials: "include" });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  return text ? JSON.parse(text) : null;
}

/** Weather summary (current + daily) */
export function fetchWeatherSummary({ city = "Bacolod,PH" } = {}) {
  return apiGet("weather/summary", { city });
}

/** Analytics: headline KPIs */
export function fetchMetrics({ city = "Bacolod,PH" } = {}) {
  return apiGet("analytics/metrics", { city });
}

/** Analytics: daily series */
export function fetchTimeSeries({ city = "Bacolod,PH", days, from, to } = {}) {
  return apiGet("analytics/timeseries", { city, days, from, to });
}

/** Analytics: 7-day forecast */
export function fetchForecast({ city = "Bacolod,PH", horizon = 7 } = {}) {
  return apiGet("analytics/forecast", { city, horizon });
}

/** Analytics: feature importance */
export function fetchFeatureImportance() {
  return apiGet("analytics/feature-importance");
}

export function fetchWeatherAnalytics({ city = "Bacolod,PH" } = {}) {
  return apiGet("analytics/", { city });  // Note: "analytics/" not "analytics/analytics"
}
