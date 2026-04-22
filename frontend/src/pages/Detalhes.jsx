import "../styles/detalhes.css";

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function formatarData(dataStr) {
  if (!dataStr) return "";
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarDuracao(minutos) {
  if (!minutos) return "N/A";
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${horas}h ${String(resto).padStart(2, "0")}min`;
}

function Detalhes() {
  const { id } = useParams();
  const [filme, setFilme] = useState(null);
  const [podeComprar, setPodeComprar] = useState(false);
  const [usuarioCpf, setUsuarioCpf] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:8000/api/detalhes-completos/${id}`)
      .then(res => res.json())
      .then(dados => {
        setFilme(dados);
        const hoje = new Date().toISOString().split("T")[0];
        setPodeComprar(dados.release_date && dados.release_date <= hoje);
      });

    const cpf = localStorage.getItem("usuario_cpf");
    setUsuarioCpf(cpf);
  }, [id]);

  if (!filme) return <p>Carregando...</p>;

  return (
    <div>
      <Navbar />

      <header
        className="banner-detalhe"
        style={{
          backgroundImage: `url('https://image.tmdb.org/t/p/original${filme.backdrop_path}')`,
        }}
      >
        <div className="banner-overlay"></div>
      </header>

      <main className="detalhes-main">
        <div className="detalhes-wrapper">
          <div className="poster-filme">
            <img
              src={`https://image.tmdb.org/t/p/w500${filme.poster_path}`}
              alt={filme.title}
            />
          </div>

          <div className="info-texto">
            <h1 className="titulo-destaque">{filme.title}</h1>
            <p className="tagline"><i>{filme.tagline}</i></p>

            <div className="metadados">
              {filme.vote_average > 0 && <span>⭐ {filme.vote_average}</span>}
              <br />
              <span>📅 {formatarData(filme.release_date)}</span>
              <br />
              <span>⏱️ {formatarDuracao(filme.runtime)}</span>
            </div>

            <div className="generos-area">
              <h3>Gêneros</h3>
              <ul className="lista-generos">
                {filme.genres?.map(genero => (
                  <li key={genero.id}>{genero.name}</li>
                ))}
              </ul>
            </div>

            <div className="sinopse-area">
              <h3>Sinopse</h3>
              <p>{filme.overview}</p>
            </div>

            {podeComprar ? (
              usuarioCpf ? (
                <Link to="/assentos" className="btn-comprar">
                  Comprar Ingresso
                </Link>
              ) : (
                <Link to="/login" className="btn-comprar" style={{ backgroundColor: "#555" }}>
                  Faça login para comprar
                </Link>
              )
            ) : (
              <button className="btn-comprar desativado" disabled>
                Em Breve nos Cinemas
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Detalhes;