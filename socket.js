

function wrapperWithSocket(server) {
    const clients = {}
    let chatBoard = []
    const { Server } = require('socket.io')
    const io = new Server(server, { cors: { origin: '*' }, maxHttpBufferSize: 1e9 }) //  1e9:1GB
    io.on('connect', (socket) => {
        socket.on('clientOnline', (data) => {
            const { deviceId } = data
            console.log('data:', data)
            clients[deviceId] = socket
            console.log('client online', socket.id)
            updateClientStatus(socket)
        })
        socket.on('disconnect', () => {
            const device = Object.keys(clients).find(key => clients[key] === socket)
            console.log('remove device:', device)
            delete clients[device]
            console.log('client disconnect', socket.id)
            updateClientStatus(socket)
        })

        socket.on('send-file-to-server', (data) => {
            console.log('send-file-to-server:', data)
            chatBoard.push(...data)
            chatBoard.sort((a, b) => a.timestamp - b.timestamp)
            updateChatBoard()
        })
        socket.on('clear-chat-board', () => {
            chatBoard = []
            updateChatBoard()
        })
        socket.on('get-file-content', (data) => {
            const { timestamp, name } = data
            const file = chatBoard.find(item => item.timestamp === timestamp && item.name === name)
            if (file) {
                socket.emit('download-file', file)
            }
        })
    })
    const updateChatBoard = denounce(() => {
        console.log('update chat board')
        io.emit('update-chat-board', { chatBoardNoContent: chatBoard.map(item => omit(item, 'content')) })
    }, 500)

    const updateClientStatus = denounce(() => {
        const onlineClients = Object.keys(clients)
        console.log('current device:', onlineClients)
        console.log('current socket:', onlineClients.map(key => clients[key].id))
        // socket.emit('online-clients', { onlineClients })
        io.emit('online-clients', { onlineClients })
        updateChatBoard()
    }, 1000)

    function denounce(fn, delay) {
        let timer = null
        return function (args) {
            if (timer) {
                clearTimeout(timer)
            }
            timer = setTimeout(() => {
                fn(args)
            }, delay)
        }
    }

    function omit(obj, keys) {
        const result = {}
        for (const key in obj) {
            if (keys.includes(key)) {
                continue
            }
            result[key] = obj[key]
        }
        return result
    }
}



module.exports = wrapperWithSocket