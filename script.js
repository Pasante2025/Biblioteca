// Variables globales
let books = [];
let currentPage = 'inicio';

// Esperar a que se cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos del localStorage
    loadDataFromLocalStorage();
    
    // Configurar navegación
    setupNavigation();
    
    // Configurar eventos del generador de códigos
    setupBarcodeGenerator();
    
    // Configurar eventos del historial
    setupHistorial();
    
    // Configurar eventos del catálogo
    setupCatalog();
    
    // Inicializar la página
    updateDisplay();
});

// Función para cargar datos del localStorage
function loadDataFromLocalStorage() {
    const storedBooks = localStorage.getItem('libraryBooks');
    if (storedBooks) {
        books = JSON.parse(storedBooks);
        // Ordenar libros alfabéticamente por título
        books.sort((a, b) => a.titulo.localeCompare(b.titulo));
    }
}

// Función para guardar datos en localStorage
function saveDataToLocalStorage() {
    // Ordenar libros alfabéticamente antes de guardar
    books.sort((a, b) => a.titulo.localeCompare(b.titulo));
    localStorage.setItem('libraryBooks', JSON.stringify(books));
}

// Configurar navegación
function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover clase active de todos los enlaces
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            
            // Añadir clase active al enlace clickeado
            this.classList.add('active');
            
            // Cambiar página
            currentPage = this.getAttribute('data-page');
            updateDisplay();
        });
    });
}

// Actualizar visualización de la página
function updateDisplay() {
    // Ocultar todas las páginas
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Mostrar la página actual
    document.getElementById(currentPage).classList.add('active');
    
    // Actualizar contenido según la página
    if (currentPage === 'historial') {
        updateHistorialTable();
    } else if (currentPage === 'catalogo') {
        updateCatalog();
    }
}

// Configurar Generador de Códigos de Barras
function setupBarcodeGenerator() {
    const form = document.getElementById('barcode-form');
    const generateButton = document.getElementById('generar-codigo');
    const previewButton = document.getElementById('preview-button');
    const codeInput = document.getElementById('codigo');
    
    // Generar código aleatorio
    generateButton.addEventListener('click', () => {
        const randomCode = generateRandomBarcode();
        codeInput.value = randomCode;
    });
    
    // Vista previa del código de barras
    previewButton.addEventListener('click', () => {
        const code = codeInput.value.trim();
        if (code) {
            JsBarcode("#barcode", code, {
                format: "EAN13",
                lineColor: "#000",
                width: 2,
                height: 80,
                displayValue: true
            });
        } else {
            alert("Por favor ingrese o genere un código de barras");
        }
    });
    
    // Guardar código de barras
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Obtener valores del formulario
        const codigo = codeInput.value.trim();
        const titulo = document.getElementById('titulo').value.trim();
        const autor = document.getElementById('autor').value.trim();
        const editorial = document.getElementById('editorial').value.trim();
        const anio = document.getElementById('anio').value.trim();
        const estado = document.getElementById('estado').value;
        const modulo = document.getElementById('modulo').value.trim();
        const seccion = document.getElementById('seccion').value.trim();
        
        // Validar código de barras
        if (!codigo || codigo.length !== 13 || isNaN(codigo)) {
            alert("Por favor ingrese un código de barras válido de 13 dígitos");
            return;
        }
        
        // Verificar si el código ya existe
        const existingBook = books.find(book => book.codigo === codigo);
        if (existingBook) {
            alert("Este código de barras ya existe en el sistema");
            return;
        }
        
        // Procesar imagen
        const imageInput = document.getElementById('imagen-libro');
        let imageData = '';
        
        if (imageInput.files && imageInput.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                imageData = e.target.result;
                
                // Crear nuevo libro
                const newBook = {
                    id: Date.now().toString(),
                    codigo,
                    titulo,
                    autor,
                    editorial,
                    anio,
                    estado,
                    modulo,
                    seccion,
                    imagen: imageData
                };
                
                // Añadir libro a la lista
                books.push(newBook);
                
                // Guardar en localStorage
                saveDataToLocalStorage();
                
                // Limpiar formulario
                form.reset();
                document.getElementById('barcode').innerHTML = '';
                
                alert("Libro guardado exitosamente");
            };
            
            reader.readAsDataURL(imageInput.files[0]);
        } else {
            // Crear nuevo libro sin imagen
            const newBook = {
                id: Date.now().toString(),
                codigo,
                titulo,
                autor,
                editorial,
                anio,
                estado,
                modulo,
                seccion,
                imagen: ''
            };
            
            // Añadir libro a la lista
            books.push(newBook);
            
            // Guardar en localStorage
            saveDataToLocalStorage();
            
            // Limpiar formulario
            form.reset();
            document.getElementById('barcode').innerHTML = '';
            
            alert("Libro guardado exitosamente");
        }
    });
}

