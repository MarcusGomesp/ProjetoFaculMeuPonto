function toggleMenu() {
    var menu = document.getElementById("dropdownMenu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

const apiUrl = "https://localhost:7212/api/Registro";
let registroAtual = null;
const botaoBatida = document.getElementById("batidaPontoBtn");

class RegistroService {
    constructor() {
        this.apiUrl = apiUrl;
    }

    async validarIdRegistro() {
        const cadastroId = localStorage.getItem("cadastroId");
        if (!cadastroId) return false;

        try {
            const response = await fetch(`https://localhost:7212/api/cadastro/usuario/${cadastroId}`);
            return response.ok;
        } catch (error) {
            console.error("Erro ao validar ID:", error);
            return false;
        }
    }

    async registrarPonto() {
        try {
            const agora = new Date().toISOString();
            const cadastroId = localStorage.getItem("cadastroId");

            if (!await this.validarIdRegistro()) return;

            if (!registroAtual) {
                registroAtual = {
                    dataInicio: agora,
                    qtdeBatidas: 1,
                    userId: parseInt(cadastroId)
                };
                botaoBatida.textContent = "Saída para almoço";
            } else {
                registroAtual.qtdeBatidas++;

                if (registroAtual.qtdeBatidas === 2) {
                    registroAtual.saidaAlmoco = agora;
                    botaoBatida.textContent = "Volta do almoço";
                } else if (registroAtual.qtdeBatidas === 3) {
                    registroAtual.voltaAlmoco = agora;
                    botaoBatida.textContent = "Finalizar expediente";
                } else if (registroAtual.qtdeBatidas === 4) {
                    registroAtual.fim = agora;
                    botaoBatida.textContent = "Bater ponto";

                    await fetch(`${this.apiUrl}/${registroAtual.idRegistro}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(registroAtual)
                    });

                    registroAtual = null;
                    this.atualizarInterface();
                    return;
                }
            }

            if (registroAtual.qtdeBatidas === 1) {
                const response = await fetch(this.apiUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(registroAtual)
                });

                const dados = await response.json();
                registroAtual.idRegistro = dados.idRegistro;
                localStorage.setItem("idRegistro", dados.idRegistro);
            } else {
                await fetch(`${this.apiUrl}/${registroAtual.idRegistro}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(registroAtual)
                });
            }

            this.atualizarInterface();
        } catch (error) {
            console.error("Erro ao registrar batida:", error);
        }
    }

    async listarHistorico() {
        try {
            const userId = localStorage.getItem("cadastroId");
    
            if (!userId) {
                throw new Error("Usuário não encontrado no localStorage.");
            }
    
            const response = await fetch(`https://localhost:7212/api/registro/usuario/${userId}`);
    
            if (!response.ok) {
                throw new Error("Erro ao buscar registros do usuário");
            }
    
            const registros = await response.json();
            const tabela = document.getElementById("tabelaHistórico");
            tabela.innerHTML = "";
    
            registros.forEach(r => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${new Date(r.dataInicio).toLocaleDateString()}</td>
                    <td>${r.qtdeBatidas}</td>
                    <td>${new Date(r.dataInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>${r.fim ? new Date(r.fim).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Aguardando"}</td>
                    <td>${r.totalHora ? this.formatarHoras(r.totalHora) : '-'}</td>
                    <td>
                        <button class="adjust-btn" onclick="abrirModal(${r.idRegistro})">Ajustar</button>
                    </td>
                `;
                tabela.appendChild(tr);
            });
    
            const ultimo = registros[registros.length - 1];
            if (ultimo && ultimo.qtdeBatidas < 4) {
                registroAtual = { ...ultimo };
    
                const textos = ["Saída para almoço", "Volta do almoço", "Finalizar expediente"];
                botaoBatida.textContent = textos[registroAtual.qtdeBatidas - 1] || "Bater ponto";
    
                botaoBatida.classList.replace("btn-primary", "btn-danger");
            }
        } catch (error) {
            console.error("Erro ao listar histórico:", error);
        }
    }
    

    async listarUltimosRegistros() {
        try {
            const userId = localStorage.getItem("cadastroId");
            if (!userId) throw new Error("ID do usuário não encontrado.");
    
            const response = await fetch(`https://localhost:7212/api/registro/usuario/${userId}`);
    
            if (!response.ok) throw new Error("Erro ao buscar registros");
    
            const registros = await response.json();
    
            const lista = document.getElementById("ultimosRegistros");
            lista.innerHTML = "";
    
            const ultimos = registros.slice(0, 3); 
    
            ultimos.forEach(r => {
                const item = document.createElement("li");
                const data = new Date(r.dataInicio).toLocaleDateString();
                const hora = new Date(r.dataInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
                item.textContent = `${data} - ${hora} (${r.qtdeBatidas} batida${r.qtdeBatidas > 1 ? 's' : ''})`;
                lista.appendChild(item);
            });
        } catch (error) {
            console.error("Erro ao carregar últimos registros:", error);
        }
    }
    

    formatarHoras(str) {
        if (!str) return '-';
        const [h, m] = str.split(':').map(Number);
        return `${h}h ${m}m`;
    }

    atualizarInterface() {
        this.listarHistorico();
    }

    async carregarDados() {
        this.atualizarRelogio();
        await this.listarHistorico();
        await this.listarUltimosRegistros();
    }

    atualizarRelogio() {
        const agora = new Date();
        const hora = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit'
        }).format(agora);
        document.getElementById('clock').textContent = hora;
    }
}

const registroService = new RegistroService();

document.addEventListener("DOMContentLoaded", () => {
    carregarNomeUsuario();
    carregarImagemPerfil(); 
    registroService.carregarDados();
    document.getElementById("batidaPontoBtn").addEventListener("click", () => registroService.registrarPonto());
});

async function carregarNomeUsuario() {
    const email = localStorage.getItem("emailUsuario");
    console.log("📧 E-mail recuperado do localStorage:", email);

    if (!email) {
        document.getElementById("userName").textContent = "E-mail não encontrado";
        return;
    }

    try {
        const response = await fetch(`https://localhost:7212/api/cadastro/usuario?email=${encodeURIComponent(email)}`);
        if (!response.ok) throw new Error("Erro ao buscar usuário");

        const usuario = await response.json();
        if (usuario) {
            document.getElementById("userName").textContent = usuario.nome ?? "Usuário";
            localStorage.setItem("cadastroId", usuario.userId);
            if (usuario.urlProfilePic) localStorage.setItem("urlProfilePic", usuario.urlProfilePic);
        } else {
            document.getElementById("userName").textContent = "Usuário não encontrado";
        }
    } catch (error) {
        console.error("Erro ao carregar nome:", error);
        document.getElementById("userName").textContent = "Erro ao carregar nome";
    }
}

function carregarImagemPerfil() {
    const foto = localStorage.getItem("urlProfilePic");
    const img = document.getElementById("profilePic");
    img.src = foto ? `data:image/png;base64,${foto}` : "img/profile.jpg";
}

document.getElementById('uploadInput').addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async function () {
        let base64Image = reader.result.replace(/^data:image\/[a-z]+;base64,/, "");
        const cadastroId = localStorage.getItem("cadastroId");

        if (!cadastroId) {
            alert("ID do usuário não encontrado. Faça login novamente.");
            return;
        }

        try {
            const response = await fetch(`https://localhost:7212/api/perfil/Imagem/${cadastroId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ urlImagem: base64Image })
            });

            if (!response.ok) throw new Error("Erro ao enviar a imagem");

            alert("Imagem enviada com sucesso!");
            localStorage.setItem("urlProfilePic", base64Image);
            carregarImagemPerfil();
        } catch (error) {
            console.error("Erro ao enviar a imagem:", error);
            alert("Erro ao enviar imagem.");
        }
    };

    reader.onerror = function (error) {
        console.error("Erro ao ler o arquivo:", error);
    };
});






function abrirModal(idRegistro) {
    idRegistroSelecionado = idRegistro;
    document.getElementById("modalAjuste").style.display = "flex";
}

function fecharModal() {
    document.getElementById("modalAjuste").style.display = "none";
}


async function enviarAjuste() {
    const horario = document.getElementById("novoHorario").value;
    const userId = localStorage.getItem("cadastroId");

    if (!horario || !userId || !idRegistroSelecionado) {
        alert("Preencha o horário corretamente.");
        return;
    }

    const solicitacao = {
        userId: parseInt(userId),
        idRegistro: idRegistroSelecionado,
        horario: horario + ":00",
        status: 0,
        observacao: "Ajuste de horário solicitado "
    };

    try {
        const response = await fetch("https://localhost:7212/api/solicitacao", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(solicitacao) 
        });

        if (!response.ok) throw new Error("Erro ao enviar solicitação.");

        alert("Solicitação enviada com sucesso!");
        fecharModal();
    } catch (error) {
        console.error("Erro ao enviar ajuste:", error);
        alert("Erro ao enviar solicitação.");
    }
}