import asyncio
import logging
import time
from pathlib import Path

logger = logging.getLogger("hermes-coder.client")


async def run_hermes(hermes_bin: str, prompt: str, workdir: str, timeout: int) -> dict:
    import subprocess

    cmd = [hermes_bin, "-z", prompt, "--accept-hooks"]
    logger.info(f"Executando Hermes em {workdir}: {' '.join(cmd)[:200]}...")

    start = time.time()
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=workdir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        except asyncio.TimeoutError:
            try:
                proc.kill()
            except Exception:
                pass
            return {"status": "timeout", "elapsed_seconds": round(time.time() - start)}

        elapsed = round(time.time() - start, 1)
        stdout_str = stdout.decode("utf-8", errors="replace") if stdout else ""
        stderr_str = stderr.decode("utf-8", errors="replace") if stderr else ""

        return {
            "status": "ok" if proc.returncode == 0 else "error",
            "exit_code": proc.returncode,
            "output": stdout_str,
            "stderr": stderr_str,
            "elapsed_seconds": elapsed,
        }
    except OSError as e:
        return {"status": "os_error", "elapsed_seconds": round(time.time() - start), "error": str(e)}
    except Exception as e:
        return {"status": "error", "elapsed_seconds": round(time.time() - start), "error": str(e)}


def build_prompt(task: str, context: str, toolsets: list[str], max_turns: int) -> str:
    tools_str = ", ".join(toolsets)
    context_block = f"\n\nCONTEXTO:\n{context}" if context else ""
    return (
        f"[INSTRUCAO DO CIO]\n"
        f"Voce e o funcionario codificador. Sua tarefa:\n\n"
        f"{task}\n"
        f"{context_block}\n\n"
        f"DIRETRIZES:\n"
        f"- Use as ferramentas disponiveis ({tools_str}) para completar a tarefa\n"
        f"- Crie e modifique arquivos diretamente no workdir\n"
        f"- Execute testes para verificar seu codigo\n"
        f"- Ao final, SUMARIZE: o que foi feito, quais arquivos foram criados/alterados, e se ha algo pendente\n"
        f"- Se encontrar erros, tente corrigir antes de reportar\n"
        f"- Se precisar de mais informacoes, USE as ferramentas de pesquisa/web/busca\n"
        f"\n[CONFIG]\nMax turns: {max_turns}"
    )
