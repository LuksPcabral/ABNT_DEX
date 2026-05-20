// ==========================================================================
// CONFIGURATION & GLOBAL STATE
// ==========================================================================
let currentTab = 'simulador';
let currentSubTab = 'livro';

// Standard pixels conversion factors for A4 page drawing
// Page dimensions: Width = 320px, Height = 452px
// 1cm of A4 Width (21cm) = 15.238px
// 1cm of A4 Height (29.7cm) = 15.218px
const PX_PER_CM_X = 15.238;
const PX_PER_CM_Y = 15.218;

// Months abbreviation database (ABNT NBR 6023)
const ABNT_MONTHS = {
    0: 'jan.',
    1: 'fev.',
    2: 'mar.',
    3: 'abr.',
    4: 'maio', // May is written in full
    5: 'jun.',
    6: 'jul.',
    7: 'ago.',
    8: 'set.',
    9: 'out.',
    10: 'nov.',
    11: 'dez.'
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle setup
    const themeBtn = document.getElementById('theme-toggle-btn');
    themeBtn.addEventListener('click', toggleTheme);

    // Initial setups
    resetMargins();
    updateSimulatorPage();
    toggleCitationFields();
    toggleAuthorNameInputs();
    switchSubTab('livro');

    // Default dates
    const dateInput = document.getElementById('ref-web-access-date');
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1;
        let dd = today.getDate();
        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }
});

// ==========================================================================
// NAVIGATION & THEME LOGIC
// ==========================================================================
function switchTab(tabId) {
    // Deactivate previous active elements
    document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

    // Activate selected elements
    document.getElementById(`tab-btn-${tabId}`).classList.add('active');
    document.getElementById(`tab-content-${tabId}`).classList.add('active');
    
    currentTab = tabId;
}

function switchSubTab(subTabId) {
    document.querySelectorAll('.subnav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.subtab-fields').forEach(field => field.classList.add('hidden'));

    document.getElementById(`subtab-btn-${subTabId}`).classList.add('active');
    document.getElementById(`ref-fields-${subTabId}`).classList.remove('hidden');

    currentSubTab = subTabId;
    
    // Update labels and required fields
    const refTitleLabel = document.getElementById('ref-title-label');
    const refTitleInput = document.getElementById('ref-title');
    if (subTabId === 'lei') {
        refTitleLabel.textContent = 'Ementa/Título da Lei';
        refTitleInput.placeholder = 'Ex: Lei das Diretrizes e Bases da Educação Nacional';
    } else {
        refTitleLabel.textContent = 'Título da Obra / Artigo';
        refTitleInput.placeholder = 'Ex: Metodologia do Trabalho Científico';
    }
}

function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
    }
}

// ==========================================================================
// SIMULADOR DE MARGENS LOGIC
// ==========================================================================
function resetMargins() {
    document.getElementById('margin-top').value = 3.0;
    document.getElementById('margin-left').value = 3.0;
    document.getElementById('margin-bottom').value = 2.0;
    document.getElementById('margin-right').value = 2.0;
    document.getElementById('page-type').value = 'anverso';
    document.getElementById('print-mode').value = 'digital';
    document.getElementById('font-family').value = 'Arial';
    document.getElementById('line-spacing').value = '1.5';
    document.getElementById('paragraph-indent').value = '1.25';
    updateSimulatorPage();
}

