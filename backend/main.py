from fastapi import FastAPI, Request, Form, Header, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from conexao import obter_conexao
from datetime import datetime
import httpx
import bcrypt
import re
import shutil
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/assets", StaticFiles(directory="assets"), name="assets")

API_KEY = "2ba00226f0008ae80f498510e6d1882a"
URL_NOW_PLAYING = f"https://api.themoviedb.org/3/movie/now_playing?api_key={API_KEY}&language=pt-BR&page=1"

def _is_admin(cpf: str) -> bool:
    if not cpf:
        return False
    conexao = obter_conexao()
    if not conexao:
        return False
    try:
        cursor = conexao.cursor(dictionary=True)
        cursor.execute("SELECT permissao FROM Usuario WHERE cpf = %s", (cpf,))
        user = cursor.fetchone()
        return user is not None and user.get("permissao") == "ADMINISTRADOR"
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.get("/api/filmes-lista")
async def pegar_lista():
    async with httpx.AsyncClient(verify=False) as client:
        resposta = await client.get(URL_NOW_PLAYING)
        dados = resposta.json()
        return dados.get("results", [])[:18]

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

@app.get("/api/detalhes-completos/{filme_id}")
async def detalhes_completos(filme_id: int):
    url_detalhes = f"https://api.themoviedb.org/3/movie/{filme_id}?api_key={API_KEY}&language=pt-BR"
    async with httpx.AsyncClient(verify=False) as client:
        resposta = await client.get(url_detalhes)
        return resposta.json()

@app.post("/login")
async def processar_login(email: str = Form(...), senha: str = Form(...)):
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"sucesso": False, "mensagem": "Erro de conexão com o servidor."})
    try:
        cursor = conexao.cursor(dictionary=True)
        cursor.execute("SELECT cpf, nome, senha, permissao, caminho_final FROM Usuario WHERE email = %s", (email,))
        usuario = cursor.fetchone()
        if not usuario:
            return JSONResponse(status_code=401, content={"sucesso": False, "mensagem": "E-mail ou senha incorretos."})
        senha_valida = bcrypt.checkpw(senha.encode("utf-8"), usuario["senha"].encode("utf-8"))
        if not senha_valida:
            return JSONResponse(status_code=401, content={"sucesso": False, "mensagem": "E-mail ou senha incorretos."})
        return {
            "sucesso": True,
            "nome": usuario["nome"],
            "cpf": usuario["cpf"],
            "permissao": usuario["permissao"],
            "caminho_final": usuario["caminho_final"]
        }
    except Exception:
        return JSONResponse(status_code=500, content={"sucesso": False, "mensagem": "Ocorreu um erro ao tentar fazer login."})
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
    try:
        data_nascimento = datetime.strptime(data_nasc, "%Y-%m-%d")
    except ValueError:
        return JSONResponse(status_code=400, content={"sucesso": False, "mensagem": "Data de nascimento inválida."})
    hoje = datetime.now()
    idade = hoje.year - data_nascimento.year - ((hoje.month, hoje.day) < (data_nascimento.month, data_nascimento.day))
    if idade < 18 or idade > 120:
        return JSONResponse(status_code=400, content={"sucesso": False, "mensagem": "Idade Inválida: Você precisa ter entre 18 e 120 anos para se cadastrar."})
    padrao_senha = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};\':"\\|,.<>/?]).{8,}$')
    if not padrao_senha.match(senha):
        return JSONResponse(status_code=400, content={"sucesso": False, "mensagem": "Senha fraca."})
    senha_cripto = bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"sucesso": False, "mensagem": "Erro de conexão com o banco."})
    try:
        cursor = conexao.cursor()
        sql = "INSERT INTO Usuario(cpf, nome, email, telefone, data_nasc, senha, caminho_final) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        cursor.execute(sql, (cpf, nome, email, telefone, data_nasc, senha_cripto, "assets/fotoPerfilDefault.png"))
        conexao.commit()
        return JSONResponse(status_code=201, content={"sucesso": True, "mensagem": "Cadastro realizado com sucesso!"})
    except Exception:
        return JSONResponse(status_code=409, content={"sucesso": False, "mensagem": "Erro: CPF ou E-mail já estão em uso."})
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()

