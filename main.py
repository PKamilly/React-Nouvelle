'''
Importar as ferramentas
FastApi cria o servidor, enquanto o request lida com os pedidos de acessar o site
'''
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Request, Form
from fastapi.responses import RedirectResponse
from conexao import obter_conexao
from datetime import datetime
import httpx
import bcrypt

# Variável que instância um objeto da classe FastApi, criando o app
app = FastAPI()

app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# Variável que instância um objeto da classe Jinja2Templates que determina o local onde procurar um HTML
templates = Jinja2Templates(directory="templates")
API_KEY = "2ba00226f0008ae80f498510e6d1882a"
url = f"https://api.themoviedb.org/3/movie/now_playing?api_key={API_KEY}&language=pt-BR&page=1"

@app.get("/")
# Função Assincrona (endpoint) que recebe o parâmetro do tipo Request chamado request
async def home(request: Request):

    # Gerenciador de contexto que instancia um objeto AsyncClient
    # !!!! Para funcionar no servidor da puc deve ter o "verify=False" sempre que tiver a linha abaixo !!!!
    async with httpx.AsyncClient(verify=False) as client:

        # Chamada de método, o await pede pra esperar, salvando o objeto da resposta na variável
        resposta = await client.get(url)
        # Chamada de Método que transforma a resposta de uma forma que o python consiga ler, salvando na variável dados
        dados = resposta.json()
        # Chamada de método e fatiamento, o método .get("resultado") extrai os 5 primeiros filmes da api e salva na variável
        filmes_recentes = dados.get("results", [])[:5]

    # Chamada de método que utiliza o método .TemplateResponse() para montar o HTML
    # Para funcionar, é necessário passar o nome do arquivo e um dicionário de contexto do request e lista de filmes
    return templates.TemplateResponse(
        request=request, 
        name="index.html", 
        context={"request": request, "filmes": filmes_recentes}
    )

# Mostra para o js como buscar somente os 5 primeiros filmes
@app.get("/api/filmes-lista")
async def pegar_lista():
    async with httpx.AsyncClient(verify=False) as client:
        resposta = await client.get(url)
        dados = resposta.json()
        return dados.get("results", [])[:5]

@app.get("/api/detalhes/{filme_id}")
async def pegar_detalhes(filme_id: int):
    # Imagine que você busca os detalhes de um filme específico aqui
    return {"id": filme_id, "status": "Disponível", "assentos": [1, 5, 8]}

@app.get("/detalhes/{filme_id}")
async def detalhes_pagina(request: Request, filme_id: int):
    url_detalhes = f"https://api.themoviedb.org/3/movie/{filme_id}?api_key={API_KEY}&language=pt-BR"
    
    async with httpx.AsyncClient(verify=False) as client:
        resposta = await client.get(url_detalhes)
        filme_dados = resposta.json()
        
    # Recebe a data de hoje
    hoje = datetime.now().strftime("%Y-%m-%d")
    # Recebe a data de lançamento do filme (se não tiver, usa string vazia)
    data_lancamento = filme_dados.get("release_date", "")

    # Função para formatar a data
    def formatar_data_br(valor):
        if not valor:
            return ""
        try:
            # Converte a string da API para um objeto de data e depois para o formato PT
            data_obj = datetime.strptime(valor, "%Y-%m-%d")
            return data_obj.strftime("%d/%m/%Y")
        except:
            return valor

    # Regista o filtro no Jinja2
    templates.env.filters['data_pt'] = formatar_data_br

    # Filtro de data
    def formatar_duracao(minutos):
        if not minutos:
            return "N/A"
        horas = minutos // 60
        resto_minutos = minutos % 60
        # O :02d garante que 5 minutos fiquem como "05"
        return f"{horas}h {resto_minutos:02d}min"

    # Regista o filtro no ambiente do Jinja2
    templates.env.filters['tempo_h'] = formatar_duracao
    
    # Se a data de lançamento for menor ou igual a hoje, o ingresso pode ser comprado
    pode_comprar = data_lancamento <= hoje if data_lancamento else False

    return templates.TemplateResponse(
        request=request,
        name="detalhes.html",
        context={
            "request": request, 
            "filme": filme_dados,
            "pode_comprar": pode_comprar # Enviamos a variável para o HTML
        }
    )

@app.get("/api/filmes-em-breve")
async def api_em_breve():
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

