import { X, CheckCircle } from "lucide-react";
import { useEffect } from "react";

interface ProjectSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectSuccessModal({ isOpen, onClose }: ProjectSuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-navy-deep mb-3">
          🎉 Seu projeto foi enviado!
        </h2>
        
        <p className="text-gray-600 mb-6">
          Recebemos sua submissão e nossa equipe irá analisá-la em breve. 
          Você pode acompanhar o status aqui no dashboard.
        </p>

        {/* Action */}
        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-bold rounded-xl transition-colors"
        >
          Entendi
        </button>

        <p className="text-xs text-gray-500 mt-4">
          Entraremos em contato por email em até 48 horas
        </p>
      </div>
    </div>
  );
}
