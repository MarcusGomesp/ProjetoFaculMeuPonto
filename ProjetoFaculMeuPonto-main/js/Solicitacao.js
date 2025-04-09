const userInfo = document.getElementById("user-info");
  
    const userData = {
      name: "Joana Moura",
      photo: "https://randomuser.me/api/portraits/women/44.jpg"
    };
  
    userInfo.innerHTML = `
      <img src="${userData.photo}" alt="User Photo" class="user-photo"/>
      <span class="user-name">${userData.name}</span>
    `;
  
    const tableBody = document.querySelector("tbody");
  
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
  
        // Coleta valores já salvos
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
  
    // Helper: formata yyyy-mm-dd para dd/mm/yyyy
    function formatDateDisplay(isoDate) {
      const [yyyy, mm, dd] = isoDate.split("-");
      return `${dd}/${mm}/${yyyy}`;
    }
  
    // Helper: formata dd/mm/yyyy para yyyy-mm-dd
    function formatDateInput(dateStr) {
      const [dd, mm, yyyy] = dateStr.split("/");
      return `${yyyy}-${mm}-${dd}`;
    }