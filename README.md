# Game Assistant AI (Gemini API)

Chatbox AI yang fokus sebagai **asisten khusus seputar video game**: strategi, walkthrough, rekomendasi build, rekomendasi game, lore cerita, tips optimasi FPS, dan meta game terkini.

Dibuat menggunakan **Flask** + **Google GenAI SDK** (Gemini) dengan respons streaming real-time, riwayat percakapan multi-turn, proteksi ketat (prompt guardrails) agar AI hanya melayani topik game, dan **pencarian web otomatis (Tavily) lewat function calling** supaya informasi terbaru seperti patch, event, dan meta tidak bergantung pada pengetahuan lama model.

## Fitur
- **100% Fokus Game**: AI otomatis menolak topik di luar game dengan gaya gamer santai.
- **Search-Augmented Generation (tool use)**: Gemini diberi tool `search_web` (Tavily) dan memutuskan sendiri kapan memakainya, sesuai aturan di `SYSTEM_PROMPT`. Pencarian hanya untuk pertanyaan game yang butuh info terbaru; topik di luar game ditolak tanpa mencari sehingga kredit API tidak terbuang.
- **Pengaman jika search gagal**: bila pencarian tidak tersedia, AI diminta mengakui bahwa datanya mungkin kedaluwarsa, bukan menjawab seolah pasti.
- **Multi-turn Memory**: mengingat 20 pesan terakhir dalam sesi chat.
- **Streaming Response**: jawaban muncul secara real-time token demi token.
- **Pilihan Model**: dropdown model Gemini, dengan fallback otomatis ke model default jika model yang dipilih sedang overload (503).
- **Lampiran Gambar/File**: kirim screenshot game untuk dianalisis.
- **Riwayat Sesi**: daftar sesi chat tersimpan di `localStorage` browser.
- **Konfigurasi Aman**: menggunakan file `.env` yang diabaikan oleh git (`.gitignore`).

## Cara Kerja
```
Pesan user
   ↓
Gemini menerima riwayat (20 pesan terakhir) + SYSTEM_PROMPT + tool search_web
   ↓
Gemini menilai pesan:
   ├─ di luar topik game          → tolak sesuai guardrail
   ├─ game, tidak butuh info baru → jawab dari pengetahuan model
   └─ game, butuh info terbaru    → panggil search_web(query)
                                        ↓
                              Tavily: 5 hasil teratas (judul, cuplikan, link)
                                        ↓
                              hasil dikembalikan ke Gemini sebagai konteks
   ↓
Gemini menyusun jawaban akhir (streaming)
   ↓
Jawaban tampil di browser dan disimpan ke riwayat sesi
```

## Algoritma (Search-Augmented Generation)
```
Input  : pesan user, riwayat chat
Output : jawaban

1. Simpan pesan user ke riwayat, ambil 20 pesan terakhir (sliding window)
2. Kirim riwayat + SYSTEM_PROMPT + tool search_web ke Gemini
3. Gemini menilai pesan:
   a. Jika di luar topik game       -> tolak dengan guardrail, selesai
   b. Jika butuh info terbaru       -> panggil search_web(query)
   c. Jika tidak butuh info terbaru -> jawab dari pengetahuan model
4. search_web(query):
   kirim query ke Tavily -> ambil 5 hasil teratas (judul, cuplikan, URL)
   jika gagal atau kosong -> kembalikan "pencarian tidak tersedia"
5. Hasil pencarian dikembalikan ke Gemini sebagai konteks tambahan
6. Gemini menyusun jawaban akhir dari konteks tersebut (streaming)
7. Simpan jawaban ke riwayat dan tampilkan ke user
```

## Struktur
```
chatbox-ai/
├── app.py               # Backend Flask + integrasi Google GenAI + tool search_web (Tavily)
├── requirements.txt     # Dependency Python
├── .env                 # API Key Gemini, API Key Tavily & konfigurasi
├── .gitignore           # Menjaga file sensitif dari git
├── templates/
│   └── index.html       # Tampilan antarmuka chat
└── static/
    ├── script.js        # Logika frontend (sesi, streaming, lampiran)
    └── style.css        # Tema & gaya tampilan game
```

## Cara Menjalankan

1. Install dependency:
   ```bash
   pip install -r requirements.txt
   ```

2. Dapatkan API key:
   - **Gemini**: dari Google AI Studio.
   - **Tavily** (untuk pencarian web): daftar di [tavily.com](https://tavily.com), lalu ambil API key. Tersedia paket gratis dengan jatah bulanan, cek jatah terbarunya di situs Tavily.

3. Buat dan konfigurasi file `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.5-flash-lite
   TAVILY_API_KEY=your_tavily_api_key_here
   FLASK_SECRET_KEY=secret-key-acak
   ```
   Jika `TAVILY_API_KEY` tidak diisi, aplikasi tetap berjalan tetapi tanpa pencarian web.

4. Jalankan aplikasi:
   ```bash
   python app.py
   ```

5. Buka browser ke:
   `http://127.0.0.1:5000`

## Catatan
- Keputusan memakai pencarian ada di tangan model (function calling), jadi perilakunya tidak sepenuhnya pasti: kadang search dilewati atau dipanggil di luar dugaan. Aturannya bisa disetel di `SYSTEM_PROMPT` (aturan nomor 4).
- Pencarian web memakai kredit API Tavily. Kredit yang habis tidak merusak aplikasi, jawaban hanya kembali tanpa data pencarian.
- Pembatasan topik game dilakukan lewat system prompt, bukan validasi di sisi server.
- Riwayat chat tersimpan di browser (`localStorage`), bukan di database server.
- Jangan commit file `.env`. Pastikan `.gitignore` mengabaikannya.