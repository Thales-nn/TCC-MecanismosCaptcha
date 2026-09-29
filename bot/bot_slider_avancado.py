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

TIPO_BOT = "BOT_SLIDER_2"

# Margem de tolerância do slider (±3% conforme JS)
MARGEM_TOLERANCIA = 0.03


# =========================================================
# SESSÃO DO BOT
# =========================================================

sessao_id = (
    "BOT-SLIDER-2-" +
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
print("BOT SLIDER 2 - AVANÇADO")
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
        "BOT_SLIDER_2"
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
print("Estratégia: detecção da zona alvo + simulação humana + uma tentativa por desafio")
print()


# =========================================================
# SIMULAR MOVIMENTO HUMANO
# =========================================================

def mover_handle_humano(
    driver,
    handle,
    offset_total
):
    """
    Move o handle simulando comportamento humano:
    - Velocidade variável
    - Pequenas pausas
    - Micro-ajustes no final
    """

    acoes = ActionChains(
        driver
    )

    acoes.click_and_hold(
        handle
    )

    # Dividir o movimento em etapas
    # para simular aceleração/desaceleração

    num_etapas = random.randint(
        5,
        10
    )

    percorrido = 0

    for i in range(
        num_etapas
    ):

        # Curva de aceleração:
        # começa lento, acelera no meio,
        # desacelera no fim

        progresso = (i + 1) / num_etapas

        if progresso < 0.3:

            fator = 0.5  # lento no início

        elif progresso > 0.8:

            fator = 0.3  # lento no fim

        else:

            fator = 1.0  # rápido no meio


        etapa_tamanho = int(
            (offset_total - percorrido)
            * fator
            / (num_etapas - i)
        )

        if etapa_tamanho == 0:

            etapa_tamanho = 1


        acoes.move_by_offset(
            etapa_tamanho,
            0
        )

        percorrido += etapa_tamanho

        # Pequena pausa aleatória

        time.sleep(
            random.uniform(
                0.02,
                0.08
            )
        )

    # Micro-ajustes finais
    # (simula tremor humano)

    resto = offset_total - percorrido

    if resto != 0:

        acoes.move_by_offset(
            resto,
            0
        )

    # Pequeno tremor

    tremor = random.randint(
        -2,
        2
    )

    if tremor != 0:

        acoes.move_by_offset(
            tremor,
            0
        )

        time.sleep(
            random.uniform(
                0.05,
                0.15
            )
        )

        # Corrigir tremor

        acoes.move_by_offset(
            -tremor,
            0
        )

    acoes.release().perform()


# =========================================================
# DETECTAR ZONA ALVO
# =========================================================

def detectar_zona_alvo(driver):
    """
    Lê a zona alvo do DOM (div#sliderZonaAlvo).
    Retorna a posição percentual do centro da zona alvo.
    Se não conseguir detectar, retorna None.
    """

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
            centro = (left_percent + width_percent / 2) / 100

            return centro

    except NoSuchElementException:

        pass

    return None


# =========================================================
# TENTAR UMA POSIÇÃO (UMA POR DESAFIO)
# =========================================================

def tentar_posicao(
    driver,
    handle,
    trilha,
    posicao_percentual
):
    """
    Tenta arrastar o handle para uma posição percentual.
    Não reseta o handle manualmente (o slider.js cuida disso).
    Retorna True se acertou, False se errou.
    """

    largura_trilha = trilha.size[
        "width"
    ]

    offset = int(
        largura_trilha * posicao_percentual
    )

    mover_handle_humano(
        driver,
        handle,
        offset
    )

    time.sleep(0.8)

    mensagem = driver.find_element(
        By.ID,
        "mensagem"
    ).text

    if "sucesso" in mensagem.lower() or "correto" in mensagem.lower():

        return True

    return False


# =========================================================
# TESTES
# =========================================================

sucessos = 0

erros = 0

tentativas_totais_busca = 0

tempos_individuais = []

resultados_detalhados = []


print("=" * 60)
print("INICIANDO TESTES DO BOT SLIDER 2")
print("=" * 60)
print()


for tentativa in range(
    1,
    NUMERO_TESTES + 1
):

    print(
        f"[{tentativa}/{NUMERO_TESTES}] "
        "Resolvendo slider..."
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

        posicao_detectada = detectar_zona_alvo(driver)

        if posicao_detectada is not None:

            print(
                f"    Zona alvo detectada: "
                f"{posicao_detectada * 100:.1f}%"
            )

        else:

            print(
                "    Zona alvo não detectada, "
                "usando fallback 60%"
            )

            posicao_detectada = 0.60


        # =================================================
        # ADICIONAR VARIAÇÃO ALEATÓRIA (±2%)
        # =================================================

        variacao = random.uniform(
            -0.02,
            0.02
        )

        posicao_tentada = posicao_detectada + variacao

        if posicao_tentada < 0.05:

            posicao_tentada = 0.05

        if posicao_tentada > 0.95:

            posicao_tentada = 0.95

        print(
            f"    Posição detectada: {posicao_detectada * 100:.1f}% "
            f"| Posição tentada: {posicao_tentada * 100:.1f}% "
            f"(variação: {variacao * 100:+.1f}%)"
        )


        # =================================================
        # TENTAR POSIÇÃO (UMA TENTATIVA POR DESAFIO)
        # =================================================

        acertou = tentar_posicao(
            driver,
            handle,
            trilha,
            posicao_tentada
        )

        posicao_final = posicao_tentada

        tentativas_busca = 1


        # =================================================
        # RESULTADO
        # =================================================

        tempo = (
            time.time() -
            inicio
        )

        tempos_individuais.append(
            tempo
        )

        tentativas_totais_busca += tentativas_busca

        if acertou:

            sucessos += 1

            print(
                "    ✓ SUCESSO"
            )

            print(
                f"    Posição encontrada: {posicao_final * 100:.1f}%"
            )

            print(
                f"    Tentativas de busca: {tentativas_busca}"
            )

        else:

            erros += 1

            print(
                "    ✕ ERRO - Não encontrou posição alvo"
            )

            print(
                f"    Tentativas de busca: {tentativas_busca}"
            )


        print(
            f"    Tempo: {tempo:.2f}s"
        )

        print(
            "    Resultado será salvo pelo captcha-slider.js."
        )

        print()

        resultados_detalhados.append(
            {
                "tentativa": tentativa,
                "sucesso": acertou,
                "tentativas_busca": tentativas_busca,
                "tempo": tempo
            }
        )


        # =================================================
        # CLICAR REFRESH PARA NOVO DESAFIO
        # =================================================

        if tentativa < NUMERO_TESTES:

            botao_novo = driver.find_element(
                By.ID,
                "refreshSlider"
            )

            botao_novo.click()

            time.sleep(1.5)

            driver.execute_script(
                """
                sessionStorage.setItem(
                    "tipoUsuario",
                    "BOT_SLIDER_2"
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
# MÉTRICAS
# =========================================================

tempo_medio = 0

if tempos_individuais:

    tempo_medio = (
        sum(tempos_individuais) /
        len(tempos_individuais)
    )

tentativas_medias = 0

if resultados_detalhados:

    tentativas_medias = (
        tentativas_totais_busca /
        len(resultados_detalhados)
    )


# =========================================================
# RESULTADO FINAL
# =========================================================

taxa = (
    sucessos /
    NUMERO_TESTES
) * 100


print()
print("=" * 60)
print("RESULTADO FINAL - BOT SLIDER 2")
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
    f"Tentativas médias de busca: {tentativas_medias:.1f}"
)

print(
    f"Tempo médio: {tempo_medio:.2f}s"
)

print(
    f"Sessão: {sessao_id}"
)

print()

print("-" * 60)
print("DETALHES POR TENTATIVA")
print("-" * 60)

for r in resultados_detalhados:

    status = "✓" if r["sucesso"] else "✕"

    print(
        f"  T{r['tentativa']:02d}: "
        f"{status} | "
        f"Buscas: {r['tentativas_busca']} | "
        f"Tempo: {r['tempo']:.2f}s"
    )

print("-" * 60)

print("=" * 60)


input(
    "\nPressione ENTER para fechar..."
)


driver.quit()
