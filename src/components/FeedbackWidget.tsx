import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send } from "lucide-react";

export function FeedbackWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Campo vacío",
        description: "Por favor escribe tu feedback antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("feedback" as any).insert({
        user_id: user?.id,
        user_email: user?.email,
        message: feedback.trim(),
        page: window.location.pathname,
      } as any);

      if (error) throw error;

      toast({
        title: "¡Gracias por tu feedback!",
        description: "Tu sugerencia ha sido registrada correctamente.",
      });

      setFeedback("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el feedback. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-[#c8f600] text-[#0d1f2d] px-4 py-3 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 z-50 flex items-center gap-2 font-semibold"
        aria-label="Enviar feedback"
      >
        <MessageCircle className="h-5 w-5" />
        Feedback
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Qué funcionalidad te falta?</DialogTitle>
            <DialogDescription>
              Cuéntanos qué features necesitas, qué bugs encontraste, o cómo
              podemos mejorar ProFit para ti.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Ejemplo: Me gustaría poder comparar dos proyectos lado a lado..."
              rows={6}
              className="resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Tu feedback nos ayuda a priorizar las features más importantes.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !feedback.trim()}
            >
              {isSubmitting ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Feedback
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