# Mostra o caminho de outra página para o python
@app.get("/filmesCartaz")
async def filmesCartaz(request: Request):

    async with httpx.AsyncClient(verify=False) as client:
        resposta = await client.get(url)
        dados = resposta.json()
        filmesCartaz = dados.get("results", [])[:18]

    return templates.TemplateResponse(
        request=request,
        name="filmesCartaz.html",
        context={"request": request, "filmes": filmesCartaz}
    )

@app.get("/emBreve")
async def emBreve(request: Request):
    hoje = datetime.now().strftime("%Y-%m-%d")
    filmes_futuros = []

    async with httpx.AsyncClient(verify=False) as client:
        # Buscar a páginas 
        for pagina in range(1, 18):
            url_paginada = f"https://api.themoviedb.org/3/movie/upcoming?api_key={API_KEY}&language=pt-BR&page={pagina}"
            resposta = await client.get(url_paginada)
            dados = resposta.json()
            todos_filmes = dados.get("results", [])
        # Filtro de Filmes com data maior que hoje    
            filtrados = [f for f in todos_filmes if f.get("release_date", "") > hoje]
            filmes_futuros.extend(filtrados)

    emBreve_final = filmes_futuros[:18]

    return templates.TemplateResponse(
        request=request,
        name="emBreve.html", 
        context={"request": request, "filmes": emBreve_final}
    )


@app.get("/cadastro")
async def cadastro_pagina (request: Request):
    return templates.TemplateResponse(
        request=request,
        name="cadastro.html",
        context={"request": request}
    )

