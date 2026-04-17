DROP DATABASE IF EXISTS nouvelle;
CREATE DATABASE nouvelle;
USE nouvelle;

CREATE TABLE Sala (
    id INT PRIMARY KEY AUTO_INCREMENT,
    qtde_assentos INT
);

CREATE TABLE Filme (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100),
    duracao INT,
    descricao TEXT
);

CREATE TABLE Usuario (
    cpf VARCHAR(14) PRIMARY KEY, 
    nome VARCHAR(100), 
    email VARCHAR(100) UNIQUE,
    senha VARCHAR(255),
    telefone VARCHAR(20), 
    data_nasc DATE,
    estudante BOOLEAN,
    pcd BOOLEAN,
    permissao ENUM('CLIENTE', 'ADMINISTRADOR') DEFAULT 'CLIENTE'
);

CREATE TABLE Pagamento (
    id INT PRIMARY KEY AUTO_INCREMENT,
    valor_total DECIMAL(10,2), 
    metodo_pagamento ENUM('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO'),
    status ENUM('PENDENTE', 'APROVADO', 'RECUSADO', 'ESTORNADO'),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fk_Usuario_cpf VARCHAR(14) 
);

CREATE TABLE sessao (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fk_Sala_id INT,
    fk_Filme_id INT,
    horario_inicio DATETIME,
    dub_leg ENUM('DUB', 'LEG')
);

CREATE TABLE Ingresso (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fk_Pagamento_id INT,
    fk_sessao_id INT
);

ALTER TABLE Pagamento ADD CONSTRAINT FK_Pagamento_Usuario
    FOREIGN KEY (fk_Usuario_cpf)
    REFERENCES Usuario (cpf)
    ON DELETE CASCADE;

ALTER TABLE Ingresso ADD CONSTRAINT FK_Ingresso_Pagamento
    FOREIGN KEY (fk_Pagamento_id)
    REFERENCES Pagamento (id)
    ON DELETE RESTRICT;

/* NOVA REGRA: Ingresso conectado à Sessão */
ALTER TABLE Ingresso ADD CONSTRAINT FK_Ingresso_sessao
    FOREIGN KEY (fk_sessao_id)
    REFERENCES sessao (id)
    ON DELETE RESTRICT;

ALTER TABLE sessao ADD CONSTRAINT FK_sessao_Sala
    FOREIGN KEY (fk_Sala_id)
    REFERENCES Sala (id)
    ON DELETE RESTRICT;

ALTER TABLE sessao ADD CONSTRAINT FK_sessao_Filme
    FOREIGN KEY (fk_Filme_id)
    REFERENCES Filme (id)
    ON DELETE RESTRICT;