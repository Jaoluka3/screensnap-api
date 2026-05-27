#!/usr/bin/env python3
"""
MCP Server: Hermes Coder — Bridge OpenCode (CIO) → Hermes (Funcionário)
=====================================================================
Permite que o OpenCode delegue tarefas de codificação ao Hermes Agent
via MCP, com ciclo de revisão: OpenCode planeja → Hermes constrói →
OpenCode revisa → Hermes corrige → OpenCode aprova.

Arquitetura:
- CIO (OpenCode): planeja, delega, revisa, melhora, aprova
- Funcionário (Hermes): constrói código, executa comandos, testa
"""
import sys
import os
import json
import logging
import asyncio
import subprocess
import shutil
import time
from typing import Any

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("hermes-coder")

try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError as e:
    print(json.dumps({"error": f"Dependência ausente: {e}. Rode: pip install mcp"}))
    sys.exit(1)

HERMES_BIN = shutil.which("hermes") or "/usr/local/bin/hermes"

CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

HEALTH_CACHE_PATH = os.path.join(CACHE_DIR, "health_cache.json")

server = Server("hermes-coder")

# ── Health Cache ──────────────────────────────────────────────────────

def _load_health_cache() -> dict:
    try:
        with open(HEALTH_CACHE_PATH) as f:
            data = json.load(f)
        if data.get("timestamp", 0) + data.get("ttl", 300) > time.time():
            return data
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        pass
    return {}

def _save_health_cache(status: str, details: dict, ttl: int = 300):
    data = {"status": status, "details": details, "timestamp": time.time(), "ttl": ttl}
    try:
        with open(HEALTH_CACHE_PATH, "w") as f:
            json.dump(data, f)
    except Exception as e:
        logger.debug(f"Falha ao salvar health cache: {e}")

# ── Safe Subprocess Helper ────────────────────────────────────────────

async def _safe_subprocess(cmd: list[str], timeout: int = 15, **kwargs) -> dict:
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            **kwargs
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        return {
            "status": "ok" if proc.returncode == 0 else "error",
            "exit_code": proc.returncode,
            "stdout": stdout.decode("utf-8", errors="replace") if stdout else "",
            "stderr": stderr.decode("utf-8", errors="replace") if stderr else "",
        }
    except asyncio.TimeoutError:
        if proc and proc.returncode is None:
            try:
                proc.kill()
            except Exception:
                pass
        return {"status": "timeout", "exit_code": None, "stdout": "", "stderr": "TIMEOUT"}
    except OSError as e:
        return {"status": "os_error", "exit_code": None, "stdout": "", "stderr": str(e)}
    except Exception as e:
        return {"status": "error", "exit_code": None, "stdout": "", "stderr": str(e)}

# ── Hermes Doctor ─────────────────────────────────────────────────────

def _check_binary() -> dict:
    if not HERMES_BIN:
        return {"status": "error", "check": "binary", "message": "Hermes binary not found"}
    if not os.path.isfile(HERMES_BIN):
        return {"status": "error", "check": "binary", "message": f"Not a file: {HERMES_BIN}"}
    if not os.access(HERMES_BIN, os.X_OK):
        return {"status": "error", "check": "binary", "message": f"Not executable: {HERMES_BIN}"}
    return {"status": "ok", "check": "binary", "message": HERMES_BIN}

async def _check_version() -> dict:
    logger.info("Doctor: checking Hermes version")
    result = await _safe_subprocess([HERMES_BIN, "--version"], timeout=30)
    return {
        "status": result["status"],
        "check": "version",
        "output": result["stdout"][:200],
        "stderr": result["stderr"][:200],
        "exit_code": result["exit_code"],
    }

async def _check_subprocess_env() -> dict:
    logger.info("Doctor: checking subprocess environment (PRoot/futex test)")
    test_cmd = ["python3", "-c", "import sys; print(sys.version.split()[0])"]
    result = await _safe_subprocess(test_cmd, timeout=15)
    return {
        "status": result["status"],
        "check": "subprocess_env",
        "python_version": result["stdout"].strip(),
        "stderr": result["stderr"][:200],
        "exit_code": result["exit_code"],
        "futex_error": "futex" in result["stderr"].lower(),
    }

async def doctor() -> dict:
    binary = _check_binary()
    if binary["status"] != "ok":
        return {"status": "fail", "checks": [binary], "summary": "Hermes binary not available"}

    version = await _check_version()
    subproc = await _check_subprocess_env()

    checks = [binary, version, subproc]
    futex_ok = not subproc.get("futex_error", False)
    version_ok = version["status"] == "ok"

    if not futex_ok:
        summary = "PRoot environment detected: subprocess creation (futex) is broken. Hermes MCP cannot spawn subprocesses."
    elif not version_ok:
        summary = f"Hermes binary exists but failed to respond: {version.get('stderr', '')[:100]}"
    else:
        summary = "All checks passed"

    overall = "pass" if (futex_ok and version_ok and binary["status"] == "ok") else "fail"
    return {"status": overall, "checks": checks, "summary": summary}

# ── Tool Definitions ──────────────────────────────────────────────────

