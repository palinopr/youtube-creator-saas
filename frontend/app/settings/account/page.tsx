"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import SettingsNav from "@/components/settings/SettingsNav";
import { api, UserProfile, UserSettings } from "@/lib/api";
import {
  Shield,
  Save,
  RefreshCw,
  Moon,
  Sun,
  Globe,
  Bell,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "America/Sao_Paulo", label: "Brasilia Time" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Shanghai", label: "Shanghai" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Australia/Sydney", label: "Sydney" },
];

export default function AccountSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileData, settingsData] = await Promise.all([
        api.getProfile(),
        api.getSettings(),
      ]);
      setProfile(profileData);
      setSettings(settingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await api.updateSettings(settings);
      setSuccess("Settings saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (theme: "dark" | "light") => {
    if (settings) {
      setSettings({ ...settings, theme_preference: theme });
    }
  };

  const handleTimezoneChange = (timezone: string) => {
    if (settings) {
      setSettings({ ...settings, timezone });
    }
  };

  const handleNotificationChange = (key: keyof UserSettings["notification_preferences"], value: boolean) => {
    if (settings) {
      setSettings({
        ...settings,
        notification_preferences: {
          ...settings.notification_preferences,
          [key]: value,
        },
      });
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      setError(null);
      const result = await api.requestDataExport();
      setSuccess(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request data export");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile || deleteConfirmEmail.toLowerCase() !== profile.email.toLowerCase()) {
      setError("Email does not match. Please type your email correctly.");
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      const result = await api.requestAccountDeletion(deleteConfirmEmail, deleteReason || undefined);
      setSuccess(result.message);
      setShowDeleteModal(false);
      setDeleteConfirmEmail("");
      setDeleteReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request account deletion");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Shield className="w-7 h-7" />
              Account Settings
            </h1>
            <p className="text-gray-400 mt-1">
              Manage your preferences and account
            </p>
          </div>

          <SettingsNav />

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-3 text-emerald-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {success}
              <button onClick={() => setSuccess(null)} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-400">Loading settings...</span>
            </div>
          ) : settings ? (
            <div className="space-y-6">
              {/* Appearance */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Moon className="w-5 h-5 text-purple-400" />
                  Appearance
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Theme
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleThemeChange("dark")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          settings.theme_preference === "dark"
                            ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        <Moon className="w-4 h-4" />
                        Dark
                      </button>
                      <button
                        onClick={() => handleThemeChange("light")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          settings.theme_preference === "light"
                            ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                        Light
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timezone */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  Region
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleTimezoneChange(e.target.value)}
                    className="w-full max-w-md px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value} className="bg-gray-900">
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-yellow-400" />
                  Email Notifications
                </h2>

                <div className="space-y-4">
                  {[
                    { key: "email_marketing" as const, label: "Marketing emails", description: "News about new features and tips" },
                    { key: "email_product_updates" as const, label: "Product updates", description: "Important updates about the platform" },
                    { key: "email_weekly_digest" as const, label: "Weekly digest", description: "Summary of your channel performance" },
                    { key: "email_billing_alerts" as const, label: "Billing alerts", description: "Notifications about payments and invoices" },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-start gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={settings.notification_preferences[item.key]}
                        onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/50"
                      />
                      <div>
                        <div className="text-white">{item.label}</div>
                        <div className="text-sm text-gray-400">{item.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>

              {/* Data & Privacy */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-400" />
                  Data & Privacy
                </h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-medium mb-1">Export Your Data</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      Download a copy of all your data. You can request an export once every 24 hours.
                    </p>
                    <button
                      onClick={handleExportData}
                      disabled={exporting}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      {exporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Requesting...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Request Data Export
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </h2>

                <div>
                  <h3 className="text-white font-medium mb-1">Delete Account</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Permanently delete your account and all associated data. This action cannot be undone.
                    Your account will be deleted after a 30-day grace period.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && profile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Delete Account</h2>
            </div>

            <p className="text-gray-400 mb-4">
              This will permanently delete your account after a 30-day grace period.
              All your data, including analytics history and saved clips, will be removed.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Type your email to confirm: <span className="text-red-400">{profile.email}</span>
                </label>
                <input
                  type="email"
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Reason for leaving (optional)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Help us improve..."
                  rows={2}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmEmail("");
                  setDeleteReason("");
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmEmail.toLowerCase() !== profile.email.toLowerCase()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
