const apiUrl = "https://localhost:7113/api/registro"; // URL da API

function toggleMenu() { // isso aqui para funcionar o TopBar do Perfil
    var menu = document.getElementById("dropdownMenu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}




// Atualiza o relógio em tempo real
function atualizarRelogio() {
    const agora = new Date();
    const opcoes = { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' };
    const horaBrasilia = new Intl.DateTimeFormat('pt-BR', opcoes).format(agora);
    document.getElementById('clock').textContent = horaBrasilia;
}
setInterval(atualizarRelogio, 1000);
atualizarRelogio();

let registroAtual = null;
const botaoBatida = document.getElementById("batidaPontoBtn");

// Registra ou finaliza o ponto
botaoBatida.addEventListener("click", async function () {
    try {
        const agora = new Date().toISOString();

        if (!registroAtual) {
            // Atualiza a interface imediatamente para parecer mais rápido
            registroAtual = { inicio: agora, fim: null, batidas: 1 };
            botaoBatida.classList.replace("btn-primary", "btn-danger");
            botaoBatida.textContent = "Finalizar Ponto";

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registroAtual)
            });

            const dados = await response.json();
            registroAtual.id = dados.id;
        } else if (!registroAtual.fim) {
            botaoBatida.classList.replace("btn-danger", "btn-primary");
            botaoBatida.textContent = "Bater Ponto";

            registroAtual.fim = agora;
            registroAtual.batidas++;

            await fetch(`${apiUrl}/${registroAtual.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registroAtual)
            });

            registroAtual = null;
        }

        atualizarInterface();
    } catch (error) {
        console.error("Erro ao registrar/finalizar batida:", error);
    }
});

// Exibe o histórico de registros
async function listarHistorico() {
    try {
        const response = await fetch(apiUrl);
        const batidas = await response.json();
        
        const tabela = document.getElementById("tabelaHistórico");
        tabela.innerHTML = "";

        batidas.forEach(batida => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${new Date(batida.inicio).toLocaleDateString()}</td>
                <td>${batida.batidas}</td>
                <td>${new Date(batida.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td>${batida.fim ? new Date(batida.fim).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Aguardando'}</td>
                <td>${batida.totalTrabalhado ? formatarHoras(batida.totalTrabalhado) : '-'}</td>
                <td>
                    <button class="adjust-btn" onclick="ajustarRegistro('${batida.id}')">Ajustar</button>
                    <button class="delete-btn" onclick="deletarRegistro('${batida.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tabela.appendChild(tr);
        });

        const ultimoRegistro = batidas[batidas.length - 1];
        if (ultimoRegistro && !ultimoRegistro.fim) {
            registroAtual = ultimoRegistro;
            botaoBatida.classList.replace("btn-primary", "btn-danger");
            botaoBatida.textContent = "Finalizar Ponto";
        }
    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
    }
}

// Exibe os últimos registros com apenas data e hora
async function listarUltimosRegistros() {
    try {
        const response = await fetch(apiUrl);
        const batidas = await response.json();

        const lista = document.getElementById("ultimosRegistros");
        lista.innerHTML = "";

        batidas.slice(-4).forEach(batida => {
            const data = new Date(batida.inicio).toLocaleDateString();
            const horaInicio = new Date(batida.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const horaFim = batida.fim ? new Date(batida.fim).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Aguardando";

            const li = document.createElement("li");
            li.textContent = `${data} ${horaInicio} - ${horaFim}`;
            lista.appendChild(li);
        });
    } catch (error) {
        console.error("Erro ao carregar últimos registros:", error);
    }
}

// Formata as horas trabalhadas
function formatarHoras(totalTrabalhado) {
    if (!totalTrabalhado) return "-";
    const [horas, minutos] = totalTrabalhado.split(':').map(Number);
    return `${horas}h ${minutos}m`;
}

// Ajusta um registro de ponto
async function ajustarRegistro(id) {
    try {
        const response = await fetch(`${apiUrl}/${id}`);
        const batida = await response.json();

        const novoInicio = prompt("Digite o novo horário de início (HH:mm)", new Date(batida.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        const novoFim = prompt("Digite o novo horário de fim (HH:mm)", batida.fim ? new Date(batida.fim).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "");

        if (novoInicio) {
            const dataInicio = new Date(batida.inicio);
            const [horaInicio, minInicio] = novoInicio.split(':').map(Number);
            dataInicio.setHours(horaInicio, minInicio);
            batida.inicio = dataInicio.toISOString();
        }

        if (novoFim) {
            const dataFim = new Date(batida.inicio);
            const [horaFim, minFim] = novoFim.split(':').map(Number);
            dataFim.setHours(horaFim, minFim);
            batida.fim = dataFim.toISOString();
        }

        await fetch(`${apiUrl}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(batida)
        });

        atualizarInterface();
    } catch (error) {
        console.error("Erro ao ajustar registro:", error);
    }
}

// Exclui um registro de ponto
async function deletarRegistro(id) {
    try {
        if (confirm("Tem certeza que deseja excluir este registro?")) {
            await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
            atualizarInterface();
        }
    } catch (error) {
        console.error("Erro ao deletar registro:", error);
    }
}

// Atualiza a interface com os dados mais recentes
function atualizarInterface() {
    listarHistorico();
    listarUltimosRegistros();
}

// Inicia a interface quando a página carregar
document.addEventListener("DOMContentLoaded", atualizarInterface);










//  obter o nome do usuário pelo e-mail
async function carregarNomeUsuario() {
    const email = localStorage.getItem("emailUsuario");
    console.log("E-mail recuperado do localStorage:", email);  

    if (!email) {
        console.error("E-mail do usuário não encontrado.");
        document.getElementById("userName").textContent = "E-mail não encontrado";
        return;
    }

    try {
        const response = await fetch(`https://localhost:7113/api/cadastro/usuario?email=${encodeURIComponent(email)}`);
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar usuário: ${response.status}`);
        }
        
        const usuario = await response.json();
        console.log("Usuário retornado pela API:", usuario);  

        if (usuario && usuario.nome) {
            document.getElementById("userName").textContent = usuario.nome;
        } else {
            document.getElementById("userName").textContent = "Usuário não encontrado";
        }
    } catch (error) {
        console.error("Erro ao carregar o nome do usuário:", error);
        document.getElementById("userName").textContent = "Erro ao carregar nome";
    }
}

document.addEventListener("DOMContentLoaded", carregarNomeUsuario);




// Upload de Imagem

document.getElementById('uploadInput').addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async function () {
        let base64Image = reader.result;

        base64Image = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

        const cadastroId = localStorage.getItem("cadastroId"); 

        if (!cadastroId) {
            alert("ID do usuário não encontrado. Faça login novamente.");
            return;
        }

        try {
            const response = await fetch(`https://localhost:7113/api/cadastro/Imagem/${cadastroId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ imagemBase64: base64Image })
            });

            if (!response.ok) {
                throw new Error("Erro ao enviar a imagem.");
            }

            alert("Imagem enviada com sucesso!");
            document.getElementById('profilePic').src = `data:image/png;base64,${base64Image}`;

        } catch (error) {
            console.error("Erro ao enviar a imagem:", error);
            alert("Ocorreu um erro ao enviar a imagem.");
        }
    };

    reader.onerror = function (error) {
        console.error("Erro ao ler o arquivo:", error);
    };
});

