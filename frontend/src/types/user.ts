type UsuarioPerfil = {
  id: string;
  microsoftId: string;
  email: string;
  cpf: string | null;
  roles: string[];
  criadoEm: string;
  atualizadoEm: string;
};

export type { UsuarioPerfil };
