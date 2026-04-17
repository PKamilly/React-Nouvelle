// Variáveis constantes pra armazenar objetos do DOM
const slides = document.querySelectorAll(".slide"); // Chamada de método que retorna uma nodeList (similar a array) com todas as divs ".slide" pra variável constante 'slides'
const setaEsquerda = document.getElementById("prev");
const setaDireita = document.getElementById("next");

let slideAtual = 0;

function mostrarSlide(indice){
    slides[slideAtual].classList.remove("ativo");

    // Atualiza a variável slideAtual com o valor de indice
    slideAtual = indice;

    // Condicional para impedir que o número do slide não seja maior que a quantia de filmes da api
    // Se for maior ou igual ao tamanho do slides, ele volta pro 0, se for menor que 0, ele volta pro maior -1
    if (slideAtual >= slides.length){
        slideAtual = 0;
    }
    else if (slideAtual < 0){
        slideAtual = slides.length - 1;
    }

    // Chamada de método que pega o slide atual e adiciona a classe "ativo" nele
    slides[slideAtual].classList.add("ativo");
}

// Escutador de eventos para as variáveis constantes para adicionar funcionalidade nas setas
setaDireita.addEventListener("click", () => {mostrarSlide(slideAtual + 1);});
setaEsquerda.addEventListener("click", () => {mostrarSlide(slideAtual - 1);});