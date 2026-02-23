import React from 'react';

interface MarkdownLinesProps {
  content: string;
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  while (remaining.length > 0) {
    // Parse inline code first (to avoid conflicts with bold/italic)
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      result.push(
        <code key={keyCounter++} className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Parse bold
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      result.push(<strong key={keyCounter++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Parse italic (single asterisk or underscore)
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      result.push(<em key={keyCounter++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Parse links
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      result.push(
        <a key={keyCounter++} href={linkMatch[2]} className="text-primary underline">
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // No match found, consume one character as plain text
    const nextSpecial = remaining.slice(1).search(/[`*\[]/);
    const plainText = nextSpecial === -1
      ? remaining
      : remaining.slice(0, nextSpecial + 1);

    result.push(plainText);
    remaining = remaining.slice(plainText.length);
  }

  return result;
}

export function MarkdownLines({ content }: MarkdownLinesProps) {
  return (
    <div className="flex flex-col gap-1 text-[13px] leading-relaxed text-foreground/90">
      {content.split('\n').map((line, i) => {
        // Handle numbered lists
        const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
        if (numberedMatch) {
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-muted-foreground">{numberedMatch[1]}.</span>
              <span>{parseInlineMarkdown(numberedMatch[2])}</span>
            </div>
          );
        }

        if (line.startsWith('# '))
          return (
            <h1 key={i} className="text-lg font-semibold text-foreground">
              {parseInlineMarkdown(line.slice(2))}
            </h1>
          );
        if (line.startsWith('## '))
          return (
            <h2 key={i} className="text-base font-semibold text-foreground">
              {parseInlineMarkdown(line.slice(3))}
            </h2>
          );
        if (line.startsWith('### '))
          return (
            <h3 key={i} className="text-sm font-semibold text-foreground">
              {parseInlineMarkdown(line.slice(4))}
            </h3>
          );
        if (line.startsWith('- '))
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-1 text-muted-foreground">•</span>
              <span>{parseInlineMarkdown(line.slice(2))}</span>
            </div>
          );
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i}>{parseInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}
