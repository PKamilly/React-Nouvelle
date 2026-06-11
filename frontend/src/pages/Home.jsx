// src/pages/Home.jsx
import "../styles/inicio.css";   //
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function Home() {
  const [filmes, setFilmes] = useState([]);
  const [slideAtual, setSlideAtual] = useState(0);

  useEffect(() => {
    fetch("http://localhost:8000/api/filmes-lista")
      .then(res => res.json())
      .then(dados => setFilmes(dados))
      .catch(err => console.error("Erro ao buscar filmes:", err));
  }, []);

  function proximoSlide() {
    setSlideAtual(atual => (atual + 1) % filmes.length);
  }

  function slideAnterior() {
    setSlideAtual(atual => (atual - 1 + filmes.length) % filmes.length);
  }

  if (filmes.length === 0) return <p>Carregando...</p>;

  return (
    <div>
      <Navbar />

      <div className="banner-carrossel">
        <button className="seta seta-esquerda" onClick={slideAnterior}>&#10094;</button>
        <button className="seta seta-direita" onClick={proximoSlide}>&#10095;</button>

        <div className="slides-carrossel">
          {filmes.map((filme, indice) => (
            <div
              key={filme.id}
              className={`slide ${indice === slideAtual ? "ativo" : ""}`}
            >
              <Link to={`/detalhes/${filme.id}`}>
                <img
                  src={`https://image.tmdb.org/t/p/original${filme.backdrop_path}`}
                  alt={filme.title}
                />
              </Link>
              <div className="info-filme">
                <h3>{filme.title}</h3>
                <p>{filme.overview?.slice(0, 400)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;