import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import "../styles/modal.css"; 

export default function SessionTimeout() {
    const [mostrarAviso, setMostrarAviso] = useState(false);
    
    // useRef guarda os IDs dos timers sem causar re-renderizações desnecessárias na tela
    const timerLogout = useRef(null);
    const timerAviso = useRef(null);
    
    // useLocation ajuda a saber se o usuário mudou de página
    const location = useLocation();

    // Configuração do tempo
    const TIMEOUT_MIN = 15;
    const AVISO_MIN = 14; 
    const TIMEOUT_MS = TIMEOUT_MIN * 60 * 1000;
    const AVISO_MS = AVISO_MIN * 60 * 1000;

    const deslogar = () => {
        localStorage.removeItem("usuario_nome");
        localStorage.removeItem("usuario_cpf");
        localStorage.removeItem("usuario_permissao");
        localStorage.removeItem("usuario_caminho_final");
        setMostrarAviso(false);
        // window.location.href força o recarregamento e limpa todos os estados do React
        window.location.href = "/login"; 
    };

    const reiniciarTimers = () => {
        // Só inicia a contagem se o usuário estiver logado
        if (!localStorage.getItem("usuario_cpf")) return;

        clearTimeout(timerLogout.current);
        clearTimeout(timerAviso.current);
        setMostrarAviso(false);

        // Timer para mostrar o aviso
        timerAviso.current = setTimeout(() => {
            setMostrarAviso(true);
        }, AVISO_MS);

        // Timer para deslogar de fato
        timerLogout.current = setTimeout(() => {
            deslogar();
        }, TIMEOUT_MS);
    };

    useEffect(() => {
        const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

        if (localStorage.getItem("usuario_cpf")) {
            reiniciarTimers();
            eventos.forEach(evento => window.addEventListener(evento, reiniciarTimers, { passive: true }));
        }

        return () => {
            clearTimeout(timerLogout.current);
            clearTimeout(timerAviso.current);
            eventos.forEach(evento => window.removeEventListener(evento, reiniciarTimers));
        };
    }, [location.pathname]);

    // Se não for hora de mostrar o aviso, o componente fica invisível na interface
    if (!mostrarAviso) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-caixa modal-caixa--aviso">
                <h3 className="modal-titulo" style={{ color: "#F0AD12" }}>Sessão quase expirando</h3>
                <p className="modal-mensagem" style={{ color: "#ccc", marginBottom: "20px" }}>
                    Você será desconectado em 1 minuto por inatividade. Interaja com a página para continuar logado.
                </p>
                <div className="modal-botoes">
                    <button 
                        className="modal-btn modal-btn--ok" 
                        onClick={reiniciarTimers} 
                        style={{ background: "#F0AD12", color: "#111" }}
                    >
                        Continuar Logado
                    </button>
                </div>
            </div>
        </div>
    );
}