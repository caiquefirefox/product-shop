import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { Routes, Route, NavLink, Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import { Menu, ShoppingCart, X } from "lucide-react";
import Catalogo from "../views/Catalogo";
import Carrinho from "../views/Carrinho";
import Checkout from "../views/Checkout";
import Produtos from "../views/Produtos";
import Relatorios from "../views/Relatorios";
import Usuarios from "../views/Usuarios";
import Pedidos from "../views/Pedidos";
import Login from "../views/Login";
import Protected from "../auth/Protected";
import { useUser } from "../auth/useUser";
import { useCart } from "../cart/CartContext";
import { formatPeso, formatCurrencyBRL } from "../lib/format";

const PREMIERPET_LOGO_SRC =
  typeof import.meta.env.VITE_PREMIERPET_LOGO_URL === "string" &&
  import.meta.env.VITE_PREMIERPET_LOGO_URL.trim().length > 0
    ? import.meta.env.VITE_PREMIERPET_LOGO_URL
    : "premierpet-logo.png";

export default function App() {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const location = useLocation();
  const { account, isAdmin, isLoading, clearRolesCache } = useUser();
  const { totalUnidades, totalPesoKg, totalValor } = useCart();
  const isLoginRoute = location.pathname.startsWith("/login");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoginRoute) {
      setIsScrolled(false);
      return;
    }

    const onScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };

    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLoginRoute]);
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);
  const pesoResumo = formatPeso(totalPesoKg, "kg", { unit: "kg", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const valorFormatado = formatCurrencyBRL(totalValor);
  const itensLabel = totalUnidades === 1 ? "1 item" : `${totalUnidades} itens`;
  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-base transition-colors duration-150 ${
      isActive
        ? "text-[#FF6900] bg-[#FF6900]/10 font-bold"
        : "text-gray-600 hover:text-[#FF6900] hover:bg-[#FF6900]/10"
    }`;

  const gotoLogin = () => navigate("/login");
  const logout = async () => {
    clearRolesCache?.();
    await instance.logoutPopup();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen">
      {!isLoginRoute && !isLoading && (
        <header
          className={`fixed top-0 left-0 right-0 bg-white border-b transition-all duration-300 ${
            isScrolled ? "shadow-sm" : ""
          } z-50`}
        >
          <div
            className={`max-w-6xl mx-auto px-4 transition-all duration-300 ${
              isScrolled ? "py-2" : "py-4"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Link to="/" className="flex items-center" aria-label="PremieRpet">
                  <img src={PREMIERPET_LOGO_SRC} alt="PremieRpet" className="h-8 w-auto sm:h-10" />
                </Link>
                <button
                  type="button"
                  className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  onClick={() => setIsMenuOpen(prev => !prev)}
                  aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
                  aria-expanded={isMenuOpen}
                >
                  {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                <nav className="hidden md:flex items-center gap-1">
                  <NavLink to="/" end className={navLinkClassName}>
                    Catálogo
                  </NavLink>
                  <NavLink to="/pedidos" className={navLinkClassName}>
                    Pedidos
                  </NavLink>
                  {isAdmin && (
                    <NavLink to="/produtos" className={navLinkClassName}>
                      Produtos
                    </NavLink>
                  )}
                  {isAdmin && (
                    <NavLink to="/relatorios" className={navLinkClassName}>
                      Relatórios
                    </NavLink>
                  )}
                  {isAdmin && (
                    <NavLink to="/usuarios" className={navLinkClassName}>
                      Usuários
                    </NavLink>
                  )}
                </nav>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => navigate("/carrinho")}
                  className="relative flex items-center gap-2 rounded-full bg-[#FF6900] px-3 py-2 text-white transition-colors duration-150 hover:bg-[#FF6900]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6900]/40"
                  title={`${itensLabel} | ${valorFormatado} | ${pesoResumo}`}
                >
                  <ShoppingCart size={20} className="text-white" />
                  <span className="text-sm font-semibold tabular-nums whitespace-nowrap">{itensLabel}</span>
                  <span className="text-sm tabular-nums">| {valorFormatado}</span>
                  <span className="text-sm tabular-nums">| {pesoResumo}</span>
                </button>

                {account ? (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="hidden text-sm font-semibold text-gray-600 sm:inline">{account.name}</span>
                    <button onClick={logout} className="rounded-lg border px-3 py-1 text-sm">
                      Sair
                    </button>
                  </div>
                ) : (
                  <button onClick={gotoLogin} className="rounded-lg border px-3 py-1 text-sm">
                    Entrar
                  </button>
                )}
              </div>
            </div>
          </div>

          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-100 bg-white">
              <nav className="max-w-6xl mx-auto flex flex-col gap-1 px-4 py-3 text-base">
                <NavLink to="/" end className={({ isActive }) => `${navLinkClassName({ isActive })} w-full text-left`}>
                  Catálogo
                </NavLink>
                <NavLink to="/pedidos" className={({ isActive }) => `${navLinkClassName({ isActive })} w-full text-left`}>
                  Pedidos
                </NavLink>
                {isAdmin && (
                  <NavLink to="/produtos" className={({ isActive }) => `${navLinkClassName({ isActive })} w-full text-left`}>
                    Produtos
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/relatorios" className={({ isActive }) => `${navLinkClassName({ isActive })} w-full text-left`}>
                    Relatórios
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/usuarios" className={({ isActive }) => `${navLinkClassName({ isActive })} w-full text-left`}>
                    Usuários
                  </NavLink>
                )}
              </nav>
              <div className="max-w-6xl mx-auto flex flex-col gap-3 px-4 pb-3">
                {account ? (
                  <>
                    <span className="text-sm font-semibold text-gray-600">{account.name}</span>
                    <button onClick={logout} className="rounded-lg border px-3 py-2 text-sm">
                      Sair
                    </button>
                  </>
                ) : (
                  <button onClick={gotoLogin} className="rounded-lg border px-3 py-2 text-sm">
                    Entrar
                  </button>
                )}
              </div>
            </div>
          )}
        </header>
      )}

      {!isLoginRoute && !isLoading && (
        <div className={`transition-all duration-300 ${isScrolled ? "h-16" : "h-20"}`} aria-hidden />
      )}

      <main className={isLoginRoute ? "" : "max-w-6xl mx-auto p-4"}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected><Catalogo/></Protected>} />
          <Route path="/pedidos" element={<Protected><Pedidos/></Protected>} />
          <Route path="/carrinho" element={<Protected><Carrinho/></Protected>} />
          <Route path="/checkout" element={<Protected><Checkout/></Protected>} />
          <Route path="/produtos" element={<Protected requiredRole="Admin"><Produtos/></Protected>} />
          <Route path="/relatorios" element={<Protected requiredRole="Admin"><Relatorios/></Protected>} />
          <Route path="/usuarios" element={<Protected requiredRole="Admin"><Usuarios/></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
