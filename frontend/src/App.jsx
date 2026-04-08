import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const SOCKET_URL = 'https://teleexpert.duckdns.org';
const JANUS_URL = 'https://teleexpert.duckdns.org/janus/';
const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const socket = io(SOCKET_URL, { transports: ['websocket'], path: '/socket.io' });

const CODICI_MEDICO = {
  '1113': 1234,
  '2226': 1235,
};

function BpmMonitorWindow({ bpmValue, signalHistory, isActive, onClose, isMeasuring }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (signalHistory.length < 2) {
      ctx.fillStyle = '#446';
      ctx.font = '10px monospace';
      ctx.fillText('In attesa di dati...', 10, H / 2);
      return;
    }

    const data = signalHistory.slice(-280);
    const max = Math.max(...data, 1);
    const min = Math.min(...data, -1);
    const range = max - min || 1;

    ctx.strokeStyle = 'rgba(0, 255, 180, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (H / 4) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    ctx.strokeStyle = '#00ffb4';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#00ffb4';
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / 280) * W;
      const y = H - ((v - min) / range) * H;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [signalHistory]);

  if (!isActive) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '90px', right: '20px', width: '260px',
      background: 'rgba(8, 14, 22, 0.97)',
      border: `1px solid ${isMeasuring ? 'rgba(255, 75, 92, 0.6)' : 'rgba(0, 255, 180, 0.35)'}`,
      borderRadius: '18px', padding: '16px 18px 14px', zIndex: 9999,
      boxShadow: isMeasuring
        ? '0 0 30px rgba(255,75,92,0.2), 0 8px 32px rgba(0,0,0,0.7)'
        : '0 0 30px rgba(0,255,180,0.15), 0 8px 32px rgba(0,0,0,0.7)',
      backdropFilter: 'blur(12px)', fontFamily: "'SF Mono', 'Fira Code', monospace",
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: isMeasuring ? '#ff4b5c' : '#00ffb4',
            display: 'inline-block', animation: 'bpmPulse 1s infinite'
          }} />
          <span style={{ color: '#aab', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {isMeasuring ? 'Misurazione in corso...' : 'Monitor Cardiaco Live'}
          </span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#556', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
      </div>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <span style={{
          fontSize: '3.6rem', fontWeight: 900,
          color: bpmValue > 0 ? (isMeasuring ? '#ff8c94' : '#00ffb4') : '#556',
          lineHeight: 1, display: 'inline-block',
          animation: isMeasuring && bpmValue > 0 ? 'bpmNumPulse 1s infinite' : 'none',
        }}>
          {bpmValue > 0 ? Math.round(bpmValue) : '--'}
        </span>
        <span style={{ color: '#556', fontSize: '0.75rem', marginLeft: '5px' }}>BPM</span>
        {isMeasuring && bpmValue > 0 && (
          <div style={{ color: '#ff8c94', fontSize: '0.68rem', fontWeight: 'bold', marginTop: '3px', letterSpacing: '0.08em' }}>
            ● VALORE ISTANTANEO
          </div>
        )}
      </div>
      <canvas ref={canvasRef} width={224} height={60}
        style={{ width: '100%', height: '60px', borderRadius: '10px', background: '#050c0c', border: '1px solid rgba(0,255,180,0.1)' }}
      />
      <div style={{ textAlign: 'center', marginTop: '8px', color: '#446', fontSize: '0.6rem' }}>
        {signalHistory.length === 0 && <span style={{ color: '#ffaa44' }}>⏳ IN ATTESA DI DATI DAL SOCCORRITORE...</span>}
        {signalHistory.length > 0 && signalHistory.length < 30 && <span style={{ color: '#ffaa44' }}>📡 ACQUISIZIONE IN CORSO... ({signalHistory.length}/30)</span>}
        {signalHistory.length >= 30 && !isMeasuring && <span style={{ color: '#00ffb4' }}>✅ SEGNALE STABILE</span>}
        {signalHistory.length >= 30 && isMeasuring && <span style={{ color: '#ff8c94' }}>🔴 MISURAZIONE ATTIVA</span>}
      </div>
      <style>{`
        @keyframes bpmPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
        @keyframes bpmNumPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.75; } }
      `}</style>
    </div>
  );
}

