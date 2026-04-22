import mysql.connector
from mysql.connector import Error

def obter_conexao():
    # Vai tentar estabelecer a conexão e retornar o objeto de conexão, se não conseguir vai retornar none.
    try:
        conexao = mysql.connector.connect(
            host='localhost',
            user='root',
            password='PUC@1234',
            database='nouvelle'
        )

        if conexao.is_connected():
            return conexao
        
    except Error as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        return None