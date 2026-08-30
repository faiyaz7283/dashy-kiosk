/**
 * SettingsPanel — modal panel for system settings and diagnostics.
 *
 * Displays a settings panel with navigation to various system pages.
 * Currently includes a button to view system metrics.
 *
 * Uses HeadlessUI Dialog for accessibility (focus trap, escape to close).
 */

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Activity } from 'lucide-react'

/** Props for the SettingsPanel component. */
export interface SettingsPanelProps {
  /** Whether the panel is open. */
  open: boolean
  /** Callback when the panel should close. */
  onClose: () => void
  /** Callback when metrics button is clicked. */
  onOpenMetrics: () => void
}

/**
 * Settings panel modal.
 *
 * @param props - Panel configuration and callbacks.
 * @returns The settings panel UI.
 */
export function SettingsPanel({ open, onClose, onOpenMetrics }: SettingsPanelProps) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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

        {/* Panel */}
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
              <Dialog.Panel className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-popup ring-1 ring-border dark:bg-bg">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border-light px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-text-primary">
                    Settings
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
                    aria-label="Close settings"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                  <Dialog.Description className="mb-4 text-sm text-text-muted">
                    System settings and diagnostics
                  </Dialog.Description>

                  {/* Settings options */}
                  <div className="space-y-3">
                    <button
                      onClick={onOpenMetrics}
                      className="flex w-full items-center gap-3 rounded-lg border border-border-light bg-bg-hover/30 px-4 py-3 text-left transition-colors hover:bg-bg-hover"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-text-primary">System Metrics</div>
                        <div className="text-sm text-text-muted">
                          View data freshness, network health, and cache statistics
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border-light bg-bg-hover/50 px-6 py-4">
                  <button
                    onClick={onClose}
                    className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                  >
                    Close
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
