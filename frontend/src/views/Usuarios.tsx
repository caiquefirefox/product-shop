import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import api from "../lib/api";
import { useToast } from "../ui/toast";
import { formatCpf, isValidCpf, sanitizeCpf } from "../lib/cpf";
import type { UsuarioPerfil } from "../types/user";
import { useUser } from "../auth/useUser";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function buildRoles(isAdmin: boolean) {
  return isAdmin ? ["Admin", "Colaborador"] : ["Colaborador"];
}

export default function Usuarios() {
  const toast = useToast();
  const { refreshRoles } = useUser();
  const [usuarios, setUsuarios] = useState<UsuarioPerfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [newCpf, setNewCpf] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [creating, setCreating] = useState(false);

  const [draftAdmins, setDraftAdmins] = useState<Record<string, boolean>>({});
  const [draftCpfs, setDraftCpfs] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const newCpfComplete = newCpf.length === 11;
  const newCpfIncomplete = newCpf.length > 0 && !newCpfComplete;
  const newCpfInvalid = newCpfComplete && !isValidCpf(newCpf);
  const newCpfHasError = newCpfIncomplete || newCpfInvalid;

  const fetchUsuarios = useCallback(async () => {
    setReloading(true);
    try {
      const { data } = await api.get<UsuarioPerfil[]>("/usuarios");
      setUsuarios(data);
      setDraftAdmins({});
      setDraftCpfs({});
    } catch (error) {
      console.error("Erro ao carregar usuários", error);
      toast.error("Não foi possível carregar a lista de usuários.");
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleNewCpfChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewCpf(sanitizeCpf(event.target.value));
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const email = newEmail.trim();
    if (!email) {
      toast.error("Informe o e-mail do usuário no Entra ID.");
      return;
    }
    if (newCpfHasError) {
      toast.error(newCpfIncomplete ? "CPF incompleto." : "CPF inválido.");
      return;
    }

    const roles = buildRoles(newIsAdmin);
    const payload: { email: string; cpf?: string; roles: string[] } = {
      email,
      roles,
    };
    if (newCpf) {
      payload.cpf = newCpf;
    }

    setCreating(true);
    try {
      await api.post<UsuarioPerfil>("/usuarios", payload);
      toast.success("Usuário salvo com sucesso.");
      setNewEmail("");
      setNewCpf("");
      setNewIsAdmin(false);
      await fetchUsuarios();
      await refreshRoles();
    } catch (error: any) {
      console.error("Erro ao criar usuário", error);
      const detail = error?.response?.data?.detail as string | undefined;
      toast.error("Não foi possível salvar o usuário.", detail);
    } finally {
      setCreating(false);
    }
  };

  const toggleAdmin = (usuario: UsuarioPerfil) => {
    setDraftAdmins((prev) => {
      const current = prev[usuario.id] ?? usuario.roles.includes("Admin");
      return { ...prev, [usuario.id]: !current };
    });
  };

  const handleDraftCpfChange = (usuario: UsuarioPerfil, value: string) => {
    const sanitized = sanitizeCpf(value);
    setDraftCpfs((prev) => ({ ...prev, [usuario.id]: sanitized }));
  };

  const handleSaveUsuario = async (usuario: UsuarioPerfil) => {
    const isAdminOriginal = usuario.roles.includes("Admin");
    const isAdminDraft = draftAdmins[usuario.id] ?? isAdminOriginal;
    const roles = buildRoles(isAdminDraft);
    const draftCpf = draftCpfs[usuario.id];
    const cpfToSend = usuario.cpf ?? (draftCpf && draftCpf.length ? draftCpf : undefined);

    if (!usuario.cpf && draftCpf) {
      if (draftCpf.length < 11) {
        toast.error("CPF incompleto.");
        return;
      }
      if (!isValidCpf(draftCpf)) {
        toast.error("CPF inválido.");
        return;
      }
    }

    setSavingId(usuario.id);
    try {
      await api.post<UsuarioPerfil>("/usuarios", {
        email: usuario.email,
        roles,
        cpf: cpfToSend,
      });
      toast.success("Alterações salvas.");
      setDraftAdmins((prev) => {
        const next = { ...prev };
        delete next[usuario.id];
        return next;
      });
      setDraftCpfs((prev) => {
        const next = { ...prev };
        delete next[usuario.id];
        return next;
      });
      await fetchUsuarios();
      await refreshRoles();
    } catch (error: any) {
      console.error("Erro ao atualizar usuário", error);
      const detail = error?.response?.data?.detail as string | undefined;
      toast.error("Não foi possível atualizar o usuário.", detail);
    } finally {
      setSavingId(null);
    }
  };

  const hasUsuarios = usuarios.length > 0;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Adicionar usuário</h1>
        <p className="text-sm text-gray-600 mb-6">
          Informe o <strong>e-mail</strong> do usuário no Microsoft Entra ID. O perfil de Colaborador é atribuído automaticamente.
        </p>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">E-mail *</span>
            <input
              type="text"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              placeholder="usuario@empresa.com"
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">CPF (opcional)</span>
            <input
              type="text"
              value={formatCpf(newCpf)}
              onChange={handleNewCpfChange}
              maxLength={14}
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              placeholder="000.000.000-00"
            />
            {newCpfIncomplete && <span className="text-xs text-red-600">CPF incompleto.</span>}
            {!newCpfIncomplete && newCpfInvalid && <span className="text-xs text-red-600">CPF inválido.</span>}
          </label>

          <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <div className="text-sm font-medium text-gray-700">Perfis</div>
              <div className="text-xs text-gray-500">Todo usuário é Colaborador. Marque para conceder acesso de Administrador.</div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={newIsAdmin}
                onChange={(event) => setNewIsAdmin(event.target.checked)}
              />
              Administrador
            </label>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={creating || !newEmail.trim() || newCpfHasError}
              className="inline-flex items-center rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {creating ? "Salvando..." : "Adicionar usuário"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Usuários cadastrados</h2>
            <p className="text-sm text-gray-600">Gerencie os perfis atribuídos dentro da aplicação.</p>
          </div>
          <button
            type="button"
            onClick={fetchUsuarios}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {reloading ? "Recarregando..." : "Recarregar"}
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Carregando usuários...</div>
        ) : !hasUsuarios ? (
          <div className="py-12 text-center text-sm text-gray-500">Nenhum usuário cadastrado ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">CPF</th>
                  <th className="px-4 py-3">Perfis</th>
                  <th className="px-4 py-3">Atualizado em</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map((usuario) => {
                  const isAdminOriginal = usuario.roles.includes("Admin");
                  const isAdminDraft = draftAdmins[usuario.id] ?? isAdminOriginal;
                  const draftCpf = draftCpfs[usuario.id] ?? "";
                  const cpfComplete = draftCpf.length === 11;
                  const cpfIncomplete = draftCpf.length > 0 && !cpfComplete;
                  const cpfInvalid = cpfComplete && !isValidCpf(draftCpf);
                  const cpfHasError = cpfIncomplete || cpfInvalid;
                  const canDefineCpf = !usuario.cpf;
                  const cpfChanged = canDefineCpf && cpfComplete && !cpfHasError;
                  const hasChanges = isAdminDraft !== isAdminOriginal || cpfChanged;
                  const isSaving = savingId === usuario.id;

                  return (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{usuario.email}</td>
                      <td className="px-4 py-3">
                        {usuario.cpf ? (
                          <span className="text-gray-700">{formatCpf(usuario.cpf)}</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <input
                              type="text"
                              value={formatCpf(draftCpf)}
                              onChange={(event) => handleDraftCpfChange(usuario, event.target.value)}
                              maxLength={14}
                              placeholder="000.000.000-00"
                              className="h-9 rounded-lg border border-gray-200 px-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                            {cpfIncomplete && <span className="text-xs text-red-600">CPF incompleto.</span>}
                            {!cpfIncomplete && cpfInvalid && <span className="text-xs text-red-600">CPF inválido.</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Colaborador</span>
                          <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={isAdminDraft}
                              onChange={() => toggleAdmin(usuario)}
                            />
                            Administrador
                          </label>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{dateFormatter.format(new Date(usuario.atualizadoEm))}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleSaveUsuario(usuario)}
                          disabled={!hasChanges || isSaving || cpfHasError}
                          className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          {isSaving ? "Salvando..." : "Salvar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
