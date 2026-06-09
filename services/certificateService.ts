import { supabase } from '../lib/supabase';
import { AcademyCertificate, CertificatePaymentStatus, CertificateDeliveryStatus } from '../types';

export const certificateService = {
    /**
     * Busca o preço atual do certificado nas configurações do sistema
     */
    async getCertificatePrice(): Promise<number> {
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'academy_certificate_price')
            .maybeSingle();

        if (error || !data) return 150.00;
        return parseFloat(data.value);
    },

    /**
     * Cria uma nova solicitação de certificado
     */
    async requestCertificate(academyId: string, ownerId: string, amount: number) {
        const { data, error } = await supabase
            .from('academy_certificates')
            .insert([{
                academy_id: academyId,
                owner_id: ownerId,
                amount: amount,
                status_payment: 'PENDING',
                status_delivery: 'WAITING_PAYMENT'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Busca os certificados de uma academia específica
     */
    async getAcademyCertificate(academyId: string) {
        const { data, error } = await supabase
            .from('academy_certificates')
            .select('*')
            .eq('academy_id', academyId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return {
            id: data.id,
            academyId: data.academy_id,
            ownerId: data.owner_id,
            amount: data.amount,
            statusPayment: data.status_payment as CertificatePaymentStatus,
            statusDelivery: data.status_delivery as CertificateDeliveryStatus,
            createdAt: data.created_at,
            paidAt: data.paid_at
        } as AcademyCertificate;
    },

    /**
     * Busca todos os certificados (Visão Admin)
     */
    async getAllCertificates() {
        const { data, error } = await supabase
            .from('academy_certificates')
            .select(`
                *,
                academies(name),
                profiles:owner_id(full_name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((c: any) => ({
            id: c.id,
            academyId: c.academy_id,
            ownerId: c.owner_id,
            amount: c.amount,
            statusPayment: c.status_payment as CertificatePaymentStatus,
            statusDelivery: c.status_delivery as CertificateDeliveryStatus,
            createdAt: c.created_at,
            paidAt: c.paid_at,
            academyName: c.academies?.name || 'Academia Excluída',
            ownerName: c.profiles?.full_name || 'Professor Excluído'
        })) as AcademyCertificate[];
    },

    /**
     * Atualiza o status de entrega do certificado (Admin)
     */
    async updateDeliveryStatus(id: string, status: CertificateDeliveryStatus) {
        const { error } = await supabase
            .from('academy_certificates')
            .update({ status_delivery: status })
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};