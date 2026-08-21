package captcha.controller;

import captcha.model.resultado;
import captcha.repository.ResultadoRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resultados")
public class ResultadoController {

    private final ResultadoRepository repository;

    public ResultadoController(
            ResultadoRepository repository) {

        this.repository = repository;
    }

    @GetMapping
    public List<resultado> listar(
            @RequestParam(required = false)
            String sessaoId) {

        if (sessaoId != null && !sessaoId.isEmpty()) {

            return repository.findBySessaoId(sessaoId);
        }

        return repository.findAll();
    }

    @PostMapping
    public resultado salvar(
            @RequestBody resultado resultado) {

        return repository.save(resultado);
    }
}