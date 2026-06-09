import React from 'react';
import { MapPin, AlertCircle, FileText, Award } from 'lucide-react';
import { Academy, DocumentStatus } from '../../types';

interface AcademyListItemProps {
  academy: Academy;
  onClick: (academy: Academy) => void;
  onUploadClick: (id: string) => void;
  onRequestCertificate: (academy: Academy) => void; // Nova prop
  getDocStatusLabel: (status: DocumentStatus) => string;
  getDocStatusColor: (status: DocumentStatus) => string;
}

export const AcademyListItem: React.FC<AcademyListItemProps> = ({ 
  academy, onClick, onUploadClick, onRequestCertificate, getDocStatusLabel, getDocStatusColor 
}) => {
  const isRejected = academy.blackBeltCertificate?.status === DocumentStatus.REJECTED || 
                     academy.identityDocument?.status === DocumentStatus.REJECTED;
  
  const isPendingDocs = !academy.identityDocument?.url || 
                        !academy.blackBeltCertificate?.url || 
                        isRejected;
  
  return (
    <div className="relative group">
      <div 
        onClick={() => onClick(academy)} 
        className={`bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border transition-all relative overflow-hidden cursor-pointer
            ${isRejected ? 'border-red-200 bg-red-50/10' : isPendingDocs ? 'animate-pulse-yellow-border border-yellow-200' : 'border-gray-100 dark:border-slate-800 hover:border-cbjjs-blue hover:shadow-xl'}
        `}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-black dark:text-white group-hover:text-cbjjs-blue transition-colors leading-none mb-2">{academy.name}</h3>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">{academy.teamName}</p>
          </div>
          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border ${academy.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {academy.status === 'PENDING' ? 'Em Análise' : 'Aprovada'}
          </span>
        </div>

        {/* Localização em Destaque */}
        <div className="mb-6 flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border dark:border-slate-700">
            <MapPin size={18} className="text-cbjjs-blue" />
            <span className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                {academy.address?.city} / {academy.address?.state}
            </span>
        </div>
        
        {isPendingDocs && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-start gap-2.5 shadow-sm ${isRejected ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
            {isRejected ? <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" /> : <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />}
            <p className={`text-[10px] font-black uppercase leading-relaxed tracking-tight ${isRejected ? 'text-red-700' : 'text-amber-700'}`}>
              {isRejected ? 'Documento Recusado: Verifique os detalhes e reenvie.' : 'Envio da documentação necessário para validação.'}
            </p>
          </div>
        )}

        <div className="space-y-3 mb-8">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-gray-400">Identidade / CNH</span>
            <span className={getDocStatusColor(academy.identityDocument?.status || DocumentStatus.MISSING)}>
              {getDocStatusLabel(academy.identityDocument?.status || DocumentStatus.MISSING)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-gray-400">Certificado Faixa Preta</span>
            <span className={getDocStatusColor(academy.blackBeltCertificate?.status || DocumentStatus.MISSING)}>
              {getDocStatusLabel(academy.blackBeltCertificate?.status || DocumentStatus.MISSING)}
            </span>
          </div>
        </div>

        {/* Sistema de Botões de Ação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); onUploadClick(academy.id); }}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg
                ${isRejected ? 'bg-red-600 text-white shadow-red-500/20' : 'bg-cbjjs-blue text-white shadow-blue-500/20'}
            `}
          >
            <FileText size={16} /> Enviar Documentos
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onRequestCertificate(academy); }}
            className="flex items-center justify-center gap-2 py-3.5 bg-cbjjs-green text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg shadow-green-500/20"
          >
            <Award size={16} /> Solicitar Certificado
          </button>
        </div>
      </div>
    </div>
  );
};