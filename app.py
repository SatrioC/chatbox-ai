import os
from flask import Flask, request, Response, render_template, stream_with_context, session
from groq import Groq

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "ganti-dengan-secret-key-acak")

# Ambil API key dari environment variable GROQ_API_KEY
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

MODEL = "openai/gpt-oss-120b"

# System prompt: membatasi asisten hanya fokus pada topik game
SYSTEM_PROMPT = """Kamu adalah "Game Assistant", asisten AI yang HANYA membahas topik seputar video game.
Kamu boleh membantu hal-hal seperti:
- Strategi dan tips menang bermain game
- Walkthrough / panduan menyelesaikan misi atau level tertentu
- Rekomendasi build karakter, senjata, atau equipment
- Rekomendasi game berdasarkan preferensi pengguna (genre, platform, mood)
- Penjelasan mekanik game, lore, atau cerita dalam game
- Tips optimasi setting PC/console untuk performa game lebih baik
- Berita atau info umum seputar dunia game (rilis, update, event)

Jika pengguna bertanya di luar topik game (misalnya soal resep masakan, kesehatan, matematika umum, dsb),
tolak dengan sopan dan singkat, lalu arahkan kembali dengan mengingatkan bahwa kamu adalah asisten khusus game.
Contoh penolakan: "Maaf, aku cuma bisa bantu seputar game nih. Ada game yang lagi kamu mainkan atau butuh rekomendasi?"

Jawab dengan gaya santai, antusias seperti sesama gamer, dan gunakan Bahasa Indonesia kecuali diminta lain."""

# Batas jumlah pesan yang disimpan di riwayat (agar tidak terlalu panjang)
MAX_HISTORY = 20


@app.route("/")
def index():
    session.clear()  # mulai percakapan baru tiap kali halaman dibuka
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True)
    user_message = data.get("message", "")

    # Ambil riwayat dari session, atau mulai baru
    history = session.get("history", [])
    history.append({"role": "user", "content": user_message})
    history = history[-MAX_HISTORY:]

    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history

    def generate():
        full_reply = ""
        completion = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=1,
            max_completion_tokens=2048,
            top_p=1,
            reasoning_effort="medium",
            stream=True,
            stop=None,
        )
        for chunk in completion:
            content = chunk.choices[0].delta.content or ""
            if content:
                full_reply += content
                yield content

        # Simpan balasan AI ke riwayat setelah selesai streaming
        history.append({"role": "assistant", "content": full_reply})
        session["history"] = history[-MAX_HISTORY:]

    return Response(stream_with_context(generate()), mimetype="text/plain")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
