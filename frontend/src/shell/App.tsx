import { useMsal } from "@azure/msal-react";
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import Catalogo from "../views/Catalogo";
import Carrinho from "../views/Carrinho";
import Checkout from "../views/Checkout";
import Produtos from "../views/Produtos";
import Relatorios from "../views/Relatorios";
import Pedidos from "../views/Pedidos";
import Login from "../views/Login";
import Protected from "../auth/Protected";
import { useUser } from "../auth/useUser";
import { useCart } from "../cart/CartContext";
import { formatPeso } from "../lib/format";

export default function App() {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const location = useLocation();
  const { account, isAdmin, isLoading, clearRolesCache } = useUser();
  const { totalUnidades, totalPesoKg, totalValor } = useCart();
  const isLoginRoute = location.pathname.startsWith("/login");
  const pesoResumo = formatPeso(totalPesoKg, "kg", { unit: "kg", minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const gotoLogin = () => navigate("/login");
  const logout = async () => {
    clearRolesCache?.();
    await instance.logoutPopup();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen">
      {!isLoginRoute && !isLoading && (
        <header className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <nav className="flex items-center gap-4">
              <Link to="/" className="font-semibold">Catálogo</Link>
              <Link to="/pedidos">Pedidos</Link>
              {isAdmin && <Link to="/produtos">Produtos</Link>}
              {isAdmin && <Link to="/relatorios">Relatórios</Link>}
            </nav>

            <div className="flex items-center gap-4">
              {/* Ícone do carrinho alinhado à direita */}
              <button
                onClick={() => navigate("/carrinho")}
                className="relative flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50"
                title={`Itens: ${totalUnidades} • ${pesoResumo} • R$ ${totalValor.toFixed(2)}`}
              >
                <ShoppingCart size={20} />
                {/* contador */}
                <span className="text-sm tabular-nums">{totalUnidades}</span>
                {/* totals compactos */}
                <span className="hidden md:inline text-xs text-gray-600">
                  {pesoResumo} • R$ {totalValor.toFixed(2)}
                </span>
              </button>

              {account ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{account.name}</span>
                  <button onClick={logout} className="px-3 py-1 border rounded-lg">Sair</button>
                </div>
              ) : (
                <button onClick={gotoLogin} className="px-3 py-1 border rounded-lg">Entrar</button>
              )}
            </div>
          </div>
        </header>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
