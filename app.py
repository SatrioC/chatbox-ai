import os 
import re  
import requests
from dotenv import load_dotenv
from flask import Flask, request, Response, render_template, stream_with_context, session
from google import genai
from google.genai import types

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "game-assistant-secret-key-2026")

# Inisialisasi Gemini Client menggunakan API Key dari .env
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Model yang didukung untuk dipilih user
AVAILABLE_MODELS = {
    "gemini-3.5-flash-lite": "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest": "gemini-flash-lite-latest",
    "gemini-3.8-flash": "gemini-3.8-flash",
}
DEFAULT_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")

# System prompt: Membatasi asisten HANYA fokus pada topik video game (Guardrail)
SYSTEM_PROMPT = """Kamu adalah "Game Assistant", asisten AI yang 100% HANYA fokus pada topik video game (PC, konsol, mobile, retro, indie, e-sports).

Keahlian kamu mencakup:
- Strategi, tips & trik, walkthrough menyelesaikan misi / level / boss
- Rekomendasi build karakter, senjata, skill, item, dan komposisi tim
- Rekomendasi game berdasarkan preferensi (genre, platform, spesifikasi PC, mood)
- Penjelasan lore, jalan cerita, trivia, dan karakter dalam game
- Info mekanik gameplay, tier list hero/senjata, dan update meta game
- Saran optimasi setting grafis PC/konsol untuk performa optimal (FPS booster)
- Berita rilis game, event gaming, dan sejarah industri video game

ATURAN KETAT (GUARDRAIL):
1. Jika pengguna bertanya di luar topik game (misalnya resep masakan, kesehatan, rumus matematika, politik, curhat umum, coding non-game, dsb):
   TOLAK dengan ramah, santai, dan singkat, lalu ingatkan bahwa kamu adalah asisten khusus game.
   Contoh: "Waduh, aku cuma spesialis game nih bro/sis! Ada pertanyaan soal game yang lagi kamu mainkan atau butuh rekomendasi game seru?"
2. Gunakan gaya bicara santai, antusias layaknya sesama gamer, ramah, dan memakai Bahasa Indonesia (kecuali jika user bertanya dalam bahasa lain).
3. Selalu berikan jawaban yang jelas, to-the-point, dan membantu pemain memenangkan atau menikmati permainannya."""

# Batas riwayat percakapan yang disimpan di session
MAX_HISTORY = 20


import base64


def build_contents(history, attached_file=None):
    """Mengubah format history session ke format types.Content Gemini."""
    contents = []
    for i, item in enumerate(history):
        role = "user" if item["role"] == "user" else "model"
        parts = []
        # Tambahkan file lampiran jika ada pada pesan user terakhir
        if i == len(history) - 1 and role == "user" and attached_file and attached_file.get("data"):
            try:
                raw_bytes = base64.b64decode(attached_file["data"])
                mime = attached_file.get("mime_type", "image/png")
                parts.append(types.Part.from_bytes(data=raw_bytes, mime_type=mime))
            except Exception as e:
                print("Error decoding file attachment:", e)

        text_content = item.get("content") or ""
        if not text_content and parts:
            text_content = "Tolong analisis atau jelaskan gambar/file ini terkait game."

        if text_content:
            parts.append(types.Part.from_text(text=text_content))

        if parts:
            contents.append(types.Content(role=role, parts=parts))
    return contents


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/reset", methods=["POST"])
def reset():
    session.clear()
    return {"status": "ok"}

UPDATE_KEYWORDS = [
    "terbaru", "terkini", "terupdate", "update", "patch", "season", "musim",
    "meta", "tier list", "nerf", "buff", "rilis", "release", "jadwal",
    "event", "banner", "gacha", "rerun", "leak", "bocoran", "trailer",
    "berita", "news", "sekarang", "saat ini", "hari ini", "minggu ini",
    "bulan ini", "tahun ini", "harga", "diskon", "promo", "turnamen",
]
UPDATE_PATTERN = re.compile(
    r"\b(" + "|".join(re.escape(k) for k in UPDATE_KEYWORDS) + r")(nya|kah|lah)?\b",
    re.IGNORECASE,
)


def needs_search(message, previous_user_msgs):
    """True hanya jika pertanyaan menyangkut informasi yang sifatnya update."""
    if not message or len(message) < 8:
        return False
    if UPDATE_PATTERN.search(message):
        return True
    if len(message) < 40 and previous_user_msgs:
        return bool(UPDATE_PATTERN.search(previous_user_msgs[-1]))
    return False


