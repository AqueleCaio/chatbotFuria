$(document).ready(function () {
    const $messageInput = $('#message-input');
    const $sendBtn = $('#send-btn');
    const $chatMessages = $('#chat-messages');

    let categorias = {};
    let base = {};
    let respostas = [];

    async function loadData() {
        try {
            const [categoriasResponse, respostasResponse] = await Promise.all([
                fetch('./categories.json'),
                fetch('./answer.json')
            ]);

            if (!categoriasResponse.ok || !respostasResponse.ok) {
                throw new Error("Erro ao carregar arquivos JSON.");
            }

            const categoriasData = await categoriasResponse.json();
            const respostasData = await respostasResponse.json();

            categorias = categoriasData.categorias;
            base = categoriasData.base;
            respostas = respostasData.respostas;
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        }
    }

    // Carrega os dados na inicialização
    loadData();

    function addUserMessage(message) {
        const messageElement = $(`
            <div class="message user-message">
                <p>${message}</p>
                <span class="text-xs opacity-70 block mt-1 text-right">${getCurrentTime()}</span>
            </div>
        `);
        $chatMessages.append(messageElement);
        scrollToBottom();
    }

    function addBotMessage(message) {
        $('.typing-indicator').remove();
        const messageElement = $(`
            <div class="message bot-message">
                <p>${message}</p>
                <span class="text-xs opacity-70 block mt-1 text-right">${getCurrentTime()}</span>
            </div>
        `);
        $chatMessages.append(messageElement);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const typingElement = $(`
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `);
        $chatMessages.append(typingElement);
        scrollToBottom();
    }

    function scrollToBottom() {
        $chatMessages.scrollTop($chatMessages.prop("scrollHeight"));
    }

    function getCurrentTime() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }


    function getBestResponse(message) {
        const inputWords = message.toLowerCase().split(/\W+/);
        const userCodes = [];
    
        const baseCodes = Object.values(base);
        const allCategories = { ...base, ...categorias };
    
        let hasNonBaseCode = false;
    
        inputWords.forEach(word => {
            const code = allCategories[word];
            if (code !== undefined) {
                userCodes.push(code);
                if (!baseCodes.includes(code)) {
                    hasNonBaseCode = true;
                }
            }
        });
    
        if (userCodes.length === 0 || !hasNonBaseCode) {
            return "Desculpe, não entendi. Pode reformular sua pergunta?";
        }
    
        // Continuação da lógica de busca por resposta...
        let bestMatches = [];
        let maxIntersection = 0;
    
        respostas.forEach(r => {
            const intersection = r.codigo.filter(code => userCodes.includes(code));
            const matchScore = intersection.length;
    
            if (matchScore > maxIntersection) {
                maxIntersection = matchScore;
                bestMatches = [r];
            } else if (matchScore === maxIntersection) {
                bestMatches.push(r);
            }
        });
    
        if (bestMatches.length === 0) {
            return "Desculpe, não encontrei uma resposta adequada.";
        }
    
        // Escolher a resposta mais específica
        let bestResponse = bestMatches[0];
        bestMatches.forEach(r => {
            if (r.codigo.length < bestResponse.codigo.length) {
                bestResponse = r;
            }
        });
    
        console.log("Palavras do usuário:", inputWords);
        console.log("Códigos identificados:", userCodes);
        console.log("Resposta escolhida:", bestResponse.resposta);
    
        return bestResponse.resposta;
    }
    

    function handleUserInput(message) {
        addUserMessage(message);
        $messageInput.val('');

        showTypingIndicator();

        setTimeout(() => {
            const botReply = getBestResponse(message);
            addBotMessage(botReply);
        }, 1000 + Math.random() * 2000);
    }

    $sendBtn.on('click', function () {
        const message = $messageInput.val().trim();
        if (message) {
            handleUserInput(message);
        }
    });

    $messageInput.on('keypress', function (e) {
        if (e.key === 'Enter') {
            $sendBtn.click();
        }
    });

    addBotMessage("Olá! Sou seu assistente virtual. Como posso te ajudar hoje?");
});
