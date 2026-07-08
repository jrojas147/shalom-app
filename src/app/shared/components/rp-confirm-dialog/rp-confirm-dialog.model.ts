export type RpConfirmVariant = 'primary' | 'danger';

export interface RpConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: RpConfirmVariant;
}

export interface RpConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmVariant: RpConfirmVariant;
}

export const RP_CONFIRM_DEFAULTS: Omit<RpConfirmState, 'message'> = {
  title: 'Confirmar acción',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  confirmVariant: 'primary',
};
