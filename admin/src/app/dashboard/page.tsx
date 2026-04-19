"use client";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface DashboardStats {
  todayReviews: number;
  pendingReviews: number;
  totalUsers: number;
  responseRate: number;
}

interface PendingReview {
  id: string;
  title: string;
  user: { fullName: string };
  company: { name: string };
  createdAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/admin/dashboard/stats").catch(() => ({ data: { data: null } })),
      api.get("/api/admin/reviews?status=pending&limit=5").catch(() => ({ data: { data: [] } })),
      api.get("/api/admin/activity-logs?limit=5").catch(() => ({ data: { data: [] } })),
    ]).then(([statsRes, reviewsRes, logsRes]) => {
      setStats(statsRes.data.data);
      setPendingReviews(reviewsRes.data.data || []);
      setActivities(logsRes.data.data || []);
      setLoading(false);
    });
  }, []);

  const handleApprove = async (id: string) => {
    await api.patch(`/api/admin/reviews/${id}/approve`);
    setPendingReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const handleReject = async (id: string) => {
    await api.patch(`/api/admin/reviews/${id}/reject`);
    setPendingReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const formatNumber = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const statCards = stats
    ? [
        { label: "Bugün Yorum", value: stats.todayReviews.toString(), color: "bg-blue-50 text-blue-700" },
        { label: "Bekleyen", value: stats.pendingReviews.toString(), color: "bg-yellow-50 text-yellow-700" },
        { label: "Toplam Üye", value: formatNumber(stats.totalUsers), color: "bg-green-50 text-green-700" },
        { label: "Yanıt Oranı", value: `%${stats.responseRate}`, color: "bg-purple-50 text-purple-700" },
      ]
    : [];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card-bg p-5 animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="mt-2 h-8 w-16 bg-gray-200 rounded" />
              </div>
            ))
          : statCards.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card-bg p-5">
                <p className="text-sm text-muted">{stat.label}</p>
                <p className={`mt-1 text-2xl font-bold ${stat.color} inline-block rounded-lg px-2 py-0.5`}>
                  {stat.value}
                </p>
              </div>
            ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card-bg p-5">
          <h2 className="text-lg font-semibold">Son Bekleyen Yorumlar</h2>
          <div className="mt-4 space-y-3">
            {pendingReviews.length === 0 && !loading && (
              <p className="text-sm text-muted">Bekleyen yorum bulunmuyor</p>
            )}
            {pendingReviews.map((review) => (
              <div key={review.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">
                    {review.user?.fullName} → {review.company?.name}
                  </p>
                  <p className="text-xs text-muted">{review.title}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(review.id)}
                    className="rounded bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                  >
                    Onayla
                  </button>
                  <button
                    onClick={() => handleReject(review.id)}
                    className="rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card-bg p-5">
          <h2 className="text-lg font-semibold">Son Aktiviteler</h2>
          <div className="mt-4 space-y-3">
            {activities.length === 0 && !loading && (
              <p className="text-sm text-muted">Henüz aktivite bulunmuyor</p>
            )}
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm">
                  {activity.entityType} - {activity.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
