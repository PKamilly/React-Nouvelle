import logoImg from "../assets/logo.png";
import "../styles/login.css";
import "../styles/loginCadastro.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useModal } from "../components/Modal";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();
  const { showAlert } = useModal();

  function validarEmail(emailStr) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validarEmail(email)) {
      showAlert("E-mail inválido", "Digite um e-mail válido.", "erro");
      return;
    }

    if (!senha.trim()) {
      showAlert("Senha inválida", "A senha não pode ficar em branco.", "erro");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("senha", senha);

      const resposta = await fetch("http://localhost:8000/login", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const dados = await resposta.json();

      if (dados.sucesso) {
        localStorage.setItem("usuario_nome", dados.nome);
        localStorage.setItem("usuario_cpf", dados.cpf);
        localStorage.setItem("usuario_permissao", dados.permissao); 
        if (dados.caminho_final) {
          localStorage.setItem("usuario_caminho_final", dados.caminho_final);
        }
        navigate("/");
      } else {
        const msg = dados.mensagem || "Erro ao fazer login.";
        showAlert("Erro ao logar", msg, "erro");
      }
    } catch (err) {
      const msg = "Erro de conexão com o servidor.";
      showAlert("Erro", msg, "erro");
    }
  }

  return (
    <div>
      <Navbar />

      <div id="divLogin">

        <div id="divLeft">
          <div className="Tamanho_Logo">
            <img src={logoImg} alt="Nouvelle"/>
          </div>
        </div>
        
        <div id="divRight">
          <h1 className="tituloPagina">PÁGINA DE LOGIN</h1>
          
          <form onSubmit={handleSubmit} id="formLogin" noValidate>
            <div className="login_senha_caixas">
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="login_senha_caixas">
              <input
                type="password"
                placeholder="Senha"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-login">Entrar</button>

            

            <div className="utilidades">
              <div className="lembre_de_mim">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Lembre-se de mim</label>
              </div>
              <a href="#" className="Qual_minha_senha">Esqueceu sua senha?</a>
            </div>
          </form>
        </div>
        
      </div>


    </div>
  );
}

export default Login;