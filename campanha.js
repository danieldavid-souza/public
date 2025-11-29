document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIGURAÇÕES E SELETORES ---
    const WHATSAPP_NUMBER = '5511999999999'; // Insira seu número de WhatsApp
    const productGrid = document.getElementById('product-grid');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    const backToTopBtn = document.getElementById('backToTopBtn');
    const closeModalButton = document.querySelector('.close-button');
    const campaignTitle = document.getElementById('campaignTitle');
    const campaignDescription = document.getElementById('campaignDescription');

    // Mapeamento de IDs de campanha para nomes amigáveis e descrições
    const campaignDetails = {
        'natal': { title: 'Especial de Natal', description: 'Confira nossos produtos selecionados para celebrar o Natal com muito carinho e personalidade.' },
        'dia-das-maes': { title: 'Dia das Mães', description: 'Presentes únicos para a pessoa mais especial da sua vida.' },
        'dia-dos-pais': { title: 'Dia dos Pais', description: 'Surpreenda seu herói com um presente que é a cara dele.' },
        'dia-dos-namorados': { title: 'Dia dos Namorados', description: 'Demonstre seu amor com presentes criativos e românticos.' },
        'dia-das-criancas': { title: 'Dia das Crianças', description: 'Alegria e diversão em forma de presentes para os pequenos.' },
        'dia-dos-avos': { title: 'Dia dos Avós', description: 'Mimos cheios de afeto para celebrar a sabedoria e o carinho dos avós.' },
        'dia-dos-professores': { title: 'Dia dos Professores', description: 'Homenageie quem ensina com o coração.' },
        'setembro-amarelo': { title: 'Setembro Amarelo', description: 'Produtos que inspiram conversas e apoiam a valorização da vida.' },
        'outubro-rosa': { title: 'Outubro Rosa', description: 'Abrace esta causa com produtos que conscientizam e encantam.' },
        'novembro-azul': { title: 'Novembro Azul', description: 'Apoie a saúde masculina com presentes e lembranças especiais.' },
        'volta-as-aulas': { title: 'Volta às Aulas', description: 'Comece o ano letivo com tudo personalizado e organizado.' },
        'dia-do-amigo': { title: 'Dia do Amigo', description: 'Celebre a amizade com presentes que marcam.' },
        'black-friday': { title: 'Black Friday', description: 'As melhores ofertas do ano estão aqui. Aproveite!' },
        'default': { title: 'Campanha Especial', description: 'Produtos selecionados especialmente para você.' }
    };

    let produtos = [];
    let campaignId = 'default';

    // --- FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO ---
    async function initializeApp() {
        const urlParams = new URLSearchParams(window.location.search);
        campaignId = urlParams.get('id') || 'default';

        setInitialTheme();
        updateCampaignInfo();
        await loadAndFilterProducts();
        setupEventListeners();
    }

    // --- ATUALIZAÇÃO DE INFORMAÇÕES DA PÁGINA ---
    function updateCampaignInfo() {
        const details = campaignDetails[campaignId] || campaignDetails['default'];
        campaignTitle.textContent = details.title;
        document.title = `${details.title} - Catálogo Lima Calixto`;
        if (details.description) {
            campaignDescription.innerHTML = `<p>${details.description}</p>`;
        }
    }

    // --- CARREGAMENTO E FILTRAGEM DE DADOS ---
    async function loadAndFilterProducts() {
        try {
            const response = await fetch(`/data.json?v=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            produtos = await response.json();

            const campaignProducts = produtos.filter(p => 
                Array.isArray(p.campanhas) && p.campanhas.includes(campaignId)
            );

            renderProducts(campaignProducts);

        } catch (error) {
            console.error('Falha ao carregar os produtos:', error);
            productGrid.innerHTML = '<p class="error-message">Erro ao carregar produtos da campanha. Tente recarregar a página.</p>';
        }
    }

    // --- RENDERIZAÇÃO ---
    function renderProducts(productsToRender) {
        productGrid.innerHTML = '';

        if (productsToRender.length === 0) {
            productGrid.innerHTML = '<p class="info-message">Nenhum produto encontrado para esta campanha no momento.</p>';
            return;
        }

        productsToRender.forEach(product => {
            const card = createProductCard(product);
            productGrid.appendChild(card);
        });
    }

    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.productId = product.id;

        card.innerHTML = `
            ${product.emPromocao ? '<div class="promo-badge">OFERTA</div>' : ''}
            <img src="${product.imagem}" alt="${product.nome}" loading="lazy">
            <div class="product-info">
                <h3>${product.nome}</h3>
                <p class="category">${product.categoria.replace(/_/g, ' ')}</p>
                <p class="price">R$ ${product.preco.toFixed(2).replace('.', ',')}</p>
            </div>
            <div class="card-actions">
                ${product.linkMockups ? `<a href="${product.linkMockups}" target="_blank" rel="noopener noreferrer" class="mockup-button" onclick="event.stopPropagation()">Ver mais mockups</a>` : ''}
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.mockup-button')) return;
            openModal(product);
        });

        return card;
    }

    // --- MODAL (Reutilizado do script.js original) ---
    function openModal(product) {
        modalBody.innerHTML = `
            <div class="modal-image">
                <img src="${product.imagem}" alt="${product.nome}">
            </div>
            <div class="modal-details">
                <h2>${product.nome}</h2>
                <p class="price">R$ ${product.preco.toFixed(2).replace('.', ',')}</p>
                <p class="stock">Estoque: ${product.estoque > 0 ? `${product.estoque} unidades` : 'Sob consulta'}</p>
                <p class="description">${product.descricao}</p>
                <h3>Especificações</h3>
                <table class="specs-table">
                    <tbody>
                        ${product.especificacoes.material ? `<tr><td>Material</td><td>${product.especificacoes.material}</td></tr>` : ''}
                        ${product.especificacoes.dimensoes ? `<tr><td>Dimensões</td><td>${product.especificacoes.dimensoes}</td></tr>` : ''}
                        ${product.especificacoes.cores.length > 0 ? `<tr><td>Cores</td><td>${product.especificacoes.cores.join(', ')}</td></tr>` : ''}
                        ${product.especificacoes.tamanhos.length > 0 ? `<tr><td>Tamanhos</td><td>${product.especificacoes.tamanhos.join(', ')}</td></tr>` : ''}
                    </tbody>
                </table>
                <div class="quote-action">
                    <div class="quantity-selector">
                        <label for="quoteQuantity">Qtd:</label>
                        <input type="number" id="quoteQuantity" value="1" min="1" max="${product.estoque > 0 ? product.estoque : 1}">
                    </div>
                    <button id="whatsappQuoteBtn" class="quote-button whatsapp-button">
                        <i class="fab fa-whatsapp"></i> Solicitar Orçamento
                    </button>
                </div>
            </div>
        `;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        document.getElementById('whatsappQuoteBtn').addEventListener('click', () => sendWhatsAppQuote(product.id));
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function sendWhatsAppQuote(productId) {
        const product = produtos.find(p => p.id === productId);
        if (!product) return;
        const quantity = document.getElementById('quoteQuantity').value;
        const message = `Olá! Tenho interesse em *${quantity} unidade(s)* do produto: *${product.nome}* (ID: ${product.id}).\n\nGostaria de solicitar um orçamento.`;
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
    }

    // --- UTILITÁRIOS (Reutilizados do script.js original) ---
    function setInitialTheme() {
        const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    function toggleDarkMode() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    function handleScroll() {
        backToTopBtn.style.display = (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) ? "block" : "none";
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        darkModeToggle.addEventListener('click', toggleDarkMode);
        backToTopBtn.addEventListener('click', scrollToTop);
        closeModalButton.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    }

    // Inicia a aplicação
    initializeApp();
});