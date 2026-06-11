import logoImg from "../assets/logo.png";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/cadastro.css";
import "../styles/loginCadastro.css";
import Navbar from "../components/Navbar";
import { useModal } from "../components/Modal";
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
  const { showAlert } = useModal();

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

  function validarEmail(emailStr) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  }

  function validarSenha(senhaStr) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(senhaStr);
  }


  async function handleSubmit(e) {
    e.preventDefault();

    const nomeLimpo = nome.trim();
    if (nomeLimpo.length < 3) {
      const msg = "O nome deve ter no mínimo 3 letras.";
      setMensagem(msg);
      showAlert("Nome inválido", msg, "erro");
      return;
    }

    if (!validarEmail(email)) {
      const msg = "Digite um e-mail válido.";
      setMensagem(msg);
      showAlert("E-mail inválido", msg, "erro");
      return;
    }

    if (!validarSenha(senha)) {
      const msg = "A senha deve ter pelo menos 8 caracteres, incluindo letra maiúscula, minúscula, número e símbolo.";
      setMensagem(msg);
      showAlert("Senha fraca", msg, "erro");
      return;
    }

    if (!validarCpf(cpf)) {
      const msg = "CPF inválido. Verifique os números digitados.";
      setMensagem(msg);
      showAlert("CPF inválido", msg, "erro");
      return;
    }

    const telefoneLimpo = telefone.replace(/\D/g, "");
    if (telefoneLimpo.length < 10) {
      const msg = "Telefone inválido. Digite com DDD.";
      setMensagem(msg);
      showAlert("Telefone inválido", msg, "erro");
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
        showAlert("Erro", dados.mensagem, "erro");
      }

    } catch (erro) {
      console.error("Erro ao conectar:", erro);
      const msg = "Erro de conexão com o servidor. Tente novamente.";
      setMensagem(msg);
      showAlert("Erro de conexão", msg, "erro");
    } finally {
      setCarregando(false);
    }
  }
  return (
    <div>
      <Navbar />

      <div id="divCadastro">

        <div id="divLeft">
          <div className="Tamanho_Logo">
            <img src={logoImg} alt="Nouvelle"/>
          </div>
        </div>
        
        <div id="divRight">
          <h1 className="tituloPagina">PÁGINA DE CADASTRO</h1>

          <form onSubmit={handleSubmit} id="formCadastro" noValidate>
            <div className="Tamanho_Caixas_TXT">
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
        
      </div>
    </div>
  );
}

export default Cadastro;
