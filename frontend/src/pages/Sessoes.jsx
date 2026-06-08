import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/sessoes.css";

function Sessoes() {
  const { id: filmeId } = useParams();
  const navigate = useNavigate();
  const [filme, setFilme] = useState(null);
  const [sessoes, setSessoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const cpf = localStorage.getItem("usuario_cpf");
    if (!cpf) {
      navigate("/login");
      return;
    }

    // Carregar detalhes do filme
    fetch(`http://localhost:8000/api/detalhes-completos/${filmeId}`)
      .then(res => res.json())
      .then(dados => {
        setFilme(dados);
      })
      .catch(err => {
        console.error("Erro ao carregar filme:", err);
        setErro("Erro ao carregar informações do filme");
      });

    // Carregar sessões disponíveis
    fetch(`http://localhost:8000/api/sessoes-filme/${filmeId}`)
      .then(res => res.json())
      .then(dados => {
        setSessoes(dados.sessoes || []);
        setCarregando(false);
      })
      .catch(err => {
        console.error("Erro ao carregar sessões:", err);
        setErro("Não foi possível carregar as sessões");
        setCarregando(false);
      });
  }, [filmeId, navigate]);

  function formatarData(dataStr) {
    if (!dataStr) return "";
    const data = new Date(dataStr);
    return data.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatarHorario(dataStr) {
    if (!dataStr) return "";
    const data = new Date(dataStr);
    return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function selecionarSessao(sessao) {
    // Armazenar informações da sessão no localStorage
    localStorage.setItem("sessaoSelecionada", sessao.sessao_id);
    localStorage.setItem("filmeSelecionado", filme.title);
    localStorage.setItem("horarioSelecionado", formatarHorario(sessao.horario_inicio));
    localStorage.setItem("dataSelecionada", formatarData(sessao.horario_inicio));
    localStorage.setItem("salaSelecionada", sessao.sala_quantidade || "—");

    // Ir para seleção de assentos
    navigate("/assentos");
  }

  if (carregando) {
    return (
      <div>
        <main className="sessoes-container">
          <div className="loading">Carregando sessões...</div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <main className="sessoes-container">
        {filme && (
          <div className="filme-header">
            <div className="filme-info">
              <h1>{filme.title}</h1>
              <p className="filme-sinopse">{filme.overview}</p>
              <div className="filme-meta">
                {filme.vote_average > 0 && (
                  <span className="meta-item">⭐ {filme.vote_average}/10</span>
                )}
                <span className="meta-item">📅 {filme.release_date}</span>
                {filme.runtime && (
                  <span className="meta-item">⏱️ {filme.runtime}min</span>
                )}
              </div>
            </div>
            {filme.poster_path && (
              <div className="filme-poster">
                <img
                  src={`https://image.tmdb.org/t/p/w300${filme.poster_path}`}
                  alt={filme.title}
                />
              </div>
            )}
          </div>
        )}

        <div className="sessoes-section">
          <h2>Escolha sua Sessão</h2>

          {erro && (
            <div className="erro">
              <h3>Erro</h3>
              <p>{erro}</p>
            </div>
          )}

          {sessoes.length > 0 ? (
            <div className="sessoes-grid">
              {sessoes.map(sessao => (
                <div key={sessao.sessao_id} className="sessao-card">
                  <div className="sessao-info">
                    <div className="sessao-data">
                      {formatarData(sessao.horario_inicio)}
                    </div>
                    <div className="sessao-horario">
                      {formatarHorario(sessao.horario_inicio)}
                    </div>
                    <div className="sessao-sala">
                      Sala {sessao.numero_sala || "—"} • {sessao.sala_quantidade || "—"} assentos
                    </div>
                    <div className="sessao-tipo">
                      {sessao.dub_leg === "Dublado" ? "🎬 Dublado" : "🎤 Legendado"}
                    </div>
                  </div>
                  <div className="sessao-acoes">
                    <button
                      className="btn-sessao"
                      onClick={() => selecionarSessao(sessao)}
                    >
                      Escolher Sessão
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !erro ? (
            <div className="sem-sessoes">
              <h3>Nenhuma sessão disponível</h3>
              <p>Este filme não tem sessões agendadas no momento.</p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default Sessoes;
