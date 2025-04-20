
function toggleMenu() { // isso aqui para funcionar o TopBar do Perfil
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
            const response = await fetch(this.apiUrl);
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
                        <button class="adjust-btn" onclick="ajustarRegistro('${r.idRegistro}')">Ajustar</button>
                        <button class="delete-btn" onclick="deletarRegistro('${r.idRegistro}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                `;
                tabela.appendChild(tr);
            });

            const ultimo = registros[registros.length - 1];
            if (ultimo && ultimo.qtdeBatidas < 4) {
                registroAtual = { ...ultimo };
            
                if (registroAtual.qtdeBatidas === 1) {
                    botaoBatida.textContent = "Saída para almoço";
                } else if (registroAtual.qtdeBatidas === 2) {
                    botaoBatida.textContent = "Volta do almoço";
                } else if (registroAtual.qtdeBatidas === 3) {
                    botaoBatida.textContent = "Finalizar expediente";
                }
            
                botaoBatida.classList.replace("btn-primary", "btn-danger");
            }
        } catch (error) {
            console.error("Erro ao listar histórico:", error);
        }

        
    }
    
    async listarUltimosRegistros() {
        try {
            const response = await fetch(this.apiUrl);
            const registros = await response.json();

            const lista = document.getElementById("ultimosRegistros");
            lista.innerHTML = "";

            // Mostra os 3 últimos registros (ou menos)
            const ultimos = registros.slice(-3).reverse();

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
    registroService.carregarDados();
    document.getElementById("batidaPontoBtn").addEventListener("click", () => registroService.registrarPonto());
});









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
        const response = await fetch(`https://localhost:7212/api/cadastro/usuario?email=${encodeURIComponent(email)}`);
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar usuário: ${response.status}`);
        }
        
        const usuario = await response.json();
        console.log("Usuário retornado pela API:", usuario);  

        if (usuario && usuario.nome) {
            document.getElementById("userName").textContent = usuario.nome;

            if (usuario.userId) {
                localStorage.setItem("cadastroId", usuario.userId);
                console.log("ID salvo no localStorage:", usuario.userId);
            } else {
                console.warn("userId não encontrado na resposta da API.");
            }

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
            const response = await fetch(`https://localhost:7212/api/cadastro/Imagem/${cadastroId}`, {
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

