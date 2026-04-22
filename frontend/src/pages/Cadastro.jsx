import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/cadastro.css";
import Navbar from "../components/Navbar";
function Cadastro() {

  const [cpf, setCpf]           = useState("");  // Texto digitado no campo CPF
  const [nome, setNome]         = useState("");  // Nome completo
  const [email, setEmail]       = useState("");  // Email
  const [telefone, setTelefone] = useState("");  // Telefone
  const [dataNasc, setDataNasc] = useState("");  // Data de nascimento
  const [senha, setSenha]       = useState("");  // Senha

  const [mensagem, setMensagem]   = useState("");
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();

  function aplicarMascaraCpf(valor) {
    let v = valor.replace(/\D/g, "");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(v);
  }

  function aplicarMascaraTelefone(valor) {
    let v = valor.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    setTelefone(v);
  }

  function validarCpf(cpfStr) {
    const c = cpfStr.replace(/[^\d]+/g, "");
    if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;

    let soma = 0;
    for (let i = 1; i <= 9; i++) soma += parseInt(c[i - 1]) * (11 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(c[9])) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(c[i - 1]) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(c[10]);
  }


  async function handleSubmit(e) {
    e.preventDefault();

    if (!validarCpf(cpf)) {
      setMensagem("CPF inválido. Verifique os números digitados.");
      return;
    }

    const telefoneLimpo = telefone.replace(/\D/g, "");
    if (telefoneLimpo.length < 10) {
      setMensagem("Telefone inválido. Digite com DDD.");
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      const formData = new FormData();
      formData.append("cpf", cpf);
      formData.append("nome", nome);
      formData.append("email", email);
      formData.append("telefone", telefone);
      formData.append("data_nasc", dataNasc);
      formData.append("senha", senha);


      const resposta = await fetch("http://localhost:8000/cadastrar", {
        method: "POST",
        body: formData,
      });

      const dados = await resposta.json();

      if (dados.sucesso) {
        navigate("/login", {
          state: { mensagem: dados.mensagem }
        });
      } else {
        setMensagem(dados.mensagem);
      }

    } catch (erro) {
      console.error("Erro ao conectar:", erro);
      setMensagem("Erro de conexão com o servidor. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }
  return (
    <div>
      <Navbar />
      <main className="Local_logo">

        <div className="Tamanho_Logo">
          <img src="/assets/logo.png" alt="Logo Nouvelle" />
        </div>

        <div className="Tamanho_Caixas_TXT">
          <form onSubmit={handleSubmit} id="formCadastro">

            <div className="login_senha_caixas">
              <input
                type="text"
                placeholder="CPF (000.000.000-00)"
                maxLength={14}
                required
                value={cpf}
                onChange={(e) => aplicarMascaraCpf(e.target.value)}
              />
            </div>

            <div className="login_senha_caixas">
              <input
                type="text"
                placeholder="Nome completo"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="login_senha_caixas">
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="login_senha_caixas">
              <input
                type="text"
                placeholder="Telefone (DD) 90000-0000"
                maxLength={15}
                required
                value={telefone}
                onChange={(e) => aplicarMascaraTelefone(e.target.value)}
              />
            </div>

            <div className="login_senha_caixas">
              <input
                type="date"
                required
                style={{ color: "#999" }}
                value={dataNasc}
                onChange={(e) => setDataNasc(e.target.value)}
              />
            </div>

            <div className="login_senha_caixas">
              <input
                type="password"
                placeholder="Senha"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-login" disabled={carregando}>
              {carregando ? "Cadastrando..." : "Finalizar Cadastro"}
            </button>

            {mensagem && (
              <p style={{ color: "red", marginTop: "15px", textAlign: "center" }}>
                {mensagem}
              </p>
            )}

            <div className="utilidades_abaixo">
              <Link to="/login" className="link_login">
                Já tem uma conta? Faça login
              </Link>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}

export default Cadastro;
