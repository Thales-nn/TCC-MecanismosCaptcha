package captcha.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class LoginController {

    @GetMapping("/")
    public String login() {
        return "login";
    }

    @PostMapping("/login")
    public String verificarLogin(
            @RequestParam String usuario,
            @RequestParam String senha,
            Model model) {

        if (usuario.equals("admin") && senha.equals("1234")) {
            return "redirect:/captcha";
        }

        model.addAttribute(
                "erro",
                "Usuário ou senha incorretos!"
        );

        return "login";
    }

    @GetMapping("/captcha")
    public String captcha() {
        return "captcha";
    }

    @GetMapping("/resultados")
    public String resultados() {
        return "resultados";
    }
}