window.onload = async () => {
    const corpoTabela = document.getElementById("corpoTabela");

    try {
        // Busca os filmes já filtrados 
        const resposta = await fetch("/api/filmes-em-breve");
        const filmes = await resposta.json();

        if (filmes.length === 0) {
            corpoTabela.innerHTML = "<p style='color:white; text-align:center;'>Nenhum lançamento futuro encontrado.</p>";
            return;
        }

        corpoTabela.innerHTML = ""; // Limpa o container

        filmes.forEach(filme => {
            const divCard = document.createElement("div");
            divCard.className = "cardFilme";

            // URL da imagem
            const posterUrl = filme.poster_path 
                ? `https://image.tmdb.org/t/p/w500${filme.poster_path}`
                : "/assets/sem-foto.jpg";

            divCard.innerHTML = `
                <img class="posterFilme" src="${posterUrl}" alt="${filme.title}">
                <strong class="tituloFilme">${filme.title}</strong>
            `;

            corpoTabela.appendChild(divCard);
        });
    } catch (erro) {
        console.error("Erro ao carregar API:", erro);
        corpoTabela.innerHTML = "<p style='color:white;'>Erro ao conectar com o servidor.</p>";
    }
};