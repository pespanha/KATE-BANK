import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Loader2,
  Building2,
  Plus,
  ChevronRight,
  User,
  Sparkles,
  Inbox
} from "lucide-react";

interface Conversation {
  project_id: number;
  project_name: string;
  project_status: string;
  unread_count: number;
  last_message: string | null;
  last_message_at: string | null;
  last_sender_type: "user" | "admin" | null;
}

interface Message {
  id: number;
  project_id: number;
  sender_type: "user" | "admin";
  sender_id: string;
  sender_name: string;
  content: string;
  is_read: number;
  created_at: string;
}

interface Project {
  project_id: number;
  project_name: string;
  project_status: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-gray-100 text-gray-600" },
  pending_review: { label: "Em Análise", color: "bg-amber-100 text-amber-700" },
  approved: { label: "Aprovado", color: "bg-green-100 text-green-700" },
  offer_created: { label: "Oferta Criada", color: "bg-purple-100 text-purple-700" },
  live: { label: "Em Captação", color: "bg-gold/20 text-gold-hover" },
  rejected: { label: "Recusado", color: "bg-red-100 text-red-600" }
};

export default function AppMensagens() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [projectsWithoutMessages, setProjectsWithoutMessages] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [projectInfo, setProjectInfo] = useState<{ id: number; project_name: string; status: string } | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchMessages(selectedProject);
    }
  }, [selectedProject]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/user/conversations", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        setProjectsWithoutMessages(data.projects_without_messages || []);
      }
    } catch (e) {
      console.error("Error fetching conversations:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (projectId: number) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/user/messages/${projectId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setProjectInfo(data.project);
        // Update unread count in conversations
        setConversations(prev => 
          prev.map(c => c.project_id === projectId ? { ...c, unread_count: 0 } : c)
        );
      }
    } catch (e) {
      console.error("Error fetching messages:", e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedProject || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/user/messages/${selectedProject}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: newMessage })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage("");
        
        // Update conversation list
        setConversations(prev => {
          const existing = prev.find(c => c.project_id === selectedProject);
          if (existing) {
            return prev.map(c => 
              c.project_id === selectedProject 
                ? { ...c, last_message: newMessage, last_message_at: new Date().toISOString(), last_sender_type: "user" as const }
                : c
            ).sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime());
          } else {
            // New conversation
            const project = projectsWithoutMessages.find(p => p.project_id === selectedProject);
            if (project) {
              setProjectsWithoutMessages(prev => prev.filter(p => p.project_id !== selectedProject));
              return [{
                project_id: selectedProject,
                project_name: project.project_name,
                project_status: project.project_status,
                unread_count: 0,
                last_message: newMessage,
                last_message_at: new Date().toISOString(),
                last_sender_type: "user" as const
              }, ...prev];
            }
          }
          return prev;
        });
        setShowNewConversation(false);
      }
    } catch (e) {
      console.error("Error sending message:", e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewConversation = (project: Project) => {
    setSelectedProject(project.project_id);
    setProjectInfo({
      id: project.project_id,
      project_name: project.project_name,
      status: project.project_status
    });
    setMessages([]);
    setShowNewConversation(false);
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
    if (isYesterday) {
      return "Ontem " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) + " " +
           date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  const hasNoProjects = conversations.length === 0 && projectsWithoutMessages.length === 0;

  return (
    <div className="h-[calc(100vh-180px)] min-h-[500px] flex rounded-2xl border border-kate-border bg-white overflow-hidden">
      {/* Sidebar - Conversations List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-kate-border flex flex-col ${selectedProject ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-kate-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-navy-deep">Mensagens</h2>
            {totalUnread > 0 && (
              <p className="text-sm text-gray-500">{totalUnread} não lida{totalUnread > 1 ? "s" : ""}</p>
            )}
          </div>
          {projectsWithoutMessages.length > 0 && (
            <button
              onClick={() => setShowNewConversation(true)}
              className="p-2 hover:bg-kate-bg rounded-lg transition-colors"
              title="Nova conversa"
            >
              <Plus className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* New Conversation Modal */}
        {showNewConversation && (
          <div className="p-4 border-b border-kate-border bg-kate-bg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-navy-deep">Iniciar conversa</p>
              <button 
                onClick={() => setShowNewConversation(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {projectsWithoutMessages.map(project => (
                <button
                  key={project.project_id}
                  onClick={() => startNewConversation(project)}
                  className="w-full flex items-center gap-3 p-3 bg-white rounded-xl hover:border-gold/50 border border-transparent transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-navy/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-navy-deep truncate">{project.project_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_LABELS[project.project_status]?.color || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[project.project_status]?.label || project.project_status}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {hasNoProjects ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">Você ainda não tem projetos</p>
              <a 
                href="/app/projetos/novo" 
                className="text-gold-hover hover:underline mt-2 text-sm"
              >
                Submeter um projeto
              </a>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Inbox className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhuma conversa ainda</p>
              {projectsWithoutMessages.length > 0 && (
                <button
                  onClick={() => setShowNewConversation(true)}
                  className="text-gold-hover hover:underline mt-2 text-sm"
                >
                  Iniciar uma conversa
                </button>
              )}
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.project_id}
                onClick={() => setSelectedProject(conv.project_id)}
                className={`w-full flex items-start gap-3 p-4 border-b border-kate-border hover:bg-kate-bg transition-colors text-left ${
                  selectedProject === conv.project_id ? "bg-kate-bg" : ""
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-navy/10 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-navy" />
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-navy-deep">{conv.unread_count}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-medium truncate ${conv.unread_count > 0 ? "text-navy-deep" : "text-gray-700"}`}>
                      {conv.project_name}
                    </p>
                    {conv.last_message_at && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatTimeAgo(conv.last_message_at)}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className={`text-sm truncate ${conv.unread_count > 0 ? "text-gray-700 font-medium" : "text-gray-500"}`}>
                      {conv.last_sender_type === "user" ? "Você: " : "Kate: "}
                      {conv.last_message}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedProject ? 'hidden md:flex' : 'flex'}`}>
        {selectedProject && projectInfo ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-kate-border flex items-center gap-4">
              <button
                onClick={() => setSelectedProject(null)}
                className="md:hidden p-2 -ml-2 hover:bg-kate-bg rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div className="w-10 h-10 bg-navy/10 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-navy" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-navy-deep truncate">{projectInfo.project_name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_LABELS[projectInfo.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[projectInfo.status]?.label || projectInfo.status}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">Equipe Kate</span>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 text-gold animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-gold" />
                  </div>
                  <h4 className="font-semibold text-navy-deep mb-2">Comece uma conversa</h4>
                  <p className="text-gray-500 text-sm max-w-sm">
                    Envie uma mensagem para a equipe Kate. 
                    Responderemos o mais breve possível.
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => {
                    const isUser = msg.sender_type === "user";
                    const showTimestamp = index === 0 || 
                      new Date(msg.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000; // 5 min

                    return (
                      <div key={msg.id}>
                        {showTimestamp && (
                          <div className="flex justify-center my-4">
                            <span className="text-xs text-gray-400 bg-kate-bg px-3 py-1 rounded-full">
                              {formatMessageTime(msg.created_at)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                          <div className={`flex items-end gap-2 max-w-[80%] ${isUser ? "flex-row-reverse" : ""}`}>
                            {!isUser && (
                              <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-sm font-bold">K</span>
                              </div>
                            )}
                            <div className={`px-4 py-3 rounded-2xl ${
                              isUser 
                                ? "bg-gold text-navy-deep rounded-br-md" 
                                : "bg-kate-bg text-gray-700 rounded-bl-md"
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            {isUser && (
                              <div className="w-8 h-8 bg-navy/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-navy" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-kate-border">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    rows={1}
                    className="w-full px-4 py-3 bg-kate-bg rounded-xl border-0 focus:ring-2 focus:ring-gold/30 resize-none text-navy-deep placeholder-gray-400 max-h-32"
                    style={{ minHeight: "48px" }}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className="p-3 bg-gold hover:bg-gold-hover text-navy-deep rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Pressione Enter para enviar • Shift+Enter para nova linha
              </p>
            </div>
          </>
        ) : (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-kate-bg rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-navy-deep mb-2">Suas conversas</h3>
            <p className="text-gray-500 max-w-md">
              Selecione uma conversa para ver as mensagens ou inicie uma nova conversa 
              com a equipe Kate sobre seus projetos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
