import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/perfil.css";
import Navbar from "../components/Navbar";

function Perfil() {
  const [cpf, setCpf]           = useState("");
  const [nome, setNome]         = useState("");
  const [email, setEmail]       = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNasc, setDataNasc] = useState("");

  const [carregandoPagina, setCarregandoPagina] = useState(true);
  const [carregandoAtualizacao, setCarregandoAtualizacao] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const cpfLogado = localStorage.getItem("usuario_cpf");

    if (!cpfLogado) {
      navigate("/login");
      return;
    }

    async function carregarPerfil() {
      try {
        const resposta = await fetch("http://localhost:8000/perfil", {
          method: "GET",
          headers: {
            "x-usuario-cpf": cpfLogado,
          },
        });

        if (!resposta.ok) {
          navigate("/login");
          return;
        }

        const dados = await resposta.json();
        setCpf(dados.cpf);
        setNome(dados.nome);
        setEmail(dados.email);
        setTelefone(dados.telefone || "");
        setDataNasc(dados.data_nasc || "");

      } catch (erro) {
        console.error("Erro ao carregar perfil:", erro);
        setMensagem("Erro de conexão ao carregar seus dados.");
      } finally {
        setCarregandoPagina(false);
      }
    }

    carregarPerfil();
  }, []);

  async function handleAtualizar(e) {
    e.preventDefault();
    setCarregandoAtualizacao(true);
    setMensagem("");

    const cpfLogado = localStorage.getItem("usuario_cpf");

    try {
      const formData = new FormData();
      formData.append("nome", nome);
      formData.append("email", email);
      formData.append("telefone", telefone);
      formData.append("data_nasc", dataNasc);

      const resposta = await fetch("http://localhost:8000/atualizar_perfil", {
        method: "POST",
        headers: {
          "x-usuario-cpf": cpfLogado,
        },
        body: formData,
      });

      const dados = await resposta.json();

      if (dados.sucesso) {
        setMensagem(dados.mensagem);

        localStorage.setItem("usuario_nome", dados.usuario.nome);

        setNome(dados.usuario.nome);
        setEmail(dados.usuario.email);
        setTelefone(dados.usuario.telefone || "");
        setDataNasc(dados.usuario.data_nasc || "");

      } else {
        setMensagem(dados.mensagem);
      }

    } catch (erro) {
      console.error("Erro ao atualizar:", erro);
      setMensagem("Erro de conexão ao tentar atualizar.");
    } finally {
      setCarregandoAtualizacao(false);
    }
  }

  async function handleDeletar(e) {
    e.preventDefault();

    const confirmou = window.confirm(
      "Tem certeza absoluta que deseja EXCLUIR sua conta? Esta ação não pode ser desfeita."
    );
    if (!confirmou) return;

    const cpfLogado = localStorage.getItem("usuario_cpf");

    try {
      const resposta = await fetch("http://localhost:8000/deletar_conta", {
        method: "POST",
        headers: {
          "x-usuario-cpf": cpfLogado,
        },
      });

      const dados = await resposta.json();

      if (dados.sucesso) {
        localStorage.removeItem("usuario_nome");
        localStorage.removeItem("usuario_cpf");

        navigate("/");

      } else {
        setMensagem(dados.mensagem);
      }

    } catch (erro) {
      console.error("Erro ao deletar:", erro);
      setMensagem("Erro de conexão ao tentar excluir a conta.");
    }
  }

  if (carregandoPagina) {
    return (
      <div>
        <Navbar />
        <p style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
          Carregando seus dados...
        </p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="Local_logo">
        <div className="Tamanho_Logo">
          <h1 style={{ color: "#F0AD12", fontSize: "40px", marginBottom: "20px" }}>
            Meus Dados
          </h1>
          <p>Aqui você pode atualizar suas informações ou excluir sua conta.</p>
        </div>

        <div className="Tamanho_Caixas_TXT">
          <form onSubmit={handleAtualizar} id="formPerfil">
            <div className="login_senha_caixas">
              <label style={{ color: "#F0AD12" }}>CPF (Não alterável):</label>
              <input
                type="text"
                value={cpf}
                readOnly
                style={{ backgroundColor: "#222", color: "#777" }}
              />
            </div>

            <div className="login_senha_caixas">
              <label style={{ color: "#F0AD12" }}>Nome completo:</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="login_senha_caixas">
              <label style={{ color: "#F0AD12" }}>Email:</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="login_senha_caixas">
              <label style={{ color: "#F0AD12" }}>Telefone:</label>
              <input
                type="text"
                required
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>

            <div className="login_senha_caixas">
              <label style={{ color: "#F0AD12" }}>Data de Nascimento:</label>
              <input
                type="date"
                required
                value={dataNasc}
                onChange={(e) => setDataNasc(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-login"
              style={{ marginBottom: "15px" }}
              disabled={carregandoAtualizacao}
            >
              {carregandoAtualizacao ? "Salvando..." : "Atualizar Dados"}
            </button>

          </form>

          <hr style={{ border: "1px solid #333", margin: "20px 0" }} />
          <form onSubmit={handleDeletar}>
            <button
              type="submit"
              className="btn-login"
              style={{ backgroundColor: "#8B0000", color: "white" }}
            >
              Excluir Minha Conta
            </button>
          </form>
          {mensagem && (
            <p style={{ color: "#F0AD12", marginTop: "15px", textAlign: "center" }}>
              {mensagem}
            </p>
          )}

        </div>
      </main>
    </div>
  );
}

export default Perfil;
