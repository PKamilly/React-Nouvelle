import logoImg from "../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/navBar.css";

function Navbar() {
  const [usuarioNome, setUsuarioNome] = useState(null);
  const [usuarioPermissao, setUsuarioPermissao] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const nome = localStorage.getItem("usuario_nome");
    const permissao = localStorage.getItem("usuario_permissao");
    
    if (nome) {
      setUsuarioNome(nome);
    }
    if (permissao) {
      setUsuarioPermissao(permissao);
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("usuario_nome");
    localStorage.removeItem("usuario_cpf");
    localStorage.removeItem("usuario_permissao");
    localStorage.removeItem("usuario_caminho_final");
    
    setUsuarioNome(null);
    setUsuarioPermissao(null);
    navigate("/");
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
            {usuarioPermissao === 'ADMINISTRADOR' && (
              <li>
                <Link to="/admin" className="btn-admin">Painel Admin</Link>
              </li>
            )}
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