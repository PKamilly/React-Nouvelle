import logoImg from "../assets/logo.png";
import "../styles/login.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

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

        navigate("/");
      } else {
        setMensagem(dados.mensagem || "Erro ao fazer login.");
      }
    } catch (err) {
      setMensagem("Erro de conexão com o servidor.");
    }
  }

  return (
    <div>
      <Navbar />
      <div className="caixaLogin">
        <div className="login-logo-wrapper">
          <img src={logoImg} alt="Nouvelle"/>
        </div>

        <form onSubmit={handleSubmit} id="formLogin">
          <div className="login_senha_caixas">
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
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

          {mensagem && (
            <p style={{ color: "red", marginTop: "15px", textAlign: "center" }}>
              {mensagem}
            </p>
          )}

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
  );
}

export default Login;