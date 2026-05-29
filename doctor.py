import os, json, time, logging
from pathlib import Path

logger = logging.getLogger("hermes-coder.doctor")

HERMES_BIN = os.environ.get("HERMES_BIN") or ""
CACHE_DIR = Path(__file__).parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)
HEALTH_CACHE = CACHE_DIR / "health_cache.json"


def _load_health_cache() -> dict:
    try:
        data = json.loads(HEALTH_CACHE.read_text())
        if data.get("timestamp", 0) + data.get("ttl", 300) > time.time():
            return data
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        pass
    return {}


def _save_health_cache(status: str, details: dict, ttl: int = 300):
    data = {"status": status, "details": details, "timestamp": time.time(), "ttl": ttl}
    try:
        HEALTH_CACHE.write_text(json.dumps(data))
    except Exception as e:
        logger.debug(f"Falha ao salvar health cache: {e}")


def check_binary() -> dict:
    if not HERMES_BIN:
        return {"status": "error", "check": "binary", "message": "Hermes binary not found. Set HERMES_BIN env var or install via: npm install -g @anthropic-ai/hermes"}
    path = Path(HERMES_BIN)
    if not path.is_file():
        return {"status": "error", "check": "binary", "message": f"Not a file: {HERMES_BIN}"}
    if not os.access(str(path), os.X_OK):
        return {"status": "error", "check": "binary", "message": f"Not executable: {HERMES_BIN}"}
    return {"status": "ok", "check": "binary", "message": str(path)}


async def check_version(safe_subprocess) -> dict:
    logger.info("Doctor: checking Hermes version")
    result = await safe_subprocess([HERMES_BIN, "--version"], timeout=30)
    return {
        "status": result["status"],
        "check": "version",
        "output": result["stdout"][:200],
        "stderr": result["stderr"][:200],
        "exit_code": result["exit_code"],
    }


async def check_subprocess_env(safe_subprocess) -> dict:
    logger.info("Doctor: checking subprocess environment")
    import sys
    test_cmd = [sys.executable, "-c", "import sys; print(sys.version.split()[0])"]
    result = await safe_subprocess(test_cmd, timeout=15)
    return {
        "status": result["status"],
        "check": "subprocess_env",
        "python_version": result["stdout"].strip(),
        "stderr": result["stderr"][:200],
        "exit_code": result["exit_code"],
        "futex_error": "futex" in result["stderr"].lower(),
    }


async def run_doctor(safe_subprocess) -> dict:
    binary = check_binary()
    if binary["status"] != "ok":
        return {"status": "fail", "checks": [binary], "summary": "Hermes binary not available"}

    version = await check_version(safe_subprocess)
    subproc = await check_subprocess_env(safe_subprocess)
    checks = [binary, version, subproc]
    futex_ok = not subproc.get("futex_error", False)
    version_ok = version["status"] == "ok"

    if not futex_ok:
        summary = "PRoot environment detected: subprocess creation (futex) is broken."
    elif not version_ok:
        summary = f"Hermes binary exists but failed to respond: {version.get('stderr', '')[:100]}"
    else:
        summary = "All checks passed"

    overall = "pass" if (futex_ok and version_ok and binary["status"] == "ok") else "fail"
    return {"status": overall, "checks": checks, "summary": summary}
