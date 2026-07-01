'use client';

import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
}

export default function CollapsibleSection({
  label,
  children,
  defaultOpen = false,
  className,
  contentClassName,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 p-0 text-sm font-medium text-violet-600 hover:bg-transparent hover:text-violet-800"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
          {label}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className={contentClassName}>{children}</CollapsibleContent>
    </Collapsible>
  );
}
