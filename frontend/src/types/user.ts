type UsuarioPerfil = {
  id: string;
  nome: string | null;
  microsoftId: string;
  email: string;
  ativo: boolean;
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

export type { UsuarioPerfil, UsuarioLookup };
