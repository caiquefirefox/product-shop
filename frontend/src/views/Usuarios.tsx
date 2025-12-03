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
import type { UsuarioListResponse, UsuarioPerfil, UsuarioLookup } from "../types/user";
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
const DEFAULT_PAGE_SIZE = 12;

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

type FilterOption = {
  value: string;
  label: string;
};

const perfilFilterOptions: FilterOption[] = [
  { value: "", label: "Todos os perfis" },
  { value: "Admin", label: "Administrador" },
  { value: "Colaborador", label: "Colaborador" },
];

const origemFilterOptions: FilterOption[] = [
  { value: "", label: "Todas as origens" },
  { value: "sso", label: "SSO" },
  { value: "local", label: "Local" },
];

type FilterDropdownProps = {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
};

function FilterDropdown({ id, label, value, options, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(
    () => options.find(option => option.value === value) ?? options[0],
    [options, value],
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
            {options.map(option => {
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
  const [localNome, setLocalNome] = useState("");
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
  const [draftNomes, setDraftNomes] = useState<Record<string, string>>({});
  const [draftAtivos, setDraftAtivos] = useState<Record<string, boolean>>({});
  const [draftBases, setDraftBases] = useState<Record<string, UsuarioPerfil>>({});
  const [syncing, setSyncing] = useState(false);
  const [confirmChangesOpen, setConfirmChangesOpen] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  const [filterEmail, setFilterEmail] = useState("");
  const [filterCpf, setFilterCpf] = useState("");
  const [filterPerfil, setFilterPerfil] = useState("");
  const [filterOrigem, setFilterOrigem] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

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

  const fetchUsuarios = useCallback(
    async (targetPage: number) => {
      setReloading(true);

      try {
        const params: Record<string, string | number> = {
          page: targetPage,
          pageSize: DEFAULT_PAGE_SIZE,
        };

        const busca = filterEmail.trim();
        if (busca) {
          params.busca = busca;
        }

        const cpfFiltro = sanitizeCpf(filterCpf);
        if (cpfFiltro) {
          params.cpf = cpfFiltro;
        }

        if (filterPerfil) {
          params.perfil = filterPerfil;
        }

        if (filterOrigem) {
          params.origem = filterOrigem;
        }

        const { data } = await api.get<UsuarioListResponse>("/usuarios", { params });
        const isArrayResponse = Array.isArray(data);
        const items = isArrayResponse ? data : Array.isArray(data?.items) ? data.items : [];
        const reportedPage = !isArrayResponse && typeof data?.page === "number" ? data.page : targetPage;
        const reportedPageSize = !isArrayResponse && typeof data?.pageSize === "number" ? data.pageSize : DEFAULT_PAGE_SIZE;
        const reportedTotalItems = !isArrayResponse && typeof data?.totalItems === "number" ? data.totalItems : items.length;
        const reportedTotalPages = !isArrayResponse && typeof data?.totalPages === "number" ? data.totalPages : 0;

        const safePageSize = reportedPageSize > 0 ? reportedPageSize : DEFAULT_PAGE_SIZE;
        const safeTotalItems = Math.max(0, reportedTotalItems);
        const normalizedTotalPages = safeTotalItems > 0
          ? (reportedTotalPages > 0 ? reportedTotalPages : Math.max(Math.ceil(safeTotalItems / safePageSize), 1))
          : 0;
        const safePageFromResponse = normalizedTotalPages > 0
          ? Math.min(Math.max(reportedPage > 0 ? reportedPage : targetPage, 1), normalizedTotalPages)
          : 1;

        setUsuarios(items);
        setPageSize(safePageSize);
        setTotalItems(safeTotalItems);
        setTotalPages(normalizedTotalPages);

        if (safePageFromResponse !== page) {
          setPage(safePageFromResponse);
        }
      } catch (error) {
        console.error("Erro ao carregar usuários", error);
        toast.error("Não foi possível carregar a lista de usuários.");
      } finally {
        setLoading(false);
        setReloading(false);
      }
    },
    [filterCpf, filterEmail, filterOrigem, filterPerfil, page, toast],
  );

  useEffect(() => {
    fetchUsuarios(page);
  }, [fetchUsuarios, page]);

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
    setPage(1);
  };

  const handlePerfilFilterChange = (value: string) => {
    setFilterPerfil(value);
    setPage(1);
  };

  const handleOrigemFilterChange = (value: string) => {
    setFilterOrigem(value);
    setPage(1);
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
    const payload: { email: string; cpf?: string; roles: string[]; nome?: string } = {
      email,
      roles,
    };
    const nome = chosenUser.displayName?.trim();
    if (nome) {
      payload.nome = nome;
    }
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
      await fetchUsuarios(page);
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

    const trimmedLocalNome = localNome.trim();
    if (!trimmedLocalNome) {
      toast.error("Informe o nome do usuário.");
      return;
    }

    const roles = buildRoles(localIsAdmin);
    const payload: { cpf: string; senha: string; roles: string[]; email?: string; nome: string } = {
      cpf: sanitized,
      senha: localSenha,
      roles,
      nome: trimmedLocalNome,
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
      setLocalNome("");
      setLocalEmail("");
      setLocalIsAdmin(false);
      await fetchUsuarios(page);
      await refreshRoles();
    } catch (error: any) {
      console.error("Erro ao criar usuário local", error);
      const detail = error?.response?.data?.detail as string | undefined;
      toast.error("Não foi possível salvar o usuário local.", detail);
    } finally {
      setCreatingLocal(false);
    }
  };

  const rememberDraftBase = useCallback((usuario: UsuarioPerfil) => {
    setDraftBases((prev) => {
      if (prev[usuario.id]) {
        return prev;
      }
      return { ...prev, [usuario.id]: usuario };
    });
  }, []);

  const toggleAdmin = (usuario: UsuarioPerfil) => {
    rememberDraftBase(usuario);
    setDraftAdmins((prev) => {
      const current = prev[usuario.id] ?? usuario.roles.includes("Admin");
      return { ...prev, [usuario.id]: !current };
    });
  };

  const toggleAtivo = (usuario: UsuarioPerfil) => {
    rememberDraftBase(usuario);
    setDraftAtivos((prev) => {
      const current = prev[usuario.id] ?? usuario.ativo;
      return { ...prev, [usuario.id]: !current };
    });
  };

  const handleDraftEmailChange = (usuario: UsuarioPerfil, value: string) => {
    rememberDraftBase(usuario);
    setDraftEmails((prev) => ({ ...prev, [usuario.id]: value }));
  };

  const handleDraftNomeChange = (usuario: UsuarioPerfil, value: string) => {
    rememberDraftBase(usuario);
    setDraftNomes((prev) => ({ ...prev, [usuario.id]: value }));
  };

  const handleDraftCpfChange = (usuario: UsuarioPerfil, value: string) => {
    rememberDraftBase(usuario);
    const sanitized = sanitizeCpf(value);
    setDraftCpfs((prev) => ({ ...prev, [usuario.id]: sanitized }));
  };

  type UsuarioDraftInfo = {
    usuario: UsuarioPerfil;
    isLocal: boolean;
    isAdminOriginal: boolean;
    isAdminDraft: boolean;
    roles: string[];
    draftCpf: string;
    cpfIncomplete: boolean;
    cpfInvalid: boolean;
    cpfToSend?: string;
    draftEmail: string;
    draftNome: string;
    rawDraftEmail: string;
    rawDraftNome: string;
    draftAtivo: boolean;
    cpfHasError: boolean;
    nomeHasError: boolean;
    emailHasError: boolean;
    hasProfileChanges: boolean;
    statusChanged: boolean;
    hasChanges: boolean;
    hasError: boolean;
    changeDescriptions: string[];
  };

  const clearDraftsForUsuario = (usuarioId: string) => {
    setDraftAdmins((prev) => {
      const next = { ...prev };
      delete next[usuarioId];
      return next;
    });
    setDraftCpfs((prev) => {
      const next = { ...prev };
      delete next[usuarioId];
      return next;
    });
    setDraftEmails((prev) => {
      const next = { ...prev };
      delete next[usuarioId];
      return next;
    });
    setDraftNomes((prev) => {
      const next = { ...prev };
      delete next[usuarioId];
      return next;
    });
    setDraftAtivos((prev) => {
      const next = { ...prev };
      delete next[usuarioId];
      return next;
    });
    setDraftBases((prev) => {
      const next = { ...prev };
      delete next[usuarioId];
      return next;
    });
  };

  const getUsuarioDraftInfo = useCallback(
    (usuario: UsuarioPerfil): UsuarioDraftInfo => {
      const isAdminOriginal = usuario.roles.includes("Admin");
      const isAdminDraft = draftAdmins[usuario.id] ?? isAdminOriginal;
      const roles = buildRoles(isAdminDraft);
    const originalCpf = sanitizeCpf(usuario.cpf ?? "");
    const draftCpf = draftCpfs[usuario.id] ?? originalCpf;
    const cpfComplete = draftCpf.length === 11;
    const cpfIncomplete = draftCpf.length > 0 && !cpfComplete;
    const cpfInvalid = cpfComplete && !isValidCpf(draftCpf);
    const cpfHasError = cpfIncomplete || cpfInvalid;
    const cpfToSend = cpfComplete && !cpfHasError ? draftCpf : originalCpf || undefined;
      const draftEmail = draftEmails[usuario.id] ?? usuario.email ?? "";
      const draftNome = draftNomes[usuario.id] ?? usuario.nome ?? "";
      const draftAtivo = draftAtivos[usuario.id] ?? usuario.ativo;
      const isLocal = !usuario.microsoftId;
      const trimmedDraftEmail = draftEmail.trim();
      const trimmedDraftNome = draftNome.trim();
      const emailHasError = isLocal && (!trimmedDraftEmail || !trimmedDraftEmail.includes("@"));
      const nomeHasError = isLocal && !trimmedDraftNome;
      const emailChanged = isLocal && trimmedDraftEmail && trimmedDraftEmail !== (usuario.email ?? "");
      const nomeChanged = isLocal && trimmedDraftNome && trimmedDraftNome !== (usuario.nome ?? "");
    const cpfChanged = cpfComplete && draftCpf !== originalCpf && !cpfHasError;
      const hasProfileChanges = isAdminDraft !== isAdminOriginal || cpfChanged || emailChanged || nomeChanged;
      const statusChanged = draftAtivo !== usuario.ativo;
      const hasChanges = hasProfileChanges || statusChanged;
      const hasError = cpfHasError || nomeHasError || emailHasError;

      const changeDescriptions: string[] = [];
      if (nomeChanged) {
        changeDescriptions.push(`Nome: ${usuario.nome || "—"} → ${trimmedDraftNome}`);
      }
      if (emailChanged) {
        changeDescriptions.push(`E-mail: ${usuario.email || "—"} → ${trimmedDraftEmail}`);
      }
      if (cpfChanged && cpfToSend) {
        changeDescriptions.push(`CPF: ${originalCpf ? formatCpf(originalCpf) : "—"} → ${formatCpf(cpfToSend)}`);
      }
      if (isAdminDraft !== isAdminOriginal) {
        changeDescriptions.push(
          `Perfil: ${isAdminOriginal ? "Administrador" : "Colaborador"} → ${isAdminDraft ? "Administrador" : "Colaborador"}`,
        );
      }
      if (statusChanged) {
        changeDescriptions.push(`Status: ${usuario.ativo ? "Ativo" : "Inativo"} → ${draftAtivo ? "Ativo" : "Inativo"}`);
      }

      return {
        usuario,
        isLocal,
        isAdminOriginal,
        isAdminDraft,
        roles,
        draftCpf,
        cpfIncomplete,
        cpfInvalid,
        cpfToSend,
        rawDraftEmail: draftEmail,
        draftEmail: trimmedDraftEmail,
        rawDraftNome: draftNome,
        draftNome: trimmedDraftNome,
        draftAtivo,
        cpfHasError,
        nomeHasError,
        emailHasError,
        hasProfileChanges,
        statusChanged,
        hasChanges,
        hasError,
        changeDescriptions,
      };
    },
    [draftAdmins, draftAtivos, draftCpfs, draftEmails, draftNomes],
  );

  const pendingChanges = useMemo(
    () => {
      const ids = new Set<string>([
        ...Object.keys(draftAdmins),
        ...Object.keys(draftAtivos),
        ...Object.keys(draftCpfs),
        ...Object.keys(draftEmails),
        ...Object.keys(draftNomes),
      ]);

      const byId: Record<string, UsuarioPerfil> = {};
      usuarios.forEach((usuario) => {
        byId[usuario.id] = usuario;
      });

      return Array.from(ids)
        .map((usuarioId) => {
          const baseUsuario = byId[usuarioId] ?? draftBases[usuarioId];
          if (!baseUsuario) {
            return null;
          }
          return getUsuarioDraftInfo(baseUsuario);
        })
        .filter((info): info is UsuarioDraftInfo => Boolean(info?.hasChanges));
    },
    [draftAdmins, draftAtivos, draftBases, draftCpfs, draftEmails, draftNomes, getUsuarioDraftInfo, usuarios],
  );

  const hasPendingErrors = useMemo(
    () => pendingChanges.some((change) => change.hasError),
    [pendingChanges],
  );

  type UsuarioLotePayload = {
    id: string;
    atualizarPerfil: boolean;
    atualizarStatus: boolean;
    email?: string | null;
    cpf?: string | null;
    nome?: string | null;
    roles?: string[];
    ativo?: boolean;
  };

  const handleOpenConfirmChanges = () => {
    if (!pendingChanges.length) {
      toast.info("Nenhuma alteração para salvar.");
      return;
    }

    if (hasPendingErrors) {
      toast.error("Corrija os campos destacados antes de salvar.");
      return;
    }

    setConfirmChangesOpen(true);
  };

  const handleConfirmSaveChanges = async () => {
    if (!pendingChanges.length) {
      setConfirmChangesOpen(false);
      return;
    }

    setSavingAll(true);
    try {
      const payload: UsuarioLotePayload[] = pendingChanges.map(change => ({
        id: change.usuario.id,
        atualizarPerfil: change.hasProfileChanges,
        atualizarStatus: change.statusChanged,
        email: change.hasProfileChanges ? change.draftEmail || change.usuario.email : undefined,
        cpf: change.hasProfileChanges ? change.cpfToSend : undefined,
        nome: change.hasProfileChanges ? change.draftNome || change.usuario.nome : undefined,
        roles: change.hasProfileChanges ? change.roles : undefined,
        ativo: change.statusChanged ? change.draftAtivo : undefined,
      }));

      await api.post<UsuarioPerfil[]>("/usuarios/lote", { usuarios: payload });

      for (const change of pendingChanges) {
        clearDraftsForUsuario(change.usuario.id);
      }
      toast.success("Alterações salvas.");
      setConfirmChangesOpen(false);
      await fetchUsuarios(page);
      await refreshRoles();
    } catch (error: any) {
      console.error("Erro ao atualizar usuários", error);
      const detail = error?.response?.data?.detail as string | undefined;
      toast.error("Não foi possível atualizar os usuários.", detail);
    } finally {
      setSavingAll(false);
    }
  };

  const hasUsuarios = usuarios.length > 0;
  const hasUserFilters = Boolean(filterEmail.trim() || filterCpf || filterPerfil || filterOrigem);

  const safePageSize = pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
  const safeTotalItems = hasUsuarios ? Math.max(totalItems, usuarios.length) : totalItems;
  const normalizedTotalPages = safeTotalItems > 0
    ? (totalPages > 0 ? totalPages : Math.max(Math.ceil(safeTotalItems / safePageSize), 1))
    : 0;
  const safePage = normalizedTotalPages > 0 ? Math.min(Math.max(page, 1), normalizedTotalPages) : 1;
  const showingStart = hasUsuarios ? (safePage - 1) * safePageSize + 1 : 0;
  const showingEnd = hasUsuarios ? Math.min(showingStart + usuarios.length - 1, safeTotalItems) : 0;
  const canGoPrev = hasUsuarios && safePage > 1;
  const canGoNext = hasUsuarios && normalizedTotalPages > 0 && safePage < normalizedTotalPages;
  const displayTotalPages = normalizedTotalPages > 0 ? normalizedTotalPages : 1;
  const noResults = !loading && safeTotalItems === 0;

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
      await fetchUsuarios(page);
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
    setFilterOrigem("");
    setPage(1);
  };

  return (
    <>
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
              <span className="text-sm font-medium text-gray-700">Nome completo *</span>
              <input
                type="text"
                value={localNome}
                onChange={(event) => setLocalNome(event.target.value)}
                className="h-11 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                placeholder="Digite o nome do usuário"
                required
              />
            </label>

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] md:items-end">
          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="usuarios-filtro-email" className={filterLabelClasses}>
              E-mail ou nome
            </label>
            <input
              id="usuarios-filtro-email"
              type="text"
              value={filterEmail}
              onChange={(event) => {
                setFilterEmail(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por e-mail ou nome"
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

          <FilterDropdown
            id="usuarios-filtro-perfil"
            label="Perfil"
            value={filterPerfil}
            options={perfilFilterOptions}
            onChange={handlePerfilFilterChange}
          />

          <FilterDropdown
            id="usuarios-filtro-origem"
            label="Origem"
            value={filterOrigem}
            options={origemFilterOptions}
            onChange={handleOrigemFilterChange}
          />

          {hasUserFilters && (
            <div className="flex justify-start md:justify-start">
              <button type="button" onClick={handleClearUserFilters} className={clearFiltersButtonClasses}>
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchUsuarios(page)}
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
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-gray-600">
              {pendingChanges.length > 0 ? (
                <span className="font-semibold text-gray-900">{pendingChanges.length} alteração(es) pendente(s)</span>
              ) : (
                "Nenhuma alteração pendente"
              )}
              {hasPendingErrors && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-red-700">
                  Corrija os campos destacados
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleOpenConfirmChanges}
              disabled={pendingChanges.length === 0 || hasPendingErrors || savingAll}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {savingAll ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Carregando usuários...</div>
        ) : noResults ? (
          <div className="py-12 text-center text-sm text-gray-500">
            {hasUserFilters
              ? "Nenhum usuário encontrado com os filtros aplicados."
              : "Nenhum usuário cadastrado ainda."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-[1100px] divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">E-mail</th>
                    <th className="px-4 py-3">Origem</th>
                    <th className="px-4 py-3">CPF</th>
                    <th className="px-4 py-3 text-center">ADM</th>
                    <th className="px-4 py-3 text-center">Ativo</th>
                    <th className="px-4 py-3">Atualizado em</th>
                    <th className="px-4 py-3 text-right">Pendências</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usuarios.map((usuario) => {
                  const draftInfo = getUsuarioDraftInfo(usuario);
                  const {
                    isLocal,
                    isAdminDraft,
                    isAdminOriginal,
                    draftCpf,
                    cpfIncomplete,
                    cpfInvalid,
                    rawDraftEmail,
                    rawDraftNome,
                    draftAtivo,
                    nomeHasError,
                    emailHasError,
                    hasChanges,
                    changeDescriptions,
                  } = draftInfo;
                  const canEditCpf = true;

                  const displayEmail = usuario.email || "—";
                  const displayNome = usuario.nome || "—";

                  return (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 align-top">
                        {isLocal ? (
                          <div className="flex flex-col gap-1">
                            <input
                              type="text"
                              value={rawDraftNome}
                              onChange={(event) => handleDraftNomeChange(usuario, event.target.value)}
                              className="h-9 w-full rounded-lg border border-gray-200 px-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                              placeholder="Nome completo"
                            />
                            {nomeHasError && <span className="text-xs text-red-600">Nome obrigatório.</span>}
                          </div>
                        ) : (
                          <span className="block max-w-[220px] break-words text-sm font-medium text-gray-800">{displayNome}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-1 break-words">
                          {isLocal ? (
                            <div className="flex flex-col gap-1">
                              <input
                                type="email"
                                value={rawDraftEmail}
                                onChange={(event) => handleDraftEmailChange(usuario, event.target.value)}
                                className="h-9 w-full rounded-lg border border-gray-200 px-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                              />
                              {emailHasError && <span className="text-xs text-red-600">Informe um e-mail válido.</span>}
                            </div>
                          ) : (
                            <span className="max-w-[260px] break-words font-mono text-xs text-gray-700">{displayEmail}</span>
                          )}
                          {usuario.microsoftId && (
                            <span className="max-w-[260px] break-all font-mono text-[10px] text-gray-400">{usuario.microsoftId}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                            isLocal ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isLocal ? "Local" : "SSO"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {canEditCpf ? (
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
                        ) : (
                          <span className="text-gray-700">{usuario.cpf ? formatCpf(usuario.cpf) : "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <label className="inline-flex items-center justify-center">
                            <span className="sr-only">{isAdminDraft ? "Usuário administrador" : "Usuário colaborador"}</span>
                            <input
                              type="checkbox"
                              className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={isAdminDraft}
                              onChange={() => toggleAdmin(usuario)}
                              title={isAdminDraft ? "Administrador" : "Colaborador"}
                            />
                          </label>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <label className="inline-flex items-center justify-center">
                            <span className="sr-only">{draftAtivo ? "Usuário ativo" : "Usuário inativo"}</span>
                            <input
                              type="checkbox"
                              className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={draftAtivo}
                              onChange={() => toggleAtivo(usuario)}
                              title={draftAtivo ? "Ativo" : "Inativo"}
                            />
                          </label>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{dateFormatter.format(new Date(usuario.atualizadoEm))}</td>
                      <td className="px-4 py-3 text-right">
                        {hasChanges ? (
                          <div className="flex flex-col items-end gap-2">
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                              Alteração pendente
                            </span>
                            {changeDescriptions.length > 0 && (
                              <ul className="max-w-[280px] list-disc list-inside text-right text-xs text-gray-600">
                                {changeDescriptions.map((change) => (
                                  <li key={change}>{change}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Nenhuma alteração</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
            {hasUsuarios && (
              <nav
                className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                aria-label="Paginação da lista de usuários"
              >
                <p className="text-sm text-gray-600">
                  Mostrando{" "}
                  <span className="font-semibold text-gray-900">
                    {showingStart}-{showingEnd}
                  </span>{" "}
                  de{" "}
                  <span className="font-semibold text-gray-900">{safeTotalItems}</span>{" "}
                  usuários
                  {reloading && (
                    <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-indigo-500">Atualizando...</span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={!canGoPrev}
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
                  >
                    Anterior
                  </button>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Página {safePage} de {displayTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(displayTotalPages, prev + 1))}
                    disabled={!canGoNext}
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
                  >
                    Próxima
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </section>
    </div>

    {confirmChangesOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Confirmar alterações</h2>
              <p className="text-sm text-gray-600">Revise as mudanças abaixo antes de salvar.</p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmChangesOpen(false)}
              className="text-sm font-semibold text-gray-500 transition hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
            >
              Fechar
            </button>
          </div>

          <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto">
            {pendingChanges.map((change) => {
              const displayName = change.usuario.nome || change.usuario.email || "Usuário sem nome";
              const displayEmail = change.usuario.email ?? "Sem e-mail";
              return (
                <div key={change.usuario.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{displayName}</div>
                      <div className="text-xs text-gray-500">{displayEmail}</div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                      ID: {change.usuario.id}
                    </span>
                  </div>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
                    {change.changeDescriptions.map((desc) => (
                      <li key={desc}>{desc}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmChangesOpen(false)}
              className="inline-flex items-center rounded-xl border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmSaveChanges}
              disabled={savingAll}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {savingAll ? "Salvando..." : "Confirmar alterações"}
            </button>
          </div>
        </div>
      </div>
    )}

    </>
  );
}
