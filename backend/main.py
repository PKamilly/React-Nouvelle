'''
main.py — Versão API pura para o React

O que mudou em relação à versão anterior:
- Removido: Jinja2Templates (não serve mais HTML)
- Removido: StaticFiles (o Vite/React serve os arquivos estáticos agora)
- Removido: todas as rotas que retornavam TemplateResponse ou RedirectResponse
- Adicionado: todas as rotas agora retornam dicionários Python (viram JSON automaticamente)
- Adicionado: JSONResponse para respostas de erro com status code correto
- Mantido: CORSMiddleware, bcrypt, conexão com banco, lógica de negócio
'''

from fastapi import FastAPI, Request, Form, Header
from fastapi.responses import JSONResponse        # Substitui o TemplateResponse e RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from conexao import obter_conexao
from datetime import datetime
import httpx
import bcrypt

# ─────────────────────────────────────────────
# CONFIGURAÇÃO DO APP
# ─────────────────────────────────────────────

app = FastAPI()

# CORS: permite que o React (localhost:5173) acesse esta API (localhost:8000)
# Sem isso, o navegador bloqueia todas as requisições do React para cá
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,   # Necessário para cookies funcionarem entre origens
    allow_methods=["*"],
    allow_headers=["*"],
)

# Removemos os app.mount() de css, js e assets.
# O React/Vite passa a ser responsável por servir todos esses arquivos.

API_KEY = "2ba00226f0008ae80f498510e6d1882a"
URL_NOW_PLAYING = f"https://api.themoviedb.org/3/movie/now_playing?api_key={API_KEY}&language=pt-BR&page=1"


# ─────────────────────────────────────────────
# ROTAS DE FILMES (TMDB)
# ─────────────────────────────────────────────

@app.get("/api/filmes-lista")
async def pegar_lista():
    '''
    Retorna os 5 primeiros filmes em cartaz.
    Chamada pelo carrossel da Home e pela página Filmes em Cartaz.
    Igual à versão anterior — já retornava JSON, não precisou mudar a lógica.
    '''
    async with httpx.AsyncClient(verify=False) as client:
        resposta = await client.get(URL_NOW_PLAYING)
        dados = resposta.json()
        return dados.get("results", [])[:18]
    # O FastAPI converte o retorno (lista Python) em JSON automaticamente


@app.get("/api/filmes-em-breve")
async def api_em_breve():
    '''
    Retorna até 18 filmes com data de lançamento futura.
    Mesma lógica de antes — já era uma rota de API pura.
    '''
    hoje = datetime.now().strftime("%Y-%m-%d")
    filmes_futuros = []

    async with httpx.AsyncClient(verify=False) as client:
        for pagina in range(1, 18):
            url_paginada = f"https://api.themoviedb.org/3/movie/upcoming?api_key={API_KEY}&language=pt-BR&page={pagina}"
            resposta = await client.get(url_paginada)
            dados = resposta.json()
            todos_filmes = dados.get("results", [])

            filtrados = [f for f in todos_filmes if f.get("release_date", "") > hoje]
            filmes_futuros.extend(filtrados)

    return filmes_futuros[:18]


@app.get("/api/detalhes-completos/{filme_id}")
async def detalhes_completos(filme_id: int):
    '''
    Retorna todos os dados de um filme específico pelo ID do TMDB.
    O React usa esses dados para montar a página de detalhes.

    Antes: existia uma rota /detalhes/{filme_id} que retornava HTML via Jinja2.
    Agora: só esta rota de API existe, retornando JSON puro.
    O React faz a formatação de data e duração no próprio componente Detalhes.jsx.
    '''
    url_detalhes = f"https://api.themoviedb.org/3/movie/{filme_id}?api_key={API_KEY}&language=pt-BR"
    async with httpx.AsyncClient(verify=False) as client:
        resposta = await client.get(url_detalhes)
        return resposta.json()


# ─────────────────────────────────────────────
# ROTAS DE AUTENTICAÇÃO
# ─────────────────────────────────────────────

