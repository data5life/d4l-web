'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type BaseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
};

type ConfirmProps = BaseProps & {
  mode?: 'confirm';
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type AlertProps = BaseProps & {
  mode: 'alert';
  okLabel?: string;
};

export type ConfirmDialogProps = ConfirmProps | AlertProps;

export function ConfirmDialog(props: ConfirmDialogProps) {
  const tCommon = useTranslations('common');

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm">{props.message}</p>
        <DialogFooter>
          {props.mode === 'alert' ? (
            <Button onClick={() => props.onOpenChange(false)}>
              {props.okLabel ?? tCommon('close')}
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
                {props.cancelLabel ?? tCommon('cancel')}
              </Button>
              <Button
                variant={props.destructive ? 'destructive' : 'default'}
                onClick={() => {
                  props.onConfirm();
                  props.onOpenChange(false);
                }}
              >
                {props.confirmLabel ?? tCommon('yes')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
