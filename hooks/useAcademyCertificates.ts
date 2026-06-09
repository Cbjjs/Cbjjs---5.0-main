import { useState } from 'react';
import { useSupabaseQuery } from './useSupabaseQuery';
import { certificateService } from '../services/certificateService';
import { useToast } from '../context/ToastContext';
import { Academy, AcademyCertificate } from '../types';
import { useQueryClient } from '@tanstack/react-query';

export function useAcademyCertificates() {
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedAcademy, setSelectedAcademy] = useState<Academy | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: priceData } = useSupabaseQuery<number>(
        ['certificate-price'],
        async () => {
            const price = await certificateService.getCertificatePrice();
            return { data: price, error: null };
        }
    );

    const handleOpenRequest = (academy: Academy) => {
        setSelectedAcademy(academy);
        setIsRequestModalOpen(true);
    };

    const handleConfirmRequest = async () => {
        if (!selectedAcademy || !priceData?.data) return;

        setIsSubmitting(true);
        try {
            await certificateService.requestCertificate(
                selectedAcademy.id,
                selectedAcademy.ownerId,
                priceData.data
            );
            
            setIsRequestModalOpen(false);
            setIsPaymentModalOpen(true);
            queryClient.invalidateQueries({ queryKey: ['my-academies'] });
        } catch (error: any) {
            addToast('error', error.message || 'Erro ao processar solicitação.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        isRequestModalOpen,
        setIsRequestModalOpen,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        selectedAcademy,
        certificatePrice: priceData?.data || 150,
        handleOpenRequest,
        handleConfirmRequest,
        isSubmitting
    };
}