@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="hermes_code",
            description=(
                "Delega uma tarefa de codificação ao Hermes Agent (funcionário). "
                "O Hermes tem acesso a terminal, arquivos, web (exa/gh_grep/playwright) "
                "e todos os MCPs configurados. Use para: construir features, corrigir bugs, "
                "executar testes, refatorar código. O Hermes opera no workdir especificado "
                "e retorna o resultado + diff das alterações."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "task": {
                        "type": "string",
                        "description": (
                            "Descrição clara e detalhada da tarefa para o Hermes. "
                            "Inclua: o que fazer, onde (arquivos/diretórios), "
                            "stack usado, restrições, critérios de sucesso."
                        ),
                    },
                    "context": {
                        "type": "string",
                        "description": (
                            "Contexto adicional: estrutura do projeto, código existente, "
                            "ERROS encontrados, outputs de comandos anteriores, "
                            "ou qualquer informação que o Hermes precise saber."
                        ),
                    },
                    "workdir": {
                        "type": "string",
                        "description": (
                            "Diretório absoluto do projeto onde o Hermes deve operar. "
                            "Ex: /root/meu-backend, /root/frontend-saas"
                        ),
                    },
                    "timeout": {
                        "type": "number",
                        "description": "Timeout em segundos para a tarefa (padrão: 120, máx: 600)",
                        "default": 120,
                    },
                    "max_turns": {
                        "type": "number",
                        "description": "Máximo de turns do Hermes (padrão: 30, máx: 90)",
                        "default": 30,
                    },
                    "toolsets": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Conjunto de ferramentas liberadas (padrão: todas)",
                        "default": ["terminal", "file", "web", "browser", "memory", "skills", "code_execution"],
                    },
                },
                "required": ["task", "workdir"],
            },
        ),
        Tool(
            name="hermes_status",
            description=(
                "Verifica se o Hermes Agent está instalado e operacional. "
                "Retorna versão, modelo configurado, MCPs ativos e status geral."
            ),
            inputSchema={"type": "object", "properties": {}},
        ),
        Tool(
            name="hermes_doctor",
            description=(
                "Diagnóstico completo do ambiente Hermes. Testa binário, subprocesso, "
                "e detecta problemas de PRoot/futex que impedem o funcionamento. "
                "Use antes de hermes_code para verificar se o ambiente está saudável."
            ),
            inputSchema={"type": "object", "properties": {}},
        ),
    ]


def build_prompt(task: str, context: str, toolsets: list[str]) -> str:
    tools_str = ", ".join(toolsets)
    context_block = f"\n\nCONTEXTO:\n{context}" if context else ""
    return (
        f"[INSTRUÇÃO DO CIO]\n"
        f"Você é o funcionário codificador. Sua tarefa:\n\n"
        f"{task}\n"
        f"{context_block}\n\n"
        f"DIRETRIZES:\n"
        f"- Use as ferramentas disponíveis ({tools_str}) para completar a tarefa\n"
        f"- Crie e modifique arquivos diretamente no workdir\n"
        f"- Execute testes para verificar seu código\n"
        f"- Ao final, SUMARIZE: o que foi feito, quais arquivos foram criados/alterados, "
        f"e se há algo pendente\n"
        f"- Se encontrar erros, tente corrigir antes de reportar\n"
        f"- Se precisar de mais informações, USE as ferramentas de pesquisa/web/busca"
    )


async def _run_hermes_subprocess(cmd: list[str], workdir: str, timeout: int) -> dict:
    start = time.time()
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=workdir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(), timeout=timeout
            )
        except asyncio.TimeoutError:
            try:
                proc.kill()
            except Exception:
                pass
            elapsed = time.time() - start
            return {"status": "timeout", "elapsed_seconds": round(elapsed)}

        elapsed = time.time() - start
        stdout_str = stdout.decode("utf-8", errors="replace") if stdout else ""
        stderr_str = stderr.decode("utf-8", errors="replace") if stderr else ""

        return {
            "status": "ok" if proc.returncode == 0 else "error",
            "exit_code": proc.returncode,
            "stdout": stdout_str,
            "stderr": stderr_str,
            "elapsed_seconds": round(elapsed, 1),
        }

    except OSError as e:
        elapsed = time.time() - start
        return {"status": "os_error", "elapsed_seconds": round(elapsed, 1), "error": str(e)}
    except Exception as e:
        elapsed = time.time() - start
        return {"status": "error", "elapsed_seconds": round(elapsed, 1), "error": str(e)}


async def run_hermes(prompt: str, workdir: str, timeout: int) -> dict:
    cmd = [HERMES_BIN, "-z", prompt, "--accept-hooks"]
    logger.info(f"Executando Hermes em {workdir}: {' '.join(cmd)[:200]}...")

    result = await _run_hermes_subprocess(cmd, workdir, timeout)

    if result["status"] == "os_error":
        return {
            "status": "os_error",
            "message": f"Erro de sistema ao criar subprocesso: {result.get('error', '')}. "
                       "Possível problema de PRoot/futex. Execute 'hermes_doctor'.",
            "elapsed_seconds": result.get("elapsed_seconds", 0),
        }
    if result["status"] == "timeout":
        return {
            "status": "timeout",
            "message": f"Hermes não completou a tarefa em {timeout}s",
            "elapsed_seconds": result.get("elapsed_seconds", timeout),
            "partial_output": "",
        }

    return {
        "status": result["status"],
        "exit_code": result.get("exit_code"),
        "output": result.get("stdout", ""),
        "stderr": result.get("stderr", ""),
        "elapsed_seconds": result.get("elapsed_seconds", 0),
    }