// Generar código de barras aleatorio
function generateRandomBarcode() {
    // Generar 12 dígitos aleatorios
    let code = '';
    for (let i = 0; i < 12; i++) {
        code += Math.floor(Math.random() * 10);
    }
    
    // Calcular el dígito de verificación (13º dígito)
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    
    // Añadir dígito de verificación al código
    return code + checkDigit;
}

// Configurar Historial de Códigos
function setupHistorial() {
    // Búsqueda en historial
    const searchInput = document.getElementById('historial-search');
    searchInput.addEventListener('input', updateHistorialTable);
    
    // Configurar modal de edición
    const modal = document.getElementById('edit-modal');
    const closeBtn = document.querySelector('.close');
    const editForm = document.getElementById('edit-form');
    
    // Cerrar modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Cerrar modal al hacer clic fuera de él
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Guardar cambios en el formulario de edición
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('edit-id').value;
        const titulo = document.getElementById('edit-titulo').value.trim();
        const autor = document.getElementById('edit-autor').value.trim();
        const editorial = document.getElementById('edit-editorial').value.trim();
        const anio = document.getElementById('edit-anio').value.trim();
        const estado = document.getElementById('edit-estado').value;
        const modulo = document.getElementById('edit-modulo').value.trim();
        const seccion = document.getElementById('edit-seccion').value.trim();
        
        // Buscar el libro a actualizar
        const bookIndex = books.findIndex(book => book.id === id);
        
        if (bookIndex !== -1) {
            // Actualizar datos del libro
            books[bookIndex].titulo = titulo;
            books[bookIndex].autor = autor;
            books[bookIndex].editorial = editorial;
            books[bookIndex].anio = anio;
            books[bookIndex].estado = estado;
            books[bookIndex].modulo = modulo;
            books[bookIndex].seccion = seccion;
            
            // Procesar imagen
            const imageInput = document.getElementById('edit-imagen');
            
            if (imageInput.files && imageInput.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    books[bookIndex].imagen = e.target.result;
                    
                    // Guardar en localStorage
                    saveDataToLocalStorage();
                    
                    // Actualizar visualización
                    updateHistorialTable();
                    updateCatalog();
                    
                    // Cerrar modal
                    modal.style.display = 'none';
                    
                    alert("Libro actualizado exitosamente");
                };
                
                reader.readAsDataURL(imageInput.files[0]);
            } else {
                // Guardar sin cambiar la imagen
                saveDataToLocalStorage();
                
                // Actualizar visualización
                updateHistorialTable();
                updateCatalog();
                
                // Cerrar modal
                modal.style.display = 'none';
                
                alert("Libro actualizado exitosamente");
            }
        }
    });
}

// Actualizar tabla de historial
function updateHistorialTable() {
    const tableBody = document.getElementById('historial-tbody');
    const searchInput = document.getElementById('historial-search');
    const searchTerm = searchInput.value.toLowerCase();
    
    // Limpiar tabla
    tableBody.innerHTML = '';
    
    // Filtrar libros según término de búsqueda
    const filteredBooks = books.filter(book => 
        book.titulo.toLowerCase().includes(searchTerm) || 
        book.autor.toLowerCase().includes(searchTerm) || 
        book.codigo.includes(searchTerm)
    );
    
    // Llenar tabla con libros filtrados
    filteredBooks.forEach(book => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${book.codigo}</td>
            <td>${book.titulo}</td>
            <td>${book.autor}</td>
            <td>${book.editorial}</td>
            <td>${book.anio}</td>
            <td>${book.estado}</td>
            <td>${book.modulo}</td>
            <td>${book.seccion}</td>
            <td>
                <button class="edit-btn" data-id="${book.id}">Editar</button>
                <button class="delete-btn" data-id="${book.id}">Eliminar</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Añadir eventos a los botones de editar y eliminar
    setupTableActions();
}

// Configurar acciones de la tabla
function setupTableActions() {
    // Botones de editar
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            openEditModal(id);
        });
    });
    
    // Botones de eliminar
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (confirm('¿Está seguro de que desea eliminar este libro?')) {
                deleteBook(id);
            }
        });
    });
}

