import logoImg from "../assets/logo.png";
import fotoPerfilDefault from "../assets/fotoPerfilDefault.png";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/cadastro.css";
import "../styles/loginCadastro.css";
import Navbar from "../components/Navbar";
function Cadastro() {

  const [cpf, setCpf]                 = useState("");  // Texto digitado no campo CPF
  const [nome, setNome]               = useState("");  // Nome completo
  const [email, setEmail]             = useState("");  // Email
  const [telefone, setTelefone]       = useState("");  // Telefone
  const [dataNasc, setDataNasc]       = useState("");  // Data de nascimento
  const [senha, setSenha]             = useState("");  // Senha
  const [fotoPerfil, setFotoPerfil]   = useState(null); // Armazena o arquivo da foto
  const [previewUrl, setPreviewUrl]   = useState(null); // Armazena a URL de pré-visualização da foto

  const [mensagem, setMensagem]       = useState("");
  const [carregando, setCarregando]   = useState(false);

  const navigate = useNavigate();

  function aplicarMascaraCpf(valor) {
    let v = valor.replace(/\D/g, "");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(v);
  }

  function aplicarMascaraTelefone(valor) {
    let v = valor.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    setTelefone(v);
  }

  function validarCpf(cpfStr) {
    const c = cpfStr.replace(/[^\d]+/g, "");
    if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;

    let soma = 0;
    for (let i = 1; i <= 9; i++) soma += parseInt(c[i - 1]) * (11 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(c[9])) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(c[i - 1]) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(c[10]);
  }

  function lidarComMudancaFoto(e) {
    const arquivo = e.target.files[0];
    
    if (arquivo) {
      setFotoPerfil(arquivo);
      setPreviewUrl(URL.createObjectURL(arquivo)); // Gera o link temporário da imagem
    }
  }

  function removerFoto() {
    // Limpa a URL temporária da memória do navegador
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setFotoPerfil(null); // Limpa o arquivo que iria para o backend
    setPreviewUrl(""); // Volta a exibir o avatar padrão no frontend

    // Código para limpar o texto "Nenhum arquivo escolhido" do input nativo
    const inputElement = document.getElementById("fotoPerfilInput");
    if (inputElement) {
      inputElement.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validarCpf(cpf)) {
      setMensagem("CPF inválido. Verifique os números digitados.");
      return;
    }

    const telefoneLimpo = telefone.replace(/\D/g, "");
    if (telefoneLimpo.length < 10) {
      setMensagem("Telefone inválido. Digite com DDD.");
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      const formData = new FormData();
      formData.append("cpf", cpf);
      formData.append("nome", nome);
      formData.append("email", email);
      formData.append("telefone", telefone);
      formData.append("data_nasc", dataNasc);
      formData.append("senha", senha);

      if (fotoPerfil) {
        formData.append("foto_perfil", fotoPerfil); // Adiciona a foto ao FormData se houver uma foto selecionada
      }

      const resposta = await fetch("http://localhost:8000/cadastrar", {
        method: "POST",
        body: formData,
      });

      const dados = await resposta.json();

      if (dados.sucesso) {
        navigate("/login", {
          state: { mensagem: dados.mensagem }
        });
      } else {
        setMensagem(dados.mensagem);
      }

    } catch (erro) {
      console.error("Erro ao conectar:", erro);
      setMensagem("Erro de conexão com o servidor. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }
  return (
    <div>
      <Navbar />

      <div id="divCadastro">

        <div id="divLeft">
          <div className="Tamanho_Logo">
            <img src={logoImg} alt="Nouvelle"/>
          </div>
        </div>
        
        <div id="divRight">
          <h1 className="tituloPagina">PÁGINA DE CADASTRO</h1>

          <form onSubmit={handleSubmit} id="formCadastro">
            <div
              className="divFotoPerfil"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                marginBottom: "25px",
                width: "100%"
              }}
            >
              <img
                src={previewUrl || fotoPerfilDefault}
                alt="Preview-da-foto-de-perfil"
                className="previewFotoPerfil"
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid #F0AD12"
                }}
              />

              <label
                for="fotoPerfilInput"
                className="btnAddFotoPerfil"
                style={{
                  color: "white",
                  backgroundColor: "#141414",
                  padding: "15px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                  width: "100%",
                  textAlign: "center"
                }}
              >Escolher Foto de Perfil</label>
              <input
                id="fotoPerfilInput"
                type="file"
                accept="image/*"
                onChange={lidarComMudancaFoto}
                style={{ display: "none" }}
              />

              {fotoPerfil && (
                <button
                  type="button"
                  onClick={removerFoto}
                  style={{
                    backgroundColor: "#961C1C",
                    color: "white",
                    padding: "15px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                    width: "100%",
                    textAlign: "center"
                  }}
                >
                  Retirar foto
                </button>
              )}
            
            </div>

            

            <div className="Tamanho_Caixas_TXT">
              <div className="login_senha_caixas">
                <h4>CPF:</h4>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                  value={cpf}
                  onChange={(e) => aplicarMascaraCpf(e.target.value)}
                />
              </div>

              <div className="login_senha_caixas">
                <h4>Nome:</h4>
                <input
                  type="text"
                  placeholder="Nome completo"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className="login_senha_caixas">
                <h4>Email:</h4>
                <input
                  type="email"
                  placeholder="nome@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="login_senha_caixas">
                <h4>Telefone:</h4>
                <input
                  type="text"
                  placeholder="(DD) 90000-0000"
                  maxLength={15}
                  required
                  value={telefone}
                  onChange={(e) => aplicarMascaraTelefone(e.target.value)}
                />
              </div>

              <div className="login_senha_caixas">
                <h4>Data de Nascimento:</h4>
                <input
                  type="date"
                  required
                  style={{ color: "#999" }}
                  value={dataNasc}
                  onChange={(e) => setDataNasc(e.target.value)}
                />
              </div>

              <div className="login_senha_caixas">
                <h4>Senha:</h4>
                <input
                  type="password"
                  placeholder="Senha"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>

              <div className="login_senha_caixas">
                <h4>Confirmar Senha:</h4>
                <input
                  type="password"
                  placeholder="Confirme sua senha"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={carregando}>
              {carregando ? "Cadastrando..." : "Finalizar Cadastro"}
            </button>

            {mensagem && (
              <p style={{ color: "red", marginTop: "15px", textAlign: "center" }}>
                {mensagem}
              </p>
            )}

            <div className="utilidades_abaixo">
              <Link to="/login" className="link_login">
                Já tem uma conta? Faça login
              </Link>
            </div>

          </form>
        </div>
        
      </div>
    </div>
  );
}

export default Cadastro;
