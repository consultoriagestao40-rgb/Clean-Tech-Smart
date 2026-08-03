import { useState, useEffect, useRef } from 'react';
import { 
  Wrench, MapPin, Navigation, Camera, Edit2, CheckCircle2, 
  Trash2, X, Eye, ArrowLeft, Loader2, Award, ShieldCheck 
} from 'lucide-react';

export default function TecnicoPainel() {
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Active ticket view state
  const [activeTicket, setActiveTicket] = useState(null);
  
  // Fields for closure
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverDocument, setReceiverDocument] = useState('');
  const [evidencePhotos, setEvidencePhotos] = useState([]); // Base64 strings

  // Canvas ref for signature pad
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    fetchTechnicians();
    fetchTickets();
  }, []);

  const fetchTechnicians = async () => {
    try {
      const res = await fetch('/api/get-technicians');
      if (res.ok) {
        const data = await res.json();
        setTechnicians(data.technicians || []);
      }
    } catch (e) {
      console.error('Erro ao buscar técnicos:', e);
    }
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error('Erro ao buscar chamados:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tickets by selected technician
  const activeTickets = tickets.filter(t => {
    if (!selectedTechId) return false;
    return String(t.technician_id) === String(selectedTechId);
  });

  const pendingTickets = activeTickets.filter(t => t.status !== 'Concluído');
  const completedTickets = activeTickets.filter(t => t.status === 'Concluído');

  // Handle opening ticket details and initializing drawing parameters
  const handleOpenTicket = (ticket) => {
    setActiveTicket(ticket);
    setResolutionNotes(ticket.resolution_notes || '');
    setReceiverName(ticket.signed_by_name || '');
    setReceiverDocument(ticket.signed_by_document || '');
    
    // Parse photos if exist
    if (ticket.evidence_photos) {
      setEvidencePhotos(ticket.evidence_photos.split('\n').filter(Boolean));
    } else {
      setEvidencePhotos([]);
    }

    // Set timeout to initialize canvas drawing listeners after DOM loads
    setTimeout(() => {
      initSignatureCanvas();
    }, 150);
  };

  // Canvas drawing logic for Mobile/Desktop signature
  const initSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Drawing helper functions
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      isDrawingRef.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stopDraw = () => {
      isDrawingRef.current = false;
    };

    // Mouse listeners
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);

    // Touch listeners
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Photo snap uploader to base64 with client-side canvas compression
  const handlePhotoCapture = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress as JPEG at 60% quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setEvidencePhotos(prev => [...prev, compressedBase64]);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (index) => {
    setEvidencePhotos(prev => prev.filter((_, idx) => idx !== index));
  };

  // Submit OS Closure
  const handleFinishOS = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      alert('Por favor, informe as notas de resolução do serviço.');
      return;
    }
    if (!receiverName.trim()) {
      alert('Por favor, informe o nome do cliente que está recebendo o serviço.');
      return;
    }

    const canvas = canvasRef.current;
    let signatureBase64 = null;
    if (canvas) {
      // Check if signature was drawn
      signatureBase64 = canvas.toDataURL();
    }

    setIsActionLoading(true);
    try {
      const res = await fetch('/api/close-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeTicket.id,
          evidence_photos: evidencePhotos.join('\n'),
          client_signature: signatureBase64,
          signed_by_name: receiverName,
          signed_by_document: receiverDocument,
          resolution_notes: resolutionNotes
        })
      });

      if (res.ok) {
        alert('Chamado finalizado e OS validada com sucesso!');
        // Refresh ticket list
        await fetchTickets();
        // Return to dashboard
        setActiveTicket(null);
      } else {
        alert('Erro ao finalizar chamado no servidor.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar OS.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-10 text-slate-800">
      
      {/* PWA Mobile Header */}
      <header className="bg-blue-900 text-white px-5 py-4 flex items-center justify-between shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <Wrench className="w-5 h-5 text-blue-300" />
          <h1 className="font-extrabold text-sm tracking-wider uppercase">Painel do Técnico (OS)</h1>
        </div>
        <span className="text-[10px] bg-blue-950/60 border border-blue-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
          Offline Enabled
        </span>
      </header>

      {/* Screen Container */}
      <div className="max-w-md mx-auto p-4 space-y-4">

        {/* 1. SELECT TECHNICIAN VIEW (IF NO ACTIVE TICKET) */}
        {!activeTicket && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
              <label className="block text-xxs font-black text-slate-500 uppercase tracking-wider">Técnico Responsável</label>
              <select 
                value={selectedTechId}
                onChange={e => setSelectedTechId(e.target.value)}
                className="w-full h-11 px-3.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Selecione o seu nome...</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* List of assigned tickets */}
            {selectedTechId && (
              <div className="space-y-4">
                
                {/* Pending tasks header */}
                <h3 className="text-xxs font-black text-slate-500 uppercase tracking-widest block pt-2">
                  Chamados Pendentes ({pendingTickets.length})
                </h3>

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-blue-900 animate-spin" />
                  </div>
                ) : pendingTickets.length === 0 ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center text-xs font-bold text-emerald-800">
                    🎉 Excelente! Nenhum chamado pendente atribuído.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingTickets.map(t => (
                      <div 
                        key={t.id} 
                        className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start border-b border-gray-100 pb-2 mb-3">
                          <div>
                            <span className="text-[10px] font-black uppercase text-blue-600 block">#{String(t.id).padStart(4, '0')} • {t.ticket_type}</span>
                            <h4 className="font-extrabold text-sm text-gray-900 mt-0.5">{t.client_name}</h4>
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            t.priority === 'Alta' ? 'bg-red-50 text-red-500 border border-red-100' :
                            t.priority === 'Crítica' ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse' :
                            'bg-blue-50 text-blue-500 border border-blue-100'
                          }`}>
                            {t.priority}
                          </span>
                        </div>

                        {/* Description & Address */}
                        <div className="text-xs text-slate-600 font-semibold space-y-2 mb-4 leading-relaxed">
                          <p className="line-clamp-2 italic">“{t.description}”</p>
                          <div className="flex items-start gap-1.5 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <span>{t.client_address}</span>
                          </div>
                        </div>

                        {/* Navigation Actions Row */}
                        <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                          <a 
                            href={`https://waze.com/ul?q=${encodeURIComponent(t.client_address)}&navigate=yes`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-9 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl text-[10px] font-black uppercase text-teal-700 tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Navigation className="w-3.5 h-3.5" /> Rota Waze
                          </a>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.client_address)}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-9 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-[10px] font-black uppercase text-blue-700 tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5" /> Rota Maps
                          </a>
                          
                          <button 
                            onClick={() => handleOpenTicket(t)}
                            className="col-span-2 h-10 mt-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-98"
                          >
                            <Edit2 className="w-4 h-4" /> Executar Chamado (OS)
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Completed tasks list */}
                {completedTickets.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <h3 className="text-xxs font-black text-slate-500 uppercase tracking-widest block">
                      Chamados Finalizados ({completedTickets.length})
                    </h3>
                    <div className="space-y-2 opacity-75">
                      {completedTickets.map(t => (
                        <div key={t.id} className="bg-slate-50 border border-gray-200 rounded-xl p-3 text-xs flex justify-between items-center shadow-xxs">
                          <div>
                            <span className="font-black text-gray-400 text-[10px]">#{String(t.id).padStart(4, '0')}</span>
                            <h5 className="font-bold text-gray-800 line-clamp-1">{t.client_name}</h5>
                          </div>
                          <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Concluído
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* 2. ACTIVE TICKET OS EXECUTION SCREEN */}
        {activeTicket && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden flex flex-col text-left">
            
            {/* Header detail */}
            <div className="bg-slate-50 border-b border-gray-100 p-4 flex items-center gap-3 sticky top-[53px] z-30">
              <button 
                onClick={() => setActiveTicket(null)} 
                className="p-1.5 hover:bg-gray-200 rounded-lg text-slate-500 transition-colors"
                title="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 block">Ordem de Serviço (OS)</span>
                <h4 className="font-extrabold text-sm text-gray-900 leading-none mt-0.5">#{String(activeTicket.id).padStart(4, '0')} • {activeTicket.client_name}</h4>
              </div>
            </div>

            <form onSubmit={handleFinishOS} className="p-4 space-y-5">
              
              {/* Equipment Info */}
              <div className="bg-blue-50/30 border border-blue-100/50 rounded-xl p-3 text-xs leading-relaxed space-y-1.5">
                <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider block border-b border-blue-100/60 pb-1 mb-1">
                  Equipamento do Cliente
                </span>
                <div><b>Equipamento:</b> {activeTicket.equipment_name || 'Não cadastrado'}</div>
                <div><b>Modelo/Marca:</b> {activeTicket.equipment_model || '—'} ({activeTicket.equipment_brand || '—'})</div>
                <div><b>Nº Série:</b> {activeTicket.equipment_serial_number || '—'}</div>
                <div><b>Defeito Relatado:</b> <span className="italic">“{activeTicket.description}”</span></div>
              </div>

              {/* Resolution Notes Input */}
              <div className="space-y-1.5">
                <label className="block text-xxs font-black text-slate-500 uppercase tracking-wider">Notas de Resolução do Técnico</label>
                <textarea
                  required
                  rows={4}
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder="Relatório técnico detalhado sobre as ações tomadas e o status do equipamento..."
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Evidências Fotográficas (Snap Photos) */}
              <div className="space-y-2">
                <label className="block text-xxs font-black text-slate-500 uppercase tracking-wider">Evidências Fotográficas</label>
                
                {/* Snapped Photos Grid */}
                {evidencePhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 py-1">
                    {evidencePhotos.map((url, idx) => (
                      <div key={idx} className="relative aspect-square border rounded-lg overflow-hidden bg-slate-50 shadow-xxs">
                        <img src={url} alt="Snap OS" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-650 text-white rounded-full transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center">
                  <label className="w-full h-11 bg-slate-50 hover:bg-slate-100 border border-dashed border-gray-300 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs font-bold text-slate-600 transition-colors shadow-xxs">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Tirar Foto / Anexar</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      onChange={handlePhotoCapture} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* Digital Signature Pad */}
              <div className="space-y-2 border-t border-gray-150 pt-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xxs font-black text-slate-500 uppercase tracking-wider">Assinatura do Cliente</label>
                  <button
                    type="button"
                    onClick={handleClearSignature}
                    className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded"
                  >
                    Limpar
                  </button>
                </div>

                <div className="relative border border-gray-250 rounded-xl overflow-hidden shadow-inner">
                  <canvas 
                    ref={canvasRef} 
                    width={400} 
                    height={160} 
                    className="w-full h-40 bg-slate-50/70 cursor-crosshair touch-none" 
                  />
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 pointer-events-none text-slate-400 text-[8px] font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> OS Validada Digitalmente
                  </div>
                </div>

                {/* Receiver Info */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Nome do Recebedor</label>
                    <input 
                      type="text" 
                      required
                      value={receiverName}
                      onChange={e => setReceiverName(e.target.value)}
                      placeholder="Nome do cliente"
                      className="w-full h-9 px-3 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Documento (CPF / RG)</label>
                    <input 
                      type="text" 
                      value={receiverDocument}
                      onChange={e => setReceiverDocument(e.target.value)}
                      placeholder="Identificação do cliente"
                      className="w-full h-9 px-3 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit OS Buttons */}
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="w-1/3 h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-all"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="w-2/3 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5"
                >
                  {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {isActionLoading ? 'Salvando...' : 'Finalizar OS & Assinar'}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