function RoomPickerPopup({ onSelect, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: 'rgba(15, 20, 30, 0.98)', border: '1px solid rgba(0,255,180,0.25)',
        borderRadius: '24px', padding: '36px 32px', textAlign: 'center',
        boxShadow: '0 0 40px rgba(0,255,180,0.1), 0 20px 60px rgba(0,0,0,0.8)',
        fontFamily: "'SF Mono', 'Fira Code', monospace", minWidth: '280px',
      }}>
        <div style={{ color: '#00ffb4', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
          🚑 SOCCORRITORE
        </div>
        <h2 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: 800 }}>
          Seleziona la stanza
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={() => onSelect(1234)} style={{ padding: '18px', fontSize: '1rem', fontWeight: 800, border: 'none', background: 'linear-gradient(135deg, #ff4b5c, #c0392b)', color: 'white', borderRadius: '16px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,75,92,0.3)' }}>
            🔴 STANZA CARDIOLOGIA
          </button>
          <button onClick={() => onSelect(1235)} style={{ padding: '18px', fontSize: '1rem', fontWeight: 800, border: 'none', background: 'linear-gradient(135deg, #e67e22, #ca6f1e)', color: 'white', borderRadius: '16px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(230,126,34,0.3)' }}>
            🟠 STANZA EMATOLOGIA
          </button>
          <button className="btn-cancel" onClick={onCancel}>Annulla</button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [role, setRole] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [status, setStatus] = useState('SISTEMA PRONTO');
  const [isCallActive, setIsCallActive] = useState(false);
  const [videoReceived, setVideoReceived] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [currentBpm, setCurrentBpm] = useState(0);
  const [liveBpmSignal, setLiveBpmSignal] = useState([]);
  const [liveBpmValue, setLiveBpmValue] = useState(0);
  const [showBpmDetail, setShowBpmDetail] = useState(false);
  const [latestBpmValue, setLatestBpmValue] = useState(0);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [soccorritoreHasBpm, setSoccorritoreHasBpm] = useState(false);
  const [mediciCount, setMediciCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [chatMsg, setChatMsg] = useState('');
  const [showChatMedico, setShowChatMedico] = useState(false);
  const [showChatSoccorritore, setShowChatSoccorritore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMutedSoccorritore, setIsMutedSoccorritore] = useState(false);
  const [isMutedMedico, setIsMutedMedico] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pencil');
  const startPos = useRef({ x: 0, y: 0 });
  const [isFrozen, setIsFrozen] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [checklist, setChecklist] = useState([
    { id: 1, text: "Liberare vie aeree", completed: false },
    { id: 2, text: "Pressione su ferita", completed: false },
    { id: 3, text: "Preparare adrenalina", completed: false }
  ]);

  const canvasRef = useRef(null);
  const permanentSnapshotRef = useRef(null);
  const canvasSoccorritoreRef = useRef(null);
  const janusInstance = useRef(null);
  const publisherHandler = useRef(null);
  const subscriberHandler = useRef(null);
  const audioSubscriberHandler = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteFeedId = useRef(null);
  const chatEndRef = useRef(null);
  const isMounted = useRef(true);
  const timersRef = useRef([]);
  const bpmWindowRef = useRef(null);
  const handleRemoteDrawRef = useRef(null);
  const dataChannelReady = useRef(false);
  const roomIdRef = useRef(null);
  const alarmAudioRef = useRef(null);

  const drawShape = (ctx, msg, canvasWidth, canvasHeight) => {
    ctx.strokeStyle = msg.color || "#ff0000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    const x1 = msg.x1 * canvasWidth;
    const y1 = msg.y1 * canvasHeight;
    const x2 = msg.x2 * canvasWidth;
    const y2 = msg.y2 * canvasHeight;
    if (msg.type === 'circle') {
      const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      ctx.beginPath();
      ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (msg.type === 'arrow') {
      const headlen = 15;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
  };

  const refreshSoccorritoreCamera = async () => {
    if (role !== 'soccorritore' || !publisherHandler.current) return;
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => { track.stop(); });
      localVideoRef.current.srcObject = null;
    }
    publisherHandler.current.createOffer({
      media: { audioRecv: true, videoRecv: false, audioSend: true, videoSend: true, data: true, replaceVideo: true, video: { facingMode: { exact: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } } },
      success: (jsep) => { publisherHandler.current.send({ message: { request: "configure", bitrate: 4000000 }, jsep: jsep }); },
      error: (e) => console.error("❌ Errore refresh:", e)
    });
  };

  const restoreVideoAfterBpm = async () => {
    if (!isMounted.current) return;
    if (role === 'soccorritore') {
      await new Promise(r => setTimeout(r, 300));
      await refreshSoccorritoreCamera();
    }
    if (role === 'medico' && remoteVideoRef.current) {
      remoteVideoRef.current.play().catch(e => console.log("Play remoto:", e));
    }
  };

  const stopAlarm = () => {
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
    }
  };

  const openBiometrics = () => {
    if (bpmWindowRef.current && !bpmWindowRef.current.closed) { bpmWindowRef.current.focus(); return; }
    bpmWindowRef.current = window.open('/biometria.html', '_blank');
    const checkInterval = setInterval(() => {
      if (bpmWindowRef.current && bpmWindowRef.current.closed) {
        bpmWindowRef.current = null;
        clearInterval(checkInterval);
        setTimeout(restoreVideoAfterBpm, 600);
      }
    }, 500);
  };

  const sendDataChannel = (data) => {
    if (publisherHandler.current) {
      publisherHandler.current.data({
        text: JSON.stringify(data),
        error: (reason) => { console.error("❌ Errore DataChannel:", reason); dataChannelReady.current = false; },
        success: () => {}
      });
    }
  };

  useEffect(() => {
    const handleBpmMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data) return;
      if (role === 'soccorritore') {
        if (data.type === 'BPM_START') sendDataChannel({ type: 'BPM_START' });
        if (data.type === 'BPM_SIGNAL') {
          if (data.bpmIst && data.bpmIst > 0) setCurrentBpm(data.bpmIst);
          sendDataChannel({ type: 'BPM_SIGNAL', value: data.value, bpm: data.bpmIst });
        }
        if (data.type === 'BPM_FINAL') {
          const val = parseInt(data.value);
          setCurrentBpm(val);
          sendDataChannel({ type: 'BPM_FINAL', value: val });
          socket.emit('invia-messaggio', `ANALISI COMPLETATA: ${val} BPM`);
        }
        if (data.type === 'BPM_STOP') sendDataChannel({ type: 'BPM_STOP' });
        if (data.type === 'CAMERA_RELEASED') restoreVideoAfterBpm();
      }
    };
    window.addEventListener('message', handleBpmMessage);
    return () => window.removeEventListener('message', handleBpmMessage);
  }, [role]);

  const handleBpmDataChannel = (msg) => {
    if (msg.type === 'BPM_START') {
      setLiveBpmSignal([]);
      setLiveBpmValue(0);
      setLatestBpmValue(0);
      setCurrentBpm(0);
      setIsMeasuring(true);
      setSoccorritoreHasBpm(false);
    }
    else if (msg.type === 'BPM_SIGNAL') {
      setLiveBpmSignal(prev => {
        const next = [...prev, msg.value];
        return next.length > 280 ? next.slice(-280) : next;
      });
      if (msg.bpm && msg.bpm > 0) {
        setLiveBpmValue(msg.bpm);
        setLatestBpmValue(msg.bpm);
        setCurrentBpm(msg.bpm);
        setSoccorritoreHasBpm(true);
        setShowBpmDetail(true);
      }
    }
    else if (msg.type === 'BPM_FINAL') {
      const val = Number(msg.value);
      setLiveBpmValue(val); setLatestBpmValue(val); setCurrentBpm(val); setIsMeasuring(false);
    }
    else if (msg.type === 'BPM_STOP') { setIsMeasuring(false); }
  };

  const handleRemoteDraw = (msg) => {
    if (['BPM_START', 'BPM_SIGNAL', 'BPM_FINAL', 'BPM_STOP'].includes(msg.type)) { handleBpmDataChannel(msg); return; }
    if (msg.type === 'freeze') {
      const video = localVideoRef.current || remoteVideoRef.current;
      if (video) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth || video.clientWidth;
        tempCanvas.height = video.videoHeight || video.clientHeight;
        tempCanvas.getContext('2d').drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        setSnapshot(tempCanvas.toDataURL('image/jpeg'));
        setIsFrozen(true); setStatus("ANALISI FERMO IMMAGINE");
      }
      return;
    }
    if (msg.type === 'unfreeze') {
      setSnapshot(null); setIsFrozen(false);
      setStatus(role === 'soccorritore' ? "🚑 SOCCORRITORE (LIVE)" : "👨‍⚕️ MEDICO PRONTO");
      return;
    }
    if (msg.type === 'checklist') {
      setChecklist(prev => prev.map(t => t.id === msg.id ? { ...t, completed: msg.completed } : t));
      return;
    }

    const canvas = canvasSoccorritoreRef.current || canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const x = msg.x * canvas.width;
    const y = msg.y * canvas.height;

    if (msg.type === 'start') {
      ctx.strokeStyle = "#ff0000"; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x, y);
    }
    else if (msg.type === 'draw') { ctx.lineTo(x, y); ctx.stroke(); }
    else if (msg.type === 'clear') { ctx.clearRect(0, 0, canvas.width, canvas.height); }
    else if (msg.type === 'circle' || msg.type === 'arrow') { drawShape(ctx, msg, canvas.width, canvas.height); }
  };

  handleRemoteDrawRef.current = handleRemoteDraw;

  const toggleFreeze = () => {
    const video = remoteVideoRef.current; if (!video) return;
    if (!isFrozen) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth || video.clientWidth;
      tempCanvas.height = video.videoHeight || video.clientHeight;
      tempCanvas.getContext('2d').drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      setSnapshot(tempCanvas.toDataURL('image/jpeg'));
      setIsFrozen(true); setStatus("❄️ VIDEO BLOCCATO"); sendDataChannel({ type: 'freeze' });
    } else {
      setSnapshot(null); setIsFrozen(false); setStatus("👨‍⚕️ MEDICO PRONTO");
      sendDataChannel({ type: 'unfreeze' }); clearCanvas();
    }
  };

  const toggleTask = (id) => {
    const updated = checklist.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setChecklist(updated);
    const task = updated.find(t => t.id === id);
    sendDataChannel({ type: 'checklist', id: task.id, completed: task.completed });
    socket.emit('invia-messaggio', `[PROCEDURA] ${task.text}`);
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = (e.clientY - rect.top) / canvas.height;
    startPos.current = { x, y };
    setIsDrawing(true);
    if (tool === 'pencil') {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = "#ff0000"; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x * canvas.width, y * canvas.height);
      sendDataChannel({ type: 'start', x, y });
    } else {
      permanentSnapshotRef.current = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    }
  };

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const currentX = (e.clientX - rect.left) / canvas.width;
    const currentY = (e.clientY - rect.top) / canvas.height;
    if (tool === 'pencil') {
      ctx.lineTo(currentX * canvas.width, currentY * canvas.height); ctx.stroke();
      sendDataChannel({ type: 'draw', x: currentX, y: currentY });
    } else {
      if (permanentSnapshotRef.current) ctx.putImageData(permanentSnapshotRef.current, 0, 0);
      drawShape(ctx, { type: tool, x1: startPos.current.x, y1: startPos.current.y, x2: currentX, y2: currentY, color: "#ff0000" }, canvas.width, canvas.height);
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x2 = (e.clientX - rect.left) / canvas.width;
    const y2 = (e.clientY - rect.top) / canvas.height;
    if (tool !== 'pencil') {
      const ctx = canvas.getContext('2d');
      if (permanentSnapshotRef.current) ctx.putImageData(permanentSnapshotRef.current, 0, 0);
      const finalShape = { type: tool, x1: startPos.current.x, y1: startPos.current.y, x2, y2, color: "#ff0000" };
      drawShape(ctx, finalShape, canvas.width, canvas.height);
      permanentSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      sendDataChannel(finalShape);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current || canvasSoccorritoreRef.current;
    if (canvas) {
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      permanentSnapshotRef.current = null;
      if (role === 'medico') sendDataChannel({ type: 'clear' });
    }
  };

  const toggleMuteSoccorritore = () => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.enabled = !localAudioTrackRef.current.enabled;
      setIsMutedSoccorritore(!localAudioTrackRef.current.enabled);
    }
  };

  const toggleMuteMedico = () => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.enabled = !localAudioTrackRef.current.enabled;
      setIsMutedMedico(!localAudioTrackRef.current.enabled);
    }
  };

  const cleanupAllResources = () => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    if (localAudioTrackRef.current) { 
      localAudioTrackRef.current.stop(); 
      localAudioTrackRef.current = null;
    }
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
      localVideoRef.current.srcObject = null;
    }
    if (publisherHandler.current) try { publisherHandler.current.detach(); publisherHandler.current = null; } catch (e) {}
    if (subscriberHandler.current) try { subscriberHandler.current.detach(); subscriberHandler.current = null; } catch (e) {}
    if (audioSubscriberHandler.current) try { audioSubscriberHandler.current.detach(); audioSubscriberHandler.current = null; } catch (e) {}
    if (janusInstance.current) try { janusInstance.current.destroy(); janusInstance.current = null; } catch (e) {}
    stopAlarm();
  };

  const hangup = () => {
    if (role === 'soccorritore') {
      socket.emit('termina-chiamata', { roomId: roomIdRef.current });
    }
    cleanupAllResources();
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  useEffect(() => {
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible' && isCallActive) restoreVideoAfterBpm(); };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [role, isCallActive]);

  useEffect(() => {
    if (role === 'soccorritore' && canvasSoccorritoreRef.current && localVideoRef.current) {
      const resizeCanvas = () => {
        const video = localVideoRef.current; const canvas = canvasSoccorritoreRef.current;
        if (video && canvas && isMounted.current) { canvas.width = video.clientWidth; canvas.height = video.clientHeight; }
      };
      window.addEventListener('resize', resizeCanvas);
      setTimeout(resizeCanvas, 1000);
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [role, isCallActive]);

  useEffect(() => {
    if (role === 'medico' && canvasRef.current && remoteVideoRef.current && videoReceived) {
      const syncCanvasSize = () => {
        const video = remoteVideoRef.current; const canvas = canvasRef.current;
        if (video && canvas && isMounted.current) {
          canvas.width = video.clientWidth; canvas.height = video.clientHeight;
          permanentSnapshotRef.current = null;
        }
      };
      window.addEventListener('resize', syncCanvasSize);
      syncCanvasSize();
      return () => window.removeEventListener('resize', syncCanvasSize);
    }
  }, [role, videoReceived]);

  useEffect(() => {
    const emergenzaEvent = roomId ? `notifica-emergenza-${roomId}` : 'notifica-emergenza';
    socket.on(emergenzaEvent, () => {
      if (role === 'medico') {
        setIncomingCall(true);
        setStatus('EMERGENZA RILEVATA');
        if (alarmAudioRef.current) {
          alarmAudioRef.current.currentTime = 0;
          alarmAudioRef.current.play().catch(e => {
            const playOnClick = () => {
              alarmAudioRef.current.play().catch(() => {});
              document.removeEventListener('click', playOnClick);
            };
            document.addEventListener('click', playOnClick);
          });
        }
      }
    });

    socket.on('aggiorna-conteggio-medici', (count) => setMediciCount(count));
    
    socket.on('chiamata-terminata', () => {
      cleanupAllResources();
      window.location.reload();
    });

    socket.on('nuovo-messaggio', (msg) => {
      setMessages(prev => [...prev, { id: Date.now(), text: msg }]);
      if (role === 'soccorritore' && !showChatSoccorritore) setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.off(emergenzaEvent);
      socket.off('aggiorna-conteggio-medici');
      socket.off('chiamata-terminata');
      socket.off('nuovo-messaggio');
    };
  }, [role, roomId, showChatSoccorritore]);

  const initJanus = (chosenRole, chosenRoomId) => {
    setRole(chosenRole);
    setRoomId(chosenRoomId);
    roomIdRef.current = chosenRoomId;

    if (chosenRole === 'medico') {
      const audio = new Audio('/alarm.mp3');
      audio.loop = true; audio.volume = 1.0;
      audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {});
      alarmAudioRef.current = audio;
    }

    window.Janus.init({
      debug: false,
      callback: () => {
        janusInstance.current = new window.Janus({
          server: JANUS_URL, iceServers: ICE_SERVERS.iceServers,
          success: () => {
            janusInstance.current.attach({
              plugin: "janus.plugin.videoroom",
              success: (pluginHandle) => {
                publisherHandler.current = pluginHandle;
                pluginHandle.send({ message: { request: "join", room: chosenRoomId, ptype: "publisher", display: chosenRole, data: true } });
              },
              ondataopen: () => { dataChannelReady.current = true; },
              ondata: (data) => {
                try { const parsed = JSON.parse(data); handleRemoteDrawRef.current(parsed); } catch (e) { console.error("Errore parsing JSON:", e); }
              },
              onmessage: (msg, jsep) => {
                const event = msg["videoroom"];
                if (event === "joined") {
                  setStatus(`${chosenRole.toUpperCase()} PRONTO`);
                  if (chosenRole === 'medico' && msg["publishers"]?.length > 0) {
                    const rescueFeed = msg["publishers"].find(p => p.display === 'soccorritore');
                    if (rescueFeed) { remoteFeedId.current = rescueFeed.id; setIncomingCall(true); }
                  }
                }
                if (event === "event" && msg["publishers"]) {
                  const rescueFeed = msg["publishers"].find(p => p.display === 'soccorritore');
                  if (chosenRole === 'medico' && rescueFeed) { remoteFeedId.current = rescueFeed.id; setIncomingCall(true); }
                  if (chosenRole === 'soccorritore' && msg["publishers"].length > 0) { subscribeToAudio(msg["publishers"][0].id, chosenRoomId); }
                }
                if (jsep) publisherHandler.current.handleRemoteJsep({ jsep: jsep });
              },
              onlocaltrack: (track, added) => {
                if (added && isMounted.current) {
                  if (track.kind === 'audio') {
                    localAudioTrackRef.current = track;
                    if (chosenRole === 'medico') { track.enabled = false; setIsMutedMedico(true); }
                  }
                  if (track.kind === 'video' && chosenRole === 'soccorritore' && localVideoRef.current) {
                    if (!localVideoRef.current.srcObject) localVideoRef.current.srcObject = new MediaStream();
                    localVideoRef.current.srcObject.addTrack(track);
                  }
                }
              }
            });
          },
          error: (err) => console.error("❌ Errore Janus:", err)
        });
      }
    });
  };

  const startEmergency = () => {
    publisherHandler.current.createOffer({
      media: { audioRecv: true, videoRecv: false, audioSend: true, videoSend: true, data: true, video: { facingMode: { exact: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } } },
      success: (jsep) => {
        publisherHandler.current.send({ message: { request: "configure", audio: true, video: true, bitrate: 4000000, data: true }, jsep });
        socket.emit('soccorritore-avvia', { roomId: roomIdRef.current });
        setIsCallActive(true);
      },
      error: (e) => console.error("Errore createOffer:", e)
    });
  };

  const acceptEmergency = () => {
    stopAlarm();
    setIncomingCall(false);
    subscribeToVideo(remoteFeedId.current, roomIdRef.current);
    publisherHandler.current.createOffer({
      media: { audioRecv: false, videoRecv: false, audioSend: true, videoSend: false, data: true },
      success: (jsep) => { publisherHandler.current.send({ message: { request: "configure", audio: true, video: false, data: true }, jsep }); }
    });
  };

  const subscribeToVideo = (feedId, currentRoomId) => {
    janusInstance.current.attach({
      plugin: "janus.plugin.videoroom",
      success: (pluginHandle) => {
        subscriberHandler.current = pluginHandle;
        pluginHandle.send({ message: { request: "join", room: currentRoomId, ptype: "subscriber", feed: feedId, data: true } });
      },
      onremotetrack: (track, added) => {
        if (added && remoteVideoRef.current && isMounted.current) {
          if (!remoteVideoRef.current.srcObject) remoteVideoRef.current.srcObject = new MediaStream();
          remoteVideoRef.current.srcObject.addTrack(track);
          setVideoReceived(true); setIsCallActive(true);
        }
      },
      ondata: (data) => {
        try { const parsed = JSON.parse(data); handleRemoteDrawRef.current(parsed); } catch (e) { console.error("Errore parsing:", e); }
      },
      onmessage: (msg, jsep) => {
        if (jsep) {
          subscriberHandler.current.createAnswer({
            jsep,
            media: { audioRecv: true, videoRecv: true, audioSend: false, videoSend: false, data: true },
            success: (ourJsep) => { subscriberHandler.current.send({ message: { request: "start", room: currentRoomId }, jsep: ourJsep }); }
          });
        }
      }
    });
  };

  const subscribeToAudio = (feedId, currentRoomId) => {
    janusInstance.current.attach({
      plugin: "janus.plugin.videoroom",
      success: (pluginHandle) => {
        audioSubscriberHandler.current = pluginHandle;
        pluginHandle.send({ message: { request: "join", room: currentRoomId, ptype: "subscriber", feed: feedId, data: true } });
      },
      onremotetrack: (track, added) => {
        if (added && track.kind === 'audio' && isMounted.current) {
          const remoteAudio = new Audio();
          remoteAudio.srcObject = new MediaStream([track]);
          remoteAudio.play().catch(e => {});
        }
      },
      ondata: (data) => {
        try { const parsed = JSON.parse(data); handleRemoteDrawRef.current(parsed); } catch (e) { console.error("Errore parsing DataChannel:", e); }
      },
      onmessage: (msg, jsep) => {
        if (jsep) {
          audioSubscriberHandler.current.createAnswer({
            jsep,
            media: { audioRecv: true, videoRecv: false, audioSend: false, videoSend: false, data: true },
            success: (ourJsep) => { audioSubscriberHandler.current.send({ message: { request: "start", room: currentRoomId }, jsep: ourJsep }); }
          });
        }
      }
    });
  };

  const checkAccess = () => {
    const stanza = CODICI_MEDICO[inputCode];
    if (stanza) { initJanus('medico', stanza); socket.emit('medico-loggato'); }
    else { alert("Codice Errato!"); setInputCode(''); }
  };

  const handleRoomSelected = (selectedRoomId) => {
    setShowRoomPicker(false);
    initJanus('soccorritore', selectedRoomId);
  };

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; cleanupAllResources(); };
  }, []);

  return (
    <div className="App">
      {showRoomPicker && <RoomPickerPopup onSelect={handleRoomSelected} onCancel={() => setShowRoomPicker(false)} />}

      <div className="status-bar">
        🏥 TELEEXPERT HD | {status}
        {roomId && <span style={{ marginLeft: '10px', color: '#667', fontSize: '0.8em' }}>STANZA {roomId === 1234 ? '1' : '2'}</span>}
        {currentBpm > 0 && isMeasuring && (
          <span style={{ marginLeft: '15px', color: '#ff4b5c', fontWeight: 'bold', animation: 'bpmPulse 1s infinite' }}>
            🔴 {Math.round(currentBpm)} BPM (live)
          </span>
        )}
        {currentBpm > 0 && !isMeasuring && (
          <span style={{ marginLeft: '15px', color: '#ff4b5c', fontWeight: 'bold' }}>
            ❤️ {Math.round(currentBpm)} BPM
          </span>
        )}
        {mediciCount > 0 && isCallActive && <span style={{ marginLeft: '15px', color: 'var(--medical-green)' }}> ● MEDICO CONNESSO</span>}
      </div>

      {!role ? (
        <div className="main-content"><div className="glass-card"><h1>TeleExpert AR</h1>
          {!showAuth
            ? (<>
                <button className="btn btn-unlock" onClick={() => setShowAuth(true)}>MEDICO</button>
                <button className="btn btn-emergency" onClick={() => setShowRoomPicker(true)}>SOCCORRITORE</button>
              </>)
            : (<div className="auth-box">
                <h3>ACCESSO MEDICO</h3>
                <input type="password" className="auth-input" value={inputCode} onChange={(e) => setInputCode(e.target.value)} />
                <button className="btn btn-unlock" onClick={checkAccess}>ENTRA</button>
                <button className="btn-cancel" onClick={() => setShowAuth(false)}>Annulla</button>
              </div>)}
        </div></div>
      ) : (
        <div className="main-content">
          {role === 'soccorritore' && (
            <div className="video-container">
              <video ref={localVideoRef} autoPlay playsInline muted className="video-full" style={{ opacity: isFrozen ? 0 : 1 }} />
              {isFrozen && snapshot && <img src={snapshot} className="video-full" alt="frozen" style={{ position: 'absolute', top: 0, left: 0, zIndex: 9 }} />}
              <canvas ref={canvasSoccorritoreRef} className="canvas-ar" style={{ pointerEvents: 'none', zIndex: 10 }} />
              {showChatSoccorritore && (
                <div className="chat-overlay-soccorritore">
                  <div className="chat-history-soccorritore">
                    {messages.map((m) => <div key={m.id} className="msg-item-soccorritore" style={{ color: '#ffffff' }}>{m.text}</div>)}
                    <div ref={chatEndRef} />
                  </div>
                </div>
              )}
              {isCallActive && (
                <div className="chat-toggle-soccorritore" style={{ position: 'absolute', top: '20px', left: '20px', bottom: 'unset' }}
                  onClick={() => { setShowChatSoccorritore(!showChatSoccorritore); setUnreadCount(0); }}>
                  💬 {unreadCount > 0 && <span className="badge-soccorritore">{unreadCount}</span>}
                </div>
              )}
              <div className="overlay-controls">
                {!isCallActive
                  ? <button className="big-btn-mobile pulse" onClick={startEmergency}>🔴 AVVIA EMERGENZA</button>
                  : (<div className="controls-row">
                      <button className="btn-mic" style={{ backgroundColor: '#ff4b5c', marginRight: '10px' }} onClick={openBiometrics}>❤️</button>
                      <button className={`btn-mic ${isMutedSoccorritore ? 'mic-off' : 'mic-on'}`} onClick={toggleMuteSoccorritore}>{isMutedSoccorritore ? '🔇' : '🎤'}</button>
                      <button className="btn-termina-mini" onClick={hangup}>📞</button>
                    </div>)}
              </div>
            </div>
          )}
          {role === 'medico' && (
            <div className="video-container">
              {incomingCall && !videoReceived && (<div className="call-overlay"><div className="call-box"><h2>🚨EMERGENZA</h2><button className="btn btn-emergency pulse" onClick={acceptEmergency}>ACCETTA VIDEO</button></div></div>)}
              <div className={`video-vertical-box ${isFrozen ? 'frozen' : ''}`}>
                <video ref={remoteVideoRef} autoPlay playsInline className="video-medical-inner" style={{ opacity: isFrozen ? 0 : 1 }} />
                {isFrozen && snapshot && <img src={snapshot} className="video-medical-inner" alt="frozen" style={{ position: 'absolute', top: 0, left: 0, zIndex: 9 }} />}
                <canvas ref={canvasRef} className="canvas-ar" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing} style={{ zIndex: 10 }} />
              </div>
              {videoReceived && (<>
                <div className="medical-controls-sidebar">
                  <div className="tool-selector">
                    <button onClick={() => setTool('pencil')} className={`btn-tool ${tool === 'pencil' ? 'active' : ''}`}>✏️</button>
                    <button onClick={() => setTool('circle')} className={`btn-tool ${tool === 'circle' ? 'active' : ''}`}>⭕</button>
                    <button onClick={() => setTool('arrow')} className={`btn-tool ${tool === 'arrow' ? 'active' : ''}`}>➡️</button>
                  </div>
                  <button onClick={toggleFreeze} className={`btn-sidebar-action ghiaccia ${isFrozen ? 'active' : ''}`}><span style={{ fontSize: '1.2rem' }}>❄️</span>{isFrozen ? 'SBLOCCA' : 'GHIACCIA'}</button>
                  <button onClick={clearCanvas} className="btn-sidebar-action pulisci"><span style={{ fontSize: '1.2rem' }}>🧹</span>Pulisci</button>
                  <button onClick={hangup} className="btn-sidebar-action termina"><span style={{ fontSize: '1.2rem' }}>📞</span></button>
                </div>
                <button className={`btn-mic-medico ${isMutedMedico ? 'mic-medico-off' : 'mic-medico-on'}`} onClick={toggleMuteMedico}>{isMutedMedico ? '🔇' : '🎤'}</button>
                <button className="chat-toggle-btn" onClick={() => setShowChatMedico(!showChatMedico)}>{showChatMedico ? '✖' : '💬'}</button>
                {showChatMedico && (
                  <div className="chat-sidebar-overlay">
                    <div className="chat-history">{messages.map((m) => <div key={m.id} className="chat-msg-item">{m.text}</div>)}<div ref={chatEndRef} /></div>
                    <div className="checklist-container">
                      <h4 style={{ color: 'var(--medical-green)', margin: '0 0 10px 0', fontSize: '0.9rem' }}>PROCEDURE</h4>
                      {checklist.map(task => (
                        <div key={task.id} className={`checklist-item ${task.completed ? 'completed' : ''}`} onClick={() => toggleTask(task.id)}>
                          <input type="checkbox" checked={task.completed} readOnly />
                          <span style={{ fontSize: '0.8rem', color: 'white' }}>{task.text}</span>
                        </div>
                      ))}
                    </div>
                    <div className="chat-input-group" style={{ marginTop: '10px' }}>
                      <input type="text" className="chat-input-field" placeholder="Invia..." value={chatMsg} onChange={(e) => setChatMsg(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (() => { if (chatMsg.trim()) { socket.emit('invia-messaggio', chatMsg); setChatMsg(''); } })()}
                      />
                      <button onClick={() => { if (chatMsg.trim()) { socket.emit('invia-messaggio', chatMsg); setChatMsg(''); } }}
                        style={{ background: 'var(--medical-blue)', border: 'none', color: 'white', borderRadius: '5px', padding: '0 10px' }}>OK</button>
                    </div>
                  </div>
                )}
                <button className="bpm-badge-btn" onClick={() => { if (soccorritoreHasBpm) setShowBpmDetail(true); }} style={{
                  position: 'fixed', bottom: '20px', left: '20px', zIndex: 9998,
                  background: 'rgba(0, 0, 0, 0.85)',
                  border: `2px solid ${isMeasuring && soccorritoreHasBpm ? '#ff4b5c' : latestBpmValue > 0 ? '#ff4b5c' : '#444'}`,
                  borderRadius: '40px', padding: '8px 18px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  cursor: soccorritoreHasBpm ? 'pointer' : 'default', backdropFilter: 'blur(8px)',
                }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: latestBpmValue > 0 ? '#ff4b5c' : '#555', animation: latestBpmValue > 0 ? 'bpmPulse 1s infinite' : 'none', display: 'inline-block' }} />
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    ❤️ {latestBpmValue > 0 ? Math.round(latestBpmValue) : '--'} BPM
                    {isMeasuring && latestBpmValue > 0 && <span style={{ fontSize: '0.65rem', color: '#ff8c94', marginLeft: '6px', verticalAlign: 'middle' }}>LIVE</span>}
                  </span>
                  <span style={{ color: '#aaa', fontSize: '0.7rem' }}>
                    {isMeasuring && !soccorritoreHasBpm ? '⏳ acquisizione...' : isMeasuring && soccorritoreHasBpm ? 'misurazione...' : latestBpmValue > 0 ? 'Clicca per dettaglio' : 'In attesa...'}
                  </span>
                </button>
                <BpmMonitorWindow
                  bpmValue={liveBpmValue}
                  signalHistory={liveBpmSignal}
                  isActive={showBpmDetail && soccorritoreHasBpm}
                  onClose={() => setShowBpmDetail(false)}
                  isMeasuring={isMeasuring}
                />
              </>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
