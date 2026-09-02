from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(
    title="Rubbish Collection Points System",
    docs_url=None,
    redoc_url=None
)


# ============================================================
# HTML PAGES
# ============================================================

@app.get("/", include_in_schema=False)
async def index():
    return FileResponse(
        os.path.join(BASE_DIR, "index.html")
    )


@app.get("/teacher", include_in_schema=False)
async def teacher():
    return FileResponse(
        os.path.join(BASE_DIR, "teacherpage.html")
    )


@app.get("/health")
async def health_check():
    return {"status": "ok"}


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

app.mount(
    "/",
    StaticFiles(directory=BASE_DIR),
    name="static"
)


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "3000"))
    reload_enabled = os.getenv("RELOAD", "false").lower() == "true"

    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=reload_enabled
    )