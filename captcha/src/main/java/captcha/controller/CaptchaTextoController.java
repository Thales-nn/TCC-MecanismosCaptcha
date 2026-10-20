package captcha.controller;

import captcha.model.Resultado;
import captcha.service.CaptchaTextoService;
import captcha.service.ResultadoService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@Controller
@RequestMapping("/captcha/texto")
public class CaptchaTextoController {

    private final CaptchaTextoService captchaService;
    private final ResultadoService resultadoService;

    public CaptchaTextoController(CaptchaTextoService captchaService, ResultadoService resultadoService) {
        this.captchaService = captchaService;
        this.resultadoService = resultadoService;
    }

    @GetMapping("")
    public String paginaCaptcha(Model model) {
        String desafioId = captchaService.gerarDesafio();
        model.addAttribute("desafioId", desafioId);
        return "captcha_texto";
    }

    @GetMapping("/api/novo")
    @ResponseBody
    public ResponseEntity<Map<String, String>> novoDesafio() {
        String desafioId = captchaService.gerarDesafio();
        return ResponseEntity.ok(Map.of("desafioId", desafioId));
    }

    @GetMapping("/api/imagem/{desafioId}")
    public ResponseEntity<byte[]> obterImagem(@PathVariable String desafioId) throws IOException {
        byte[] imagem = captchaService.gerarImagem(desafioId);
        if (imagem == null) {
            return ResponseEntity.notFound().build();
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        headers.setCacheControl("no-store, no-cache, must-revalidate");
        headers.setPragma("no-cache");
        return new ResponseEntity<>(imagem, headers, HttpStatus.OK);
    }

    private String traduzirMotivo(String motivo) {
        if (motivo == null) return "Codigo incorreto. Tente novamente.";
        return switch (motivo) {
            case "RESPOSTA_INCORRETA" -> "Codigo incorreto. Tente novamente.";
            case "DESAFIO_EXPIRADO" -> "Desafio expirado. Solicite um novo codigo.";
            case "DESAFIO_JA_USADO" -> "Este desafio ja foi utilizado. Solicite um novo codigo.";
            default -> "Erro na verificacao.";
        };
    }

    @PostMapping("/api/validar")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> validar(@RequestBody Map<String, Object> payload) {
        String desafioId = (String) payload.get("desafioId");
        String resposta = (String) payload.get("resposta");
        String sessaoId = (String) payload.get("sessaoId");
        String tipoUsuario = (String) payload.get("tipoUsuario");
        Integer tentativa = payload.get("tentativa") != null ?
                ((Number) payload.get("tentativa")).intValue() : 1;
        Long tempoMs = payload.get("tempoMs") != null ?
                ((Number) payload.get("tempoMs")).longValue() : null;
        String sessaoExperimental = (String) payload.get("sessaoExperimental");

        CaptchaTextoService.ResultadoValidacao validacao = captchaService.validar(desafioId, resposta);

        Resultado resultado = new Resultado();
        resultado.setDesafioId(desafioId);
        resultado.setSessaoId(sessaoId);
        resultado.setTipoCaptcha("CAPTCHA_TEXTO");
        resultado.setTipoUsuario(tipoUsuario != null ? tipoUsuario : "HUMANO");
        resultado.setTentativa(tentativa);
        resultado.setResultado(validacao.sucesso() ? "SUCESSO" : "ERRO");
        resultado.setMotivoRejeicao(validacao.motivo());
        resultado.setTempoMs(tempoMs);
        resultado.setDataFim(LocalDateTime.now());
        resultado.setSessaoExperimental(sessaoExperimental);

        resultadoService.salvar(resultado);

        String mensagem = validacao.sucesso()
                ? "CAPTCHA verificado com sucesso!"
                : traduzirMotivo(validacao.motivo());

        return ResponseEntity.ok(Map.of(
                "sucesso", validacao.sucesso(),
                "mensagem", mensagem,
                "motivo", validacao.motivo() != null ? validacao.motivo() : "",
                "resultadoId", resultado.getId()
        ));
    }
}
