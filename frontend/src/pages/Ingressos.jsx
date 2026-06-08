import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/ingressos.css";

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
      .then(res => {
        if (!res.ok) throw new Error("Falha ao buscar ingressos");
        return res.json();
      })
      .then(dados => {
        // O backend em Python retorna a lista diretamente (Array), não um objeto com a chave 'ingressos'
        const lista = Array.isArray(dados) ? dados : [];
        setIngressos(lista);
        setCarregando(false);

        // Se houver ingressos, seleciona automaticamente o primeiro
        if (lista.length > 0) {
          setIngressoSelecionado(lista[0]);
        }
      })
      .catch(err => {
        console.error("Erro ao carregar ingressos:", err);
        setErro("Não foi possível carregar os seus ingressos.");
        setCarregando(false);
      });
  }

  function formatarDataHora(valor) {
    if (!valor) return "N/A";
    // O backend envia no formato "YYYY-MM-DD HH:MM". 
    // Vamos apenas reorganizar as partes do texto para ficar no formato do Brasil
    try {
      const [dataStr, horaStr] = valor.split(' ');
      if (!dataStr || !horaStr) return valor;
      const [ano, mes, dia] = dataStr.split('-');
      return `${dia}/${mes}/${ano} ${horaStr}`;
    } catch {
      return valor;
    }
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
      <main className="main-ingressos">
        <div className="conteudo-ingressos">
          <h2 style={{ color: "#F0AD12", textAlign: "center" }}>Carregando seus ingressos...</h2>
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="main-ingressos">
        <div className="conteudo-ingressos">
          <h2 style={{ color: "#F0AD12", textAlign: "center", marginBottom: "20px" }}>{erro}</h2>
          <Link 
            to="/perfil" 
            style={{ display: "block", textAlign: "center", color: "#F0AD12", textDecoration: "underline" }}
          >
            Voltar ao Perfil
          </Link>
        </div>
      </main>
    );
  }

  return (
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
            {/* Oculto no Desktop, visível apenas em telas menores caso precise de um dropdown */}
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
              {ingressos.map(ingresso => {
                const isSelecionado = ingressoSelecionado?.ingresso_id === ingresso.ingresso_id;
                
                return (
                  <button
                    key={ingresso.ingresso_id}
                    className="btn-ingresso-item"
                    // Aplica estilo dourado ao botão que está clicado/selecionado
                    style={isSelecionado ? { background: "rgba(240, 173, 18, 0.15)", borderColor: "#F0AD12" } : {}}
                    onClick={() => handleBotaoIngresso(ingresso.ingresso_id)}
                  >
                    <strong style={{ color: isSelecionado ? "#F0AD12" : "#fff" }}>
                      {ingresso.filme_nome}
                    </strong>
                    <p style={{ margin: "4px 0" }}>Ingresso #{ingresso.ingresso_id}</p>
                    <p style={{ margin: "4px 0", color: "#aaa" }}>Assento: {ingresso.numero_assento || "Não definido"}</p>
                    <p style={{ margin: "4px 0", color: "#aaa" }}>Horário: {formatarDataHora(ingresso.horario_inicio)}</p>
                  </button>
                );
              })}
            </div>

            <div className="detalhes-ingresso">
              {ingressoSelecionado ? (
                <>
                  <h2 style={{ color: "#F0AD12" }}>Detalhes do Ingresso</h2>
                  <p><strong>Ingresso:</strong> #{ingressoSelecionado.ingresso_id}</p>
                  <p><strong>Filme:</strong> {ingressoSelecionado.filme_nome}</p>
                  <p><strong>Horário:</strong> {formatarDataHora(ingressoSelecionado.horario_inicio)}</p>
                  <p><strong>Tipo:</strong> {ingressoSelecionado.dub_leg === "DUB" ? "Dublado" : "Legendado"}</p>
                  <p><strong>Assento:</strong> {ingressoSelecionado.numero_assento || "Não definido"}</p>
                  <p><strong>Valor pago:</strong> R$ {Number(ingressoSelecionado.valor_total || 0).toFixed(2)}</p>
                  <p><strong>Método de Pagamento:</strong> {ingressoSelecionado.metodo_pagamento?.replace(/_/g, " ") || "N/A"}</p>
                  <p><strong>Status:</strong> {ingressoSelecionado.status || "N/A"}</p>
                  <p><strong>ID da transação:</strong> {ingressoSelecionado.pagamento_id || "N/A"}</p>
                  <p><strong>Sala:</strong> {ingressoSelecionado.sala_quantidade || "N/A"} assentos</p>
                  
                  <p style={{ marginTop: "24px", marginBottom: "8px", color: "#F0AD12" }}>
                    <strong>Sinopse do Filme:</strong>
                  </p>
                  <p style={{ color: "#ccc", fontSize: "15px" }}>
                    {ingressoSelecionado.filme_descricao || "Sem descrição disponível."}
                  </p>
                </>
              ) : (
                <>
                  <h2 style={{ color: "#F0AD12" }}>Detalhes do Ingresso</h2>
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

        <Link
          to="/perfil"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            background: "#333",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "8px",
            marginTop: "20px",
            width: "fit-content",
            fontWeight: "bold"
          }}
        >
          Voltar ao Perfil
        </Link>
      </div>
    </main>
  );
}

export default Ingressos;