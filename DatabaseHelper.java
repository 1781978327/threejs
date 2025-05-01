// ... existing code ...

    // 上传游戏实体位置信息
    public static int uploadGamePosition(String userId, String entityType, double x, double y, double z) {
        Connection conn = null;
        PreparedStatement pstmt = null;
        try {
            conn = getConnection();
            if (conn == null) {
                Log.e(TAG, "无法获取数据库连接");
                return -1;
            }
            
            String sql = "INSERT INTO game_positions (user_id, entity_type, x_coordinate, y_coordinate, z_coordinate) " +
                        "VALUES (?, ?, ?, ?, ?)";
            
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, userId);
            pstmt.setString(2, entityType);
            pstmt.setDouble(3, x);
            pstmt.setDouble(4, y);
            pstmt.setDouble(5, z);
            
            int result = pstmt.executeUpdate();
            Log.d(TAG, "上传游戏位置信息成功，影响行数: " + result);
            return result;
        } catch (SQLException e) {
            Log.e(TAG, "上传游戏位置信息失败: " + e.getMessage());
            e.printStackTrace();
            return -1;
        } finally {
            try {
                if (pstmt != null) pstmt.close();
            } catch (SQLException e) {
                Log.e(TAG, "关闭PreparedStatement失败: " + e.getMessage());
            }
            releaseConnection(conn);
        }
    }
    
    // 获取指定用户的所有实体位置信息
    public static List<Map<String, Object>> getUserGamePositions(String userId) {
        List<Map<String, Object>> positions = new ArrayList<>();
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        
        try {
            conn = getConnection();
            String sql = "SELECT * FROM game_positions WHERE user_id = ? ORDER BY update_time DESC";
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, userId);
            rs = pstmt.executeQuery();
            
            while (rs.next()) {
                Map<String, Object> position = new HashMap<>();
                position.put("id", rs.getInt("id"));
                position.put("user_id", rs.getString("user_id"));
                position.put("entity_type", rs.getString("entity_type"));
                position.put("x_coordinate", rs.getDouble("x_coordinate"));
                position.put("y_coordinate", rs.getDouble("y_coordinate"));
                position.put("z_coordinate", rs.getDouble("z_coordinate"));
                position.put("update_time", rs.getTimestamp("update_time"));
                positions.add(position);
            }
        } catch (Exception e) {
            Log.e(TAG, "获取游戏位置信息失败: " + e.getMessage());
            e.printStackTrace();
        } finally {
            closeResources(conn, pstmt, rs);
        }
        
        return positions;
    }
    
    // 获取所有敌人的位置信息
    public static List<Map<String, Object>> getAllEnemyPositions() {
        List<Map<String, Object>> positions = new ArrayList<>();
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        
        try {
            conn = getConnection();
            String sql = "SELECT * FROM game_positions WHERE entity_type = 'enemy' ORDER BY update_time DESC";
            pstmt = conn.prepareStatement(sql);
            rs = pstmt.executeQuery();
            
            while (rs.next()) {
                Map<String, Object> position = new HashMap<>();
                position.put("id", rs.getInt("id"));
                position.put("user_id", rs.getString("user_id"));
                position.put("x_coordinate", rs.getDouble("x_coordinate"));
                position.put("y_coordinate", rs.getDouble("y_coordinate"));
                position.put("z_coordinate", rs.getDouble("z_coordinate"));
                position.put("update_time", rs.getTimestamp("update_time"));
                positions.add(position);
            }
        } catch (Exception e) {
            Log.e(TAG, "获取敌人位置信息失败: " + e.getMessage());
            e.printStackTrace();
        } finally {
            closeResources(conn, pstmt, rs);
        }
        
        return positions;
    }
    
    // 删除指定用户的所有位置记录
    public static int deleteUserGamePositions(String userId) {
        Connection conn = null;
        PreparedStatement pstmt = null;
        try {
            conn = getConnection();
            String sql = "DELETE FROM game_positions WHERE user_id = ?";
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, userId);
            
            int result = pstmt.executeUpdate();
            Log.d(TAG, "删除用户游戏位置记录成功，影响行数: " + result);
            return result;
        } catch (SQLException e) {
            Log.e(TAG, "删除用户游戏位置记录失败: " + e.getMessage());
            e.printStackTrace();
            return -1;
        } finally {
            try {
                if (pstmt != null) pstmt.close();
            } catch (SQLException e) {
                Log.e(TAG, "关闭PreparedStatement失败: " + e.getMessage());
            }
            releaseConnection(conn);
        }
    }

// ... existing code ... 