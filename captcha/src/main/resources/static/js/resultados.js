// ======================================================
// CARREGAR RESULTADOS
// ======================================================

async function carregarResultados() {

    try {

        const sessaoId =
            sessionStorage.getItem(
                "sessaoCaptcha"
            );


        let url =
            "/api/resultados";


        if (sessaoId) {

            url +=
                "?sessaoId=" +
                encodeURIComponent(sessaoId);
        }


        const resposta =
            await fetch(url);


        if (!resposta.ok) {

            throw new Error(
                "Erro ao buscar resultados."
            );
        }


        const dados =
            await resposta.json();


        console.log(
            "Resultados recebidos:",
            dados
        );


        calcularMetricas(dados);


        preencherTabela(dados);


        criarGraficoResultados(dados);


        criarGraficoTempo(dados);


    } catch (erro) {

        console.error(
            "ERRO:",
            erro
        );

    }
}


// ======================================================
// MÉTRICAS
// ======================================================

function calcularMetricas(dados) {

    const total =
        dados.length;


    const sucessos =
        dados.filter(
            function(item) {

                return String(
                    item.resultado || ""
                ).toUpperCase() === "SUCESSO";

            }
        ).length;


    const erros =
        dados.filter(
            function(item) {

                return String(
                    item.resultado || ""
                ).toUpperCase() === "ERRO";

            }
        ).length;


    let somaTempo = 0;


    dados.forEach(
        function(item) {

            somaTempo +=
                Number(
                    item.tempoMs || 0
                );

        }
    );


    const tempoMedio =
        total > 0
            ? somaTempo / total
            : 0;


    const taxa =
        total > 0
            ? (sucessos / total) * 100
            : 0;


    document.getElementById(
        "total"
    ).textContent = total;


    document.getElementById(
        "sucessos"
    ).textContent = sucessos;


    document.getElementById(
        "erros"
    ).textContent = erros;


    document.getElementById(
        "taxaSucesso"
    ).textContent =
        taxa.toFixed(2) + "%";


    document.getElementById(
        "tempoMedio"
    ).textContent =
        Math.round(tempoMedio) + " ms";
}


// ======================================================
// TABELA
// ======================================================

function preencherTabela(dados) {

    const tabela =
        document.getElementById(
            "tabelaResultados"
        );


    tabela.innerHTML = "";


    if (dados.length === 0) {

        tabela.innerHTML = `
            <tr>
                <td colspan="4">
                    Nenhuma tentativa registrada.
                </td>
            </tr>
        `;

        return;
    }


    dados.forEach(
        function(item, index) {

            const linha =
                document.createElement("tr");


            const resultado =
                String(
                    item.resultado || ""
                ).toUpperCase();


            const sucesso =
                resultado === "SUCESSO";


            const tentativa =
                item.tentativa ||
                index + 1;


            const tempo =
                Number(
                    item.tempoMs || 0
                );


            const tipoUsuario =
                item.tipoUsuario ||
                "HUMANO";


            linha.innerHTML = `

                <td>
                    #${tentativa}
                </td>

                <td>

                    <span
                        style="
                            display:inline-block;
                            padding:6px 12px;
                            border-radius:20px;
                            font-weight:bold;
                            background:${sucesso
                                ? "#dcfce7"
                                : "#fee2e2"};
                            color:${sucesso
                                ? "#15803d"
                                : "#b91c1c"};
                        ">

                        ${sucesso
                            ? "✓ Sucesso"
                            : "✕ Erro"}

                    </span>

                </td>

                <td>
                    ${tempo} ms
                </td>

                <td>
                    ${tipoUsuario}
                </td>

            `;


            tabela.appendChild(
                linha
            );
        }
    );
}


// ======================================================
// GRÁFICO DE RESULTADOS
// ======================================================

let graficoResultados = null;


function criarGraficoResultados(dados) {

    const canvas =
        document.getElementById(
            "graficoResultados"
        );


    if (!canvas) {
        return;
    }


    let sucessos = 0;

    let erros = 0;


    dados.forEach(
        function(item) {

            if (
                String(
                    item.resultado || ""
                ).toUpperCase() === "SUCESSO"
            ) {

                sucessos++;

            } else {

                erros++;
            }

        }
    );


    if (graficoResultados) {

        graficoResultados.destroy();
    }


    graficoResultados =
        new Chart(
            canvas,
            {

                type: "doughnut",

                data: {

                    labels: [
                        "Sucessos",
                        "Erros"
                    ],

                    datasets: [

                        {

                            data: [
                                sucessos,
                                erros
                            ],

                            backgroundColor: [
                                "#2563eb",
                                "#e5e7eb"
                            ],

                            borderWidth: 0
                        }

                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    cutout: "70%",

                    plugins: {

                        legend: {

                            position:
                                "bottom"
                        }
                    }
                }
            }
        );
}


// ======================================================
// GRÁFICO DE TEMPO
// ======================================================

let graficoTempo = null;


function criarGraficoTempo(dados) {

    const canvas =
        document.getElementById(
            "graficoTempo"
        );


    if (!canvas) {
        return;
    }


    if (graficoTempo) {

        graficoTempo.destroy();
    }


    const labels =
        dados.map(
            function(item, index) {

                return "#" +
                    (
                        item.tentativa ||
                        index + 1
                    );

            }
        );


    const tempos =
        dados.map(
            function(item) {

                return Number(
                    item.tempoMs || 0
                );

            }
        );


    graficoTempo =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Tempo (ms)",

                            data:
                                tempos,

                            borderColor:
                                "#2563eb",

                            backgroundColor:
                                "rgba(37, 99, 235, 0.10)",

                            borderWidth: 2,

                            fill: true,

                            tension: 0.3,

                            pointRadius: 4
                        }

                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

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
            }
        );
}


// ======================================================
// INICIAR
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        carregarResultados();

    }
);