def search_context(question):
    """Cari info terbaru lewat Tavily, kembalikan cuplikannya sebagai teks."""
    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        return ""
    try:
        resp = requests.post(
            "https://api.tavily.com/search",
            headers={"Authorization": f"Bearer {api_key}"},
            json={"query": question, "max_results": 5, "search_depth": "basic"},
            timeout=15,
        )
        resp.raise_for_status()
        results = resp.json().get("results", [])
        return "\n".join(
            f"- {r.get('title', '')}: {r.get('content', '')} ({r.get('url', '')})"
            for r in results
        )
    except Exception as e:
        print("Search error:", e)
        return ""

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True)
    user_message = (data.get("message") or "").strip()
    requested_model = data.get("model")
    attached_file = data.get("file")
    custom_history = data.get("history")

    # Tentukan model yang dipilih user atau fallback ke default
    model_to_use = AVAILABLE_MODELS.get(requested_model, DEFAULT_MODEL)

    if not user_message and not attached_file:
        return Response("", mimetype="text/plain")

    display_message = user_message or (f"[Lampiran: {attached_file.get('name', 'gambar')}]" if attached_file else "")

    # Ambil riwayat dari frontend atau dari session
    if isinstance(custom_history, list):
        history = list(custom_history)
        history.append({"role": "user", "content": display_message})
    else:
        history = session.get("history", [])
        history.append({"role": "user", "content": display_message})

    history = history[-MAX_HISTORY:]
    session["history"] = history

    contents = build_contents(history, attached_file=attached_file)

    prev_user = [m["content"] for m in history[:-1] if m["role"] == "user" and m.get("content")]

    use_search = needs_search(user_message, prev_user)
    
    info = ""
    if use_search:
        query = user_message if len(user_message) >= 40 or not prev_user else f"{prev_user[-1]} {user_message}"
        info = search_context(query)
    print(f"[DEBUG] use_search={use_search}, panjang hasil={len(info)}")

    system = SYSTEM_PROMPT
    if info:
        system += (
            "\n\nINFO TERBARU DARI PENCARIAN WEB (gunakan bila relevan, "
            "jangan mengarang di luar ini untuk hal yang sifatnya terbaru):\n" + info
        )
        system += (
        "\n\nKONSISTENSI: Jika jawabanmu sebelumnya di percakapan ini memakai info "
        "terbaru dari pencarian, anggap itu benar. Jangan membantahnya dengan "
        "pengetahuan lamamu."
        )
    elif use_search:
        system += (
            "\n\nCATATAN: Pencarian web sedang tidak tersedia. Untuk pertanyaan soal "
            "versi, patch, event, atau karakter terbaru, jangan menyebut versi atau "
            "nama tertentu seolah pasti. Katakan datamu mungkin sudah kedaluwarsa "
            "dan sarankan cek sumber resmi."
        )

    config = types.GenerateContentConfig(
    system_instruction=system,          # <- pakai system
    temperature=0.7,
    )

    def generate():
        full_reply = ""
        try:
            response_stream = client.models.generate_content_stream(
                model=model_to_use,
                contents=contents,
                config=config,
            )
            for chunk in response_stream:
                content = chunk.text or ""
                if content:
                    full_reply += content
                    yield content
        except Exception as e:
            # Jika terkena overload 503 dan bukan memakai model default, coba fallback otomatis
            if "503" in str(e) and model_to_use != DEFAULT_MODEL:
                try:
                    notice = f"*(Model {model_to_use} sedang overload/sibuk, dialihkan otomatis ke {DEFAULT_MODEL})*\n\n"
                    full_reply += notice
                    yield notice
                    fallback_stream = client.models.generate_content_stream(
                        model=DEFAULT_MODEL,
                        contents=contents,
                        config=config,
                    )
                    for chunk in fallback_stream:
                        content = chunk.text or ""
                        if content:
                            full_reply += content
                            yield content
                except Exception as e2:
                    err_msg = f"\n[Maaf, terjadi kendala teknis: {str(e2)}]"
                    full_reply += err_msg
                    yield err_msg
            else:
                err_msg = f"\n[Maaf, terjadi kendala teknis: {str(e)}]"
                full_reply += err_msg
                yield err_msg

        # Simpan balasan AI ke riwayat setelah selesai streaming
        history.append({"role": "model", "content": full_reply})
        session["history"] = history[-MAX_HISTORY:]

    return Response(stream_with_context(generate()), mimetype="text/plain")


if __name__ == "__main__":
    app.run(debug=True, port=5000)

