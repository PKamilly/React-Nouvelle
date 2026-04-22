import logoImg from "../assets/logo.png";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

function Navbar() {
  const [usuarioNome, setUsuarioNome] = useState(null);

  useEffect(() => {

    const nome = localStorage.getItem("usuario_nome");
    if (nome) {
      setUsuarioNome(nome);
    }
  }, []);
  function handleLogout() {
    localStorage.removeItem("usuario_nome");
    localStorage.removeItem("usuario_cpf");
    setUsuarioNome(null);
    window.location.href = "/";
  }

  return (
    <nav className="menu">
      <Link to="/">
        <img src={logoImg} alt="Nouvelle" width="200" height="100" />
      </Link>

      <input type="checkbox" id="menu-burguer" />
      <label htmlFor="menu-burguer" className="hamburger">
        <span></span>
        <span></span>
        <span></span>
      </label>

      <ul className="menu-links">
        <li><Link to="/">Início</Link></li>
        <li><Link to="/filmesCartaz">Filmes em Cartaz</Link></li>
        <li><Link to="/emBreve">Em Breve</Link></li>
      </ul>

      <ul className="menu-login">
        {usuarioNome ? (
          <>
            <li>
              <Link id="menuPerfil" to="/perfil">
                Olá, {usuarioNome.split(" ")[0]}
              </Link>
            </li>
            <li>
              <button onClick={handleLogout} className="btn-entrar">Sair</button>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/login" className="btn-entrar">Entrar</Link></li>
            <li><Link to="/cadastro" className="btn-cadastrar">Cadastrar</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;