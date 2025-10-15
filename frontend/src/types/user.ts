type UsuarioPerfil = {
  id: string;
  email: string;
  cpf: string | null;
  roles: string[];
  criadoEm: string;
  atualizadoEm: string;
};

export type { UsuarioPerfil };
