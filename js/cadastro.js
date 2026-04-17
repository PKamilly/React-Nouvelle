document.addEventListener("DOMContentLoaded", function() {
    const cpfInput = document.getElementById('cpf');
    const telInput = document.getElementById('telefone');
    const form = document.getElementById('formCadastro');

    // Máscara do CPF (000.000.000-00)
    cpfInput.addEventListener('input', function(e) {
        let v = e.target.value.replace(/\D/g, ''); // Remove o que não é número 
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = v;
    });

    // Máscara do Telefone ((00) 00000-0000)
    telInput.addEventListener('input', function(e) {
        let v = e.target.value.replace(/\D/g, '');
        v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
        v = v.replace(/(\d)(\d{4})$/, '$1-$2');
        e.target.value = v;
    });

    // Formula de validar a veracidade do CPF 
    function validarCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g,'');
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
        let soma = 0, resto;
        for (let i=1; i<=9; i++) soma += parseInt(cpf.substring(i-1, i)) * (11 - i);
        resto = (soma * 10) % 11;
        if ((resto == 10) || (resto == 11)) resto = 0;
        if (resto != parseInt(cpf.substring(9, 10))) return false;
        soma = 0;
        for (let i=1; i<=10; i++) soma += parseInt(cpf.substring(i-1, i)) * (12 - i);
        resto = (soma * 10) % 11;
        if ((resto == 10) || (resto == 11)) resto = 0;
        return resto == parseInt(cpf.substring(10, 11));
    }

    // Invalidade do CPF e telefone
    form.addEventListener('submit', function(e) {
        const cpfValido = validarCPF(cpfInput.value);
        const telValido = telInput.value.replace(/\D/g, '').length >= 10;

        // Limpa erros anteriores
        document.querySelectorAll('.msg-erro').forEach(el => el.remove());

        if (!cpfValido) {
            e.preventDefault();
            exibirErro(cpfInput, "CPF inválido.");
        }

        if (!telValido) {
            e.preventDefault();
            exibirErro(telInput, "Telefone inválido.");
        }
    });

    function exibirErro(input, mensagem) {
        const erro = document.createElement('p');
        erro.className = 'msg-erro';
        erro.innerText = mensagem;
        erro.style.color = "#F0AD12"; 
        erro.style.fontSize = "0.8rem";
        erro.style.marginTop = "5px";
        input.parentNode.appendChild(erro);
    }
});