@app.get("/perfil")
async def carregar_perfil(usuario_cpf: str = Header(default=None)):
    if not usuario_cpf:
        return JSONResponse(status_code=401, content={"erro": "Não autenticado."})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão."})
    try:
        cursor = conexao.cursor(dictionary=True)
        cursor.execute("SELECT cpf, nome, email, telefone, data_nasc, caminho_final FROM Usuario WHERE cpf = %s", (usuario_cpf,))
        usuario = cursor.fetchone()
        if not usuario:
            return JSONResponse(status_code=404, content={"erro": "Usuário não encontrado."})
        if usuario.get("data_nasc"):
            usuario["data_nasc"] = str(usuario["data_nasc"])
        return usuario
    except Exception:
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
    nova_senha: str = Form(None),
    confirmar_senha: str = Form(None),
    usuario_cpf: str = Header(default=None)
):
    if not usuario_cpf:
        return JSONResponse(status_code=401, content={"sucesso": False, "mensagem": "Não autenticado."})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"sucesso": False, "mensagem": "Erro de conexão."})
    try:
        cursor = conexao.cursor(dictionary=True)
        senha_cripto = None
        if nova_senha:
            if nova_senha != confirmar_senha:
                return JSONResponse(status_code=400, content={"sucesso": False, "mensagem": "As senhas não coincidem."})
            padrao_senha = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};\':"\\|,.<>/?]).{8,}$')
            if not padrao_senha.match(nova_senha):
                return JSONResponse(status_code=400, content={"sucesso": False, "mensagem": "A nova senha não atende aos requisitos."})
            senha_cripto = bcrypt.hashpw(nova_senha.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        if senha_cripto:
            sql_update = "UPDATE Usuario SET nome = %s, email = %s, telefone = %s, data_nasc = %s, senha = %s WHERE cpf = %s"
            cursor.execute(sql_update, (nome, email, telefone, data_nasc, senha_cripto, usuario_cpf))
        else:
            sql_update = "UPDATE Usuario SET nome = %s, email = %s, telefone = %s, data_nasc = %s WHERE cpf = %s"
            cursor.execute(sql_update, (nome, email, telefone, data_nasc, usuario_cpf))
        conexao.commit()
        cursor.execute("SELECT cpf, nome, email, telefone, data_nasc, caminho_final FROM Usuario WHERE cpf = %s", (usuario_cpf,))
        usuario_atualizado = cursor.fetchone()
        if usuario_atualizado.get("data_nasc"):
            usuario_atualizado["data_nasc"] = str(usuario_atualizado["data_nasc"])
        return {"sucesso": True, "mensagem": "Dados atualizados com sucesso!", "usuario": usuario_atualizado}
    except Exception:
        return JSONResponse(status_code=500, content={"sucesso": False, "mensagem": "Erro ao atualizar os dados."})
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()

@app.post("/atualizar_foto_perfil")
async def atualizar_foto_perfil(
    excluir_foto: str = Form(None),
    foto_perfil: UploadFile = File(None),
    usuario_cpf: str = Header(default=None)
):
    if not usuario_cpf:
        return JSONResponse(status_code=401, content={"sucesso": False, "mensagem": "Não autenticado."})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"sucesso": False, "mensagem": "Erro de conexão."})
    caminho_foto = None
    if excluir_foto == "true":
        caminho_foto = "assets/fotoPerfilDefault.png"
    elif foto_perfil and foto_perfil.filename:
        os.makedirs("assets/uploads", exist_ok=True)
        try:
            cursor_limpeza = conexao.cursor()
            cursor_limpeza.execute("SELECT caminho_final FROM Usuario WHERE cpf = %s", (usuario_cpf,))
            row = cursor_limpeza.fetchone()
            cursor_limpeza.close()
            if row:
                caminho_antigo = row[0]
                if caminho_antigo and caminho_antigo != "assets/fotoPerfilDefault.png":
                    if os.path.exists(caminho_antigo):
                        os.remove(caminho_antigo)
        except Exception:
            pass
        ts = datetime.now().strftime("%Y%m%d%H%M%S")
        extensao = os.path.splitext(foto_perfil.filename)[1]
        nome_arquivo = f"{usuario_cpf}_{ts}{extensao}"
        caminho_disco = os.path.join("assets/uploads", nome_arquivo)
        with open(caminho_disco, "wb") as buffer:
            shutil.copyfileobj(foto_perfil.file, buffer)
        caminho_foto = f"assets/uploads/{nome_arquivo}"
    if caminho_foto is None:
        return JSONResponse(status_code=400, content={"sucesso": False, "mensagem": "Nenhuma ação realizada."})
    try:
        cursor = conexao.cursor(dictionary=True)
        cursor.execute("UPDATE Usuario SET caminho_final = %s WHERE cpf = %s", (caminho_foto, usuario_cpf))
        conexao.commit()
        return {"sucesso": True, "mensagem": "Imagem atualizada!", "caminho_final": caminho_foto}
    except Exception:
        return JSONResponse(status_code=500, content={"sucesso": False, "mensagem": "Erro ao atualizar foto."})
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()

