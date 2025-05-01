const WebSocket = require('ws');
const mysql = require('mysql2/promise');

// 创建WebSocket服务器
const wss = new WebSocket.Server({ port: 8080 });

// 创建数据库连接池
const pool = mysql.createPool({
    host: '8.134.137.198',
    port: '3306',
    user: 'lml',
    password: '123456',
    database: 'lml',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 处理WebSocket连接
wss.on('connection', function connection(ws) {
    console.log('新的客户端连接');

    // 处理消息
    ws.on('message', async function incoming(message) {
        try {
            const data = JSON.parse(message);
            console.log('收到消息:', data);

            // 根据消息类型处理不同的请求
            switch (data.type) {
                case 'uploadPosition':
                    await handleUploadPosition(data);
                    break;
                case 'getPositions':
                    await handleGetPositions(ws, data);
                    break;
                case 'getEnemies':
                    await handleGetEnemies(ws, data);
                    break;
                default:
                    console.log('未知的消息类型:', data.type);
            }
        } catch (error) {
            console.error('处理消息错误:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: error.message
            }));
        }
    });

    // 处理连接关闭
    ws.on('close', function close() {
        console.log('客户端断开连接');
    });
});

// 处理上传位置
async function handleUploadPosition(data) {
    const { userId, entityType, x, y, z } = data;
    const sql = 'INSERT INTO game_positions (user_id, entity_type, x_coordinate, y_coordinate, z_coordinate) VALUES (?, ?, ?, ?, ?)';
    await pool.execute(sql, [userId, entityType, x, y, z]);
}

// 处理获取位置
async function handleGetPositions(ws, data) {
    const { userId } = data;
    const sql = 'SELECT * FROM game_positions WHERE user_id = ? ORDER BY update_time DESC';
    const [rows] = await pool.execute(sql, [userId]);
    ws.send(JSON.stringify({
        type: 'positions',
        data: rows
    }));
}

// 处理获取敌人
async function handleGetEnemies(ws, data) {
    const sql = "SELECT * FROM game_positions WHERE entity_type = 'enemy' ORDER BY update_time DESC";
    const [rows] = await pool.execute(sql);
    ws.send(JSON.stringify({
        type: 'enemies',
        data: rows
    }));
}

console.log('WebSocket服务器已启动，监听端口 8080'); 