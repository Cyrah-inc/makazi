interface QuickPromptsProps {
  onSelect: (prompt: string) => void;
}

const prompts = [
  'Is this still available?',
  'Can I schedule a viewing?',
  'What\'s the best price?',
  'Any additional fees?',
];

export function QuickPrompts({ onSelect }: QuickPromptsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
