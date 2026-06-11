import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import SessionTimeout from "./components/SessionTimeout";
import Home from "./pages/Home";
import FilmesCartaz from "./pages/FilmesCartaz";
import EmBreve from "./pages/EmBreve";
import Detalhes from "./pages/Detalhes";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Perfil from "./pages/Perfil";
import Assentos from "./pages/Assentos";
import Sessoes from "./pages/Sessoes";
import Pagamento from "./pages/Pagamento";
import Ingressos from "./pages/Ingressos";
import Admin from "./pages/Admin";
import { Modal } from "./components/Modal";

function App() {
  return (
    <Modal>
      <BrowserRouter>
        <SessionTimeout />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/filmesCartaz" element={<FilmesCartaz />} />
          <Route path="/emBreve" element={<EmBreve />} />
          <Route path="/detalhes/:id" element={<Detalhes />} />
          <Route path="/sessoes/:id" element={<Sessoes />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />s
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/ingressos" element={<Ingressos />} />
          <Route path="/assentos" element={<Assentos />} />
          <Route path="/pagamento" element={<Pagamento />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </Modal>
  );
}

export default App;