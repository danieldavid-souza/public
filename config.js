// Este objeto será preenchido dinamicamente
let campaignData = null;

// Função para buscar os dados das campanhas da API
async function fetchCampaigns() {
    if (campaignData) {
        return campaignData;
    }
    try {
        // Alterado para buscar o arquivo JSON diretamente, em vez de uma rota de API.
        const response = await fetch(`/campaigns.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Falha ao buscar campanhas');
        campaignData = await response.json();
        return campaignData;
    } catch (error) {
        console.error('Erro ao carregar campanhas:', error);
        // Retorna um objeto default em caso de falha para não quebrar o site
        return { 'default': { title: 'Campanha Especial', description: 'Produtos selecionados especialmente para você.' } };
    }
}

// Exportamos a função que retorna a promessa com os dados
export const campaignDetails = await fetchCampaigns();