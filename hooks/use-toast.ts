'use client';

import * as React from "react"

import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

type ToastState = {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const listeners = new Set<(state: ToastState) => void>()

let memoryState: ToastState = { toasts: [] }

type ToastAction =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string }

const toastLimit = TOAST_LIMIT

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

function reducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "ADD_TOAST": {
      return {
        ...state,
        toasts: [
          action.toast,
          ...state.toasts.filter((toast) => toast.id !== action.toast.id),
        ].slice(0, toastLimit),
      }
    }

    case "UPDATE_TOAST": {
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.toast.id ? { ...toast, ...action.toast } : toast
        ),
      }
    }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => addToRemoveQueue(toast.id))
      }

      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === toastId || toastId === undefined
            ? { ...toast, open: false }
            : toast
        ),
      }
    }

    case "REMOVE_TOAST": {
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }

      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.toastId),
      }
    }
  }

  return state
}

function dispatch(action: ToastAction) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

function createToastId() {
  return Math.random().toString(36).slice(2, 11)
}

function dismissToast(toastId?: string) {
  dispatch({ type: "DISMISS_TOAST", toastId })
}

function toast(props: Omit<ToasterToast, "id"> & { id?: string }) {
  const id = props.id ?? createToastId()

  const toastWithDefaults: ToasterToast = {
    ...props,
    id,
    open: props.open ?? true,
    onOpenChange: props.onOpenChange ?? ((open) => {
      if (!open) {
        dismissToast(id)
      }
    }),
  }

  dispatch({
    type: "ADD_TOAST",
    toast: toastWithDefaults,
  })

  return {
    id,
    dismiss: () => dismissToast(id),
    update: (props: Partial<ToasterToast>) =>
      dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } }),
  }
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    const listener = (state: ToastState) => {
      setState(state)
    }

    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: dismissToast,
  }
}

export { toast, dismissToast }
export type { ToasterToast }
