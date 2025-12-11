"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Globe,
  Smartphone,
  Monitor,
  Tv,
  RefreshCw,
  UserCircle,
  BarChart3,
  TrendingUp,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface DemographicsData {
  period: string;
  start_date: string;
  end_date: string;
  age_groups: Array<{
    age_group: string;
    views: number;
    percentage: number;
  }>;
  gender: {
    male: { views: number; percentage: number };
    female: { views: number; percentage: number };
    other?: { views: number; percentage: number };
  };
  total_views: number;
}

interface GeographyData {
  period: string;
  start_date: string;
  end_date: string;
  countries: Array<{
    country: string;
    country_code: string;
    views: number;
    watch_time_hours: number;
    percentage: number;
  }>;
  total_views: number;
}

interface DevicesData {
  period: string;
  start_date: string;
  end_date: string;
  devices: Array<{
    device_type: string;
    views: number;
    watch_time_hours: number;
    percentage: number;
  }>;
  total_views: number;
}

const AGE_COLORS = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#f5f3ff"];
const GENDER_COLORS = { male: "#3b82f6", female: "#ec4899", other: "#8b5cf6" };
const DEVICE_COLORS = {
  MOBILE: "#22c55e",
  DESKTOP: "#3b82f6",
  TV: "#f97316",
  TABLET: "#8b5cf6",
  GAME_CONSOLE: "#ec4899",
  OTHER: "#6b7280",
};
const DEVICE_ICONS: Record<string, any> = {
  MOBILE: Smartphone,
  DESKTOP: Monitor,
  TV: Tv,
  TABLET: Smartphone,
};

