export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 处理 WebSocket 连接
    if (url.pathname === '/ws') {
      return env.WEBSOCKET_SERVER.fetch(request);
    }
    
    // 处理静态文件请求
    return env.ASSETS.fetch(request);
  }
}; 