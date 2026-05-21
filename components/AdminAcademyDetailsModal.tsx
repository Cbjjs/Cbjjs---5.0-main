import React, { useState } from 'react';
import { X, FileText, CheckCircle, MapPin, Phone, User as UserIcon, ExternalLink, Loader2, Download, Trash2, RotateCcw } from 'lucide-react';
import { Academy, RegistrationStatus, DocumentStatus } from '../types';
import { modalLabelClass } from './AdminShared';

interface AcademyWithProfile extends Academy {
    ownerProfile?: { fullName: string; email: string; dob: string; cpf: string; };
    deleted?: string;
}

interface AdminAcademyDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    academy: AcademyWithProfile | null;
    onApproveAcademy: (id: string) => Promise<void>;
    onApproveDoc: (academyId: string, type: string) => Promise<void>;
    onRejectDoc: (academyId: string, type: string) => void;
    onDeleteAcademy: (academy: AcademyWithProfile) => void;
    onRestore?: (id: string) => Promise<void>;
    processingId: string | null;
    onApproveUpdate: any;
}

export const AdminAcademyDetailsModal: React.FC<AdminAcademyDetailsModalProps> = ({
    isOpen, onClose, academy, onApproveAcademy, onApproveDoc, onRejectDoc, onDeleteAcademy, onRestore, processingId
}) => {
    if (!isOpen || !academy) return null;
    const isDeleted = academy.deleted === 'yes';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
            <div className={`bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide rounded-[2.5rem] shadow-2xl relative border dark:border-slate-700`}>
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 z-20"><X size={28}/></button>
                <div className="p-8 md:p-12 space-y-10">
                    <div className="flex flex-col items-center text-center space-y-4 mb-8">
                        <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center text-indigo-600 font-black text-2xl shadow-inner border-4 border-white dark:border-slate-800">
                            {academy.name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center justify-center gap-3">
                                <h3 className="text-3xl font-black dark:text-white tracking-tight">{academy.name}</h3>
                                {isDeleted && <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded-full flex items-center gap-1"><Trash2 size={12}/> Na Lixeira</span>}
                            </div>
                            <p className="text-cbjjs-blue font-bold text-sm uppercase tracking-widest">{academy.teamName}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y dark:border-slate-700">
                        <div>
                            <span className={modalLabelClass}>Professor</span>
                            <p className="font-bold text-sm dark:text-white">{academy.ownerProfile?.fullName}</p>
                            <p className="text-xs text-gray-500">{academy.ownerProfile?.email}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><span className={modalLabelClass}>CPF Resp.</span><p className="font-bold dark:text-white text-sm">{academy.responsibleCpf || '-'}</p></div>
                            <div><span className={modalLabelClass}>Telefone</span><p className="font-bold dark:text-white text-sm">{academy.phone || '-'}</p></div>
                        </div>
                    </div>

                    <div className="pt-10 border-t dark:border-slate-700 flex flex-col gap-4">
                        {isDeleted ? (
                            <button 
                                onClick={() => onRestore?.(academy.id)} 
                                disabled={!!processingId}
                                className="w-full bg-cbjjs-blue text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                            >
                                {processingId?.startsWith('restore') ? <Loader2 className="animate-spin" size={20}/> : <RotateCcw size={20}/>} Restaurar Unidade
                            </button>
                        ) : (
                            <>
                                {academy.status === RegistrationStatus.PENDING && (
                                    <button 
                                        onClick={() => onApproveAcademy(academy.id)} 
                                        disabled={processingId === academy.id}
                                        className="w-full bg-cbjjs-blue text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {processingId === academy.id ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20}/>} Aprovar Cadastro
                                    </button>
                                )}
                                <button 
                                    onClick={() => onDeleteAcademy(academy)}
                                    className="w-full py-4 text-red-500 font-black uppercase text-xs tracking-widest hover:bg-red-50 rounded-2xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={18}/> Mover para Lixeira
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};