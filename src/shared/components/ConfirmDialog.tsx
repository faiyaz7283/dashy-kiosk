/**
 * ConfirmDialog — modal dialog for confirming destructive actions.
 *
 * Uses HeadlessUI Dialog for accessibility (focus trap, escape to close,
 * screen reader announcements). Supports default and danger variants.
 *
 * Variants:
 * - default: neutral confirmation (archive, restore)
 * - danger: destructive action (permanent delete) with red styling
 */

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { AlertTriangle } from 'lucide-react'

/** Variant controls dialog styling. */
type ConfirmDialogVariant = 'default' | 'danger'

/** Props for the ConfirmDialog component. */
export interface ConfirmDialogProps {
  /** Whether the dialog is open. */
  open: boolean
  /** Dialog title. */
  title: string
  /** Confirmation message body. */
  message: string
  /** Confirm button label. */
  confirmLabel: string
  /** Cancel button label. */
  cancelLabel?: string
  /** Visual variant. */
  variant?: ConfirmDialogVariant
  /** Callback when confirmed. */
  onConfirm: () => void
  /** Callback when cancelled. */
  onCancel: () => void
  /** Whether the confirm action is in progress. */
  isConfirming?: boolean
}

/** Confirm button classes per variant. */
const confirmClasses: Record<ConfirmDialogVariant, string> = {
  default:
    'bg-primary text-white hover:bg-primary-hover',
  danger:
    'bg-danger text-white hover:bg-danger/90',
}

/**
 * Confirmation dialog for destructive actions.
 *
 * @param props - Component props.
 * @returns The confirmation dialog UI.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  isConfirming = false,
}: ConfirmDialogProps) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onCancel}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        {/* Dialog panel */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-popup ring-1 ring-border dark:bg-bg">
                <div className="px-6 py-5">
                  {/* Icon + Title */}
                  <div className="flex items-start gap-3">
                    {variant === 'danger' && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/10">
                        <AlertTriangle className="h-5 w-5 text-danger" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Dialog.Title className="text-base font-semibold text-text-primary">
                        {title}
                      </Dialog.Title>
                      <Dialog.Description className="mt-1.5 text-sm text-text-muted">
                        {message}
                      </Dialog.Description>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-border-light bg-bg-hover/50 px-6 py-4">
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isConfirming}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary disabled:opacity-50"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isConfirming}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${confirmClasses[variant]}`}
                  >
                    {isConfirming ? 'Confirming...' : confirmLabel}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
