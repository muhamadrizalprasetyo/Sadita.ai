"use client";

import { useEffect, useState } from "react";
import { academicApi, attendanceApi, deviceApi, type CourseClass } from "@/lib/api";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Monitor, 
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

interface DashboardStats {
  total_students: number;
  total_lecturers: number;
  total_classes: number;
  total_courses: number;
  open_sessions: number;
  devices_offline: number;
  pending_approvals: number;
  today_attendance: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const result = await academicApi.getDashboard();
      if (result.data) {
        setStats(result.data);
      } else {
        setError(result.error || "Gagal memuat data");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Memuat data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        Belum ada data tersedia
      </div>
    );
  }

  const cards = [
    { label: "Mahasiswa", value: stats.total_students, icon: Users, color: "blue" },
    { label: "Dosen", value: stats.total_lecturers, icon: Users, color: "green" },
    { label: "Kelas", value: stats.total_classes, icon: BookOpen, color: "purple" },
    { label: "Mata Kuliah", value: stats.total_courses, icon: BookOpen, color: "indigo" },
    { label: "Sesi Aktif", value: stats.open_sessions, icon: Calendar, color: "orange" },
    { label: "Device Offline", value: stats.devices_offline, icon: Monitor, color: "red" },
    { label: "Approval Pending", value: stats.pending_approvals, icon: ClipboardList, color: "yellow" },
    { label: "Presensi Hari Ini", value: stats.today_attendance, icon: CheckCircle, color: "green" },
  ];

  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    indigo: "bg-indigo-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Admin</h1>
        <p className="text-slate-600 mt-">Ringkasan operasional sistem SADITA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-">{card.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full ${colorClasses[card.color as keyof typeof colorClasses]} bg-opacity-10`}>
                  <Icon className={`w-6 h-6 text-${card.color}-500`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Aksi Cepat</h2>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-600" />
              <span className="text-slate-700">Buka Sesi Presensi Baru</span>
            </button>
            <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-slate-600" />
              <span className="text-slate-700">Review Approval Presensi</span>
            </button>
            <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-3">
              <Monitor className="w-5 h-5 text-slate-600" />
              <span className="text-slate-700">Cek Status Perangkat</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Status Sistem</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Backend API</span>
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Database</span>
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">MQTT Broker</span>
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                Connected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
