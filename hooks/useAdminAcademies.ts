import { useState } from 'react';
import { useSupabaseQuery } from './useSupabaseQuery';
import { academyService, AcademyWithProfile } from '../services/academyService';
import { useToast } from '../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { DocumentStatus } from '../types';

export function useAdminAcademies() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const PAGE_SIZE = 10;

  const [subTab, setSubTab] = useState<'approvals' | 'all' | 'trash'>('approvals');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [viewingAcademy, setViewingAcademy] = useState<AcademyWithProfile | null>(null);
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [rejectingDoc, setRejectingDoc] = useState<{ academyId: string, type: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: queryData, isLoading, isError, refetch, isFetching } = useSupabaseQuery<{data: AcademyWithProfile[], total: number}>(
    ['admin-academies', subTab, searchTerm, page],
    async (signal) => {
      try {
        const result = await academyService.getAdminAcademies({
          subTab, searchTerm, page, pageSize: PAGE_SIZE
        });
        return { data: result, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    }
  );

  const academies = queryData?.data?.data || [];
  const totalCount = queryData?.data?.total || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleApproveDoc = async (academyId: string, type: string) => {
    setProcessingId(`${academyId}-${type}`);
    try {
      await academyService.updateAcademyDocumentStatus(academyId, type, DocumentStatus.APPROVED);
      addToast('success', "Documento aprovado!");
      queryClient.invalidateQueries({ queryKey: ['admin-academies'] });
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectDoc = (academyId: string, type: string) => {
    setRejectingDoc({ academyId, type });
    setRejectionReason('');
  };

  const confirmRejectDoc = async () => {
    if (!rejectingDoc || !rejectionReason.trim()) return;
    const { academyId, type } = rejectingDoc;
    
    setProcessingId('rejecting');
    try {
      await academyService.updateAcademyDocumentStatus(academyId, type, DocumentStatus.REJECTED, rejectionReason);
      addToast('success', "Documento recusado.");
      setRejectingDoc(null);
      setViewingAcademy(null);
      queryClient.invalidateQueries({ queryKey: ['admin-academies'] });
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAcademy = async (academyId: string) => {
    setProcessingId(academyId);
    try {
      await academyService.approveAcademy(academyId);
      addToast('success', "Academia aprovada!");
      setViewingAcademy(null);
      queryClient.invalidateQueries({ queryKey: ['admin-academies'] });
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmDelete = async (academyId: string) => {
    setIsDeleting(true);
    try {
      await academyService.deleteAcademy(academyId);
      addToast('success', "Unidade movida para a lixeira.");
      queryClient.invalidateQueries({ queryKey: ['admin-academies'] });
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async (academyId: string) => {
    setProcessingId(`restore-${academyId}`);
    try {
      await academyService.restoreAcademy(academyId);
      addToast('success', "Unidade restaurada!");
      queryClient.invalidateQueries({ queryKey: ['admin-academies'] });
      setViewingAcademy(null);
    } catch (err: any) {
      addToast('error', "Falha ao restaurar.");
    } finally {
      setProcessingId(null);
    }
  };

  return {
    academies, totalCount, totalPages, isLoading, isFetching, isError,
    subTab, searchTerm, page, viewingAcademy, processingId, isDeleting,
    rejectingDoc, rejectionReason,
    setSubTab: (tab: any) => { setSubTab(tab); setPage(1); },
    setSearchTerm: (term: string) => { setSearchTerm(term); setPage(1); },
    setPage, setViewingAcademy, setRejectingDoc, setRejectionReason,
    refetch, handleApproveAcademy, handleConfirmDelete, handleRestore,
    handleApproveDoc, handleRejectDoc, confirmRejectDoc
  };
}