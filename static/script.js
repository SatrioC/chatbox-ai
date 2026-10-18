const chatViewport = document.getElementById("chat-viewport");
const messagesContainer = document.getElementById("messages-container");
const welcomeBanner = document.getElementById("welcome-banner");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const modelSelect = document.getElementById("model-select");
const regenerateBar = document.getElementById("regenerate-bar");
const regenerateBtn = document.getElementById("regenerate-btn");
const historyList = document.getElementById("history-list");
const leftHistoryList = document.getElementById("left-history-list");
const historyCounter = document.getElementById("history-counter");
const clearHistoryBtn = document.getElementById("clear-history-btn");
const newChatBtn = document.getElementById("new-chat-btn");
const sidebarRight = document.getElementById("sidebar-right");
const chatFilter = document.getElementById("chat-filter");

// File attachment elements
const fileInput = document.getElementById("file-input");
const attachBtn = document.getElementById("attach-btn");
const filePreviewBar = document.getElementById("file-preview-bar");
const filePreviewName = document.getElementById("file-preview-name");
const fileRemoveBtn = document.getElementById("file-remove-btn");

let currentSessionId = null;
let currentAttachedFile = null;

// Format waktu relatif persis seperti screenshot (8d, 10d, 2h, now)
function formatTimeAgo(timestamp) {
  if (!timestamp) return "now";
  const diff = Math.max(0, Date.now() - timestamp);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// Mengambil sesi percakapan dari localStorage
function getSessions() {
  const raw = localStorage.getItem("gamemerge_sessions");
  if (!raw) {
    // Sesi awal dengan banyak chat per percakapan (seperti screenshot)
    const initialDemo = [
      {
        id: "session_gta",
        title: "Modifying GTA Spark Effects",
        updatedAt: Date.now() - 1000 * 60 * 15,
        messages: [
          {
            id: "msg_gta_1",
            role: "user",
            content: "Gimana cara modifikasi spark effects di GTA San Andreas / V biar lebih realistis?",
            timestamp: Date.now() - 1000 * 60 * 15
          },
          {
            id: "msg_gta_2",
            role: "bot",
            content: "Untuk modifikasi **spark effects** (efek percikan api gesekan mobil) di GTA:\n\n1. **GTA San Andreas**: Gunakan modifikasi partikel seperti *Overdose Effects* atau edit file `particle.txd` menggunakan TXD Workshop.\n2. **GTA V**: Kamu bisa pakai mod seperti *VisualV* atau *NaturalVision Evolved* yang mengubah parameter partikel `fxdecal.ytd`.\n\nPastikan selalu backup file original sebelum replace file ya!",
            timestamp: Date.now() - 1000 * 60 * 14
          },
          {
            id: "msg_gta_3",
            role: "user",
            content: "Ada efek tabrakan mobil dan gesekan aspal yang partikel apinya lebih banyak?",
            timestamp: Date.now() - 1000 * 60 * 8
          },
          {
            id: "msg_gta_4",
            role: "bot",
            content: "Ada bro! Kamu bisa pakai **Extreme Particles Mod**.\n\nUbah nilai `collision_sparks` di file config efek untuk melipatgandakan density percikan apinya saat bodi mobil bergesekan dengan aspal pada kecepatan tinggi.",
            timestamp: Date.now() - 1000 * 60 * 7
          }
        ]
      },
      {
        id: "session_video_dl",
        title: "Yt-Dlp Video Download Gu...",
        updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
        messages: [
          {
            id: "msg_yt_1",
            role: "user",
            content: "Command yt-dlp untuk download gameplay 60fps kualitas tertinggi apa?",
            timestamp: Date.now() - 1000 * 60 * 60 * 24 * 10
          },
          {
            id: "msg_yt_2",
            role: "bot",
            content: "Gunakan perintah berikut di terminal:\n```bash\nyt-dlp -f \"bestvideo[fps=60]+bestaudio/best\" --merge-output-format mp4 \"URL_VIDEO\"\n```\nOtomatis menggabungkan video 60 FPS dan audio terbaik ke format MP4.",
            timestamp: Date.now() - 1000 * 60 * 60 * 24 * 10
          }
        ]
      },
      {
        id: "session_digital",
        title: "Evaluasi Strategi Digitalisasi...",
        updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
        messages: [
          {
            id: "msg_dig_1",
            role: "user",
            content: "Bagaimana strategi digitalisasi ekosistem turnamen esports di Indonesia?",
            timestamp: Date.now() - 1000 * 60 * 60 * 24 * 8
          },
          {
            id: "msg_dig_2",
            role: "bot",
            content: "Strategi digitalisasi turnamen esports mencakup:\n1. **Automated Matchmaking & Bracket Management**: Platform pendaftaran dan bracket live otomatis.\n2. **Anti-Cheat Integration**: Verifikasi identitas pemain dan deteksi software ilegal.\n3. **Live Streaming Analytics**: Integrasi overlay real-time statistik pemain saat turnamen berlangsung.",
            timestamp: Date.now() - 1000 * 60 * 60 * 24 * 8
          }
        ]
      }
    ];
    localStorage.setItem("gamemerge_sessions", JSON.stringify(initialDemo));
    return initialDemo;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveSessions(sessions) {
  if (sessions.length > 50) sessions = sessions.slice(0, 50);
  localStorage.setItem("gamemerge_sessions", JSON.stringify(sessions));
  renderLeftSessions();
  renderRightQuestions();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

// 1. RENDER SIDEBAR KIRI: Conversations List (Persis seperti tampilan screenshot)
function renderLeftSessions() {
  const sessions = getSessions();
  if (!leftHistoryList) return;

  leftHistoryList.innerHTML = "";
  if (sessions.length === 0) {
    leftHistoryList.innerHTML = `<div class="left-history-empty">Belum ada percakapan</div>`;
    return;
  }

  sessions.forEach(session => {
    const isActive = session.id === currentSessionId;
    const item = document.createElement("div");
    item.className = "left-history-item" + (isActive ? " active" : "");

    const timeLabel = formatTimeAgo(session.updatedAt);

    item.innerHTML = `
      <span class="item-title" title="${escapeHtml(session.title)}">${escapeHtml(session.title)}</span>
      ${isActive ? '<span class="active-dot" title="Sedang Aktif"></span>' : `<span class="time-badge">${timeLabel}</span>`}
      <button class="session-del-btn" title="Hapus Percakapan">&times;</button>
    `;

    // Klik item sesi: Buka sesi tersebut beserta seluruh chatnya yang banyak
    item.addEventListener("click", (e) => {
      if (e.target.classList.contains("session-del-btn")) return;
      loadSession(session.id);
    });

    // Tombol hapus sesi (x)
    const delBtn = item.querySelector(".session-del-btn");
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteSession(session.id);
    });

    leftHistoryList.appendChild(item);
  });
}

// 2. RENDER SIDEBAR KANAN: Daftar Pertanyaan khusus di DALAM 1 Obrolan yang sedang aktif
function renderRightQuestions() {
  if (!historyList) return;

  const sessions = getSessions();
  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Jika belum ada sesi aktif atau belum ada pesan
  if (!currentSession || !currentSession.messages || currentSession.messages.length === 0) {
    if (historyCounter) historyCounter.textContent = "0 pertanyaan";
    historyList.innerHTML = `<div class="history-empty">Belum ada pertanyaan di obrolan ini.<br><span style="font-size:11px; color:#64748b; margin-top:6px; display:inline-block;">Ketik pertanyaan di bawah untuk mulai!</span></div>`;
    return;
  }

  // Ambil hanya pesan dari user (pertanyaan) di sesi ini
  const questions = [];
  currentSession.messages.forEach((msg, idx) => {
    if (msg.role === "user") {
      // Cari jawaban bot yang berkaitan
      let nextBotMsg = null;
      for (let j = idx + 1; j < currentSession.messages.length; j++) {
        if (currentSession.messages[j].role === "bot") {
          nextBotMsg = currentSession.messages[j];
          break;
        }
      }
      const rawText = msg.content || (msg.fileInfo ? `📎 ${msg.fileInfo.name}` : "Pertanyaan tanpa teks");
      const snippet = nextBotMsg 
        ? (nextBotMsg.content.replace(/[#*`_\[\]()]/g, "").slice(0, 65) + "...")
        : "Menunggu respon...";

      questions.push({
        id: msg.id || (`msg_${currentSession.id}_${idx}`),
        text: rawText,
        snippet: snippet
      });
    }
  });

  if (historyCounter) {
    historyCounter.textContent = `${questions.length} pertanyaan`;
  }

  historyList.innerHTML = "";
  if (questions.length === 0) {
    historyList.innerHTML = `<div class="history-empty">Belum ada pertanyaan di obrolan ini.</div>`;
    return;
  }

  questions.forEach((q, qIndex) => {
    const card = document.createElement("div");
    card.className = "history-card";
    card.setAttribute("data-target-id", q.id);

    card.innerHTML = `
      <div class="history-card-header">
        <div class="history-dot"></div>
        <span class="history-card-title">#${qIndex + 1}: ${escapeHtml(q.text)}</span>
      </div>
      <div class="history-card-snippet">${escapeHtml(q.snippet)}</div>
    `;

    // FITUR UTAMA: KLIK KARTU = LANGSUNG NAIK / SCROLL KE PESAN TERSEBUT! BUKAN GENERATE ULANG!
    card.addEventListener("click", () => {
      jumpToMessage(q.id);
    });

    historyList.appendChild(card);
  });
}

// FUNGSI JUMP TO MESSAGE (Scroll naik + Animasi pulse highlight tanpa generate ulang)
function jumpToMessage(targetId) {
  const targetEl = document.getElementById(targetId);
  if (!targetEl) return;

  targetEl.scrollIntoView({ behavior: "smooth", block: "center" });

  // Efek denyut / glow highlight
  targetEl.classList.remove("highlight-pulse");
  void targetEl.offsetWidth; // Force CSS reflow agar animasi bisa ditrigger berulang kali
  targetEl.classList.add("highlight-pulse");

  setTimeout(() => {
    targetEl.classList.remove("highlight-pulse");
  }, 1600);
}

// BUKA SESI CHAT TERTENTU
function loadSession(sessionId) {
  const sessions = getSessions();
  const targetSession = sessions.find(s => s.id === sessionId);
  if (!targetSession) return;

  currentSessionId = sessionId;
  messagesContainer.innerHTML = "";
  welcomeBanner.style.display = "none";

  let idModified = false;
  targetSession.messages.forEach((msg, idx) => {
    if (!msg.id) {
      msg.id = `msg_${sessionId}_${idx}`;
      idModified = true;
    }
    addMessageUI(msg.content, msg.role, msg.fileInfo, msg.id);
  });

  if (idModified) {
    localStorage.setItem("gamemerge_sessions", JSON.stringify(sessions));
  }

  regenerateBar.style.display = targetSession.messages.length > 0 ? "flex" : "none";
  chatViewport.scrollTop = chatViewport.scrollHeight;

  // Sinkronkan status aktif di sidebar kiri dan render pertanyaan di sidebar kanan
  renderLeftSessions();
  renderRightQuestions();
}

// HAPUS 1 SESI OBROLAN
function deleteSession(sessionId) {
  let sessions = getSessions();
  sessions = sessions.filter(s => s.id !== sessionId);
  localStorage.setItem("gamemerge_sessions", JSON.stringify(sessions));

  if (currentSessionId === sessionId) {
    if (sessions.length > 0) {
      loadSession(sessions[0].id);
    } else {
      startNewChat();
    }
  } else {
    renderLeftSessions();
    renderRightQuestions();
  }
}

// MULAI OBROLAN BARU (+ New Chat)
async function startNewChat() {
  currentSessionId = null;
  messagesContainer.innerHTML = "";
  welcomeBanner.style.display = "block";
  regenerateBar.style.display = "none";
  input.value = "";
  fileRemoveBtn.click();
  input.focus();

  renderLeftSessions();
  renderRightQuestions();

  try {
    await fetch("/reset", { method: "POST" });
  } catch (e) {
    console.warn("Reset error:", e);
  }
}

// TAMBAH ELEMEN PESAN KE CONTAINER LAYAR
function addMessageUI(text, sender, fileInfo = null, msgId = null) {
  welcomeBanner.style.display = "none";
  const wrapper = document.createElement("div");
  wrapper.className = "msg-row " + sender;
  if (msgId) {
    wrapper.id = msgId;
  }

  if (sender === "user") {
    let fileHtml = "";
    if (fileInfo) {
      if (fileInfo.previewUrl) {
        fileHtml = `<div class="user-attached-img-wrap"><img src="${fileInfo.previewUrl}" class="user-attached-img" alt="Lampiran"></div>`;
      } else {
        fileHtml = `<div class="user-attached-file">📎 ${escapeHtml(fileInfo.name)}</div>`;
      }
    }
    wrapper.innerHTML = `
      <div class="msg-bubble user">
        ${fileHtml}
        ${text ? `<div class="bubble-content">${escapeHtml(text)}</div>` : ''}
      </div>
    `;
    messagesContainer.appendChild(wrapper);
    chatViewport.scrollTop = chatViewport.scrollHeight;
    return wrapper;
  } else {
    wrapper.innerHTML = `
      <div class="bot-avatar">
        <img src="/static/logo_icon.png" alt="Game Assistant Bot Logo">
      </div>
      <div class="msg-bubble bot">
        <div class="bot-header-tab">
          <span class="bot-badge">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="4"></rect>
              <path d="M6 12h4m-2-2v4m7-3h.01m3 2h.01"></path>
            </svg>
            Game Assistant Response
          </span>
          <button class="copy-card-btn" title="Salin Jawaban" onclick="copyText(this)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          </button>
        </div>
        <div class="bubble-content bot-markdown">${text ? (typeof marked !== "undefined" ? marked.parse(text) : escapeHtml(text)) : 'Sedang meracik jawaban...'}</div>
        <div class="msg-actions">
          <button class="action-btn" title="Bagus" onclick="this.classList.toggle('active')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
          </button>
          <button class="action-btn" title="Kurang pas" onclick="this.classList.toggle('active')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
            </svg>
          </button>
          <button class="action-btn" title="Salin Teks" onclick="copyText(this)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
    messagesContainer.appendChild(wrapper);
    chatViewport.scrollTop = chatViewport.scrollHeight;
    return wrapper.querySelector(".bot-markdown");
  }
}

// KIRIM PESAN BARU
async function sendMessage() {
  const text = input.value.trim();
  const fileToSend = currentAttachedFile;

  if (!text && !fileToSend) return;

  const sessions = getSessions();
  let currentSession = sessions.find(s => s.id === currentSessionId);

  // Jika belum ada sesi obrolan aktif, buat ruang obrolan baru
  if (!currentSession) {
    const sessionTitle = text 
      ? (text.length > 32 ? text.slice(0, 32) + "..." : text) 
      : (fileToSend ? fileToSend.name : "Obrolan Game");

    currentSession = {
      id: "session_" + Date.now(),
      title: sessionTitle,
      messages: [],
      updatedAt: Date.now()
    };
    sessions.unshift(currentSession);
    currentSessionId = currentSession.id;
  } else {
    // Pindahkan sesi aktif ke paling atas daftar percakapan
    const existingIdx = sessions.findIndex(s => s.id === currentSessionId);
    if (existingIdx > 0) {
      const [movedSession] = sessions.splice(existingIdx, 1);
      sessions.unshift(movedSession);
    }
  }

  // Buat pesan user dengan ID unik untuk target scroll
  const userMsgId = "msg_u_" + Date.now();
  const userMsgObj = {
    id: userMsgId,
    role: "user",
    content: text,
    fileInfo: fileToSend ? { name: fileToSend.name, previewUrl: fileToSend.previewUrl } : null,
    timestamp: Date.now()
  };
  currentSession.messages.push(userMsgObj);
  currentSession.updatedAt = Date.now();

  // Tampilkan ke UI chat tengah
  addMessageUI(text, "user", fileToSend, userMsgId);

  // Simpan & langsung update Sidebar Kiri dan Sidebar Kanan (muncul pertanyaan baru di daftar)
  saveSessions(sessions);

  // Reset input & preview file
  input.value = "";
  fileInput.value = "";
  currentAttachedFile = null;
  filePreviewBar.style.display = "none";
  input.disabled = true;
  sendBtn.disabled = true;
  regenerateBar.style.display = "none";

  const botMsgId = "msg_b_" + Date.now();
  const botContentEl = addMessageUI("", "bot", null, botMsgId);

  // Format riwayat percakapan untuk dikirim ke backend
  const backendHistory = currentSession.messages.slice(0, -1).map(m => ({
    role: m.role === "user" ? "user" : "model",
    content: m.content || ""
  }));

  try {
    const selectedModel = modelSelect.value;
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        model: selectedModel,
        file: fileToSend,
        history: backendHistory
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = "";
    let firstChunk = true;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (firstChunk) {
        botContentEl.innerHTML = "";
        firstChunk = false;
      }
      result += decoder.decode(value, { stream: true });
      botContentEl.innerHTML = typeof marked !== "undefined" ? marked.parse(result) : result;
      chatViewport.scrollTop = chatViewport.scrollHeight;
    }

    // Simpan balasan bot ke memori sesi
    currentSession.messages.push({
      id: botMsgId,
      role: "bot",
      content: result,
      timestamp: Date.now()
    });

    // Simpan sesi dan perbarui snippet jawaban di Sidebar Kanan
    saveSessions(sessions);
    regenerateBar.style.display = "flex";
  } catch (err) {
    botContentEl.innerHTML = "<em>Terjadi kesalahan koneksi: " + err.message + "</em>";
  } finally {
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

// EVENT LISTENERS LAMPIRAN FILE
attachBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const base64Data = event.target.result.split(",")[1];
    currentAttachedFile = {
      name: file.name,
      mime_type: file.type || "image/png",
      data: base64Data,
      previewUrl: file.type.startsWith("image/") ? event.target.result : null
    };
    filePreviewName.textContent = file.name;
    filePreviewBar.style.display = "flex";
  };
  reader.readAsDataURL(file);
});

fileRemoveBtn.addEventListener("click", () => {
  fileInput.value = "";
  currentAttachedFile = null;
  filePreviewBar.style.display = "none";
});

// TOMBOL NEW CHAT
newChatBtn.addEventListener("click", () => {
  startNewChat();
});

// TOMBOL REGENERATE (Pertanyaan Terakhir)
regenerateBtn.addEventListener("click", () => {
  const sessions = getSessions();
  const currentSession = sessions.find(s => s.id === currentSessionId);
  if (!currentSession || currentSession.messages.length === 0) return;

  let lastUserMsg = "";
  for (let i = currentSession.messages.length - 1; i >= 0; i--) {
    if (currentSession.messages[i].role === "user") {
      lastUserMsg = currentSession.messages[i].content;
      break;
    }
  }

  if (lastUserMsg) {
    input.value = lastUserMsg;
    sendMessage();
  }
});

// TOMBOL HAPUS OBROLAN INI (Sidebar Kanan Footer)
clearHistoryBtn.addEventListener("click", () => {
  if (!currentSessionId) {
    alert("Belum ada obrolan aktif yang bisa dihapus.");
    return;
  }
  if (confirm("Hapus obrolan ini beserta seluruh riwayat pertanyaannya?")) {
    deleteSession(currentSessionId);
  }
});

// TOGGLE BUKA / TUTUP SIDEBAR KIRI (1 Tombol di Header)
const sidebarLeft = document.querySelector(".sidebar-left");
const toggleLeftBtn = document.getElementById("toggle-left-btn");

if (toggleLeftBtn && sidebarLeft) {
  toggleLeftBtn.addEventListener("click", () => {
    sidebarLeft.classList.toggle("collapsed");
  });
}

// TOGGLE BUKA / TUTUP SIDEBAR KANAN (1 Tombol di Header)
const toggleRightHeaderBtn = document.getElementById("toggle-right-header-btn");

if (toggleRightHeaderBtn && sidebarRight) {
  toggleRightHeaderBtn.addEventListener("click", () => {
    sidebarRight.classList.toggle("collapsed");
  });
}

function quickSend(text) {
  input.value = text;
  sendMessage();
}

function copyText(btn) {
  const bubble = btn.closest(".msg-bubble");
  const content = bubble.querySelector(".bot-markdown")?.innerText || "";
  navigator.clipboard.writeText(content).then(() => {
    const original = btn.innerHTML;
    btn.innerHTML = `✓ Copied!`;
    setTimeout(() => { btn.innerHTML = original; }, 1800);
  });
}

// FILTER / CARI DALAM CHAT
chatFilter.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();

  // Filter pertanyaan di sidebar kanan
  document.querySelectorAll(".history-card").forEach(card => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(q) ? "block" : "none";
  });

  // Filter judul obrolan di sidebar kiri
  document.querySelectorAll(".left-history-item").forEach(item => {
    const text = item.innerText.toLowerCase();
    item.style.display = text.includes(q) ? "flex" : "none";
  });
});

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// INISIALISASI SAAT HALAMAN DIBUKA
const initialSessions = getSessions();
if (initialSessions.length > 0) {
  loadSession(initialSessions[0].id);
} else {
  renderLeftSessions();
  renderRightQuestions();
}
