package captcha.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resultados")
public class Resultado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String desafioId;

    private String sessaoId;

    private String tipoCaptcha;

    private String tipoUsuario;

    private Integer tentativa;

    private String resultado;

    private String motivoRejeicao;

    private Long tempoMs;

    private LocalDateTime dataInicio;

    private LocalDateTime dataFim;

    private Boolean armadilhaAcionada;

    private Double posicaoFinal;

    private Double posicaoAlvo;

    @Column(columnDefinition = "TEXT")
    private String metricasComportamentais;

    private Double velocidadeMedia;

    private Double velocidadeMaxima;

    private Integer mudancasDirecao;

    private Integer microAjustes;

    private String sessaoExperimental;

    @Column(columnDefinition = "TEXT")
    private String parametrosExperimentais;


    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDesafioId() { return desafioId; }
    public void setDesafioId(String desafioId) { this.desafioId = desafioId; }

    public String getSessaoId() { return sessaoId; }
    public void setSessaoId(String sessaoId) { this.sessaoId = sessaoId; }

    public String getTipoCaptcha() { return tipoCaptcha; }
    public void setTipoCaptcha(String tipoCaptcha) { this.tipoCaptcha = tipoCaptcha; }

    public String getTipoUsuario() { return tipoUsuario; }
    public void setTipoUsuario(String tipoUsuario) { this.tipoUsuario = tipoUsuario; }

    public Integer getTentativa() { return tentativa; }
    public void setTentativa(Integer tentativa) { this.tentativa = tentativa; }

    public String getResultado() { return resultado; }
    public void setResultado(String resultado) { this.resultado = resultado; }

    public String getMotivoRejeicao() { return motivoRejeicao; }
    public void setMotivoRejeicao(String motivoRejeicao) { this.motivoRejeicao = motivoRejeicao; }

    public Long getTempoMs() { return tempoMs; }
    public void setTempoMs(Long tempoMs) { this.tempoMs = tempoMs; }

    public LocalDateTime getDataInicio() { return dataInicio; }
    public void setDataInicio(LocalDateTime dataInicio) { this.dataInicio = dataInicio; }

    public LocalDateTime getDataFim() { return dataFim; }
    public void setDataFim(LocalDateTime dataFim) { this.dataFim = dataFim; }

    public Boolean getArmadilhaAcionada() { return armadilhaAcionada; }
    public void setArmadilhaAcionada(Boolean armadilhaAcionada) { this.armadilhaAcionada = armadilhaAcionada; }

    public Double getPosicaoFinal() { return posicaoFinal; }
    public void setPosicaoFinal(Double posicaoFinal) { this.posicaoFinal = posicaoFinal; }

    public Double getPosicaoAlvo() { return posicaoAlvo; }
    public void setPosicaoAlvo(Double posicaoAlvo) { this.posicaoAlvo = posicaoAlvo; }

    public String getMetricasComportamentais() { return metricasComportamentais; }
    public void setMetricasComportamentais(String metricasComportamentais) { this.metricasComportamentais = metricasComportamentais; }

    public Double getVelocidadeMedia() { return velocidadeMedia; }
    public void setVelocidadeMedia(Double velocidadeMedia) { this.velocidadeMedia = velocidadeMedia; }

    public Double getVelocidadeMaxima() { return velocidadeMaxima; }
    public void setVelocidadeMaxima(Double velocidadeMaxima) { this.velocidadeMaxima = velocidadeMaxima; }

    public Integer getMudancasDirecao() { return mudancasDirecao; }
    public void setMudancasDirecao(Integer mudancasDirecao) { this.mudancasDirecao = mudancasDirecao; }

    public Integer getMicroAjustes() { return microAjustes; }
    public void setMicroAjustes(Integer microAjustes) { this.microAjustes = microAjustes; }

    public String getSessaoExperimental() { return sessaoExperimental; }
    public void setSessaoExperimental(String sessaoExperimental) { this.sessaoExperimental = sessaoExperimental; }

    public String getParametrosExperimentais() { return parametrosExperimentais; }
    public void setParametrosExperimentais(String parametrosExperimentais) { this.parametrosExperimentais = parametrosExperimentais; }
}
