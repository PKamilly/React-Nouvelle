
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/emBreve.css";
import Navbar from "../components/Navbar";
import CardFilme from "../components/CardFilme";

function EmBreve() {

  const [filmes, setFilmes]       = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]           = useState("");

  useEffect(() => {
    async function buscarFilmes() {
      try {
        const resposta = await fetch("http://localhost:8000/api/filmes-em-breve");

        if (!resposta.ok) {
          throw new Error("Erro ao buscar filmes.");
        }

        const dados = await resposta.json();
        setFilmes(dados);

      } catch (e) {
        console.error("Erro:", e);
        setErro("Erro ao conectar com o servidor.");
      } finally {
        setCarregando(false);
      }
    }

    buscarFilmes();
  }, [])

  if (carregando) {
    return (
      <div>
        <Navbar />
        <p style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
          Carregando filmes...
        </p>
      </div>
    );
  }

  if (erro) {
    return (
      <div>
        <Navbar />
        <p style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
          {erro}
        </p>
      </div>
    );
  }
  return (
    <div>
      <Navbar />

      <main className="conteudo-principal">
        <h2 style={{ color: "white", textAlign: "center", marginTop: "30px", fontSize: "2rem" }}>
          Em Breve
        </h2>

        <div className="gradeFilmes" id="corpoTabela">
          {filmes.map((filme) => (
            <CardFilme key={filme.id} filme={filme} />
          ))}

          {filmes.length === 0 && (
            <p style={{ color: "white", textAlign: "center" }}>
              Nenhum lançamento futuro encontrado.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default EmBreve;