@app.post("/deletar_conta")
async def deletar_conta(usuario_cpf: str = Header(default=None)):
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
    except Exception:
        return JSONResponse(status_code=409, content={"sucesso": False, "mensagem": "Não é possível excluir a conta pois existem ingressos vinculados a ela."})
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()

@app.get("/api/meus-ingressos")
async def meus_ingressos(usuario_cpf: str = Header(default=None)):
    if not usuario_cpf:
        return JSONResponse(status_code=401, content={"erro": "Não autenticado."})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão."})
    try:
        cursor = conexao.cursor(dictionary=True)
        sql = """
            SELECT i.id AS ingresso_id, f.nome AS filme_nome, se.horario_inicio, se.dub_leg,
                   i.numero_assento, p.valor_total, p.metodo_pagamento, p.status,
                   p.id AS pagamento_id, sa.qtde_assentos AS sala_quantidade, f.descricao AS filme_descricao
            FROM Ingresso i
            JOIN Pagamento p ON i.fk_Pagamento_id = p.id
            JOIN sessao se ON i.fk_sessao_id = se.id
            JOIN Filme f ON se.fk_Filme_id = f.id
            JOIN Sala sa ON se.fk_Sala_id = sa.id
            WHERE p.fk_Usuario_cpf = %s
            ORDER BY se.horario_inicio DESC
        """
        cursor.execute(sql, (usuario_cpf,))
        ingressos = cursor.fetchall()
        for ingresso in ingressos:
            if ingresso.get("horario_inicio"):
                ingresso["horario_inicio"] = ingresso["horario_inicio"].strftime("%Y-%m-%d %H:%M")
            if ingresso.get("valor_total") is not None:
                ingresso["valor_total"] = float(ingresso["valor_total"])
        return ingressos
    except Exception:
        return JSONResponse(status_code=500, content={"erro": "Erro ao carregar ingressos."})
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()

@app.post("/api/pagamento")
async def processar_pagamento(request: Request, usuario_cpf: str = Header(default=None)):
    if not usuario_cpf:
        return JSONResponse(status_code=401, content={"success": False, "message": "Não autenticado."})
    body = await request.json()
    assentos_lista = body.get("assentos", [])
    sessao_id = body.get("sessao_id")
    metodo_pagamento = body.get("metodo_pagamento")
    pixKey = body.get("pixKey")
    nomeCartao = body.get("nomeCartao")
    numeroCartao = body.get("numeroCartao")
    validade = body.get("validade")
    cvv = body.get("cvv")
    if not assentos_lista:
        return JSONResponse(status_code=400, content={"success": False, "message": "Nenhum assento selecionado."})
    if not sessao_id:
        return JSONResponse(status_code=400, content={"success": False, "message": "Sessão não informada."})
    if metodo_pagamento not in ("PIX", "CARTAO_CREDITO", "CARTAO_DEBITO"):
        return JSONResponse(status_code=400, content={"success": False, "message": "Método de pagamento inválido."})
    if metodo_pagamento == "PIX":
        if not pixKey or not str(pixKey).strip():
            return JSONResponse(status_code=400, content={"success": False, "message": "Chave PIX é obrigatória."})
    else:
        if not nomeCartao or not numeroCartao or not validade or not cvv:
            return JSONResponse(status_code=400, content={"success": False, "message": "Dados do cartão são obrigatórios."})
        numero_limpo = str(numeroCartao).replace(' ', '')
        if not numero_limpo.isdigit() or len(numero_limpo) != 16:
            return JSONResponse(status_code=400, content={"success": False, "message": "Número do cartão inválido."})
        if not re.match(r'^\d{2}/\d{2}$', str(validade)):
            return JSONResponse(status_code=400, content={"success": False, "message": "Validade deve estar no formato MM/AA."})
        if not str(cvv).isdigit() or len(str(cvv)) != 3:
            return JSONResponse(status_code=400, content={"success": False, "message": "CVV inválido."})
    preco_unitario = 35.00
    valor_total = len(assentos_lista) * preco_unitario
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"success": False, "message": "Erro de conexão com o banco."})
    try:
        cursor = conexao.cursor()
        sql_pagamento = "INSERT INTO Pagamento (valor_total, metodo_pagamento, status, fk_Usuario_cpf) VALUES (%s, %s, %s, %s)"
        cursor.execute(sql_pagamento, (valor_total, metodo_pagamento, 'APROVADO', usuario_cpf))
        pagamento_id = cursor.lastrowid
        for assento in assentos_lista:
            sql_ingresso = "INSERT INTO Ingresso (numero_assento, fk_Pagamento_id, fk_sessao_id) VALUES (%s, %s, %s)"
            cursor.execute(sql_ingresso, (assento, pagamento_id, sessao_id))
        conexao.commit()
        return JSONResponse(status_code=200, content={"success": True, "message": "Pagamento processado com sucesso!"})
    except Exception:
        return JSONResponse(status_code=500, content={"success": False, "message": "Erro ao processar pagamento."})
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()

