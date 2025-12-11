"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import SettingsNav from "@/components/settings/SettingsNav";
import { api, UserProfile, YouTubeChannel } from "@/lib/api";
import {
  User,
  Save,
  RefreshCw,
  Youtube,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProfile();
      setProfile(data);
      setName(data.name || "");
      setBio(data.bio || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await api.updateProfile({ name, bio });
      setSuccess("Profile updated successfully!");

      // Refresh profile to get latest data
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <User className="w-7 h-7" />
              Profile
            </h1>
            <p className="text-gray-400 mt-1">
              Manage your personal information
            </p>
          </div>

          <SettingsNav />

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-3 text-emerald-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-400">Loading profile...</span>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Avatar & Basic Info */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.name || "Profile"}
                        className="w-24 h-24 rounded-full border-2 border-purple-500/50"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-purple-500/20 border-2 border-purple-500/50 flex items-center justify-center text-3xl font-bold text-purple-400">
                        {profile.name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      From Google
                    </p>
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1 space-y-4">
                    {/* Email (read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email is managed by Google OAuth
                      </p>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your display name"
                        maxLength={200}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Bio
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        maxLength={500}
                        rows={3}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {bio.length}/500 characters
                      </p>
                    </div>

                    {/* Save Button */}
                    <div className="pt-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        {saving ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Dates */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Account Information
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">Member since:</span>
                    <span className="text-white">{formatDate(profile.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">Last login:</span>
                    <span className="text-white">{formatDate(profile.last_login_at)}</span>
                  </div>
                </div>
              </div>

              {/* Connected Channels */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-500" />
                    Connected YouTube Channels
                  </h2>
                  <span className="text-sm text-gray-400">
                    {profile.channels_count} channel{profile.channels_count !== 1 ? "s" : ""}
                  </span>
                </div>

                {profile.channels.length > 0 ? (
                  <div className="space-y-3">
                    {profile.channels.map((channel: YouTubeChannel) => (
                      <div
                        key={channel.id}
                        className="flex items-center gap-4 p-3 bg-white/5 rounded-lg"
                      >
                        {channel.thumbnail_url ? (
                          <img
                            src={channel.thumbnail_url}
                            alt={channel.title}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                            <Youtube className="w-6 h-6 text-red-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{channel.title}</h3>
                          <p className="text-sm text-gray-400">
                            {channel.subscriber_count?.toLocaleString() || 0} subscribers
                            {" · "}
                            {channel.video_count?.toLocaleString() || 0} videos
                          </p>
                        </div>
                        {channel.is_active && (
                          <span className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">
                    No YouTube channels connected yet. Connect a channel to start analyzing your content.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
