package captcha.controller;

import captcha.service.ResultadoService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/dashboard")
public class DashboardController {

    private final ResultadoService resultadoService;

    public DashboardController(ResultadoService resultadoService) {
        this.resultadoService = resultadoService;
    }

    @GetMapping("/texto")
    public String dashboardTexto(Model model) {
        model.addAttribute("tipoCaptcha", "CAPTCHA_TEXTO");
        model.addAttribute("sessoesExperimentais", resultadoService.listarSessoesExperimentais());
        return "dashboard_texto";
    }

    @GetMapping("/slider")
    public String dashboardSlider(Model model) {
        model.addAttribute("tipoCaptcha", "CAPTCHA_DESLIZANTE");
        model.addAttribute("sessoesExperimentais", resultadoService.listarSessoesExperimentais());
        return "dashboard_slider";
    }
}
