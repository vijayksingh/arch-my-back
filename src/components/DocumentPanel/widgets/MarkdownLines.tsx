import React from 'react';

interface MarkdownLinesProps {
  content: string;
}

interface TableBlock {
  type: 'table';
  startLine: number;
  endLine: number;
  headerRow: string[];
  alignments: ('left' | 'center' | 'right')[];
  bodyRows: string[][];
}

interface ContentBlock {
  type: 'line' | 'table';
  startLine: number;
  endLine: number;
  data?: TableBlock;
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

function parseTableRow(line: string): string[] {
  // Remove leading/trailing pipes and split by pipe
  const trimmed = line.trim().replace(/^\||\|$/g, '');
  return trimmed.split('|').map(cell => cell.trim());
}

function parseAlignment(separator: string): 'left' | 'center' | 'right' {
  const trimmed = separator.trim();
  const startsWithColon = trimmed.startsWith(':');
  const endsWithColon = trimmed.endsWith(':');

  if (startsWithColon && endsWithColon) return 'center';
  if (endsWithColon) return 'right';
  return 'left';
}

function identifyBlocks(lines: string[]): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check if this could be the start of a table (has pipes)
    if (line.includes('|') && i + 1 < lines.length) {
      const nextLine = lines[i + 1];

      // Check if next line is a separator (contains dashes and pipes)
      if (nextLine.match(/^\s*\|?[\s:-]+\|[\s|:-]+\|?\s*$/)) {
        // This is a table!
        const headerRow = parseTableRow(line);
        const separatorCells = parseTableRow(nextLine);
        const alignments = separatorCells.map(parseAlignment);
        const bodyRows: string[][] = [];

        let tableEnd = i + 2;
        // Collect body rows (continue while lines have pipes)
        while (tableEnd < lines.length && lines[tableEnd].includes('|')) {
          bodyRows.push(parseTableRow(lines[tableEnd]));
          tableEnd++;
        }

        blocks.push({
          type: 'table',
          startLine: i,
          endLine: tableEnd - 1,
          data: {
            type: 'table',
            startLine: i,
            endLine: tableEnd - 1,
            headerRow,
            alignments,
            bodyRows
          }
        });

        i = tableEnd;
        continue;
      }
    }

    // Not a table, treat as individual line
    blocks.push({
      type: 'line',
      startLine: i,
      endLine: i
    });
    i++;
  }

  return blocks;
}

function renderTable(table: TableBlock, key: number) {
  const alignmentClass = (align: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  return (
    <div key={key} className="my-2 overflow-x-auto">
      <table className="min-w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border">
            {table.headerRow.map((cell, i) => (
              <th
                key={i}
                className={`px-3 py-2 font-semibold text-foreground bg-muted/30 ${alignmentClass(table.alignments[i] || 'left')}`}
              >
                {parseInlineMarkdown(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.bodyRows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={`border-b border-border/50 ${rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className={`px-3 py-2 text-foreground/90 ${alignmentClass(table.alignments[cellIdx] || 'left')}`}
                >
                  {parseInlineMarkdown(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderLine(line: string, i: number) {
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
}

export function MarkdownLines({ content }: MarkdownLinesProps) {
  const lines = content.split('\n');
  const blocks = identifyBlocks(lines);

  return (
    <div className="flex flex-col gap-1 text-[13px] leading-relaxed text-foreground/90">
      {blocks.map((block, blockIdx) => {
        if (block.type === 'table' && block.data) {
          return renderTable(block.data, blockIdx);
        } else {
          // Render individual line
          return renderLine(lines[block.startLine], blockIdx);
        }
      })}
    </div>
  );
}
