import React, { useState } from 'react';
import { X, CheckCircle, ChevronRight, QrCode, Building, MapPin, DollarSign, Loader2 } from 'lucide-react';
import { Academy } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface RequestCertificateModalProps {
    academy: Academy;
    price: number;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (academy: Academy) => Promise<boolean>;
    isSubmitting: boolean;
}

export const RequestCertificateModal: React.FC<RequestCertificateModalProps> = ({
    academy, price, isOpen, onClose, onConfirm, isSubmitting
}) => {
    const [step, setStep] = useState(1);

    if (!isOpen) return null;

    const handleNext = async () => {
        if (step === 1) {
            const success = await onConfirm(academy);
            if (success) {
                setStep(2);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border dark:border-slate-700 m-auto relative">
                <button 
                    onClick={onClose}
                    className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-10"
                >
                    <X size={28}/>
                </button>

                <div className="p-10 md:p-12">
                    {step === 1 ? (
                        <div className="space-y-8 animate-fadeIn">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-cbjjs-blue/10 rounded-2xl flex items-center justify-center text-cbjjs-blue">
                                    <Building size={24} />
                                </div>
                                <h2 className="text-2xl font-black dark:text-white tracking-tight uppercase">Confirmar Dados</h2>
                            </div>

                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                Verifique se as informações da sua academia estão corretas para a emissão do certificado.
                            </p>

                            <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-3xl space-y-4 border border-gray-100 dark:border-slate-700">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Academia / Equipe</label>
                                    <p className="text-lg font-black dark:text-white">{academy.teamName || academy.name}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin size={16} className="text-cbjjs-blue mt-1 shrink-0" />
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Localização</label>
                                        <p className="text-sm font-bold dark:text-gray-300 leading-tight">
                                            {academy.address?.city} - {academy.address?.state}<br/>
                                            {academy.address?.street}, {academy.address?.number}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-cbjjs-blue/5 rounded-3xl border border-cbjjs-blue/10">
                                <div className="flex items-center gap-3 text-cbjjs-blue">
                                    <DollarSign size={20} />
                                    <span className="text-xs font-black uppercase tracking-widest">Valor do Certificado</span>
                                </div>
                                <span className="text-xl font-black text-cbjjs-blue">{formatCurrency(price)}</span>
                            </div>

                            <button 
                                onClick={handleNext}
                                disabled={isSubmitting}
                                className="w-full bg-cbjjs-blue text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <ChevronRight size={20}/>}
                                {isSubmitting ? 'Gerando Pedido...' : 'Confirmar e Ir para Pagamento'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fadeIn text-center">
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-6">
                                    <QrCode size={32} />
                                </div>
                                <h2 className="text-3xl font-black dark:text-white tracking-tight uppercase mb-2">Pagamento PIX</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium max-w-xs mx-auto">
                                    Escaneie o QR Code abaixo com o app do seu banco para concluir o pagamento via Abacate Pay.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-3xl shadow-inner border border-gray-100 flex justify-center mx-auto w-fit">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ABACATE_PAY_PLACEHOLDER_${academy.id}`} 
                                    alt="QR Code Pagamento" 
                                    className="w-48 h-48"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl">
                                    <p className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase leading-relaxed">
                                        Após o pagamento, o status do seu certificado será atualizado automaticamente em alguns minutos.
                                    </p>
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={20}/> Concluído
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
