(function () {
    'use strict';

    var dados = [];
    var grafResultados = null;
    var grafTempo = null;
    var grafBloqueio = null;
    var grafMotivos = null;

    var filtroTipoUsuario = document.getElementById('filtroTipoUsuario');
    var filtroSessao = document.getElementById('filtroSessao');

    function carregarDados() {
        fetch('/api/resultados?tipoCaptcha=CAPTCHA_DESLIZANTE')
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

    function parsearMetricas(d) {
        if (!d.metricasComportamentais) return null;
        try {
            if (typeof d.metricasComportamentais === 'string') {
                return JSON.parse(d.metricasComportamentais);
            }
            return d.metricasComportamentais;
        } catch (e) {
            return null;
        }
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
            bots: bots
        };
    }

    function calcularMetricasComportamentais(lista) {
        var velocidades = [];
        var direcoes = [];
        var micros = [];
        var armadilhas = 0;
        var comMetricas = 0;

        for (var i = 0; i < lista.length; i++) {
            var m = parsearMetricas(lista[i]);
            if (!m) continue;
            comMetricas++;

            if (typeof m.velocidadeMedia === 'number') velocidades.push(m.velocidadeMedia);
            if (typeof m.mudancasDirecao === 'number') direcoes.push(m.mudancasDirecao);
            if (typeof m.microAjustes === 'number') micros.push(m.microAjustes);
            if (m.armadilhaAtivada === true) armadilhas++;
        }

        function media(arr) {
            if (arr.length === 0) return 0;
            var s = 0;
            for (var k = 0; k < arr.length; k++) s += arr[k];
            return s / arr.length;
        }

        return {
            velMedia: media(velocidades),
            mudancasDirecao: media(direcoes),
            microAjustes: media(micros),
            freqArmadilha: comMetricas > 0 ? (armadilhas / comMetricas) * 100 : 0,
            comMetricas: comMetricas
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

        var comp = calcularMetricasComportamentais(botDados);

        return {
            total: total,
            taxaBloqueio: total > 0 ? (bloqueados.length / total) * 100 : 0,
            taxaEvasao: total > 0 ? (evadiram.length / total) * 100 : 0,
            tempoMedio: tempoMedio,
            freqArmadilha: comp.freqArmadilha
        };
    }

    function contarMotivos(lista) {
        var motivos = {};
        for (var i = 0; i < lista.length; i++) {
            if (lista[i].resultado !== 'SUCESSO') {
                var motivo = lista[i].motivoRejeicao || 'Desconhecido';
                motivos[motivo] = (motivos[motivo] || 0) + 1;
            }
        }
        return motivos;
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

    function atualizarMetricasComportamentais(lista) {
        var mc = calcularMetricasComportamentais(lista);

        document.getElementById('velMedia').textContent = mc.comMetricas > 0 ? mc.velMedia.toFixed(4) + ' %/ms' : '-';
        document.getElementById('mudancasDir').textContent = mc.comMetricas > 0 ? mc.mudancasDirecao.toFixed(1) : '-';
        document.getElementById('microAjustes').textContent = mc.comMetricas > 0 ? mc.microAjustes.toFixed(1) : '-';
        document.getElementById('freqArmadilha').textContent = mc.comMetricas > 0 ? mc.freqArmadilha.toFixed(1) + '%' : '-';
    }

    function atualizarComparativoBots(lista) {
        var b1 = calcularMetricasBot(lista, 'BOT_SLIDER_1');
        var b2 = calcularMetricasBot(lista, 'BOT_SLIDER_2');

        document.getElementById('bot1Total').textContent = b1.total;
        document.getElementById('bot1Bloqueio').textContent = b1.total > 0 ? b1.taxaBloqueio.toFixed(1) + '%' : '-';
        document.getElementById('bot1Evasao').textContent = b1.total > 0 ? b1.taxaEvasao.toFixed(1) + '%' : '-';
        document.getElementById('bot1Tempo').textContent = b1.total > 0 ? Math.round(b1.tempoMedio) + ' ms' : '-';
        document.getElementById('bot1Armadilha').textContent = b1.total > 0 ? b1.freqArmadilha.toFixed(1) + '%' : '-';

        document.getElementById('bot2Total').textContent = b2.total;
        document.getElementById('bot2Bloqueio').textContent = b2.total > 0 ? b2.taxaBloqueio.toFixed(1) + '%' : '-';
        document.getElementById('bot2Evasao').textContent = b2.total > 0 ? b2.taxaEvasao.toFixed(1) + '%' : '-';
        document.getElementById('bot2Tempo').textContent = b2.total > 0 ? Math.round(b2.tempoMedio) + ' ms' : '-';
        document.getElementById('bot2Armadilha').textContent = b2.total > 0 ? b2.freqArmadilha.toFixed(1) + '%' : '-';
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
        var b1 = calcularMetricasBot(lista, 'BOT_SLIDER_1');
        var b2 = calcularMetricasBot(lista, 'BOT_SLIDER_2');

        var ctx = document.getElementById('graficoBloqueio').getContext('2d');

        if (grafBloqueio) grafBloqueio.destroy();

        grafBloqueio = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['BOT_SLIDER_1 (simples)', 'BOT_SLIDER_2 (avancado)'],
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

    function atualizarGraficoMotivos(lista) {
        var motivos = contarMotivos(lista);
        var labels = Object.keys(motivos);
        var valores = labels.map(function (l) { return motivos[l]; });

        var coresMotivos = [
            '#e74c3c', '#f39c12', '#9b59b6', '#3498db',
            '#1abc9c', '#e67e22', '#2c3e50', '#c0392b'
        ];

        var ctx = document.getElementById('graficoMotivos').getContext('2d');

        if (grafMotivos) grafMotivos.destroy();

        if (labels.length === 0) {
            grafMotivos = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Sem dados'],
                    datasets: [{ data: [1], backgroundColor: ['#ddd'], borderWidth: 0 }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
            return;
        }

        grafMotivos = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: valores,
                    backgroundColor: coresMotivos.slice(0, labels.length),
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

    function atualizarTabela(lista) {
        var tbody = document.getElementById('tabelaResultados');
        tbody.innerHTML = '';

        for (var i = 0; i < lista.length; i++) {
            var d = lista[i];
            var mc = parsearMetricas(d);
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

            var tdArm = document.createElement('td');
            if (mc && typeof mc.armadilhaAtivada === 'boolean') {
                var armBadge = document.createElement('span');
                armBadge.textContent = mc.armadilhaAtivada ? 'Sim' : 'Nao';
                armBadge.className = 'badge ' + (mc.armadilhaAtivada ? 'badge-erro' : 'badge-sucesso');
                tdArm.appendChild(armBadge);
            } else {
                tdArm.textContent = '-';
            }

            var tdSessao = document.createElement('td');
            tdSessao.textContent = d.sessaoExperimental || d.sessaoId || '-';

            tr.appendChild(tdTent);
            tr.appendChild(tdRes);
            tr.appendChild(tdMotivo);
            tr.appendChild(tdTempo);
            tr.appendChild(tdPart);
            tr.appendChild(tdArm);
            tr.appendChild(tdSessao);
            tbody.appendChild(tr);
        }
    }

    function atualizar() {
        var lista = filtrar();
        var metricas = calcularMetricas(lista);

        atualizarCards(metricas);
        atualizarMetricasComportamentais(lista);
        atualizarComparativoBots(lista);
        atualizarGraficoResultados(lista);
        atualizarGraficoTempo(lista);
        atualizarGraficoBloqueio(lista);
        atualizarGraficoMotivos(lista);
        atualizarTabela(lista);
    }

    filtroTipoUsuario.addEventListener('change', atualizar);
    filtroSessao.addEventListener('change', atualizar);

    carregarDados();
})();
