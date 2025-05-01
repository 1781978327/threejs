import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.json.JSONObject;

import java.net.URI;
import java.net.URISyntaxException;

public class GameWebSocketClient extends WebSocketClient {
    private static final String TAG = "GameWebSocketClient";
    
    public GameWebSocketClient(String serverUri) throws URISyntaxException {
        super(new URI(serverUri));
    }

    @Override
    public void onOpen(ServerHandshake handshakedata) {
        System.out.println(TAG + ": 已连接到服务器");
    }

    @Override
    public void onMessage(String message) {
        System.out.println(TAG + ": 收到消息: " + message);
        try {
            JSONObject json = new JSONObject(message);
            String type = json.getString("type");
            
            switch (type) {
                case "positions":
                    handlePositions(json.getJSONArray("data"));
                    break;
                case "enemies":
                    handleEnemies(json.getJSONArray("data"));
                    break;
                case "error":
                    handleError(json.getString("message"));
                    break;
                default:
                    System.out.println(TAG + ": 未知的消息类型: " + type);
            }
        } catch (Exception e) {
            System.err.println(TAG + ": 处理消息错误: " + e.getMessage());
        }
    }

    @Override
    public void onClose(int code, String reason, boolean remote) {
        System.out.println(TAG + ": 连接已关闭: " + reason);
    }

    @Override
    public void onError(Exception ex) {
        System.err.println(TAG + ": 发生错误: " + ex.getMessage());
    }

    // 上传位置信息
    public void uploadPosition(String userId, String entityType, double x, double y, double z) {
        JSONObject message = new JSONObject();
        message.put("type", "uploadPosition");
        message.put("userId", userId);
        message.put("entityType", entityType);
        message.put("x", x);
        message.put("y", y);
        message.put("z", z);
        send(message.toString());
    }

    // 获取位置信息
    public void getPositions(String userId) {
        JSONObject message = new JSONObject();
        message.put("type", "getPositions");
        message.put("userId", userId);
        send(message.toString());
    }

    // 获取敌人信息
    public void getEnemies() {
        JSONObject message = new JSONObject();
        message.put("type", "getEnemies");
        send(message.toString());
    }

    // 处理位置信息
    private void handlePositions(JSONArray positions) {
        // 处理位置数据
        for (int i = 0; i < positions.length(); i++) {
            JSONObject position = positions.getJSONObject(i);
            // 处理每个位置信息
        }
    }

    // 处理敌人信息
    private void handleEnemies(JSONArray enemies) {
        // 处理敌人数据
        for (int i = 0; i < enemies.length(); i++) {
            JSONObject enemy = enemies.getJSONObject(i);
            // 处理每个敌人信息
        }
    }

    // 处理错误信息
    private void handleError(String message) {
        System.err.println(TAG + ": 服务器错误: " + message);
    }
} 