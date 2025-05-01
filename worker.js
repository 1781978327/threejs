export default {
    async fetch(request, env, ctx) {
        // 处理WebSocket升级请求
        if (request.headers.get('Upgrade') === 'websocket') {
            const { 0: client, 1: server } = new WebSocketPair();
            
            // 处理WebSocket连接
            server.accept();
            server.addEventListener('message', async (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // 根据消息类型处理不同的请求
                    switch (data.type) {
                        case 'uploadPosition':
                            await handleUploadPosition(env.DB, data);
                            break;
                        case 'getPositions':
                            await handleGetPositions(server, env.DB, data);
                            break;
                        case 'getEnemies':
                            await handleGetEnemies(server, env.DB);
                            break;
                    }
                } catch (error) {
                    server.send(JSON.stringify({
                        type: 'error',
                        message: error.message
                    }));
                }
            });

            return new Response(null, {
                status: 101,
                webSocket: client
            });
        }

        // 处理普通HTTP请求
        return new Response('WebSocket服务器已启动');
    }
};

// 处理上传位置
async function handleUploadPosition(db, data) {
    const { userId, entityType, x, y, z } = data;
    const sql = 'INSERT INTO game_positions (user_id, entity_type, x_coordinate, y_coordinate, z_coordinate) VALUES (?, ?, ?, ?, ?)';
    await db.prepare(sql).bind(userId, entityType, x, y, z).run();
}

// 处理获取位置
async function handleGetPositions(ws, db, data) {
    const { userId } = data;
    const sql = 'SELECT * FROM game_positions WHERE user_id = ? ORDER BY update_time DESC';
    const { results } = await db.prepare(sql).bind(userId).all();
    ws.send(JSON.stringify({
        type: 'positions',
        data: results
    }));
}

// 处理获取敌人
async function handleGetEnemies(ws, db) {
    const sql = "SELECT * FROM game_positions WHERE entity_type = 'enemy' ORDER BY update_time DESC";
    const { results } = await db.prepare(sql).all();
    ws.send(JSON.stringify({
        type: 'enemies',
        data: results
    }));
} 