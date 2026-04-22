import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/filmesCartaz.css"; 

function FilmesCartaz() {
  const [todosFilmes, setTodosFilmes] = useState([]); 
  const [filmesFiltrados, setFilmesFiltrados] = useState([]); 
  const [termoBusca, setTermoBusca] = useState(""); 
  const [erro, setErro] = useState(""); 

  useEffect(() => {
    fetch("http://localhost:8000/api/filmes-lista")
      .then(res => res.json())
      .then(dados => {
        setTodosFilmes(dados);
        setFilmesFiltrados(dados); 
      });
  }, []);

  function filtrarFilmes() {
    const termo = termoBusca.toLowerCase();
    const resultados = todosFilmes.filter(filme =>
      filme.title.toLowerCase().includes(termo)
    );

    if (resultados.length > 0) {
      setFilmesFiltrados(resultados);
      setErro("");
    } else {
      setFilmesFiltrados([]);
      setErro(`O filme "${termoBusca}" ainda está em exibição ou já saiu de cartaz.`);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") filtrarFilmes();
  }

  return (
    <div className="pagina-cartaz">
      <Navbar />

      <div className="fundo-preto-busca">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar.."
            value={termoBusca}
            onChange={e => setTermoBusca(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={filtrarFilmes}>🔍︎</button>
        </div>
      </div>

      <center>
        <h2 className="tituloPag">Filmes em Cartaz</h2>

        {erro && <h1 className="msgErro">{erro}</h1>}

        <div className="gradeFilmes">
          {filmesFiltrados.map(filme => (
            <div key={filme.id} className="cardFilme">
              <Link to={`/detalhes/${filme.id}`}>
                <img
                  className="posterFilme"
                  src={`https://image.tmdb.org/t/p/w500${filme.poster_path}`}
                  alt={filme.title}
                />
                <strong className="tituloFilme">{filme.title}</strong>
              </Link>
            </div>
          ))}
        </div>
      </center>
    </div>
  );
}

export default FilmesCartaz;