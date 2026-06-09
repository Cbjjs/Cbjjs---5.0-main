"use client";

import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Award, CheckCircle, Clock, Package, Layers, Calendar, User, School, ExternalLink, ArrowRight } from 'lucide-react';
import { certificateService } from '../services/certificateService';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { AdminListSkeleton, AdminErrorState, PaginationControls } from '../components/AdminShared';
import { AcademyCertificate, CertificateDeliveryStatus, CertificatePaymentStatus } from '../types';
import { formatDateBR } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';

export const AdminAcademyCertificates: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [subTab, setSubTab] = useState<'novos' | 'entregues'>('novos');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: certsData, isLoading, isError, refetch, isFetching } = useSupabaseQuery<AcademyCertificate[]>(
    ['admin-certificates-list'],
    async () => {
      try {
        const result = await certificateService.getAllCertificates();
        return { data: result, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    }
  );

  const allCerts = certsData?.data || [];

  const filteredCerts = useMemo(() => {
    let list = [...allCerts];

    // Filtro por Aba
    if (subTab === 'novos') {
      list = list.filter(c => c.statusDelivery !== 'DELIVERED');
    } else {
      list = list.filter(c => c.statusDelivery === 'DELIVERED');
    }

    // Filtro de Busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(c => 
        (c.academyName?.toLowerCase().includes(term)) || 
        (c.ownerName?.toLowerCase().includes(term))
      );
    }

    return list;
  }, [allCerts, subTab, searchTerm]);

  const handleMarkAsDelivered = async (certId: string) => {
    if (!confirm('Deseja marcar este certificado como ENTREGUE?')) return;
    
    setProcessingId(certId);
    try {
        await certificateService.updateDeliveryStatus(certId, 'DELIVERED');
        addToast('success', 'Status de entrega atualizado!');
        queryClient.invalidateQueries({ queryKey: ['admin-certificates-list'] });
    } catch (err: any) {
        addToast('error', 'Falha ao atualizar status.');
    } finally {
        setProcessingId(null);
    }
  };

  const getStatusPaymentBadge = (status: CertificatePaymentStatus) => {
      if (status === 'PAID') return <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5"><CheckCircle size={12}/> Pago</span>;
      return <span className="bg-orange-50 text-orange-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5"><Clock size={12}/> Pendente</span>;
  };

  const getStatusDeliveryBadge = (status: CertificateDeliveryStatus, payment: CertificatePaymentStatus) => {
      if (status === 'DELIVERED') return <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase">Entregue</span>;
      if (payment === 'PAID') return <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase animate-pulse">Produzindo</span>;
      return <span className="bg-gray-100 text-gray-400 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase">Aguardando Pagamento</span>;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-3xl font-black dark:text-white tracking-tight">Certificados Academias</h2>
                <p className="text-sm text-gray-500 font-medium">Gestão de emissão e entrega de certificados oficiais.</p>
            </div>
            <button 
                onClick={() => refetch()} 
                className="p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-cbjjs-blue hover:bg-gray-50 transition-all shadow-sm"
            >
                <RefreshCw size={20} className={isFetching ? 'animate-spin' : ''} />
            </button>
        </div>

        <div className="flex gap-4 border-b dark:border-slate-700">
            <button 
                onClick={() => setSubTab('novos')}
                className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${subTab === 'novos' ? 'border-cbjjs-blue text-cbjjs-blue' : 'border-transparent text-gray-400'}`}
            >
                <Clock size={14}/> Novos Pedidos
            </button>
            <button 
                onClick={() => setSubTab('entregues')}
                className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${subTab === 'entregues' ? 'border-cbjjs-blue text-cbjjs-blue' : 'border-transparent text-gray-400'}`}
            >
                <CheckCircle size={14}/> Entregues
            </button>
        </div>

        <div className="relative w-full">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Buscar professor ou academia..." 
                className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-cbjjs-blue outline-none transition-all shadow-sm text-sm" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
        </div>

        {isLoading ? (
            <AdminListSkeleton />
        ) : isError ? (
            <AdminErrorState onRetry={() => refetch()} />
        ) : (
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Professor / Academia</th>
                                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Pedido</th>
                                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status Pag</th>
                                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Entrega</th>
                                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-700">
                            {filteredCerts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <Award size={48} className="text-gray-200 mx-auto mb-4 opacity-50" />
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Nenhum certificado encontrado.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCerts.map((cert) => (
                                    <tr key={cert.id} className="hover:bg-blue-50/20 transition-colors group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-cbjjs-blue">
                                                    <School size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm dark:text-white">{cert.academyName}</p>
                                                    <p className="text-[10px] font-black text-cbjjs-blue uppercase tracking-tighter">Prof: {cert.ownerName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold dark:text-gray-300">{formatDateBR(cert.createdAt)}</span>
                                                <span className="text-[9px] font-black text-gray-400 uppercase">Valor: R$ {cert.amount.toFixed(2).replace('.', ',')}</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex justify-center">
                                                {getStatusPaymentBadge(cert.statusPayment)}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex justify-center">
                                                {getStatusDeliveryBadge(cert.statusDelivery, cert.statusPayment)}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex justify-end gap-2">
                                                {cert.statusDelivery !== 'DELIVERED' && (
                                                    <button 
                                                        onClick={() => handleMarkAsDelivered(cert.id)}
                                                        disabled={processingId === cert.id}
                                                        className="px-4 py-2 bg-cbjjs-blue text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-blue-500/10 hover:bg-blue-800 transition-all flex items-center gap-2"
                                                    >
                                                        {processingId === cert.id ? <RefreshCw size={12} className="animate-spin"/> : <Package size={12}/>}
                                                        Marcar Entregue
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  );
};