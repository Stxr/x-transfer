// server.js
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const app = require('express')()
const server = require('http').Server(app)
const { Server } = require('socket.io')
// const p2p = require('socket.io-p2p-server').Server
const ip = require('ip')
const qrcode = require('qrcode-terminal')
const dev = process.env.NODE_ENV !== 'production'
const hostname = ip.address()
const port = 3000
// when using middleware `hostname` and `port` must be provided below
const nextApp = next({ dev, hostname, port })
const nextHandler = nextApp.getRequestHandler()
const io = new Server(server, { cors: { origin: '*' }, maxHttpBufferSize: 1e9 }) //  1e9:1GB
// io.use(p2p)
const clients = {}
const chatBoard = []
io.on('connect', (socket) => {
    socket.on('clientOnline', (data) => {
        const { deviceId } = data
        console.log('data:', data)
        clients[deviceId] = socket
        console.log('client online', socket.id)
        updateClientStatus(socket)
    })
    socket.on('disconnect', (data) => {
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
})

nextApp.prepare().then(() => {
    app.get('*', (req, res) => {
        return nextHandler(req, res)
    })
    app.post('*', (req, res) => {
        return nextHandler(req, res)
    })
    server.listen(port, (err) => {
        if (err) throw err
        const url = `http://${hostname}:${port}`
        qrcode.generate(url, { small: true })
        console.log(`> Ready on ${url}`)
    })
})

const updateChatBoard = denounce(() => {
    console.log('update chat board')
    io.emit('update-chat-board', { chatBoardNoContent: chatBoard.map(item => omit(item, 'content')) })
}, 500)

const updateClientStatus = denounce((socket) => {
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
