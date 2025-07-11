// Sistema de Controle de Estoque
class StockSystem {
    constructor() {
        this.products = [];
        this.movements = [];
        this.currentEditId = null;
        this.charts = {};
        this.init();
    }

    init() {
        this.loadData();
        this.loadSampleData();
        this.updateDashboard();
        this.renderProducts();
        this.setupEventListeners();
    }

    // Carregamento de dados do localStorage
    loadData() {
        const savedProducts = localStorage.getItem('stockProducts');
        const savedMovements = localStorage.getItem('stockMovements');
        
        if (savedProducts) {
            this.products = JSON.parse(savedProducts);
        }
        
        if (savedMovements) {
            this.movements = JSON.parse(savedMovements);
        }
    }

    // Salvar dados no localStorage
    saveData() {
        localStorage.setItem('stockProducts', JSON.stringify(this.products));
        localStorage.setItem('stockMovements', JSON.stringify(this.movements));
    }

    // Carregar dados de exemplo (apenas na primeira vez)
    loadSampleData() {
        if (this.products.length === 0) {
            const sampleProducts = [
                {
                    id: 1,
                    name: 'Smartphone Samsung Galaxy',
                    category: 'Eletrônicos',
                    quantity: 25,
                    price: 1299.99,
                    minStock: 10,
                    createdAt: new Date('2024-01-15')
                },
                {
                    id: 2,
                    name: 'Camiseta Polo',
                    category: 'Roupas',
                    quantity: 50,
                    price: 89.90,
                    minStock: 15,
                    createdAt: new Date('2024-01-20')
                },
                {
                    id: 3,
                    name: 'Cafeteira Elétrica',
                    category: 'Casa',
                    quantity: 8,
                    price: 299.99,
                    minStock: 10,
                    createdAt: new Date('2024-02-01')
                },
                {
                    id: 4,
                    name: 'Tênis de Corrida',
                    category: 'Esportes',
                    quantity: 30,
                    price: 259.90,
                    minStock: 12,
                    createdAt: new Date('2024-02-10')
                }
            ];

            this.products = sampleProducts;
            
            // Adicionar algumas movimentações de exemplo
            const sampleMovements = [
                {
                    id: 1,
                    productId: 1,
                    type: 'entrada',
                    quantity: 30,
                    reason: 'Compra inicial',
                    date: new Date('2024-01-15'),
                    value: 1299.99 * 30
                },
                {
                    id: 2,
                    productId: 1,
                    type: 'saida',
                    quantity: 5,
                    reason: 'Venda',
                    date: new Date('2024-02-01'),
                    value: 1299.99 * 5
                },
                {
                    id: 3,
                    productId: 2,
                    type: 'entrada',
                    quantity: 60,
                    reason: 'Reposição de estoque',
                    date: new Date('2024-01-20'),
                    value: 89.90 * 60
                },
                {
                    id: 4,
                    productId: 2,
                    type: 'saida',
                    quantity: 10,
                    reason: 'Venda',
                    date: new Date('2024-02-15'),
                    value: 89.90 * 10
                }
            ];

            this.movements = sampleMovements;
            this.saveData();
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Form de produto
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // Form de movimentação
        document.getElementById('movementForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMovement();
        });
    }

    // Atualizar dashboard
    updateDashboard() {
        const totalProducts = this.products.length;
        const totalValue = this.products.reduce((sum, product) => sum + (product.quantity * product.price), 0);
        const lowStock = this.products.filter(product => product.quantity <= product.minStock).length;
        
        // Calcular receita do mês atual
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = this.movements
            .filter(movement => {
                const movementDate = new Date(movement.date);
                return movement.type === 'saida' && 
                       movementDate.getMonth() === currentMonth && 
                       movementDate.getFullYear() === currentYear;
            })
            .reduce((sum, movement) => sum + movement.value, 0);

        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('totalValue').textContent = this.formatCurrency(totalValue);
        document.getElementById('lowStock').textContent = lowStock;
        document.getElementById('monthlyRevenue').textContent = this.formatCurrency(monthlyRevenue);
    }

