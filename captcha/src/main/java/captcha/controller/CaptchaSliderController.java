package captcha.controller;

import captcha.model.Resultado;
import captcha.service.CaptchaSliderService;
import captcha.service.ResultadoService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@Controller
@RequestMapping("/captcha/slider")
public class CaptchaSliderController {

    private final CaptchaSliderService sliderService;
    private final ResultadoService resultadoService;
    private final ObjectMapper objectMapper;

    public CaptchaSliderController(CaptchaSliderService sliderService, ResultadoService resultadoService, ObjectMapper objectMapper) {
        this.sliderService = sliderService;
        this.resultadoService = resultadoService;
        this.objectMapper = objectMapper;
    }

    @GetMapping("")
    public String paginaSlider(Model model) {
        Map<String, Object> desafio = sliderService.gerarDesafio();
        model.addAttribute("desafioId", desafio.get("desafioId"));
        model.addAttribute("zonaInicio", desafio.get("zonaInicio"));
        model.addAttribute("zonaFim", desafio.get("zonaFim"));
        model.addAttribute("armadilhaInicio", desafio.get("armadilhaInicio"));
        model.addAttribute("armadilhaFim", desafio.get("armadilhaFim"));
        return "captcha_slider";
    }

    @GetMapping("/api/novo")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> novoDesafio() {
        return ResponseEntity.ok(sliderService.gerarDesafio());
    }

    @PostMapping("/api/entrada-zona")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> registrarEntradaZona(@RequestBody Map<String, String> payload) {
        String desafioId = payload.get("desafioId");
        boolean ok = sliderService.registrarEntradaZona(desafioId);
        return ResponseEntity.ok(Map.of("registrado", ok));
    }

    private String traduzirMotivoSlider(String motivo) {
        if (motivo == null) return "Verificacao falhou. Tente novamente.";
        return switch (motivo) {
            case "ARMADILHA_ACIONADA" -> "Voce tocou na zona vermelha! Tente novamente.";
            case "TEMPO_MINIMO_NAO_ATINGIDO" -> "Aguarde 2 segundos na area verde antes de validar.";
            case "POSICAO_FORA_ZONA" -> "Solte o controle dentro da area verde.";
            case "DESAFIO_EXPIRADO" -> "Desafio expirado. Solicite um novo.";
            case "DESAFIO_JA_USADO" -> "Este desafio ja foi utilizado.";
            default -> "Verificacao falhou. Tente novamente.";
        };
    }

    @PostMapping("/api/validar")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> validar(@RequestBody Map<String, Object> payload) {
        String desafioId = (String) payload.get("desafioId");
        double posicaoFinal = payload.get("posicaoFinal") != null ?
                ((Number) payload.get("posicaoFinal")).doubleValue() : 0;
        String sessaoId = (String) payload.get("sessaoId");
        String tipoUsuario = (String) payload.get("tipoUsuario");
        Integer tentativa = payload.get("tentativa") != null ?
                ((Number) payload.get("tentativa")).intValue() : 1;
        Long tempoMs = payload.get("tempoMs") != null ?
                ((Number) payload.get("tempoMs")).longValue() : null;
        String sessaoExperimental = (String) payload.get("sessaoExperimental");

        String metricasJson = null;
        Double velocidadeMedia = null;
        Double velocidadeMaxima = null;
        Integer mudancasDirecao = null;
        Integer microAjustes = null;

        Object metricasObj = payload.get("metricasComportamentais");
        if (metricasObj instanceof Map<?, ?> metricasMap) {
            try {
                metricasJson = objectMapper.writeValueAsString(metricasMap);
            } catch (JsonProcessingException e) {
                metricasJson = metricasMap.toString();
            }
            Object vm = metricasMap.get("velocidadeMedia");
            if (vm instanceof Number n) velocidadeMedia = n.doubleValue();
            Object vx = metricasMap.get("velocidadeMaxima");
            if (vx instanceof Number n) velocidadeMaxima = n.doubleValue();
            Object md = metricasMap.get("mudancasDirecao");
            if (md instanceof Number n) mudancasDirecao = n.intValue();
            Object ma = metricasMap.get("microAjustes");
            if (ma instanceof Number n) microAjustes = n.intValue();
        } else if (metricasObj instanceof String s) {
            metricasJson = s;
        }

        CaptchaSliderService.ResultadoValidacao validacao = sliderService.validar(desafioId, posicaoFinal);

        String resultadoStr;
        if (validacao.sucesso()) {
            resultadoStr = "SUCESSO";
        } else if ("ARMADILHA_ACIONADA".equals(validacao.motivo())) {
            resultadoStr = "ARMADILHA";
        } else if ("TEMPO_MINIMO_NAO_ATINGIDO".equals(validacao.motivo())) {
            resultadoStr = "TEMPO_MINIMO";
        } else if ("DESAFIO_EXPIRADO".equals(validacao.motivo())) {
            resultadoStr = "EXPIRADO";
        } else {
            resultadoStr = "ERRO";
        }

        Resultado resultado = new Resultado();
        resultado.setDesafioId(desafioId);
        resultado.setSessaoId(sessaoId);
        resultado.setTipoCaptcha("CAPTCHA_DESLIZANTE");
        resultado.setTipoUsuario(tipoUsuario != null ? tipoUsuario : "HUMANO");
        resultado.setTentativa(tentativa);
        resultado.setResultado(resultadoStr);
        resultado.setMotivoRejeicao(validacao.motivo());
        resultado.setTempoMs(tempoMs);
        resultado.setDataFim(LocalDateTime.now());
        resultado.setArmadilhaAcionada(validacao.armadilhaAcionada());
        resultado.setPosicaoFinal(posicaoFinal);
        resultado.setPosicaoAlvo(validacao.posicaoAlvo());
        resultado.setMetricasComportamentais(metricasJson);
        resultado.setVelocidadeMedia(velocidadeMedia);
        resultado.setVelocidadeMaxima(velocidadeMaxima);
        resultado.setMudancasDirecao(mudancasDirecao);
        resultado.setMicroAjustes(microAjustes);
        resultado.setSessaoExperimental(sessaoExperimental);

        resultadoService.salvar(resultado);

        String mensagem = validacao.sucesso()
                ? "CAPTCHA verificado com sucesso!"
                : traduzirMotivoSlider(validacao.motivo());

        return ResponseEntity.ok(Map.of(
                "sucesso", validacao.sucesso(),
                "mensagem", mensagem,
                "motivo", validacao.motivo() != null ? validacao.motivo() : "",
                "armadilhaAcionada", validacao.armadilhaAcionada(),
                "resultadoId", resultado.getId()
        ));
    }
}
