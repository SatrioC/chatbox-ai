# Game Assistant AI (Gemini API)

Chatbox AI yang fokus sebagai **asisten khusus seputar video game**: strategi, walkthrough, rekomendasi build, rekomendasi game, lore cerita, tips optimasi FPS, dan meta game terkini. 

Dibuat menggunakan **Flask** + **Google GenAI SDK** (Gemini), respons streaming real-time, riwayat percakapan dinamis (multi-turn), dan proteksi ketat (prompt guardrails) agar AI hanya melayani topik game.

## Fitur
- **100% Fokus Game**: AI otomatis menolak topik di luar game dengan gaya gamer santai.
- **Multi-turn Memory**: Mengingat riwayat percakapan dalam sesi chat.
- **Streaming Response**: Jawaban muncul secara real-time token demi token.
- **Konfigurasi Aman**: Menggunakan file `.env` yang diabaikan oleh git (`.gitignore`).

## Struktur
```
chatbox-ai/
├── app.py               # Backend Flask + integrasi Google GenAI
├── requirements.txt     # Dependency Python
├── .env                 # API Key Gemini & konfigurasi
├── .gitignore           # Menjaga file sensitif dari git
├── templates/
│   └── index.html       # Tampilan antarmuka chat
└── static/
    └── style.css        # Tema & gaya tampilan game
```

## Cara Menjalankan

1. Install dependency:
   ```bash
   pip install -r requirements.txt
   ```

2. Konfigurasi file `.env`:
   Pastikan file `.env` sudah terisi API key kamu:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.5-flash-lite
   FLASK_SECRET_KEY=secret-key-acak
   ```

3. Jalankan aplikasi:
   ```bash
   python app.py
   ```

4. Buka browser ke:
   `http://127.0.0.1:5000`

"# chatbox-ai" 
