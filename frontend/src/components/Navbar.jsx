import logoImg from "../assets/logo.png";
// IMPORTANTE: Adicione o import da imagem padrão aqui
import fotoPerfilDefault from "../assets/fotoPerfilDefault.png"; 

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/navBar.css";

function Navbar() {
  const [usuarioNome, setUsuarioNome] = useState(null);
  const [usuarioPermissao, setUsuarioPermissao] = useState(null);
  const [usuarioFoto, setUsuarioFoto] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Função centralizada para ler o Storage e atualizar a barra
  const atualizarDadosUsuario = () => {
    const nome = localStorage.getItem("usuario_nome");
    const permissao = localStorage.getItem("usuario_permissao");
    const foto = localStorage.getItem("usuario_caminho_final");

    setUsuarioNome(nome || null);
    setUsuarioPermissao(permissao || null);

    // Se tiver foto salva (e não for a string do default do html antigo), anexa o backend.
    if (foto && foto !== "assets/fotoPerfilDefault.png" && foto !== "null") {
      setUsuarioFoto(`http://localhost:8000/${foto}`);
    } else {
      setUsuarioFoto(null); // Fará com que o React use a fotoPerfilDefault no JSX
    }
  };

  useEffect(() => {
    // Roda ao carregar a página
    atualizarDadosUsuario();

    // Fica escutando se a página de Perfil disparar um aviso de atualização
    window.addEventListener("perfilAtualizado", atualizarDadosUsuario);
    
    // Limpeza do evento ao desmontar o componente
    return () => {
      window.removeEventListener("perfilAtualizado", atualizarDadosUsuario);
    };
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
                {/* Aqui colocamos o src dinâmico com fallback para a default importada */}
                <img 
                  src={usuarioFoto || fotoPerfilDefault} 
                  alt="Foto de Perfil" 
                  className="foto-nav-mini" 
                />
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