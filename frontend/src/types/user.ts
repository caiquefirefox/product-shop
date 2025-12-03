type UsuarioPerfil = {
  id: string;
  nome: string | null;
  microsoftId: string;
  email: string;
  ativo: boolean;
  deveTrocarSenha: boolean;
  cpf: string | null;
  roles: string[];
  criadoEm: string;
  atualizadoEm: string;
};

type UsuarioLookup = {
  microsoftId: string;
  email: string;
  mail: string | null;
  userPrincipalName: string | null;
  displayName: string | null;
};

type UsuarioListResponse =
  | UsuarioPerfil[]
  | {
      items: UsuarioPerfil[];
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };

export type { UsuarioListResponse, UsuarioPerfil, UsuarioLookup };
