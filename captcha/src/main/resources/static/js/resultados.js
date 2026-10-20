// ======================================================
// VARIÁVEIS GLOBAIS
// ======================================================

let todosResultados = [];

let graficoResultados = null;

let graficoTempo = null;

let graficoComparativo = null;


// ======================================================
// CARREGAR RESULTADOS
// ======================================================

async function carregarResultados() {

    try {

        const resposta = await fetch("/api/resultados");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar resultados.");
        }

        todosResultados = await resposta.json();

        console.log("Resultados recebidos:", todosResultados);

        aplicarFiltros();

    } catch (erro) {

        console.error("ERRO:", erro);
    }
}


// ======================================================
// FILTRAR DADOS
// ======================================================

function filtrarDados() {

    const filtroCaptcha = document.getElementById("filtroTipoCaptcha").value;

    const filtroUsuario = document.getElementById("filtroTipoUsuario").value;

    return todosResultados.filter(function(item) {

        const captchaOk =
            filtroCaptcha === "TODOS" ||
            item.tipoCaptcha === filtroCaptcha;

        const usuarioOk =
            filtroUsuario === "TODOS" ||
            item.tipoUsuario === filtroUsuario;

        return captchaOk && usuarioOk;
    });
}


// ======================================================
// APLICAR FILTROS
// ======================================================

function aplicarFiltros() {

    const dados = filtrarDados();

    calcularMetricas(dados);

    preencherTabela(dados);

    criarGraficoResultados(dados);

    criarGraficoTempo(dados);

    preencherCardsComparativos(todosResultados);

    criarGraficoComparativo(todosResultados);
}


// ======================================================
// MÉTRICAS GERAIS
// ======================================================

function calcularMetricas(dados) {

    const total = dados.length;

    const sucessos = dados.filter(function(item) {
        return String(item.resultado || "").toUpperCase() === "SUCESSO";
    }).length;

    const erros = dados.filter(function(item) {
        return String(item.resultado || "").toUpperCase() === "ERRO";
    }).length;

    let somaTempo = 0;

    dados.forEach(function(item) {
        somaTempo += Number(item.tempoMs || 0);
    });

    const tempoMedio = total > 0 ? somaTempo / total : 0;

    const taxa = total > 0 ? (sucessos / total) * 100 : 0;

    document.getElementById("total").textContent = total;

    document.getElementById("sucessos").textContent = sucessos;

    document.getElementById("erros").textContent = erros;

    document.getElementById("taxaSucesso").textContent = taxa.toFixed(2) + "%";

    document.getElementById("tempoMedio").textContent = Math.round(tempoMedio) + " ms";
}


// ======================================================
// TABELA
// ======================================================

function preencherTabela(dados) {

    const tabela = document.getElementById("tabelaResultados");

    tabela.innerHTML = "";

    if (dados.length === 0) {

        tabela.innerHTML = `
            <tr>
                <td colspan="5">
                    Nenhuma tentativa registrada.
                </td>
            </tr>
        `;

        return;
    }

    dados.forEach(function(item, index) {

        const linha = document.createElement("tr");

        const resultado = String(item.resultado || "").toUpperCase();

        const sucesso = resultado === "SUCESSO";

        const tentativa = item.tentativa || index + 1;

        const tempo = Number(item.tempoMs || 0);

        const tipoUsuario = item.tipoUsuario || "HUMANO";

        const tipoCaptcha = item.tipoCaptcha || "CAPTCHA_TEXTO";

        const tipoCaptchaLabel =
            tipoCaptcha === "CAPTCHA_DESLIZANTE"
                ? "Deslizante"
                : "Texto";

        linha.innerHTML = `
            <td>#${tentativa}</td>
            <td>
                <span style="
                    display:inline-block;
                    padding:6px 12px;
                    border-radius:20px;
                    font-weight:bold;
                    background:${sucesso ? "#dcfce7" : "#fee2e2"};
                    color:${sucesso ? "#15803d" : "#b91c1c"};
                ">
                    ${sucesso ? "✓ Sucesso" : "✕ Erro"}
                </span>
            </td>
            <td>${tempo} ms</td>
            <td>${tipoUsuario}</td>
            <td>${tipoCaptchaLabel}</td>
        `;

        tabela.appendChild(linha);
    });
}


