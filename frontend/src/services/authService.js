const API_BASE_URL = "http://localhost:8000";

export const authService = {
  async login(email, senha) {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("senha", senha);

    const resposta = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    return await resposta.json();
  },

  async cadastrar(dadosUsuario) {
    const formData = new FormData();
    formData.append("cpf", dadosUsuario.cpf);
    formData.append("nome", dadosUsuario.nome);
    formData.append("email", dadosUsuario.email);
    formData.append("telefone", dadosUsuario.telefone);
    formData.append("data_nasc", dadosUsuario.dataNasc);
    formData.append("senha", dadosUsuario.senha);

    const resposta = await fetch(`${API_BASE_URL}/cadastrar`, {
      method: "POST",
      body: formData,
    });

    return await resposta.json();
  }
};