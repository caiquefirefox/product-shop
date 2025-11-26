import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import api from "../lib/api";
import { useToast } from "../ui/toast";
import { formatCpf, isValidCpf, sanitizeCpf } from "../lib/cpf";
import type { UsuarioPerfil, UsuarioLookup } from "../types/user";
import { useUser } from "../auth/useUser";
import { Check, ChevronDown, Plus, RefreshCcw } from "lucide-react";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function buildRoles(isAdmin: boolean) {
  return isAdmin ? ["Admin", "Colaborador"] : ["Colaborador"];
}

const MIN_SEARCH_LENGTH = 3;

const filterLabelClasses = "text-xs font-semibold uppercase tracking-wide text-slate-500";
const filterInputClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";
const clearFiltersButtonClasses =
  "inline-flex items-center gap-2 rounded-full border border-indigo-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2";

const perfilDropdownButtonBaseClasses =
  "inline-flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2";
const perfilDropdownButtonActiveClasses = "border-indigo-300 bg-indigo-50 text-indigo-600";
const perfilDropdownListClasses =
  "absolute left-0 top-full z-10 mt-2 w-full min-w-[200px] origin-top-left rounded-xl border border-slate-200 bg-white p-2 shadow-xl";
const perfilDropdownOptionClasses =
  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600";

const primaryActionButtonClasses =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6900] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#FF6900]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6900]/40 disabled:cursor-not-allowed disabled:opacity-60";

type PerfilOption = {
  value: string;
  label: string;
};

const perfilFilterOptions: PerfilOption[] = [
  { value: "", label: "Todos os perfis" },
  { value: "Admin", label: "Administrador" },
  { value: "Colaborador", label: "Colaborador" },
];

type PerfilFilterDropdownProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function PerfilFilterDropdown({ id, label, value, onChange }: PerfilFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(
    () => perfilFilterOptions.find(option => option.value === value) ?? perfilFilterOptions[0],
    [value],
  );
  const isPlaceholder = value === "";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div className="relative flex flex-col gap-2 text-left">
      <label htmlFor={id} className={filterLabelClasses}>
        {label}
      </label>
      <button
        type="button"
        id={id}
        ref={buttonRef}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`${perfilDropdownButtonBaseClasses} ${
          isPlaceholder ? "text-slate-500" : perfilDropdownButtonActiveClasses
        }`}
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          className={perfilDropdownListClasses}
          role="listbox"
          aria-labelledby={id}
        >
          <div className="max-h-60 overflow-y-auto">
            {perfilFilterOptions.map(option => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value || "placeholder"}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`${perfilDropdownOptionClasses} ${
                    isSelected ? "bg-indigo-50 text-indigo-600" : ""
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Usuarios() {
  const toast = useToast();
  const { refreshRoles } = useUser();
  const [usuarios, setUsuarios] = useState<UsuarioPerfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [localPanelOpen, setLocalPanelOpen] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [newCpf, setNewCpf] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [localCpf, setLocalCpf] = useState("");
  const [localSenha, setLocalSenha] = useState("");
  const [localEmail, setLocalEmail] = useState("");
  const [localIsAdmin, setLocalIsAdmin] = useState(false);
  const [creatingLocal, setCreatingLocal] = useState(false);

  const [searchResults, setSearchResults] = useState<UsuarioLookup[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<UsuarioLookup | null>(null);

  const [draftAdmins, setDraftAdmins] = useState<Record<string, boolean>>({});
  const [draftCpfs, setDraftCpfs] = useState<Record<string, string>>({});
  const [draftEmails, setDraftEmails] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const [filterEmail, setFilterEmail] = useState("");
  const [filterCpf, setFilterCpf] = useState("");
  const [filterPerfil, setFilterPerfil] = useState("");

  const newCpfComplete = newCpf.length === 11;
  const newCpfIncomplete = newCpf.length > 0 && !newCpfComplete;
  const newCpfInvalid = newCpfComplete && !isValidCpf(newCpf);
  const newCpfHasError = newCpfIncomplete || newCpfInvalid;
  const trimmedEmail = newEmail.trim();

  const resetNewUserForm = () => {
    setNewEmail("");
    setNewCpf("");
    setNewIsAdmin(false);
    setSelectedSuggestion(null);
    setSearchResults([]);
    setSearchError(null);
    setSearching(false);
  };

  const handleOpenCreatePanel = () => {
    resetNewUserForm();
    setLocalPanelOpen(false);
    setCreatePanelOpen(true);
  };

  const handleCloseCreatePanel = () => {
    resetNewUserForm();
    setCreatePanelOpen(false);
  };

  const resetLocalUserForm = () => {
    setLocalCpf("");
    setLocalSenha("");
    setLocalEmail("");
    setLocalIsAdmin(false);
  };

  const handleOpenLocalPanel = () => {
    resetLocalUserForm();
    setCreatePanelOpen(false);
    setLocalPanelOpen(true);
  };

  const handleCloseLocalPanel = () => {
    resetLocalUserForm();
    setLocalPanelOpen(false);
  };

  const fetchUsuarios = useCallback(async () => {
    setReloading(true);
    try {
      const { data } = await api.get<UsuarioPerfil[]>("/usuarios");
      setUsuarios(data);
      setDraftAdmins({});
      setDraftCpfs({});
      setDraftEmails({});
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

  useEffect(() => {
    const query = newEmail.trim();

    if (!query) {
      setSearchResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    if (query.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    setSearchError(null);

    const timeoutId = window.setTimeout(async () => {
      try {
        const { data } = await api.get<UsuarioLookup[]>("/usuarios/buscar", {
          params: { termo: query },
          signal: controller.signal
        });
        const resultados = Array.isArray(data) ? data : [];
        setSearchResults(resultados);
        if (
          selectedSuggestion &&
          !resultados.some((item) => item.microsoftId === selectedSuggestion.microsoftId)
        ) {
          setSelectedSuggestion(null);
        }
      } catch (error: any) {
        if (error?.code === "ERR_CANCELED" || controller.signal.aborted) {
          return;
        }
        const detail = error?.response?.data?.detail as string | undefined;
        setSearchError(detail ?? "Não foi possível buscar o usuário no Microsoft Entra ID.");
        setSearchResults([]);
        setSelectedSuggestion(null);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [newEmail]);

  useEffect(() => {
    if (!selectedSuggestion) {
      return;
    }

    const normalized = newEmail.trim().toLowerCase();
    if (!normalized || selectedSuggestion.email !== normalized) {
      setSelectedSuggestion(null);
    }
  }, [newEmail, selectedSuggestion]);

  const handleNewCpfChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewCpf(sanitizeCpf(event.target.value));
  };

  const handleFilterCpfChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilterCpf(sanitizeCpf(event.target.value));
  };

  const handleSelectSuggestion = (suggestion: UsuarioLookup) => {
    setSelectedSuggestion(suggestion);
    setNewEmail(suggestion.email);
    setSearchError(null);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const chosenUser = selectedSuggestion;
    const email = chosenUser?.email ?? newEmail.trim();
    if (!email) {
      toast.error("Informe o e-mail do usuário no Entra ID.");
      return;
    }
    if (!chosenUser) {
      toast.error("Selecione o usuário correspondente encontrado no Microsoft Entra ID.");
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
      setSelectedSuggestion(null);
      setSearchResults([]);
      setSearchError(null);
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

  const handleCreateLocal = async (event: FormEvent) => {
    event.preventDefault();
    const sanitized = sanitizeCpf(localCpf);

    if (sanitized.length !== 11 || !isValidCpf(sanitized)) {
      toast.error("CPF inválido.");
      return;
    }

    if (!localSenha.trim()) {
      toast.error("Informe a senha do usuário.");
      return;
    }

    const roles = buildRoles(localIsAdmin);
    const payload: { cpf: string; senha: string; roles: string[]; email?: string } = {
      cpf: sanitized,
      senha: localSenha,
      roles,
    };

    const trimmedLocalEmail = localEmail.trim();
    if (trimmedLocalEmail) {
      payload.email = trimmedLocalEmail;
    }

    setCreatingLocal(true);
    try {
      await api.post<UsuarioPerfil>("/usuarios/local", payload);
      toast.success("Usuário local salvo com sucesso.");
      setLocalCpf("");
      setLocalSenha("");
      setLocalEmail("");
      setLocalIsAdmin(false);
      await fetchUsuarios();
      await refreshRoles();
    } catch (error: any) {
      console.error("Erro ao criar usuário local", error);
      const detail = error?.response?.data?.detail as string | undefined;
      toast.error("Não foi possível salvar o usuário local.", detail);
    } finally {
      setCreatingLocal(false);
    }
  };

  const toggleAdmin = (usuario: UsuarioPerfil) => {
    setDraftAdmins((prev) => {
      const current = prev[usuario.id] ?? usuario.roles.includes("Admin");
      return { ...prev, [usuario.id]: !current };
    });
  };

  const handleDraftEmailChange = (usuario: UsuarioPerfil, value: string) => {
    setDraftEmails((prev) => ({ ...prev, [usuario.id]: value }));
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
    const draftEmail = (draftEmails[usuario.id] ?? usuario.email ?? "").trim();
    const isLocal = !usuario.microsoftId;

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

    if (isLocal) {
      if (!draftEmail || !draftEmail.includes("@")) {
        toast.error("Informe um e-mail válido.");
        return;
      }
    }

    setSavingId(usuario.id);
    try {
      if (isLocal) {
        await api.put<UsuarioPerfil>(`/usuarios/local/${usuario.id}`, {
          email: draftEmail || usuario.email,
          roles,
          cpf: cpfToSend,
        });
      } else {
        await api.post<UsuarioPerfil>("/usuarios", {
          email: usuario.email,
          roles,
          cpf: cpfToSend,
        });
      }
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
      setDraftEmails((prev) => {
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

  const filteredUsuarios = useMemo(() => {
    const normalizedEmail = filterEmail.trim().toLowerCase();
    const normalizedCpf = filterCpf;
    const perfil = filterPerfil;

    return usuarios.filter((usuario) => {
      const email = usuario.email ?? "";
      const matchesEmail =
        !normalizedEmail ||
        email.toLowerCase().includes(normalizedEmail) ||
        usuario.microsoftId.toLowerCase().includes(normalizedEmail);
      const usuarioCpf = sanitizeCpf(usuario.cpf ?? "");
      const matchesCpf = !normalizedCpf || usuarioCpf.includes(normalizedCpf);
      const matchesPerfil = !perfil || usuario.roles.includes(perfil);

      return matchesEmail && matchesCpf && matchesPerfil;
    });
  }, [usuarios, filterEmail, filterCpf, filterPerfil]);

  const hasUsuarios = usuarios.length > 0;
  const hasFilteredUsuarios = filteredUsuarios.length > 0;
  const hasUserFilters = Boolean(filterEmail.trim() || filterCpf || filterPerfil);

  const handleSyncUsuarios = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post<{ inseridos?: number; atualizados?: number }>("/usuarios/sincronizar");
      const inseridos = typeof data?.inseridos === "number" ? data.inseridos : 0;
      const atualizados = typeof data?.atualizados === "number" ? data.atualizados : 0;

      if (inseridos > 0 || atualizados > 0) {
        const importMessage = inseridos > 0
          ? inseridos === 1
            ? "1 novo usuário foi importado"
            : `${inseridos} novos usuários foram importados`
          : null;

        const updateMessage = atualizados > 0
          ? atualizados === 1
            ? "O e-mail de 1 usuário foi atualizado"
            : `Os e-mails de ${atualizados} usuários foram atualizados`
          : null;

        const parts: string[] = [];
        if (importMessage) {
          parts.push(importMessage);
        }
        if (updateMessage) {
          parts.push(updateMessage);
        }

        const detail = parts.length > 0 ? `${parts.join(" e ")}.` : undefined;

        toast.success("Sincronização concluída", detail);
      } else {
        toast.info("Sincronização concluída", "Nenhuma alteração encontrada.");
      }
      await fetchUsuarios();
    } catch (error: any) {
      console.error("Erro ao sincronizar usuários", error);
      const detail = error?.response?.data?.detail as string | undefined;
      toast.error("Não foi possível sincronizar os usuários.", detail);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearUserFilters = () => {
    setFilterEmail("");
    setFilterCpf("");
    setFilterPerfil("");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Usuários</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreatePanel}
            className={primaryActionButtonClasses}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Adicionar usuário SSO
          </button>
          <button
            type="button"
            onClick={handleOpenLocalPanel}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Adicionar usuário manual
          </button>
        </div>
      </div>

      {createPanelOpen && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Adicionar usuário</h2>
              <p className="text-sm text-gray-600">
                Informe o <strong>e-mail</strong> do usuário no Microsoft Entra ID. O perfil de Colaborador é atribuído automaticamente.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseCreatePanel}
              className="text-sm font-semibold text-gray-500 transition hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
            >
              Fechar
            </button>
          </div>
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

          {trimmedEmail.length > 0 && (
            <div className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                  Confirme o usuário localizado no Microsoft Entra ID
                </h3>
                {searching && <span className="text-xs text-gray-500">Buscando...</span>}
              </div>
              {trimmedEmail.length < MIN_SEARCH_LENGTH ? (
                <p className="text-xs text-gray-500">
                  Digite ao menos {MIN_SEARCH_LENGTH} caracteres para consultar o diretório.
                </p>
              ) : searchError ? (
                <p className="text-xs text-red-600">{searchError}</p>
              ) : searchResults.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Nenhum usuário encontrado com o e-mail informado.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {searchResults.map((usuario) => {
                      const isSelected = selectedSuggestion?.microsoftId === usuario.microsoftId;
                      const labelClass = [
                        "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition",
                        isSelected
                          ? "border-indigo-400 bg-white shadow-sm ring-2 ring-indigo-200"
                          : "border-transparent bg-white hover:border-indigo-200 hover:shadow-sm"
                      ].join(" ");

                      return (
                        <label
                          key={usuario.microsoftId}
                          className={labelClass}
                        >
                          <input
                            type="radio"
                            name="usuario-encontrado"
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            checked={isSelected}
                            onChange={() => handleSelectSuggestion(usuario)}
                          />
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-gray-900">
                              {usuario.displayName ?? usuario.email}
                            </span>
                            <span className="font-mono text-xs text-gray-700">{usuario.email}</span>
                            {usuario.userPrincipalName && usuario.userPrincipalName !== usuario.email && (
                              <span className="font-mono text-[10px] text-gray-500">
                                {usuario.userPrincipalName}
                              </span>
                            )}
                            <span className="font-mono text-[10px] text-gray-400">{usuario.microsoftId}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {!selectedSuggestion && (
                    <p className="text-xs text-gray-500">
                      Selecione um usuário da lista acima para confirmar o cadastro.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

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

          <div className="md:col-span-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCloseCreatePanel}
              className="inline-flex items-center rounded-xl border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating || !selectedSuggestion || newCpfHasError}
              className={primaryActionButtonClasses}
            >
              {creating ? (
                "Salvando..."
              ) : (
                <>
                  Adicionar usuário
                </>
              )}
            </button>
          </div>
        </form>
      </section>
      )}

      {localPanelOpen && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Cadastro manual (CPF e senha)</h2>
              <p className="text-sm text-gray-600">
                Use esta opção para criar usuários sem SSO. Informe o CPF e uma senha de acesso. O e-mail é opcional e pode ser usado apenas para identificação.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseLocalPanel}
              className="text-sm font-semibold text-gray-500 transition hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
            >
              Fechar
            </button>
          </div>

          <form className="mt-2 grid gap-4 md:grid-cols-2" onSubmit={handleCreateLocal}>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">CPF *</span>
              <input
                type="text"
                value={formatCpf(localCpf)}
                onChange={(event) => setLocalCpf(sanitizeCpf(event.target.value))}
                maxLength={14}
                className="h-11 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                placeholder="000.000.000-00"
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Senha *</span>
              <input
                type="password"
                value={localSenha}
                onChange={(event) => setLocalSenha(event.target.value)}
                className="h-11 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                placeholder="Digite uma senha segura"
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">E-mail (opcional)</span>
              <input
                type="email"
                value={localEmail}
                onChange={(event) => setLocalEmail(event.target.value)}
                className="h-11 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                placeholder="usuario@empresa.com"
              />
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
                  checked={localIsAdmin}
                  onChange={(event) => setLocalIsAdmin(event.target.checked)}
                />
                Administrador
              </label>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseLocalPanel}
                className="inline-flex items-center rounded-xl border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creatingLocal}
                className={primaryActionButtonClasses}
              >
                {creatingLocal ? "Salvando..." : "Cadastrar sem SSO"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {hasUserFilters && (
            <button type="button" onClick={handleClearUserFilters} className={clearFiltersButtonClasses}>
              Limpar filtros
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="usuarios-filtro-email" className={filterLabelClasses}>
              E-mail
            </label>
            <input
              id="usuarios-filtro-email"
              type="text"
              value={filterEmail}
              onChange={(event) => setFilterEmail(event.target.value)}
              placeholder="Buscar por e-mail"
              className={filterInputClasses}
            />
          </div>

          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="usuarios-filtro-cpf" className={filterLabelClasses}>
              CPF
            </label>
            <input
              id="usuarios-filtro-cpf"
              type="text"
              value={formatCpf(filterCpf)}
              onChange={handleFilterCpfChange}
              maxLength={14}
              placeholder="000.000.000-00"
              className={filterInputClasses}
            />
          </div>

          <PerfilFilterDropdown
            id="usuarios-filtro-perfil"
            label="Perfil"
            value={filterPerfil}
            onChange={setFilterPerfil}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchUsuarios}
              disabled={reloading || syncing}
              className="rounded-full border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reloading ? "Recarregando..." : "Recarregar"}
            </button>
            <button
              type="button"
              onClick={handleSyncUsuarios}
              disabled={syncing}
              className={primaryActionButtonClasses}
            >
              {syncing ? (
                "Sincronizando..."
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                  Sincronizar usuários
                </>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Carregando usuários...</div>
        ) : !hasUsuarios ? (
          <div className="py-12 text-center text-sm text-gray-500">Nenhum usuário cadastrado ainda.</div>
        ) : !hasFilteredUsuarios ? (
          <div className="py-12 text-center text-sm text-gray-500">Nenhum usuário encontrado com os filtros aplicados.</div>
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
                {filteredUsuarios.map((usuario) => {
                  const isAdminOriginal = usuario.roles.includes("Admin");
                  const isAdminDraft = draftAdmins[usuario.id] ?? isAdminOriginal;
                  const draftCpf = draftCpfs[usuario.id] ?? "";
                  const draftEmail = draftEmails[usuario.id] ?? usuario.email ?? "";
                  const cpfComplete = draftCpf.length === 11;
                  const cpfIncomplete = draftCpf.length > 0 && !cpfComplete;
                  const cpfInvalid = cpfComplete && !isValidCpf(draftCpf);
                  const cpfHasError = cpfIncomplete || cpfInvalid;
                  const canDefineCpf = !usuario.cpf;
                  const cpfChanged = canDefineCpf && cpfComplete && !cpfHasError;
                  const isLocal = !usuario.microsoftId;
                  const emailChanged = isLocal && draftEmail.trim() && draftEmail.trim() !== (usuario.email ?? "");
                  const hasChanges = isAdminDraft !== isAdminOriginal || cpfChanged || emailChanged;
                  const isSaving = savingId === usuario.id;

                  const displayEmail = usuario.email || "—";

                  return (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {isLocal ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="email"
                                  value={draftEmail}
                                  onChange={(event) => handleDraftEmailChange(usuario, event.target.value)}
                                  className="h-9 w-full rounded-lg border border-gray-200 px-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                />
                                <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
                                  Usuário local
                                </span>
                              </div>
                              {!draftEmail.trim() && <span className="text-xs text-red-600">E-mail obrigatório.</span>}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-gray-700">{displayEmail}</span>
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                                Usuário SSO
                              </span>
                            </div>
                          )}
                          <span className="font-mono text-[10px] text-gray-400">{usuario.microsoftId}</span>
                        </div>
                      </td>
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
