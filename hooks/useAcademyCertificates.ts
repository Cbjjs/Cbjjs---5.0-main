import { useState, useEffect } from 'react';
import { certificateService } from '../services/certificateService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Academy, AcademyCertificate } from '../types';

export const useAcademyCertificates = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [price, setPrice] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    const [myCertificates, setMyCertificates] = useState<AcademyCertificate[]>([]);

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const p = await certificateService.getCertificatePrice();
                setPrice(p);
            } catch (err) {
                console.error('Erro ao buscar preço do certificado:', err);
            }
        };

        if (user) {
            fetchPrice();
            fetchMyCertificates();
        }
    }, [user]);

    const fetchMyCertificates = async () => {
        if (!user) return;
        try {
            const certs = await certificateService.getMyCertificates(user.id);
            setMyCertificates(certs);
        } catch (err) {
            console.error('Erro ao buscar meus certificados:', err);
        }
    };

    const handleRequest = async (academy: Academy) => {
        if (!user) return;
        setIsRequesting(true);
        try {
            await certificateService.requestCertificate(academy.id, user.id, price);
            addToast('success', 'Solicitação de certificado enviada!');
            fetchMyCertificates();
            return true;
        } catch (err) {
            addToast('error', 'Erro ao solicitar certificado. Tente novamente.');
            console.error(err);
            return false;
        } finally {
            setIsRequesting(false);
        }
    };

    return {
        price,
        loading,
        isRequesting,
        myCertificates,
        handleRequest,
        fetchMyCertificates
    };
};