// Abrir modal de edición
function openEditModal(id) {
    const book = books.find(book => book.id === id);
    
    if (book) {
        document.getElementById('edit-id').value = book.id;
        document.getElementById('edit-codigo').value = book.codigo;
        document.getElementById('edit-titulo').value = book.titulo;
        document.getElementById('edit-autor').value = book.autor;
        document.getElementById('edit-editorial').value = book.editorial;
        document.getElementById('edit-anio').value = book.anio;
        document.getElementById('edit-estado').value = book.estado;
        document.getElementById('edit-modulo').value = book.modulo;
        document.getElementById('edit-seccion').value = book.seccion;
        
        // Mostrar imagen actual si existe
        const currentImageContainer = document.getElementById('current-image-container');
        currentImageContainer.innerHTML = '';
        
        if (book.imagen) {
            const img = document.createElement('img');
            img.src = book.imagen;
            img.alt = book.titulo;
            currentImageContainer.appendChild(img);
        }
        
        // Mostrar modal
        document.getElementById('edit-modal').style.display = 'block';
    }
}

// Eliminar libro
function deleteBook(id) {
    const bookIndex = books.findIndex(book => book.id === id);
    
    if (bookIndex !== -1) {
        books.splice(bookIndex, 1);
        
        // Guardar en localStorage
        saveDataToLocalStorage();
        
        // Actualizar visualización
        updateHistorialTable();
        updateCatalog();
        
        alert("Libro eliminado exitosamente");
    }
}

// Configurar Catálogo de Códigos
function setupCatalog() {
    // Búsqueda en catálogo
    const searchInput = document.getElementById('catalogo-search');
    searchInput.addEventListener('input', updateCatalog);
    
    // Simular escaneo de código de barras
    const scanButton = document.getElementById('scan-button');
    const scannerInput = document.getElementById('scanner-input');
    
    scanButton.addEventListener('click', () => {
        // Aquí se podría integrar con una API de escaneo real
        // Por ahora simulamos pidiendo un código al usuario
        const code = prompt("Ingrese el código de barras:");
        if (code) {
            scannerInput.value = code;
            // Buscar el libro con el código escaneado
            const book = books.find(book => book.codigo === code);
            if (book) {
                openDetailModal(book.id);
            } else {
                alert("No se encontró ningún libro con ese código de barras");
            }
        }
    });
    
    // Búsqueda por código escaneado manualmente
    scannerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const code = scannerInput.value.trim();
            if (code) {
                // Buscar el libro con el código escaneado
                const book = books.find(book => book.codigo === code);
                if (book) {
                    openDetailModal(book.id);
                } else {
                    alert("No se encontró ningún libro con ese código de barras");
                }
            }
        }
    });
    
    // Configurar modal de detalles
    const detailModal = document.getElementById('detail-modal');
    const closeDetailBtn = document.querySelector('.close-detail');
    
    // Cerrar modal
    closeDetailBtn.addEventListener('click', () => {
        detailModal.style.display = 'none';
    });
    
    // Cerrar modal al hacer clic fuera de él
    window.addEventListener('click', (e) => {
        if (e.target === detailModal) {
            detailModal.style.display = 'none';
        }
    });
}

// Actualizar catálogo
function updateCatalog() {
    const catalogGrid = document.getElementById('catalog-grid');
    const searchInput = document.getElementById('catalogo-search');
    const searchTerm = searchInput.value.toLowerCase();
    
    // Limpiar catálogo
    catalogGrid.innerHTML = '';
    
    // Filtrar libros según término de búsqueda
    const filteredBooks = books.filter(book => 
        book.titulo.toLowerCase().includes(searchTerm) || 
        book.autor.toLowerCase().includes(searchTerm) || 
        book.codigo.includes(searchTerm)
    );
    
    // Llenar catálogo con libros filtrados
    filteredBooks.forEach(book => {
        const item = document.createElement('div');
        item.className = 'catalog-item';
        item.setAttribute('data-id', book.id);
        
        // Imagen por defecto si no hay imagen
        const imgSrc = book.imagen || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzZjNzU3ZCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcng9IjUiIHJ5PSI1Ij48L3JlY3Q+PHBhdGggZD0iTTIxLjIxIDE1Ljg5QTMgMyAwIDEgMCAxOCAxMi42M00yMyAxOUwxNyAxMyI+PC9wYXRoPjwvc3ZnPg==';
        
        item.innerHTML = `
            <img src="${imgSrc}" alt="${book.titulo}">
            <div class="catalog-item-info">
                <h3>${book.titulo}</h3>
                <p>${book.autor}</p>
                <p><small>Código: ${book.codigo}</small></p>
            </div>
        `;
        
        // Añadir evento para ver detalles
        item.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            openDetailModal(id);
        });
        
        catalogGrid.appendChild(item);
    });
}

