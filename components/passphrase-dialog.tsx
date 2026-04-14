'use client'

import { useState } from 'react'
import { Lock, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PassphraseDialogProps {
  open: boolean
  onUnlock: (passphrase: string) => Promise<boolean>
}

export function PassphraseDialog({ open, onUnlock }: PassphraseDialogProps) {
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passphrase.trim()) return

    setLoading(true)
    setError(false)

    const success = await onUnlock(passphrase)
    if (!success) {
      setError(true)
      setPassphrase('')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-sm [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-2 rounded-full bg-primary/10 p-3 w-fit">
            <Lock className="size-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Unlock Your Data</DialogTitle>
          <DialogDescription>
            Your expenses are encrypted. Enter your passphrase to decrypt them.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter your passphrase"
              value={passphrase}
              onChange={(e) => {
                setPassphrase(e.target.value)
                setError(false)
              }}
              autoComplete="current-password"
              autoFocus
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="size-3" />
                Wrong passphrase. Please try again.
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!passphrase.trim() || loading}
          >
            {loading ? 'Verifying...' : 'Unlock'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
