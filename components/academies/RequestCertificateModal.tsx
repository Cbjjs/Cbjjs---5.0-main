"use client";

import React from 'react';
import { X, Building, CheckCircle, ArrowRight, ShieldCheck, MapPin, User, Award, Smartphone } from 'lucide-react';
import { Academy } from '../../types';

interface RequestCertificateModalProps {
    isOpen: boolean;
    onClose: () => void;
    academy: Academy | null;
    price: number;
    onConfirm: () => void;
    isLoading: boolean;
}

export const RequestCertificateModal: React.FC<RequestCertificateModalProps> = ({
    isOpen, onClose, academy, price, onConfirm, isLoading
}) => {
    if (!isOpen || !academy) return null;

    const labelClass = "text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1";
    const valueClass = "font-bold text-gray-900 dark:text-white text-sm";

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative border dark:border-slate-700 overflow-hidden">
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="p-8 md:p-10">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-cbjjs-blue mx-auto mb-4">
                            <Award size={32} />
                        </div>
                        <h3 className="text-2xl font-black dark:text-white tracking-tight leading-tight">Solicitar Certificado Oficial</h3>
                        <p className="text-sm text-gray-500 font-medium mt-1">Confirme os dados da sua unidade antes de prosseguir.</p>
                    </div>

                    <div className="space-y-6 bg-gray-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 mb-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <span className={labelClass}>Unidade</span>
                                <p className={valueClass}>{academy.name}</p>
                            </div>
                            <div>
                                <span className={labelClass}>Equipe</span>
                                <p className={valueClass}>{academy.teamName || '---'}</p>
                            </div>
                            <div className="col-span-2">
                                <span className={labelClass}>Endereço de Emissão</span>
                                <div className="flex gap-2 items-start">
                                    <MapPin size={14} className="text-cbjjs-blue mt-0.5 shrink-0" />
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                        {academy.address?.street}, {academy.address?.number} - {academy.address?.city}/{academy.address?.state}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-900 p-8 rounded-3xl mb-8 text-white w-full shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                        <p className="text-xs uppercase font-bold tracking-widest opacity-70 mb-1">Valor do Certificado</p>
                        <h4 className="text-4xl font-black">R$ {price.toFixed(2).replace('.', ',')}</h4>
                    </div>

                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="w-full py-5 bg-cbjjs-blue text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <><ArrowRight size={18} /> Confirmar e Gerar PIX</>
                        )}
                    </button>
                    
                    <div className="flex items-center justify-center gap-1.5 mt-6 text-gray-400">
                        <ShieldCheck size={14} className="text-green-500" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Processamento Seguro CBJJS</p>
                    </div>
                </div>
            </div>
        </div>
    );
};