// ======================================================
// GRÁFICO DE RESULTADOS (DOUGHNUT)
// ======================================================

function criarGraficoResultados(dados) {

    const canvas = document.getElementById("graficoResultados");

    if (!canvas) return;

    let sucessos = 0;

    let erros = 0;

    dados.forEach(function(item) {

        if (String(item.resultado || "").toUpperCase() === "SUCESSO") {
            sucessos++;
        } else {
            erros++;
        }
    });

    if (graficoResultados) {
        graficoResultados.destroy();
    }

    graficoResultados = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels: ["Sucessos", "Erros"],

            datasets: [{
                data: [sucessos, erros],
                backgroundColor: ["#2563eb", "#e5e7eb"],
                borderWidth: 0
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            cutout: "70%",

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


// ======================================================
// GRÁFICO DE TEMPO (LINE)
// ======================================================

function criarGraficoTempo(dados) {

    const canvas = document.getElementById("graficoTempo");

    if (!canvas) return;

    if (graficoTempo) {
        graficoTempo.destroy();
    }

    const labels = dados.map(function(item, index) {
        return "#" + (item.tentativa || index + 1);
    });

    const tempos = dados.map(function(item) {
        return Number(item.tempoMs || 0);
    });

    graficoTempo = new Chart(canvas, {

        type: "line",

        data: {

            labels: labels,

            datasets: [{

                label: "Tempo (ms)",

                data: tempos,

                borderColor: "#2563eb",

                backgroundColor: "rgba(37, 99, 235, 0.10)",

                borderWidth: 2,

                fill: true,

                tension: 0.3,

                pointRadius: 4
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            scales: {
                y: {
                    beginAtZero: true
                }
            },

            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}


// ======================================================
// CARDS COMPARATIVOS
// ======================================================

function preencherCardsComparativos(dados) {

    const dadosTexto = dados.filter(function(item) {
        return item.tipoCaptcha === "CAPTCHA_TEXTO";
    });

    const dadosDeslizante = dados.filter(function(item) {
        return item.tipoCaptcha === "CAPTCHA_DESLIZANTE";
    });

    const botsTexto = dadosTexto.filter(function(item) {
        return item.tipoUsuario === "BOT_1" || item.tipoUsuario === "BOT_2";
    });

    const botsDeslizante = dadosDeslizante.filter(function(item) {
        return item.tipoUsuario === "BOT_SLIDER_1" || item.tipoUsuario === "BOT_SLIDER_2";
    });

    const humanosTexto = dadosTexto.filter(function(item) {
        return item.tipoUsuario === "HUMANO";
    });

    const humanosDeslizante = dadosDeslizante.filter(function(item) {
        return item.tipoUsuario === "HUMANO";
    });

    const bloqueioTexto = calcularTaxaBloqueio(botsTexto);

    const bloqueioDeslizante = calcularTaxaBloqueio(botsDeslizante);

    const sucessoHumanoTexto = calcularTaxaSucesso(humanosTexto);

    const sucessoHumanoDeslizante = calcularTaxaSucesso(humanosDeslizante);

    const erroHumanoTexto = calcularTaxaErro(humanosTexto);

    const erroHumanoDeslizante = calcularTaxaErro(humanosDeslizante);

    const tempoMedioTexto = calcularTempoMedio(dadosTexto);

    const tempoMedioDeslizante = calcularTempoMedio(dadosDeslizante);

    document.getElementById("bloqueioTexto").textContent = bloqueioTexto.toFixed(2) + "%";

    document.getElementById("sucessoHumanoTexto").textContent = sucessoHumanoTexto.toFixed(2) + "%";

    document.getElementById("erroHumanoTexto").textContent = erroHumanoTexto.toFixed(2) + "%";

    document.getElementById("tempoMedioTexto").textContent = Math.round(tempoMedioTexto) + " ms";

    document.getElementById("bloqueioDeslizante").textContent = bloqueioDeslizante.toFixed(2) + "%";

    document.getElementById("sucessoHumanoDeslizante").textContent = sucessoHumanoDeslizante.toFixed(2) + "%";

    document.getElementById("erroHumanoDeslizante").textContent = erroHumanoDeslizante.toFixed(2) + "%";

    document.getElementById("tempoMedioDeslizante").textContent = Math.round(tempoMedioDeslizante) + " ms";
}


function calcularTaxaBloqueio(bots) {

    if (bots.length === 0) return 0;

    const bloqueados = bots.filter(function(item) {
        return String(item.resultado || "").toUpperCase() === "ERRO";
    }).length;

    return (bloqueados / bots.length) * 100;
}


function calcularTaxaSucesso(humanos) {

    if (humanos.length === 0) return 0;

    const sucessos = humanos.filter(function(item) {
        return String(item.resultado || "").toUpperCase() === "SUCESSO";
    }).length;

    return (sucessos / humanos.length) * 100;
}


function calcularTaxaErro(humanos) {

    if (humanos.length === 0) return 0;

    const erros = humanos.filter(function(item) {
        return String(item.resultado || "").toUpperCase() === "ERRO";
    }).length;

    return (erros / humanos.length) * 100;
}


function calcularTempoMedio(dados) {

    if (dados.length === 0) return 0;

    let soma = 0;

    dados.forEach(function(item) {
        soma += Number(item.tempoMs || 0);
    });

    return soma / dados.length;
}


// ======================================================
// GRÁFICO COMPARATIVO (BAR)
// ======================================================

function criarGraficoComparativo(dados) {

    const canvas = document.getElementById("graficoComparativo");

    if (!canvas) return;

    const tiposBot = ["BOT_1", "BOT_2", "BOT_SLIDER_1", "BOT_SLIDER_2"];

    const labels = [];

    const dataTexto = [];

    const dataDeslizante = [];

    tiposBot.forEach(function(tipoBot) {

        const tentativasBot = dados.filter(function(item) {
            return item.tipoUsuario === tipoBot;
        });

        if (tentativasBot.length > 0) {

            const bloqueio = calcularTaxaBloqueio(tentativasBot);

            labels.push(tipoBot);

            if (tipoBot === "BOT_1" || tipoBot === "BOT_2") {
                dataTexto.push(bloqueio);
                dataDeslizante.push(0);
            } else {
                dataTexto.push(0);
                dataDeslizante.push(bloqueio);
            }
        }
    });

    if (graficoComparativo) {
        graficoComparativo.destroy();
    }

    graficoComparativo = new Chart(canvas, {

        type: "bar",

        data: {

            labels: labels,

            datasets: [

                {
                    label: "CAPTCHA Textual",

                    data: dataTexto,

                    backgroundColor: "#2563eb",

                    borderRadius: 6
                },

                {
                    label: "CAPTCHA Deslizante",

                    data: dataDeslizante,

                    backgroundColor: "#f59e0b",

                    borderRadius: 6
                }
            ]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            scales: {
                y: {
                    beginAtZero: true,

                    max: 100,

                    ticks: {
                        callback: function(value) {
                            return value + "%";
                        }
                    }
                }
            },

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


// ======================================================
// LIMPAR RESULTADOS
// ======================================================

async function limparResultados() {

    if (!confirm("Tem certeza que deseja limpar todos os resultados?")) {
        return;
    }

    try {

        const resposta = await fetch("/api/resultados", {
            method: "DELETE"
        });

        if (!resposta.ok) {
            throw new Error("Erro ao limpar resultados.");
        }

        todosResultados = [];

        aplicarFiltros();

    } catch (erro) {

        console.error("ERRO:", erro);

        alert("Erro ao limpar resultados.");
    }
}


// ======================================================
// INICIAR
// ======================================================

document.addEventListener("DOMContentLoaded", function() {

    carregarResultados();

    document.getElementById("filtroTipoCaptcha").addEventListener("change", aplicarFiltros);

    document.getElementById("filtroTipoUsuario").addEventListener("change", aplicarFiltros);

    document.getElementById("limparResultados").addEventListener("click", limparResultados);
});