function updateSimulatorPage() {
    // Read input values
    const mTop = parseFloat(document.getElementById('margin-top').value) || 0;
    const mLeft = parseFloat(document.getElementById('margin-left').value) || 0;
    const mBottom = parseFloat(document.getElementById('margin-bottom').value) || 0;
    const mRight = parseFloat(document.getElementById('margin-right').value) || 0;

    const pageType = document.getElementById('page-type').value;
    const printMode = document.getElementById('print-mode').value;
    const fontFamily = document.getElementById('font-family').value;
    const lineSpacing = parseFloat(document.getElementById('line-spacing').value) || 1.5;
    const paragraphIndent = parseFloat(document.getElementById('paragraph-indent').value) || 0;

    // References to DOM
    const virtualPage = document.getElementById('virtual-page-element');
    const printableArea = document.getElementById('page-printable-area-element');
    const pageNumIndicator = document.getElementById('page-num-indicator');

    // Update margin labels
    document.getElementById('indicator-top-val').textContent = `${mTop.toFixed(1)} cm`;
    document.getElementById('indicator-left-val').textContent = `${mLeft.toFixed(1)} cm`;
    document.getElementById('indicator-bottom-val').textContent = `${mBottom.toFixed(1)} cm`;
    document.getElementById('indicator-right-val').textContent = `${mRight.toFixed(1)} cm`;

    // Visual margin calculations
    let visualLeft = mLeft;
    let visualRight = mRight;

    // In double-sided (impresso) mode, the margins swap on the back page (verso)
    if (printMode === 'impresso' && pageType === 'verso') {
        visualLeft = mRight;
        visualRight = mLeft;
        // Swap page number position to top left
        pageNumIndicator.style.right = 'auto';
        pageNumIndicator.style.left = '15px';
    } else {
        // Obverse page or digital mode: standard positioning
        pageNumIndicator.style.left = 'auto';
        pageNumIndicator.style.right = '15px';
    }

    // Convert cm to pixels for screen representation
    const pxTop = mTop * PX_PER_CM_Y;
    const pxBottom = mBottom * PX_PER_CM_Y;
    const pxLeft = visualLeft * PX_PER_CM_X;
    const pxRight = visualRight * PX_PER_CM_X;

    // Apply styled positions
    printableArea.style.top = `${pxTop}px`;
    printableArea.style.bottom = `${pxBottom}px`;
    printableArea.style.left = `${pxLeft}px`;
    printableArea.style.right = `${pxRight}px`;

    // Apply Typography
    virtualPage.style.fontFamily = fontFamily === 'Times New Roman' ? '"Times New Roman", Times, serif' : 'Arial, Helvetica, sans-serif';
    
    // Apply indentations & line spacing inside printable area
    document.querySelectorAll('.preview-paragraph').forEach(p => {
        p.style.textIndent = paragraphIndent > 0 ? '12px' : '0px';
        p.style.lineHeight = lineSpacing === 1.5 ? '1.5' : '1.1';
    });

    // Apply style to long quote preview
    const longQuotePreview = document.getElementById('preview-long-quote-element');
    if (longQuotePreview) {
        longQuotePreview.style.lineHeight = '1.0';
        longQuotePreview.style.marginLeft = `${4.0 * PX_PER_CM_X / 3.2}px`; // Scaled indentation
    }
}

// ==========================================================================
// GERADOR DE CITAÇÕES LOGIC (NBR 10520:2023)
// ==========================================================================
function toggleCitationFields() {
    const authorType = document.getElementById('cit-author-type').value;
    
    document.getElementById('cit-fields-pessoa').classList.add('hidden');
    document.getElementById('cit-fields-corporacao').classList.add('hidden');
    document.getElementById('cit-fields-sem-autor').classList.add('hidden');

    if (authorType === 'pessoa') {
        document.getElementById('cit-fields-pessoa').classList.remove('hidden');
    } else if (authorType === 'corporacao') {
        document.getElementById('cit-fields-corporacao').classList.remove('hidden');
    } else if (authorType === 'sem_autor') {
        document.getElementById('cit-fields-sem-autor').classList.remove('hidden');
    }
}

function toggleAuthorNameInputs() {
    const count = parseInt(document.getElementById('cit-author-count').value);
    const container = document.getElementById('cit-author-names-container');
    container.innerHTML = '';

    const maxInputs = count === 4 ? 1 : count; // For et al, we only need the first author

    for (let i = 1; i <= maxInputs; i++) {
        const div = document.createElement('div');
        div.className = 'form-group author-input-group';
        div.id = `group-author-${i}`;

        const label = document.createElement('label');
        label.htmlFor = `cit-author-${i}`;
        label.textContent = count === 4 ? 'Sobrenome do Primeiro Autor' : `Sobrenome do Autor ${i}`;

        const input = document.createElement('input');
        input.type = 'text';
        input.id = `cit-author-${i}`;
        input.placeholder = i === 1 ? 'Ex: Silva' : i === 2 ? 'Ex: Santos' : 'Ex: Oliveira';
        input.required = true;

        div.appendChild(label);
        div.appendChild(input);
        container.appendChild(div);
    }
}

