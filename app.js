// ==========================================================================
// CONFIGURATION & GLOBAL STATE
// ==========================================================================
let currentTheme = 'light';
let activeDrawer = null;
let referenceSubTab = 'livro';
let chatbotStep = 0;

// User TCC details collected by the chatbot
let userTccInfo = {
    theme: '',
    problem: '',
    objective: '',
    author: 'NOME DO ALUNO',
    institution: 'UNIVERSIDADE FEDERAL DO BRASIL\nCURSO DE TECNOLOGIA DA INFORMAÇÃO',
    title: 'TÍTULO DO TRABALHO DE CONCLUSÃO DE CURSO'
};

// Database of mock citations and debates based on keyword detection
const DEFAULT_CITATIONS = [
    {
        keywords: ['inteligencia', 'artificial', 'tecnologia', 'ia', 'computador', 'algoritmo'],
        citation: '"A inteligência artificial não substitui o raciocínio clínico humano, mas atua como um amplificador de diagnósticos e análises preditivas em larga escala." (Silva, 2024, p. 12)',
        dialogue: 'Conforme aponta Silva (2024), o emprego de modelos de inteligência artificial otimiza a precisão de análises complexas. Entretanto, Santos (2025) adverte que a dependência excessiva de algoritmos sem a devida supervisão de especialistas pode mascarar anomalias raras. Este debate ressalta a importância de integrar a automação ao julgamento crítico humano.'
    },
    {
        keywords: ['saude', 'medicina', 'hospital', 'clinico', 'medico', 'paciente'],
        citation: '"A humanização no ambiente hospitalar constitui o pilar central para a eficácia do tratamento e a recuperação rápida do paciente." (Oliveira, 2023, p. 89)',
        dialogue: 'Oliveira (2023) argumenta que o acolhimento humanizado melhora sensivelmente os indicadores clínicos dos pacientes. Por outro lado, Souza (2024) pondera que a sobrecarga das equipes de saúde limita a execução prática desses protocolos em hospitais públicos. Ambos autores concordam que reformulações estruturais são urgentes.'
    },
    {
        keywords: ['educacao', 'ensino', 'escola', 'aluno', 'professor', 'aprendizagem'],
        citation: '"O uso de metodologias ativas no ensino superior estimula a autonomia do estudante e fomenta a resolução crítica de problemas reais." (Almeida, 2024, p. 34)',
        dialogue: 'Segundo Almeida (2024), as metodologias ativas transformam o estudante em protagonista de sua aprendizagem. Contudo, Lima (2025) questiona a eficácia dessa abordagem em turmas de grande porte sem infraestrutura tecnológica adequada. A controvérsia evidencia a necessidade de adaptar os métodos ao contexto escolar.'
    }
];

// Fallback citation/dialogue if no keyword is matched
const FALLBACK_CITATION = {
    citation: '"A pesquisa científica exige rigor metodológico na coleta de dados para mitigar vieses subjetivos do investigador." (Souza, 2025, p. 45)',
    dialogue: 'Como destaca Souza (2025), o rigor científico é indispensável para a legitimidade de qualquer estudo acadêmico. Em contrapartida, Costa (2026) ressalta que a excessiva rigidez formal não deve sufocar a inovação e as descobertas fortuitas. Com isso, verifica-se que o equilíbrio entre rigor e flexibilidade heurística enriquece a produção do conhecimento.'
};

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Check if there is saved document content
    const savedDoc = localStorage.getItem('abnt_dex_document_content');
    const savedTitle = localStorage.getItem('abnt_dex_document_title');
    
    if (savedDoc) {
        document.getElementById('tcc-editor-area').innerHTML = savedDoc;
        if (savedTitle) {
            document.getElementById('doc-name-input').value = savedTitle;
        }
        // If they have a saved doc, skip onboarding directly to editor
        skipToEditor();
    }

    // Set Access Date default in Reference Generator Drawer
    const refYear = document.getElementById('ref-year');
    if (refYear) {
        refYear.value = new Date().getFullYear();
    }

    // Handle initial styling checks
    updateEditorMargins();
});

