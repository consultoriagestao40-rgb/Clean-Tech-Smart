import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  MessageSquare, 
  Calendar, 
  DollarSign, 
  User, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  LogOut,
  Lock,
  ClipboardList,
  ArrowRightLeft,
  X,
  Check,
  Edit,
  Trash2,
  Scale,
  Smartphone,
  Tag,
  Target,
  ChevronRight,
  Clock,
  Send,
  Paperclip,
  Smile,
  CheckCheck,
  Mic,
  MicOff,
  FileText,
  ImageIcon,
  Volume2,
  Square,
  Bell,
  CheckSquare
} from 'lucide-react';

const DEFAULT_STAGES = [
  { key: 'qualificado', title: 'Qualificado', color: '#10B981' },
  { key: 'contatado', title: 'Contatado', color: '#3B82F6' },
  { key: 'demo_agendada', title: 'Demo agendada', color: '#8B5CF6' },
  { key: 'proposta_feita', title: 'Proposta feita', color: '#F59E0B' },
  { key: 'negociacoes', title: 'Negociações iniciadas', color: '#06B6D4' }
];

const STAGE_COLORS = [
  { name: 'Cinza', value: '#4B5563' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Esmeralda', value: '#10B981' },
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Amarelo', value: '#F59E0B' },
  { name: 'Laranja', value: '#F97316' },
  { name: 'Rosa/Vermelho', value: '#EF4444' },
  { name: 'Ciano', value: '#06B6D4' }
];

// Helper to calculate soft pastel background tint for columns based on stage hex color
function getStageBgTint(hex) {
  if (!hex || !hex.startsWith('#')) return 'rgba(241, 245, 249, 0.5)';
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, 0.08)`;
}

// Migrate old Tailwind color strings to hex
function migrateColor(color) {
  if (!color || color.startsWith('#')) return color;
  if (color.includes('blue')) return '#3B82F6';
  if (color.includes('teal')) return '#14B8A6';
  if (color.includes('emerald')) return '#10B981';
  if (color.includes('indigo')) return '#6366F1';
  if (color.includes('purple')) return '#8B5CF6';
  if (color.includes('amber')) return '#F59E0B';
  if (color.includes('yellow')) return '#F59E0B';
  if (color.includes('orange')) return '#F97316';
  if (color.includes('rose')) return '#EF4444';
  if (color.includes('red')) return '#EF4444';
  if (color.includes('cyan')) return '#06B6D4';
  if (color.includes('green')) return '#10B981';
  return '#4B5563';
}

export default function Crm() {
  const [funnelStages, setFunnelStages] = useState(() => {
    const saved = localStorage.getItem('crm_stages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(s => ({ ...s, color: migrateColor(s.color) }));
        }
      } catch (e) {}
    }
    return DEFAULT_STAGES;
  });

  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageTitle, setNewStageTitle] = useState('');
  const [draggedColumnIndex, setDraggedColumnIndex] = useState(null);
  
  // Custom Stage Editing States
  const [isEditingStage, setIsEditingStage] = useState(false);
  const [editingStageKey, setEditingStageKey] = useState('');
  const [editingStageTitle, setEditingStageTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [insertAfterIndex, setInsertAfterIndex] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Leads and Sellers
  const [leads, setLeads] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Modal edit states for cards (WaSeller layout)
  const [activeNoteLead, setActiveNoteLead] = useState(null);
  const [quickNoteContent, setQuickNoteContent] = useState('');
  
  const [activeReminderLead, setActiveReminderLead] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskMessage, setTaskMessage] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [isSavingQuick, setIsSavingQuick] = useState(false);
  const [sendViaWhatsapp, setSendViaWhatsapp] = useState(true);

  // Move Lead stage state
  const [activeMoveLead, setActiveMoveLead] = useState(null);

  // WhatsApp Chat Modal (Smartbid Style)
  const [activeWhatsAppChatLead, setActiveWhatsAppChatLead] = useState(null);
  const [activeChatTab, setActiveChatTab] = useState('chat');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const chatMessagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const userHasScrolledUpRef = useRef(false);

  const handleChatScroll = (e) => {
    const el = e.target;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    userHasScrolledUpRef.current = !isAtBottom;
  };

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
        const file = new File([blob], `audio_${Date.now()}.ogg`, { type: 'audio/ogg' });
        setSelectedFile(file);
        setIsRecording(false);
        setRecordingTime(0);
        clearInterval(recordingTimerRef.current);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      alert('Permissão de microfone negada.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    clearInterval(recordingTimerRef.current);
  };

  useEffect(() => {
    if (activeChatTab === 'chat' && chatMessagesEndRef.current && !userHasScrolledUpRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeChatTab]);
  const [leadTags, setLeadTags] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('crm_lead_tags') || '{}');
    } catch (e) {
      return {};
    }
  });

  // Custom Tags Catalog States
  const [availableTags, setAvailableTags] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_available_tags');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['VIP', 'Cliente Quente', 'Aguardando Orçamento', 'Proposta Enviada', 'Contrato Fechado', 'Interesse Equipamento'];
  });
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const handleAddNewTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (availableTags.includes(trimmed)) {
      alert('Esta etiqueta já existe no catálogo!');
      return;
    }
    const updated = [...availableTags, trimmed];
    setAvailableTags(updated);
    localStorage.setItem('crm_available_tags', JSON.stringify(updated));
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const handleDeleteTagFromCatalog = (tagToDelete) => {
    if (confirm(`Deseja excluir a etiqueta "${tagToDelete}" do catálogo?`)) {
      const updated = availableTags.filter(t => t !== tagToDelete);
      setAvailableTags(updated);
      localStorage.setItem('crm_available_tags', JSON.stringify(updated));
    }
  };

  // Cadastro Edit Form States inside Modal
  const [editLeadName, setEditLeadName] = useState('');
  const [editLeadCompany, setEditLeadCompany] = useState('');
  const [editLeadContactName, setEditLeadContactName] = useState('');
  const [editLeadPhone, setEditLeadPhone] = useState('');
  const [editLeadValue, setEditLeadValue] = useState('');
  const [editLeadStage, setEditLeadStage] = useState('');
  const [editLeadSeller, setEditLeadSeller] = useState('');

  const getAvatarInitials = (name, phone) => {
    if (name && !name.toLowerCase().includes('lead manual')) {
      const cleanName = name.replace('[Amostra]', '').trim();
      const parts = cleanName.split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      } else if (parts[0].length >= 2) {
        return parts[0].substring(0, 2).toUpperCase();
      }
    }
    return 'W+';
  };

  // Tasks / Lembretes states
  const [leadTasks, setLeadTasks] = useState([]);
  const [allCrmTasks, setAllCrmTasks] = useState([]);
  const [isCreatingReminder, setIsCreatingReminder] = useState(false);
  const [isRemindersSummaryOpen, setIsRemindersSummaryOpen] = useState(false);
  const [remindersFilter, setRemindersFilter] = useState('hoje'); // 'hoje' | 'atrasados' | 'todos'

  const fetchLeadTasks = async (phone) => {
    if (!phone) return;
    try {
      const res = await fetch(`/api/crm/tasks?phone=${encodeURIComponent(phone)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeadTasks(data.tasks || []);
      }
    } catch (e) {
      console.error('Erro ao buscar tarefas do lead:', e);
    }
  };

  const fetchAllCrmTasks = async () => {
    try {
      const res = await fetch('/api/crm/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllCrmTasks(data.tasks || []);
      }
    } catch (e) {
      console.error('Erro ao buscar tarefas do CRM:', e);
    }
  };

  useEffect(() => {
    fetchAllCrmTasks();
  }, []);

  const handleToggleTaskComplete = async (taskId, currentCompleted, phone) => {
    try {
      const res = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: taskId, completed: !currentCompleted })
      });
      if (res.ok) {
        if (phone) fetchLeadTasks(phone);
        fetchAllCrmTasks();
      }
    } catch (e) {
      console.error('Erro ao alternar status da tarefa:', e);
    }
  };

  const handleDeleteTask = async (taskId, phone) => {
    try {
      const res = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: taskId, action: 'delete' })
      });
      if (res.ok) {
        if (phone) fetchLeadTasks(phone);
        fetchAllCrmTasks();
      }
    } catch (e) {
      console.error('Erro ao excluir tarefa:', e);
    }
  };

  const formatTaskDateTime = (due_date) => {
    if (!due_date) return 'Sem data agendada';
    const parts = due_date.split('T');
    if (parts.length < 2) return due_date;
    const d = parts[0].split('-');
    const t = parts[1].split(':');
    if (d.length < 3 || t.length < 2) return due_date;
    return `${d[2]}/${d[1]}/${d[0]} às ${t[0]}:${t[1]}`;
  };

  const getTaskStatusInfo = (due_date, completed) => {
    if (completed) return { label: 'Concluído', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (!due_date) return { label: 'Futuro', bg: 'bg-gray-100 text-gray-600 border-gray-200' };
    const todayStr = new Date().toISOString().split('T')[0];
    const taskDateStr = due_date.split('T')[0];
    if (taskDateStr < todayStr) return { label: 'Atrasado', bg: 'bg-red-50 text-red-700 border-red-200' };
    if (taskDateStr === todayStr) return { label: 'Hoje', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Futuro', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
  };

  const openWhatsAppChatModal = (lead) => {
    userHasScrolledUpRef.current = false;
    setActiveWhatsAppChatLead(lead);
    setActiveChatTab('chat');
    setIsCreatingReminder(false);
    setEditLeadName(lead.name || '');
    setEditLeadCompany(lead.company || lead.name || '');
    setEditLeadContactName(lead.contact_name || '');
    setEditLeadPhone(lead.phone || '');
    setEditLeadValue(lead.value || '0');
    setEditLeadStage(lead.stage || 'inbox');
    setEditLeadSeller(lead.assigned_to || '');

    fetchChatNotes(lead.phone);
    fetchLeadTasks(lead.phone);
  };

  const [isSyncingWhatsApp, setIsSyncingWhatsApp] = useState(false);

  const fetchChatNotes = async (phone) => {
    try {
      const res = await fetch(`/api/crm/zapi-chats?phone=${encodeURIComponent(phone)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
      } else {
        const fallbackRes = await fetch(`/api/crm/notes?lead_phone=${encodeURIComponent(phone)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setChatMessages(fallbackData.notes || []);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar histórico de conversa real:', err);
    }
  };

  useEffect(() => {
    if (!activeWhatsAppChatLead) return;
    const interval = setInterval(() => {
      fetchChatNotes(activeWhatsAppChatLead.phone);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeWhatsAppChatLead]);

  const handleSyncWhatsAppChats = async () => {
    setIsSyncingWhatsApp(true);
    try {
      const res = await fetch('/api/crm/zapi-chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        fetchLeads();
        alert(`Sincronização concluída! ${data.synced || 0} conversas reais do WhatsApp sincronizadas.`);
      } else {
        alert('Erro ao sincronizar conversas com a Z-API.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao sincronizar com a Z-API.');
    } finally {
      setIsSyncingWhatsApp(false);
    }
  };

  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!chatInputText.trim() && !selectedFile) || !activeWhatsAppChatLead) return;

    const textToSend = chatInputText.trim();
    setIsSendingChatMessage(true);
    userHasScrolledUpRef.current = false;

    try {
      const zapiInstance = localStorage.getItem('app_zapi_instance_id') || '3F718C3D9582E1963A49EAE0B2B942D4';
      const zapiToken = localStorage.getItem('app_zapi_token') || 'D4F38DEC6BD1906C37E044B4';
      const zapiClientToken = localStorage.getItem('app_zapi_client_token') || 'F5c1b8f27f6b049c98c4e779d00f67552S';

      const zapiHeaders = { 'Content-Type': 'application/json' };
      if (zapiClientToken && zapiClientToken.trim()) zapiHeaders['Client-Token'] = zapiClientToken.trim();

      let cleanPhoneDigits = activeWhatsAppChatLead.phone.replace(/\D/g, '');
      if (cleanPhoneDigits.length === 11 && !cleanPhoneDigits.startsWith('55')) {
        cleanPhoneDigits = '55' + cleanPhoneDigits;
      } else if (cleanPhoneDigits.length === 10 && !cleanPhoneDigits.startsWith('55')) {
        cleanPhoneDigits = '55' + cleanPhoneDigits;
      }

      const resolvedUserId = currentUser?.id || currentUser?.userId || 3;
      const resolvedUserName = currentUser?.name || 'Vendedor';

      // --- Send File (if selected) ---
      if (selectedFile) {
        try {
          const b64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });

          const mimeType = selectedFile.type || 'application/octet-stream';
          const isImage = mimeType.startsWith('image/');
          const isAudio = mimeType.startsWith('audio/');
          const isPDF = mimeType === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
          const isWord = mimeType.includes('word') || /\.(doc|docx)$/i.test(selectedFile.name);
          const isExcel = mimeType.includes('excel') || mimeType.includes('spreadsheet') || /\.(xls|xlsx)$/i.test(selectedFile.name);
          const isPPT = mimeType.includes('powerpoint') || mimeType.includes('presentation') || /\.(ppt|pptx)$/i.test(selectedFile.name);
          const isTxt = mimeType === 'text/plain' || selectedFile.name.toLowerCase().endsWith('.txt');

          // Z-API uses specific endpoints per document type to preserve correct extension
          let sendEndpoint;
          let sendBody;

          if (isImage) {
            sendEndpoint = 'send-image';
            sendBody = { phone: cleanPhoneDigits, image: `data:${mimeType};base64,${b64}`, caption: textToSend || '' };
          } else if (isAudio) {
            sendEndpoint = 'send-audio';
            sendBody = { phone: cleanPhoneDigits, audio: `data:${mimeType};base64,${b64}` };
          } else if (isPDF) {
            sendEndpoint = 'send-document/pdf';
            sendBody = { phone: cleanPhoneDigits, document: `data:${mimeType};base64,${b64}`, fileName: selectedFile.name, caption: textToSend || '' };
          } else if (isWord) {
            sendEndpoint = 'send-document/word';
            sendBody = { phone: cleanPhoneDigits, document: `data:${mimeType};base64,${b64}`, fileName: selectedFile.name, caption: textToSend || '' };
          } else if (isExcel) {
            sendEndpoint = 'send-document/excel';
            sendBody = { phone: cleanPhoneDigits, document: `data:${mimeType};base64,${b64}`, fileName: selectedFile.name, caption: textToSend || '' };
          } else if (isPPT) {
            sendEndpoint = 'send-document/powerpoint';
            sendBody = { phone: cleanPhoneDigits, document: `data:${mimeType};base64,${b64}`, fileName: selectedFile.name, caption: textToSend || '' };
          } else if (isTxt) {
            sendEndpoint = 'send-document/txt';
            sendBody = { phone: cleanPhoneDigits, document: `data:${mimeType};base64,${b64}`, fileName: selectedFile.name, caption: textToSend || '' };
          } else {
            sendEndpoint = 'send-document/document';
            sendBody = { phone: cleanPhoneDigits, document: `data:${mimeType};base64,${b64}`, fileName: selectedFile.name, caption: textToSend || '' };
          }

          const sendResp = await fetch(`https://api.z-api.io/instances/${zapiInstance}/token/${zapiToken}/${sendEndpoint}`, {
            method: 'POST',
            headers: zapiHeaders,
            body: JSON.stringify(sendBody)
          });

          if (!sendResp.ok) {
            const errText = await sendResp.text();
            console.error('[Z-API File Send Error]', sendResp.status, errText);
          }

          const fileLabel = isImage ? '[Imagem]' : isAudio ? '[Áudio]' : `[Arquivo: ${selectedFile.name}]`;
          const fileNoteContent = `[WhatsApp] ${fileLabel}${textToSend ? ' ' + textToSend : ''}`;

          await fetch('/api/crm/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              lead_phone: activeWhatsAppChatLead.phone,
              content: fileNoteContent,
              user_id: resolvedUserId,
              user_name: resolvedUserName
            })
          });

          setChatMessages(prev => [...prev, {
            id: `local_file_${Date.now()}`,
            content: fileNoteContent.replace('[WhatsApp]', '').trim(),
            is_sent: true,
            author_name: resolvedUserName,
            is_file: !isAudio,
            is_audio: isAudio,
            file_name: selectedFile.name,
            created_at: new Date().toISOString()
          }]);

          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setChatInputText('');
        } catch (fileErr) {
          console.error('[Send File Error]:', fileErr);
          alert('Erro ao enviar arquivo. Verifique a conexão com a Z-API.');
        }
        setIsSendingChatMessage(false);
        return;
      }

      // --- Send Text ---
      try {
        await fetch(`https://api.z-api.io/instances/${zapiInstance}/token/${zapiToken}/send-text`, {
          method: 'POST',
          headers: zapiHeaders,
          body: JSON.stringify({ phone: cleanPhoneDigits, message: textToSend })
        });
      } catch (zapiErr) {
        console.warn('[Z-API Send Error]:', zapiErr);
      }

      const resNote = await fetch('/api/crm/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          lead_phone: activeWhatsAppChatLead.phone,
          content: `[WhatsApp] ${textToSend}`,
          user_id: resolvedUserId,
          user_name: resolvedUserName
        })
      });

      const savedNote = resNote.ok ? (await resNote.json()).note || {} : {};
      setChatMessages(prev => [...prev, {
        ...savedNote,
        id: savedNote.id ? `db_${savedNote.id}` : `local_${Date.now()}`,
        content: (savedNote.content || textToSend).replace('[WhatsApp]', '').trim(),
        is_sent: true,
        author_name: resolvedUserName,
        created_at: savedNote.created_at || new Date().toISOString()
      }]);

      setChatInputText('');
    } catch (err) {
      console.error('Erro ao enviar mensagem no chat:', err);
    } finally {
      setIsSendingChatMessage(false);
    }
  };

  const toggleLeadTag = async (phone, tag) => {
    const current = leadTags[phone] || [];
    const updated = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
    
    const newObj = { ...leadTags, [phone]: updated };
    setLeadTags(newObj);
    localStorage.setItem('crm_lead_tags', JSON.stringify(newObj));

    try {
      await fetch('/api/crm/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: phone,
          label: updated.join(', ')
        })
      });
      fetchLeads();
    } catch (e) {
      console.error('Erro ao salvar etiqueta no banco:', e);
    }
  };

  const handleSaveLeadCadastro = async () => {
    if (!activeWhatsAppChatLead) return;
    try {
      const res = await fetch('/api/crm/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: activeWhatsAppChatLead.phone,
          company: editLeadCompany,
          contact_name: editLeadContactName,
          value: parseFloat(editLeadValue) || 0,
          stage: editLeadStage,
          assigned_to: editLeadSeller || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.lead) {
          setActiveWhatsAppChatLead(data.lead);
        }
        fetchLeads();
        alert('Cadastro do lead atualizado com sucesso!');
      } else {
        alert('Erro ao atualizar cadastro.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao conectar com o servidor.');
    }
  };

  // Scroll sync refs for sticky header
  const headerScrollRef = useRef(null);
  const bodyScrollRef = useRef(null);

  const handleHeaderScroll = (e) => {
    if (bodyScrollRef.current && Math.abs(bodyScrollRef.current.scrollLeft - e.target.scrollLeft) > 1) {
      bodyScrollRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const handleBodyScroll = (e) => {
    if (headerScrollRef.current && Math.abs(headerScrollRef.current.scrollLeft - e.target.scrollLeft) > 1) {
      headerScrollRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  // Metrics state
  const [stats, setStats] = useState({
    totalCount: 0,
    activeValue: 0,
    closedValue: 0,
    conversionRate: 0
  });

  useEffect(() => {
    if (token) {
      fetchLeads();
      if (currentUser?.role === 'gestor') {
        fetchSellers();
      }
    }
  }, [token, selectedSeller]);

  useEffect(() => {
    // Recalculate metrics
    const totalCount = leads.length;
    let activeValue = 0;
    let closedValue = 0;
    let closedCount = 0;

    leads.forEach(lead => {
      const val = parseFloat(lead.value) || 0;
      const st = (lead.stage || '').toLowerCase();
      if (st === 'faturado' || st === 'a_faturar' || st === 'proposta' || st === 'proposta_feita') {
        closedValue += val;
        closedCount += 1;
      } else {
        activeValue += val;
      }
    });

    const conversionRate = totalCount > 0 ? Math.round((closedCount / totalCount) * 100) : 0;

    setStats({
      totalCount,
      activeValue,
      closedValue,
      conversionRate
    });
  }, [leads]);

  const handleOpenAddStageAfter = (index) => {
    setInsertAfterIndex(index);
    setSelectedColor('#3B82F6');
    setIsAddingStage(true);
  };

  const handleCreateStage = () => {
    if (!newStageTitle.trim()) return;
    const key = newStageTitle.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
    const exists = funnelStages.some(st => st.key === key);
    if (exists) {
      alert('Esta etapa já existe.');
      return;
    }
    const newStage = {
      key,
      title: newStageTitle.trim(),
      color: selectedColor || '#3B82F6'
    };
    
    const updated = [...funnelStages];
    if (insertAfterIndex !== null && insertAfterIndex !== undefined) {
      updated.splice(insertAfterIndex + 1, 0, newStage);
    } else {
      updated.push(newStage);
    }

    setFunnelStages(updated);
    localStorage.setItem('crm_stages', JSON.stringify(updated));
    setIsAddingStage(false);
    setNewStageTitle('');
    setSelectedColor('#3B82F6');
    setInsertAfterIndex(null);
  };

  const handleOpenEditStage = (stage) => {
    setEditingStageKey(stage.key);
    setEditingStageTitle(stage.title);
    setSelectedColor(migrateColor(stage.color) || '#3B82F6');
    setIsEditingStage(true);
  };

  const handleSaveEditStage = () => {
    if (!editingStageTitle.trim()) {
      alert('O nome da etapa não pode ser vazio.');
      return;
    }
    const updated = funnelStages.map(st => 
      st.key === editingStageKey 
        ? { ...st, title: editingStageTitle.trim(), color: selectedColor } 
        : st
    );
    setFunnelStages(updated);
    localStorage.setItem('crm_stages', JSON.stringify(updated));
    setIsEditingStage(false);
    setEditingStageKey('');
    setEditingStageTitle('');
    setSelectedColor('#3B82F6');
  };

  const handleDeleteStage = (stageKey) => {
    const stage = funnelStages.find(st => st.key === stageKey);
    if (!stage) return;
    const stageLeads = getLeadsInStage(stageKey);
    if (stageLeads.length > 0) {
      if (!confirm(`Esta etapa contém ${stageLeads.length} leads. Se você a excluir, os leads permanecerão cadastrados mas não aparecerão nesta coluna. Deseja excluir mesmo assim?`)) {
        return;
      }
    } else {
      if (!confirm(`Deseja excluir a etapa "${stage.title}"?`)) return;
    }
    const updated = funnelStages.filter(st => st.key !== stageKey);
    setFunnelStages(updated);
    localStorage.setItem('crm_stages', JSON.stringify(updated));
  };

  const handleColumnDragStart = (e, index) => {
    setDraggedColumnIndex(index);
    e.dataTransfer.setData('text/column-index', index);
  };

  const handleColumnDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/column-index');
    if (sourceIndexStr === '') return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex) return;

    const updated = [...funnelStages];
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, moved);
    
    setFunnelStages(updated);
    localStorage.setItem('crm_stages', JSON.stringify(updated));
    setDraggedColumnIndex(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('crm_token', data.token);
        localStorage.setItem('crm_user', JSON.stringify(data.user));
        setToken(data.token);
        setCurrentUser(data.user);
      } else {
        setAuthError(data.error || 'Erro de autenticação.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Erro de conexão ao servidor.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    setToken('');
    setCurrentUser(null);
    setLeads([]);
    setSellers([]);
  };

  const fetchSellers = async () => {
    try {
      const res = await fetch('/api/crm/sellers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSellers(data.sellers || []);
      }
    } catch (err) {
      console.error('Erro ao buscar vendedores:', err);
    }
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const url = selectedSeller !== 'all' 
        ? `/api/crm/leads?assigned_to=${selectedSeller}`
        : '/api/crm/leads';

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('Erro ao buscar leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e, leadPhone) => {
    e.dataTransfer.setData('text/plain', leadPhone);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, stageKey) => {
    e.preventDefault();
    const leadPhone = e.dataTransfer.getData('text/plain');
    if (!leadPhone) return;

    updateLeadStageDirectly(leadPhone, stageKey);
  };

  const updateLeadStageDirectly = async (leadPhone, newStage) => {
    const lead = leads.find(l => l.phone === leadPhone);
    if (!lead || lead.stage === newStage) return;

    // Optimistic update
    setLeads(prev => prev.map(l => l.phone === leadPhone ? { ...l, stage: newStage } : l));

    try {
      const res = await fetch('/api/crm/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: leadPhone,
          stage: newStage
        })
      });

      if (!res.ok) {
        fetchLeads();
      }
    } catch (err) {
      console.error('Erro ao mover lead:', err);
      fetchLeads();
    }
  };

  // Inline Quick Actions
  const handleSaveQuickNote = async (leadPhone) => {
    if (!quickNoteContent.trim()) return;
    setIsSavingQuick(true);
    try {
      const noteText = quickNoteContent.trim();
      const res = await fetch('/api/crm/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lead_phone: leadPhone,
          content: noteText,
          user_id: currentUser?.id || currentUser?.userId || 3,
          user_name: currentUser?.name || 'Vendedor'
          // ⚠️ ANOTAÇÕES INTERNAS — NUNCA enviadas via WhatsApp
        })
      });

      if (res.ok) {
        setActiveNoteLead(null);
        setQuickNoteContent('');
        setSendViaWhatsapp(false);
        // Reload chat messages so the new note appears in history
        if (activeWhatsAppChatLead?.phone) {
          fetchChatNotes(activeWhatsAppChatLead.phone);
        }
        alert('Anotação salva! (Somente registro interno — não enviado ao cliente)');
      } else {
        alert('Erro ao salvar anotação.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar.');
    } finally {
      setIsSavingQuick(false);
    }
  };

  const handleSaveQuickReminder = async (leadPhone) => {
    if (!taskDate || !taskTime) {
      alert('Data e Hora são obrigatórias.');
      return;
    }
    const combinedDateTime = `${taskDate} ${taskTime}:00`;
    setIsSavingQuick(true);
    try {
      // 1. Update Lead Contact Return Date
      await fetch('/api/crm/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: leadPhone,
          next_contact_at: combinedDateTime
        })
      });

      // 2. Create CRM Task
      const taskTitleString = taskTitle.trim() || 'Retorno de Contato';
      const taskDesc = taskMessage.trim() ? `: ${taskMessage.trim()}` : '';
      const resTask = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lead_phone: leadPhone,
          title: `${taskTitleString}${taskDesc}`,
          due_date: combinedDateTime
        })
      });

      if (resTask.ok) {
        setActiveReminderLead(null);
        setTaskTitle('');
        setTaskMessage('');
        setTaskDate('');
        setTaskTime('');
        setIsCreatingReminder(false);
        fetchLeadTasks(leadPhone);
        fetchAllCrmTasks();
        fetchLeads();
        alert('Lembrete agendado com sucesso!');
      } else {
        alert('Erro ao criar agendamento.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao agendar.');
    } finally {
      setIsSavingQuick(false);
    }
  };

  // Format BRL Currency helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // Initials Avatar helper
  const getInitials = (name) => {
    if (!name) return 'LD';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Filtered Leads list
  const filteredLeads = leads.filter(lead => {
    const search = searchTerm.toLowerCase();
    return (
      (lead.name || '').toLowerCase().includes(search) ||
      (lead.phone || '').includes(search) ||
      (lead.assigned_to_name || '').toLowerCase().includes(search)
    );
  });

  const getLeadsInStage = (stageKey) => {
    return filteredLeads.filter(lead => {
      if (!lead.stage) return stageKey === 'qualificado';
      const s = String(lead.stage).toLowerCase().trim();
      if (s === stageKey) return true;
      if (stageKey === 'qualificado' && (s === 'inbox' || s === 'prospect' || s === 'qualificado')) return true;
      if (stageKey === 'contatado' && (s === 'tratar' || s === 'contato' || s === 'contatado')) return true;
      if (stageKey === 'demo_agendada' && (s === 'lead' || s === 'reuniao' || s === 'atendimento' || s === 'demo_agendada')) return true;
      if (stageKey === 'proposta_feita' && (s === 'proposta' || s === 'a_faturar' || s === 'faturado' || s === 'proposta_feita')) return true;
      if (stageKey === 'negociacoes' && (s === 'programado' || s === 'perdido' || s === 'desqualificado' || s === 'negociacoes')) return true;
      return false;
    });
  };

  // ---------------- LOGIN OVERLAY SCREEN ----------------
  if (!token || !currentUser) {
    return (
      <div className="flex items-center justify-center h-full min-h-[75vh]">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Acesso ao CRM</h2>
            <p className="text-sm text-gray-500">Entre com as credenciais do Clean Tech Smart para acessar o painel de vendas.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">E-mail</label>
              <input 
                required
                type="email"
                placeholder="vendedor@cleantech.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-gray-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Senha</label>
              <input 
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-gray-50/50"
              />
            </div>

            {authError && (
              <p className="text-xs text-red-500 font-semibold">{authError}</p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-blue-500/10 flex items-center justify-center space-x-2"
            >
              {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Entrar no CRM</span>}
            </button>
          </form>
        </div>
      </div>
    );
  }

      // ---------------- MAIN CRM BOARD SCREEN ----------------
      return (
        <div className="h-[calc(100vh-0.75rem)] -m-8 p-8 pb-2 flex flex-col space-y-2 text-gray-800 font-sans overflow-hidden bg-gray-50">
          
          {/* 1. Header & Metrics Top Bar (Shrink-0) */}
          <div className="shrink-0 space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm gap-3">
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">CRM - Funil de Vendas</h1>
                <p className="text-[11px] text-gray-500">Acompanhe novos contatos, propostas ativas e conversões em tempo real.</p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                {/* Search bar moved to top header */}
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Buscar por cliente, tel ou vendedor..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs bg-gray-50/50"
                  />
                </div>

                {/* Seller Filter */}
                {currentUser.role === 'gestor' && (
                  <div className="flex items-center space-x-1.5 text-xs">
                    <span className="text-gray-500 font-semibold">Vendedor:</span>
                    <select
                      value={selectedSeller}
                      onChange={e => setSelectedSeller(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-xs"
                    >
                      <option value="all">Todos os vendedores</option>
                      {sellers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Global Reminders Button */}
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const pendingTasks = allCrmTasks.filter(t => !t.completed);
                  const overdueCount = pendingTasks.filter(t => t.due_date && t.due_date.split('T')[0] < todayStr).length;
                  const todayCount = pendingTasks.filter(t => t.due_date && t.due_date.split('T')[0] === todayStr).length;
                  const totalAlert = overdueCount + todayCount;

                  return (
                    <button
                      type="button"
                      onClick={() => setIsRemindersSummaryOpen(true)}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border ${
                        overdueCount > 0
                          ? 'bg-red-500 hover:bg-red-600 text-white border-red-600 animate-pulse'
                          : todayCount > 0
                          ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                      }`}
                      title="Ver resumo de lembretes do CRM"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Lembretes</span>
                      {totalAlert > 0 && (
                        <span className="px-1.5 py-0.2 bg-white text-gray-900 rounded-full text-[10px] font-extrabold ml-1">
                          {totalAlert}
                        </span>
                      )}
                    </button>
                  );
                })()}

                <button
                  type="button"
                  onClick={handleSyncWhatsAppChats}
                  disabled={isSyncingWhatsApp}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                  title="Sincronizar conversas reais do WhatsApp via Z-API"
                >
                  {isSyncingWhatsApp ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5" />
                  )}
                  <span>Sincronizar Z-API</span>
                </button>
              </div>
            </div>

            {/* Compact Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Total de Leads</span>
                  <span className="text-lg font-bold text-gray-900">{stats.totalCount}</span>
                </div>
              </div>

              <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-3">
                <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Valor em Negociação</span>
                  <span className="text-sm font-bold text-yellow-600">{formatCurrency(stats.activeValue)}</span>
                </div>
              </div>

              <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Faturamento Fechado</span>
                  <span className="text-sm font-bold text-green-600">{formatCurrency(stats.closedValue)}</span>
                </div>
              </div>

              <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-3">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <AlertCircle className="w-4 h-4" />
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Taxa de Conversão</span>
                  <span className="text-lg font-bold text-purple-600">{stats.conversionRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Full-Height Kanban Board Box with Individual Column Scrolling */}
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <span>Carregando negócios...</span>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* A) CHEVRON HEADER ROW — PERMANENTLY FIXED AT TOP OF BOARD */}
              <div className="shrink-0 overflow-x-auto no-scrollbar select-none bg-gray-50 pt-1 pb-0.5">
                <div
                  ref={headerScrollRef}
                  onScroll={handleHeaderScroll}
                  className="overflow-x-auto no-scrollbar select-none"
                >
                  <div className="flex items-center gap-0 min-w-max pr-4">
                    {funnelStages.map((stage, index) => {
                      const stageLeads = getLeadsInStage(stage.key);
                      const stageValueSum = stageLeads.reduce((sum, l) => sum + (parseFloat(l.value) || 0), 0);
                      const isFirst = index === 0;
                      const isLast = index === funnelStages.length - 1;

                      const rawColor = migrateColor(stage.color);
                      const headerColor = rawColor && rawColor.startsWith('#') ? rawColor : '#F4F5F7';
                      const isColored = headerColor !== '#F4F5F7' && headerColor !== '#f4f5f7';

                      let svgPath;
                      if (isFirst)      svgPath = 'M 10 0 H 246 L 260 28 L 246 56 H 0 V 10 A 10 10 0 0 1 10 0 Z';
                      else if (isLast)  svgPath = 'M 0 0 H 236 A 10 10 0 0 1 246 10 V 56 H 0 L 14 28 Z';
                      else              svgPath = 'M 0 0 H 246 L 260 28 L 246 56 H 0 L 14 28 Z';

                      const colWidthClass = isLast ? 'min-w-[246px] w-[246px]' : 'min-w-[260px] w-[260px]';
                      const viewBoxStr = isLast ? '0 0 246 56' : '0 0 260 56';

                      return (
                        <div
                          key={stage.key}
                          className={`${colWidthClass} shrink-0`}
                          style={{
                            marginLeft: isFirst ? '0' : '-8px',
                            zIndex: funnelStages.length - index
                          }}
                        >
                          <div
                            draggable="true"
                            onDragStart={(e) => handleColumnDragStart(e, index)}
                            onDrop={(e) => handleColumnDrop(e, index)}
                            onDragOver={handleDragOver}
                            className="group/header select-none cursor-grab active:cursor-grabbing relative w-full h-[52px]"
                          >
                            <svg
                              viewBox={viewBoxStr}
                              preserveAspectRatio="none"
                              className="absolute inset-0 w-full h-full block"
                            >
                              <path
                                d={svgPath}
                                fill={headerColor}
                              />
                            </svg>

                            <div className="relative z-10 h-full flex items-center justify-between" style={{ paddingLeft: isFirst ? '16px' : '24px', paddingRight: isLast ? '16px' : '24px' }}>
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <div className={`font-bold text-xs leading-snug truncate ${isColored ? 'text-white' : 'text-gray-900'}`} title={stage.title}>
                                  {stage.title}
                                </div>
                                <div className={`text-[11px] font-normal mt-0.5 flex items-center space-x-1 ${isColored ? 'text-white/90' : 'text-gray-500'}`}>
                                  <span>{formatCurrency(stageValueSum)}</span>
                                  <span>·</span>
                                  <span>{stageLeads.length} {stageLeads.length === 1 ? 'negócio' : 'negócios'}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenAddStageAfter(index); }} className={`p-1 rounded ${isColored ? 'text-white hover:bg-white/20' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200/60'}`}>
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenEditStage(stage); }} className={`p-1 rounded ${isColored ? 'text-white hover:bg-white/20' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200/60'}`}>
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteStage(stage.key); }} className={`p-1 rounded ${isColored ? 'text-white hover:bg-white/20' : 'text-gray-400 hover:text-red-600 hover:bg-gray-200/60'}`}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* B) COLUMN BODIES ROW — INDIVIDUAL COLUMN CARDS SCROLLING */}
              <div
                ref={bodyScrollRef}
                onScroll={handleBodyScroll}
                className="flex-1 min-h-0 overflow-x-auto custom-scrollbar select-none"
              >
                <div className="flex items-stretch gap-0 min-w-max pr-4 h-full">
                  {funnelStages.map((stage, index) => {
                    const stageLeads = getLeadsInStage(stage.key);
                    const isFirst = index === 0;
                    const isLast = index === funnelStages.length - 1;

                    const rawColor = migrateColor(stage.color);
                    const headerColor = rawColor && rawColor.startsWith('#') ? rawColor : '#F4F5F7';
                    const isColored = headerColor !== '#F4F5F7' && headerColor !== '#f4f5f7';
                    const bodyBg = isColored ? getStageBgTint(headerColor) : '#F4F5F7';

                    const colWidthClass = isLast ? 'min-w-[246px] w-[246px]' : 'min-w-[260px] w-[260px]';

                    return (
                      <div
                        key={stage.key}
                        className={`flex flex-col ${colWidthClass} shrink-0 h-full`}
                        style={{
                          marginLeft: isFirst ? '0' : '-8px'
                        }}
                      >
                        <div
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, stage.key)}
                          style={{ backgroundColor: bodyBg }}
                          className="rounded-b-2xl rounded-t-none px-1 py-1.5 flex-1 max-h-[calc(100vh-14.5rem)] overflow-y-auto custom-scrollbar flex flex-col mt-[-1px] w-[246px] border-r border-white/80"
                        >
                          <div className="space-y-1.5 flex-grow">
                            {stageLeads.length === 0 ? (
                              <div className="border-2 border-dashed border-gray-200/80 rounded-xl py-12 text-center text-xs text-gray-400 font-medium italic">
                                Sem negócios nesta etapa
                              </div>
                            ) : (
                              stageLeads.map((lead, leadIdx) => {
                                const leadVal = parseFloat(lead.value) || 0;
                              const hasActivity = !!lead.next_contact_at;

                              return (
                                <div
                                  key={lead.phone || lead.id || leadIdx}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, lead.phone)}
                                  onClick={() => openWhatsAppChatModal(lead)}
                                  className="group bg-white p-2.5 rounded-lg border border-gray-200/90 shadow-2xs cursor-pointer hover:shadow-md hover:border-blue-400 transition-all space-y-1.5 text-left relative min-w-0"
                                >
                                  {/* Smartbid Card Layout: Avatar on Left, Title/Phone/Value on Right */}
                                  <div className="flex items-start space-x-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs mt-0.5">
                                      {getAvatarInitials(lead.name, lead.phone)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-1">
                                        <h4 className="text-xs font-bold text-gray-900 leading-tight truncate" title={lead.name}>
                                          {lead.company && lead.contact_name
                                            ? `${lead.company} (${lead.contact_name})`
                                            : lead.company || lead.contact_name || lead.name || `WhatsApp: ${lead.phone}`}
                                        </h4>
                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shrink-0">
                                          {formatCurrency(leadVal)}
                                        </span>
                                      </div>

                                      <div className="flex items-center justify-between gap-1 mt-1">
                                        <p className="text-[11px] text-gray-500 truncate leading-none">
                                          📞 {lead.phone}
                                        </p>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMoveLead(lead);
                                          }}
                                          className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                                            hasActivity 
                                              ? 'bg-[#22C55E] text-white hover:bg-emerald-600' 
                                              : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                                          }`}
                                          title={hasActivity ? 'Atividade Agendada' : 'Mover de Etapa / Opções'}
                                        >
                                          <ChevronRight className="w-3 h-3 stroke-[3]" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Scheduled Return Date Badge (if present) */}
                                  {lead.next_contact_at && (
                                    <div className="flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 p-1 rounded mt-0.5">
                                      <Calendar className="w-3 h-3 mr-1 text-emerald-500 shrink-0" />
                                      <span className="truncate">{formatTaskDateTime(lead.next_contact_at)}</span>
                                    </div>
                                  )}

                                  {/* Selected Tags Badges on Kanban Card */}
                                  {(() => {
                                    const tags = leadTags[lead.phone] || (lead.label ? lead.label.split(',').map(s => s.trim()).filter(Boolean) : []);
                                    if (tags.length === 0) return null;
                                    return (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {tags.map(t => (
                                          <span key={t} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-bold">
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
      </div>
    )}

      {/* ---------------- WHATSAPP ATENDIMENTO MODAL (Smartbid Style) ---------------- */}
      {activeWhatsAppChatLead && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-6 animate-in fade-in duration-200">
          <div className="bg-[#0B141B] rounded-2xl w-full max-w-4xl h-[90vh] shadow-2xl border border-gray-800 flex flex-col overflow-hidden">
            
            {/* 1. Header (Dark Navy #0B141B style matching Smartbid) */}
            <div className="bg-[#0B141B] text-white px-5 py-3 flex items-center justify-between shrink-0 border-b border-gray-800">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#1E293B] border border-gray-700 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                  {getAvatarInitials(activeWhatsAppChatLead.name, activeWhatsAppChatLead.phone)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white truncate">
                    {activeWhatsAppChatLead.company && activeWhatsAppChatLead.contact_name
                      ? `${activeWhatsAppChatLead.company} (${activeWhatsAppChatLead.contact_name})`
                      : activeWhatsAppChatLead.company || activeWhatsAppChatLead.contact_name || activeWhatsAppChatLead.name || `WhatsApp: ${activeWhatsAppChatLead.phone}`}
                  </h3>
                  <p className="text-xs text-emerald-400 font-medium truncate">
                    {activeWhatsAppChatLead.contact_name ? `Contato: ${activeWhatsAppChatLead.contact_name} · ` : ''}📱 {activeWhatsAppChatLead.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveChatTab('cadastro')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-white rounded-lg text-xs font-semibold transition-all border border-gray-700"
                >
                  <User className="w-3.5 h-3.5 text-gray-300" />
                  <span>Cadastro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWhatsAppChatLead(null)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 2. Top Navigation Tabs Bar (Dark Navy matching Smartbid) */}
            <div className="bg-[#0B141B] border-b border-gray-800 px-4 py-2 flex items-center space-x-2 shrink-0 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setActiveChatTab('chat')}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeChatTab === 'chat'
                    ? 'bg-[#1E293B] text-white shadow-xs'
                    : 'text-gray-400 hover:text-white hover:bg-[#1E293B]/50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>

              <button
                onClick={() => setActiveChatTab('anotacoes')}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeChatTab === 'anotacoes'
                    ? 'bg-[#1E293B] text-white shadow-xs'
                    : 'text-gray-400 hover:text-white hover:bg-[#1E293B]/50'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Anotações</span>
              </button>

              <button
                onClick={() => setActiveChatTab('lembretes')}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeChatTab === 'lembretes'
                    ? 'bg-[#1E293B] text-white shadow-xs'
                    : 'text-gray-400 hover:text-white hover:bg-[#1E293B]/50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Lembretes</span>
              </button>

              <button
                onClick={() => setActiveChatTab('etiquetas')}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeChatTab === 'etiquetas'
                    ? 'bg-[#1E293B] text-white shadow-xs'
                    : 'text-gray-400 hover:text-white hover:bg-[#1E293B]/50'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Etiquetas</span>
              </button>

              <button
                onClick={() => setActiveChatTab('cadastro')}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeChatTab === 'cadastro'
                    ? 'bg-[#1E293B] text-white shadow-xs'
                    : 'text-gray-400 hover:text-white hover:bg-[#1E293B]/50'
                }`}
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Cadastro</span>
              </button>
            </div>

            {/* 3. Modal Body Content per Active Tab */}
            <div className="flex-1 min-h-0 flex flex-col bg-[#0B141B] overflow-hidden">
              
              {/* TAB 1: CHAT */}
              {activeChatTab === 'chat' && (
                <div className="flex-1 flex flex-col min-h-0 bg-[#E5DDD5] relative">
                  
                  {/* Chat Messages History */}
                  <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    <div className="flex justify-center my-1">
                      <span className="bg-white/90 backdrop-blur-xs text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full shadow-2xs uppercase">
                        Hoje
                      </span>
                    </div>

                    {chatMessages.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 text-xs italic bg-white/80 backdrop-blur-xs p-6 rounded-2xl border border-gray-200 max-w-sm mx-auto shadow-xs">
                        Nenhuma mensagem registrada ainda. Envie a primeira mensagem abaixo via Z-API!
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => {
                        // is_sent vem diretamente da API: true = enviado por você (DIREITA verde), false = recebido do cliente (ESQUERDA branco)
                        const isSent = msg.is_sent === true;
                        const cleanText = (msg.content || '').replace('[WhatsApp]', '').trim();
                        const msgTime = msg.created_at ? new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora';

                        return (
                          <div
                            key={msg.id || idx}
                            className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-xl px-3.5 py-2 shadow-sm text-xs ${
                                isSent
                                  ? 'bg-[#D9FDD3] text-gray-900 rounded-tr-none'
                                  : 'bg-white text-gray-900 rounded-tl-none'
                              }`}
                            >
                              {/* Image bubble */}
                              {msg.is_image && msg.media_url && (
                                <a href={msg.media_url} target="_blank" rel="noreferrer" className="block mb-1.5 rounded-lg overflow-hidden">
                                  <img src={msg.media_url} alt="Imagem" className="max-w-full max-h-48 object-cover rounded-lg" />
                                </a>
                              )}
                              {msg.is_image && !msg.media_url && (
                                <div className="flex items-center space-x-2 bg-black/5 rounded-lg px-2 py-1.5 mb-1">
                                  <ImageIcon className="w-5 h-5 text-blue-500 shrink-0" />
                                  <span className="text-[12px] font-medium">Imagem</span>
                                </div>
                              )}
                              {/* File / Document bubble */}
                              {msg.is_file && (
                                <div className="mb-1.5">
                                  {msg.media_url ? (
                                    <a href={msg.media_url} target="_blank" rel="noreferrer"
                                      className="flex items-center space-x-2 bg-black/5 hover:bg-black/10 rounded-lg px-2 py-1.5 transition-colors">
                                      <FileText className="w-5 h-5 text-red-500 shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[12px] text-gray-700 font-medium truncate">{msg.file_name || 'Arquivo'}</p>
                                        <p className="text-[10px] text-blue-500">Toque para abrir</p>
                                      </div>
                                    </a>
                                  ) : (
                                    <div className="flex items-center space-x-2 bg-black/5 rounded-lg px-2 py-1.5">
                                      <FileText className="w-5 h-5 text-gray-500 shrink-0" />
                                      <span className="text-[12px] text-gray-700 font-medium truncate max-w-[180px]">{msg.file_name || 'Arquivo'}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Audio bubble */}
                              {msg.is_audio && (
                                <div className="mb-1.5">
                                  {msg.media_url ? (
                                    <audio controls className="w-full max-w-[220px] h-8" style={{ height: '32px' }}>
                                      <source src={msg.media_url} />
                                    </audio>
                                  ) : (
                                    <div className="flex items-center space-x-2 bg-black/5 rounded-lg px-2 py-1.5">
                                      <Volume2 className="w-4 h-4 text-gray-500 shrink-0" />
                                      <div className="flex-1 h-1.5 bg-gray-300 rounded-full"><div className="h-1.5 bg-emerald-500 rounded-full w-1/2"></div></div>
                                      <span className="text-[11px] text-gray-500">Áudio</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Video bubble */}
                              {msg.is_video && (
                                <div className="flex items-center space-x-2 bg-black/5 rounded-lg px-2 py-1.5 mb-1.5">
                                  <span className="text-lg">🎬</span>
                                  {msg.media_url
                                    ? <a href={msg.media_url} target="_blank" rel="noreferrer" className="text-[12px] text-blue-500 font-medium">Vídeo — Abrir</a>
                                    : <span className="text-[12px] text-gray-700">Vídeo</span>}
                                </div>
                              )}
                              {/* Caption / text */}
                              {cleanText && <p className="whitespace-pre-wrap leading-relaxed text-[13px] text-gray-900">{cleanText}</p>}
                              <div className="flex items-center justify-end space-x-1 text-[11px] text-gray-500 pt-0.5 mt-1">
                                <span>{msgTime}</span>
                                {isSent && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] inline" />}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatMessagesEndRef} />
                  </div>

                  {/* Chat Bottom Bar */}
                  <div className="bg-[#F0F2F5] border-t border-gray-200 shrink-0 rounded-b-2xl">
                    {/* File preview strip */}
                    {selectedFile && (
                      <div className="flex items-center px-4 py-2 bg-white border-b border-gray-100 space-x-2">
                        {selectedFile.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-blue-500" /> : selectedFile.type.startsWith('audio/') ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <FileText className="w-4 h-4 text-gray-500" />}
                        <span className="text-xs text-gray-700 font-medium truncate flex-1">{selectedFile.name}</span>
                        <span className="text-[11px] text-gray-400">{(selectedFile.size / 1024).toFixed(0)} KB</span>
                        <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="p-1 text-gray-400 hover:text-red-500 rounded-full transition-all">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    {/* Recording indicator */}
                    {isRecording && (
                      <div className="flex items-center px-4 py-2 bg-red-50 border-b border-red-100 space-x-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs text-red-600 font-semibold">Gravando... {Math.floor(recordingTime/60).toString().padStart(2,'0')}:{(recordingTime%60).toString().padStart(2,'0')}</span>
                      </div>
                    )}
                    <form onSubmit={handleSendChatMessage} className="px-4 py-3 flex items-center space-x-2">
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                        onChange={e => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }}
                      />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-200/60 transition-all" title="Enviar arquivo">
                        <Paperclip className="w-4 h-4" />
                      </button>

                      {isRecording ? (
                        <button type="button" onClick={stopRecording} className="p-2 text-red-600 hover:text-red-700 rounded-full hover:bg-red-100 transition-all animate-pulse" title="Parar gravação">
                          <Square className="w-4 h-4 fill-red-600" />
                        </button>
                      ) : (
                        <button type="button" onClick={startRecording} className="p-2 text-gray-400 hover:text-emerald-600 rounded-full hover:bg-gray-200/60 transition-all" title="Gravar áudio">
                          <Mic className="w-4 h-4" />
                        </button>
                      )}

                      <input
                        type="text"
                        placeholder={selectedFile ? 'Legenda opcional...' : 'Digite uma mensagem...'}
                        value={chatInputText}
                        onChange={(e) => setChatInputText(e.target.value)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs bg-white placeholder-gray-400"
                      />

                      <button
                        type="submit"
                        disabled={isSendingChatMessage || (!chatInputText.trim() && !selectedFile)}
                        className="p-2.5 bg-[#0B141B] hover:bg-[#1E293B] text-white rounded-full transition-all disabled:opacity-50 shadow-md flex items-center justify-center"
                        title="Enviar"
                      >
                        {isSendingChatMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 2: ANOTAÇÕES */}
              {activeChatTab === 'anotacoes' && (
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Nova Anotação Interna</h4>
                    <textarea
                      rows={3}
                      placeholder="Digite detalhes importantes sobre a negociação..."
                      value={quickNoteContent}
                      onChange={(e) => setQuickNoteContent(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
                    />
                    <button
                      onClick={() => handleSaveQuickNote(activeWhatsAppChatLead.phone)}
                      disabled={isSavingQuick || !quickNoteContent.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
                    >
                      Salvar Anotação
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Histórico de Anotações</h4>
                    {chatMessages.filter(m => m.is_whatsapp === false).length === 0 ? (
                      <div className="text-xs text-gray-400 italic bg-white p-4 rounded-xl border border-gray-100">Nenhuma anotação interna cadastrada. Use o campo acima para registrar observações sobre a negociação.</div>
                    ) : (
                      chatMessages.filter(m => m.is_whatsapp === false).map((note, idx) => (
                        <div key={note.id || idx} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-1">
                          <p className="text-xs text-gray-800 whitespace-pre-wrap">{note.content}</p>
                          <span className="text-[10px] text-gray-400 font-semibold">{note.author_name || 'Equipe'} · {new Date(note.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: LEMBRETES */}
              {activeChatTab === 'lembretes' && (
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {/* Top Bar for Tab */}
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span>Lembretes Cadastrados</span>
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {leadTasks.filter(t => !t.completed).length} pendente(s)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreatingReminder(!isCreatingReminder)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 ${
                        isCreatingReminder
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isCreatingReminder ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{isCreatingReminder ? 'Cancelar' : 'Novo Lembrete'}</span>
                    </button>
                  </div>

                  {/* Creation Form (if toggled or if list is empty and creating) */}
                  {isCreatingReminder && (
                    <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-3 animate-fadeIn">
                      <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Agendar Novo Retorno</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Data</label>
                          <input type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-gray-50/50 focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Hora</label>
                          <input type="time" value={taskTime} onChange={e => setTaskTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-gray-50/50 focus:ring-2 focus:ring-emerald-500" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Descrição / Motivo</label>
                        <input type="text" placeholder="Ex: Ligar para confirmar proposta..." value={taskMessage} onChange={e => setTaskMessage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-gray-50/50 focus:ring-2 focus:ring-emerald-500" />
                      </div>
                      <div className="flex justify-end space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsCreatingReminder(false)}
                          className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-xl transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveQuickReminder(activeWhatsAppChatLead.phone)}
                          disabled={isSavingQuick || !taskDate || !taskTime}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50"
                        >
                          {isSavingQuick ? 'Salvando...' : 'Salvar Lembrete'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of Reminders */}
                  <div className="space-y-2">
                    {leadTasks.length === 0 ? (
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center space-y-2">
                        <Clock className="w-8 h-8 text-gray-300 mx-auto" />
                        <p className="text-xs text-gray-500 font-medium">Nenhum lembrete cadastrado para este lead.</p>
                        <button
                          type="button"
                          onClick={() => setIsCreatingReminder(true)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Criar Primeiro Lembrete</span>
                        </button>
                      </div>
                    ) : (
                      leadTasks.map(task => {
                        const statusInfo = getTaskStatusInfo(task.due_date, task.completed);
                        return (
                          <div
                            key={task.id}
                            className={`bg-white p-3.5 rounded-2xl border transition-all flex items-center space-x-3 shadow-2xs ${
                              task.completed ? 'border-gray-200 opacity-65' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(task.completed)}
                              onChange={() => handleToggleTaskComplete(task.id, task.completed, activeWhatsAppChatLead.phone)}
                              className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {task.title}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-[11px] text-gray-500 font-medium flex items-center space-x-1">
                                  <Clock className="w-3 h-3 text-gray-400 inline" />
                                  <span>{formatTaskDateTime(task.due_date)}</span>
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.bg}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id, activeWhatsAppChatLead.phone)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all shrink-0"
                              title="Excluir lembrete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: ETIQUETAS */}
              {activeChatTab === 'etiquetas' && (
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
                          <Tag className="w-4 h-4 text-blue-600" />
                          <span>Etiquetas do Negócio</span>
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Clique nas etiquetas para vincular ou desvincular deste lead.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddingTag(!isAddingTag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 ${
                          isAddingTag
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isAddingTag ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{isAddingTag ? 'Cancelar' : 'Nova Etiqueta'}</span>
                      </button>
                    </div>

                    {/* Inline Add New Tag Form */}
                    {isAddingTag && (
                      <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200 flex items-center space-x-2 animate-fadeIn">
                        <input
                          type="text"
                          placeholder="Digite o nome da nova etiqueta..."
                          value={newTagInput}
                          onChange={e => setNewTagInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewTag(); } }}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddNewTag}
                          disabled={!newTagInput.trim()}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                        >
                          Adicionar
                        </button>
                      </div>
                    )}

                    {/* Tags List */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {availableTags.map(tag => {
                        const currentLeadSelected = (leadTags[activeWhatsAppChatLead.phone] || []).includes(tag);
                        return (
                          <div key={tag} className="group relative flex items-center">
                            <button
                              type="button"
                              onClick={() => toggleLeadTag(activeWhatsAppChatLead.phone, tag)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center space-x-1 ${
                                currentLeadSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                              }`}
                            >
                              <span>{currentLeadSelected ? `✓ ${tag}` : `+ ${tag}`}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTagFromCatalog(tag);
                              }}
                              className="ml-1 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                              title={`Excluir "${tag}" do catálogo`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: CADASTRO */}
              {activeChatTab === 'cadastro' && (
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4 max-w-xl">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Editar Cadastro do Lead</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nome da Empresa / Razão Social</label>
                        <input type="text" placeholder="Ex: Grupo JVS, Limpepro..." value={editLeadCompany} onChange={e => setEditLeadCompany(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-gray-50/50" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nome do Contato / Pessoa</label>
                        <input type="text" placeholder="Ex: Cristiano Silva, Jaime..." value={editLeadContactName} onChange={e => setEditLeadContactName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-gray-50/50" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Telefone WhatsApp</label>
                        <input type="text" value={editLeadPhone} disabled className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-100 text-gray-500 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Valor Estimado (R$)</label>
                        <input type="number" step="0.01" value={editLeadValue} onChange={e => setEditLeadValue(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-gray-50/50" />
                      </div>
                    </div>

                    {currentUser.role === 'gestor' && (
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Vendedor Responsável</label>
                        <select
                          value={editLeadSeller}
                          onChange={e => setEditLeadSeller(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-gray-50/50"
                        >
                          <option value="">Sem vendedor atribuído</option>
                          {sellers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      onClick={handleSaveLeadCadastro}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ---------------- QUICK NOTE MODAL (WaSeller Style) ---------------- */}
      {activeNoteLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 flex flex-col space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-lg">Criar anotação</h3>
              <button 
                onClick={() => { setActiveNoteLead(null); setQuickNoteContent(''); }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Drag & Drop Area Placeholder to match WaSeller layout perfectly */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50/50 flex flex-col items-center justify-center text-center space-y-1.5">
              <Plus className="w-6 h-6 text-gray-400" />
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Adicione uma mídia na anotação</p>
              <p className="text-[10px] text-gray-300">Arraste o arquivo aqui para upload (opcional)</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-gray-400 font-bold uppercase block">Lead</span>
              <span className="text-sm font-semibold text-gray-800 block">{activeNoteLead.name} ({activeNoteLead.phone})</span>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-gray-400 uppercase">Insira uma anotação</label>
              <textarea
                value={quickNoteContent}
                onChange={e => setQuickNoteContent(e.target.value)}
                placeholder="Insira sua nota..."
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-inner"
              ></textarea>
            </div>

            <div className="flex items-center space-x-2 text-left bg-slate-50 p-3 rounded-xl border border-slate-100">
              <input
                id="send-whats"
                type="checkbox"
                checked={sendViaWhatsapp}
                onChange={e => setSendViaWhatsapp(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="send-whats" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                💬 Enviar esta mensagem também via WhatsApp (Z-API) para o lead
              </label>
            </div>

            <div className="flex justify-end space-x-3 border-t border-gray-100 pt-4">
              <button
                onClick={() => { setActiveNoteLead(null); setQuickNoteContent(''); }}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveQuickNote(activeNoteLead.phone)}
                disabled={isSavingQuick}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/10 flex items-center justify-center space-x-1.5 transition-all"
              >
                {isSavingQuick ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Salvar</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- QUICK REMINDER MODAL (WaSeller Style) ---------------- */}
      {activeReminderLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-lg">Criar Agendamento</h3>
              <button 
                onClick={() => {
                  setActiveReminderLead(null);
                  setTaskTitle('');
                  setTaskMessage('');
                  setTaskDate('');
                  setTaskTime('');
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Destinatário / Lead</span>
              <span className="text-sm font-bold text-gray-800 block">{activeReminderLead.name} ({activeReminderLead.phone})</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block">Título (Opcional)</label>
              <input
                type="text"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="Insira aqui o título do retorno..."
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 block">Escolha um tipo</label>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-default shadow-sm shadow-emerald-500/10">Criar texto</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-lg text-xs font-bold cursor-not-allowed">Mídia</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-lg text-xs font-bold cursor-not-allowed">Áudio</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block">Mensagem / Observações</label>
              <textarea
                value={taskMessage}
                onChange={e => setTaskMessage(e.target.value)}
                placeholder="Insira os detalhes do lembrete..."
                rows="3"
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Data</label>
                <input
                  type="date"
                  value={taskDate}
                  onChange={e => setTaskDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Hora</label>
                <input
                  type="time"
                  value={taskTime}
                  onChange={e => setTaskTime(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block">Recorrência</label>
              <select className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50">
                <option value="none">Nenhuma selecionada</option>
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 border-t border-gray-100 pt-4">
              <button
                onClick={() => {
                  setActiveReminderLead(null);
                  setTaskTitle('');
                  setTaskMessage('');
                  setTaskDate('');
                  setTaskTime('');
                }}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveQuickReminder(activeReminderLead.phone)}
                disabled={isSavingQuick}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 flex items-center justify-center space-x-1.5 transition-all"
              >
                {isSavingQuick ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Criar</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- QUICK MOVE STAGE MODAL ---------------- */}
      {activeMoveLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl border border-gray-100 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Mover de Etapa</h3>
              <button 
                onClick={() => setActiveMoveLead(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-1 text-center">
              <span className="text-xs text-gray-400 font-bold uppercase block">Lead</span>
              <span className="text-sm font-semibold text-gray-800 block truncate">{activeMoveLead.name}</span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar text-left">
              <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Selecione a nova etapa:</label>
              <div className="grid grid-cols-1 gap-2">
                {funnelStages.map(st => (
                  <button
                    key={st.key}
                    onClick={() => { updateLeadStageDirectly(activeMoveLead.phone, st.key); setActiveMoveLead(null); }}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${st.key === activeMoveLead.stage ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}`}
                  >
                    {st.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- NEW CRM STAGE MODAL (WaSeller Style) ---------------- */}
      {isAddingStage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-lg">Criar Etapa</h3>
              <button 
                onClick={() => { setIsAddingStage(false); setNewStageTitle(''); }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block">Nome da nova aba / etapa *</label>
              <input
                type="text"
                value={newStageTitle}
                onChange={e => setNewStageTitle(e.target.value)}
                placeholder="Insira o nome da nova etapa..."
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 block">Cor de Destaque</label>
              <div className="grid grid-cols-5 gap-2">
                {STAGE_COLORS.map(color => {
                  const isSelected = selectedColor === color.value;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      title={color.name}
                      style={{ backgroundColor: color.value, border: isSelected ? '3px solid #1E293B' : '3px solid transparent' }}
                      className="h-8 rounded-lg transition-all relative flex items-center justify-center"
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-3 border-t border-gray-100 pt-4">
              <button
                onClick={() => { setIsAddingStage(false); setNewStageTitle(''); }}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateStage}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 transition-all"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- EDIT CRM STAGE MODAL ---------------- */}
      {isEditingStage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-lg">Editar Etapa</h3>
              <button 
                onClick={() => { setIsEditingStage(false); setEditingStageKey(''); setEditingStageTitle(''); }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block">Nome da etapa *</label>
              <input
                type="text"
                value={editingStageTitle}
                onChange={e => setEditingStageTitle(e.target.value)}
                placeholder="Insira o nome da etapa..."
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 block">Cor de Destaque</label>
              <div className="grid grid-cols-5 gap-2">
                {STAGE_COLORS.map(color => {
                  const isSelected = selectedColor === color.value;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      title={color.name}
                      style={{ backgroundColor: color.value, border: isSelected ? '3px solid #1E293B' : '3px solid transparent' }}
                      className="h-8 rounded-lg transition-all relative flex items-center justify-center"
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-3 border-t border-gray-100 pt-4">
              <button
                onClick={() => { setIsEditingStage(false); setEditingStageKey(''); setEditingStageTitle(''); }}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditStage}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition-all"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ---------------- RESUMO DE LEMBRETES DO CRM MODAL ---------------- */}
      {isRemindersSummaryOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-gray-200 text-left">
            {/* Modal Header */}
            <div className="bg-[#0B141B] px-6 py-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Resumo de Lembretes & Retornos</h3>
                  <p className="text-[11px] text-gray-400">Acompanhamento geral de compromissos com leads</p>
                </div>
              </div>
              <button
                onClick={() => setIsRemindersSummaryOpen(false)}
                className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center space-x-2 shrink-0">
              {[
                { key: 'hoje', label: 'Hoje' },
                { key: 'atrasados', label: 'Atrasados' },
                { key: 'todos', label: 'Todos os Lembretes' }
              ].map(f => {
                const todayStr = new Date().toISOString().split('T')[0];
                const count = allCrmTasks.filter(t => {
                  if (t.completed) return f.key === 'todos';
                  const taskDate = t.due_date ? t.due_date.split('T')[0] : '';
                  if (f.key === 'hoje') return taskDate === todayStr;
                  if (f.key === 'atrasados') return taskDate < todayStr;
                  return true;
                }).length;

                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setRemindersFilter(f.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center space-x-1.5 ${
                      remindersFilter === f.key
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${remindersFilter === f.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Reminders List */}
            <div className="flex-1 p-6 overflow-y-auto space-y-3 custom-scrollbar">
              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const filtered = allCrmTasks.filter(t => {
                  if (remindersFilter === 'hoje') return !t.completed && t.due_date && t.due_date.split('T')[0] === todayStr;
                  if (remindersFilter === 'atrasados') return !t.completed && t.due_date && t.due_date.split('T')[0] < todayStr;
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center space-y-2">
                      <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                      <p className="text-xs text-gray-500 font-medium">Nenhum lembrete pendente nesta categoria!</p>
                    </div>
                  );
                }

                return filtered.map(t => {
                  const statusInfo = getTaskStatusInfo(t.due_date, t.completed);
                  const matchedLead = leads.find(l => l.phone === t.lead_phone || l.phone?.slice(-8) === t.lead_phone?.slice(-8));

                  return (
                    <div
                      key={t.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between space-x-3 shadow-2xs ${
                        t.completed ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={Boolean(t.completed)}
                          onChange={() => handleToggleTaskComplete(t.id, t.completed)}
                          className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-gray-900 truncate">
                              {t.lead_name || matchedLead?.name || t.lead_phone}
                            </span>
                            <span className="text-[11px] text-gray-400">({t.lead_phone})</span>
                          </div>
                          <p className={`text-xs mt-0.5 ${t.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {t.title}
                          </p>
                          <div className="flex items-center space-x-2 mt-1.5">
                            <span className="text-[11px] text-gray-500 font-medium flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-gray-400 inline" />
                              <span>{formatTaskDateTime(t.due_date)}</span>
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.bg}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {matchedLead && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsRemindersSummaryOpen(false);
                              openWhatsAppChatModal(matchedLead);
                            }}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 shadow-2xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Abrir Chat</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
