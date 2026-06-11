import "../styles/assentos.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const PRECO_ASSENTO = 35.00;
const LINHAS = 6;
const COLUNAS = 10;
const INDISPONIVEIS = new Set(["A2", "A3", "B7", "C4", "C5", "F2", "F9"]);

function Assentos() {
  const [selecionados, setSelecionados] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const cpf = localStorage.getItem("usuario_cpf");
    if (!cpf) navigate("/login");
  }, [navigate]);

  function toggleAssento(id) {
    setSelecionados(atual => {
      const novo = new Set(atual);
      if (novo.has(id)) {
        novo.delete(id);
      } else {
        novo.add(id);
      }
      return novo;
    });
  }

  function irParaPagamento() {
    const assentos = Array.from(selecionados).sort();
    localStorage.setItem("assentosSelecionados", JSON.stringify(assentos));
    navigate("/pagamento");
  }

  const total = selecionados.size * PRECO_ASSENTO;

  return (
    <div>
      <Navbar />
      <main className="assentos-container">
        <div className="filme-info">
          <h1>Selecione seus Assentos</h1>
        </div>

        <div className="sessao-selecao">
          <div className="legenda">
            <div className="legenda-item">
              <div className="assento disponivel"></div><span>Disponível</span>
            </div>
            <div className="legenda-item">
              <div className="assento selecionado"></div><span>Selecionado</span>
            </div>
            <div className="legenda-item">
              <div className="assento indisponivel"></div><span>Indisponível</span>
            </div>
          </div>

          <div className="tela">🎬 TELA 🎬</div>

          <div className="assentos-grid">
            {Array.from({ length: LINHAS }, (_, i) => {
              const letra = String.fromCharCode(65 + i);
              return (
                <div key={letra} className="linha-assentos">
                  {Array.from({ length: COLUNAS }, (_, j) => {
                    const id = `${letra}${j + 1}`;
                    const indisponivel = INDISPONIVEIS.has(id);
                    const selecionado = selecionados.has(id);

                    return (
                      <button
                        key={id}
                        className={`assento ${
                          indisponivel ? "indisponivel" :
                          selecionado ? "selecionado" : "disponivel"
                        }`}
                        disabled={indisponivel}
                        onClick={() => !indisponivel && toggleAssento(id)}
                      >
                        {id}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="resumo-compra">
          <div className="resumo-conteudo">
            <h2>Resumo da Compra</h2>
            <div className="assentos-selecionados">
              <p className="label-resumo">Assentos Selecionados:</p>
              <div className="lista-assentos">
                {selecionados.size === 0 ? (
                  <p className="vazio">Nenhum assento selecionado</p>
                ) : (
                  Array.from(selecionados).sort().map(a => (
                    <span key={a} className="tag-assento">{a}</span>
                  ))
                )}
              </div>
            </div>

            <div className="preco-info">
              <div className="preco-linha">
                <span>Quantidade:</span>
                <span>{selecionados.size}</span>
              </div>
              <div className="preco-linha">
                <span>Valor Unitário:</span>
                <span>R$ 35,00</span>
              </div>
              <div className="preco-linha total">
                <span>Total:</span>
                <span>R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>

            <button
              className="btn-comprar"
              disabled={selecionados.size === 0}
              onClick={irParaPagamento}
            >
              Continuar para Pagamento
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Assentos;