// ==========================================================================
// ONBOARDING / CHATBOT FLOW (O ORÁCULO)
// ==========================================================================
function sendChatMessage() {
    const inputEl = document.getElementById('chat-input');
    const messageText = inputEl.value.trim();
    if (!messageText) return;

    // 1. Add User Message
    appendMessage(messageText, 'user-message');
    inputEl.value = '';

    // 2. Add Typing Indicator
    const typingId = appendTypingIndicator();

    // 3. Process chatbot response with a slight delay
    setTimeout(() => {
        removeTypingIndicator(typingId);
        processBotResponse(messageText);
    }, 1000);
}

function appendMessage(text, className) {
    const chatFeed = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${className}`;
    msgDiv.innerHTML = `<div class="message-content">${text}</div>`;
    chatFeed.appendChild(msgDiv);
    chatFeed.scrollTop = chatFeed.scrollHeight;
}

function appendTypingIndicator() {
    const chatFeed = document.getElementById('chat-messages');
    const indicatorDiv = document.createElement('div');
    indicatorDiv.className = 'message bot-message typing-indicator-wrapper';
    indicatorDiv.id = 'typing-indicator-active';
    indicatorDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    chatFeed.appendChild(indicatorDiv);
    chatFeed.scrollTop = chatFeed.scrollHeight;
    return indicatorDiv.id;
}

function removeTypingIndicator(id) {
    const indicator = document.getElementById(id);
    if (indicator) {
        indicator.remove();
    }
}

function processBotResponse(userInput) {
    if (chatbotStep === 0) {
        // Collect Theme
        userTccInfo.theme = userInput;
        userTccInfo.title = `O IMPACTO DE ${userInput.toUpperCase()}: ANÁLISE E DIRETRIZES`;
        
        // Suggest citations updates
        updateAiAssistantCards(userInput);

        appendMessage(`Achei o tema <strong>"${userInput}"</strong> excelente! 💡 Para estruturarmos o esqueleto metodológico de acordo com a ABNT, precisamos definir o seu <strong>Problema de Pesquisa</strong> (a pergunta central que seu TCC quer responder).<br><br>Qual pergunta específica você gostaria de fazer sobre esse tema?<br><em>(Exemplo: "De que forma a tecnologia melhora os processos organizacionais em pequenas empresas?")</em>`, 'bot-message');
        chatbotStep = 1;
    } 
    else if (chatbotStep === 1) {
        // Collect Problem
        userTccInfo.problem = userInput;

        appendMessage(`Excelente pergunta! O problema de pesquisa delimita o escopo científico do trabalho.<br><br>Agora, defina o seu <strong>Objetivo Geral</strong>. Ele deve começar com um verbo no infinitivo (ex: Analisar, Compreender, Propor, Avaliar).<br><br>Qual é o objetivo principal do seu trabalho?`, 'bot-message');
        chatbotStep = 2;
    } 
    else if (chatbotStep === 2) {
        // Collect Objective
        userTccInfo.objective = userInput;

        // Generate dynamic outline / esqueleto ABNT summary
        const esqueletoHtml = `
            🎉 Espetacular! O Oráculo compilou o diagnóstico da sua pesquisa:<br><br>
            📌 <strong>Tema:</strong> ${userTccInfo.theme}<br>
            ❓ <strong>Problema:</strong> ${userTccInfo.problem}<br>
            🎯 <strong>Objetivo:</strong> ${userTccInfo.objective}<br><br>
            Montei a estrutura oficial do TCC seguindo a NBR 14724:<br>
            <ul>
                <li><strong>Elementos Pré-textuais:</strong> Capa ABNT, Folha de Rosto e Sumário</li>
                <li><strong>1. Introdução:</strong> Contextualização do Tema, Problema e Objetivos</li>
                <li><strong>2. Referencial Teórico:</strong> Discussão sobre o tema</li>
                <li><strong>3. Metodologia:</strong> Procedimentos e técnicas de investigação</li>
                <li><strong>4. Análise de Dados:</strong> Discussão dos resultados encontrados</li>
                <li><strong>5. Considerações Finais:</strong> Resposta ao problema de pesquisa</li>
                <li><strong>Referências Bibliográficas</strong> (NBR 6023)</li>
            </ul>
            <br>
            <button class="btn primary-btn btn-full" onclick="loadSkeletonIntoEditor()">
                <i class="fa-solid fa-file-signature"></i> Carregar Estrutura no Editor A4
            </button>
        `;
        appendMessage(esqueletoHtml, 'bot-message');
        chatbotStep = 3;
    }
}

// Update the AI citation assistant card depending on the user's theme keywords
function updateAiAssistantCards(themeText) {
    const textLower = themeText.toLowerCase();
    let matched = false;

    for (const item of DEFAULT_CITATIONS) {
        if (item.keywords.some(kw => textLower.includes(kw))) {
            document.getElementById('ai-citation-text').innerHTML = item.citation;
            // Store temporarily in properties to insert
            document.getElementById('ai-citation-text').dataset.citation = item.citation;
            document.getElementById('ai-citation-text').dataset.dialogue = item.dialogue;
            matched = true;
            break;
        }
    }

    if (!matched) {
        document.getElementById('ai-citation-text').innerHTML = FALLBACK_CITATION.citation;
        document.getElementById('ai-citation-text').dataset.citation = FALLBACK_CITATION.citation;
        document.getElementById('ai-citation-text').dataset.dialogue = FALLBACK_CITATION.dialogue;
    }
}

// Skip flow and load generic values
function skipToEditor() {
    if (!userTccInfo.theme) {
        userTccInfo.theme = "Tema Provisório de TCC";
        userTccInfo.problem = "Como resolver os principais desafios relacionados ao tema proposto?";
        userTccInfo.objective = "Analisar as principais discussões teóricas e práticas sobre o tema proposto.";
    }
    loadSkeletonIntoEditor();
}

function loadSkeletonIntoEditor() {
    // Save document info
    const editor = document.getElementById('tcc-editor-area');
    
    // Construct Cover + Skeleton structure ABNT format
    const docHtml = `
        <div class="cover-element-institution text-center" style="text-align: center; margin-bottom: 4cm; font-family: Arial, sans-serif; font-size: 12pt; text-transform: uppercase;">
            ${userTccInfo.institution}
        </div>
        <div class="cover-element-author text-center" style="text-align: center; margin-bottom: 4cm; font-family: Arial, sans-serif; font-size: 12pt; text-transform: uppercase; font-weight: bold;">
            ${userTccInfo.author}
        </div>
        <div class="cover-element-title text-center" style="text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 6cm; font-family: Arial, sans-serif; text-transform: uppercase;">
            ${userTccInfo.title}
        </div>
        <div class="cover-element-footer text-center" style="text-align: center; margin-top: auto; font-family: Arial, sans-serif; font-size: 12pt; text-transform: uppercase; margin-bottom: 2cm;">
            Cidade - UF<br>
            2026
        </div>
        
        <div style="page-break-before: always; margin-top: 2cm;"></div>
        
        <h1 style="font-size: 12pt; font-family: Arial, sans-serif; text-transform: uppercase; font-weight: bold; margin-bottom: 1cm; margin-top: 1cm;">1 INTRODUÇÃO</h1>
        <p style="text-indent: 1.25cm; margin-bottom: 1.5cm; text-align: justify; font-size: 12pt; line-height: 1.5; font-family: Arial, sans-serif;">
            A pesquisa sobre o tema <strong>${userTccInfo.theme}</strong> é de suma importância acadêmica. Este trabalho foi estruturado com base nas diretrizes metodológicas do Oráculo do TCC. O problema de pesquisa delimitado consiste na seguinte questão: <em>${userTccInfo.problem}</em>. O objetivo geral é <em>${userTccInfo.objective}</em>. Escreva aqui a contextualização e a justificativa do seu projeto.
        </p>
        
        <h1 style="font-size: 12pt; font-family: Arial, sans-serif; text-transform: uppercase; font-weight: bold; margin-bottom: 1cm; margin-top: 1cm;">2 REVISÃO DA LITERATURA</h1>
        <p style="text-indent: 1.25cm; margin-bottom: 1.5cm; text-align: justify; font-size: 12pt; line-height: 1.5; font-family: Arial, sans-serif;">
            Neste capítulo, apresentamos a fundamentação teórica para o tema <strong>${userTccInfo.theme}</strong>. A revisão bibliográfica constrói o diálogo acadêmico entre os principais teóricos do assunto. <em>[Selecione esta área e clique em "Inserir Citação" ou "Gerar Diálogo" na esquerda para enriquecer seu texto com formatações ABNT NBR 10520]</em>.
        </p>
        
        <h1 style="font-size: 12pt; font-family: Arial, sans-serif; text-transform: uppercase; font-weight: bold; margin-bottom: 1cm; margin-top: 1cm;">3 METODOLOGIA</h1>
        <p style="text-indent: 1.25cm; margin-bottom: 1.5cm; text-align: justify; font-size: 12pt; line-height: 1.5; font-family: Arial, sans-serif;">
            Descreva os caminhos metodológicos adotados. A pesquisa caracteriza-se como um estudo bibliográfico e exploratório com abordagem qualitativa. As fontes primárias e secundárias foram coletadas através de buscas sistemáticas na literatura científica.
        </p>

        <h1 style="font-size: 12pt; font-family: Arial, sans-serif; text-transform: uppercase; font-weight: bold; margin-bottom: 1cm; margin-top: 1cm;">4 ANÁLISE DOS RESULTADOS</h1>
        <p style="text-indent: 1.25cm; margin-bottom: 1.5cm; text-align: justify; font-size: 12pt; line-height: 1.5; font-family: Arial, sans-serif;">
            Apresente as discussões dos dados de forma empírica ou teórica, cruzando as evidências científicas encontradas com as hipóteses formuladas no início do projeto.
        </p>

        <h1 style="font-size: 12pt; font-family: Arial, sans-serif; text-transform: uppercase; font-weight: bold; margin-bottom: 1cm; margin-top: 1cm;">5 CONSIDERAÇÕES FINAIS</h1>
        <p style="text-indent: 1.25cm; margin-bottom: 1.5cm; text-align: justify; font-size: 12pt; line-height: 1.5; font-family: Arial, sans-serif;">
            Nas considerações finais, sintetizamos as respostas ao problema de pesquisa proposto. Apontamos também as limitações do estudo e caminhos de investigação futuros.
        </p>

        <div style="page-break-before: always; margin-top: 2cm;"></div>
        
        <h1 style="font-size: 12pt; font-family: Arial, sans-serif; text-transform: uppercase; font-weight: bold; margin-bottom: 1.5cm; text-align: center;">REFERÊNCIAS</h1>
        <div id="editor-references-section" style="font-size: 12pt; line-height: 1.2; text-align: justify; font-family: Arial, sans-serif;">
            <!-- Generated references go here -->
        </div>
    `;

    editor.innerHTML = docHtml;
    saveDocumentState();

    // Make sure sidebar cards are aligned to user's theme if skipped
    updateAiAssistantCards(userTccInfo.theme);

    // Switch screen view
    document.getElementById('onboarding-screen').classList.remove('active');
    document.getElementById('editor-screen').classList.add('active');
}

function backToOnboarding() {
    if (confirm("Deseja voltar para a tela inicial do chatbot? Suas edições atuais serão preservadas.")) {
        document.getElementById('editor-screen').classList.remove('active');
        document.getElementById('onboarding-screen').classList.add('active');
    }
}

// ==========================================================================
// EDITOR WORD-STYLE ACTIONS
// ==========================================================================
function formatDoc(command, value = null) {
    document.execCommand(command, false, value);
    saveDocumentState();
}

// Helper to inject HTML elements exactly at cursor selection
function insertHTMLAtCursor(html) {
    const editor = document.getElementById('tcc-editor-area');
    editor.focus();
    
    let sel, range;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            
            // Check if selection is actually inside our contenteditable editor
            if (editor.contains(range.commonAncestorContainer)) {
                range.deleteContents();
                
                // Create a temporary container to turn html into DOM nodes
                const el = document.createElement("div");
                el.innerHTML = html;
                const frag = document.createDocumentFragment();
                let node, lastNode;
                while ((node = el.firstChild)) {
                    lastNode = frag.appendChild(node);
                }
                range.insertNode(frag);
                
                // Move cursor directly after the inserted content
                if (lastNode) {
                    range = range.cloneRange();
                    range.setStartAfter(lastNode);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                saveDocumentState();
                return;
            }
        }
    }
    
    // Fallback: append at the end of the text if editor lost focus
    editor.innerHTML += html;
    saveDocumentState();
}

function insertCitationInText() {
    const citationBox = document.getElementById('ai-citation-text');
    let textToInsert = citationBox.dataset.citation;
    
    // If not loaded dynamically from state, fetch current visible text
    if (!textToInsert) {
        textToInsert = citationBox.innerText;
    }

    // Insert as quote
    const htmlToInsert = ` <span>${textToInsert}</span> `;
    insertHTMLAtCursor(htmlToInsert);
    
    // Button Feedback
    showToastNotification("Citação inserida no cursor!");
}

function insertDialogueInText() {
    const citationBox = document.getElementById('ai-citation-text');
    let dialogueToInsert = citationBox.dataset.dialogue;

    // Fallback if not cached
    if (!dialogueToInsert) {
        dialogueToInsert = FALLBACK_CITATION.dialogue;
    }

    const htmlToInsert = `<p style="text-indent: 1.25cm; margin-bottom: 1.5cm; text-align: justify; font-size: 12pt; line-height: 1.5; font-family: Arial, sans-serif;">${dialogueToInsert}</p>`;
    insertHTMLAtCursor(htmlToInsert);

    // Button Feedback
    showToastNotification("Diálogo de autores inserido!");
}

// ==========================================================================
// DRAWER / FLAPPING RIGHT PANELS SYSTEM
// ==========================================================================
function toggleDrawer(drawerId) {
    if (activeDrawer === drawerId) {
        closeDrawer();
    } else {
        openDrawer(drawerId);
    }
}

function openDrawer(drawerId) {
    // Deactivate previous tabs & contents
    document.querySelectorAll('.tab-icon-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.drawer-tab-content').forEach(c => c.classList.add('hidden'));

    // Set Active State
    document.getElementById(`btn-tab-${drawerId}`).classList.add('active');
    document.getElementById(`drawer-content-${drawerId}`).classList.remove('hidden');

    // Title mapping
    const titleEl = document.getElementById('drawer-title');
    if (drawerId === 'margins') {
        titleEl.textContent = 'Simulador de Margens ABNT';
    } else if (drawerId === 'references') {
        titleEl.textContent = 'Gerador de Referências';
    } else if (drawerId === 'guide') {
        titleEl.textContent = 'Busca de Normas';
    }

    // Open Drawer container width transition
    document.getElementById('drawer-panel-container').classList.add('active');
    activeDrawer = drawerId;
}

function closeDrawer() {
    document.getElementById('drawer-panel-container').classList.remove('active');
    document.querySelectorAll('.tab-icon-btn').forEach(btn => btn.classList.remove('active'));
    activeDrawer = null;
}

// ==========================================================================
// REAL-TIME EDITOR MARGINS SIMULATOR (NBR 14724)
// ==========================================================================
function updateEditorMargins() {
    const mTop = parseFloat(document.getElementById('margin-top').value) || 3.0;
    const mLeft = parseFloat(document.getElementById('margin-left').value) || 3.0;
    const mBottom = parseFloat(document.getElementById('margin-bottom').value) || 2.0;
    const mRight = parseFloat(document.getElementById('margin-right').value) || 2.0;
    
    const pageType = document.getElementById('page-type').value;
    const printMode = document.getElementById('print-mode').value;
    
    const editorSheet = document.getElementById('tcc-editor-area');
    const ruler = document.getElementById('ruler-element');

    let visualLeft = mLeft;
    let visualRight = mRight;

    // Adjust left/right margins if printed verso
    if (printMode === 'impresso' && pageType === 'verso') {
        visualLeft = mRight;
        visualRight = mLeft;
    }

    // Apply Margins as padding (in centimeters) directly to the paper element
    editorSheet.style.paddingTop = `${mTop}cm`;
    editorSheet.style.paddingBottom = `${mBottom}cm`;
    editorSheet.style.paddingLeft = `${visualLeft}cm`;
    editorSheet.style.paddingRight = `${visualRight}cm`;

    // Adjust Ruler guidelines to match page left/right padding
    if (ruler) {
        const rulerLine = ruler.querySelector('.ruler-line');
        if (rulerLine) {
            rulerLine.style.left = `${visualLeft}cm`;
            rulerLine.style.right = `${visualRight}cm`;
        }
    }

    // ABNT Compliance Validation Check (Superior=3, Esquerda=3, Inferior=2, Direita=2)
    validateAbntMargins(mTop, mLeft, mBottom, mRight);
}

function validateAbntMargins(t, l, b, r) {
    const isCompliant = (t === 3.0 && l === 3.0 && b === 2.0 && r === 2.0);
    const titleEl = document.getElementById('drawer-title');
    
    if (activeDrawer === 'margins') {
        if (isCompliant) {
            titleEl.innerHTML = 'Layout <span style="font-size: 0.75rem; background: var(--success); color: white; padding: 2px 6px; border-radius: 4px; margin-left: 0.5rem;">ABNT OK</span>';
        } else {
            titleEl.innerHTML = 'Layout <span style="font-size: 0.75rem; background: var(--warning); color: #000; padding: 2px 6px; border-radius: 4px; margin-left: 0.5rem;">Fora do Padrão</span>';
        }
    }
}

function resetEditorMargins() {
    document.getElementById('margin-top').value = 3.0;
    document.getElementById('margin-left').value = 3.0;
    document.getElementById('margin-bottom').value = 2.0;
    document.getElementById('margin-right').value = 2.0;
    document.getElementById('page-type').value = 'anverso';
    document.getElementById('print-mode').value = 'digital';
    updateEditorMargins();
    showToastNotification("Margens redefinidas para ABNT (3-3-2-2)!");
}

// ==========================================================================
// REFERENCE GENERATOR (NBR 6023)
// ==========================================================================
function switchReferenceSubTab(subTabId) {
    document.querySelectorAll('.drawer-subnav .subnav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.ref-sub-fields').forEach(f => f.classList.add('hidden'));

    document.getElementById(`subtab-btn-${subTabId}`).classList.add('active');
    document.getElementById(`ref-drawer-fields-${subTabId}`).classList.remove('hidden');

    referenceSubTab = subTabId;
}

function generateReferenceDrawer() {
    const rawAuthors = document.getElementById('ref-authors').value.trim();
    const title = document.getElementById('ref-title').value.trim();
    const year = document.getElementById('ref-year').value.trim();

    if (!rawAuthors || !title || !year) return;

    // Authors ABNT Formatter
    let formattedAuthors = formatRefAuthors(rawAuthors);
    let referenceHTML = '';

    if (referenceSubTab === 'livro') {
        const city = document.getElementById('ref-book-city').value.trim() || 'Cidade não identificada';
        const publisher = document.getElementById('ref-book-publisher').value.trim() || 'Editora não identificada';
        referenceHTML = `${formattedAuthors}. <strong>${title}</strong>. ${city}: ${publisher}, ${year}.`;
    } 
    else if (referenceSubTab === 'artigo') {
        const journal = document.getElementById('ref-journal-name').value.trim() || 'Revista Acadêmica';
        const volume = document.getElementById('ref-journal-volume').value.trim();
        const pages = document.getElementById('ref-journal-pages').value.trim();

        const volStr = volume ? `, ${volume}` : '';
        const pagStr = pages ? `, p. ${pages}` : '';

        referenceHTML = `${formattedAuthors}. ${title}. <strong>${journal}</strong>${volStr}${pagStr}, ${year}.`;
    } 
    else if (referenceSubTab === 'web') {
        const site = document.getElementById('ref-web-site').value.trim() || 'Website';
        const url = document.getElementById('ref-web-url').value.trim() || 'http://';
        
        // Dynamic access date format
        const today = new Date();
        const ABNT_MONTHS = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
        const dateStr = `${today.getDate()} ${ABNT_MONTHS[today.getMonth()]} ${today.getFullYear()}`;

        referenceHTML = `${formattedAuthors}. <strong>${title}</strong>. ${site}, ${year}. Disponível em: &lt;${url}&gt;. Acesso em: ${dateStr}.`;
    }

    // Display Output
    const outputBox = document.getElementById('ref-output-drawer-box');
    const outputText = document.getElementById('ref-drawer-output-html');
    
    outputText.innerHTML = referenceHTML;
    outputBox.style.display = 'block';
}

function formatRefAuthors(raw) {
    const list = raw.split(';').map(a => a.trim()).filter(a => a.length > 0);
    if (list.length === 0) return 'SEM AUTOR';

    if (list.length <= 3) {
        return list.join('; ');
    } else {
        // et al rule
        return `${list[0]} <em>et al</em>.`;
    }
}

function copyDrawerReferenceText() {
    const el = document.getElementById('ref-drawer-output-html');
    const textToCopy = el.innerText;
    const htmlToCopy = el.innerHTML;

    // Copy rich text format to retain bolding in Word
    const listener = function(e) {
        e.clipboardData.setData('text/html', htmlToCopy);
        e.clipboardData.setData('text/plain', textToCopy);
        e.preventDefault();
    };

    document.addEventListener('copy', listener);
    document.execCommand('copy');
    document.removeEventListener('copy', listener);

    showToastNotification("Referência copiada com formatação!");
}

function insertReferenceInEditor() {
    const refSection = document.getElementById('editor-references-section');
    const refHtml = document.getElementById('ref-drawer-output-html').innerHTML;
    
    if (refSection) {
        // Create paragraph for citation
        const p = document.createElement('p');
        p.style.marginBottom = '0.5cm';
        p.style.textAlign = 'justify';
        p.style.lineHeight = '1.2';
        p.style.fontFamily = 'Arial, sans-serif';
        p.style.fontSize = '12pt';
        p.innerHTML = refHtml;
        
        refSection.appendChild(p);
        saveDocumentState();

        // Scroll to editor bottom/references
        refSection.scrollIntoView({ behavior: 'smooth' });
        showToastNotification("Referência inserida no final do TCC!");
        closeDrawer();
    } else {
        alert("Seção de Referências não encontrada no documento!");
    }
}

// ==========================================================================
// GUIDE SEARCH / FILTER IN DRAWER
// ==========================================================================
function filterDrawerGuide() {
    const query = document.getElementById('drawer-guide-search').value.toLowerCase().trim();
    const cards = document.querySelectorAll('.drawer-guide-card');

    cards.forEach(card => {
        const keywords = card.getAttribute('data-keywords').toLowerCase();
        const text = card.textContent.toLowerCase();

        if (keywords.includes(query) || text.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function openStandaloneGuide() {
    openDrawer('guide');
}

// ==========================================================================
// THEME & PERSISTENCE & TOAST HELPERS
// ==========================================================================
function toggleTheme() {
    const body = document.body;
    const toggleBtn = document.getElementById('theme-toggle-editor');
    
    if (currentTheme === 'light') {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        currentTheme = 'dark';
    } else {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        currentTheme = 'light';
    }
}

function saveDocumentState() {
    const editor = document.getElementById('tcc-editor-area');
    const title = document.getElementById('doc-name-input').value;
    localStorage.setItem('abnt_dex_document_content', editor.innerHTML);
    localStorage.setItem('abnt_dex_document_title', title);
}

function saveDocument() {
    saveDocumentState();
    showToastNotification("Documento salvo localmente com sucesso!");
}

function exportPDF() {
    // Direct trigger print which executes media print styles
    window.print();
}

// Notification Toast Alert Creator
function showToastNotification(message) {
    // Create toast element
    const toast = document.createElement("div");
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%) translateY(20px)";
    toast.style.backgroundColor = "var(--primary-color)";
    toast.style.color = "white";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "var(--shadow-md)";
    toast.style.fontSize = "0.85rem";
    toast.style.fontWeight = "600";
    toast.style.fontFamily = "var(--font-heading)";
    toast.style.zIndex = "9999";
    toast.style.opacity = "0";
    toast.style.transition = "transform 0.3s ease, opacity 0.3s ease";
    
    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="margin-right: 0.5rem;"></i> ${message}`;
    document.body.appendChild(toast);
    
    // Trigger transition
    setTimeout(() => {
        toast.style.transform = "translateX(-50%) translateY(0)";
        toast.style.opacity = "1";
    }, 50);

    // Fadeout and remove
    setTimeout(() => {
        toast.style.transform = "translateX(-50%) translateY(20px)";
        toast.style.opacity = "0";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2500);
}

// Expose functions globally for index.html inline event listeners
window.sendChatMessage = sendChatMessage;
window.skipToEditor = skipToEditor;
window.loadSkeletonIntoEditor = loadSkeletonIntoEditor;
window.backToOnboarding = backToOnboarding;
window.formatDoc = formatDoc;
window.insertCitationInText = insertCitationInText;
window.insertDialogueInText = insertDialogueInText;
window.toggleDrawer = toggleDrawer;
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.updateEditorMargins = updateEditorMargins;
window.resetEditorMargins = resetEditorMargins;
window.switchReferenceSubTab = switchReferenceSubTab;
window.generateReferenceDrawer = generateReferenceDrawer;
window.copyDrawerReferenceText = copyDrawerReferenceText;
window.insertReferenceInEditor = insertReferenceInEditor;
window.filterDrawerGuide = filterDrawerGuide;
window.openStandaloneGuide = openStandaloneGuide;
window.toggleTheme = toggleTheme;
window.saveDocument = saveDocument;
window.saveDocumentState = saveDocumentState;
window.exportPDF = exportPDF;