function generateCitation() {
    const authorType = document.getElementById('cit-author-type').value;
    const year = document.getElementById('cit-year').value.trim() || '2026';
    const page = document.getElementById('cit-page').value.trim();
    const quoteText = document.getElementById('cit-quote-text').value.trim() || 'Texto citado de exemplo para demonstração das normas.';

    let authorTextNormal = ''; // E.g., Silva (2024)
    let authorTextParentheses = ''; // E.g., (Silva, 2024)

    if (authorType === 'pessoa') {
        const count = parseInt(document.getElementById('cit-author-count').value);
        const names = [];
        
        const inputs = document.querySelectorAll('#cit-author-names-container input');
        inputs.forEach(input => {
            if (input.value.trim()) {
                // Surnames must be correctly capitalized for the flow, but in ABNT standard capitalized inside parenthesis
                names.push(input.value.trim());
            }
        });

        if (names.length === 0) return;

        if (count === 1) {
            authorTextNormal = capitalizeFirstLetter(names[0]);
            authorTextParentheses = capitalizeFirstLetter(names[0]);
        } else if (count === 2) {
            authorTextNormal = `${capitalizeFirstLetter(names[0])} e ${capitalizeFirstLetter(names[1])}`;
            authorTextParentheses = `${capitalizeFirstLetter(names[0])}; ${capitalizeFirstLetter(names[1])}`;
        } else if (count === 3) {
            authorTextNormal = `${capitalizeFirstLetter(names[0])}, ${capitalizeFirstLetter(names[1])} e ${capitalizeFirstLetter(names[2])}`;
            authorTextParentheses = `${capitalizeFirstLetter(names[0])}; ${capitalizeFirstLetter(names[1])}; ${capitalizeFirstLetter(names[2])}`;
        } else if (count === 4) {
            authorTextNormal = `${capitalizeFirstLetter(names[0])} *et al.*`;
            authorTextParentheses = `${capitalizeFirstLetter(names[0])} *et al.*`;
        }
    } else if (authorType === 'corporacao') {
        const corpName = document.getElementById('cit-corp-name').value.trim() || 'IBGE';
        authorTextNormal = corpName;
        authorTextParentheses = corpName;
    } else if (authorType === 'sem_autor') {
        const titleWord = document.getElementById('cit-title-word').value.trim() || 'Título';
        const formattedTitle = titleWord.toUpperCase();
        authorTextNormal = `${formattedTitle}...`;
        authorTextParentheses = `${formattedTitle}...,`;
    }

    // Build the citation results
    const pageSuffix = page ? `, p. ${page}` : '';

    // Indirect outputs
    let indFluxo = '';
    let indParenteses = '';
    
    if (authorTextNormal.includes('*et al.*')) {
        indFluxo = `${authorTextNormal.replace(/\*/g, '')} (${year}${pageSuffix})`;
        indParenteses = `(${authorTextParentheses.replace(/\*/g, '')}, ${year}${pageSuffix})`;
    } else {
        indFluxo = `${authorTextNormal} (${year}${pageSuffix})`;
        indParenteses = `(${authorTextParentheses}, ${year}${pageSuffix})`;
    }

    document.getElementById('out-cit-indireta-fluxo').innerHTML = indFluxo;
    document.getElementById('out-cit-indireta-parenteses').innerHTML = indParenteses;

    // Direct Short outputs
    let dirCurta = `"${quoteText}" ${indParenteses}`;
    document.getElementById('out-cit-direta-curta').innerHTML = dirCurta;

    // Direct Long outputs (block quotes)
    const longQuotePreview = document.getElementById('out-cit-direta-longa-preview');
    longQuotePreview.textContent = quoteText;
    
    // Add citation metadata at the end of the blockquote
    const citationCall = document.createElement('span');
    citationCall.style.display = 'block';
    citationCall.style.marginTop = '0.5rem';
    citationCall.style.textAlign = 'right';
    citationCall.innerHTML = indParenteses;
    longQuotePreview.appendChild(citationCall);
}

