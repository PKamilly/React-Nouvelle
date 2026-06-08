import React, { createContext, useContext, useState } from "react";
import "../styles/modal.css";

const ModalContext = createContext(null);

export function Modal({ children }) {
  const [modal, setModal] = useState({ open: false });

  function close() {
    setModal({ open: false });
  }

  function showAlert(titulo, mensagem, tipo = "info", aoFechar = null) {
    setModal({ open: true, mode: "alert", titulo, mensagem, tipo, aoFechar });
  }

  function showConfirm(titulo, mensagem, aoConfirmar, aoCancelar = null) {
    setModal({ open: true, mode: "confirm", titulo, mensagem, tipo: "aviso", aoConfirmar, aoCancelar });
  }

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, close }}>
      {children}
      {modal.open && (
        <div className="modal-overlay" id="_modal-alerta-global">
          <div className={`modal-caixa modal-caixa--${modal.tipo || modal.tipo}`} style={{ borderColor: modal.tipo === 'erro' ? '#c0392b' : modal.tipo === 'sucesso' ? '#27ae60' : modal.tipo === 'aviso' ? '#F0AD12' : '#3498db' }}>
            <h3 className="modal-titulo">{modal.titulo}</h3>
            <p className="modal-mensagem">{modal.mensagem}</p>
            {modal.mode === "alert" ? (
              <button
                className="modal-btn modal-btn--ok"
                onClick={() => {
                  close();
                  if (typeof modal.aoFechar === "function") modal.aoFechar();
                }}
              >
                OK
              </button>
            ) : (
              <div className="modal-botoes">
                <button
                  className="modal-btn modal-btn--cancelar"
                  onClick={() => {
                    close();
                    if (typeof modal.aoCancelar === "function") modal.aoCancelar();
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="modal-btn modal-btn--confirmar"
                  onClick={() => {
                    close();
                    if (typeof modal.aoConfirmar === "function") modal.aoConfirmar();
                  }}
                >
                  Confirmar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}

export default Modal;