@app.post("/login")
async def processar_login(
    email: str = Form(...),
    senha: str = Form(...)
):
    '''
    Antes: retornava TemplateResponse (HTML) em caso de erro
           ou RedirectResponse + set_cookie em caso de sucesso.

    Agora: sempre retorna JSON.
    - Sucesso: {"sucesso": True, "nome": "...", "cpf": "..."}
    - Erro:    {"sucesso": False, "mensagem": "..."}

    O React recebe esse JSON, salva nome e cpf no localStorage,
    e faz o redirecionamento usando o navigate() do react-router-dom.

    Removemos o parâmetro "request: Request" pois não precisamos mais
    dele para renderizar templates — só usávamos para passar ao Jinja2.
    '''
    conexao = obter_conexao()
    if not conexao:
        # JSONResponse permite definir o status HTTP junto com o corpo
        # status_code=500 = erro interno do servidor
        return JSONResponse(
            status_code=500,
            content={"sucesso": False, "mensagem": "Erro de conexão com o servidor."}
        )

    try:
        cursor = conexao.cursor(dictionary=True)
        cursor.execute("SELECT cpf, nome, senha FROM Usuario WHERE email = %s", (email,))
        usuario = cursor.fetchone()

        if not usuario:
            # status_code=401 = não autorizado (credenciais inválidas)
            return JSONResponse(
                status_code=401,
                content={"sucesso": False, "mensagem": "E-mail ou senha incorretos."}
            )

        senha_valida = bcrypt.checkpw(senha.encode("utf-8"), usuario["senha"].encode("utf-8"))

        if not senha_valida:
            return JSONResponse(
                status_code=401,
                content={"sucesso": False, "mensagem": "E-mail ou senha incorretos."}
            )

        # Retorno simples — o React cuida de salvar e redirecionar
        return {"sucesso": True, "nome": usuario["nome"], "cpf": usuario["cpf"]}

    except Exception as e:
        print(f"Erro no login: {e}")
        return JSONResponse(
            status_code=500,
            content={"sucesso": False, "mensagem": "Ocorreu um erro ao tentar fazer login."}
        )
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()


