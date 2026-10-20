(function () {
    'use strict';

    var dados = [];
    var grafResultados = null;
    var grafTempo = null;
    var grafBloqueio = null;

    var filtroTipoUsuario = document.getElementById('filtroTipoUsuario');
    var filtroSessao = document.getElementById('filtroSessao');

    function carregarDados() {
        fetch('/api/resultados?tipoCaptcha=CAPTCHA_TEXTO')
            .then(function (resp) {
                if (!resp.ok) throw new Error('Erro ao carregar dados');
                return resp.json();
            })
            .then(function (resultado) {
                dados = resultado;
                preencherFiltroSessoes();
                atualizar();
            })
            .catch(function (err) {
                console.error('Erro ao carregar resultados:', err);
            });
    }

    function preencherFiltroSessoes() {
        var sessoes = {};
        for (var i = 0; i < dados.length; i++) {
            var s = dados[i].sessaoExperimental || dados[i].sessaoId;
            if (s) sessoes[s] = true;
        }

        filtroSessao.innerHTML = '<option value="TODOS">Todas</option>';
        var keys = Object.keys(sessoes).sort();
        for (var j = 0; j < keys.length; j++) {
            var opt = document.createElement('option');
            opt.value = keys[j];
            opt.textContent = keys[j];
            filtroSessao.appendChild(opt);
        }
    }

    function filtrar() {
        var tipo = filtroTipoUsuario.value;
        var sessao = filtroSessao.value;

        return dados.filter(function (d) {
            if (tipo !== 'TODOS' && d.tipoUsuario !== tipo) return false;
            if (sessao !== 'TODOS') {
                var ds = d.sessaoExperimental || d.sessaoId;
                if (ds !== sessao) return false;
            }
            return true;
        });
    }

    function calcularMetricas(lista) {
        var total = lista.length;
        var humanos = lista.filter(function (d) { return d.tipoUsuario === 'HUMANO'; });
        var bots = lista.filter(function (d) { return d.tipoUsuario !== 'HUMANO'; });

        var humanosOk = humanos.filter(function (d) { return d.resultado === 'SUCESSO'; });
        var humanosErro = humanos.filter(function (d) { return d.resultado !== 'SUCESSO'; });
        var botsBloqueados = bots.filter(function (d) { return d.resultado !== 'SUCESSO'; });
        var botsEvadiram = bots.filter(function (d) { return d.resultado === 'SUCESSO'; });

        var taxaBloqueio = bots.length > 0 ? (botsBloqueados.length / bots.length) * 100 : 0;
        var taxaEvasao = bots.length > 0 ? (botsEvadiram.length / bots.length) * 100 : 0;
        var taxaSucessoHumano = humanos.length > 0 ? (humanosOk.length / humanos.length) * 100 : 0;
        var taxaErroHumano = humanos.length > 0 ? (humanosErro.length / humanos.length) * 100 : 0;

        var tempos = lista.map(function (d) { return d.tempoMs || 0; }).filter(function (t) { return t > 0; });
        var tempoMedio = 0;
        var desvioPadrao = 0;

        if (tempos.length > 0) {
            var soma = 0;
            for (var i = 0; i < tempos.length; i++) soma += tempos[i];
            tempoMedio = soma / tempos.length;

            var somaQuad = 0;
            for (var j = 0; j < tempos.length; j++) {
                somaQuad += Math.pow(tempos[j] - tempoMedio, 2);
            }
            desvioPadrao = Math.sqrt(somaQuad / tempos.length);
        }

        return {
            total: total,
            taxaBloqueio: taxaBloqueio,
            taxaEvasao: taxaEvasao,
            taxaSucessoHumano: taxaSucessoHumano,
            taxaErroHumano: taxaErroHumano,
            tempoMedio: tempoMedio,
            desvioPadrao: desvioPadrao,
            humanos: humanos,
            bots: bots,
            humanosOk: humanosOk,
            humanosErro: humanosErro,
            botsBloqueados: botsBloqueados,
            botsEvadiram: botsEvadiram
        };
    }

    function calcularMetricasBot(lista, tipoBot) {
        var botDados = lista.filter(function (d) { return d.tipoUsuario === tipoBot; });
        var total = botDados.length;
        var bloqueados = botDados.filter(function (d) { return d.resultado !== 'SUCESSO'; });
        var evadiram = botDados.filter(function (d) { return d.resultado === 'SUCESSO'; });

        var tempos = botDados.map(function (d) { return d.tempoMs || 0; }).filter(function (t) { return t > 0; });
        var tempoMedio = 0;
        if (tempos.length > 0) {
            var soma = 0;
            for (var i = 0; i < tempos.length; i++) soma += tempos[i];
            tempoMedio = soma / tempos.length;
        }

        return {
            total: total,
            taxaBloqueio: total > 0 ? (bloqueados.length / total) * 100 : 0,
            taxaEvasao: total > 0 ? (evadiram.length / total) * 100 : 0,
            tempoMedio: tempoMedio
        };
    }

    function atualizarCards(m) {
        document.getElementById('total').textContent = m.total;
        document.getElementById('taxaBloqueio').textContent = m.bots.length > 0 ? m.taxaBloqueio.toFixed(1) + '%' : '-';
        document.getElementById('taxaEvasao').textContent = m.bots.length > 0 ? m.taxaEvasao.toFixed(1) + '%' : '-';
        document.getElementById('sucessoHumano').textContent = m.humanos.length > 0 ? m.taxaSucessoHumano.toFixed(1) + '%' : '-';
        document.getElementById('erroHumano').textContent = m.humanos.length > 0 ? m.taxaErroHumano.toFixed(1) + '%' : '-';
        document.getElementById('tempoMedio').textContent = m.total > 0 ? Math.round(m.tempoMedio) + ' ms' : '-';
        document.getElementById('desvioPadrao').textContent = m.total > 0 ? Math.round(m.desvioPadrao) + ' ms' : '-';
    }

    function atualizarComparativoBots(lista) {
        var b1 = calcularMetricasBot(lista, 'BOT_1');
        var b2 = calcularMetricasBot(lista, 'BOT_2');

        document.getElementById('bot1Total').textContent = b1.total;
        document.getElementById('bot1Bloqueio').textContent = b1.total > 0 ? b1.taxaBloqueio.toFixed(1) + '%' : '-';
        document.getElementById('bot1Evasao').textContent = b1.total > 0 ? b1.taxaEvasao.toFixed(1) + '%' : '-';
        document.getElementById('bot1Tempo').textContent = b1.total > 0 ? Math.round(b1.tempoMedio) + ' ms' : '-';

        document.getElementById('bot2Total').textContent = b2.total;
        document.getElementById('bot2Bloqueio').textContent = b2.total > 0 ? b2.taxaBloqueio.toFixed(1) + '%' : '-';
        document.getElementById('bot2Evasao').textContent = b2.total > 0 ? b2.taxaEvasao.toFixed(1) + '%' : '-';
        document.getElementById('bot2Tempo').textContent = b2.total > 0 ? Math.round(b2.tempoMedio) + ' ms' : '-';
    }

    function atualizarGraficoResultados(lista) {
        var sucessos = lista.filter(function (d) { return d.resultado === 'SUCESSO'; }).length;
        var erros = lista.length - sucessos;

        var ctx = document.getElementById('graficoResultados').getContext('2d');

        if (grafResultados) grafResultados.destroy();

        grafResultados = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Sucesso', 'Erro'],
                datasets: [{
                    data: [sucessos, erros],
                    backgroundColor: ['#27ae60', '#e74c3c'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    function atualizarGraficoTempo(lista) {
        var labels = [];
        var tempos = [];
        var cores = [];

        for (var i = 0; i < lista.length; i++) {
            labels.push('#' + (lista[i].tentativa || (i + 1)));
            tempos.push(lista[i].tempoMs || 0);
            cores.push(lista[i].resultado === 'SUCESSO' ? '#27ae60' : '#e74c3c');
        }

        var ctx = document.getElementById('graficoTempo').getContext('2d');

        if (grafTempo) grafTempo.destroy();

        grafTempo = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tempo (ms)',
                    data: tempos,
                    backgroundColor: cores,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Tempo (ms)' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    function atualizarGraficoBloqueio(lista) {
        var b1 = calcularMetricasBot(lista, 'BOT_1');
        var b2 = calcularMetricasBot(lista, 'BOT_2');

        var ctx = document.getElementById('graficoBloqueio').getContext('2d');

        if (grafBloqueio) grafBloqueio.destroy();

        grafBloqueio = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['BOT_1 (OCR basico)', 'BOT_2 (OCR avancado)'],
                datasets: [
                    {
                        label: 'Taxa de bloqueio (%)',
                        data: [b1.taxaBloqueio, b2.taxaBloqueio],
                        backgroundColor: '#e74c3c',
                        borderRadius: 4
                    },
                    {
                        label: 'Taxa de evasao (%)',
                        data: [b1.taxaEvasao, b2.taxaEvasao],
                        backgroundColor: '#f39c12',
                        borderRadius: 4
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
                        title: { display: true, text: 'Percentual (%)' }
                    }
                },
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    function atualizarTabela(lista) {
        var tbody = document.getElementById('tabelaResultados');
        tbody.innerHTML = '';

        for (var i = 0; i < lista.length; i++) {
            var d = lista[i];
            var tr = document.createElement('tr');

            var tdTent = document.createElement('td');
            tdTent.textContent = d.tentativa || (i + 1);

            var tdRes = document.createElement('td');
            var badge = document.createElement('span');
            badge.textContent = d.resultado || '-';
            badge.className = 'badge ' + (d.resultado === 'SUCESSO' ? 'badge-sucesso' : 'badge-erro');
            tdRes.appendChild(badge);

            var tdMotivo = document.createElement('td');
            tdMotivo.textContent = d.motivoRejeicao || '-';

            var tdTempo = document.createElement('td');
            tdTempo.textContent = d.tempoMs ? d.tempoMs + ' ms' : '-';

            var tdPart = document.createElement('td');
            tdPart.textContent = d.tipoUsuario || '-';

            var tdSessao = document.createElement('td');
            tdSessao.textContent = d.sessaoExperimental || d.sessaoId || '-';

            tr.appendChild(tdTent);
            tr.appendChild(tdRes);
            tr.appendChild(tdMotivo);
            tr.appendChild(tdTempo);
            tr.appendChild(tdPart);
            tr.appendChild(tdSessao);
            tbody.appendChild(tr);
        }
    }

    function atualizar() {
        var lista = filtrar();
        var metricas = calcularMetricas(lista);

        atualizarCards(metricas);
        atualizarComparativoBots(lista);
        atualizarGraficoResultados(lista);
        atualizarGraficoTempo(lista);
        atualizarGraficoBloqueio(lista);
        atualizarTabela(lista);
    }

    filtroTipoUsuario.addEventListener('change', atualizar);
    filtroSessao.addEventListener('change', atualizar);

    carregarDados();
})();