// Country flag emoji helper
const getCountryFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export default function AudiencePage() {
  const [demographics, setDemographics] = useState<DemographicsData | null>(null);
  const [geography, setGeography] = useState<GeographyData | null>(null);
  const [devices, setDevices] = useState<DevicesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"demographics" | "geography" | "devices">("demographics");
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAllData();
  }, [days]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [demoRes, geoRes, devRes] = await Promise.all([
        api.getAudienceDemographics(days),
        api.getAudienceGeography(days, 20),
        api.getAudienceDevices(days),
      ]);

      setDemographics(demoRes);
      setGeography(geoRes);
      setDevices(devRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch audience data");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatHours = (hours: number) => {
    if (hours >= 1000) return `${(hours / 1000).toFixed(1)}K hrs`;
    return `${hours.toFixed(0)} hrs`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading audience intelligence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/" className="text-purple-400 hover:underline">
            Go back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const ageChartData = demographics?.age_groups?.map((ag) => ({
    name: ag.age_group.replace("age", "").replace("_", "-"),
    views: ag.views,
    percentage: ag.percentage,
  })) || [];

  const genderChartData = demographics?.gender
    ? [
        { name: "Male", value: demographics.gender.male.percentage, views: demographics.gender.male.views },
        { name: "Female", value: demographics.gender.female.percentage, views: demographics.gender.female.views },
        ...(demographics.gender.other?.views ? [{ name: "Other", value: demographics.gender.other.percentage, views: demographics.gender.other.views }] : []),
      ]
    : [];

  const deviceChartData = devices?.devices?.map((d) => ({
    name: d.device_type.charAt(0) + d.device_type.slice(1).toLowerCase(),
    value: d.percentage,
    views: d.views,
    watchTime: d.watch_time_hours,
  })) || [];

  return (
    <DashboardLayout activePath="/audience">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-7 h-7 text-purple-400" />
              Audience Intelligence
            </h1>
            <p className="text-gray-400 mt-1">
              Understand who watches your content
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Time Period Selector */}
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
            <button
              onClick={fetchAllData}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border border-purple-500/30 rounded-xl p-4">
            <p className="text-sm text-gray-400">Total Views</p>
            <p className="text-2xl font-bold text-purple-300">
              {formatNumber(demographics?.total_views || 0)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-sm text-gray-400">Top Age Group</p>
            <p className="text-2xl font-bold text-blue-300">
              {demographics?.age_groups?.[0]?.age_group.replace("age", "").replace("_", "-") || "N/A"}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/10 border border-green-500/30 rounded-xl p-4">
            <p className="text-sm text-gray-400">Top Country</p>
            <p className="text-2xl font-bold text-green-300 flex items-center gap-2">
              {geography?.countries?.[0] && (
                <>
                  <span>{getCountryFlag(geography.countries[0].country_code)}</span>
                  <span>{geography.countries[0].country}</span>
                </>
              )}
              {!geography?.countries?.[0] && "N/A"}
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/10 border border-orange-500/30 rounded-xl p-4">
            <p className="text-sm text-gray-400">Top Device</p>
            <p className="text-2xl font-bold text-orange-300">
              {devices?.devices?.[0]?.device_type
                ? devices.devices[0].device_type.charAt(0) + devices.devices[0].device_type.slice(1).toLowerCase()
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
          {[
            { id: "demographics", label: "Demographics", icon: UserCircle },
            { id: "geography", label: "Geography", icon: Globe },
            { id: "devices", label: "Devices", icon: Smartphone },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Demographics Tab */}
        {activeTab === "demographics" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Age Distribution */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Age Distribution
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageChartData} layout="vertical">
                      <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="name" width={60} />
                      <Tooltip
                        formatter={(value: any, name: string) => [
                          name === "percentage" ? `${value}%` : formatNumber(value),
                          name === "percentage" ? "Share" : "Views",
                        ]}
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="percentage" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {ageChartData.slice(0, 3).map((age, i) => (
                    <div key={age.name} className="flex justify-between text-sm">
                      <span className={i === 0 ? "text-purple-400 font-medium" : "text-gray-400"}>
                        {age.name}
                      </span>
                      <span className={i === 0 ? "text-purple-400 font-medium" : "text-gray-300"}>
                        {age.percentage}% ({formatNumber(age.views)} views)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gender Distribution */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-400" />
                  Gender Distribution
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {genderChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.name === "Male"
                                ? GENDER_COLORS.male
                                : entry.name === "Female"
                                ? GENDER_COLORS.female
                                : GENDER_COLORS.other
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`${value}%`, "Share"]}
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-center gap-6">
                  {genderChartData.map((gender) => (
                    <div key={gender.name} className="text-center">
                      <div
                        className="w-3 h-3 rounded-full mx-auto mb-1"
                        style={{
                          backgroundColor:
                            gender.name === "Male"
                              ? GENDER_COLORS.male
                              : gender.name === "Female"
                              ? GENDER_COLORS.female
                              : GENDER_COLORS.other,
                        }}
                      />
                      <p className="text-sm font-medium">{gender.name}</p>
                      <p className="text-xs text-gray-400">{gender.value}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/10 border border-purple-500/30 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                Audience Insights
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {demographics?.age_groups?.[0] && (
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h3 className="font-medium text-purple-300">Primary Audience</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Your largest viewer group is {demographics.age_groups[0].age_group.replace("age", "").replace("_", "-")} year olds,
                      making up {demographics.age_groups[0].percentage}% of your audience.
                    </p>
                  </div>
                )}
                {demographics?.gender && (
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h3 className="font-medium text-pink-300">Gender Split</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Your audience is {demographics.gender.male.percentage > demographics.gender.female.percentage ? "predominantly male" : "predominantly female"} (
                      {Math.max(demographics.gender.male.percentage, demographics.gender.female.percentage)}%).
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Geography Tab */}
        {activeTab === "geography" && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-400" />
                Views by Country
              </h2>
              <div className="space-y-3">
                {geography?.countries?.map((country, index) => {
                  const barWidth = (country.percentage / (geography.countries?.[0]?.percentage || 1)) * 100;
                  return (
                    <div key={country.country_code} className="flex items-center gap-4">
                      <span className="text-gray-500 w-6 text-sm">{index + 1}</span>
                      <span className="text-xl w-8">{getCountryFlag(country.country_code)}</span>
                      <span className="w-24 font-medium truncate">{country.country}</span>
                      <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${barWidth}%` }}
                        >
                          <span className="text-xs font-medium">{country.percentage}%</span>
                        </div>
                      </div>
                      <span className="text-gray-400 text-sm w-24 text-right">
                        {formatNumber(country.views)}
                      </span>
                      <span className="text-gray-500 text-sm w-20 text-right">
                        {formatHours(country.watch_time_hours)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Geographic Insights */}
            <div className="grid md:grid-cols-3 gap-4">
              {geography?.countries?.slice(0, 3).map((country, index) => (
                <div
                  key={country.country_code}
                  className={`p-4 rounded-xl border ${
                    index === 0
                      ? "bg-gradient-to-br from-green-600/20 to-green-800/10 border-green-500/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{getCountryFlag(country.country_code)}</span>
                    <div>
                      <h3 className={`font-semibold ${index === 0 ? "text-green-300" : ""}`}>
                        #{index + 1} {country.country}
                      </h3>
                      <p className="text-sm text-gray-400">{country.percentage}% of views</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Views</p>
                      <p className="font-medium">{formatNumber(country.views)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Watch Time</p>
                      <p className="font-medium">{formatHours(country.watch_time_hours)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Devices Tab */}
        {activeTab === "devices" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Device Chart */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                  Device Distribution
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {deviceChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              DEVICE_COLORS[entry.name.toUpperCase() as keyof typeof DEVICE_COLORS] ||
                              DEVICE_COLORS.OTHER
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: string, props: any) => [
                          `${value}% (${formatNumber(props.payload.views)} views)`,
                          "Share",
                        ]}
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Device Stats */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  Watch Time by Device
                </h2>
                <div className="space-y-4">
                  {devices?.devices?.map((device) => {
                    const Icon = DEVICE_ICONS[device.device_type] || Monitor;
                    const color =
                      DEVICE_COLORS[device.device_type as keyof typeof DEVICE_COLORS] ||
                      DEVICE_COLORS.OTHER;
                    return (
                      <div key={device.device_type} className="p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5" style={{ color }} />
                            <span className="font-medium">
                              {device.device_type.charAt(0) + device.device_type.slice(1).toLowerCase()}
                            </span>
                          </div>
                          <span className="text-lg font-bold" style={{ color }}>
                            {device.percentage}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Views</p>
                            <p className="font-medium">{formatNumber(device.views)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Watch Time</p>
                            <p className="font-medium">{formatHours(device.watch_time_hours)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Device Insights */}
            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/10 border border-blue-500/30 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                Device Insights
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {devices?.devices?.[0] && (
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h3 className="font-medium text-blue-300">Primary Device</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {devices.devices[0].percentage}% of your audience watches on{" "}
                      {devices.devices[0].device_type.toLowerCase()}.
                      {devices.devices[0].device_type === "MOBILE" && " Consider mobile-first thumbnails and shorter videos."}
                      {devices.devices[0].device_type === "TV" && " Your content works great on big screens!"}
                      {devices.devices[0].device_type === "DESKTOP" && " Your audience prefers watching on desktop."}
                    </p>
                  </div>
                )}
                {devices?.devices?.find((d) => d.device_type === "TV") && (
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h3 className="font-medium text-orange-300">TV Viewers</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {devices.devices.find((d) => d.device_type === "TV")?.percentage}% watch on TV.
                      TV viewers typically have longer watch sessions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
