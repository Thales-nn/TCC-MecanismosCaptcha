import time
import random
import os

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException

from config import (
    LOGIN_SLIDER_URL,
    CAPTCHA_SLIDER_URL,
    USUARIO,
    SENHA,
    NUMERO_TESTES,
    SESSAO_EXPERIMENTAL,
    CHROME_WIN_PATH,
)


# =========================================================
# SESSÃO DO BOT
# =========================================================

TIPO_BOT = "BOT_SLIDER_2"

sessao_id = "BOT-SLIDER-2-" + str(int(time.time() * 1000))


# =========================================================
# CONFIGURAR CHROME
# =========================================================

opcoes = Options()
opcoes.add_argument("--start-maximized")

if os.path.exists(CHROME_WIN_PATH):
    opcoes.binary_location = CHROME_WIN_PATH

driver = webdriver.Chrome(options=opcoes)
wait = WebDriverWait(driver, 10)


# =========================================================
# LOGIN
# =========================================================

print()
print("=" * 60)
print("BOT SLIDER 2 — MOVIMENTO HUMANO SIMULADO")
print("=" * 60)
print()
print("Realizando login...")

driver.get(LOGIN_SLIDER_URL)
time.sleep(1)

wait.until(EC.presence_of_element_located((By.ID, "usuario"))).send_keys(USUARIO)
driver.find_element(By.ID, "senha").send_keys(SENHA)
driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

wait.until(EC.url_contains("/captcha/slider"))
time.sleep(1)

print("Login realizado com sucesso!")


# =========================================================
# DEFINIR BOT E SESSÃO
# =========================================================

driver.execute_script(
    """
    sessionStorage.setItem("tipoUsuario", arguments[0]);
    sessionStorage.setItem("sessaoCaptcha", arguments[1]);
    sessionStorage.setItem("sessaoExperimental", arguments[2]);
    """,
    TIPO_BOT,
    sessao_id,
    SESSAO_EXPERIMENTAL,
)

driver.refresh()
time.sleep(1)

print("Sessão:", sessao_id)
print("Testes:", NUMERO_TESTES)
print("Estratégia: detecção da zona alvo + simulação humana")
print()


# =========================================================
# DETECTAR ZONA ALVO
# =========================================================

def detectar_zona_alvo():
    try:
        left_str = driver.execute_script(
            "return document.getElementById('sliderZonaAlvo').style.left;"
        )
        width_str = driver.execute_script(
            "return document.getElementById('sliderZonaAlvo').style.width;"
        )

        if left_str and width_str:
            left_pct = float(left_str.replace("%", ""))
            width_pct = float(width_str.replace("%", ""))
            centro = (left_pct + width_pct / 2) / 100
            return centro

    except Exception:
        pass

    return None


# =========================================================
# DETECTAR ARMADILHA
# =========================================================

def detectar_armadilha():
    try:
        left_str = driver.execute_script(
            "return document.getElementById('sliderArmadilha').style.left;"
        )
        if left_str:
            return float(left_str.replace("%", "")) / 100
    except Exception:
        pass
    return None


# =========================================================
# SIMULAR MOVIMENTO HUMANO
# =========================================================

def mover_handle_humano(handle, offset_total):
    acoes = ActionChains(driver)
    acoes.click_and_hold(handle)

    num_etapas = random.randint(5, 10)
    percorrido = 0

    for i in range(num_etapas):
        progresso = (i + 1) / num_etapas

        if progresso < 0.3:
            fator = 0.5
        elif progresso > 0.8:
            fator = 0.3
        else:
            fator = 1.0

        restante = offset_total - percorrido
        etapas_restantes = num_etapas - i

        etapa_tamanho = int(restante * fator / etapas_restantes)
        if etapa_tamanho == 0:
            etapa_tamanho = 1 if restante > 0 else 0

        if percorrido + etapa_tamanho > offset_total:
            etapa_tamanho = offset_total - percorrido

        acoes.move_by_offset(etapa_tamanho, 0)
        percorrido += etapa_tamanho

        time.sleep(random.uniform(0.02, 0.08))

    resto = offset_total - percorrido
    if resto != 0:
        acoes.move_by_offset(resto, 0)

    tremor = random.randint(-2, 2)
    if tremor != 0:
        acoes.move_by_offset(tremor, 0)
        time.sleep(random.uniform(0.05, 0.15))
        acoes.move_by_offset(-tremor, 0)

    acoes.release().perform()


