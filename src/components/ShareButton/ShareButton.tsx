import { useState, useCallback } from 'react';
import { Share2, Check, Copy, Globe, Lock } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

interface ShareButtonProps {
  designId: Id<'newDesigns'>;
}

export function ShareButton({ designId }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch current design
  const design = useQuery(api.newDesigns.get, { designId });

  // Mutations
  const makePublic = useMutation(api.sharing.makeDesignPublic);
  const makePrivate = useMutation(api.sharing.makeDesignPrivate);

  const isPublic = design?.isPublic ?? false;
  const shareSlug = design?.shareSlug;

  const handleTogglePublic = useCallback(async () => {
    try {
      if (isPublic) {
        await makePrivate({ designId });
      } else {
        await makePublic({ designId });
      }
    } catch (error) {
      console.error('Failed to toggle public status:', error);
      alert('Failed to update sharing settings. Please try again.');
    }
  }, [isPublic, designId, makePublic, makePrivate]);

  const handleCopyLink = useCallback(() => {
    if (!shareSlug) return;

    const shareUrl = `${window.location.origin}/share/${shareSlug}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareSlug]);

  // Don't render if design is not loaded
  if (!design) {
    return null;
  }

  const shareUrl = shareSlug ? `${window.location.origin}/share/${shareSlug}` : '';

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        title="Share"
        aria-label="Share design"
        className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
      >
        <Share2 className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Design</DialogTitle>
            <DialogDescription>
              Share this design with anyone by making it public.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* Public/Private Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="h-5 w-5 text-green-600" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {isPublic ? 'Public' : 'Private'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPublic
                      ? 'Anyone with the link can view'
                      : 'Only you can access this design'}
                  </p>
                </div>
              </div>
              <Button
                variant={isPublic ? 'outline' : 'default'}
                size="sm"
                onClick={handleTogglePublic}
              >
                {isPublic ? 'Make Private' : 'Make Public'}
              </Button>
            </div>

            {/* Share Link (only shown when public) */}
            {isPublic && shareUrl && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Share Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-1 h-3.5 w-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Anyone with this link can view your design in read-only mode.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
