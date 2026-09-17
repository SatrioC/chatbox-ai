# Game Assistant AI (Groq API)

Chatbox AI yang fokus sebagai **asisten seputar game**: strategi, walkthrough, rekomendasi build,
rekomendasi game, tips optimasi, dsb. Dibuat dengan Flask + Groq API (model `openai/gpt-oss-120b`),
respons streaming, dan riwayat percakapan per sesi.

Asisten ini akan menolak pertanyaan di luar topik game dan mengarahkan kembali ke topik game.

## Struktur
```
chatbox-ai/
├── app.py               # Backend Flask + integrasi Groq
├── requirements.txt     # Dependency Python
├── templates/
│   └── index.html       # Tampilan chat
└── static/
    └── style.css         # Styling
```

## Cara Menjalankan

1. Buat virtual environment (opsional tapi disarankan)
   ```bash
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   ```

2. Install dependency
   ```bash
   pip install -r requirements.txt
   ```

3. Set API key Groq kamu sebagai environment variable
   ```bash
   export GROQ_API_KEY="your_api_key_here"   # Windows: set GROQ_API_KEY=your_api_key_here
   ```
   Dapatkan API key di https://console.groq.com/keys

4. Jalankan aplikasi
   ```bash
   python app.py
   ```

5. Buka browser ke `http://127.0.0.1:5000`

## Catatan
- Respons AI di-stream secara real-time (token demi token) ke halaman chat.
- Model yang digunakan: `openai/gpt-oss-120b`. Bisa diganti di `app.py` variabel `MODEL`.
- Ini contoh dasar tanpa riwayat percakapan (setiap pesan dikirim independen). Bisa dikembangkan lebih lanjut sesuai kebutuhan.
"# chatbox-ai" 
