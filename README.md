# Game Assistant AI (Gemini API)

Chatbox AI yang fokus sebagai **asisten khusus seputar video game**: strategi, walkthrough, rekomendasi build, rekomendasi game, lore cerita, tips optimasi FPS, dan meta game terkini.

Dibuat menggunakan **Flask** + **Google GenAI SDK** (Gemini) dengan respons streaming real-time, riwayat percakapan multi-turn, proteksi ketat (prompt guardrails) agar AI hanya melayani topik game, dan **pencarian web (Tavily)** supaya informasi terbaru seperti patch, event, dan meta tidak bergantung pada pengetahuan lama model.

## Fitur
- **100% Fokus Game**: AI otomatis menolak topik di luar game dengan gaya gamer santai.
- **Search-Augmented Generation**: hasil pencarian web (judul, cuplikan, dan link) disisipkan ke prompt sebelum Gemini menjawab, sehingga jawaban soal patch, event, dan rilis lebih akurat.
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
Pencarian web via Tavily (judul + cuplikan + link)
   ↓
Hasil pencarian disisipkan ke system prompt (bersama aturan guardrail)
   ↓
Gemini menyusun jawaban dengan konteks 20 pesan terakhir (streaming)
   ↓
Jawaban tampil di browser dan disimpan ke riwayat sesi
```

Bila pencarian gagal atau kuota habis, alur tetap berjalan tanpa hasil pencarian dan AI menambahkan catatan bahwa informasinya mungkin tidak terbaru.

## Struktur
```
chatbox-ai/
├── app.py               # Backend Flask + integrasi Google GenAI + pencarian Tavily
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
   Pastikan `requirements.txt` memuat `flask`, `google-genai`, `python-dotenv`, dan `requests`.

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
- Pencarian web memakai kredit API Tavily. Kredit yang habis tidak merusak aplikasi, jawaban hanya kembali tanpa data pencarian.
- Pembatasan topik game dilakukan lewat system prompt, bukan validasi di sisi server.
- Riwayat chat tersimpan di browser (`localStorage`), bukan di database server.