@app.get("/api/sessao/{sessao_id}")
async def detalhes_sessao(sessao_id: int):
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão."})
    try:
        cursor = conexao.cursor(dictionary=True)
        sql = """
            SELECT s.id AS sessao_id, s.horario_inicio, s.dub_leg, sa.id AS sala_id, sa.qtde_assentos, f.nome AS filme_nome
            FROM sessao s JOIN Filme f ON s.fk_Filme_id = f.id JOIN Sala sa ON s.fk_Sala_id = sa.id WHERE s.id = %s
        """
        cursor.execute(sql, (sessao_id,))
        sessao = cursor.fetchone()
        if not sessao:
            return JSONResponse(status_code=404, content={"erro": "Sessão não encontrada."})
        return {
            "sessao_id": sessao["sessao_id"],
            "filme_nome": sessao["filme_nome"],
            "sala_id": sessao["sala_id"],
            "horario_str": sessao["horario_inicio"].strftime("%H:%M") if sessao["horario_inicio"] else "",
            "data_str": sessao["horario_inicio"].strftime("%d/%m/%Y") if sessao["horario_inicio"] else "",
            "tipo": "Dublado" if sessao["dub_leg"] == "DUB" else "Legendado",
            "qtde_assentos": sessao["qtde_assentos"],
        }
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.get("/api/assentos-ocupados/{sessao_id}")
async def assentos_ocupados(sessao_id: int):
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"ocupados": []})
    try:
        cursor = conexao.cursor()
        cursor.execute("SELECT numero_assento FROM Ingresso WHERE fk_sessao_id = %s", (sessao_id,))
        rows = cursor.fetchall()
        return {"ocupados": [row[0] for row in rows]}
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.get("/api/sessoes-filme/{tmdb_id}")
async def sessoes_filme(tmdb_id: int):
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor(dictionary=True)
        cursor.execute("SELECT id FROM Filme WHERE tmdb_id = %s", (tmdb_id,))
        filme = cursor.fetchone()
        if not filme:
            cursor.execute("INSERT INTO Filme (tmdb_id, nome, duracao, descricao) VALUES (%s, %s, %s, %s)", (tmdb_id, f"Filme {tmdb_id}", 0, ""))
            conexao.commit()
            filme_id = cursor.lastrowid
        else:
            filme_id = filme['id']
        sql = """
            SELECT s.id, s.horario_inicio, s.dub_leg, sa.id AS sala_id, sa.qtde_assentos, f.nome AS filme_nome
            FROM sessao s JOIN Filme f ON s.fk_Filme_id = f.id JOIN Sala sa ON s.fk_Sala_id = sa.id
            WHERE s.fk_Filme_id = %s AND s.horario_inicio > NOW() ORDER BY s.horario_inicio
        """
        cursor.execute(sql, (filme_id,))
        sessoes = cursor.fetchall()
        for sessao in sessoes:
            if sessao.get("horario_inicio"):
                sessao["horario_inicio"] = sessao["horario_inicio"].strftime("%Y-%m-%d %H:%M")
        return {"sessoes": sessoes}
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.get("/api/admin/salas")
async def listar_salas(request: Request):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Sala ORDER BY id")
        return cursor.fetchall()
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.post("/api/admin/salas")
async def criar_sala(request: Request):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    body = await request.json()
    qtde = body.get("qtde_assentos")
    if not qtde:
        return JSONResponse(status_code=400, content={"erro": "qtde_assentos é obrigatório"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor()
        cursor.execute("INSERT INTO Sala (qtde_assentos) VALUES (%s)", (qtde,))
        conexao.commit()
        return JSONResponse(status_code=201, content={"id": cursor.lastrowid, "qtde_assentos": qtde})
    except Exception as e:
        return JSONResponse(status_code=500, content={"erro": str(e)})
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.put("/api/admin/salas/{sala_id}")
async def atualizar_sala(request: Request, sala_id: int):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    body = await request.json()
    qtde = body.get("qtde_assentos")
    if not qtde:
        return JSONResponse(status_code=400, content={"erro": "qtde_assentos é obrigatório"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor()
        cursor.execute("UPDATE Sala SET qtde_assentos = %s WHERE id = %s", (qtde, sala_id))
        conexao.commit()
        if cursor.rowcount == 0:
            return JSONResponse(status_code=404, content={"erro": "Sala não encontrada"})
        return {"mensagem": "Sala atualizada com sucesso"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"erro": str(e)})
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.delete("/api/admin/salas/{sala_id}")
async def deletar_sala(request: Request, sala_id: int):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor()
        cursor.execute("DELETE FROM Sala WHERE id = %s", (sala_id,))
        conexao.commit()
        if cursor.rowcount == 0:
            return JSONResponse(status_code=404, content={"erro": "Sala não encontrada"})
        return {"mensagem": "Sala removida com sucesso"}
    except Exception:
        return JSONResponse(status_code=409, content={"erro": "Não é possível remover: existem sessões vinculadas a esta sala."})
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.get("/api/admin/filmes")
async def listar_filmes_db(request: Request):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Filme ORDER BY id")
        return cursor.fetchall()
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.post("/api/admin/filmes")
async def criar_filme_db(request: Request):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    body = await request.json()
    tmdb_id = body.get("tmdb_id")
    nome = body.get("nome")
    duracao = body.get("duracao")
    descricao = body.get("descricao", "")
    if not all([tmdb_id, nome, duracao]):
        return JSONResponse(status_code=400, content={"erro": "tmdb_id, nome e duracao são obrigatórios"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor()
        cursor.execute("INSERT INTO Filme (tmdb_id, nome, duracao, descricao) VALUES (%s, %s, %s, %s)", (tmdb_id, nome, duracao, descricao))
        conexao.commit()
        return JSONResponse(status_code=201, content={"id": cursor.lastrowid})
    except Exception as e:
        return JSONResponse(status_code=409, content={"erro": "tmdb_id já cadastrado ou erro: " + str(e)})
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.delete("/api/admin/filmes/{filme_id}")
async def deletar_filme_db(request: Request, filme_id: int):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor()
        cursor.execute("DELETE FROM Filme WHERE id = %s", (filme_id,))
        conexao.commit()
        if cursor.rowcount == 0:
            return JSONResponse(status_code=404, content={"erro": "Filme não encontrado"})
        return {"mensagem": "Filme removido com sucesso"}
    except Exception:
        return JSONResponse(status_code=409, content={"erro": "Não é possível remover: existem sessões vinculadas a este filme."})
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.put("/api/admin/filmes/{filme_id}")
async def atualizar_filme_db(request: Request, filme_id: int):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    body = await request.json()
    nome = body.get("nome")
    duracao = body.get("duracao")
    descricao = body.get("descricao", "")
    if not nome or not duracao:
        return JSONResponse(status_code=400, content={"erro": "nome e duracao são obrigatórios"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor()
        cursor.execute("UPDATE Filme SET nome = %s, duracao = %s, descricao = %s WHERE id = %s", (nome, duracao, descricao, filme_id))
        conexao.commit()
        if cursor.rowcount == 0:
            return JSONResponse(status_code=404, content={"erro": "Filme não encontrado"})
        return {"mensagem": "Filme atualizado com sucesso"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"erro": str(e)})
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.get("/api/admin/buscar-tmdb")
async def buscar_tmdb(q: str, request: Request):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    url_busca = f"https://api.themoviedb.org/3/search/movie?api_key={API_KEY}&language=pt-BR&query={q}"
    async with httpx.AsyncClient(verify=False) as client:
        resposta = await client.get(url_busca)
        dados = resposta.json()
        resultados = dados.get("results", [])[:8]
        filmes = [{"tmdb_id": r["id"], "nome": r.get("title", ""), "descricao": r.get("overview", ""), "data_lancamento": r.get("release_date", "")} for r in resultados]
    return filmes

@app.get("/api/admin/tmdb-detalhes/{tmdb_id}")
async def tmdb_detalhes_admin(tmdb_id: int, request: Request):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    url_det = f"https://api.themoviedb.org/3/movie/{tmdb_id}?api_key={API_KEY}&language=pt-BR"
    async with httpx.AsyncClient(verify=False) as client:
        resposta = await client.get(url_det)
        dados = resposta.json()
    return {"tmdb_id": tmdb_id, "nome": dados.get("title", ""), "duracao": dados.get("runtime", 0), "descricao": dados.get("overview", "")}

@app.get("/api/admin/sessoes")
async def listar_sessoes(request: Request):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor(dictionary=True)
        sql = "SELECT s.id, f.nome AS filme_nome, sa.id AS sala_id, sa.qtde_assentos, s.fk_Sala_id, s.fk_Filme_id, s.horario_inicio, s.dub_leg FROM sessao s JOIN Filme f ON s.fk_Filme_id = f.id JOIN Sala sa ON s.fk_Sala_id = sa.id ORDER BY s.horario_inicio DESC"
        cursor.execute(sql)
        rows = cursor.fetchall()
        for r in rows:
            if r.get("horario_inicio"):
                r["horario_inicio"] = r["horario_inicio"].strftime("%Y-%m-%d %H:%M")
        return rows
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.post("/api/admin/sessoes")
async def criar_sessao(request: Request):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    body = await request.json()
    fk_sala = body.get("fk_Sala_id")
    fk_filme = body.get("fk_Filme_id")
    horario = body.get("horario_inicio")
    dub_leg = body.get("dub_leg")
    if not all([fk_sala, fk_filme, horario, dub_leg]):
        return JSONResponse(status_code=400, content={"erro": "Todos os campos são obrigatórios"})
    if dub_leg not in ("DUB", "LEG"):
        return JSONResponse(status_code=400, content={"erro": "dub_leg deve ser DUB ou LEG"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor()
        cursor.execute("INSERT INTO sessao (fk_Sala_id, fk_Filme_id, horario_inicio, dub_leg) VALUES (%s, %s, %s, %s)", (fk_sala, fk_filme, horario, dub_leg))
        conexao.commit()
        return JSONResponse(status_code=201, content={"id": cursor.lastrowid})
    except Exception as e:
        return JSONResponse(status_code=500, content={"erro": str(e)})
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.delete("/api/admin/sessoes/{sessao_id}")
async def deletar_sessao(request: Request, sessao_id: int):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor()
        cursor.execute("DELETE FROM sessao WHERE id = %s", (sessao_id,))
        conexao.commit()
        if cursor.rowcount == 0:
            return JSONResponse(status_code=404, content={"erro": "Sessão não encontrada"})
        return {"mensagem": "Sessão removida com sucesso"}
    except Exception:
        return JSONResponse(status_code=409, content={"erro": "Não é possível remover: existem ingressos vinculados a esta sessão."})
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.put("/api/admin/sessoes/{sessao_id}")
async def atualizar_sessao(request: Request, sessao_id: int):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    body = await request.json()
    fk_sala = body.get("fk_Sala_id")
    fk_filme = body.get("fk_Filme_id")
    horario = body.get("horario_inicio")
    dub_leg = body.get("dub_leg")
    if not all([fk_sala, fk_filme, horario, dub_leg]):
        return JSONResponse(status_code=400, content={"erro": "Todos os campos são obrigatórios"})
    if dub_leg not in ("DUB", "LEG"):
        return JSONResponse(status_code=400, content={"erro": "dub_leg deve ser DUB ou LEG"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor()
        cursor.execute("UPDATE sessao SET fk_Sala_id=%s, fk_Filme_id=%s, horario_inicio=%s, dub_leg=%s WHERE id=%s", (fk_sala, fk_filme, horario, dub_leg, sessao_id))
        conexao.commit()
        if cursor.rowcount == 0:
            return JSONResponse(status_code=404, content={"erro": "Sessão não encontrada"})
        return {"mensagem": "Sessão atualizada com sucesso"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"erro": str(e)})
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.put("/api/admin/ingressos/{ingresso_id}/assento")
async def atualizar_assento(request: Request, ingresso_id: int):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    body = await request.json()
    numero_assento = body.get("numero_assento", "").strip().upper()
    if not numero_assento:
        return JSONResponse(status_code=400, content={"erro": "numero_assento é obrigatório"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor()
        cursor.execute("UPDATE Ingresso SET numero_assento = %s WHERE id = %s", (numero_assento, ingresso_id))
        conexao.commit()
        if cursor.rowcount == 0:
            return JSONResponse(status_code=404, content={"erro": "Ingresso não encontrado"})
        return {"mensagem": "Assento atualizado com sucesso"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"erro": str(e)})
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.get("/api/admin/sessoes/{sessao_id}/assentos")
async def listar_assentos_sessao(request: Request, sessao_id: int):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor(dictionary=True)
        sql = "SELECT i.id AS ingresso_id, i.numero_assento, u.nome AS usuario_nome, u.cpf AS usuario_cpf, p.status AS status_pagamento FROM Ingresso i JOIN Pagamento p ON i.fk_Pagamento_id = p.id JOIN Usuario u ON p.fk_Usuario_cpf = u.cpf WHERE i.fk_sessao_id = %s ORDER BY i.numero_assento"
        cursor.execute(sql, (sessao_id,))
        return cursor.fetchall()
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.get("/api/admin/ingressos")
async def listar_ingressos(request: Request):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor(dictionary=True)
        sql = "SELECT i.id, i.numero_assento, i.fk_sessao_id, p.id AS pagamento_id, u.nome AS usuario_nome, u.cpf AS usuario_cpf, u.email AS usuario_email, f.nome AS filme_nome, se.horario_inicio, sa.id AS sala_id, se.dub_leg, p.valor_total, p.status, p.metodo_pagamento, p.criado_em FROM Ingresso i JOIN Pagamento p ON i.fk_Pagamento_id = p.id JOIN Usuario u ON p.fk_Usuario_cpf = u.cpf JOIN sessao se ON i.fk_sessao_id = se.id JOIN Filme f ON se.fk_Filme_id = f.id JOIN Sala sa ON se.fk_Sala_id = sa.id ORDER BY p.criado_em DESC"
        cursor.execute(sql)
        rows = cursor.fetchall()
        for r in rows:
            if r.get("horario_inicio"):
                r["horario_inicio"] = r["horario_inicio"].strftime("%Y-%m-%d %H:%M")
            if r.get("criado_em"):
                r["criado_em"] = r["criado_em"].strftime("%Y-%m-%d %H:%M")
            if r.get("valor_total") is not None:
                r["valor_total"] = float(r["valor_total"])
        return rows
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.delete("/api/admin/ingressos/{ingresso_id}")
async def cancelar_ingresso(request: Request, ingresso_id: int):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor(dictionary=True)
        cursor.execute("SELECT fk_Pagamento_id FROM Ingresso WHERE id = %s", (ingresso_id,))
        row = cursor.fetchone()
        if not row:
            return JSONResponse(status_code=404, content={"erro": "Ingresso não encontrado"})
        pagamento_id = row["fk_Pagamento_id"]
        cursor.execute("DELETE FROM Ingresso WHERE id = %s", (ingresso_id,))
        cursor.execute("UPDATE Pagamento SET status = 'ESTORNADO' WHERE id = %s", (pagamento_id,))
        conexao.commit()
        return {"mensagem": "Ingresso cancelado e pagamento estornado."}
    except Exception as e:
        return JSONResponse(status_code=500, content={"erro": str(e)})
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.post("/api/admin/ingressos")
async def criar_ingresso_admin(request: Request):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    body = await request.json()
    cpf = body.get("fk_Usuario_cpf")
    sessao_id = body.get("fk_sessao_id")
    valor_total = body.get("valor_total")
    metodo = body.get("metodo_pagamento")
    status = body.get("status", "PENDENTE")
    if not all([cpf, sessao_id, valor_total, metodo]):
        return JSONResponse(status_code=400, content={"erro": "cpf, fk_sessao_id, valor_total e metodo_pagamento são obrigatórios"})
    if metodo not in ("PIX", "CARTAO_CREDITO", "CARTAO_DEBITO"):
        return JSONResponse(status_code=400, content={"erro": "metodo_pagamento inválido"})
    if status not in ("PENDENTE", "APROVADO", "RECUSADO"):
        return JSONResponse(status_code=400, content={"erro": "status inválido"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor()
        cursor.execute("INSERT INTO Pagamento (valor_total, metodo_pagamento, status, fk_Usuario_cpf) VALUES (%s, %s, %s, %s)", (valor_total, metodo, status, cpf))
        pagamento_id = cursor.lastrowid
        cursor.execute("INSERT INTO Ingresso (fk_Pagamento_id, fk_sessao_id) VALUES (%s, %s)", (pagamento_id, sessao_id))
        conexao.commit()
        return JSONResponse(status_code=201, content={"id": cursor.lastrowid, "pagamento_id": pagamento_id})
    except Exception as e:
        return JSONResponse(status_code=409, content={"erro": "CPF não encontrado ou sessão inválida: " + str(e)})
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.put("/api/admin/pagamentos/{pagamento_id}/status")
async def atualizar_status_pagamento(request: Request, pagamento_id: int):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    body = await request.json()
    novo_status = body.get("status")
    if novo_status not in ("PENDENTE", "APROVADO", "RECUSADO", "ESTORNADO"):
        return JSONResponse(status_code=400, content={"erro": "Status inválido"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor()
        cursor.execute("UPDATE Pagamento SET status = %s WHERE id = %s", (novo_status, pagamento_id))
        conexao.commit()
        if cursor.rowcount == 0:
            return JSONResponse(status_code=404, content={"erro": "Pagamento não encontrado"})
        return {"mensagem": "Status atualizado com sucesso"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"erro": str(e)})
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.get("/api/admin/usuarios")
async def listar_usuarios(request: Request):
    if not _is_admin(request.headers.get("usuario-cpf")):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse(status_code=500, content={"erro": "Erro de conexão"})
    try:
        cursor = conexao.cursor(dictionary=True)
        cursor.execute("SELECT cpf, nome, email, telefone, permissao FROM Usuario ORDER BY nome")
        return cursor.fetchall()
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.put("/api/admin/usuarios/{cpf}/permissao")
async def alterar_permissao(request: Request, cpf: str):
    cpf_logado = request.headers.get("usuario-cpf")
    if not _is_admin(cpf_logado):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    if cpf == cpf_logado:
        return JSONResponse(status_code=403, content={"erro": "Você não pode remover seus próprios privilégios de administrador!"})
    body = await request.json()
    nova_permissao = body.get("permissao")
    if nova_permissao not in ("CLIENTE", "ADMINISTRADOR"):
        return JSONResponse(status_code=400, content={"erro": "Permissão inválida"})
    conexao = obter_conexao()
    try:
        cursor = conexao.cursor()
        cursor.execute("UPDATE Usuario SET permissao = %s WHERE cpf = %s", (nova_permissao, cpf))
        conexao.commit()
        return {"mensagem": "Permissão atualizada com sucesso!"}
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

@app.delete("/api/admin/usuarios/{cpf}")
async def deletar_usuario_admin(request: Request, cpf: str):
    cpf_logado = request.headers.get("usuario-cpf")
    if not _is_admin(cpf_logado):
        return JSONResponse(status_code=403, content={"erro": "Acesso negado"})
    if cpf == cpf_logado:
        return JSONResponse(status_code=403, content={"erro": "Você não pode eliminar a sua própria conta através do painel de administração!"})
    conexao = obter_conexao()
    try:
        cursor = conexao.cursor()
        cursor.execute("DELETE FROM Usuario WHERE cpf = %s", (cpf,))
        conexao.commit()
        return {"mensagem": "Usuário removido"}
    except Exception:
        return JSONResponse(status_code=409, content={"erro": "Não pode deletar o Usuário! O usuário possui pagamentos/ingressos vinculados."})
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()