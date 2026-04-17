document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('banner-filme-detalhe');

    if (typeof filmeDados !== 'undefined' && filmeDados.backdrop_path) {
        // A API retorna apenas o caminho (ex: /imagem.jpg)
        const urlCompleta = `https://image.tmdb.org/t/p/original${filmeDados.backdrop_path}`;
        
        banner.style.backgroundImage = `url('${urlCompleta}')`;
        banner.style.backgroundSize = 'cover';
        banner.style.backgroundPosition = 'center';
    } else {
        console.error("Dados do banner não encontrados ou backdrop_path vazio.");
    }
});