@app.post("/cadastrar")
async def processar_cadastro(
    cpf: str = Form(...),
    nome: str = Form(...),
    email: str = Form(...),
    telefone: str = Form(...),
    data_nasc: str = Form(...),
    senha: str = Form(...)
):
    '''
    Antes: redirecionava para login.html em caso de sucesso,
           ou renderizava cadastro.html com mensagem de erro.

    Agora: retorna JSON em ambos os casos.
    - Sucesso: {"sucesso": True, "mensagem": "Cadastro realizado!"}
    - Erro:    {"sucesso": False, "mensagem": "CPF ou e-mail já em uso."}

    O React trata a resposta: em sucesso, redireciona para /login usando navigate().
    '''
    senha_cripto = bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(
            status_code=500,
            content={"sucesso": False, "mensagem": "Erro de conexão com o banco."}
        )

    try:
        cursor = conexao.cursor()
        sql = """
            INSERT INTO Usuario(cpf, nome, email, telefone, data_nasc, senha)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (cpf, nome, email, telefone, data_nasc, senha_cripto))
        conexao.commit()

        # status_code=201 = "Created" — convenção para criação de recurso bem-sucedida
        return JSONResponse(
            status_code=201,
            content={"sucesso": True, "mensagem": "Cadastro realizado com sucesso! Faça seu login."}
        )

    except Exception as e:
        print(f"Erro no banco: {e}")
        # status_code=409 = "Conflict" — recurso já existe (CPF ou e-mail duplicado)
        return JSONResponse(
            status_code=409,
            content={"sucesso": False, "mensagem": "Erro: CPF ou E-mail já estão em uso."}
        )

    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()


# ─────────────────────────────────────────────
# ROTAS DE PERFIL (CRUD de Usuário)
# ─────────────────────────────────────────────

@app.get("/perfil")
async def carregar_perfil(usuario_cpf: str = Header(default=None)):
    '''
    Antes: lia o CPF do cookie da requisição (request.cookies.get("usuario_cpf"))
           e retornava um TemplateResponse com o HTML do perfil.

    Agora: o React envia o CPF no HEADER da requisição (x-usuario-cpf),
           e a rota retorna os dados do usuário em JSON.

    Por que Header em vez de cookie?
    Cookies entre origens diferentes (5173 → 8000) exigem configuração
    extra de SameSite/Secure que complica o desenvolvimento local.
    Usar um header customizado é mais simples e igualmente seguro.

    No React, a chamada fica assim:
        fetch("http://localhost:8000/perfil", {
            headers: { "x-usuario-cpf": localStorage.getItem("usuario_cpf") }
        })
    '''
    if not usuario_cpf:
        # status_code=401 = não autenticado
        return JSONResponse(status_code=401, content={"erro": "Não autenticado."})

    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão."})

    try:
        cursor = conexao.cursor(dictionary=True)
        cursor.execute(
            "SELECT cpf, nome, email, telefone, data_nasc FROM Usuario WHERE cpf = %s",
            (usuario_cpf,)
        )
        usuario = cursor.fetchone()

        if not usuario:
            return JSONResponse(status_code=404, content={"erro": "Usuário não encontrado."})

        # Converte data_nasc para string se for objeto date do Python
        # (o JSON não sabe serializar objetos datetime nativos)
        if usuario.get("data_nasc"):
            usuario["data_nasc"] = str(usuario["data_nasc"])

        return usuario  # FastAPI converte o dicionário em JSON automaticamente

    except Exception as e:
        print(f"Erro ao carregar perfil: {e}")
        return JSONResponse(status_code=500, content={"erro": "Erro interno."})
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()


@app.post("/atualizar_perfil")
async def atualizar_perfil(
    nome: str = Form(...),
    email: str = Form(...),
    telefone: str = Form(...),
    data_nasc: str = Form(...),
    usuario_cpf: str = Header(default=None)   # CPF vem no header, igual ao GET /perfil
):
    '''
    Antes: lia CPF do cookie, fazia UPDATE e retornava HTML com set_cookie atualizado.
    Agora: lia CPF do header, faz UPDATE e retorna JSON com os dados atualizados.

    O React atualiza o localStorage com o novo nome após sucesso:
        localStorage.setItem("usuario_nome", dados.usuario.nome)
    '''
    if not usuario_cpf:
        return JSONResponse(status_code=401, content={"sucesso": False, "mensagem": "Não autenticado."})

    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"sucesso": False, "mensagem": "Erro de conexão."})

    try:
        cursor = conexao.cursor(dictionary=True)
        cursor.execute(
            "UPDATE Usuario SET nome = %s, email = %s, telefone = %s, data_nasc = %s WHERE cpf = %s",
            (nome, email, telefone, data_nasc, usuario_cpf)
        )
        conexao.commit()

        # Busca os dados atualizados para devolver ao React
        cursor.execute(
            "SELECT cpf, nome, email, telefone, data_nasc FROM Usuario WHERE cpf = %s",
            (usuario_cpf,)
        )
        usuario_atualizado = cursor.fetchone()

        if usuario_atualizado.get("data_nasc"):
            usuario_atualizado["data_nasc"] = str(usuario_atualizado["data_nasc"])

        return {
            "sucesso": True,
            "mensagem": "Dados atualizados com sucesso!",
            "usuario": usuario_atualizado
        }

    except Exception as e:
        print(f"Erro ao atualizar: {e}")
        return JSONResponse(
            status_code=500,
            content={"sucesso": False, "mensagem": "Erro ao atualizar os dados."}
        )
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()


@app.post("/deletar_conta")
async def deletar_conta(usuario_cpf: str = Header(default=None)):
    '''
    Antes: deletava o registro, apagava cookies e redirecionava para "/".
    Agora: deleta o registro e retorna JSON confirmando.

    O React, ao receber {"sucesso": True}, limpa o localStorage e
    redireciona para "/" usando navigate("/").
    '''
    if not usuario_cpf:
        return JSONResponse(status_code=401, content={"sucesso": False, "mensagem": "Não autenticado."})

    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"sucesso": False, "mensagem": "Erro de conexão."})

    try:
        cursor = conexao.cursor()
        cursor.execute("DELETE FROM Usuario WHERE cpf = %s", (usuario_cpf,))
        conexao.commit()

        return {"sucesso": True, "mensagem": "Conta excluída com sucesso."}

    except Exception as e:
        print(f"Erro ao deletar conta: {e}")
        # status_code=409 = conflito (provavelmente ingressos vinculados — FK no banco)
        return JSONResponse(
            status_code=409,
            content={
                "sucesso": False,
                "mensagem": "Não é possível excluir a conta pois existem ingressos vinculados a ela."
            }
        )
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()
