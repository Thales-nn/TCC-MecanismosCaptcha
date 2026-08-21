package captcha.repository;

import captcha.model.resultado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResultadoRepository
        extends JpaRepository<resultado, Integer> {

    List<resultado> findBySessaoId(String sessaoId);

}