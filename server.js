// server.js
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const app = require('express')()
const server = require('http').Server(app)
const { Server } = require('socket.io')
const ip = require('ip')
const dev = process.env.NODE_ENV !== 'production'
const hostname = ip.address()
const port = 3000
// when using middleware `hostname` and `port` must be provided below
const nextApp = next({ dev, hostname, port })
const nextHandler = nextApp.getRequestHandler()
const io = new Server(server, { cors: { origin: '*' }, maxHttpBufferSize: 5e8 }) // 5e8: 500MB
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
        console.log(`> Ready on http://${hostname}:${port}`)
    })
})

const updateChatBoard = denounce(() => {
    io.emit('update-chat-board', { chatBoard })
}, 500)

const updateClientStatus = denounce((socket) => {
    const onlineClients = Object.keys(clients)
    console.log('current device:', onlineClients)
    console.log('current socket:', onlineClients.map(key => clients[key].id))
    // socket.emit('online-clients', { onlineClients })
    io.emit('online-clients', { onlineClients })
}, 1500)

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
