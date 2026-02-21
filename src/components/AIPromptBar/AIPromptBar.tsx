import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface AIPromptBarProps {
  onGenerate: (prompt: string) => Promise<void>;
  disabled?: boolean;
}

export function AIPromptBar({ onGenerate, disabled = false }: AIPromptBarProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim() || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onGenerate(prompt);
      setPrompt(''); // Clear on success
    } catch (err: any) {
      setError(err.message || 'Failed to generate architecture');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your architecture... (e.g., 'Build an e-commerce platform with React frontend, Node.js API, PostgreSQL database, and Redis cache')"
            className={`min-h-[100px] resize-none pr-24 ${
              error ? 'border-error focus-visible:ring-error' : ''
            }`}
            disabled={disabled || isLoading}
          />
          <Button
            type="submit"
            disabled={disabled || isLoading || !prompt.trim()}
            className="absolute bottom-3 right-3"
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="text-sm text-error">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
