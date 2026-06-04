import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/meusIngressos.css";
import Navbar from "../components/Navbar";

function Ingressos() {
  const navigate = useNavigate();
  const [ingressos, setIngressos] = useState([]);
  const [ingressoSelecionado, setIngressoSelecionado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const cpf = localStorage.getItem("usuario_cpf");
    if (!cpf) {
      navigate("/login");
      return;
    }

    carregarIngressos(cpf);
  }, [navigate]);

  function carregarIngressos(cpf) {
    fetch(`http://localhost:8000/api/meus-ingressos`, {
      headers: {
        "usuario-cpf": cpf,
      },
    })
      .then(res => res.json())
      .then(dados => {
        setIngressos(dados.ingressos || []);
        setCarregando(false);

        // Se houver ingressos, selecionar o primeiro
        if (dados.ingressos && dados.ingressos.length > 0) {
          setIngressoSelecionado(dados.ingressos[0]);
        }
      })
      .catch(err => {
        console.error("Erro ao carregar ingressos:", err);
        setErro("Erro ao carregar seus ingressos");
        setCarregando(false);
      });
  }

  function formatarDataHora(valor) {
    if (!valor) return "N/A";
    const data = new Date(valor);
    if (isNaN(data.getTime())) {
      return valor;
    }
    return (
      data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      " " +
      data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  }

  function handleSelectChange(e) {
    const ingressoId = e.target.value;
    const ingresso = ingressos.find(i => String(i.ingresso_id) === String(ingressoId));
    setIngressoSelecionado(ingresso);
  }

  function handleBotaoIngresso(id) {
    const ingresso = ingressos.find(i => String(i.ingresso_id) === String(id));
    setIngressoSelecionado(ingresso);
  }

  if (carregando) {
    return (
      <div>
        <Navbar />
        <main className="main-ingressos">
          <div className="conteudo-ingressos">
            <p>Carregando seus ingressos...</p>
          </div>
        </main>
      </div>
    );
  }

  if (erro) {
    return (
      <div>
        <Navbar />
        <main className="main-ingressos">
          <div className="conteudo-ingressos">
            <p style={{ color: "#F0AD12" }}>{erro}</p>
            <Link to="/perfil" className="btn-login btn-voltar">
              Voltar ao Perfil
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="main-ingressos">
        <div className="conteudo-ingressos">
          <div className="cabecalho-ingressos">
            <h1 className="tituloPerfil">Meus Ingressos</h1>
            <p className="descricaoPerfil">
              Selecione um ingresso para visualizar os detalhes da sua sessão.
            </p>
          </div>

          {ingressos.length > 0 ? (
            <>
              <div className="login_senha_caixas" style={{ marginBottom: "20px" }}>
                <label style={{ color: "#F0AD12", display: "block", marginBottom: "6px" }}>
                  Escolha um ingresso:
                </label>
                <select
                  onChange={handleSelectChange}
                  value={ingressoSelecionado?.ingresso_id || ""}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "#111",
                    color: "#fff",
                    border: "1px solid #333",
                  }}
                >
                  <option value="">-- Selecione um ingresso --</option>
                  {ingressos.map(ingresso => (
                    <option key={ingresso.ingresso_id} value={ingresso.ingresso_id}>
                      Ingresso #{ingresso.ingresso_id} - {ingresso.filme_nome} -{" "}
                      {formatarDataHora(ingresso.horario_inicio)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lista-ingressos">
                {ingressos.map(ingresso => (
                  <button
                    key={ingresso.ingresso_id}
                    className={`btn-ingresso-item ${
                      ingressoSelecionado?.ingresso_id === ingresso.ingresso_id
                        ? "ativo"
                        : ""
                    }`}
                    onClick={() => handleBotaoIngresso(ingresso.ingresso_id)}
                  >
                    <strong>{ingresso.filme_nome}</strong>
                    <p>Ingresso #{ingresso.ingresso_id}</p>
                    <p>Assento: {ingresso.numero_assento || "Não definido"}</p>
                    <p>Horário: {formatarDataHora(ingresso.horario_inicio)}</p>
                  </button>
                ))}
              </div>

              <div className="detalhes-ingresso">
                {ingressoSelecionado ? (
                  <>
                    <h2>Detalhes do Ingresso</h2>
                    <p>
                      <strong>Ingresso:</strong> #{ingressoSelecionado.ingresso_id}
                    </p>
                    <p>
                      <strong>Filme:</strong> {ingressoSelecionado.filme_nome}
                    </p>
                    <p>
                      <strong>Horário:</strong>{" "}
                      {formatarDataHora(ingressoSelecionado.horario_inicio)}
                    </p>
                    <p>
                      <strong>Tipo:</strong> {ingressoSelecionado.dub_leg}
                    </p>
                    <p>
                      <strong>Assento:</strong> {ingressoSelecionado.numero_assento || "Não definido"}
                    </p>
                    <p>
                      <strong>Valor pago:</strong> R${" "}
                      {Number(ingressoSelecionado.valor_total || 0).toFixed(2)}
                    </p>
                    <p>
                      <strong>Pagamento:</strong> {ingressoSelecionado.metodo_pagamento || "N/A"}
                    </p>
                    <p>
                      <strong>Status:</strong> {ingressoSelecionado.status || "N/A"}
                    </p>
                    <p>
                      <strong>ID do pagamento:</strong> {ingressoSelecionado.pagamento_id || "N/A"}
                    </p>
                    <p>
                      <strong>Sala:</strong> {ingressoSelecionado.sala_quantidade || "N/A"} assentos
                    </p>
                    <p>
                      <strong>Descrição do filme:</strong>
                      <br />
                      {ingressoSelecionado.filme_descricao || "Sem descrição"}
                    </p>
                  </>
                ) : (
                  <>
                    <h2>Detalhes do Ingresso</h2>
                    <p>Selecione um ingresso para ver as informações completas.</p>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="sem-ingressos">
              <p>Você ainda não comprou ingressos.</p>
            </div>
          )}

          <Link to="/perfil" className="btn-login btn-voltar">
            Voltar ao Perfil
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Ingressos;
