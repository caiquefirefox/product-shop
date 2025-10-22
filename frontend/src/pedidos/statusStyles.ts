export const STATUS_SOLICITADO = 1;
export const STATUS_APROVADO = 2;
export const STATUS_CANCELADO = 3;

const STATUS_BADGE_STYLES: Record<number, { background: string; color: string }> = {
  [STATUS_SOLICITADO]: { background: "#D9F1C1", color: "#00851F" },
  [STATUS_APROVADO]: { background: "#D6EEFF", color: "#04409A" },
  [STATUS_CANCELADO]: { background: "#FFD6D6", color: "#FF0000" },
};

const DEFAULT_BADGE_STYLE = { background: "#EDECE5", color: "#4B5563" };

export function getStatusBadgeStyle(statusId: number) {
  return STATUS_BADGE_STYLES[statusId] ?? DEFAULT_BADGE_STYLE;
}

export { STATUS_BADGE_STYLES };
