from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import json
import os

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ============================================================
# HTML PAGES
# ============================================================

@app.get("/")
async def index():
    return FileResponse(
        os.path.join(BASE_DIR, "index.html")
    )


@app.get("/teacher")
async def teacher():
    return FileResponse(
        os.path.join(BASE_DIR, "teacherpage.html")
    )


# ============================================================
# SUPABASE WEBHOOK
# ============================================================

@app.post("/webhook")
async def receive_supabase_webhook(request: Request):
    payload = await request.json()

    print("\n" + "=" * 60)
    print("🚀 RECEIVED WEBHOOK FROM SUPABASE")
    print("=" * 60)

    print(json.dumps(payload, indent=2))

    print("=" * 60 + "\n")

    return {
        "status": "success",
        "message": "Webhook received"
    }


# ============================================================
# STATIC FILES
# ============================================================

# Serve files such as:
# /main.js
# /teacher.js
# /favicon.ico
# /LICENSE
# etc.
app.mount(
    "/",
    StaticFiles(directory=BASE_DIR),
    name="static"
)


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="127.0.0.1",
        port=3000,
        reload=True
    )