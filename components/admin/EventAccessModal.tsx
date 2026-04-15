import React from 'react';
import { X, ShieldCheck, ShieldAlert } from 'lucide-react';
import { User, PaymentStatus } from '../../types';
import { IDCardView } from '../id-card/IDCardView';

interface EventAccessModalProps {
  user: User | null;
  onClose: () => void;
}

export const EventAccessModal: React.FC<EventAccessModalProps> = ({ user, onClose }) => {
  if (!user) return null;

  const isPaid = user.paymentStatus === PaymentStatus.PAID;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border dark:border-slate-700 relative animate-fadeIn">
        
        <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all z-20"
        >
            <X size={32}/>
        </button>

        <div className="p-8 md:p-12">
            <div className="mb-8">
                <h3 className="text-2xl font-black dark:text-white tracking-tight">Validação de Acesso</h3>
                <p className="text-gray-500 text-sm font-medium">Confirme a identidade e o status financeiro do atleta.</p>
            </div>

            <div className="w-full flex justify-center mb-10">
                <IDCardView 
                    fullName={user.fullName}
                    profileImage={user.profileImage}
                    federationId={user.federationId}
                    dob={user.dob}
                    belt={user.athleteData?.belt || 'Branca'}
                    academyName={user.academy?.name || 'Unidade não informada'}
                    paymentConfirmedAt={user.paymentConfirmedAt}
                    responsavel={user.isDependent ? user.parentName : undefined}
                />
            </div>

            <div className="pt-8 border-t dark:border-slate-700">
                <div className={`flex flex-col md:flex-row items-center justify-between p-6 rounded-3xl border-2 transition-all
                    ${isPaid 
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/50' 
                        : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/50'}
                `}>
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm
                            ${isPaid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
                        `}>
                            {isPaid ? <ShieldCheck size={40} /> : <ShieldAlert size={40} />}
                        </div>
                        <div>
                            <h4 className={`text-lg font-black uppercase tracking-tight ${isPaid ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                                {isPaid ? 'Anuidade em Dia' : 'Anuidade Pendente'}
                            </h4>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {isPaid ? 'Atleta autorizado para participação no evento.' : 'Pagamento não identificado no sistema.'}
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className={`px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95
                            ${isPaid 
                                ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/20' 
                                : 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/20'}
                        `}
                    >
                        {isPaid ? 'Liberar Entrada' : 'Fechar'}
                    </button>
                </div>
            </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Confederação Brasileira de Jiu-Jitsu Social • Sistema de Acesso</p>
        </div>
      </div>
    </div>
  );
};