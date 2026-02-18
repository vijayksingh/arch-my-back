interface MarkdownLinesProps {
  content: string;
}

export function MarkdownLines({ content }: MarkdownLinesProps) {
  return (
    <div className="flex flex-col gap-1 text-[13px] leading-relaxed text-foreground/90">
      {content.split('\n').map((line, i) => {
        if (line.startsWith('# '))
          return (
            <h1 key={i} className="text-lg font-semibold text-foreground">
              {line.slice(2)}
            </h1>
          );
        if (line.startsWith('## '))
          return (
            <h2 key={i} className="text-base font-semibold text-foreground">
              {line.slice(3)}
            </h2>
          );
        if (line.startsWith('### '))
          return (
            <h3 key={i} className="text-sm font-semibold text-foreground">
              {line.slice(4)}
            </h3>
          );
        if (line.startsWith('- '))
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-1 text-muted-foreground">•</span>
              <span>{line.slice(2)}</span>
            </div>
          );
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}
