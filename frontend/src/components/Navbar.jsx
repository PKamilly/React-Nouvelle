import logoImg from "../assets/logo.png";
import fotoPerfilDefault from "../assets/fotoPerfilDefault.png";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

function Navbar() {
  const [usuarioNome, setUsuarioNome] = useState(null);
  const [usuarioFoto, setUsuarioFoto] = useState(null);

  useEffect(() => {
    const nome = localStorage.getItem("usuario_nome");
    const foto = localStorage.getItem("usuario_foto");

    if (nome) {
      setUsuarioNome(nome);
    }
    if(foto){
      setUsuarioFoto(foto);
    }

  }, []);
  function handleLogout() {
    localStorage.removeItem("usuario_nome");
    localStorage.removeItem("usuario_cpf");
    localStorage.removeItem("usuarioFoto");
    setUsuarioNome(null);
    setUsuarioFoto(null);
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
                <img
                  src={usuarioFoto ? `http://localhost:8000/uploads/${usuarioFoto}` : fotoPerfilDefault}
                  alt="Foto de Perfil"
                  className="foto-perfil"
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginRight: "8px"
                  }}
                />
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