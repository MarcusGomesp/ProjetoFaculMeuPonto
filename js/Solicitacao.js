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
  
  
  document.addEventListener("DOMContentLoaded", () => {
    carregarInformacoesUsuario(); // carrega nome e imagem do usuário
  
    const tableBody = document.querySelector("tbody");
  
    // Toggle do menu do perfil
    window.toggleMenu = function () {
        const menu = document.getElementById("dropdownMenu");
        menu.style.display = menu.style.display === "block" ? "none" : "block";
    };
  
    // Clique para editar/salvar
    tableBody.addEventListener("click", function (e) {
        if (e.target.closest(".edit-btn")) {
            const btn = e.target.closest(".edit-btn");
            const row = btn.closest("tr");
            const dateCell = row.children[0];
            const timeCell = row.children[1];
  
            const isEditing = row.dataset.editing === "true";
  
            if (isEditing) {
                const dateInput = dateCell.querySelector("input");
                const timeInput = timeCell.querySelector("input");
  
                const formattedDate = formatDateDisplay(dateInput.value);
                const formattedTime = timeInput.value;
  
                dateCell.textContent = formattedDate;
                timeCell.textContent = formattedTime;
  
                btn.innerHTML = `<i class="fa fa-pen-to-square"></i>`;
                row.dataset.editing = "false";
            } else {
                const currentDate = dateCell.textContent;
                const currentTime = timeCell.textContent;
  
                dateCell.innerHTML = `<input type="date" value="${formatDateInput(currentDate)}">`;
                timeCell.innerHTML = `<input type="time" value="${currentTime}">`;
  
                btn.innerHTML = `<i class="fa fa-check"></i>`;
                row.dataset.editing = "true";
            }
        }
    });
  
    // Adicionar nova linha
    document.querySelector(".add-btn").addEventListener("click", () => {
        const newRow = document.createElement("tr");
        newRow.dataset.editing = "true";
        newRow.innerHTML = `
            <td><input type="date"></td>
            <td><input type="time"></td>
            <td><button class="edit-btn"><i class="fa fa-check"></i></button></td>
        `;
        tableBody.appendChild(newRow);
    });
  
    // Solicitar ajustes (salvar tudo)
    document.querySelector(".solicitar-btn").addEventListener("click", () => {
        const rows = tableBody.querySelectorAll("tr");
        const ajustes = [];
  
        rows.forEach(row => {
            let date, time;
  
            if (row.dataset.editing === "true") {
                const dateInput = row.querySelector('input[type="date"]');
                const timeInput = row.querySelector('input[type="time"]');
  
                if (dateInput && timeInput && dateInput.value && timeInput.value) {
                    date = formatDateDisplay(dateInput.value);
                    time = timeInput.value;
  
                    row.children[0].textContent = date;
                    row.children[1].textContent = time;
                    row.children[2].innerHTML = `<button class="edit-btn"><i class="fa fa-pen-to-square"></i></button>`;
                    row.dataset.editing = "false";
                }
            }
  
            date = row.children[0].textContent;
            time = row.children[1].textContent;
  
            if (date && time) {
                ajustes.push({ data: date, hora: time });
            }
        });
  
        const observacao = document.getElementById("observacao").value;
        console.log("Ajustes:", ajustes);
        console.log("Observação:", observacao);
  
        alert("Ajustes enviados com sucesso! ✅");
    });
  });
  
  
  
  
  // Helpers de formatação de datas
  function formatDateDisplay(isoDate) {
    const [yyyy, mm, dd] = isoDate.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }
  
  function formatDateInput(dateStr) {
    const [dd, mm, yyyy] = dateStr.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }
  