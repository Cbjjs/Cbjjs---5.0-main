import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { certificateService } from '../services/certificateService';
import { useToast } from '../context/ToastContext';
import { useSupabaseQuery } from './useSupabaseQuery';
import { Academy } from '../types';

export function useAcademyCertificates() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAcademy, setSelectedAcademy] = useState<Academy | null>(null);
  const [isRequesting, setIsSubmitting] = useState(false);

  // Busca preço dinâmico
  const { data: priceData } = useSupabaseQuery<number>(
    ['academy-cert-price'],
    async () => {
      const price = await certificateService.getCertificatePrice();
      return { data: price, error: null };
    }
  );

  const certPrice = priceData?.data || 150.00;

  const handleStartRequest = (academy: Academy) => {
    setSelectedAcademy(academy);
    setIsModalOpen(true);
  };

  const handleConfirmRequest = async () => {
    if (!selectedAcademy || !user) return;
    
    setIsSubmitting(true);
    try {
      await certificateService.requestCertificate(
        selectedAcademy.id,
        user.id,
        certPrice
      );
      return true;
    } catch (err: any) {
      addToast('error', err.message || "Erro ao solicitar certificado.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isModalOpen,
    setIsModalOpen,
    selectedAcademy,
    certPrice,
    isRequesting,
    handleStartRequest,
    handleConfirmRequest
  };
}