export const formatDateBR = (dateString: string | undefined | null): string => {
  if (!dateString) return '---';
  
  try {
    // Se já estiver no formato DD/MM/YYYY, retorna como está
    if (dateString.includes('/') && dateString.length === 10) return dateString;

    // Remove qualquer parte de tempo se houver (ex: 2024-01-01T10:00:00)
    const cleanDate = dateString.split('T')[0];
    
    // Suporta YYYY-MM-DD
    if (cleanDate.includes('-')) {
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        // Verifica se o primeiro item é o ano (4 dígitos)
        if (parts[0].length === 4) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        // Caso já esteja invertido por algum motivo
        return `${parts[0]}/${parts[1]}/${parts[2]}`;
      }
    }
    
    return dateString;
  } catch (e) {
    console.error("[FORMAT] Erro ao formatar data:", dateString);
    return dateString || '---';
  }
};