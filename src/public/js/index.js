const socket = io();

const swal = async () => {
    try {
        let chatBox = document.getElementById('chatBox');
        const result = await Swal.fire({
            title: 'Identificate',
            input: 'text',
            text: 'Ingresa un usuario para chatear',
            inputValidator: (value) => {
                return !value && 'Necesitas ingresar un usuario para chatear'
                // Validacion para que el usuario deba ingresar una identificacion obligatoriamente
            },
            allowOutsideClick: false // Al dar click fuera de la pantalla el usuario no sale de la alerta
        })

        const user = result.value;
        socket.emit('newUser', user);

        socket.on('userConnected', user => {
            Swal.fire({
                text: `Se ha conectado ${user}`,
                toast: true,
                position: 'top-right',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
                icon: 'success' 
            })
        })

        chatBox.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                if(chatBox.value.trim().length > 0) {
                    socket.emit('message', {user, message: chatBox.value});
                    chatBox.value = ''; // Se limpia el chatBox
                }
            }
        })

    } catch (error) {
        console.log(error);
    }
}

socket.on('messageLogs', (data) => {
    const log = document.getElementById('messageLogs');

    let messages = '';

    data.forEach(msg => {
        messages = messages + `${msg.user}: ${msg.message} </br>`
    });

    log.innerHTML = messages;
})

swal();