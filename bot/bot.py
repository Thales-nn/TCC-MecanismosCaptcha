import time
import re
import os
import platform

import cv2
import numpy as np
import pytesseract

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from config import (
    LOGIN_TEXTO_URL,
    CAPTCHA_TEXTO_URL,
    USUARIO,
    SENHA,
    NUMERO_TESTES,
    SESSAO_EXPERIMENTAL,
    CHROME_WIN_PATH,
    TESSERACT_WIN_PATH,
    CARACTERES,
)


# =========================================================
# CONFIGURAÇÃO DO TESSERACT
# =========================================================

if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_WIN_PATH


# =========================================================
# SESSÃO DO BOT
# =========================================================

TIPO_BOT = "BOT_1"

sessao_id = "BOT-1-" + str(int(time.time() * 1000))


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
print("BOT 1 — OCR BÁSICO")
print("=" * 60)
print()
print("Realizando login...")

driver.get(LOGIN_TEXTO_URL)
time.sleep(1)

wait.until(EC.presence_of_element_located((By.ID, "usuario"))).send_keys(USUARIO)
driver.find_element(By.ID, "senha").send_keys(SENHA)
driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

wait.until(EC.url_contains("/captcha/texto"))
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
# CAPTURAR CAPTCHA (IMG em vez de CANVAS)
# =========================================================

def capturar_captcha():
    elemento = wait.until(
        EC.presence_of_element_located((By.ID, "captchaImagem"))
    )
    imagem_png = elemento.screenshot_as_png
    array = np.frombuffer(imagem_png, dtype=np.uint8)
    imagem = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if imagem is None:
        raise Exception("Erro ao capturar CAPTCHA.")
    return imagem


# =========================================================
# PROCESSAR IMAGEM
# =========================================================

def processar_imagem(imagem):
    cinza = cv2.cvtColor(imagem, cv2.COLOR_BGR2GRAY)
    ampliada = cv2.resize(cinza, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
    suavizada = cv2.GaussianBlur(ampliada, (3, 3), 0)
    _, binaria = cv2.threshold(suavizada, 150, 255, cv2.THRESH_BINARY)
    kernel = np.ones((2, 2), np.uint8)
    limpa = cv2.morphologyEx(binaria, cv2.MORPH_OPEN, kernel)
    return limpa


# =========================================================
# OCR
# =========================================================

def reconhecer_captcha(imagem):
    processada = processar_imagem(imagem)
    configuracao = (
        "--psm 7 "
        "-c tessedit_char_whitelist=" + CARACTERES
    )
    texto = pytesseract.image_to_string(processada, config=configuracao)
    texto = texto.upper()
    texto = re.sub(r"[^A-Z2-9]", "", texto)
    return texto[:6]


# =========================================================
# TESTES
# =========================================================

sucessos = 0
erros = 0

print("=" * 60)
print("INICIANDO TESTES DO BOT 1")
print("=" * 60)
print()

for tentativa in range(1, NUMERO_TESTES + 1):
    print(f"[{tentativa}/{NUMERO_TESTES}] Lendo CAPTCHA...")
    inicio = time.time()

    try:
        imagem = capturar_captcha()

        codigo = reconhecer_captcha(imagem)
        print(f"    OCR: {codigo}")

        if not codigo:
            print("    ✕ OCR não reconheceu o CAPTCHA.")
            erros += 1
            time.sleep(1)
            continue

        campo = wait.until(
            EC.presence_of_element_located((By.ID, "codigo"))
        )
        campo.clear()
        campo.send_keys(codigo)
        campo.send_keys(Keys.ENTER)

        time.sleep(1)

        mensagem = driver.find_element(By.ID, "mensagem").text
        tempo = time.time() - inicio

        if "correto" in mensagem.lower() or "sucesso" in mensagem.lower():
            sucessos += 1
            print("    ✓ SUCESSO")
        else:
            erros += 1
            print("    ✕ ERRO")

        print(f"    Tempo: {tempo:.2f}s")
        print()

        if tentativa < NUMERO_TESTES:
            time.sleep(1.5)

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
print("RESULTADO FINAL — BOT 1")
print("=" * 60)
print(f"Testes: {NUMERO_TESTES}")
print(f"Sucessos: {sucessos}")
print(f"Erros: {erros}")
print(f"Taxa de sucesso: {taxa:.2f}%")
print(f"Sessão: {sessao_id}")
print("=" * 60)

input("\nPressione ENTER para fechar...")

driver.quit()