# =========================================================
# TESTES
# =========================================================

sucessos = 0
erros = 0
tempos_individuais = []
resultados_detalhados = []

print("=" * 60)
print("INICIANDO TESTES DO BOT SLIDER 2")
print("=" * 60)
print()

for tentativa in range(1, NUMERO_TESTES + 1):
    print(f"[{tentativa}/{NUMERO_TESTES}] Resolvendo slider...")
    inicio = time.time()

    try:
        trilha = wait.until(
            EC.presence_of_element_located((By.ID, "sliderTrilha"))
        )
        handle = driver.find_element(By.ID, "sliderHandle")

        posicao_detectada = detectar_zona_alvo()
        armadilha_pos = detectar_armadilha()

        if posicao_detectada is not None:
            print(f"    Zona alvo detectada: {posicao_detectada * 100:.1f}%")
        else:
            posicao_detectada = 0.60
            print("    Zona alvo não detectada, usando fallback 60%")

        if armadilha_pos is not None:
            print(f"    Armadilha detectada em: {armadilha_pos * 100:.1f}%")

        variacao = random.uniform(-0.02, 0.02)
        posicao_tentada = posicao_detectada + variacao

        if armadilha_pos is not None and posicao_tentada >= armadilha_pos:
            posicao_tentada = armadilha_pos - 0.03
            print(f"    Ajuste: posição limitada para evitar armadilha")

        posicao_tentada = max(0.05, min(0.95, posicao_tentada))

        print(
            f"    Posição detectada: {posicao_detectada * 100:.1f}% "
            f"| Tentada: {posicao_tentada * 100:.1f}% "
            f"(variação: {variacao * 100:+.1f}%)"
        )

        largura_trilha = trilha.size["width"]
        offset = int(largura_trilha * posicao_tentada)

        mover_handle_humano(handle, offset)

        print("    Aguardando validação (2 segundos)...")
        time.sleep(3)

        mensagem = driver.find_element(By.ID, "mensagem").text
        tempo = time.time() - inicio
        tempos_individuais.append(tempo)

        acertou = (
            "sucesso" in mensagem.lower()
            or "correto" in mensagem.lower()
            or "aprovado" in mensagem.lower()
        )

        if acertou:
            sucessos += 1
            print("    ✓ SUCESSO")
        else:
            erros += 1
            print(f"    ✕ ERRO — {mensagem}")

        print(f"    Tempo: {tempo:.2f}s")
        print()

        resultados_detalhados.append(
            {
                "tentativa": tentativa,
                "sucesso": acertou,
                "posicao": posicao_tentada,
                "tempo": tempo,
            }
        )

        if tentativa < NUMERO_TESTES:
            time.sleep(2)

    except Exception as erro_exc:
        erros += 1
        print("    ✕ ERRO NO TESTE")
        print(f"    {erro_exc}")
        print()
        time.sleep(1)


# =========================================================
# RESULTADO FINAL
# =========================================================

taxa = (sucessos / NUMERO_TESTES) * 100

tempo_medio = 0
if tempos_individuais:
    tempo_medio = sum(tempos_individuais) / len(tempos_individuais)

print()
print("=" * 60)
print("RESULTADO FINAL — BOT SLIDER 2")
print("=" * 60)
print(f"Testes: {NUMERO_TESTES}")
print(f"Sucessos: {sucessos}")
print(f"Erros: {erros}")
print(f"Taxa de sucesso: {taxa:.2f}%")
print(f"Tempo médio: {tempo_medio:.2f}s")
print(f"Sessão: {sessao_id}")
print()

print("-" * 60)
print("DETALHES POR TENTATIVA")
print("-" * 60)

for r in resultados_detalhados:
    status = "✓" if r["sucesso"] else "✕"
    print(
        f"  T{r['tentativa']:02d}: {status} | "
        f"Pos: {r['posicao'] * 100:.1f}% | "
        f"Tempo: {r['tempo']:.2f}s"
    )

print("-" * 60)
print("=" * 60)

input("\nPressione ENTER para fechar...")

driver.quit()
