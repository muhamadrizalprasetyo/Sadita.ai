"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, Sparkles, Database, Wifi, Award, BookOpen, Clock } from "lucide-react";
import { User, academicApi, deviceApi, lmsApi } from "@/lib/api";

interface Message {
  id: string;
  sender: "kobar" | "user";
  text: string;
  time: string;
  actionResults?: Record<string, unknown>;
}

export function KobarAssistant({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "kobar",
      text: `Halo ${user.full_name.split(" ")[0]}! Saya **SI KOBAR**, asisten AI operasional SADITA.ai untuk peran **${user.role}**. Ada yang bisa saya bantu hari ini?`,
      time: "Baru saja",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const msgIdCounter = useRef(1);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Suggested quick prompts per role
  const quickPrompts: Record<string, string[]> = {
    ADMIN: [
      "Ringkasan statistik kampus hari ini",
      "Status perangkat presensi ESP32",
      "Daftar kelas aktif semester ini",
    ],
    KAPRODI: [
      "Monitoring performa prodi TI",
      "Statistik kehadiran perkuliahan",
      "Daftar mata kuliah semester ganjil",
    ],
    DOSEN: [
      "Cek sesi presensi aktif",
      "Status pengumpulan tugas mahasiswa",
      "Ringkasan nilai kelas saya",
    ],
    KETUA_KELAS: [
      "Cek presensi rekan kelas yang pending",
      "Jadwal kuliah hari ini",
      "Materi pertemuan terbaru",
    ],
    MAHASISWA: [
      "Riwayat kehadiran saya",
      "Daftar tugas & kuis yang belum selesai",
      "Jadwal kuliah hari ini",
    ],
  };

  const handleSend = React.useCallback(async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    msgIdCounter.current += 1;
    const currentId = `user-${msgIdCounter.current}`;
    const userMsg: Message = {
      id: currentId,
      sender: "user",
      text: textToSend,
      time: "Baru saja",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const lower = textToSend.toLowerCase();
      let reply = "";

      // Smart role-aware execution via SADITA APIs
      if (lower.includes("statistik") || lower.includes("ringkasan") || lower.includes("dashboard")) {
        const stats = await academicApi.getDashboard();
        if (stats.data) {
          reply = `📊 **Statistik Operasional Terkini:**\n• Total Mahasiswa: ${stats.data.total_students}\n• Total Dosen: ${stats.data.total_lecturers}\n• Kelas Berjalan: ${stats.data.total_classes}\n• Sesi Presensi Aktif: ${stats.data.open_sessions}\n• Perangkat Offline: ${stats.data.devices_offline}`;
        } else {
          reply = "Mohon maaf, data statistik saat ini belum dapat diambil.";
        }
      } else if (lower.includes("perangkat") || lower.includes("esp32") || lower.includes("iot") || lower.includes("device")) {
        const devRes = await deviceApi.list();
        if (devRes.data && devRes.data.length > 0) {
          reply = `📡 **Status Perangkat IoT SADITA (${devRes.data.length} unit):**\n` +
            devRes.data.map(d => `• **${d.nama}** (${d.device_id}): Status **${d.status}**, IP: ${d.ip_address || "N/A"}`).join("\n");
        } else {
          reply = "Semua perangkat IoT SADITA terdaftar sedang dalam mode normal.";
        }
      } else if (lower.includes("kelas") || lower.includes("mata kuliah") || lower.includes("jadwal")) {
        const clsRes = await academicApi.getClasses();
        if (clsRes.data && clsRes.data.length > 0) {
          reply = `📚 **Kelas Terdaftar di Sistem:**\n` +
            clsRes.data.slice(0, 4).map(c => `• **${c.name}** (${c.course?.name || "Mata Kuliah"}) - Dosen: ${c.lecturer?.nidn || "Pengampu"}`).join("\n");
        } else {
          reply = "Belum ada kelas aktif yang terdaftar untuk semester ini.";
        }
      } else if (lower.includes("tugas") || lower.includes("kuis") || lower.includes("lms")) {
        reply = `📝 **LMS SADITA:**\nSistem materi, penugasan, dan kuis online terhubung langsung dengan kehadiran perkuliahan. Anda dapat mengunggah modul PDF, membuat kuis otomatis, dan menilai tugas mahasiswa langsung dari panel LMS.`;
      } else if (lower.includes("presensi") || lower.includes("kehadiran")) {
        reply = `⏱️ **Sistem Presensi IoT SADITA:**\nPresensi tercatat secara realtime melalui tap RFID KTM dan scan fingerprint AS608 pada mikrokontroler ESP32-S3. Ketua kelas juga dapat memverifikasi presensi mandiri sebelum diapprove oleh Dosen Pengampu.`;
      } else {
        reply = `Terima kasih! Sebagai AI Assistant SADITA untuk peran **${user.role}**, saya dapat membantu Anda memantau presensi IoT, manajemen kelas, tugas, kuis, dan data akademik. Silakan pilih prompt cepat di bawah atau ajukan pertanyaan spesifik!`;
      }

      msgIdCounter.current += 1;
      const botMsg: Message = {
        id: `bot-${msgIdCounter.current}`,
        sender: "kobar",
        text: reply,
        time: "Baru saja",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      msgIdCounter.current += 1;
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${msgIdCounter.current}`,
          sender: "kobar",
          text: "Terjadi kesalahan saat memproses permintaan melalui API SADITA.",
          time: "Baru saja",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, user]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="kobar-fab"
        title="Buka SI KOBAR AI Assistant"
      >
        {isOpen ? <X size={26} /> : <Bot size={28} />}
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="kobar-window">
          {/* Header */}
          <div className="kobar-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: "var(--primary-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                <Sparkles size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>SI KOBAR</h4>
                <p style={{ fontSize: "0.7rem", color: "var(--primary-light)" }}>Asisten Pintar SADITA.ai</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ color: "var(--text-muted)" }}>
              <X size={20} />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div style={{ padding: "0.6rem 0.8rem", background: "rgba(0,0,0,0.2)", borderBottom: "1px solid var(--border-subtle)", display: "flex", gap: "0.4rem", overflowX: "auto" }}>
            {(quickPrompts[user.role] || quickPrompts.MAHASISWA).map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp)}
                style={{
                  fontSize: "0.72rem",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "var(--radius-full)",
                  background: "rgba(56, 189, 248, 0.1)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  color: "var(--primary-light)",
                  whiteSpace: "nowrap",
                }}
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="kobar-messages">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`kobar-msg ${m.sender === "kobar" ? "kobar-msg-bot" : "kobar-msg-user"}`}
              >
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {m.text.split("\n").map((line, idx) => (
                    <span key={idx}>
                      {line.startsWith("• ") ? (
                        <span style={{ display: "block", marginLeft: "0.5rem" }}>{line}</span>
                      ) : (
                        line
                      )}
                      <br />
                    </span>
                  ))}
                </div>
                <span style={{ fontSize: "0.65rem", opacity: 0.6, marginTop: "0.3rem", display: "block", textAlign: m.sender === "kobar" ? "left" : "right" }}>
                  {m.time}
                </span>
              </div>
            ))}
            {loading && (
              <div className="kobar-msg kobar-msg-bot" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles size={14} className="animate-spin" />
                <span>SI KOBAR sedang menganalisis data SADITA...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Bar */}
          <form
            className="kobar-input-area"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              placeholder="Tanyakan ke SI KOBAR..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="form-input"
              style={{ padding: "0.5rem 0.8rem", fontSize: "0.85rem" }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn btn-primary"
              style={{ padding: "0.5rem 0.75rem" }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
