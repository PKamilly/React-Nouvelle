import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pagamento.css";
import Navbar from "../components/Navbar";

function Pagamento() {

  const [assentos, setAssentos]   = useState([]);
  const [filme, setFilme]         = useState("—");
  const [sala, setSala]           = useState("—");
  const [horario, setHorario]     = useState("—");
  const [dataSessao, setDataSessao] = useState("—"); 
  const [nomeCartao, setNomeCartao]   = useState("");
  const [numeroCartao, setNumeroCartao] = useState("");
  const [validade, setValidade]       = useState("");
  const [cvv, setCvv]                 = useState("");
  const [emailComprovante, setEmailComprovante] = useState("");

  // ── ESTADOS DE CONTROLE ───────────────────────────────────────────────────────

  const [erros, setErros]         = useState({});
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso]     = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const cpf = localStorage.getItem("usuario_cpf");
    if (!cpf) {
      navigate("/login");
      return;
    }

    const assentosGuardados = localStorage.getItem("assentosSelecionados");
    if (assentosGuardados) {
      setAssentos(JSON.parse(assentosGuardados));
    }

    setFilme(localStorage.getItem("filmeSelecionado")   || "—");
    setSala(localStorage.getItem("salaSelecionada")     || "—");
    setHorario(localStorage.getItem("horarioSelecionado") || "—");
    setDataSessao(localStorage.getItem("dataSelecionada")  || "—");

  }, []);

  const PRECO_UNITARIO = 35.00;
  const total = assentos.length * PRECO_UNITARIO;
  const totalFormatado = `R$ ${total.toFixed(2).replace(".", ",")}`;

  function formatarNumeroCartao(valor) {
    let v = valor.replace(/\D/g, "");
    v = v.substring(0, 16);
    v = v.replace(/(\d{4})(?=\d)/g, "$1 "); 
    setNumeroCartao(v);
  }

  function formatarValidade(valor) {
    let v = valor.replace(/\D/g, "");
    v = v.substring(0, 4);
    if (v.length >= 2) {
      v = v.substring(0, 2) + "/" + v.substring(2);
    }
    setValidade(v);
  }

  function formatarCvv(valor) {
    let v = valor.replace(/\D/g, "");
    v = v.substring(0, 3);
    setCvv(v);
  }

  function validarFormulario() {
    const novosErros = {};

    if (!nomeCartao.trim()) {
      novosErros.nomeCartao = "Nome no cartão é obrigatório.";
    }

    const numeroLimpo = numeroCartao.replace(/\s/g, "");
    if (!/^\d{16}$/.test(numeroLimpo)) {
      novosErros.numeroCartao = "Número do cartão deve ter 16 dígitos.";
    }

    if (!/^\d{2}\/\d{2}$/.test(validade)) {
      novosErros.validade = "Validade deve estar no formato MM/AA.";
    }

    if (!/^\d{3}$/.test(cvv)) {
      novosErros.cvv = "CVV deve ter 3 dígitos.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailComprovante)) {
      novosErros.emailComprovante = "E-mail inválido.";
    }

    return novosErros;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const errosEncontrados = validarFormulario();

    if (Object.keys(errosEncontrados).length > 0) {
      setErros(errosEncontrados);
      return;
    }

    setErros({});
    setCarregando(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSucesso(true);

      localStorage.removeItem("assentosSelecionados");
      localStorage.removeItem("filmeSelecionado");
      localStorage.removeItem("salaSelecionada");
      localStorage.removeItem("horarioSelecionado");
      localStorage.removeItem("dataSelecionada");

      setTimeout(() => navigate("/"), 2000);

    } catch (erro) {
      console.error("Erro no pagamento:", erro);
      setErros({ geral: "Erro ao processar pagamento. Tente novamente." });
    } finally {
      setCarregando(false);
    }
  }

  if (sucesso) {
    return (
      <div>
        <Navbar />
        <div style={{ textAlign: "center", marginTop: "80px", color: "white" }}>
          <h1 style={{ color: "#F0AD12", fontSize: "3rem" }}>✅ Pagamento Confirmado!</h1>
          <p style={{ marginTop: "20px", fontSize: "1.2rem" }}>
            Um comprovante foi enviado para {emailComprovante}.
          </p>
          <p style={{ color: "#999", marginTop: "10px" }}>
            Redirecionando para a página inicial...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <main className="pagamento-container">

        <div className="resumo-pedido">
          <h1>Finalizar Compra</h1>

          <div className="pedido-info">
            <div className="info-section">
              <h2>Resumo do Pedido</h2>

              <div className="detalhes-filme">
                <div className="info-item">
                  <span className="label">Filme:</span>
                  <span className="valor">{filme}</span>
                </div>
                <div className="info-item">
                  <span className="label">Sala:</span>
                  <span className="valor">{sala}</span>
                </div>
                <div className="info-item">
                  <span className="label">Horário:</span>
                  <span className="valor">{horario}</span>
                </div>
                <div className="info-item">
                  <span className="label">Data:</span>
                  <span className="valor">{dataSessao}</span>
                </div>
                <div className="info-item">
                  <span className="label">Assentos:</span>
                  <span className="valor">
                    {assentos.length === 0
                      ? "Nenhum assento selecionado"
                      : assentos.join(", ")}
                  </span>
                </div>
              </div>
            </div>

            <div className="preco-final">
              <div className="preco-linha">
                <span>Quantidade de Assentos:</span>
                <span>{assentos.length}</span>
              </div>
              <div className="preco-linha">
                <span>Valor Unitário:</span>
                <span>R$ 35,00</span>
              </div>
              <div className="preco-linha total">
                <span>Total a Pagar:</span>
                <span>{totalFormatado}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="formulario-pagamento">
          <h2>Informações de Pagamento</h2>

          <form className="form-pagamento" onSubmit={handleSubmit}>

            <div className="campo-grupo">
              <label htmlFor="nomeCartao">Nome no Cartão</label>
              <input
                type="text"
                id="nomeCartao"
                value={nomeCartao}
                onChange={(e) => setNomeCartao(e.target.value)}
                required
              />
              {erros.nomeCartao && (
                <small style={{ color: "#F0AD12" }}>{erros.nomeCartao}</small>
              )}
            </div>

            <div className="campo-grupo">
              <label htmlFor="numeroCartao">Número do Cartão</label>
              <input
                type="text"
                id="numeroCartao"
                placeholder="0000 0000 0000 0000"
                value={numeroCartao}
                onChange={(e) => formatarNumeroCartao(e.target.value)}
                required
              />
              {erros.numeroCartao && (
                <small style={{ color: "#F0AD12" }}>{erros.numeroCartao}</small>
              )}
            </div>

            <div className="campo-linha">
              <div className="campo-grupo">
                <label htmlFor="validade">Validade</label>
                <input
                  type="text"
                  id="validade"
                  placeholder="MM/AA"
                  value={validade}
                  onChange={(e) => formatarValidade(e.target.value)}
                  required
                />
                {erros.validade && (
                  <small style={{ color: "#F0AD12" }}>{erros.validade}</small>
                )}
              </div>

              <div className="campo-grupo">
                <label htmlFor="cvv">CVV</label>
                <input
                  type="text"
                  id="cvv"
                  placeholder="000"
                  value={cvv}
                  onChange={(e) => formatarCvv(e.target.value)}
                  required
                />
                {erros.cvv && (
                  <small style={{ color: "#F0AD12" }}>{erros.cvv}</small>
                )}
              </div>
            </div>

            <div className="campo-grupo">
              <label htmlFor="emailComprovante">E-mail para Comprovante</label>
              <input
                type="email"
                id="emailComprovante"
                value={emailComprovante}
                onChange={(e) => setEmailComprovante(e.target.value)}
                required
              />
              {erros.emailComprovante && (
                <small style={{ color: "#F0AD12" }}>{erros.emailComprovante}</small>
              )}
            </div>

            {erros.geral && (
              <p style={{ color: "red", textAlign: "center" }}>{erros.geral}</p>
            )}

            <button
              type="submit"
              className="btn-finalizar"
              disabled={carregando || assentos.length === 0}
            >
              {carregando ? "Processando..." : "Finalizar Compra"}
            </button>

          </form>
        </div>

      </main>
    </div>
  );
}

export default Pagamento;
