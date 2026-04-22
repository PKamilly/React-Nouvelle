import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import FilmesCartaz from "./pages/FilmesCartaz";
import EmBreve from "./pages/EmBreve";
import Detalhes from "./pages/Detalhes";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Perfil from "./pages/Perfil";
import Assentos from "./pages/Assentos";
import Pagamento from "./pages/Pagamento";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/filmesCartaz" element={<FilmesCartaz />} />
        <Route path="/emBreve" element={<EmBreve />} />
        <Route path="/detalhes/:id" element={<Detalhes />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/assentos" element={<Assentos />} />
        <Route path="/pagamento" element={<Pagamento />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;