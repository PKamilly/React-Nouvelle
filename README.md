# React Nouvelle 🚀

Projeto desenvolvido para a disciplina de **Web Development: Framework (React)** do curso de **Sistemas de Informação da PUCPR**. 

O React Nouvelle é uma aplicação full-stack que integra um frontend dinâmico em React com um backend robusto em FastAPI.

---

## Tecnologias Utilizadas

### Frontend
* **React** (Vite)
* **NPM** (Gerenciamento de pacotes)

### Backend
* **Python 3.10+**
* **FastAPI** (Framework web de alta performance)
* **MySQL** (Banco de dados através do `mysql-connector-python`)
* **Uvicorn** (Servidor ASGI)
* **Pydantic** (Validação de dados)

---

## Como Executar o Projeto

Certifique-se de ter o Python e o Node.js instalados em sua máquina antes de começar.

### 1. Configurando o Backend

Navegue até a pasta do backend e configure o ambiente virtual:

```bash
# Entre na pasta
cd backend

# Crie o ambiente virtual
python -m venv venv

# Ative o ambiente (Windows)
.\venv\Scripts\activate

# Ative o ambiente (Linux/macOS)
source venv/bin/activate

# Instale as dependências
pip install fastapi uvicorn pydantic mysql-connector-python bcrypt httpx python-multipart
```
### 2. Configurando a Frontend

Navegue até a pasta do frontend e configure o ambiente virtual:

```bash
# Entre na pasta
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
