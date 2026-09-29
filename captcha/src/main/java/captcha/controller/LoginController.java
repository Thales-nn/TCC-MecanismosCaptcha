package captcha.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import jakarta.servlet.http.HttpServletRequest;
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

    @GetMapping("/captcha-slider")
    public String captchaSlider() {
        return "captcha_slider";
    }

    @GetMapping("/resultados")
    public String resultados() {
        return "resultados";
    }

    @PostMapping("/logout")
    public String logout(HttpServletRequest request) {
        request.getSession().invalidate();
        return "redirect:/";
    }
}