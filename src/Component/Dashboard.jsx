// src/Component/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchWeatherSummary } from "../services/analyticsService";

/* ---------- Formatting helpers ---------- */

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
};

const iconFor = (pop, rainMm) => {
  if ((rainMm ?? 0) > 0.1) return "🌧️";
  if ((pop ?? 0) >= 60) return "🌦️";
  return "☀️";
};

/* ---------- PH Locations (region → province → cities/municipalities) ---------- */

const PH_LOCATIONS = [
  {
    id: "luzon",
    label: "Luzon",
    provinces: [
      {
        id: "ncr",
        label: "Metro Manila",
        cities: [
          {
            label: "Manila",
            query: "Manila, Metro Manila, Philippines",
          },
          {
            label: "Quezon City",
            query: "Quezon City, Metro Manila, Philippines",
          },
          {
            label: "Pasig City",
            query: "Pasig City, Metro Manila, Philippines",
          },
        ],
      },
      {
        id: "cavite",
        label: "Cavite",
        cities: [
          {
            label: "Tagaytay City",
            query: "Tagaytay City, Cavite, Philippines",
          },
          {
            label: "Imus City",
            query: "Imus City, Cavite, Philippines",
          },
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
          {
            label: "Bago City",
            query: "Bago City, Negros Occidental, Philippines",
          },
          {
            label: "Calero, Bago City",
            query: "Calero, Bago City, Negros Occidental, Philippines",
          },
          {
            label: "Murcia",
            query: "Murcia, Negros Occidental, Philippines",
          },
        ],
      },
      {
        id: "iloilo",
        label: "Iloilo",
        cities: [
          {
            label: "Iloilo City",
            query: "Iloilo City, Iloilo, Philippines",
          },
        ],
      },
      {
        id: "cebu",
        label: "Cebu",
        cities: [
          {
            label: "Cebu City",
            query: "Cebu City, Cebu, Philippines",
          },
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
        cities: [
          {
            label: "Davao City",
            query: "Davao City, Davao del Sur, Philippines",
          },
        ],
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

/* ---------- Dashboard component ---------- */

export default function Dashboard() {
  // this string is sent to Django / OWM
  const [cityQuery, setCityQuery] = useState(
    "Bacolod City, Negros Occidental, Philippines"
  );
  // this label is shown on the selector button
  const [locationLabel, setLocationLabel] = useState(
    "Bacolod City • Negros Occidental • Visayas"
  );

  const [wx, setWx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchWeatherSummary({ city: cityQuery });
      setWx(data);
    } catch (e) {
      setErr(e.message || "Failed to load weather");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
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

  const handleLocationChange = (loc) => {
    setCityQuery(loc.query);      // for backend
    setLocationLabel(loc.display); // for UI label
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      {/* SIDEBAR – full height, fixed width */}
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
          <NavItem active>Dashboard</NavItem>
          <NavItem>Forecast</NavItem>
          <NavItem>Settings</NavItem>
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

      {/* MAIN COLUMN */}
      <div className="flex-1 flex flex-col">
        {/* TOP BAR – sticks to top, full width */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 py-3 md:px-8 backdrop-blur">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">
              Weather &amp; Forecast Dashboard
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Live conditions, next-day outlook, and 5-day trend.
            </p>
          </div>

          {/* Smart PH location selector */}
          <LocationSelector
            locations={PH_LOCATIONS}
            selectedLabel={locationLabel}
            onChange={handleLocationChange}
          />
        </header>

        {/* SCROLLABLE CONTENT */}
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
              {/* TOP ROW: HERO + HIGHLIGHTS */}
              <div className="grid gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)]">
                {/* HERO CARD */}
                <section className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 ring-1 ring-white/5 p-6 md:p-7 shadow-xl shadow-black/40">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-300 ring-1 ring-white/10">
                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                        <span>{wx.city ?? "—"}</span>
                      </div>

                      <div className="mt-4 text-3xl md:text-4xl font-bold">
                        {fmt.dateNice(wx.current?.dt)}
                      </div>

                      <div className="mt-6 flex items-end gap-4">
                        <div>
                          <div className="text-5xl md:text-6xl font-extrabold leading-none">
                            {fmt.temp(wx.current?.temp_c)}
                          </div>
                          <div className="mt-2 text-slate-300">
                            High: {fmt.temp(wx.daily?.[0]?.temp_max)} • Low:{" "}
                            {fmt.temp(wx.daily?.[0]?.temp_min)}
                          </div>
                        </div>
                        <div className="hidden sm:block text-6xl md:text-7xl select-none">
                          {iconFor(wx.daily?.[0]?.pop, wx.daily?.[0]?.rain_mm)}
                        </div>
                      </div>

                      <div className="mt-4 text-lg md:text-xl">
                        {(wx.current?.description || "").replace(
                          /\b\w/g,
                          (c) => c.toUpperCase()
                        )}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        Feels like {fmt.temp(wx.current?.feels_like)}
                      </div>
                    </div>

                    {/* QUICK METRICS PILL COLUMN */}
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

                {/* HIGHLIGHTS GRID */}
                <section className="grid gap-4 sm:grid-cols-2">
                  <Highlight title="Chance of Rain">
                    <div className="text-3xl font-extrabold">
                      {fmt.pct(wx.daily?.[0]?.pop)}{" "}
                      <span className="text-sm text-slate-400 align-middle">
                        ({fmt.mm(wx.daily?.[0]?.rain_mm)})
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Based on today&apos;s forecast.
                    </p>
                  </Highlight>

                  <Highlight title="UV Index">
                    <div className="text-3xl font-extrabold">
                      {wx.current?.uvi ?? "—"}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Higher value means stronger sun intensity.
                    </p>
                  </Highlight>

                  <Highlight title="Wind Status">
                    <div className="text-3xl font-extrabold">
                      {wx.current?.wind_speed != null
                        ? `${wx.current.wind_speed} m/s`
                        : "—"}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Measured at ground level.
                    </p>
                  </Highlight>

                  <Highlight title="Humidity">
                    <div className="text-3xl font-extrabold">
                      {wx.current?.humidity != null
                        ? `${wx.current.humidity}%`
                        : "—"}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Relative moisture in the air.
                    </p>
                  </Highlight>
                </section>
              </div>

              {/* SECOND ROW: 5-DAY + COORDS CARD */}
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
                <section className="rounded-3xl bg-slate-900/80 ring-1 ring-white/5 p-5 shadow-lg shadow-black/40">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-300">
                        Next 5 days
                      </div>
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
                        <div className="mt-2 font-semibold">
                          {fmt.temp(d.temp_max)}
                        </div>
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

                <section className="rounded-3xl bg-slate-900/80 ring-1 ring-white/5 p-5 flex flex-col justify-between shadow-lg shadow-black/40">
                  <div>
                    <div className="text-sm text-slate-300">
                      Location details
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Coordinates &amp; meta information
                    </p>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Latitude</span>
                      <span className="font-medium">
                        {wx.lat?.toFixed(3) ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Longitude</span>
                      <span className="font-medium">
                        {wx.lon?.toFixed(3) ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Timezone</span>
                      <span className="font-medium">
                        {wx.timezone ?? "—"}
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              {/* CHART ROW */}
              <section className="rounded-3xl bg-slate-900/80 ring-1 ring-white/5 p-5 shadow-lg shadow-black/40">
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

/* ---------- Location Selector ---------- */

function LocationSelector({ locations, selectedLabel, onChange }) {
  const [open, setOpen] = useState(false);
  const [regionId, setRegionId] = useState("visayas");
  const [provinceId, setProvinceId] = useState("negros-occidental");
  const [search, setSearch] = useState("");

  const region = locations.find((r) => r.id === regionId) || locations[0];
  const provinces = region?.provinces || [];
  const province =
    provinces.find((p) => p.id === provinceId) || provinces[0] || null;
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
    onChange({
      query: cityObj.query,
      display,
    });
    setOpen(false);
  };

  return (
    <div className="relative text-xs md:text-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="min-w-[260px] md:min-w-[320px] flex items-center justify-between rounded-2xl bg-slate-900/80 px-3 py-2 text-left text-slate-100 ring-1 ring-violet-500/60 focus:ring-2 focus:ring-violet-400 outline-none"
      >
        <span className="truncate">{selectedLabel}</span>
        <span className="ml-2 text-violet-400">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[380px] md:w-[420px] rounded-2xl bg-slate-900/95 ring-1 ring-white/10 shadow-xl shadow-black/40 z-30">
          <div className="p-3 border-b border-slate-800">
            <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-2">
              Select location (Philippines)
            </p>

            {/* Region toggles */}
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

            {/* Province select */}
            <select
              value={province?.id || ""}
              onChange={handleProvinceChange}
              className="w-full rounded-xl bg-slate-950/90 px-3 py-2 text-xs text-slate-100 ring-1 ring-slate-700 focus:ring-violet-500 outline-none"
            >
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* City search & list */}
          <div className="p-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search city / municipality…"
              className="w-full rounded-xl bg-slate-950/90 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 ring-1 ring-slate-700 focus:ring-violet-500 outline-none mb-2"
            />
            <div className="max-h-56 overflow-y-auto text-xs">
              {filteredCities.length === 0 ? (
                <div className="px-2 py-2 text-slate-500">
                  No results in this province
                </div>
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

/* ---------- Small UI pieces ---------- */

function NavItem({ children, active }) {
  return (
    <button
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
      <div className="text-[11px] uppercase tracking-wide text-slate-400">
        {title}
      </div>
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
            <div
              key={i}
              className="h-24 rounded-3xl bg-slate-800/40 animate-pulse"
            />
          ))}
        </div>
      </div>
      <div className="h-40 rounded-3xl bg-slate-800/40 animate-pulse" />
      <div className="h-56 rounded-3xl bg-slate-800/40 animate-pulse" />
    </div>
  );
}

/** Pure SVG chart: temp line + rain bars (all real API values). */
function TempRainChart({ temps = [], rains = [], labels = [] }) {
  const w = 1100,
    h = 260,
    pad = 36;
  const innerW = w - pad * 2,
    innerH = h - pad * 2;
  if (!temps.length)
    return <div className="h-56 rounded-2xl bg-slate-800/40" />;

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
    <div className="overflow-x-auto rounded-2xl bg-slate-950/60 p-2">
      <svg width={w} height={h} className="block">
        {/* grid */}
        {gridLines}
        {/* rain bars */}
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
        {/* temperature line */}
        <path
          d={line}
          className="stroke-red-400 fill-none"
          strokeWidth="2.5"
        />
        {/* temp points */}
        {temps.map((v, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={yTemp(v)}
            r="3"
            className="fill-red-400"
          />
        ))}
        {/* x labels */}
        {labels.map((d, i) => (
          <text
            key={i}
            x={x(i)}
            y={h - 6}
            textAnchor="middle"
            className="fill-slate-400 text-[10px]"
          >
            {new Date(d).toLocaleDateString(undefined, {
              month: "2-digit",
              day: "2-digit",
            })}
          </text>
        ))}
        {/* y axis labels (°C on left) */}
        {Array.from({ length: ticksY + 1 }).map((_, i) => {
          const val = Math.round(
            tMax - (i / ticksY) * (tMax - tMin)
          );
          const yy = pad + (i / ticksY) * innerH + 3;
          return (
            <text
              key={i}
              x={8}
              y={yy}
              className="fill-slate-400 text-[10px]"
            >
              {val}°C
            </text>
          );
        })}
        <text
          x={w - 24}
          y={pad - 8}
          className="fill-slate-400 text-[10px]"
        >
          % rain
        </text>
      </svg>
    </div>
  );
}
