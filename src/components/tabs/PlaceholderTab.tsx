import { Construction } from 'lucide-react';

interface PlaceholderTabProps {
  title: string;
}

export default function PlaceholderTab({ title }: PlaceholderTabProps) {
  return (
    <div className="flex items-center justify-center h-96 animate-fade-in">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-6">
          <Construction className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-muted-foreground max-w-md">
          Esta sección estará disponible en la siguiente fase del desarrollo.
        </p>
      </div>
    </div>
  );
}