function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ==========================================================================
// GERADOR DE REFERÊNCIAS LOGIC (NBR 6023:2025)
// ==========================================================================
function generateReference() {
    const rawAuthors = document.getElementById('ref-authors').value.trim();
    const title = document.getElementById('ref-title').value.trim();
    const year = document.getElementById('ref-year').value.trim();

    if (!rawAuthors || !title || !year) return;

    let formattedAuthors = formatReferenceAuthors(rawAuthors);
    let referenceHTML = '';

    if (currentSubTab === 'livro') {
        const subtitle = document.getElementById('ref-book-subtitle').value.trim();
        const edition = document.getElementById('ref-book-edition').value.trim();
        const city = document.getElementById('ref-book-city').value.trim() || 'Cidade não identificada';
        const publisher = document.getElementById('ref-book-publisher').value.trim() || 'Editora não identificada';

        const fullTitle = subtitle ? `<strong>${title}</strong>: ${subtitle}` : `<strong>${title}</strong>`;
        const edStr = edition ? ` ${edition}` : '';

        referenceHTML = `${formattedAuthors}. ${fullTitle}.${edStr} ${city}: ${publisher}, ${year}.`;

    } else if (currentSubTab === 'artigo') {
        const journal = document.getElementById('ref-journal-name').value.trim() || 'Revista';
        const city = document.getElementById('ref-journal-city').value.trim() || 'Cidade';
        const vol = document.getElementById('ref-journal-volume').value.trim();
        const num = document.getElementById('ref-journal-number').value.trim();
        const pages = document.getElementById('ref-journal-pages').value.trim();

        const volStr = vol ? `, ${vol}` : '';
        const numStr = num ? `, ${num}` : '';
        const pagStr = pages ? `, p. ${pages}` : '';

        referenceHTML = `${formattedAuthors}. ${title}. <strong>${journal}</strong>, ${city}${volStr}${numStr}${pagStr}, ${year}.`;

    } else if (currentSubTab === 'web') {
        const site = document.getElementById('ref-web-site').value.trim() || 'Website';
        const url = document.getElementById('ref-web-url').value.trim() || 'http://';
        const accessDate = document.getElementById('ref-web-access-date').value;

        const dateStr = formatAccessDate(accessDate);

        referenceHTML = `${formattedAuthors}. <strong>${title}</strong>. ${site}, ${year}. Disponível em: &lt;${url}&gt;. Acesso em: ${dateStr}.`;

    } else if (currentSubTab === 'lei') {
        const jurisdiction = document.getElementById('ref-law-jurisdiction').value.trim().toUpperCase() || 'BRASIL';
        const org = document.getElementById('ref-law-org').value.trim();
        const source = document.getElementById('ref-law-source').value.trim() || 'Diário Oficial';
        const city = document.getElementById('ref-law-city').value.trim() || 'Brasília';

        const orgStr = org ? ` ${org}.` : '';

        referenceHTML = `${jurisdiction}.${orgStr} <strong>${title}</strong>. ${city}: ${source}, ${year}.`;
    }

    document.getElementById('out-reference-styled').innerHTML = referenceHTML;
}

function formatReferenceAuthors(raw) {
    const authors = raw.split(';').map(a => a.trim()).filter(a => a.length > 0);
    
    if (authors.length === 0) return 'SEM AUTOR';

    if (authors.length <= 3) {
        return authors.join('; ');
    } else {
        // 4+ authors: Use the first one and "et al."
        return `${authors[0]} <em>et al</em>.`;
    }
}

function formatAccessDate(dateVal) {
    if (!dateVal) return 'data não identificada';
    const dateObj = new Date(dateVal + 'T00:00:00'); // Prevent timezone offset shift
    const day = dateObj.getDate();
    const monthIndex = dateObj.getMonth();
    const year = dateObj.getFullYear();

    const abntMonth = ABNT_MONTHS[monthIndex];
    return `${day} ${abntMonth} ${year}`;
}

// ==========================================================================
// GUIDE SEARCH / FILTER LOGIC
// ==========================================================================
function filterGuide() {
    const query = document.getElementById('guide-search').value.toLowerCase().trim();
    const cards = document.querySelectorAll('.guide-item');

    cards.forEach(card => {
        const keywords = card.getAttribute('data-keywords').toLowerCase();
        const text = card.textContent.toLowerCase();

        if (keywords.includes(query) || text.includes(query)) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

// ==========================================================================
// UTILITIES (COPY TO CLIPBOARD, ETC)
// ==========================================================================
function copyText(elementId) {
    const el = document.getElementById(elementId);
    let textToCopy = el.textContent || el.innerText;
    
    // Copy the contents
    navigator.clipboard.writeText(textToCopy.trim()).then(() => {
        // Change button feedback visually
        const btn = el.nextElementSibling || el.parentElement.querySelector('.copy-btn');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check" style="color: var(--success)"></i>';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 1500);
        }
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

function copyReferenceText() {
    const el = document.getElementById('out-reference-styled');
    
    // When copying reference text, we want to copy the innerText, but preserve standard bold tags if pasting in Word/Google Docs.
    // By default, clipboard API will copy plain text. Copying rich HTML allows formatting to persist when pasting in Word.
    const htmlToCopy = el.innerHTML;
    const textToCopy = el.innerText;

    const listener = function(e) {
        e.clipboardData.setData('text/html', htmlToCopy);
        e.clipboardData.setData('text/plain', textToCopy);
        e.preventDefault();
    };

    document.addEventListener('copy', listener);
    document.execCommand('copy');
    document.removeEventListener('copy', listener);

    // Visual button feedback
    const btn = document.querySelector('.reference-actions button');
    if (btn) {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check" style="color: var(--success)"></i> Copiado!';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
        }, 1500);
    }
}
