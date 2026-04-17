// Recupera dados da URL ou localStorage
function carregarDadosCompra() {
    // Tenta recuperar dados do localStorage
    const assentosArmazenados = localStorage.getItem('assentosSelecionados');
    const filmeArmazenado = localStorage.getItem('filmeSelecionado');
    const salaArmazenada = localStorage.getItem('salaSelecionada');
    const horarioArmazenado = localStorage.getItem('horarioSelecionado');
    const dataArmazenada = localStorage.getItem('dataSelecionada');

    if (assentosArmazenados) {
        const assentos = JSON.parse(assentosArmazenados);
        const quantidade = assentos.length;
        const total = quantidade * 35.00;

        // Atualiza a interface com dados reais
        document.getElementById('assentosSelecionados').textContent = assentos.join(', ');
        document.getElementById('qtdAssentosFinal').textContent = quantidade;
        document.getElementById('totalFinal').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

        // Atualiza informações do filme se disponíveis
        if (filmeArmazenado) {
            document.querySelector('.info-item:nth-child(1) .valor').textContent = filmeArmazenado;
        }
        if (salaArmazenada) {
            document.querySelector('.info-item:nth-child(2) .valor').textContent = salaArmazenada;
        }
        if (horarioArmazenado) {
            document.querySelector('.info-item:nth-child(3) .valor').textContent = horarioArmazenado;
        }
        if (dataArmazenada) {
            document.querySelector('.info-item:nth-child(4) .valor').textContent = dataArmazenada;
        }
    } else {
        // Fallback para dados mockados se não houver dados armazenados
        const assentosMock = ['A1', 'B3', 'C5'];
        const quantidadeMock = assentosMock.length;
        const totalMock = quantidadeMock * 35.00;

        document.getElementById('assentosSelecionados').textContent = assentosMock.join(', ');
        document.getElementById('qtdAssentosFinal').textContent = quantidadeMock;
        document.getElementById('totalFinal').textContent = `R$ ${totalMock.toFixed(2).replace('.', ',')}`;
    }
}

// Validação do formulário de pagamento
function validarFormulario() {
    const campos = [
        { id: 'nomeCartao', nome: 'Nome no Cartão' },
        { id: 'numeroCartao', nome: 'Número do Cartão' },
        { id: 'validade', nome: 'Validade' },
        { id: 'cvv', nome: 'CVV' },
        { id: 'email', nome: 'E-mail' }
    ];

    let valido = true;
    let mensagensErro = [];

    campos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        const valor = elemento.value.trim();

        if (!valor) {
            valido = false;
            mensagensErro.push(`${campo.nome} é obrigatório`);
            elemento.style.borderColor = '#ff4444';
        } else {
            elemento.style.borderColor = '#555';

            // Validações específicas
            if (campo.id === 'numeroCartao') {
                const numeroLimpo = valor.replace(/\s/g, '');
                if (!/^\d{16}$/.test(numeroLimpo)) {
                    valido = false;
                    mensagensErro.push('Número do cartão deve ter 16 dígitos');
                    elemento.style.borderColor = '#ff4444';
                }
            }

            if (campo.id === 'validade') {
                if (!/^\d{2}\/\d{2}$/.test(valor)) {
                    valido = false;
                    mensagensErro.push('Validade deve estar no formato MM/AA');
                    elemento.style.borderColor = '#ff4444';
                }
            }

            if (campo.id === 'cvv') {
                if (!/^\d{3}$/.test(valor)) {
                    valido = false;
                    mensagensErro.push('CVV deve ter 3 dígitos');
                    elemento.style.borderColor = '#ff4444';
                }
            }

            if (campo.id === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(valor)) {
                    valido = false;
                    mensagensErro.push('E-mail inválido');
                    elemento.style.borderColor = '#ff4444';
                }
            }
        }
    });

    return { valido, mensagensErro };
}

// Formatação automática do número do cartão
function formatarNumeroCartao(event) {
    let valor = event.target.value.replace(/\s/g, '');
    valor = valor.replace(/\D/g, ''); // Remove não-dígitos
    valor = valor.substring(0, 16); // Limita a 16 dígitos

    // Adiciona espaços a cada 4 dígitos
    valor = valor.replace(/(\d{4})(?=\d)/g, '$1 ');

    event.target.value = valor;
}

// Formatação automática da validade
function formatarValidade(event) {
    let valor = event.target.value.replace(/\D/g, '');
    valor = valor.substring(0, 4); // Limita a 4 dígitos

    if (valor.length >= 2) {
        valor = valor.substring(0, 2) + '/' + valor.substring(2);
    }

    event.target.value = valor;
}

// Limita CVV a 3 dígitos
function limitarCVV(event) {
    let valor = event.target.value.replace(/\D/g, '');
    valor = valor.substring(0, 3);
    event.target.value = valor;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Carrega dados da compra
    carregarDadosCompra();

    // Formatação automática dos campos
    document.getElementById('numeroCartao').addEventListener('input', formatarNumeroCartao);
    document.getElementById('validade').addEventListener('input', formatarValidade);
    document.getElementById('cvv').addEventListener('input', limitarCVV);

    // Submissão do formulário
    document.getElementById('formPagamento').addEventListener('submit', function(event) {
        event.preventDefault();

        const validacao = validarFormulario();

        if (validacao.valido) {
            // Simula processamento do pagamento
            alert('Pagamento processado com sucesso!\n\nUm comprovante foi enviado para seu e-mail.');

            // Redireciona para página inicial ou de confirmação
            window.location.href = '/index.html';
        } else {
            // Mostra erros
            alert('Por favor, corrija os seguintes erros:\n\n' + validacao.mensagensErro.join('\n'));
        }
    });
});