    // Renderizar produtos na tabela
    renderProducts() {
        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = '';

        let filteredProducts = [...this.products];
        
        // Aplicar filtros
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm)
            );
        }
        
        if (categoryFilter) {
            filteredProducts = filteredProducts.filter(product => product.category === categoryFilter);
        }

        // Aplicar ordenação
        const sortBy = document.getElementById('sortSelect').value;
        filteredProducts.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'quantity':
                    return b.quantity - a.quantity;
                case 'price':
                    return b.price - a.price;
                case 'category':
                    return a.category.localeCompare(b.category);
                default:
                    return 0;
            }
        });

        filteredProducts.forEach(product => {
            const row = document.createElement('tr');
            const status = this.getStockStatus(product);
            
            row.innerHTML = `
                <td><strong>${product.name}</strong></td>
                <td>${product.category}</td>
                <td>${product.quantity}</td>
                <td>${this.formatCurrency(product.price)}</td>
                <td>${this.formatCurrency(product.quantity * product.price)}</td>
                <td><span class="status ${status.class}">${status.text}</span></td>
                <td>
                    <button class="btn btn-warning" onclick="stockSystem.editProduct(${product.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-secondary" onclick="stockSystem.openMovementModal(${product.id})" title="Movimentar">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button class="btn btn-danger" onclick="stockSystem.deleteProduct(${product.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Obter status do estoque
    getStockStatus(product) {
        if (product.quantity === 0) {
            return { class: 'out', text: 'Esgotado' };
        } else if (product.quantity <= product.minStock) {
            return { class: 'low', text: 'Baixo' };
        } else {
            return { class: 'normal', text: 'Normal' };
        }
    }

    // Salvar produto
    saveProduct() {
        const name = document.getElementById('productName').value;
        const category = document.getElementById('productCategory').value;
        const quantity = parseInt(document.getElementById('productQuantity').value);
        const price = parseFloat(document.getElementById('productPrice').value);
        const minStock = parseInt(document.getElementById('minStock').value);

        if (this.currentEditId) {
            // Editar produto existente
            const productIndex = this.products.findIndex(p => p.id === this.currentEditId);
            if (productIndex !== -1) {
                this.products[productIndex] = {
                    ...this.products[productIndex],
                    name,
                    category,
                    quantity,
                    price,
                    minStock
                };
            }
        } else {
            // Adicionar novo produto
            const newProduct = {
                id: Date.now(),
                name,
                category,
                quantity,
                price,
                minStock,
                createdAt: new Date()
            };
            
            this.products.push(newProduct);
            
            // Registrar movimentação de entrada inicial
            if (quantity > 0) {
                this.movements.push({
                    id: Date.now() + 1,
                    productId: newProduct.id,
                    type: 'entrada',
                    quantity,
                    reason: 'Estoque inicial',
                    date: new Date(),
                    value: quantity * price
                });
            }
        }

        this.saveData();
        this.updateDashboard();
        this.renderProducts();
        this.closeModal('productModal');
        this.resetProductForm();
    }

    // Editar produto
    editProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            this.currentEditId = id;
            document.getElementById('modalTitle').textContent = 'Editar Produto';
            document.getElementById('productName').value = product.name;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productQuantity').value = product.quantity;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('minStock').value = product.minStock;
            this.openModal('productModal');
        }
    }

    // Excluir produto
    deleteProduct(id) {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            this.products = this.products.filter(p => p.id !== id);
            this.movements = this.movements.filter(m => m.productId !== id);
            this.saveData();
            this.updateDashboard();
            this.renderProducts();
        }
    }

    // Abrir modal de movimentação
    openMovementModal(productId) {
        this.currentEditId = productId;
        document.getElementById('movementQuantity').value = '';
        document.getElementById('movementReason').value = '';
        document.getElementById('movementType').value = 'entrada';
        this.openModal('movementModal');
    }

    // Salvar movimentação
    saveMovement() {
        const productId = this.currentEditId;
        const type = document.getElementById('movementType').value;
        const quantity = parseInt(document.getElementById('movementQuantity').value);
        const reason = document.getElementById('movementReason').value;

        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Verificar se há estoque suficiente para saída
        if (type === 'saida' && quantity > product.quantity) {
            alert('Quantidade insuficiente em estoque!');
            return;
        }

        // Atualizar quantidade do produto
        if (type === 'entrada') {
            product.quantity += quantity;
        } else {
            product.quantity -= quantity;
        }

        // Registrar movimentação
        const movement = {
            id: Date.now(),
            productId,
            type,
            quantity,
            reason,
            date: new Date(),
            value: quantity * product.price
        };

        this.movements.push(movement);
        this.saveData();
        this.updateDashboard();
        this.renderProducts();
        this.closeModal('movementModal');
    }

    // Mostrar relatórios
    showReports() {
        const chartsSection = document.getElementById('chartsSection');
        chartsSection.style.display = chartsSection.style.display === 'none' ? 'block' : 'none';
        
        if (chartsSection.style.display === 'block') {
            setTimeout(() => {
                this.renderCharts();
            }, 100);
        }
    }

    // Renderizar gráficos
    renderCharts() {
        this.renderStockChart();
        this.renderRevenueChart();
    }

    // Gráfico de movimentação de estoque
    renderStockChart() {
        const ctx = document.getElementById('stockChart').getContext('2d');
        
        if (this.charts.stockChart) {
            this.charts.stockChart.destroy();
        }

        // Agrupar movimentações por mês
        const monthlyData = {};
        this.movements.forEach(movement => {
            const date = new Date(movement.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { entrada: 0, saida: 0 };
            }
            
            monthlyData[monthKey][movement.type] += movement.quantity;
        });

        const labels = Object.keys(monthlyData).sort();
        const entradaData = labels.map(label => monthlyData[label].entrada);
        const saidaData = labels.map(label => monthlyData[label].saida);

        this.charts.stockChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.map(label => {
                    const [year, month] = label.split('-');
                    return `${month}/${year}`;
                }),
                datasets: [{
                    label: 'Entradas',
                    data: entradaData,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Saídas',
                    data: saidaData,
                    borderColor: '#f44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Gráfico de receita por categoria
    renderRevenueChart() {
        const ctx = document.getElementById('revenueChart').getContext('2d');
        
        if (this.charts.revenueChart) {
            this.charts.revenueChart.destroy();
        }

        // Calcular receita por categoria
        const categoryRevenue = {};
        this.movements
            .filter(movement => movement.type === 'saida')
            .forEach(movement => {
                const product = this.products.find(p => p.id === movement.productId);
                if (product) {
                    if (!categoryRevenue[product.category]) {
                        categoryRevenue[product.category] = 0;
                    }
                    categoryRevenue[product.category] += movement.value;
                }
            });

        const labels = Object.keys(categoryRevenue);
        const data = Object.values(categoryRevenue);
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

        this.charts.revenueChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }

    // Filtrar produtos
    filterProducts() {
        this.renderProducts();
    }

    // Ordenar produtos
    sortProducts() {
        this.renderProducts();
    }

    // Abrir modal
    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    // Fechar modal
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        if (modalId === 'productModal') {
            this.resetProductForm();
        }
    }

    // Resetar formulário de produto
    resetProductForm() {
        this.currentEditId = null;
        document.getElementById('modalTitle').textContent = 'Adicionar Produto';
        document.getElementById('productForm').reset();
    }

    // Formatar moeda
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
}

// Funções globais para os event handlers
function openModal(modalId) {
    stockSystem.openModal(modalId);
}

function closeModal(modalId) {
    stockSystem.closeModal(modalId);
}

function filterProducts() {
    stockSystem.filterProducts();
}

function sortProducts() {
    stockSystem.sortProducts();
}

function showReports() {
    stockSystem.showReports();
}

// Inicializar sistema
const stockSystem = new StockSystem();

// Fechar modal ao clicar fora dele
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}