// src/Component/Dashboard.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  fetchWeatherSummary,
  fetchWeatherAnalytics,
} from "../services/analyticsService";

const fmt = {
  temp: (n) => (n == null ? "—" : `${Math.round(n)}°C`),
  pct: (n) => (n == null ? "—" : `${Math.round(n)}%`),
  mm: (n) => (n == null ? "—" : `${Number(n).toFixed(1)} mm`),
  dt: (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
  day: (d) =>
    d
      ? new Date(d).toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      : "—",
  dateNice: (tsIso) =>
    tsIso
      ? new Date(tsIso).toLocaleDateString(undefined, {
          weekday: "long",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—",
  shortDay: (d) =>
    d
      ? new Date(d).toLocaleDateString(undefined, {
          weekday: "short",
        })
      : "—",
};

const iconFor = (pop, rainMm) => {
  if ((rainMm ?? 0) > 0.1) return "🌧️";
  if ((pop ?? 0) >= 60) return "🌦️";
  return "☀️";
};

const getDailyOutfitAdvisory = (dayData, index) => {
  if (!dayData) return { items: [], advisoryLevel: "normal", color: "emerald" };

  const tempMax = dayData.temp_max || 25;
  const tempMin = dayData.temp_min || 20;
  const pop = dayData.pop || 0;
  const rainMm = dayData.rain_mm || 0;

  const items = [];
  let advisoryLevel = "normal";
  let color = "emerald";

  if (tempMax >= 32) {
    advisoryLevel = "hot";
    color = "red";
    items.push({ icon: "🕶️", item: "Sunglasses", category: "accessory" });
    items.push({ icon: "🧴", item: "Sunscreen", category: "essential" });
    items.push({ icon: "🧢", item: "Cap/Hat", category: "accessory" });
    items.push({ icon: "👕", item: "Light shirt", category: "clothing" });
    items.push({ icon: "💧", item: "Water bottle", category: "essential" });
  } else if (tempMax >= 28) {
    advisoryLevel = "warm";
    color = "orange";
    items.push({ icon: "🧴", item: "Sunscreen", category: "essential" });
    items.push({ icon: "🧢", item: "Hat", category: "accessory" });
    items.push({ icon: "👕", item: "T-shirt", category: "clothing" });
    items.push({ icon: "💧", item: "Water", category: "essential" });
  } else if (tempMax <= 22) {
    advisoryLevel = "cool";
    color = "blue";
    items.push({ icon: "🧥", item: "Jacket", category: "clothing" });
    items.push({ icon: "👖", item: "Pants", category: "clothing" });
  } else {
    advisoryLevel = "mild";
    color = "emerald";
    items.push({ icon: "👕", item: "T-shirt", category: "clothing" });
  }

  if (pop >= 80 || rainMm >= 5) {
    advisoryLevel = "rainy";
    color = "indigo";
    items.push({ icon: "☔", item: "Umbrella", category: "essential" });
    items.push({ icon: "👢", item: "Rain boots", category: "footwear" });
    items.push({ icon: "🧥", item: "Raincoat", category: "clothing" });
  } else if (pop >= 50 || rainMm >= 2) {
    if (!items.some((item) => item.item === "Umbrella")) {
      items.push({ icon: "🌂", item: "Umbrella", category: "essential" });
    }
    if (!items.some((item) => item.item === "Jacket")) {
      items.push({ icon: "🧥", item: "Light jacket", category: "clothing" });
    }
  }

  if (tempMax >= 25 && !items.some((item) => item.item === "Water")) {
    items.push({ icon: "💧", item: "Water", category: "essential" });
  }

  return {
    items: items.slice(0, 4),
    advisoryLevel,
    color,
    dayName: index === 0 ? "Today" : fmt.shortDay(dayData.date),
  };
};

const PH_LOCATIONS = [
  {
    id: "luzon",
    label: "Luzon",
    provinces: [
      {
        id: "ncr",
        label: "Metro Manila",
        cities: [
          { label: "Manila", query: "Manila, Metro Manila, Philippines" },
          {
            label: "Quezon City",
            query: "Quezon City, Metro Manila, Philippines",
          },
          { label: "Pasig City", query: "Pasig City, Metro Manila, Philippines" },
        ],
      },
      {
        id: "cavite",
        label: "Cavite",
        cities: [
          { label: "Tagaytay City", query: "Tagaytay City, Cavite, Philippines" },
          { label: "Imus City", query: "Imus City, Cavite, Philippines" },
        ],
      },
    ],
  },
  {
    id: "visayas",
    label: "Visayas",
    provinces: [
      {
        id: "negros-occidental",
        label: "Negros Occidental",
        cities: [
          {
            label: "Bacolod City",
            query: "Bacolod City, Negros Occidental, Philippines",
          },
          { label: "Bago City", query: "Bago City, Negros Occidental, Philippines" },
          {
            label: "Calero, Bago City",
            query: "Calero, Bago City, Negros Occidental, Philippines",
          },
          { label: "Murcia", query: "Murcia, Negros Occidental, Philippines" },
        ],
      },
      {
        id: "iloilo",
        label: "Iloilo",
        cities: [{ label: "Iloilo City", query: "Iloilo City, Iloilo, Philippines" }],
      },
      {
        id: "cebu",
        label: "Cebu",
        cities: [
          { label: "Cebu City", query: "Cebu City, Cebu, Philippines" },
          {
            label: "Lapu-Lapu City",
            query: "Lapu-Lapu City, Cebu, Philippines",
          },
        ],
      },
    ],
  },
  {
    id: "mindanao",
    label: "Mindanao",
    provinces: [
      {
        id: "davao-del-sur",
        label: "Davao del Sur",
        cities: [{ label: "Davao City", query: "Davao City, Davao del Sur, Philippines" }],
      },
      {
        id: "misamis-oriental",
        label: "Misamis Oriental",
        cities: [
          {
            label: "Cagayan de Oro",
            query: "Cagayan de Oro, Misamis Oriental, Philippines",
          },
        ],
      },
      {
        id: "zamboanga-del-sur",
        label: "Zamboanga del Sur",
        cities: [
          {
            label: "Zamboanga City",
            query: "Zamboanga City, Zamboanga del Sur, Philippines",
          },
        ],
      },
    ],
  },
];

export default function Dashboard() {
  const [cityQuery, setCityQuery] = useState(
    "Bacolod City, Negros Occidental, Philippines"
  );
  const [locationLabel, setLocationLabel] = useState(
    "Bacolod City • Negros Occidental • Visayas"
  );

  const [wx, setWx] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const heroRef = useRef(null);
  const forecastRef = useRef(null);
  const analyticsRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const prevHtmlColorScheme = html.style.colorScheme;
    const prevBodyBg = body.style.backgroundColor;
    const prevBodyColor = body.style.color;

    const addedBodyClasses = ["bg-slate-950", "text-slate-100"];
    body.classList.add(...addedBodyClasses);

    html.style.colorScheme = "dark";
    body.style.backgroundColor = "#020617";
    body.style.color = "#f1f5f9";

    let csMeta = document.querySelector('meta[name="color-scheme"]');
    const csPrev = csMeta?.getAttribute("content") ?? null;
    let csCreated = false;
    if (!csMeta) {
      csMeta = document.createElement("meta");
      csMeta.setAttribute("name", "color-scheme");
      document.head.appendChild(csMeta);
      csCreated = true;
    }
    csMeta.setAttribute("content", "dark");

    let themeMeta = document.querySelector('meta[name="theme-color"]');
    const themePrev = themeMeta?.getAttribute("content") ?? null;
    let themeCreated = false;
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.setAttribute("name", "theme-color");
      document.head.appendChild(themeMeta);
      themeCreated = true;
    }
    themeMeta.setAttribute("content", "#020617");

    return () => {
      html.style.colorScheme = prevHtmlColorScheme;
      body.style.backgroundColor = prevBodyBg;
      body.style.color = prevBodyColor;
      body.classList.remove(...addedBodyClasses);

      if (csMeta) {
        if (csCreated) csMeta.remove();
        else if (csPrev != null) csMeta.setAttribute("content", csPrev);
        else csMeta.removeAttribute("content");
      }

      if (themeMeta) {
        if (themeCreated) themeMeta.remove();
        else if (themePrev != null) themeMeta.setAttribute("content", themePrev);
        else themeMeta.removeAttribute("content");
      }
    };
  }, []);

  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [weatherData, analyticsData] = await Promise.all([
        fetchWeatherSummary({ city: cityQuery }),
        fetchWeatherAnalytics({ city: cityQuery }),
      ]);
      setWx(weatherData);
      setAnalytics(analyticsData);
    } catch (e) {
      setErr(e.message || "Failed to load weather");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [cityQuery]);

  const temps = useMemo(
    () => (wx?.daily || []).map((d) => d.temp_max ?? 0),
    [wx]
  );
  const rains = useMemo(
    () => (wx?.daily || []).map((d) => d.pop ?? 0),
    [wx]
  );
  const labels = useMemo(() => (wx?.daily || []).map((d) => d.date), [wx]);

  const dailyOutfitAdvisories = useMemo(
    () =>
      (wx?.daily || [])
        .slice(0, 5)
        .map((day, index) => ({
          ...day,
          outfitAdvisory: getDailyOutfitAdvisory(day, index),
        })),
    [wx]
  );

  const handleLocationChange = (loc) => {
    setCityQuery(loc.query);
    setLocationLabel(loc.display);
  };

  const handleDashboardClick = () => {
    scrollToSection(heroRef);
    setMobileNavOpen(false);
  };
  const handleForecastClick = () => {
    scrollToSection(forecastRef);
    setMobileNavOpen(false);
  };
  const handleAnalyticsClick = () => {
    scrollToSection(analyticsRef);
    setMobileNavOpen(false);
  };
  const handleChartClick = () => {
    scrollToSection(chartRef);
    setMobileNavOpen(false);
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden [color-scheme:dark] [forced-color-adjust:none]"
      style={{ colorScheme: "dark" }}
    >
      <aside className="hidden md:flex w-64 lg:w-72 flex-col border-r border-slate-800 bg-slate-950/95 px-6 py-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-500/90 shadow-lg shadow-violet-500/40">
            <span className="text-xl">⚡</span>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">SkySense</p>
            <p className="text-xs text-slate-500">Weather Suite</p>
          </div>
        </div>

        <nav className="space-y-1 text-sm">
          <NavItem active onClick={handleDashboardClick}>
            Dashboard
          </NavItem>
          <NavItem onClick={handleForecastClick}>Forecast</NavItem>
          <NavItem onClick={handleAnalyticsClick}>
            Linear Regression Analytics
          </NavItem>
          <NavItem onClick={handleChartClick}>
            Temperature trend &amp; rain probability
          </NavItem>
        </nav>

        <div className="mt-auto pt-8 text-xs text-slate-500">
          <p className="font-medium text-slate-400">Today</p>
          {wx ? (
            <>
              <p>{fmt.dateNice(wx.current?.dt)}</p>
              <p className="mt-2 text-slate-400">{wx.city ?? "—"}</p>
            </>
          ) : (
            <p>Loading…</p>
          )}
          <p className="mt-6 text-slate-600">v1.0</p>
        </div>
      </aside>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            className="absolute left-0 top-0 h-full w-64 bg-slate-950 border-r border-slate-800 px-5 py-6 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-violet-500/90 shadow-lg shadow-violet-500/40">
                  <span className="text-lg">⚡</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">SkySense</p>
                  <p className="text-[11px] text-slate-500">Weather Suite</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="text-slate-400 hover:text-slate-100 text-xl"
              >
                ×
              </button>
            </div>

            <nav className="space-y-1 text-sm">
              <NavItem active onClick={handleDashboardClick}>
                Dashboard
              </NavItem>
              <NavItem onClick={handleForecastClick}>Forecast</NavItem>
              <NavItem onClick={handleAnalyticsClick}>
                Linear Regression Analytics
              </NavItem>
              <NavItem onClick={handleChartClick}>
                Temperature trend &amp; rain probability
              </NavItem>
            </nav>

            <div className="mt-auto pt-6 text-[11px] text-slate-500">
              <p className="font-medium text-slate-400">Today</p>
              {wx ? (
                <>
                  <p>{fmt.dateNice(wx.current?.dt)}</p>
                  <p className="mt-1 text-slate-400">{wx.city ?? "—"}</p>
                </>
              ) : (
                <p>Loading…</p>
              )}
              <p className="mt-4 text-slate-600">v1.0</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/95 px-4 py-3 md:px-8 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-100"
              onClick={() => setMobileNavOpen(true)}
            >
              <span className="sr-only">Open navigation</span>
              <span className="flex flex-col gap-[3px]">
                <span className="block h-[2px] w-4 bg-slate-100 rounded" />
                <span className="block h-[2px] w-4 bg-slate-100 rounded" />
                <span className="block h-[2px] w-4 bg-slate-100 rounded" />
              </span>
            </button>
            <div>
              <h1 className="text-lg md:text-2xl font-semibold">
                Weather &amp; Forecast Dashboard
              </h1>
              <p className="text-[11px] md:text-xs text-slate-400 mt-1">
                Live conditions, next-day outlook, and predictive analytics.
              </p>
            </div>
          </div>

          <LocationSelector
            locations={PH_LOCATIONS}
            selectedLabel={locationLabel}
            onChange={handleLocationChange}
          />
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-8">
          {err && (
            <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-900/20 px-4 py-3 text-sm text-red-200">
              {err}
            </div>
          )}

          {loading ? (
            <Skeleton />
          ) : wx ? (
            <div className="space-y-6">
              <div
                ref={heroRef}
                className="grid gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)]"
              >
                <section className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 ring-1 ring-white/5 p-5 md:p-7 shadow-xl shadow-black/40">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300 ring-1 ring-white/10">
                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                        <span>{wx.city ?? "—"}</span>
                      </div>

                      <div className="mt-4 text-2xl md:text-3xl font-bold">
                        {fmt.dateNice(wx.current?.dt)}
                      </div>

                      <div className="mt-4 md:mt-6 flex items-end gap-4">
                        <div>
                          <div className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-none">
                            {fmt.temp(wx.current?.temp_c)}
                          </div>
                          <div className="mt-2 text-slate-300 text-xs md:text-sm">
                            High: {fmt.temp(wx.daily?.[0]?.temp_max)} • Low:{" "}
                            {fmt.temp(wx.daily?.[0]?.temp_min)}
                          </div>
                        </div>
                        <div className="hidden sm:block text-5xl md:text-6xl lg:text-7xl select-none">
                          {iconFor(wx.daily?.[0]?.pop, wx.daily?.[0]?.rain_mm)}
                        </div>
                      </div>

                      <div className="mt-4 text-base md:text-lg">
                        {(wx.current?.description || "").replace(/\b\w/g, (c) =>
                          c.toUpperCase()
                        )}
                      </div>
                      <div className="text-xs md:text-sm text-slate-400 mt-1">
                        Feels like {fmt.temp(wx.current?.feels_like)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:w-64">
                      <MiniMetric
                        label="Sunrise"
                        value={fmt.dt(wx.current?.sunrise)}
                        icon="🌅"
                      />
                      <MiniMetric
                        label="Sunset"
                        value={fmt.dt(wx.current?.sunset)}
                        icon="🌇"
                      />
                      <MiniMetric
                        label="Wind"
                        value={
                          wx.current?.wind_speed != null
                            ? `${wx.current.wind_speed} m/s`
                            : "—"
                        }
                        icon="💨"
                      />
                      <MiniMetric
                        label="Humidity"
                        value={
                          wx.current?.humidity != null
                            ? `${wx.current.humidity}%`
                            : "—"
                        }
                        icon="💧"
                      />
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                  <Highlight title="Chance of Rain">
                    <div className="text-2xl md:text-3xl font-extrabold">
                      {fmt.pct(wx.daily?.[0]?.pop)}{" "}
                      <span className="text-xs md:text-sm text-slate-400 align-middle">
                        ({fmt.mm(wx.daily?.[0]?.rain_mm)})
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] md:text-xs text-slate-400">
                      Based on today&apos;s forecast.
                    </p>
                  </Highlight>

                  <Highlight title="UV Index">
                    <div className="text-2xl md:text-3xl font-extrabold">
                      {wx.current?.uvi ?? "—"}
                    </div>
                    <p className="mt-1 text-[11px] md:text-xs text-slate-400">
                      Higher value means stronger sun intensity.
                    </p>
                  </Highlight>

                  <Highlight title="Wind Status">
                    <div className="text-2xl md:text-3xl font-extrabold">
                      {wx.current?.wind_speed != null
                        ? `${wx.current.wind_speed} m/s`
                        : "—"}
                    </div>
                    <p className="mt-1 text-[11px] md:text-xs text-slate-400">
                      Measured at ground level.
                    </p>
                  </Highlight>

                  <Highlight title="Humidity">
                    <div className="text-2xl md:text-3xl font-extrabold">
                      {wx.current?.humidity != null
                        ? `${wx.current.humidity}%`
                        : "—"}
                    </div>
                    <p className="mt-1 text-[11px] md:text-xs text-slate-400">
                      Relative moisture in the air.
                    </p>
                  </Highlight>
                </section>
              </div>

              <div
                ref={forecastRef}
                className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]"
              >
                <section className="rounded-3xl bg-slate-900/80 ring-1 ring-white/5 p-4 md:p-5 shadow-lg shadow-black/40">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-300">Next 5 days</div>
                      <div className="text-xs text-slate-500">
                        Daily high, low, and rain chance
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {(wx.daily || []).slice(0, 5).map((d) => (
                      <div
                        key={d.date}
                        className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-center shadow-sm shadow-black/40"
                      >
                        <div className="text-xs text-slate-400">
                          {fmt.day(d.date)}
                        </div>
                        <div className="mt-2 text-3xl leading-none">
                          {iconFor(d.pop, d.rain_mm)}
                        </div>
                        <div className="mt-2 font-semibold">{fmt.temp(d.temp_max)}</div>
                        <div className="text-[11px] text-slate-400">
                          min {fmt.temp(d.temp_min)}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-300">
                          {fmt.pct(d.pop)} • {fmt.mm(d.rain_mm)}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl bg-slate-900/80 ring-1 ring-white/5 p-4 md:p-5 flex flex-col justify-between shadow-lg shadow-black/40">
                  <div>
                    <div className="text-sm text-slate-300">Location details</div>
                    <p className="mt-1 text-xs text-slate-500">
                      Coordinates &amp; meta information
                    </p>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Latitude</span>
                      <span className="font-medium">{wx.lat?.toFixed(3) ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Longitude</span>
                      <span className="font-medium">{wx.lon?.toFixed(3) ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Timezone</span>
                      <span className="font-medium">{wx.timezone ?? "—"}</span>
                    </div>
                  </div>
                </section>
              </div>

              <section className="rounded-3xl bg-gradient-to-br from-amber-900/20 to-orange-900/30 ring-1 ring-white/5 p-4 md:p-5 shadow-lg shadow-black/40">
                <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="text-sm text-slate-300">👕 Daily Outfit Advisory</div>
                    <div className="text-xs text-slate-500">
                      What to wear in these days - Plan your outfits
                    </div>
                  </div>
                  <div className="self-start sm:self-auto text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300">
                    Smart Recommendations
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {dailyOutfitAdvisories.map((day, index) => (
                    <div
                      key={index}
                      className={`rounded-2xl border border-white/10 p-4 shadow-sm shadow-black/40 ${
                        day.outfitAdvisory.color === "red"
                          ? "bg-red-900/20"
                          : day.outfitAdvisory.color === "orange"
                          ? "bg-orange-900/20"
                          : day.outfitAdvisory.color === "blue"
                          ? "bg-blue-900/20"
                          : day.outfitAdvisory.color === "indigo"
                          ? "bg-indigo-900/20"
                          : "bg-emerald-900/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-sm font-medium">{day.outfitAdvisory.dayName}</div>
                          <div className="text-xs text-slate-400">
                            {fmt.temp(day.temp_max)} / {fmt.temp(day.temp_min)}
                          </div>
                        </div>
                        <div className="text-2xl">{iconFor(day.pop, day.rain_mm)}</div>
                      </div>

                      <div className="mb-3">
                        <div
                          className={`text-xs px-2 py-1 rounded-full inline-block ${
                            day.outfitAdvisory.color === "red"
                              ? "bg-red-500/20 text-red-300"
                              : day.outfitAdvisory.color === "orange"
                              ? "bg-orange-500/20 text-orange-300"
                              : day.outfitAdvisory.color === "blue"
                              ? "bg-blue-500/20 text-blue-300"
                              : day.outfitAdvisory.color === "indigo"
                              ? "bg-indigo-500/20 text-indigo-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {day.outfitAdvisory.advisoryLevel.toUpperCase()}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs text-slate-400">Recommended items:</div>
                        <div className="space-y-1">
                          {day.outfitAdvisory.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <span className="text-base">{item.icon}</span>
                              <span className="text-slate-200">{item.item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {day.pop >= 50 && (
                        <div className="mt-3 text-xs text-blue-300 flex items-center gap-1">
                          <span>☔</span>
                          <span>Bring umbrella ({fmt.pct(day.pop)})</span>
                        </div>
                      )}
                      {day.temp_max >= 30 && (
                        <div className="mt-2 text-xs text-red-300 flex items-center gap-1">
                          <span>🧴</span>
                          <span>Apply sunscreen</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-white/10">
                  <div className="text-xs text-slate-400 mb-2">💡 Pro tips:</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span>🔥 Hot days:</span>
                      <span className="text-slate-300">Light clothes, sunscreen</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>🌧️ Rainy:</span>
                      <span className="text-slate-300">Umbrella, waterproof</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>❄️ Cool:</span>
                      <span className="text-slate-300">Layer up, jacket</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>☀️ Sunny:</span>
                      <span className="text-slate-300">Hat, sunglasses</span>
                    </div>
                  </div>
                </div>
              </section>

              {analytics && (
                <section
                  ref={analyticsRef}
                  className="rounded-3xl bg-gradient-to-br from-purple-900/30 to-indigo-900/30 ring-1 ring-white/5 p-4 md:p-5 shadow-lg shadow-black/40"
                >
                  <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="text-sm text-slate-300">📈 Linear Regression Analytics</div>
                      <div className="text-xs text-slate-500">
                        Predictive analysis using machine learning
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                        Confidence: {analytics.analytics_confidence?.temperature || 0}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-slate-900/50 p-4 ring-1 ring-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs text-slate-400">Temperature Trend</div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${
                            analytics.predictions?.temperature?.trend === "increasing"
                              ? "bg-red-500/20 text-red-300"
                              : analytics.predictions?.temperature?.trend === "decreasing"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-slate-500/20 text-slate-300"
                          }`}
                        >
                          {analytics.predictions?.temperature?.trend?.toUpperCase()}
                        </div>
                      </div>
                      <div className="text-2xl font-bold">
                        {analytics.predictions?.temperature?.slope > 0 ? "+" : ""}
                        {analytics.predictions?.temperature?.slope || 0}°C/day
                      </div>
                      <div className="text-xs text-slate-400 mt-2">Next 7 days:</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(analytics.predictions?.temperature?.next_7_days || []).map(
                          (temp, idx) => (
                            <div key={idx} className="text-sm">
                              {Math.round(temp)}°
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-900/50 p-4 ring-1 ring-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs text-slate-400">Rainfall Analysis</div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${
                            analytics.predictions?.rainfall?.trend === "increasing"
                              ? "bg-blue-500/20 text-blue-300"
                              : analytics.predictions?.rainfall?.trend === "decreasing"
                              ? "bg-blue-400/20 text-blue-300"
                              : "bg-slate-500/20 text-slate-300"
                          }`}
                        >
                          {analytics.predictions?.rainfall?.trend?.toUpperCase()}
                        </div>
                      </div>
                      <div className="text-2xl font-bold">
                        Avg: {Math.round(analytics.historical_summary?.avg_rain_prob || 0)}%
                      </div>
                      <div className="text-xs text-slate-400 mt-2">
                        High risk days: {analytics.predictions?.rainfall?.high_risk_days?.length || 0}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(analytics.predictions?.rainfall?.next_7_days || []).map(
                          (rain, idx) => (
                            <div
                              key={idx}
                              className={`text-xs px-2 py-1 rounded ${
                                rain > 70
                                  ? "bg-blue-500/30 text-blue-200"
                                  : rain > 40
                                  ? "bg-blue-500/20 text-blue-300"
                                  : "bg-slate-700/30 text-slate-400"
                              }`}
                            >
                              {Math.round(rain)}%
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-xs text-slate-400 mb-2">AI Insights:</div>
                    <div className="space-y-1">
                      {(analytics.insights || []).map((insight, idx) => (
                        <div
                          key={idx}
                          className="text-sm text-slate-300 flex items-start gap-2"
                        >
                          <span className="mt-1">•</span>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-slate-500">
                    Model: {analytics.regression_metrics?.model} • Analyzed{" "}
                    {analytics.historical_summary?.days_analyzed || 0} days • σ=
                    {analytics.historical_summary?.temperature_std || 0}°C
                  </div>
                </section>
              )}

              <section
                ref={chartRef}
                className="rounded-3xl bg-slate-900/80 ring-1 ring-white/5 p-4 md:p-5 shadow-lg shadow-black/40"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-300">
                      Temperature trend &amp; rain probability
                    </div>
                    <div className="text-xs text-slate-500">
                      Next {labels.length} days overview
                    </div>
                  </div>
                </div>
                <TempRainChart temps={temps} rains={rains} labels={labels} />
              </section>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function LocationSelector({ locations, selectedLabel, onChange }) {
  const [open, setOpen] = useState(false);
  const [regionId, setRegionId] = useState("visayas");
  const [provinceId, setProvinceId] = useState("negros-occidental");
  const [search, setSearch] = useState("");

  const region = locations.find((r) => r.id === regionId) || locations[0];
  const provinces = region?.provinces || [];
  const province = provinces.find((p) => p.id === provinceId) || provinces[0] || null;
  const cities = province?.cities || [];

  const filteredCities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.label.toLowerCase().includes(q));
  }, [cities, search]);

  const handleRegionClick = (id) => {
    setRegionId(id);
    const r = locations.find((x) => x.id === id);
    const firstProv = r?.provinces?.[0];
    if (firstProv) setProvinceId(firstProv.id);
    setSearch("");
  };

  const handleProvinceChange = (e) => {
    setProvinceId(e.target.value);
    setSearch("");
  };

  const handleCitySelect = (cityObj) => {
    const display = `${cityObj.label} • ${province?.label} • ${region?.label}`;
    onChange({ query: cityObj.query, display });
    setOpen(false);
  };

  return (
    <div className="relative text-xs md:text-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="min-w-[220px] sm:min-w-[260px] md:min-w-[320px] flex items-center justify-between rounded-2xl bg-slate-900/80 px-3 py-2 text-left text-slate-100 ring-1 ring-violet-500/60 focus:ring-2 focus:ring-violet-400 outline-none"
        style={{ colorScheme: "dark" }}
      >
        <span className="truncate">{selectedLabel}</span>
        <span className="ml-2 text-violet-400">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[320px] sm:w-[380px] md:w-[420px] rounded-2xl bg-slate-900/95 ring-1 ring-white/10 shadow-xl shadow-black/40 z-30 [color-scheme:dark] [forced-color-adjust:none]">
          <div className="p-3 border-b border-slate-800">
            <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-2">
              Select location (Philippines)
            </p>

            <div className="flex gap-2 mb-3">
              {locations.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRegionClick(r.id)}
                  className={`flex-1 rounded-xl px-2 py-1 text-xs ${
                    regionId === r.id
                      ? "bg-violet-600 text-white"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <select
              value={province?.id || ""}
              onChange={handleProvinceChange}
              className="w-full rounded-xl bg-slate-950/90 px-3 py-2 text-xs text-slate-100 ring-1 ring-slate-700 focus:ring-violet-500 outline-none"
              style={{ colorScheme: "dark" }}
            >
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search city / municipality…"
              className="w-full rounded-xl bg-slate-950/90 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 ring-1 ring-slate-700 focus:ring-violet-500 outline-none mb-2"
              style={{ colorScheme: "dark" }}
            />
            <div className="max-h-56 overflow-y-auto text-xs">
              {filteredCities.length === 0 ? (
                <div className="px-2 py-2 text-slate-500">No results in this province</div>
              ) : (
                filteredCities.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => handleCitySelect(c)}
                    className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-800 text-slate-100"
                  >
                    {c.label}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-2xl text-sm transition ${
        active
          ? "bg-slate-800 text-slate-50 font-medium ring-1 ring-violet-500/60"
          : "text-slate-300 hover:bg-slate-900/70"
      }`}
    >
      {children}
    </button>
  );
}

function MiniMetric({ label, value, icon }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 px-3 py-3 ring-1 ring-white/5 flex items-center gap-3">
      <div className="text-lg">{icon}</div>
      <div className="flex-1">
        <div className="text-[11px] uppercase tracking-wide text-slate-400">
          {label}
        </div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

function Highlight({ title, children }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-950 ring-1 ring-white/5 p-4">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)]">
        <div className="h-52 rounded-3xl bg-slate-800/40 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-3xl bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      </div>
      <div className="h-40 rounded-3xl bg-slate-800/40 animate-pulse" />
      <div className="h-56 rounded-3xl bg-slate-800/40 animate-pulse" />
    </div>
  );
}

function TempRainChart({ temps = [], rains = [], labels = [] }) {
  const w = 1100;
  const h = 260;
  const pad = 36;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  if (!temps.length) return <div className="h-56 rounded-2xl bg-slate-800/40" />;

  const tMin = Math.min(...temps);
  const tMax = Math.max(...temps);
  const tRange = Math.max(1, tMax - tMin);

  const x = (i) => pad + (i / Math.max(1, temps.length - 1)) * innerW;
  const yTemp = (v) => pad + innerH - ((v - tMin) / tRange) * innerH;
  const yRain = (p) => pad + innerH - (p / 100) * innerH;

  const line = temps
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${yTemp(v)}`)
    .join(" ");

  const ticksY = 4;
  const gridLines = Array.from({ length: ticksY + 1 }).map((_, i) => {
    const yy = pad + (i / ticksY) * innerH;
    return (
      <line
        key={i}
        x1={pad}
        x2={pad + innerW}
        y1={yy}
        y2={yy}
        className="stroke-slate-700/40"
      />
    );
  });

  return (
    <div className="overflow-x-auto rounded-2xl bg-slate-950/60 p-2 [color-scheme:dark] [forced-color-adjust:none]">
      <svg width={w} height={h} className="block">
        {gridLines}

        {rains.map((p, i) => {
          const bw = (innerW / rains.length) * 0.5;
          const cx = x(i) - bw / 2;
          const y = yRain(p);
          const bh = pad + innerH - y;
          return (
            <rect
              key={i}
              x={cx}
              y={y}
              width={bw}
              height={bh}
              className="fill-sky-500/70"
              rx="4"
            />
          );
        })}

        <path d={line} className="stroke-red-400 fill-none" strokeWidth="2.5" />

        {temps.map((v, i) => (
          <circle key={i} cx={x(i)} cy={yTemp(v)} r="3" className="fill-red-400" />
        ))}

        {labels.map((d, i) => (
          <text
            key={i}
            x={x(i)}
            y={h - 6}
            textAnchor="middle"
            className="fill-slate-400 text-[10px]"
          >
            {new Date(d).toLocaleDateString(undefined, { month: "2-digit", day: "2-digit" })}
          </text>
        ))}

        {Array.from({ length: ticksY + 1 }).map((_, i) => {
          const val = Math.round(tMax - (i / ticksY) * (tMax - tMin));
          const yy = pad + (i / ticksY) * innerH + 3;
          return (
            <text key={i} x={8} y={yy} className="fill-slate-400 text-[10px]">
              {val}°C
            </text>
          );
        })}

        <text x={w - 24} y={pad - 8} className="fill-slate-400 text-[10px]">
          % rain
        </text>
      </svg>
    </div>
  );
}
