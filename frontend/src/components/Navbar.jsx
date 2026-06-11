import logoImg from "../assets/logo.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/navBar.css";

function Navbar() {
  const [usuarioNome, setUsuarioNome] = useState(null);
  const [usuarioPermissao, setUsuarioPermissao] = useState(null);
  const [usuarioFoto, setUsuarioFoto] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); // Ajuda a saber em qual página estamos

  useEffect(() => {
    const nome = localStorage.getItem("usuario_nome");
    const permissao = localStorage.getItem("usuario_permissao");
    const foto = localStorage.getItem("usuario_caminho_final");
    
    if (nome) setUsuarioNome(nome);
    if (permissao) setUsuarioPermissao(permissao);
    if (foto) setUsuarioFoto(foto);
  }, []);

  function handleLogout() {
    localStorage.removeItem("usuario_nome");
    localStorage.removeItem("usuario_cpf");
    localStorage.removeItem("usuario_permissao");
    localStorage.removeItem("usuario_caminho_final");
    
    setUsuarioNome(null);
    setUsuarioPermissao(null);
    setUsuarioFoto(null);
    navigate("/");
  }

  // Verifica se estamos na página do painel admin
  const isAdminPage = location.pathname === "/admin";

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

      {/* Lógica do HTML: Se for Admin, mostra "Voltar ao Site", senão, mostra os links normais */}
      <ul className="menu-links">
        {isAdminPage ? (
          <li><Link to="/">Voltar ao Site</Link></li>
        ) : (
          <>
            <li><Link className="menuInicio" to="/">Início</Link></li>
            <li><Link className="menuFilmesCartaz" to="/filmesCartaz">Filmes em Cartaz</Link></li>
            <li><Link className="menuEmBreve" to="/emBreve">Em Breve</Link></li>
          </>
        )}
      </ul>

      <ul className="menu-login">
        {usuarioNome ? (
          <>
            {usuarioPermissao === 'ADMINISTRADOR' && (
              <li>
                <Link to="/admin" className="btn-admin">Painel Admin</Link>
              </li>
            )}
            <li className="item-perfil-nav">
              <Link id="menuPerfil" to="/perfil">
                Olá, {usuarioNome.split(" ")[0]}
                {/* Imagem de perfil adicionada como no index.html */}
                {usuarioFoto && (
                  <img src={`http://localhost:8000/${usuarioFoto}`} alt="Foto" className="foto-nav-mini" />
                )}
              </Link>
            </li>
            <li>
              <button id="menuLogout" onClick={handleLogout} className="btn-entrar" style={{cursor: "pointer"}}>Sair</button>
            </li>
          </>
        ) : (
          <>
            <li><Link id="menuLogin" to="/login" className="btn-entrar">Entrar</Link></li>
            <li><Link id="menuCadastro" to="/cadastro" className="btn-cadastrar">Cadastrar</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;