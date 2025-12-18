// src/services/analyticsService.js
const RAW_API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://itl-411-finals-backend.onrender.com/api";

// Normalize: remove trailing slashes, e.g. "....../api/"
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

// 2) Helper to build URLs with query params
function buildUrl(path, params = {}) {
  if (!API_BASE) throw new Error("VITE_API_BASE_URL is not set");

  // remove leading slashes from path so we don’t get double “//”
  const cleanPath = String(path).replace(/^\/+/, "");
  const url = new URL(`${API_BASE}/${cleanPath}`);

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, v);
    }
  });

  return url;
}

// 3) Generic GET helper
async function apiGet(path, params = {}) {
  const url = buildUrl(path, params);

  // You can open DevTools → Console to see this in the browser
  console.log("Calling API:", url.toString());

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    // IMPORTANT: no credentials here, so we don’t need CORS-with-credentials
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  return text ? JSON.parse(text) : null;
}

/* ---------- API functions (unchanged signatures) ---------- */

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

/** Combined weather + analytics endpoint */
export function fetchWeatherAnalytics({ city = "Bacolod,PH" } = {}) {
  // Note: "analytics/" → backend path is /api/analytics/
  return apiGet("analytics/", { city });
}
