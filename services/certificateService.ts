import { supabase } from '../lib/supabase';
import { AcademyCertificate, CertificatePaymentStatus, CertificateDeliveryStatus } from '../types';

export const certificateService = {
  /**
   * Obtém o preço configurado para o certificado da academia
   */
  async getCertificatePrice(): Promise<number> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'academy_certificate_price')
      .single();

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
   * Busca as solicitações de um professor
   */
  async getProfessorCertificates(ownerId: string): Promise<AcademyCertificate[]> {
    const { data, error } = await supabase
      .from('academy_certificates')
      .select('*, academies(name)')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(d => ({
      id: d.id,
      academyId: d.academy_id,
      ownerId: d.owner_id,
      amount: d.amount,
      statusPayment: d.status_payment as CertificatePaymentStatus,
      statusDelivery: d.status_delivery as CertificateDeliveryStatus,
      billingId: d.billing_id,
      createdAt: d.created_at,
      paidAt: d.paid_at,
      academyName: d.academies?.name
    }));
  },

  /**
   * Busca todos os certificados (Admin)
   */
  async getAllCertificates(): Promise<AcademyCertificate[]> {
    const { data, error } = await supabase
      .from('academy_certificates')
      .select('*, academies(name), profiles:owner_id(full_name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((d: any) => ({
      id: d.id,
      academyId: d.academy_id,
      ownerId: d.owner_id,
      amount: d.amount,
      statusPayment: d.status_payment as CertificatePaymentStatus,
      statusDelivery: d.status_delivery as CertificateDeliveryStatus,
      billingId: d.billing_id,
      createdAt: d.created_at,
      paidAt: d.paid_at,
      academyName: d.academies?.name,
      ownerName: d.profiles?.full_name
    }));
  },

  /**
   * Atualiza manualmente o status de entrega (Admin)
   */
  async updateDeliveryStatus(certificateId: string, status: CertificateDeliveryStatus) {
    const { error } = await supabase
      .from('academy_certificates')
      .update({ status_delivery: status })
      .eq('id', certificateId);

    if (error) throw error;
    return true;
  }
};