import React, { useState } from 'react';
import { X, FileText, CheckCircle, MapPin, Phone, User as UserIcon, ExternalLink, Loader2, RefreshCw, AlertCircle, ArrowRight, Camera, Download, Trash2, RotateCcw } from 'lucide-react';
import { Academy, RegistrationStatus, DocumentStatus } from '../types';
import { modalLabelClass } from './AdminShared';
import { AdminProfessorDetailsModal } from './AdminProfessorDetailsModal';

interface AcademyWithProfile extends Academy {
    ownerProfile?: { fullName: string; email: string; dob: string; cpf: string; };
    deleted?: string;
}

interface AdminAcademyDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    academy: AcademyWithProfile | null;
    onApproveAcademy: (id: string) => Promise<void>;
    onApproveUpdate: (requestId: string, academyId: string, newData: any) => Promise<void>;
    onApproveDoc: (academyId: string, type: string) => Promise<void>;
    onRejectDoc: (academyId: string, type: string) => void;
    onDeleteAcademy: (academy: AcademyWithProfile) => void;
    onRestore?: (id: string) => Promise<void>;
    processingId: string | null;
}

export const AdminAcademyDetailsModal: React.FC<AdminAcademyDetailsModalProps> = ({
    isOpen,
    onClose,
    academy,
    onApproveAcademy,
    onApproveUpdate,
    onApproveDoc,
    onRejectDoc,
    onDeleteAcademy,
    onRestore,
    processingId
}) => {
    const [viewingProfId, setViewingProfId] = useState<string | null>(null);
    const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);

    if (!isOpen || !academy) return null;

    const isDeleted = academy.deleted === 'yes';

    const isImage = (url?: string) => {
        if (!url) return false;
        return url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    };

    const handleDownload = async (url: string, filename: string) => {
        setDownloadingUrl(url);
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            window.open(url, '_blank');
        } finally {
            setDownloadingUrl(null);
        }
    };

    const getStatusLabel = (status?: DocumentStatus) => {
        switch(status) {
            case DocumentStatus.MISSING: return 'Pendente';
            case DocumentStatus.PENDING: return 'Enviado';
            case DocumentStatus.APPROVED: return 'Aprovado';
            case DocumentStatus.REJECTED: return 'Recusado';
            default: return 'Pendente';
        }
    };

    const getStatusColor = (status?: DocumentStatus) => {
        switch(status) {
            case DocumentStatus.MISSING: return 'text-orange-500';
            case DocumentStatus.PENDING: return 'text-blue-500';
            case DocumentStatus.APPROVED: return 'text-green-500';
            case DocumentStatus.REJECTED: return 'text-red-500';
            default: return 'text-gray-400';
        }
    };

    const displayCpf = academy.responsibleCpf || academy.ownerProfile?.cpf || 'Não informado';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
            <div className={`bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide rounded-[2.5rem] shadow-2xl relative border dark:border-slate-700
                ${isDeleted ? 'ring-4 ring-red-500/10' : ''}
            `}>
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors z-20">
                    <X size={28}/>
                </button>
                
                <div className="p-8 md:p-12 space-y-10">
                    {/* Cabeçalho do Perfil da Academia */}
                    <div className="flex flex-col items-center text-center space-y-4 mb-8">
                        <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center text-indigo-600 font-black text-2xl shadow-inner border-4 border-white dark:border-slate-800">
                            {academy.name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center justify-center gap-3">
                                <h3 className="text-3xl font-black dark:text-white tracking-tight leading-tight">{academy.name}</h3>
                                {isDeleted && (
                                    <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded-full flex items-center gap-1 shadow-lg shadow-red-500/20 animate-pulse">
                                        <Trash2 size={12}/> Na Lixeira
                                    </span>
                                )}
                            </div>
                            <p className="text-cbjjs-blue font-bold text-sm uppercase tracking-widest">{academy.teamName || 'Equipe não informada'}</p>
                        </div>
                    </div>

                    {/* Informações de Professor e Vínculo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y dark:border-slate-700">
                        <div 
                            onClick={() => setViewingProfId(academy.ownerId)}
                            className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 p-4 rounded-2xl transition-all border border-transparent hover:border-blue-100"
                        >
                            <span className={modalLabelClass}>Professor Responsável</span>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 group-hover:bg-cbjjs-blue group-hover:text-white rounded-xl flex items-center justify-center text-cbjjs-blue transition-colors">
                                    <UserIcon size={20}/>
                                </div>
                                <div>
                                    <p className="font-bold text-sm dark:text-white group-hover:text-cbjjs-blue transition-colors">{academy.ownerProfile?.fullName}</p>
                                    <p className="text-xs text-gray-500">{academy.ownerProfile?.email}</p>
                                    <p className="text-[9px] font-black text-cbjjs-blue uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Clique para ver documentos <ExternalLink size={10}/></p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><span className={modalLabelClass}>CPF Resp.</span><p className="font-bold dark:text-white text-sm">{displayCpf}</p></div>
                            <div><span className={modalLabelClass}>Telefone</span><p className="font-bold dark:text-white text-sm flex items-center gap-2"><Phone size={14}/> {academy.phone || '-'}</p></div>
                            <div><span className={modalLabelClass}>CNPJ</span><p className="font-bold dark:text-white text-sm">{academy.cnpj || 'Não inf.'}</p></div>
                            <div><span className={modalLabelClass}>Status Unidade</span><span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${academy.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{academy.status === 'APPROVED' ? 'APROVADA' : 'EM ANÁLISE'}</span></div>
                        </div>
                        <div className="md:col-span-2">
                            <span className={modalLabelClass}>Endereço da Unidade</span>
                            <div className="flex items-start gap-2 p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-800 mt-2">
                                <MapPin size={18} className="text-cbjjs-blue mt-0.5 flex-shrink-0"/>
                                <p className="text-sm dark:text-gray-300 font-medium leading-relaxed">
                                    {academy.address?.street}, {academy.address?.number} {academy.address?.complement ? `- ${academy.address.complement}` : ''}<br/>
                                    {academy.address?.city} - {academy.address?.state} (CEP: {academy.address?.zip})
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Documentação da Academia */}
                    {!isDeleted && (
                        <div className="space-y-6">
                            <h4 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-4">Documentação da Academia</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { key: 'blackBeltCertificate', label: 'Diploma Faixa Preta' },
                                    { key: 'identityDocument', label: 'Identidade do Responsável' }
                                ].map(docInfo => {
                                    const doc = academy[docInfo.key as keyof Academy] as any;
                                    const isApproved = doc?.status === DocumentStatus.APPROVED;
                                    
                                    return (
                                        <div key={docInfo.key} className="p-6 bg-gray-50 dark:bg-slate-900 rounded-[2rem] border dark:border-slate-700 shadow-sm">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-tight">{docInfo.label}</span>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${getStatusColor(doc?.status)} bg-white dark:bg-slate-800 shadow-sm border dark:border-slate-700`}>
                                                    {getStatusLabel(doc?.status)}
                                                </span>
                                            </div>
                                            
                                            <div className="relative group rounded-2xl overflow-hidden border dark:border-slate-700 bg-white dark:bg-slate-800 aspect-video flex items-center justify-center mb-4">
                                                {doc?.url ? (
                                                    <>
                                                        {isImage(doc.url) ? (
                                                            <img src={doc.url} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <FileText size={48} className="text-gray-300" />
                                                        )}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <a href={doc.url} target="_blank" className="p-3 bg-white rounded-full text-cbjjs-blue shadow-lg hover:scale-110 transition-transform"><ExternalLink size={24}/></a>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center px-4">
                                                        <AlertCircle size={24} className="text-orange-200 mx-auto mb-1"/>
                                                        <span className="text-[9px] text-gray-400 font-black uppercase">Não Enviado</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {doc?.url && (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <button 
                                                            onClick={() => onApproveDoc(academy.id, docInfo.key)} 
                                                            disabled={isApproved || !!processingId} 
                                                            className="bg-cbjjs-green text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-green-500/10 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
                                                        >
                                                            {processingId === `${academy.id}-${docInfo.key}` ? <Loader2 className="animate-spin mx-auto" size={14}/> : 'Aprovar'}
                                                        </button>
                                                        <button 
                                                            onClick={() => onRejectDoc(academy.id, docInfo.key)} 
                                                            disabled={isApproved || doc?.status === DocumentStatus.REJECTED || !!processingId} 
                                                            className="bg-red-600 text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-500/10 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                                                        >
                                                            Recusar
                                                        </button>
                                                    </div>

                                                    {doc?.status === DocumentStatus.REJECTED && doc?.rejectionReason && (
                                                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">
                                                            Motivo: {doc.rejectionReason}
                                                        </p>
                                                    )}

                                                    <button 
                                                        onClick={() => handleDownload(doc.url, `${docInfo.key}_${academy.name.replace(/\s+/g, '_')}`)}
                                                        disabled={downloadingUrl === doc.url}
                                                        className="w-full py-3 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95 border border-transparent hover:border-gray-300 disabled:opacity-50"
                                                    >
                                                        {downloadingUrl === doc.url ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
                                                        Baixar Documento
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Ação de Aprovação Global da Academia e Exclusão */}
                    <div className="pt-10 border-t dark:border-slate-700 flex flex-col gap-4">
                        {isDeleted ? (
                            <button 
                                onClick={() => onRestore?.(academy.id)} 
                                disabled={processingId?.startsWith('restore')}
                                className="w-full bg-cbjjs-blue text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                            >
                                {processingId?.startsWith('restore') ? <Loader2 className="animate-spin" size={20}/> : <RotateCcw size={20}/>}
                                Restaurar Unidade da Lixeira
                            </button>
                        ) : (
                            <>
                                {academy.status === RegistrationStatus.PENDING && (
                                    <button 
                                        onClick={() => onApproveAcademy(academy.id)} 
                                        disabled={processingId === academy.id}
                                        className="w-full bg-cbjjs-blue text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {processingId === academy.id ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20}/>}
                                        Aprovar Cadastro Completo da Unidade
                                    </button>
                                )}
                                
                                <button 
                                    onClick={() => onDeleteAcademy(academy)}
                                    className="w-full py-4 text-red-500 font-black uppercase text-xs tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all flex items-center justify-center gap-2 border border-transparent hover:border-red-100"
                                >
                                    <Trash2 size={18}/> Mover para Lixeira
                                </button>
                            </>
                        )}
                    </div>

                    {/* Revisão de Atualização de Dados */}
                    {academy.pendingChangeRequest && !isDeleted && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 space-y-6">
                            <div className="flex items-center gap-3">
                                <RefreshCw className="text-cbjjs-blue" size={24} />
                                <h4 className="text-sm font-black text-blue-900 dark:text-blue-100 uppercase tracking-widest">Solicitação de Alteração de Dados</h4>
                            </div>
                            {/* ... (restante do código de change request) */}
                        </div>
                    )}
                </div>
            </div>

            <AdminProfessorDetailsModal 
                isOpen={!!viewingProfId}
                onClose={() => setViewingProfId(null)}
                professorId={viewingProfId}
            />
        </div>
    );
};