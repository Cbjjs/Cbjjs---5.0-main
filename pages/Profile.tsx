import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, DocumentStatus, PaymentStatus, RegistrationStatus } from '../types';
import { supabase } from '../lib/supabase';
import { Save, RefreshCw, Smartphone, Printer, MessageCircle, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { PaymentModal } from '../components/PaymentModal';
import { PaymentInviteModal, PaymentPlanOption } from '../components/PaymentInviteModal';
import { BillingDataModal } from '../components/BillingDataModal';
import { GraduationHistory } from '../components/GraduationHistory';
import { fetchAddressByZip } from '../utils/address';

// Sub-componentes refatorados
import { FederationStatusSection } from '../components/profile/FederationStatusSection';
import { DocumentsSection } from '../components/profile/DocumentsSection';
import { PersonalInfoSection } from '../components/profile/PersonalInfoSection';
import { AcademySection } from '../components/profile/AcademySection';

export const Profile: React.FC = () => {
  const { user, updateUser, refreshProfile } = useAuth();
  const { addToast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [loadingZip, setLoadingZip] = useState(false);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

  // Estados para troca rápida de academia
  const [isAcademyModalOpen, setIsAcademyModalOpen] = useState(false);
  const [tempAcademyId, setTempAcademyId] = useState<string | undefined>(undefined);
  
  const [availablePlans, setAvailablePlans] = useState<PaymentPlanOption[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlanOption | null>(null);
  const [paymentData, setPaymentData] = useState({ pixId: '', pixCode: '', qrCodeBase64: '', amount: '0,00' });
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
        const { data } = await supabase.from('system_settings').select('*').like('key', 'plan_%');
        const getVal = (k: string, def: string) => data?.find(s => s.key === k)?.value || def;

        const plans: PaymentPlanOption[] = [];
        
        if (getVal('plan_digital_active', 'true') === 'true') {
            plans.push({
                id: 'DIGITAL',
                title: 'Versão Digital',
                price: parseFloat(getVal('plan_digital_price', '30.00')),
                description: 'Tenha seu cadastro na CBJJS com carterinha digital disponível no menu Minha carteirinha.',
                icon: Smartphone,
                color: 'blue'
            });
        }

        if (getVal('plan_printed_active', 'true') === 'true') {
            plans.push({
                id: 'PRINTED',
                title: 'Versão Impressa',
                price: parseFloat(getVal('plan_printed_price', '35.00')),
                description: 'Tenha seu cadastro na CBJJS com carterinha digital e versão IMPRESSA para você.',
                icon: Printer,
                color: 'green',
                featured: true
            });
        }
        setAvailablePlans(plans);
    };
    fetchPlans();

    const params = new URLSearchParams(window.location.search);
    if (params.get('show_payment') === 'true' && user?.paymentStatus !== PaymentStatus.PAID) {
        setIsInviteModalOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  if (!user) return null;

  // LÓGICA DE APROVAÇÃO: Agora exige obrigatoriamente que a ACADEMIA esteja aprovada (RegistrationStatus.APPROVED)
  const isAcademyApproved = user.academy?.status === RegistrationStatus.APPROVED;
  
  const isFederationApproved = user.isFederationApproved || (
    isAcademyApproved &&
    user.documents.identity.status === DocumentStatus.APPROVED && 
    user.documents.profile?.status === DocumentStatus.APPROVED &&
    user.documents.medical?.status === DocumentStatus.APPROVED &&
    user.documents.belt?.status === DocumentStatus.APPROVED &&
    user.paymentStatus === PaymentStatus.PAID
  );

  const handleZipLookup = async (zip: string) => {
    const cleanZip = zip.replace(/\D/g, '');
    if (cleanZip.length === 8) {
      setLoadingZip(true);
      const addressData = await fetchAddressByZip(cleanZip);
      setLoadingZip(false);
      if (addressData) {
        setEditForm(prev => ({
          ...prev,
          address: {
            ...prev.address!,
            zip: cleanZip.replace(/^(\d{5})(\d)/, '$1-$2'),
            street: addressData.street,
            city: addressData.city,
            state: addressData.state,
            complement: addressData.complement || prev.address?.complement || ''
          }
        }));
      }
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
        const wasAcademyChanged = editForm.academyId && editForm.academyId !== user.academyId;
        
        await updateUser(editForm);
        
        if (wasAcademyChanged) {
            addToast('success', "Academia alterada! Seu perfil agora aguarda aprovação do novo professor.");
            // Força o fechamento da edição e atualização dos dados locais
            setIsEditing(false);
            await refreshProfile();
        } else {
            addToast('success', "Perfil atualizado!");
            setIsEditing(false);
        }
    } catch (error: any) { 
        addToast('error', error.message); 
    } finally { 
        setIsSubmitting(false); 
    }
  };

  const handleSaveAcademyOnly = async () => {
    if (!tempAcademyId || tempAcademyId === user.academyId) {
        setIsAcademyModalOpen(false);
        return;
    }
    
    setIsSubmitting(true);
    try {
        await updateUser({ academyId: tempAcademyId });
        addToast('success', "Academia alterada! Aguarde a aprovação do novo professor.");
        setIsAcademyModalOpen(false);
        await refreshProfile();
    } catch (error: any) {
        addToast('error', error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleManualPaymentCheck = async () => {
      setIsCheckingPayment(true);
      try {
          await refreshProfile();
          await new Promise(r => setTimeout(r, 1500));
          const { data } = await supabase.from('profiles').select('payment_status').eq('id', user.id).single();
          
          if (data?.payment_status === 'PAID') {
              addToast('success', "Pagamento identificado com sucesso!");
          } else {
              addToast('info', "Pagamento ainda não foi realizado ou está em processamento.");
          }
      } catch (err) {
          addToast('error', "Falha ao sincronizar dados. Tente novamente.");
      } finally {
          setIsCheckingPayment(false);
      }
  };

  const onInvitePay = (plan: PaymentPlanOption) => {
      setSelectedPlan(plan);
      setIsInviteModalOpen(false);
      setIsBillingModalOpen(true);
  };

  const handleGeneratePix = async (billingData: { name: string, email: string, taxId: string, phone: string }) => {
      if (!selectedPlan) return;
      setIsGeneratingPayment(true);
      try {
          if (!user.phone || user.phone !== billingData.phone) {
              await supabase.from('profiles').update({ phone: billingData.phone }).eq('id', user.id);
          }

          const { data, error } = await supabase.functions.invoke('create-abacate-billing', {
              body: { 
                  amount: selectedPlan.price, 
                  plan: selectedPlan.id,
                  customerData: billingData
              }
          });
          if (error) throw error;
          const pixInfo = data.data;
          setPaymentData({
              pixId: pixInfo.id || '', pixCode: pixInfo.brCode || '',
              qrCodeBase64: pixInfo.brCodeBase64 || '', amount: selectedPlan.price.toFixed(2).replace('.', ',')
          });
          setIsBillingModalOpen(false);
          setIsPaymentModalOpen(true);
      } catch (error: any) {
          addToast('error', error.message || 'Erro ao gerar cobrança.');
      } finally { setIsGeneratingPayment(false); }
  };

  const getWhatsAppLink = () => {
    const text = encodeURIComponent(`Olá, estou tendo dificuldades em confirmar meu pagamento, meu email é ${user.email}`);
    return `https://wa.me/5521988649788?text=${text}`;
  };

  return (
    <div className="animate-fadeIn space-y-8 pb-20 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Meu Cadastro</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Mantenha seus dados sempre atualizados.</p>
         </div>
         <div className="flex flex-wrap gap-3">
             {!isEditing ? (
                 <button onClick={() => {
                    setEditForm({
                        fullName: user.fullName, email: user.email, cpf: user.cpf, phone: user.phone, dob: user.dob,
                        nationality: user.nationality, address: user.address ? { ...user.address } : { zip: '', street: '', city: '', state: '', number: '', complement: '' },
                        athleteData: { ...user.athleteData! },
                        academyId: user.academyId
                    });
                    setIsEditing(true);
                 }} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all text-sm">
                     <RefreshCw size={16} /> Atualizar Perfil
                 </button>
             ) : (
                 <>
                    <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-500 text-sm">Cancelar</button>
                    <button onClick={handleSave} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-cbjjs-green text-white rounded-xl font-bold shadow hover:bg-green-700 text-sm">
                        <Save size={16} /> {isSubmitting ? 'Salvando...' : 'Salvar'}
                    </button>
                 </>
             )}
         </div>
      </div>

      {/* AVISO DE ACADEMIA PENDENTE */}
      {!isAcademyApproved && user.academyId && (
          <div className="p-5 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 rounded-2xl flex flex-col gap-4 animate-fadeIn shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-amber-600">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h4 className="font-black text-amber-800 dark:text-amber-200 uppercase text-xs tracking-widest mb-1">Aguardando Professor</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                        Você vinculou seu perfil à unidade <span className="font-bold">"{user.academy?.name}"</span>. 
                        O professor responsável precisa aprovar sua entrada para que sua filiação seja validada.
                    </p>
                </div>
              </div>

              <button 
                onClick={() => {
                    setTempAcademyId(user.academyId);
                    setIsAcademyModalOpen(true);
                }}
                className="w-fit px-5 py-2.5 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 active:scale-95"
              >
                  Deseja alterar academia?
              </button>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-6">
            <FederationStatusSection 
              user={user} 
              isFederationApproved={isFederationApproved} 
              onPayClick={() => setIsInviteModalOpen(true)}
              onCheckPayment={handleManualPaymentCheck}
              isCheckingPayment={isCheckingPayment}
            />

            <AcademySection 
              user={user}
              isEditing={isEditing}
              selectedAcademyId={editForm.academyId}
              onAcademyChange={(id) => setEditForm(prev => ({ ...prev, academyId: id }))}
            />

            <DocumentsSection user={user} />
        </div>

        <div className="lg:col-span-2 space-y-6">
            <PersonalInfoSection 
              user={user}
              isEditing={isEditing}
              editForm={editForm}
              onEditChange={(updates) => setEditForm(prev => ({ ...prev, ...updates }))}
              loadingZip={loadingZip}
              onZipChange={handleZipLookup}
            />
            <GraduationHistory 
                athleteData={isEditing ? editForm.athleteData : user.athleteData} 
                isEditing={isEditing}
                onUpdate={(updates) => setEditForm(prev => ({ ...prev, athleteData: { ...prev.athleteData!, ...updates } }))}
            />
        </div>
      </div>

      {user.paymentStatus !== PaymentStatus.PAID && (
          <a 
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-10 right-8 z-[100] flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-full shadow-2xl transition-all hover:scale-105"
          >
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Suporte Financeiro</span>
                <span className="text-sm font-bold whitespace-nowrap">Problemas para confirmar pagamento?</span>
            </div>
            <div className="bg-white/20 p-2 rounded-full">
                <MessageCircle size={24} fill="currentColor" className="text-white" />
            </div>
          </a>
      )}

      <PaymentInviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} onPay={onInvitePay} isLoading={false} availablePlans={availablePlans} />
      
      <BillingDataModal 
        isOpen={isBillingModalOpen} 
        onClose={() => setIsBillingModalOpen(false)} 
        initialData={{ name: user.fullName, email: user.email, taxId: user.cpf || '', phone: user.phone || '' }} 
        onConfirm={handleGeneratePix} 
        isLoading={isGeneratingPayment}
      />

      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} pixId={paymentData.pixId} pixCode={paymentData.pixCode} qrCodeBase64={paymentData.qrCodeBase64} amount={paymentData.amount} onSuccess={() => refreshProfile()} />

      {/* MODAL ALTERAR ACADEMIA */}
      {isAcademyModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border dark:border-slate-700">
            <div className="p-8 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <h2 className="text-2xl font-black dark:text-white tracking-tighter">Alterar Academia</h2>
              <button 
                onClick={() => setIsAcademyModalOpen(false)} 
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X size={28}/>
              </button>
            </div>
            <div className="p-8">
              <AcademySection 
                user={user}
                isEditing={true}
                selectedAcademyId={tempAcademyId}
                onAcademyChange={(id) => setTempAcademyId(id)}
              />
              <button 
                onClick={handleSaveAcademyOnly}
                disabled={isSubmitting || !tempAcademyId || tempAcademyId === user.academyId}
                className="w-full mt-8 bg-cbjjs-blue text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                Confirmar Troca de Unidade
              </button>
              <p className="mt-4 text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
                Seu cadastro voltará para aprovação do novo professor.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};