import React from 'react';
import { MapPin, AlertCircle, Plus } from 'lucide-react';
import { Academy, DocumentStatus } from '../../types';

interface AcademyListItemProps {
  academy: Academy;
  onClick: (academy: Academy) => void;
  onUploadClick: (id: string) => void;
  getDocStatusLabel: (status: DocumentStatus) => string;
  getDocStatusColor: (status: DocumentStatus) => string;
}

export const AcademyListItem: React.FC<AcademyListItemProps> = ({ 
  academy, onClick, onUploadClick, getDocStatusLabel, getDocStatusColor 
}) => {
  const isRejected = academy.blackBeltCertificate?.status === DocumentStatus.REJECTED || 
                     academy.identityDocument?.status === DocumentStatus.REJECTED;
  
  const isPendingDocs = !academy.identityDocument?.url || 
                        !academy.blackBeltCertificate?.url || 
                        isRejected;
  
  return (
    <div className="relative">
      <div 
        onClick={() => onClick(academy)} 
        className={`bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border transition-all group relative overflow-visible cursor-pointer
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
        
        {isPendingDocs && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-start gap-2.5 shadow-sm ${isRejected ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
            {isRejected ? <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" /> : <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />}
            <p className={`text-[10px] font-black uppercase leading-relaxed tracking-tight ${isRejected ? 'text-red-700' : 'text-amber-700'}`}>
              {isRejected ? 'Documento Recusado: Verifique os detalhes e reenvie.' : 'Envio da documentação necessário. Clique no +.'}
            </p>
          </div>
        )}

        <div className="space-y-3 mb-6">
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

        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <MapPin size={18} className="text-cbjjs-blue" /> {academy.address?.city} - {academy.address?.state}
        </div>
        
        <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 z-20">
          <button 
            onClick={(e) => { e.stopPropagation(); onUploadClick(academy.id); }}
            className={`w-12 h-12 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all relative z-10 border-4 border-white dark:border-slate-800 ${isRejected ? 'bg-red-600' : 'bg-cbjjs-blue'}`}
          >
            <Plus size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};