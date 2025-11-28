document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIGURAÇÕES E SELETORES ---
    const WHATSAPP_NUMBER = '5511999999999'; // Insira seu número de WhatsApp
    const productGrid = document.getElementById('product-grid');
    const searchInput = document.getElementById('searchInput');
    const categoryFiltersContainer = document.getElementById('categoryFilters');
    const sortOptions = document.getElementById('sortOptions');
    const promoFilter = document.getElementById('promoFilter');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    const backToTopBtn = document.getElementById('backToTopBtn');
    const closeModalButton = document.querySelector('.close-button');

    let produtos = [];
    let currentFilters = {
        searchTerm: '',
        category: 'all',
        showPromoOnly: false,
        sortBy: 'default'
    };

    // --- FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO ---
    async function initializeApp() {
        setInitialTheme();
        await loadProducts();
        renderCategoryFilters();
        applyFiltersAndSort();
        setupEventListeners();
    }

    // --- CARREGAMENTO DE DADOS ---
    async function loadProducts() {
        try {
            // Adiciona um parâmetro para evitar cache
            const response = await fetch(`data.json?v=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            produtos = await response.json();
        } catch (error) {
            console.error('Falha ao carregar os produtos:', error);
            productGrid.innerHTML = '<p class="error-message">Erro ao carregar produtos. Tente recarregar a página.</p>';
        }
    }

    // --- RENDERIZAÇÃO ---
    function renderProducts(productsToRender) {
        productGrid.innerHTML = '';

        if (productsToRender.length === 0) {
            productGrid.innerHTML = '<p class="info-message">Nenhum produto encontrado com os filtros selecionados.</p>';
            return;
        }

        productsToRender.forEach(product => {
            const card = createProductCard(product);
            productGrid.appendChild(card);
        });
    }

    function renderCategoryFilters() {
        // Define as categorias principais que sempre devem aparecer
        const mainCategories = [
            'manutencao',
            'sublimacao',
            'personalizados',
            'convites_digitais',
            'outros'
        ];
        // Combina as categorias principais com quaisquer outras que possam existir nos dados
        const categories = ['all', ...new Set(mainCategories.concat(produtos.map(p => p.categoria)))];
        categoryFiltersContainer.innerHTML = '';
        categories.forEach(category => {
            const displayName = category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
            const div = document.createElement('div');
            div.innerHTML = `
                <input type="radio" id="cat-${category}" name="category" value="${category}" ${category === 'all' ? 'checked' : ''}>
                <label for="cat-${category}">${displayName}</label>
            `;
            categoryFiltersContainer.appendChild(div);
        });

        document.querySelectorAll('input[name="category"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                currentFilters.category = e.target.value;
                applyFiltersAndSort();
            });
        });
    }

    // --- FILTROS E ORDENAÇÃO ---
    function applyFiltersAndSort() {
        productGrid.classList.add('reloading');
        let filteredProducts = [...produtos];

        if (currentFilters.searchTerm) {
            const term = currentFilters.searchTerm.toLowerCase();
            filteredProducts = filteredProducts.filter(p =>
                p.nome.toLowerCase().includes(term) ||
                p.descricao.toLowerCase().includes(term) ||
                p.categoria.toLowerCase().includes(term)
            );
        }

        // Filtra por categoria, se não for 'todos'
        if (currentFilters.category !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.categoria === currentFilters.category);
        }

        if (currentFilters.showPromoOnly) {
            filteredProducts = filteredProducts.filter(p => p.emPromocao);
        }

        sortProducts(filteredProducts);

        setTimeout(() => {
            renderProducts(filteredProducts);
            productGrid.classList.remove('reloading');
        }, 200);
    }

    function sortProducts(productsToSort) {
        const sortFunction = {
            'price-asc': (a, b) => a.preco - b.preco,
            'price-desc': (a, b) => b.preco - a.preco,
            'name-asc': (a, b) => a.nome.localeCompare(b.nome),
            'name-desc': (a, b) => b.nome.localeCompare(a.nome),
            'default': (a, b) => a.id - b.id
        };
        productsToSort.sort(sortFunction[currentFilters.sortBy]);
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

        // Adiciona o evento de clique no card, mas não no botão de mockups
        card.addEventListener('click', (e) => {
            // Se o clique foi no botão de mockups ou em algo dentro dele, não abre o modal
            if (e.target.closest('.mockup-button')) {
                return;
            }
            openModal(product);
        });

        return card;
    }

    // --- MODAL ---
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

    // --- UTILITÁRIOS (TEMA, SCROLL) ---
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
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            currentFilters.searchTerm = e.target.value;
            searchTimeout = setTimeout(applyFiltersAndSort, 300);
        });

        sortOptions.addEventListener('change', (e) => {
            currentFilters.sortBy = e.target.value;
            applyFiltersAndSort();
        });

        promoFilter.addEventListener('change', (e) => {
            currentFilters.showPromoOnly = e.target.checked;
            applyFiltersAndSort();
        });

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