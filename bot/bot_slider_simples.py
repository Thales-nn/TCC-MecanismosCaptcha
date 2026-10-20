import time
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

TIPO_BOT = "BOT_SLIDER_1"

POSICAO_FALLBACK = 0.60

sessao_id = "BOT-SLIDER-1-" + str(int(time.time() * 1000))


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
print("BOT SLIDER 1 — DETECÇÃO DIRETA")
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
            return centro, left_pct, width_pct

    except Exception:
        pass

    return None, None, None


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
# TESTES
# =========================================================

sucessos = 0
erros = 0

print("=" * 60)
print("INICIANDO TESTES DO BOT SLIDER 1")
print("=" * 60)
print()

for tentativa in range(1, NUMERO_TESTES + 1):
    print(f"[{tentativa}/{NUMERO_TESTES}] Tentando resolver slider...")
    inicio = time.time()

    try:
        trilha = wait.until(
            EC.presence_of_element_located((By.ID, "sliderTrilha"))
        )
        handle = driver.find_element(By.ID, "sliderHandle")

        centro, left_pct, width_pct = detectar_zona_alvo()
        armadilha_pos = detectar_armadilha()

        if centro is not None:
            posicao_alvo = centro
            print(
                f"    Zona alvo: left={left_pct:.1f}% "
                f"width={width_pct:.1f}% centro={posicao_alvo * 100:.1f}%"
            )
        else:
            posicao_alvo = POSICAO_FALLBACK
            print(f"    Zona alvo não encontrada, fallback: {int(POSICAO_FALLBACK * 100)}%")

        if armadilha_pos is not None:
            print(f"    Armadilha detectada em: {armadilha_pos * 100:.1f}%")
            if posicao_alvo >= armadilha_pos:
                posicao_alvo = armadilha_pos - 0.05
                print(f"    Ajustando posição para evitar armadilha: {posicao_alvo * 100:.1f}%")

        largura_trilha = trilha.size["width"]
        offset = int(largura_trilha * posicao_alvo)

        acoes = ActionChains(driver)
        acoes.click_and_hold(handle).move_by_offset(offset, 0).release().perform()

        print("    Aguardando validação (2 segundos)...")
        time.sleep(3)

        mensagem = driver.find_element(By.ID, "mensagem").text
        tempo = time.time() - inicio

        if "sucesso" in mensagem.lower() or "correto" in mensagem.lower() or "aprovado" in mensagem.lower():
            sucessos += 1
            print("    ✓ SUCESSO")
        else:
            erros += 1
            print(f"    ✕ ERRO — {mensagem}")

        print(f"    Posição tentada: {posicao_alvo * 100:.1f}%")
        print(f"    Tempo: {tempo:.2f}s")
        print()

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

print()
print("=" * 60)
print("RESULTADO FINAL — BOT SLIDER 1")
print("=" * 60)
print(f"Testes: {NUMERO_TESTES}")
print(f"Sucessos: {sucessos}")
print(f"Erros: {erros}")
print(f"Taxa de sucesso: {taxa:.2f}%")
print(f"Sessão: {sessao_id}")
print("=" * 60)

input("\nPressione ENTER para fechar...")

driver.quit()
