package captcha.controller;

import captcha.model.Usuario;
import captcha.repository.UsuarioRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Optional;

@Controller
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/login/texto")
    public String loginTextoPage() {
        return "login_texto";
    }

    @GetMapping("/login/slider")
    public String loginSliderPage() {
        return "login_slider";
    }

    @PostMapping("/login/texto")
    public String loginTexto(@RequestParam String username,
                             @RequestParam String senha,
                             HttpSession session,
                             Model model) {
        if (autenticar(username, senha, session)) {
            return "redirect:/captcha/texto";
        }
        model.addAttribute("erro", "Usuário ou senha inválidos");
        return "login_texto";
    }

    @PostMapping("/login/slider")
    public String loginSlider(@RequestParam String username,
                              @RequestParam String senha,
                              HttpSession session,
                              Model model) {
        if (autenticar(username, senha, session)) {
            return "redirect:/captcha/slider";
        }
        model.addAttribute("erro", "Usuário ou senha inválidos");
        return "login_slider";
    }

    @PostMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/";
    }

    @GetMapping("/logout")
    public String logoutGet(HttpSession session) {
        session.invalidate();
        return "redirect:/";
    }

    private boolean autenticar(String username, String senha, HttpSession session) {
        Optional<Usuario> usuario = usuarioRepository.findByUsername(username);
        if (usuario.isPresent() && usuario.get().isAtivo()
                && encoder.matches(senha, usuario.get().getSenha())) {
            session.setAttribute("usuarioLogado", username);
            return true;
        }
        return false;
    }
}
