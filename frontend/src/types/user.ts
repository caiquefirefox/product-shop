type UsuarioPerfil = {
  id: string;
  microsoftId: string;
  cpf: string | null;
  roles: string[];
  criadoEm: string;
  atualizadoEm: string;
};

export type { UsuarioPerfil };
