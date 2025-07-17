/**
 * Client-side toast utility
 * Safely handles toast notifications with SSR compatibility
 * Uses simple native implementation instead of react-hot-toast
 */

import { simpleToast } from '@/components/ui/SimpleToast'

export const clientToast = {
  success: (message: string) => {
    simpleToast.success(message)
  },

  error: (message: string) => {
    simpleToast.error(message)
  },

  loading: (message: string) => {
    return simpleToast.loading(message)
  },

  dismiss: (toastEl?: any) => {
    simpleToast.dismiss(toastEl)
  }
}

export default clientToast
