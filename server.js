#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const wrapperWithSocket = require('./socket');
const ip = require('ip')
const hostname = ip.address()
const server = http.createServer((req, res) => {
    // console.log(`${req.method} ${req.url}`);

    // 设置默认首页为index.html
    if (req.url == '/') {
        req.url = '/index.html';
    }

    // 解析请求的文件路径
    const filePath = path.join(__dirname, '', req.url);
    // 检查文件是否存在
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.statusCode = 404;
            res.end('File not found');
            return;
        }

        // 读取文件并返回
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end('Server error');
                return;
            }

            // 设置Content-Type头部
            const extname = path.extname(filePath);
            const contentType = getContentType(extname);
            res.setHeader('Content-Type', contentType);

            res.end(data);
        });
    });
});
wrapperWithSocket(server)
const port = process.env.PORT || 3000;
server.listen(port, () => {
    const url = `http://${hostname}:${port}`
    qrcode.generate(url, { small: true })
    console.log(`Server listening on ${url}`);
});

// 根据文件扩展名返回Content-Type值
function getContentType(extname) {
    switch (extname) {
        case '.html':
            return 'text/html';
        case '.css':
            return 'text/css';
        case '.js':
            return 'text/javascript';
        case '.json':
            return 'application/json';
        case '.png':
            return 'image/png';
        case '.jpg':
            return 'image/jpg';
        default:
            return 'application/octet-stream';
    }
}