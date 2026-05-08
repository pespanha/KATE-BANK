import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import AppLayout from "@/react-app/components/AppLayout";
import { fetchWithRetry } from "@/react-app/hooks/useApi";
import { 
  Bell, 
  CheckCheck, 
  Loader2, 
  ChevronLeft,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle
} from "lucide-react";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: number;
  created_at: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  investment_approved: <CheckCircle className="w-5 h-5 text-green-500" />,
  investment_rejected: <XCircle className="w-5 h-5 text-red-500" />,
  payment_confirmed: <CheckCircle className="w-5 h-5 text-green-500" />,
  project_approved: <CheckCircle className="w-5 h-5 text-green-500" />,
  project_rejected: <XCircle className="w-5 h-5 text-red-500" />,
  token_distributed: <CheckCircle className="w-5 h-5 text-gold" />,
  refund_processed: <Info className="w-5 h-5 text-blue-500" />,
  default: <AlertCircle className="w-5 h-5 text-gray-400" />
};

export default function AppNotificacoes() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchNotifications();
  }, [offset]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetchWithRetry(`/api/user/notifications?limit=${limit}&offset=${offset}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await fetchWithRetry(`/api/user/notifications/${notificationId}/read`, {
        method: "PUT"
      });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
      );
    } catch (e) {
      console.error("Error marking notification as read:", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetchWithRetry("/api/user/notifications/read-all", {
        method: "PUT"
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (e) {
      console.error("Error marking all notifications as read:", e);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.is_read === 0) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Ontem";
    } else if (days < 7) {
      return `${days} dias atrás`;
    } else {
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
    }
  };

  const unreadCount = notifications.filter(n => n.is_read === 0).length;
  const hasMore = offset + limit < total;
  const hasPrev = offset > 0;

  return (
    <AppLayout 
      title="Notificações" 
      subtitle={`${total} notificação${total !== 1 ? "ões" : ""}`}
    >
      <div className="max-w-3xl">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/app"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-navy-deep transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gold hover:text-gold-hover transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas como lidas
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl shadow-sm border border-kate-border overflow-hidden">
          {loading && notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Carregando notificações...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-navy-deep mb-2">Nenhuma notificação</h3>
              <p className="text-gray-500">Você não tem notificações no momento.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors flex gap-4 ${
                      notification.is_read === 0 ? "bg-gold/5" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {TYPE_ICONS[notification.type] || TYPE_ICONS.default}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={`text-sm ${notification.is_read === 0 ? "font-semibold text-navy-deep" : "text-gray-700"}`}>
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="text-sm text-gray-500 mt-1">
                              {notification.message}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                      
                      {notification.link && (
                        <span className="inline-flex items-center gap-1 text-xs text-gold mt-2">
                          Ver detalhes
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    
                    {/* Unread indicator */}
                    {notification.is_read === 0 && (
                      <span className="w-2 h-2 bg-gold rounded-full flex-shrink-0 mt-2" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          {/* Pagination */}
          {total > limit && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <p className="text-sm text-gray-500">
                Mostrando {offset + 1}-{Math.min(offset + limit, total)} de {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={!hasPrev}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-kate-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={!hasMore}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-kate-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