// Abrir modal de detalles
function openDetailModal(id) {
    const book = books.find(book => book.id === id);
    
    if (book) {
        const detailContainer = document.getElementById('book-detail-container');
        
        // Imagen por defecto si no hay imagen
        const imgSrc = book.imagen || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzZjNzU3ZCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcng9IjUiIHJ5PSI1Ij48L3JlY3Q+PHBhdGggZD0iTTIxLjIxIDE1Ljg5QTMgMyAwIDEgMCAxOCAxMi42M00yMyAxOUwxNyAxMyI+PC9wYXRoPjwvc3ZnPg==';
        
        detailContainer.innerHTML = `
            <div class="book-detail-header">
                <div class="book-image">
                    <img src="${imgSrc}" alt="${book.titulo}">
                </div>
                <div class="book-info">
                    <h2>${book.titulo}</h2>
                    <p><strong>Autor:</strong> ${book.autor}</p>
                    <p><strong>Editorial:</strong> ${book.editorial}</p>
                    <p><strong>Año:</strong> ${book.anio}</p>
                    <p><strong>Estado:</strong> ${book.estado}</p>
                </div>
            </div>
            <div class="book-barcode">
                <h3>Código de Barras: ${book.codigo}</h3>
                <div id="detail-barcode"></div>
            </div>
            <div class="book-location">
                <h3>Ubicación en Biblioteca</h3>
                <p><strong>Módulo:</strong> ${book.modulo}</p>
                <p><strong>Sección del Estante:</strong> ${book.seccion}</p>
            </div>
        `;
        
        // Generar código de barras para la vista detallada
        setTimeout(() => {
            JsBarcode("#detail-barcode", book.codigo, {
                format: "EAN13",
                lineColor: "#000",
                width: 2,
                height: 80,
                displayValue: true
            });
        }, 100);
        
        // Mostrar modal
        document.getElementById('detail-modal').style.display = 'block';
    }
}

// Función para descargar el código de barras como imagen
function downloadBarcode(codigo, titulo) {
    const svg = document.querySelector("#barcode");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        
        // Crear enlace para descargar
        const downloadLink = document.createElement("a");
        downloadLink.download = `codigo_${codigo}_${titulo.replace(/\s+/g, '_')}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
}

// Exportar lista de libros a CSV
function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Cabecera CSV
    csvContent += "Código,Título,Autor,Editorial,Año,Estado,Módulo,Sección\n";
    
    // Datos de los libros
    books.forEach(book => {
        csvContent += `${book.codigo},"${book.titulo}","${book.autor}","${book.editorial}",${book.anio},"${book.estado}","${book.modulo}","${book.seccion}"\n`;
    });
    
    // Crear enlace para descargar
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "catalogo_libros.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Función para buscar libro por título, autor o código
function searchBooks(query) {
    query = query.toLowerCase();
    return books.filter(book => 
        book.titulo.toLowerCase().includes(query) || 
        book.autor.toLowerCase().includes(query) || 
        book.codigo.includes(query)
    );
}

// Función para imprimir código de barras
function printBarcode(codigo) {
    const printWindow = window.open('', '', 'width=600,height=400');
    
    printWindow.document.write(`
        <html>
        <head>
            <title>Imprimir Código de Barras</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 20px;
                }
                @media print {
                    button {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <h2>Código de Barras: ${codigo}</h2>
            <div id="print-barcode"></div>
            <p>Biblioteca Digital</p>
            <button onclick="window.print(); window.close();">Imprimir</button>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js"></script>
            <script>
                JsBarcode("#print-barcode", "${codigo}", {
                    format: "EAN13",
                    lineColor: "#000",
                    width: 2,
                    height: 80,
                    displayValue: true
                });
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}