import { Link, useNavigate, useLocation } from "react-router-dom";

function CardFilme({ filme }) {
  // 'filme' é uma proP, ou seja, o pai passa o objeto e o filho usa
  return (
    <div className="cardFilme">
      <Link to={`/detalhes/${filme.id}`}>
        <img
          className="posterFilme"
          src={
            filme.poster_path
              ? `https://image.tmdb.org/t/p/w500${filme.poster_path}`
              : "/assets/sem-foto.jpg"
          }
          alt={filme.title}
        />
        <strong className="tituloFilme">{filme.title}</strong>
      </Link>
    </div>
  );
}

export default CardFilme;