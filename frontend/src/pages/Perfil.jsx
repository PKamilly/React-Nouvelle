import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/perfil.css";
import Navbar from "../components/Navbar";
import { useModal } from "../components/Modal";
import fotoPerfilDefault from "../assets/fotoPerfilDefault.png";

function Perfil() {
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNasc, setDataNasc] = useState("");
  
  const [fotoArquivo, setFotoArquivo] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(fotoPerfilDefault);
  const [nomeArquivo, setNomeArquivo] = useState("");

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [carregandoPagina, setCarregandoPagina] = useState(true);
  const [carregandoAtualizacao, setCarregandoAtualizacao] = useState(false);
  
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useModal();

  const validarEmail = (emailStr) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  const senhaForte = (senha) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?]).{8,}$/.test(senha);

  const calcularIdade = (dataString) => {
    const hoje = new Date();
    const dataNascimento = new Date(dataString);
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const mes = hoje.getMonth() - dataNascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  useEffect(() => {
    const cpfLogado = localStorage.getItem("usuario_cpf");
    if (!cpfLogado) {
      navigate("/login");
      return;
    }

    async function carregarPerfil() {
      try {
        const resposta = await fetch("http://localhost:8000/perfil", {
          method: "GET",
          headers: { "usuario-cpf": cpfLogado },
        });

        if (!resposta.ok) throw new Error("Erro na resposta do servidor");

        const dados = await resposta.json();
        setCpf(dados.cpf);
        setNome(dados.nome);
        setEmail(dados.email);
        setTelefone(dados.telefone || "");
        setDataNasc(dados.data_nasc || "");
        
        if (dados.caminho_final && dados.caminho_final !== "assets/fotoPerfilDefault.png" && dados.caminho_final !== "null") {
          setFotoPreview(`http://localhost:8000/${dados.caminho_final}`);
        } else {
          setFotoPreview(fotoPerfilDefault);
        }

      } catch (erro) {
        console.error("Erro ao carregar perfil:", erro);
        showAlert("Erro", "Erro de conexão ao carregar seus dados.", "erro");
      } finally {
        setCarregandoPagina(false);
      }
    }

    carregarPerfil();
  }, [navigate, showAlert]);

  const handleFotoChange = (e) => {
    const arquivo = e.target.files[0];
    if (arquivo) {
      setFotoArquivo(arquivo);
      setNomeArquivo(arquivo.name);
      
      const leitor = new FileReader();
      leitor.onload = (evento) => setFotoPreview(evento.target.result);
      leitor.readAsDataURL(arquivo);
    } else {
      setFotoArquivo(null);
      setNomeArquivo("");
      
      const fotoSalva = localStorage.getItem("usuario_caminho_final");
      if (fotoSalva && fotoSalva !== "assets/fotoPerfilDefault.png" && fotoSalva !== "null") {
          setFotoPreview(`http://localhost:8000/${fotoSalva}`);
      } else {
          setFotoPreview(fotoPerfilDefault);
      }
    }
  };

  // Função para lidar com a exclusão da foto
  const handleExcluirFoto = () => {
    showConfirm(
      "Excluir Imagem",
      "Deseja realmente remover sua foto de perfil?",
      async () => {
        const cpfLogado = localStorage.getItem("usuario_cpf");
        try {
          const formData = new FormData();
          formData.append("excluir_foto", "true");

          const resposta = await fetch("http://localhost:8000/atualizar_foto_perfil", {
            method: "POST",
            headers: { "usuario-cpf": cpfLogado },
            body: formData,
          });

          const dados = await resposta.json();

          if (dados.sucesso) {
            setFotoPreview(fotoPerfilDefault);
            setFotoArquivo(null);
            setNomeArquivo("");
            localStorage.setItem("usuario_caminho_final", "assets/fotoPerfilDefault.png");
            window.dispatchEvent(new Event("perfilAtualizado"));
          } else {
            showAlert("Erro", dados.mensagem, "erro");
          }
        } catch (erro) {
          showAlert("Erro", "Falha ao conectar com o servidor.", "erro");
        }
      }
    );
  };

  const handleAtualizar = async (e) => {
    e.preventDefault();

    if (nome.trim().length < 3) return showAlert("Nome inválido", "O nome deve ter no mínimo 3 letras.", "erro");
    if (!validarEmail(email)) return showAlert("E-mail inválido", "Digite um e-mail válido.", "erro");
    
    const idade = calcularIdade(dataNasc);
    if (idade < 18 || idade > 120) return showAlert("Data Inválida", "Você precisa ter entre 18 e 120 anos para atualizar seu cadastro.", "aviso");

    if (novaSenha.trim() !== "") {
      if (novaSenha !== confirmarSenha) return showAlert("Senhas Incompatíveis", "A nova senha e a confirmação não coincidem.", "erro");
      if (!senhaForte(novaSenha)) return showAlert("Senha Fraca", "A nova senha deve ter no mínimo 8 caracteres, com letra maiúscula, minúscula, um número e um caractere especial.", "aviso");
    }

    setCarregandoAtualizacao(true);
    const cpfLogado = localStorage.getItem("usuario_cpf");

    try {
      // 1. Requisição para atualizar as informações de texto
      const formDataTexto = new FormData();
      formDataTexto.append("nome", nome);
      formDataTexto.append("email", email);
      formDataTexto.append("telefone", telefone);
      formDataTexto.append("data_nasc", dataNasc);
      if (novaSenha) formDataTexto.append("nova_senha", novaSenha);

      const respostaTexto = await fetch("http://localhost:8000/atualizar_perfil", {
        method: "POST",
        headers: { "usuario-cpf": cpfLogado },
        body: formDataTexto,
      });

      const dadosTexto = await respostaTexto.json();

      if (dadosTexto.sucesso) {
        localStorage.setItem("usuario_nome", dadosTexto.usuario?.nome || nome);
        let novoCaminhoFinal = dadosTexto.usuario?.caminho_final;

        // 2. Se houver uma foto nova, envia para a rota específica da foto
        if (fotoArquivo) {
          const formDataFoto = new FormData();
          formDataFoto.append("foto_perfil", fotoArquivo);

          const respostaFoto = await fetch("http://localhost:8000/atualizar_foto_perfil", {
            method: "POST",
            headers: { "usuario-cpf": cpfLogado },
            body: formDataFoto,
          });

          const dadosFoto = await respostaFoto.json();
          if (dadosFoto.sucesso) {
            novoCaminhoFinal = dadosFoto.caminho_final;
          }
        }

        // Atualiza a visualização local e Navbar
        if (novoCaminhoFinal) {
          localStorage.setItem("usuario_caminho_final", novoCaminhoFinal);
          if (novoCaminhoFinal !== "assets/fotoPerfilDefault.png") {
            setFotoPreview(`http://localhost:8000/${novoCaminhoFinal}`);
          } else {
            setFotoPreview(fotoPerfilDefault);
          }
        }

        window.dispatchEvent(new Event("perfilAtualizado"));
        showAlert("Perfil atualizado", "Seus dados foram atualizados com sucesso.", "sucesso");
        
        setNovaSenha("");
        setConfirmarSenha("");
        setFotoArquivo(null);
        setNomeArquivo("");
      } else {
        showAlert("Erro", dadosTexto.mensagem, "erro");
      }
    } catch (erro) {
      console.error("Erro ao atualizar:", erro);
      showAlert("Erro", "Erro de conexão ao tentar atualizar.", "erro");
    } finally {
      setCarregandoAtualizacao(false);
    }
  };

  const handleDeletar = (e) => {
    e.preventDefault();
    const cpfLogado = localStorage.getItem("usuario_cpf");

    showConfirm(
      "Excluir conta",
      "Tem certeza absoluta que deseja EXCLUIR sua conta? Esta ação não pode ser desfeita.",
      async () => {
        try {
          const resposta = await fetch("http://localhost:8000/deletar_conta", {
            method: "POST",
            headers: { "usuario-cpf": cpfLogado },
          });
          const dados = await resposta.json();
          if (dados.sucesso) {
            localStorage.clear();
            window.dispatchEvent(new Event("perfilAtualizado")); 
            navigate("/");
          } else {
            showAlert("Erro", dados.mensagem, "erro");
          }
        } catch (erro) {
          console.error("Erro ao deletar:", erro);
          showAlert("Erro", "Erro de conexão ao tentar excluir a conta.", "erro");
        }
      },
      null
    );
  };

  if (carregandoPagina) {
    return (
      <div>
        <Navbar />
        <p style={{ color: "white", textAlign: "center", marginTop: "50px" }}>Carregando seus dados...</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="main-perfil">
        <div className="tamanho_logo">
          <h1 className="tituloPerfil">Meus Dados</h1>
          <p className="descricaoPerfil">Aqui você pode atualizar suas informações ou excluir sua conta.</p>

          <div className="divFotoPerfil">
            <div id="container-preview">
              <img id="preview-img" src={fotoPreview} alt="Foto de Perfil" />
            </div>

            <div className="botoes_nome_imagem">
              <label htmlFor="btnAddFoto" className="botao-upload">
                {fotoArquivo ? "Alterar Imagem" : "Selecionar Imagem"}
              </label>
              <input type="file" id="btnAddFoto" accept="image/*" onChange={handleFotoChange} />
              {nomeArquivo && <p id="nomeArquivo">{nomeArquivo}</p>}
              
              {/* O botão agora aciona a rota correta do FastAPI para deletar a foto do disco */}
              {fotoPreview !== fotoPerfilDefault && !fotoArquivo && (
                <button type="button" className="btn-excluir-foto" onClick={handleExcluirFoto}>
                  Excluir Imagem
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="Tamanho_Caixas_TXT">
          <form onSubmit={handleAtualizar} id="formPerfil" noValidate>
            
            <div className="login_senha_caixas">
              <label style={{ color: "#F0AD12" }}>CPF (Não alterável):</label>
              <input type="text" value={cpf} readOnly className="input-bloqueado" />
            </div>

            <div className="login_senha_caixas">
              <label className="obrigatorio" style={{ color: "#F0AD12" }}>Nome completo</label>
              <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>

            <div className="login_senha_caixas">
              <label className="obrigatorio" style={{ color: "#F0AD12" }}>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="login_senha_caixas">
              <label className="obrigatorio" style={{ color: "#F0AD12" }}>Telefone</label>
              <input type="text" required value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>

            <div className="login_senha_caixas">
              <label className="obrigatorio" style={{ color: "#F0AD12" }}>Data de Nascimento</label>
              <input type="date" required value={dataNasc} onChange={(e) => setDataNasc(e.target.value)} />
            </div>

            <hr style={{ border: "1px solid #333", margin: "25px 0 15px" }} />
            <h3 style={{ color: "white", marginBottom: "5px", fontSize: "1.1rem" }}>Alterar Senha (Opcional)</h3>
            <p style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: "20px" }}>
              Deixe em branco se não quiser alterar sua senha atual.
            </p>

            <div className="login_senha_caixas">
              <label style={{ color: "#F0AD12" }}>Nova Senha</label>
              <div style={{ position: "relative" }}>
                <input type={mostrarNovaSenha ? "text" : "password"} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Mín. 8 chars, maiúscula, número e especial" style={{ paddingRight: "40px" }} />
                <i className={`fa-solid ${mostrarNovaSenha ? "fa-eye-slash" : "fa-eye"} btn-toggle-password`} onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)} style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#ccc" }}></i>
              </div>
              {novaSenha.length > 0 && !senhaForte(novaSenha) && <small className="msg-campo-erro">Senha fraca: use ao menos 8 caracteres, letras maiúsculas, minúsculas, um número e um caractere especial.</small>}
            </div>

            <div className="login_senha_caixas">
              <label style={{ color: "#F0AD12" }}>Confirmar Nova Senha</label>
              <div style={{ position: "relative" }}>
                <input type={mostrarConfirmarSenha ? "text" : "password"} value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Repita a nova senha" style={{ paddingRight: "40px" }} />
                <i className={`fa-solid ${mostrarConfirmarSenha ? "fa-eye-slash" : "fa-eye"} btn-toggle-password`} onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)} style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#ccc" }}></i>
              </div>
              {confirmarSenha.length > 0 && novaSenha !== confirmarSenha && <small className="msg-campo-erro">As senhas não coincidem.</small>}
            </div>

            <button type="submit" className="btn-perfil" style={{ marginBottom: "15px" }} disabled={carregandoAtualizacao}>
              {carregandoAtualizacao ? "Salvando..." : "Atualizar Dados"}
            </button>
            
            <button 
              type="button" 
              className="btn-perfil" 
              style={{ marginBottom: "15px", backgroundColor: "#333" }}
              onClick={() => navigate("/Ingressos")}
            >
              Meus Ingressos
            </button>

          </form>

          <hr style={{ border: "1px solid #333", margin: "20px 0" }} />
          
          <form onSubmit={handleDeletar}>
            <button type="submit" className="btn-perfil" style={{ backgroundColor: "#8B0000", color: "white" }}>Excluir Minha Conta</button>
          </form>

        </div>
      </main>
    </div>
  );
}

export default Perfil;