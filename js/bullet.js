class Bullet {
    constructor(scene, position, direction, damage = 10) {
        this.scene = scene;
        this.damage = damage;
        this.speed = 0.5;
        this.maxDistance = 100;
        this.distanceTraveled = 0;
        this.direction = direction.clone().normalize();
        
        // 创建子弹模型
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        
        // 创建包围盒
        this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
        
        // 添加到场景
        this.scene.add(this.mesh);
    }

    update() {
        // 移动子弹
        const moveDistance = this.speed;
        this.mesh.position.add(this.direction.clone().multiplyScalar(moveDistance));
        this.distanceTraveled += moveDistance;
        
        // 更新包围盒
        this.boundingBox.setFromObject(this.mesh);
        
        // 检查碰撞
        this.checkEnemyCollision();
        
        // 检查是否超出范围
        if (this.distanceTraveled >= this.maxDistance) {
            this.reset();
        }
    }

    checkEnemyCollision() {
        if (!this.scene || !this.scene.enemies || this.scene.enemies.length === 0) {
            return;
        }

        // 检查与每个敌人的碰撞
        for (let i = 0; i < this.scene.enemies.length; i++) {
            const enemy = this.scene.enemies[i];
            if (!enemy || !enemy.mesh) {
                continue;
            }

            // 计算子弹和敌人之间的水平距离
            const horizontalDistance = Math.sqrt(
                Math.pow(this.mesh.position.x - enemy.mesh.position.x, 2) +
                Math.pow(this.mesh.position.z - enemy.mesh.position.z, 2)
            );

            // 计算垂直距离
            const verticalDistance = Math.abs(this.mesh.position.y - enemy.mesh.position.y);

            console.log('子弹与敌人' + i + '的水平距离:', horizontalDistance);
            console.log('子弹与敌人' + i + '的垂直距离:', verticalDistance);

            // 如果水平距离小于碰撞阈值且垂直距离小于一定值，认为发生碰撞
            if (horizontalDistance < 5 && verticalDistance < 3) {
                console.log('子弹击中敌人' + i);
                console.log('敌人' + i + '当前血量:', enemy.health);
                
                // 造成伤害
                enemy.takeDamage(this.damage);
                console.log('对敌人' + i + '造成伤害:', this.damage);
                console.log('敌人' + i + '剩余血量:', enemy.health);
                
                // 子弹击中后消失
                this.reset();
                return;
            }
        }
    }

    reset() {
        // 从场景中移除子弹
        this.scene.remove(this.mesh);
        // 释放内存
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
} 