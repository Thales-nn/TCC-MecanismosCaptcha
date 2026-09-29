import time
import random

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import NoSuchElementException


# =========================================================
# CONFIGURAÇÕES
# =========================================================

URL = "http://localhost:8080/captcha-slider"

NUMERO_TESTES = 50

TIPO_BOT = "BOT_SLIDER_1"

# Posição de fallback (60% da trilha) caso não consiga detectar a zona alvo
POSICAO_FALLBACK = 0.60


# =========================================================
# SESSÃO DO BOT
# =========================================================

sessao_id = (
    "BOT-SLIDER-1-" +
    str(int(time.time() * 1000))
)


# =========================================================
# CONFIGURAR CHROME
# =========================================================

opcoes = Options()

opcoes.add_argument("--start-maximized")

import os

chrome_win = "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"

if os.path.exists(chrome_win):

    opcoes.binary_location = chrome_win

driver = webdriver.Chrome(
    options=opcoes
)


# =========================================================
# ABRIR CAPTCHA
# =========================================================

print()
print("=" * 60)
print("BOT SLIDER 1 - SIMPLES")
print("=" * 60)

print()

print("Abrindo CAPTCHA deslizante...")

driver.get(URL)

time.sleep(1)


# =========================================================
# DEFINIR BOT E SESSÃO
# =========================================================

driver.execute_script(
    """
    sessionStorage.setItem(
        "tipoUsuario",
        "BOT_SLIDER_1"
    );

    sessionStorage.setItem(
        "sessaoCaptcha",
        arguments[0]
    );
    """,
    sessao_id
)

driver.refresh()

time.sleep(1)


print("CAPTCHA aberto!")
print()
print("Sessão:", sessao_id)
print("Testes:", NUMERO_TESTES)
print("Posição de fallback:", int(POSICAO_FALLBACK * 100), "%")
print()


# =========================================================
# TESTES
# =========================================================

sucessos = 0

erros = 0


print("=" * 60)
print("INICIANDO TESTES DO BOT SLIDER 1")
print("=" * 60)
print()


for tentativa in range(
    1,
    NUMERO_TESTES + 1
):

    print(
        f"[{tentativa}/{NUMERO_TESTES}] "
        "Tentando resolver slider..."
    )

    inicio = time.time()

    try:

        # =================================================
        # ENCONTRAR ELEMENTOS
        # =================================================

        trilha = driver.find_element(
            By.ID,
            "sliderTrilha"
        )

        handle = driver.find_element(
            By.ID,
            "sliderHandle"
        )


        # =================================================
        # DETECTAR ZONA ALVO
        # =================================================

        posicao_alvo = POSICAO_FALLBACK

        try:

            zona_alvo = driver.find_element(
                By.ID,
                "sliderZonaAlvo"
            )

            left_str = driver.execute_script(
                "var el = document.getElementById('sliderZonaAlvo');"
                "return el.style.left;"
            )

            width_str = driver.execute_script(
                "var el = document.getElementById('sliderZonaAlvo');"
                "return el.style.width;"
            )

            if left_str and width_str:

                left_percent = float(left_str.replace('%', ''))
                width_percent = float(width_str.replace('%', ''))
                posicao_alvo = (left_percent + width_percent / 2) / 100

                print(
                    f"    Zona alvo detectada: "
                    f"left={left_percent:.1f}% "
                    f"width={width_percent:.1f}% "
                    f"centro={posicao_alvo * 100:.1f}%"
                )

            else:

                print(
                    "    Zona alvo não encontrada, "
                    "usando fallback: "
                    f"{int(POSICAO_FALLBACK * 100)}%"
                )

        except NoSuchElementException:

            print(
                "    Zona alvo não encontrada, "
                "usando fallback: "
                f"{int(POSICAO_FALLBACK * 100)}%"
            )


        # =================================================
        # CALCULAR OFFSET
        # =================================================

        largura_trilha = trilha.size[
            "width"
        ]

        offset = int(
            largura_trilha * posicao_alvo
        )


        # =================================================
        # ARRASTAR HANDLE
        # =================================================

        acoes = ActionChains(
            driver
        )

        acoes.click_and_hold(
            handle
        ).move_by_offset(
            offset,
            0
        ).release().perform()


        # =================================================
        # ESPERAR RESPOSTA
        # =================================================

        time.sleep(0.8)


        # =================================================
        # LER MENSAGEM
        # =================================================

        mensagem = driver.find_element(
            By.ID,
            "mensagem"
        ).text


        tempo = (
            time.time() -
            inicio
        )


        # =================================================
        # RESULTADO
        # =================================================

        if "sucesso" in mensagem.lower() or "correto" in mensagem.lower():

            sucessos += 1

            print(
                "    ✓ SUCESSO"
            )

        else:

            erros += 1

            print(
                "    ✕ ERRO - " + mensagem
            )


        print(
            f"    Posição tentada: {posicao_alvo * 100:.1f}%"
        )

        print(
            f"    Tempo: {tempo:.2f}s"
        )

        print(
            "    Resultado será salvo pelo captcha-slider.js."
        )

        print()


        # =================================================
        # AGUARDAR PRÓXIMO SLIDER
        # =================================================

        if tentativa < NUMERO_TESTES:

            botao_novo = driver.find_element(
                By.ID,
                "refreshSlider"
            )

            botao_novo.click()

            time.sleep(1)

            driver.execute_script(
                """
                sessionStorage.setItem(
                    "tipoUsuario",
                    "BOT_SLIDER_1"
                );

                sessionStorage.setItem(
                    "sessaoCaptcha",
                    arguments[0]
                );
                """,
                sessao_id
            )


    except Exception as erro:

        erros += 1

        print(
            "    ✕ ERRO NO TESTE"
        )

        print(
            f"    {erro}"
        )

        print()

        time.sleep(1)


# =========================================================
# RESULTADO FINAL
# =========================================================

taxa = (
    sucessos /
    NUMERO_TESTES
) * 100


print()
print("=" * 60)
print("RESULTADO FINAL - BOT SLIDER 1")
print("=" * 60)

print(
    f"Testes: {NUMERO_TESTES}"
)

print(
    f"Sucessos: {sucessos}"
)

print(
    f"Erros: {erros}"
)

print(
    f"Taxa de sucesso: {taxa:.2f}%"
)

print(
    f"Sessão: {sessao_id}"
)

print("=" * 60)


input(
    "\nPressione ENTER para fechar..."
)


driver.quit()
