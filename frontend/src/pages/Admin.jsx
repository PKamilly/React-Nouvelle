import React, { useState, useEffect } from 'react';
import '../styles/admin.css';

import { Link } from "react-router-dom";

const API_URL = 'http://localhost:8000';

export default function Admin() {
    const [abaAtiva, setAbaAtiva] = useState('filmes');
    const [toast, setToast] = useState({ msg: '', tipo: '', visivel: false });
    const [modal, setModal] = useState(null);

    const [filmes, setFilmes] = useState([]);
    const [salas, setSalas] = useState([]);
    const [sessoes, setSessoes] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [ingressos, setIngressos] = useState([]);
    const [assentos, setAssentos] = useState([]);

    const [filtroSessao, setFiltroSessao] = useState({ filme: '', data: '', sala: '' });
    const [filtroUsuario, setFiltroUsuario] = useState('');
    const [assentoSessaoSelecionada, setAssentoSessaoSelecionada] = useState('');

    const [formFilme, setFormFilme] = useState({ id: '', tmdb_id: '', nome: '', duracao: '', descricao: '' });
    const [tmdbBusca, setTmdbBusca] = useState('');
    const [tmdbResultados, setTmdbResultados] = useState([]);
    const [formSala, setFormSala] = useState({ id: '', qtde_assentos: '' });
    const [formSessao, setFormSessao] = useState({ id: '', fk_Filme_id: '', fk_Sala_id: '', horario_inicio: '', dub_leg: 'DUB' });
    const [formIngresso, setFormIngresso] = useState({ cpf: '', fk_sessao_id: '', valor_total: '', metodo_pagamento: 'PIX', status: 'PENDENTE' });
    const [formStatus, setFormStatus] = useState({ id: '', status: 'PENDENTE' });
    const [formAssento, setFormAssento] = useState({ id: '', numero_assento: '' });

    const [carregando, setCarregando] = useState(false);

    const getHeaders = () => {
        return {
            'Content-Type': 'application/json',
            'usuario-cpf': localStorage.getItem('usuario_cpf') || ''
        };
    };

    const formatarData = (iso) => {
        if (!iso) return '-';
        return new Date(iso).toLocaleString('pt-BR');
    };

    const badgeStatus = (s) => {
        const mapa = {
            PENDENTE: 'badge-pendente',
            APROVADO: 'badge-aprovado',
            RECUSADO: 'badge-recusado',
            ESTORNADO: 'badge-estornado'
        };
        return `badge ${mapa[s] || ''}`;
    };

    const showToast = (msg, tipo = 'ok') => {
        setToast({ msg, tipo, visivel: true });
        setTimeout(() => setToast({ msg: '', tipo: '', visivel: false }), 3000);
    };

    const fecharModal = () => {
        setModal(null);
    };

    const fetchFilmes = async () => {
        setCarregando(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/filmes`, { headers: getHeaders() });
            const data = await res.json();
            setFilmes(Array.isArray(data) ? data : []);
        } catch (error) {
            showToast('Erro ao carregar filmes.', 'err');
        }
        setCarregando(false);
    };

    const fetchSalas = async () => {
        setCarregando(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/salas`, { headers: getHeaders() });
            const data = await res.json();
            setSalas(Array.isArray(data) ? data : []);
        } catch (error) {
            showToast('Erro ao carregar salas.', 'err');
        }
        setCarregando(false);
    };

    const fetchSessoes = async () => {
        setCarregando(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/sessoes`, { headers: getHeaders() });
            const data = await res.json();
            setSessoes(Array.isArray(data) ? data : []);
        } catch (error) {
            showToast('Erro ao carregar sessões.', 'err');
        }
        setCarregando(false);
    };

    const fetchUsuarios = async () => {
        setCarregando(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/usuarios`, { headers: getHeaders() });
            const data = await res.json();
            setUsuarios(Array.isArray(data) ? data : []);
        } catch (error) {
            showToast('Erro ao carregar usuários.', 'err');
        }
        setCarregando(false);
    };

    const fetchIngressos = async () => {
        setCarregando(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/ingressos`, { headers: getHeaders() });
            const data = await res.json();
            setIngressos(Array.isArray(data) ? data : []);
        } catch (error) {
            showToast('Erro ao carregar ingressos.', 'err');
        }
        setCarregando(false);
    };

    const fetchAssentos = async (sessaoId) => {
        if (!sessaoId) {
            setAssentos([]);
            return;
        }
        setCarregando(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/sessoes/${sessaoId}/assentos`, { headers: getHeaders() });
            const data = await res.json();
            setAssentos(Array.isArray(data) ? data : []);
        } catch (error) {
            showToast('Erro ao carregar assentos.', 'err');
        }
        setCarregando(false);
    };

    useEffect(() => {
        if (abaAtiva === 'filmes') fetchFilmes();
        if (abaAtiva === 'salas') fetchSalas();
        if (abaAtiva === 'sessoes') fetchSessoes();
        if (abaAtiva === 'usuarios') fetchUsuarios();
        if (abaAtiva === 'ingressos') fetchIngressos();
        if (abaAtiva === 'assentos') fetchSessoes();
    }, [abaAtiva]);

    useEffect(() => {
        if (abaAtiva === 'assentos' && assentoSessaoSelecionada) {
            fetchAssentos(assentoSessaoSelecionada);
        }
    }, [assentoSessaoSelecionada, abaAtiva]);

    const handleSalvarFilme = async () => {
        if (!formFilme.nome || !formFilme.duracao) {
            showToast('Preencha nome e duração.', 'err');
            return;
        }
        if (!formFilme.id && !formFilme.tmdb_id) {
            showToast('Selecione um filme do TMDB antes de salvar.', 'err');
            return;
        }

        const url = formFilme.id ? `${API_URL}/api/admin/filmes/${formFilme.id}` : `${API_URL}/api/admin/filmes`;
        const method = formFilme.id ? 'PUT' : 'POST';
        const payload = formFilme.id
            ? { nome: formFilme.nome, duracao: parseInt(formFilme.duracao), descricao: formFilme.descricao }
            : { tmdb_id: parseInt(formFilme.tmdb_id), nome: formFilme.nome, duracao: parseInt(formFilme.duracao), descricao: formFilme.descricao };

        const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
        if (res.ok) {
            showToast(formFilme.id ? 'Filme atualizado!' : 'Filme criado!');
            fecharModal();
            fetchFilmes();
        } else {
            const err = await res.json();
            showToast(err.erro || 'Erro ao salvar filme.', 'err');
        }
    };

    const handleDeletarFilme = async (id) => {
        if (window.confirm('Excluir Filme? Isso só funciona se não houver sessões vinculadas.')) {
            const res = await fetch(`${API_URL}/api/admin/filmes/${id}`, { method: 'DELETE', headers: getHeaders() });
            if (res.ok) {
                showToast('Filme excluído.');
                fetchFilmes();
            } else {
                showToast('Não é possível excluir: existem sessões vinculadas.', 'err');
            }
        }
    };

    const handleBuscarTMDB = async () => {
        if (!tmdbBusca.trim()) {
            showToast('Digite um nome para buscar.', 'err');
            return;
        }
        const res = await fetch(`${API_URL}/api/admin/buscar-tmdb?q=${encodeURIComponent(tmdbBusca)}`, { headers: getHeaders() });
        const data = await res.json();
        setTmdbResultados(data);
    };

    const handleSelecionarTMDB = async (tmdbId) => {
        const res = await fetch(`${API_URL}/api/admin/tmdb-detalhes/${tmdbId}`, { headers: getHeaders() });
        const dados = await res.json();
        setFormFilme({ ...formFilme, tmdb_id: dados.tmdb_id, nome: dados.nome, duracao: dados.duracao || '', descricao: dados.descricao || '' });
        setTmdbResultados([]);
        setTmdbBusca(dados.nome);
        showToast(`"${dados.nome}" selecionado. Confira os dados e salve.`);
    };

    const handleSalvarSala = async () => {
        const qtde = parseInt(formSala.qtde_assentos);
        if (!qtde || qtde < 1) {
            showToast('Informe uma quantidade válida.', 'err');
            return;
        }
        const url = formSala.id ? `${API_URL}/api/admin/salas/${formSala.id}` : `${API_URL}/api/admin/salas`;
        const method = formSala.id ? 'PUT' : 'POST';

        const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify({ qtde_assentos: qtde }) });
        if (res.ok) {
            showToast(formSala.id ? 'Sala atualizada!' : 'Sala criada!');
            fecharModal();
            fetchSalas();
        } else {
            showToast('Erro ao salvar sala.', 'err');
        }
    };

    const handleDeletarSala = async (id) => {
        if (window.confirm('Deseja excluir esta sala permanentemente?')) {
            const res = await fetch(`${API_URL}/api/admin/salas/${id}`, { method: 'DELETE', headers: getHeaders() });
            if (res.ok) {
                showToast('Sala excluída.');
                fetchSalas();
            } else {
                showToast('Não é possível excluir: existem sessões nessa sala.', 'err');
            }
        }
    };

    const handleSalvarSessao = async () => {
        if (!formSessao.fk_Filme_id || !formSessao.fk_Sala_id || !formSessao.horario_inicio) {
            showToast('Preencha todos os campos.', 'err');
            return;
        }
        const method = formSessao.id ? 'PUT' : 'POST';
        const url = formSessao.id ? `${API_URL}/api/admin/sessoes/${formSessao.id}` : `${API_URL}/api/admin/sessoes`;

        const payload = {
            fk_Filme_id: parseInt(formSessao.fk_Filme_id),
            fk_Sala_id: parseInt(formSessao.fk_Sala_id),
            horario_inicio: formSessao.horario_inicio,
            dub_leg: formSessao.dub_leg
        };

        const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
        if (res.ok) {
            showToast(formSessao.id ? 'Sessão atualizada!' : 'Sessão criada!');
            fecharModal();
            fetchSessoes();
        } else {
            showToast('Erro ao salvar sessão.', 'err');
        }
    };

    const handleDeletarSessao = async (id) => {
        if (window.confirm('Deseja excluir esta sessão permanentemente?')) {
            const res = await fetch(`${API_URL}/api/admin/sessoes/${id}`, { method: 'DELETE', headers: getHeaders() });
            if (res.ok) {
                showToast('Sessão excluída.');
                fetchSessoes();
            } else {
                showToast('Não é possível excluir: existem ingressos vinculados.', 'err');
            }
        }
    };

    const handleAlternarPermissao = async (cpf, permissaoAtual) => {
        const nova = permissaoAtual === 'ADMINISTRADOR' ? 'CLIENTE' : 'ADMINISTRADOR';
        if (window.confirm(`Deseja alterar a permissão deste usuário para ${nova}?`)) {
            const res = await fetch(`${API_URL}/api/admin/usuarios/${cpf}/permissao`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ permissao: nova })
            });
            if (res.ok) {
                showToast('Permissão atualizada!');
                fetchUsuarios();
            } else {
                const erroData = await res.json();
                showToast(erroData.erro || 'Erro ao alterar permissão.', 'err');
            }
        }
    };

    const handleDeletarUsuario = async (cpf) => {
        if (window.confirm('Isso removerá todos os dados vinculados. Deseja continuar?')) {
            const res = await fetch(`${API_URL}/api/admin/usuarios/${cpf}`, { method: 'DELETE', headers: getHeaders() });
            if (res.ok) {
                showToast('Usuário excluído.');
                fetchUsuarios();
            } else {
                const erroData = await res.json();
                showToast(erroData.erro || 'Erro ao excluir usuário.', 'err');
            }
        }
    };

    const handleSalvarIngresso = async () => {
        const mascaraValida = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
        if (!formIngresso.cpf) { showToast('Informe o CPF do usuário.', 'err'); return; }
        if (!mascaraValida.test(formIngresso.cpf)) { showToast('CPF inválido.', 'err'); return; }
        if (!formIngresso.fk_sessao_id) { showToast('Selecione uma sessão.', 'err'); return; }
        if (!formIngresso.valor_total || parseFloat(formIngresso.valor_total) <= 0) { showToast('Informe um valor válido.', 'err'); return; }

        const payload = {
            fk_Usuario_cpf: formIngresso.cpf,
            fk_sessao_id: parseInt(formIngresso.fk_sessao_id),
            valor_total: parseFloat(formIngresso.valor_total),
            metodo_pagamento: formIngresso.metodo_pagamento,
            status: formIngresso.status
        };

        const res = await fetch(`${API_URL}/api/admin/ingressos`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
        if (res.ok) {
            showToast('Ingresso criado!');
            fecharModal();
            fetchIngressos();
        } else {
            const err = await res.json();
            showToast(err.erro || 'Erro ao criar ingresso.', 'err');
        }
    };

    const handleDeletarIngresso = async (id) => {
        if (window.confirm('Deseja excluir este ingresso permanentemente?')) {
            const res = await fetch(`${API_URL}/api/admin/ingressos/${id}`, { method: 'DELETE', headers: getHeaders() });
            if (res.ok) {
                showToast('Ingresso excluído.');
                fetchIngressos();
            } else {
                showToast('Erro ao excluir ingresso.', 'err');
            }
        }
    };

    const handleSalvarStatus = async () => {
        const res = await fetch(`${API_URL}/api/admin/pagamentos/${formStatus.id}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status: formStatus.status })
        });
        if (res.ok) {
            showToast('Status atualizado!');
            fecharModal();
            fetchIngressos();
        } else {
            showToast('Erro ao atualizar status.', 'err');
        }
    };

    const handleSalvarAssento = async () => {
        const numero = formAssento.numero_assento.trim().toUpperCase();
        if (!numero) { showToast('Informe o número do assento.', 'err'); return; }
        const res = await fetch(`${API_URL}/api/admin/ingressos/${formAssento.id}/assento`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ numero_assento: numero })
        });
        if (res.ok) {
            showToast('Assento atualizado!');
            fecharModal();
            fetchAssentos(assentoSessaoSelecionada);
        } else {
            showToast('Erro ao atualizar assento.', 'err');
        }
    };

    const sessoesFiltradas = sessoes.filter(s => {
        const matchFilme = s.filme_nome.toLowerCase().includes(filtroSessao.filme.toLowerCase());
        const matchSala = s.sala_id.toString().includes(filtroSessao.sala.toLowerCase());
        let matchData = true;
        if (filtroSessao.data) {
            const dataSessao = s.horario_inicio.split('T')[0];
            matchData = (dataSessao === filtroSessao.data);
        }
        return matchFilme && matchSala && matchData;
    });

    const usuariosFiltrados = usuarios.filter(u =>
        u.nome.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
        u.cpf.toLowerCase().includes(filtroUsuario.toLowerCase())
    );

    const abrirModalFilme = (f = null) => {
        if (f) {
            setFormFilme({ id: f.id, tmdb_id: '', nome: f.nome, duracao: f.duracao, descricao: f.descricao });
        } else {
            setFormFilme({ id: '', tmdb_id: '', nome: '', duracao: '', descricao: '' });
            setTmdbBusca('');
            setTmdbResultados([]);
        }
        setModal('filme');
    };

    const abrirModalSala = (s = null) => {
        setFormSala(s ? { id: s.id, qtde_assentos: s.qtde_assentos } : { id: '', qtde_assentos: '' });
        setModal('sala');
    };

    const abrirModalSessao = (s = null) => {
        setFormSessao(s ? {
            id: s.id,
            fk_Filme_id: s.fk_Filme_id,
            fk_Sala_id: s.fk_Sala_id,
            horario_inicio: s.horario_inicio.slice(0, 16),
            dub_leg: s.dub_leg
        } : { id: '', fk_Filme_id: filmes[0]?.id || '', fk_Sala_id: salas[0]?.id || '', horario_inicio: '', dub_leg: 'DUB' });
        if (!s) {
            fetchFilmes();
            fetchSalas();
        }
        setModal('sessao');
    };

    const abrirModalIngresso = () => {
        setFormIngresso({ cpf: '', fk_sessao_id: sessoes[0]?.id || '', valor_total: '', metodo_pagamento: 'PIX', status: 'PENDENTE' });
        fetchSessoes();
        setModal('ingresso');
    };

    return (
        <div className="admin-container">
            <div className="admin-titulo">
                <h1>Painel de Administração</h1>
                <p>Gerencie filmes, salas, sessões, usuários e ingressos.</p>
            </div>

            <div className="abas-container">
                <div className="abas-nav">
                    <button className={`aba-btn ${abaAtiva === 'filmes' ? 'ativa' : ''}`} onClick={() => setAbaAtiva('filmes')}>Filmes</button>
                    <button className={`aba-btn ${abaAtiva === 'salas' ? 'ativa' : ''}`} onClick={() => setAbaAtiva('salas')}>Salas</button>
                    <button className={`aba-btn ${abaAtiva === 'sessoes' ? 'ativa' : ''}`} onClick={() => setAbaAtiva('sessoes')}>Sessões</button>
                    <button className={`aba-btn ${abaAtiva === 'usuarios' ? 'ativa' : ''}`} onClick={() => setAbaAtiva('usuarios')}>Usuários</button>
                    <button className={`aba-btn ${abaAtiva === 'ingressos' ? 'ativa' : ''}`} onClick={() => setAbaAtiva('ingressos')}>Ingressos</button>
                    <button className={`aba-btn ${abaAtiva === 'assentos' ? 'ativa' : ''}`} onClick={() => setAbaAtiva('assentos')}>Assentos</button>
                </div>

                {abaAtiva === 'filmes' && (
                    <div className="aba-painel ativa">
                        <div className="secao-header">
                            <h2>Filmes Cadastrados</h2>
                            <button className="btn btn-gold" onClick={() => abrirModalFilme()}>+ Novo Filme</button>
                        </div>
                        <div className="tabela-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Nome</th>
                                        <th>Duração</th>
                                        <th>Descrição</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {carregando ? <tr><td colSpan="5" className="carregando">Carregando...</td></tr> : filmes.length === 0 ? <tr><td colSpan="5" className="carregando">Nenhum filme cadastrado.</td></tr> : filmes.map((f, i) => (
                                        <tr key={f.id}>
                                            <td>{i + 1}</td>
                                            <td><strong>{f.nome}</strong></td>
                                            <td>{f.duracao} min</td>
                                            <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.descricao || '-'}</td>
                                            <td className="acoes">
                                                <button className="btn btn-blue btn-sm" onClick={() => abrirModalFilme(f)}>Editar</button>
                                                <button className="btn btn-red btn-sm" onClick={() => handleDeletarFilme(f.id)}>Excluir</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {abaAtiva === 'salas' && (
                    <div className="aba-painel ativa">
                        <div className="secao-header">
                            <h2>Salas de Cinema</h2>
                            <button className="btn btn-gold" onClick={() => abrirModalSala()}>+ Nova Sala</button>
                        </div>
                        <div className="tabela-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>ID Sala</th>
                                        <th>Qtde Assentos</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {carregando ? <tr><td colSpan="4" className="carregando">Carregando...</td></tr> : salas.length === 0 ? <tr><td colSpan="4" className="carregando">Nenhuma sala cadastrada.</td></tr> : salas.map((s, i) => (
                                        <tr key={s.id}>
                                            <td>{i + 1}</td>
                                            <td>Sala {s.id}</td>
                                            <td>{s.qtde_assentos}</td>
                                            <td>
                                                <button className="btn btn-blue btn-sm" onClick={() => abrirModalSala(s)}>Editar</button>
                                                <button className="btn btn-red btn-sm" onClick={() => handleDeletarSala(s.id)}>Excluir</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {abaAtiva === 'sessoes' && (
                    <div className="aba-painel ativa">
                        <div className="secao-header">
                            <h2>Sessões Programadas</h2>
                            <button className="btn btn-gold" onClick={() => abrirModalSessao()}>+ Nova Sessão</button>
                        </div>
                        <div className="filtros-sessoes">
                            <div className="campo" style={{ marginBottom: 0 }}>
                                <label>Filme</label>
                                <input type="text" placeholder="Nome do filme" value={filtroSessao.filme} onChange={(e) => setFiltroSessao({ ...filtroSessao, filme: e.target.value })} />
                            </div>
                            <div className="campo" style={{ marginBottom: 0 }}>
                                <label>Data</label>
                                <input type="date" value={filtroSessao.data} onChange={(e) => setFiltroSessao({ ...filtroSessao, data: e.target.value })} />
                            </div>
                            <div className="campo" style={{ marginBottom: 0 }}>
                                <label>Sala</label>
                                <input type="text" placeholder="ID da sala" value={filtroSessao.sala} onChange={(e) => setFiltroSessao({ ...filtroSessao, sala: e.target.value })} />
                            </div>
                            <button className="btn btn-blue" onClick={() => setFiltroSessao({ filme: '', data: '', sala: '' })} style={{ height: '38px' }}>Limpar</button>
                        </div>
                        <div className="tabela-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Filme</th>
                                        <th>Sala</th>
                                        <th>Horário</th>
                                        <th>Tipo</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {carregando ? <tr><td colSpan="6" className="carregando">Carregando...</td></tr> : sessoesFiltradas.length === 0 ? <tr><td colSpan="6" className="carregando">Nenhuma sessão encontrada.</td></tr> : sessoesFiltradas.map((s, i) => (
                                        <tr key={s.id}>
                                            <td>{i + 1}</td>
                                            <td>{s.filme_nome}</td>
                                            <td>Sala {s.sala_id}</td>
                                            <td>{formatarData(s.horario_inicio)}</td>
                                            <td>{s.dub_leg === 'DUB' ? 'Dublado' : 'Legendado'}</td>
                                            <td className="acoes">
                                                <button className="btn btn-blue btn-sm" onClick={() => abrirModalSessao(s)}>Editar</button>
                                                <button className="btn btn-red btn-sm" onClick={() => handleDeletarSessao(s.id)}>Excluir</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {abaAtiva === 'usuarios' && (
                    <div className="aba-painel ativa">
                        <div className="secao-header">
                            <h2>Usuários Cadastrados</h2>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-end' }}>
                            <div className="campo" style={{ marginBottom: 0, flex: 1 }}>
                                <label>Buscar por Nome ou CPF</label>
                                <input type="text" placeholder="Ex: Willian ou 123.456.789-00" value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)} />
                            </div>
                        </div>
                        <div className="tabela-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>CPF</th>
                                        <th>Nome</th>
                                        <th>Email</th>
                                        <th>Telefone</th>
                                        <th>Permissão</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {carregando ? <tr><td colSpan="6" className="carregando">Carregando...</td></tr> : usuariosFiltrados.length === 0 ? <tr><td colSpan="6" className="carregando">Nenhum usuário encontrado.</td></tr> : usuariosFiltrados.map((u) => (
                                        <tr key={u.cpf}>
                                            <td><code>{u.cpf}</code></td>
                                            <td>{u.nome}</td>
                                            <td>{u.email}</td>
                                            <td>{u.telefone || '-'}</td>
                                            <td><span className={u.permissao === 'ADMINISTRADOR' ? 'badge badge-admin' : 'badge badge-cliente'}>{u.permissao === 'ADMINISTRADOR' ? 'ADMIN' : 'CLIENTE'}</span></td>
                                            <td className="acoes">
                                                <button className="btn btn-blue btn-sm" onClick={() => handleAlternarPermissao(u.cpf, u.permissao)}>
                                                    {u.permissao === 'ADMINISTRADOR' ? 'Tornar Cliente' : 'Tornar Admin'}
                                                </button>
                                                <button className="btn btn-red btn-sm" onClick={() => handleDeletarUsuario(u.cpf)}>Excluir</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {abaAtiva === 'ingressos' && (
                    <div className="aba-painel ativa">
                        <div className="secao-header">
                            <h2>Compras / Ingressos</h2>
                            <button className="btn btn-gold" onClick={() => abrirModalIngresso()}>+ Novo Ingresso</button>
                        </div>
                        <div className="tabela-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Usuário</th>
                                        <th>Sessão</th>
                                        <th>Valor Total</th>
                                        <th>Método</th>
                                        <th>Status</th>
                                        <th>Data</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {carregando ? <tr><td colSpan="8" className="carregando">Carregando...</td></tr> : ingressos.length === 0 ? <tr><td colSpan="8" className="carregando">Nenhum ingresso encontrado.</td></tr> : ingressos.map((ing) => (
                                        <tr key={ing.id}>
                                            <td>{ing.id}</td>
                                            <td>{ing.usuario_nome}</td>
                                            <td>[{ing.fk_sessao_id}] {ing.filme_nome || '-'}</td>
                                            <td>R$ {parseFloat(ing.valor_total).toFixed(2)}</td>
                                            <td>{ing.metodo_pagamento?.replace('_', ' ')}</td>
                                            <td><span className={badgeStatus(ing.status)}>{ing.status}</span></td>
                                            <td>{formatarData(ing.criado_em)}</td>
                                            <td className="acoes">
                                                <button className="btn btn-blue btn-sm" onClick={() => { setFormStatus({ id: ing.pagamento_id, status: ing.status }); setModal('status'); }}>Status</button>
                                                <button className="btn btn-red btn-sm" onClick={() => handleDeletarIngresso(ing.id)}>Excluir</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {abaAtiva === 'assentos' && (
                    <div className="aba-painel ativa">
                        <div className="secao-header">
                            <h2>Assentos por Sessão</h2>
                        </div>
                        <div className="campo" style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                            <label>Selecione uma Sessão</label>
                            <select value={assentoSessaoSelecionada} onChange={(e) => setAssentoSessaoSelecionada(e.target.value)}>
                                <option value="">-- escolha uma sessão --</option>
                                {sessoes.map(s => <option key={s.id} value={s.id}>[{s.id}] {s.filme_nome} — {s.horario_inicio} ({s.dub_leg})</option>)}
                            </select>
                        </div>
                        <div className="tabela-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Ingresso #</th>
                                        <th>Assento</th>
                                        <th>Usuário</th>
                                        <th>CPF</th>
                                        <th>Status Pgto</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!assentoSessaoSelecionada ? <tr><td colSpan="6" className="carregando">Selecione uma sessão acima.</td></tr> : carregando ? <tr><td colSpan="6" className="carregando">Carregando...</td></tr> : assentos.length === 0 ? <tr><td colSpan="6" className="carregando">Nenhum assento ocupado nessa sessão.</td></tr> : assentos.map((a) => (
                                        <tr key={a.ingresso_id}>
                                            <td>{a.ingresso_id}</td>
                                            <td><strong>{a.numero_assento || '—'}</strong></td>
                                            <td>{a.usuario_nome}</td>
                                            <td>{a.usuario_cpf}</td>
                                            <td><span className={badgeStatus(a.status_pagamento)}>{a.status_pagamento}</span></td>
                                            <td>
                                                <button className="btn btn-blue btn-sm" onClick={() => { setFormAssento({ id: a.ingresso_id, numero_assento: a.numero_assento || '' }); setModal('assento'); }}>Editar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {modal === 'filme' && (
                <div className="modal-overlay aberto">
                    <div className="modal">
                        <button className="fechar-modal" onClick={fecharModal}>✕</button>
                        <h3>{formFilme.id ? 'Editar Filme' : 'Novo Filme'}</h3>
                        {!formFilme.id && (
                            <div id="bloco-busca-tmdb">
                                <div className="campo">
                                    <label>Buscar no TMDB</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="text" placeholder="Ex: Interestelar" value={tmdbBusca} onChange={(e) => setTmdbBusca(e.target.value)} style={{ flex: 1 }} />
                                        <button className="btn btn-blue" onClick={handleBuscarTMDB} type="button">🔍 Buscar</button>
                                    </div>
                                </div>
                                {tmdbResultados.length > 0 && (
                                    <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #333', borderRadius: '6px', marginBottom: '12px' }}>
                                        {tmdbResultados.map(f => (
                                            <div key={f.tmdb_id} onClick={() => handleSelecionarTMDB(f.tmdb_id)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #333', transition: 'background .15s' }}>
                                                <strong>{f.nome}</strong>
                                                <span style={{ color: '#aaa', fontSize: '.85em', marginLeft: '8px' }}>{f.data_lancamento?.slice(0, 4) || ''}</span>
                                                <p style={{ margin: '2px 0 0', fontSize: '.8em', color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.descricao || ''}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="campo">
                            <label>Nome do Filme</label>
                            <input type="text" value={formFilme.nome} onChange={(e) => setFormFilme({ ...formFilme, nome: e.target.value })} placeholder="Preenchido ao selecionar do TMDB" />
                        </div>
                        <div className="campo">
                            <label>Duração (em minutos)</label>
                            <input type="number" value={formFilme.duracao} onChange={(e) => setFormFilme({ ...formFilme, duracao: e.target.value })} placeholder="Ex: 169" />
                        </div>
                        <div className="campo">
                            <label>Descrição / Sinopse</label>
                            <textarea value={formFilme.descricao} onChange={(e) => setFormFilme({ ...formFilme, descricao: e.target.value })} placeholder="Breve descrição do filme..."></textarea>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-blue" onClick={fecharModal}>Cancelar</button>
                            <button className="btn btn-gold" onClick={handleSalvarFilme}>Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            {modal === 'sala' && (
                <div className="modal-overlay aberto">
                    <div className="modal">
                        <button className="fechar-modal" onClick={fecharModal}>✕</button>
                        <h3>{formSala.id ? `Editar Sala ${formSala.id}` : 'Nova Sala'}</h3>
                        <div className="campo">
                            <label>Quantidade de Assentos</label>
                            <input type="number" value={formSala.qtde_assentos} onChange={(e) => setFormSala({ ...formSala, qtde_assentos: e.target.value })} placeholder="Ex: 80" />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-blue" onClick={fecharModal}>Cancelar</button>
                            <button className="btn btn-gold" onClick={handleSalvarSala}>Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            {modal === 'sessao' && (
                <div className="modal-overlay aberto">
                    <div className="modal">
                        <button className="fechar-modal" onClick={fecharModal}>✕</button>
                        <h3>{formSessao.id ? 'Editar Sessão' : 'Nova Sessão'}</h3>
                        <div className="campo">
                            <label>Filme</label>
                            <select value={formSessao.fk_Filme_id} onChange={(e) => setFormSessao({ ...formSessao, fk_Filme_id: e.target.value })}>
                                <option value="">-- selecione um filme --</option>
                                {filmes.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                            </select>
                        </div>
                        <div className="campo">
                            <label>Sala</label>
                            <select value={formSessao.fk_Sala_id} onChange={(e) => setFormSessao({ ...formSessao, fk_Sala_id: e.target.value })}>
                                <option value="">-- selecione uma sala --</option>
                                {salas.map(s => <option key={s.id} value={s.id}>Sala {s.id} ({s.qtde_assentos} assentos)</option>)}
                            </select>
                        </div>
                        <div className="campo">
                            <label>Data e Horário</label>
                            <input type="datetime-local" value={formSessao.horario_inicio} onChange={(e) => setFormSessao({ ...formSessao, horario_inicio: e.target.value })} />
                        </div>
                        <div className="campo">
                            <label>Tipo</label>
                            <select value={formSessao.dub_leg} onChange={(e) => setFormSessao({ ...formSessao, dub_leg: e.target.value })}>
                                <option value="DUB">Dublado</option>
                                <option value="LEG">Legendado</option>
                            </select>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-blue" onClick={fecharModal}>Cancelar</button>
                            <button className="btn btn-gold" onClick={handleSalvarSessao}>Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            {modal === 'ingresso' && (
                <div className="modal-overlay aberto">
                    <div className="modal">
                        <button className="fechar-modal" onClick={fecharModal}>✕</button>
                        <h3>Novo Ingresso (Manual)</h3>
                        <div className="campo">
                            <label>CPF do Usuário</label>
                            <input type="text" maxLength="14" placeholder="000.000.000-00" value={formIngresso.cpf} onChange={(e) => setFormIngresso({ ...formIngresso, cpf: e.target.value })} />
                        </div>
                        <div className="campo">
                            <label>Sessão</label>
                            <select value={formIngresso.fk_sessao_id} onChange={(e) => setFormIngresso({ ...formIngresso, fk_sessao_id: e.target.value })}>
                                <option value="">-- selecione uma sessão --</option>
                                {sessoes.map(s => <option key={s.id} value={s.id}>[{s.id}] {s.filme_nome} - {formatarData(s.horario_inicio)}</option>)}
                            </select>
                        </div>
                        <div className="campo">
                            <label>Valor Total (R$)</label>
                            <input type="number" step="0.01" placeholder="35.00" value={formIngresso.valor_total} onChange={(e) => setFormIngresso({ ...formIngresso, valor_total: e.target.value })} />
                        </div>
                        <div className="campo">
                            <label>Método de Pagamento</label>
                            <select value={formIngresso.metodo_pagamento} onChange={(e) => setFormIngresso({ ...formIngresso, metodo_pagamento: e.target.value })}>
                                <option value="PIX">PIX</option>
                                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                            </select>
                        </div>
                        <div className="campo">
                            <label>Status do Pagamento</label>
                            <select value={formIngresso.status} onChange={(e) => setFormIngresso({ ...formIngresso, status: e.target.value })}>
                                <option value="PENDENTE">Pendente</option>
                                <option value="APROVADO">Aprovado</option>
                                <option value="RECUSADO">Recusado</option>
                            </select>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-blue" onClick={fecharModal}>Cancelar</button>
                            <button className="btn btn-gold" onClick={handleSalvarIngresso}>Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            {modal === 'status' && (
                <div className="modal-overlay aberto">
                    <div className="modal">
                        <button className="fechar-modal" onClick={fecharModal}>✕</button>
                        <h3>Alterar Status do Pagamento</h3>
                        <div className="campo">
                            <label>Novo Status</label>
                            <select value={formStatus.status} onChange={(e) => setFormStatus({ ...formStatus, status: e.target.value })}>
                                <option value="PENDENTE">Pendente</option>
                                <option value="APROVADO">Aprovado</option>
                                <option value="RECUSADO">Recusado</option>
                                <option value="ESTORNADO">Estornado</option>
                            </select>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-blue" onClick={fecharModal}>Cancelar</button>
                            <button className="btn btn-gold" onClick={handleSalvarStatus}>Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            {modal === 'assento' && (
                <div className="modal-overlay aberto">
                    <div className="modal">
                        <button className="fechar-modal" onClick={fecharModal}>✕</button>
                        <h3>Editar Assento</h3>
                        <div className="campo">
                            <label>Número do Assento</label>
                            <input type="text" placeholder="Ex: A1, B5" value={formAssento.numero_assento} onChange={(e) => setFormAssento({ ...formAssento, numero_assento: e.target.value })} />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-blue" onClick={fecharModal}>Cancelar</button>
                            <button className="btn btn-gold" onClick={handleSalvarAssento}>Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            <div id="feedback" className={`visivel ${toast.tipo}`} style={{ opacity: toast.visivel ? 1 : 0, pointerEvents: toast.visivel ? 'auto' : 'none' }}>
                {toast.msg}
            </div>
        </div>
    );
}