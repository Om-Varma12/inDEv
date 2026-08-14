import React from 'react';
import { PromptChip } from '../ui';

interface ExamplePrompt {
  icon: string;
  label: string;
}

interface ExamplePromptsProps {
  prompts?: ExamplePrompt[];
  onPromptClick?: (prompt: string) => void;
  className?: string;
}

const defaultPrompts: ExamplePrompt[] = [
  { icon: 'lightbulb', label: 'Example prompt' },
  { icon: 'code', label: 'Refactor codebase' },
  { icon: 'bug_report', label: 'Fix failing tests' },
];

export const ExamplePrompts: React.FC<ExamplePromptsProps> = ({
  prompts = defaultPrompts,
  onPromptClick,
  className = '',
}) => {
  return (
    <div className={`flex justify-center gap-4 mt-8 opacity-60 ${className}`}>
      {prompts.map((prompt, index) => (
        <PromptChip
          key={index}
          icon={prompt.icon}
          label={prompt.label}
          onClick={() => onPromptClick?.(prompt.label)}
        />
      ))}
    </div>
  );
};