async def handle_doctor() -> list[TextContent]:
    logger.info("Running Hermes doctor")
    result = await doctor()
    _save_health_cache(result["status"], result)
    return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]


async def handle_status() -> list[TextContent]:
    logger.info("Handling hermes_status")

    hc = _load_health_cache()
    if hc and hc.get("status") != "pass":
        return [TextContent(type="text", text=json.dumps({
            "status": "warning",
            "message": "Ambiente não passou no último health check. Execute hermes_doctor para diagnóstico.",
            "health_cache": hc,
        }, ensure_ascii=False, indent=2))]

    version_result = await _safe_subprocess([HERMES_BIN, "--version"], timeout=30)
    if version_result["status"] != "ok":
        _save_health_cache("fail", {"reason": "version_check_failed", "detail": version_result})
        return [TextContent(type="text", text=json.dumps({
            "status": "error",
            "message": "Não foi possível obter versão do Hermes",
            "detail": version_result["stderr"][:300] if version_result.get("stderr") else f"status={version_result['status']}",
            "binary": HERMES_BIN,
        }, ensure_ascii=False, indent=2))]

    version = version_result["stdout"].strip()

    mcp_result = await _safe_subprocess([HERMES_BIN, "mcp", "list"], timeout=30)
    mcp_list = mcp_result["stdout"].strip() if mcp_result["status"] == "ok" else ""

    return [TextContent(type="text", text=json.dumps({
        "status": "ok",
        "version": version,
        "binary": HERMES_BIN,
        "mcps_ativos": mcp_list,
        "proot_warning": "Ambiente PRoot — subprocessos podem ser lentos ou instáveis",
    }, ensure_ascii=False, indent=2))]


async def handle_code(args: dict) -> list[TextContent]:
    task = args.get("task", "").strip()
    context = args.get("context", "").strip()
    workdir = args.get("workdir", "").strip()
    timeout = min(int(args.get("timeout", 120)), 600)
    max_turns = min(int(args.get("max_turns", 30)), 90)
    toolsets = args.get("toolsets", ["terminal", "file", "web", "browser", "memory", "skills", "code_execution"])

    if not task:
        return [TextContent(type="text", text=json.dumps({
            "status": "error", "message": "Parâmetro 'task' é obrigatório"
        }, ensure_ascii=False))]
    if not workdir or not os.path.isdir(workdir):
        return [TextContent(type="text", text=json.dumps({
            "status": "error", "message": f"workdir inválido ou não encontrado: {workdir}"
        }, ensure_ascii=False))]

    hc = _load_health_cache()
    if hc and hc.get("status") != "pass":
        return [TextContent(type="text", text=json.dumps({
            "status": "health_blocked",
            "message": "Ambiente não passou no health check. Execute hermes_doctor para corrigir.",
            "health_cache": hc,
        }, ensure_ascii=False, indent=2))]

    if not hc:
        logger.info("Health cache vazio — executando doctor antes do primeiro comando")
        diag = await doctor()
        _save_health_cache(diag["status"], diag, ttl=60)
        if diag["status"] != "pass":
            return [TextContent(type="text", text=json.dumps({
                "status": "health_blocked",
                "message": "Ambiente não passou no health check.",
                "doctor": diag,
            }, ensure_ascii=False, indent=2))]

    prompt = build_prompt(task, context, toolsets)
    prompt += f"\n\n[CONFIG]\nMax turns: {max_turns}"

    result = await run_hermes(prompt, workdir, timeout)

    result["task_resumo"] = task[:200]
    result["workdir"] = workdir

    return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    try:
        if name == "hermes_status":
            return await handle_status()
        elif name == "hermes_code":
            return await handle_code(arguments)
        elif name == "hermes_doctor":
            return await handle_doctor()
        else:
            return [TextContent(type="text", text=json.dumps({
                "status": "error", "message": f"Ferramenta desconhecida: {name}"
            }, ensure_ascii=False))]
    except Exception as e:
        logger.error(f"Erro não tratado em call_tool({name}): {e}", exc_info=True)
        return [TextContent(type="text", text=json.dumps({
            "status": "crash",
            "message": f"Erro interno no MCP server: {str(e)}",
        }, ensure_ascii=False))]


async def main():
    logger.info("Starting Hermes Coder MCP server")
    logger.info(f"Hermes binary: {HERMES_BIN}")
    try:
        async with stdio_server() as (read_stream, write_stream):
            await server.run(read_stream, write_stream, server.create_initialization_options())
    except Exception as e:
        logger.error(f"MCP server crashed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
