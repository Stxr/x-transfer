const next = require('next')
const app = require('express')()
const server = require('http').Server(app)
const ip = require('ip')
const hostname = ip.address()
const qrcode = require('qrcode-terminal')
const wrapperWithSocket = require('./socket')
const dev = process.env.NODE_ENV !== 'production'

const port = 3000
// when using middleware `hostname` and `port` must be provided below
const nextApp = next({ dev, hostname, port })
const nextHandler = nextApp.getRequestHandler()
wrapperWithSocket(server)
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