@app.post("/cadastrar")
async def processar_cadastro(
    request: Request,
    cpf: str = Form(...),
    nome: str = Form(...),
    email: str = Form(...),
    telefone: str = Form(...),
    data_nasc: str = Form(...),
    senha: str = Form(...)
):
    bytes_senha = senha.encode('utf-8')
    salt = bcrypt.gensalt()
    senha_cripto = bcrypt.hashpw(bytes_senha, salt).decode('utf-8')

    conexao = obter_conexao()
    if not conexao:
        return templates.TemplateResponse(
            request=request, 
            name="cadastro.html",
            context={"request": request, "mensagem": "Erro de conexão com o banco."})
    try:
        cursor = conexao.cursor()

        sql = """
            INSERT INTO Usuario(cpf, nome, email, telefone, data_nasc, senha)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        valores = (cpf, nome, email, telefone, data_nasc, senha_cripto)

        cursor.execute(sql, valores)
        conexao.commit()

        return templates.TemplateResponse(
            request=request, 
            name="login.html", 
            context={"request": request, "mensagem": "Cadastro realizado com sucesso! Faça seu login."})
    
    except Exception as e:
        print(f"Erro no banco: {e}")
        return templates.TemplateResponse(
            request=request, 
            name="cadastro.html", 
            context={"request": request, "mensagem": "Erro: CPF ou E-mail já estão em uso."})  
    
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()

@app.get("/login")
async def login_pagina(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={"request": request}
    )

@app.post("/login")
async def processar_login(
    request: Request,
    email: str = Form(...),
    senha: str = Form(...),
):
    conexao = obter_conexao()
    if not conexao:
        return templates.TemplateResponse(
            request=request,
            name="login.html", 
            context={"request": request, "mensagem": "Erro de conexão com o servidor."}
        )
    
    try:
        cursor = conexao.cursor(dictionary=True) # O Dictionary faz o MySql devolver os dados com os nomes das colunas

        sql = "Select cpf, nome, senha FROM Usuario WHERE email = %s"
        cursor.execute(sql, (email,))
        usuario = cursor.fetchone()

        if not usuario:
            return templates.TemplateResponse(
                request=request,
                name="login.html", 
                context={"request": request, "mensagem": "E-mail ou senha incorretos."}
            )
        
        bytes_senha_digitada = senha.encode('utf-8')
        bytes_senha_banco = usuario['senha'].encode('utf-8')

        senha_valida = bcrypt.checkpw(bytes_senha_digitada, bytes_senha_banco)
        
        if not senha_valida:
            return templates.TemplateResponse(
                request=request,
                name="login.html", 
                context={"request": request, "mensagem": "E-mail ou senha incorretos."}
            )
        
        resposta = RedirectResponse(url="/", status_code=303)
        resposta.set_cookie(key="usuario_nome", value=usuario['nome'])
        resposta.set_cookie(key="usuario_cpf", value=usuario['cpf'])

        return resposta
    except Exception as e:
        print(f"Erro no Login: {e}")
        return templates.TemplateResponse(
            request=request,
            name="login.html", 
            context={"request": request, "mensagem": "Ocorreu um erro ao tentar fazer login."}
        )
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()


@app.get("/logout")
async def logout():
    resposta = RedirectResponse(url="/", status_code=303)
    resposta.delete_cookie("usuario_nome")
    resposta.delete_cookie("usuario_cpf")
    return resposta

@app.get("/perfil")
async def carregar_perfil(request: Request):
    cpf_logado = request.cookies.get("usuario_cpf")

    if not cpf_logado:
        return RedirectResponse(url="/login.html", status_code=303)
    
    conexao = obter_conexao()
    if not conexao:
        return RedirectResponse(url="/", status_code=303)
    
    try:
        cursor = conexao.cursor(dictionary=True)

        # Aqui a parte do READ do CRUD
        sql = "SELECT cpf, nome, email, telefone, data_nasc FROM Usuario WHERE cpf = %s"
        cursor.execute(sql, (cpf_logado,))
        usuario_dados = cursor.fetchone()

        return templates.TemplateResponse(
            request=request,
            name="perfil.html",
            context={"request": request, "usuario": usuario_dados}
        )
    
    except Exception as e:
        print(f"Erro ao carregar perfil: {e}")
        return RedirectResponse(url="/", status_code=303)
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()

@app.post("/atualizar_perfil")
async def atualizar_perfil(
    request: Request,
    nome: str = Form(...),
    email: str = Form(...),
    telefone: str = Form(...),
    data_nasc: str = Form(...)
):
    cpf_logado = request.cookies.get("usuario_cpf")

    if not cpf_logado:
        return RedirectResponse(url="/login", status_code=303)
    
    conexao = obter_conexao()
    if not conexao:
        return RedirectResponse(url="/", status_code=303)
    
    try:
        cursor = conexao.cursor(dictionary=True)

        # Aqui que rola o update
        sql_update = """
            UPDATE Usuario
            SET nome = %s, email = %s, telefone = %s, data_nasc = %s
            WHERE cpf = %s
        """
        cursor.execute(sql_update, (nome, email, telefone, data_nasc, cpf_logado))
        conexao.commit()

        cursor.execute("SELECT cpf, nome, email, telefone, data_nasc FROM Usuario WHERE cpf = %s", (cpf_logado,))
        usuario_atualizado = cursor.fetchone()

        resposta = templates.TemplateResponse(
            request = request,
            name = "perfil.html",
            context = {"request": request, "usuario": usuario_atualizado, "mensagem": "Dados atualizados com sucesso!"}
        )

        resposta.set_cookie(key="usuario_nome", value = nome)

        return resposta
    
    except Exception as e:
        print(f"Erro ao atualizar: {e}")

        return RedirectResponse(url="perfil", status_code=303)
    
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()

@app.post("/deletar_conta")
async def deletar_conta(request: Request):
    cpf_logado = request.cookies.get("usuario_cpf")

    if not cpf_logado:
        return RedirectResponse(url = "/login", status_code=303)
    
    conexao = obter_conexao()
    if not conexao:
        return RedirectResponse(url="/", status_code=303)
    
    try:
        cursor = conexao.cursor()

        cursor.execute("DELETE FROM Usuario WHERE cpf = %s", (cpf_logado,)) 
        conexao.commit()

        resposta = RedirectResponse(url="/", status_code=303)
        resposta.delete_cookie("usuario_nome")
        resposta.delete_cookie("usuario_cpf")
        return resposta

    except Exception as e:
        print(f"Erro ao deletar conta: {e}")

        cursor.execute("SELECT cpf, nome, email, telefone, data_nasc FROM Usuario WHERE cpf = %s", (cpf_logado,))
        usuario_atualizado = cursor.fetchone()

        return templates.TemplateResponse(
            request = request,
            name="perfil.html",
            context={
                "request": request,
                "usuario": usuario_atualizado,
                "mensagem": "Erro: Não é possível excluir a conta pois existem ingressos vinculados a ela."
                }
        )
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()

@app.get("/pagamento")
async def pagamento(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="pagamento.html",
        context={"request": request}
    )

@app.get("/assentos")
async def assentos(request: Request):
    # Verifica se o usuário tem o cookie de CPF (ou seja, se está logado)
    usuario_logado = request.cookies.get("usuario_cpf")

    if not usuario_logado:
        # Se não estiver logado, redireciona para a página de login
        # Você pode passar um parâmetro 'proxima' para voltar aqui depois do login
        return RedirectResponse(url="/login", status_code=303)

    return templates.TemplateResponse(
        request=request,
        name="assentos.html",
        context={"request": request}
    )
    