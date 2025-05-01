import * as THREE from 'three';

class Bullet {
    constructor(scene, character) {
        this.scene = scene;
        this.character = character;
        this.bullets = [];
        this.angle = 0;
        this.radius = 5;  // 环绕半径
        this.height = 2;  // 修改为腰部高度
        this.speed = 0.1;  // 环绕速度
        this.bulletCount = 8;  // 8颗子弹
        this.isFiring = false;  // 是否正在发射
        this.fireSpeed = 1.5;   // 发射速度
        this.buildingManager = null;  // 添加建筑物管理器引用
        this.enemies = []; // 添加敌人数组引用
        this.damage = 10; // 子弹伤害值
        this.createBullets();
    }

    createBullets() {
        // 创建多个子弹
        for (let i = 0; i < this.bulletCount; i++) {
            const geometry = new THREE.SphereGeometry(0.5, 16, 16);
            const material = new THREE.MeshPhongMaterial({
                color: 0x00ff00,
                emissive: 0x00ff00,
                emissiveIntensity: 1.0,
                transparent: true,
                opacity: 0.8
            });
            const bullet = new THREE.Mesh(geometry, material);
            
            // 添加点光源
            const light = new THREE.PointLight(0x00ff00, 2, 5);
            bullet.add(light);
            
            // 添加子弹属性
            bullet.userData = {
                isFired: false,
                direction: new THREE.Vector3(),
                speed: this.fireSpeed
            };
            
            this.bullets.push(bullet);
            this.scene.add(bullet);
        }
    }

    fire() {
        if (this.isFiring) return;
        
        this.isFiring = true;
        this.bullets.forEach((bullet, index) => {
            if (!bullet.userData.isFired) {
                // 获取人物当前朝向
                const characterDirection = new THREE.Vector3(0, 0, 1);
                characterDirection.applyQuaternion(this.character.instance.quaternion);
                
                // 计算每个子弹的发射角度（45度间隔）
                const angle = (index * Math.PI * 2) / this.bulletCount;
                const direction = new THREE.Vector3(
                    Math.sin(angle),
                    0,
                    Math.cos(angle)
                );
                
                // 设置发射方向
                bullet.userData.direction.copy(direction).normalize();
                bullet.userData.isFired = true;
                
                // 设置初始位置（在人物前方）
                const startPosition = this.character.instance.position.clone();
                startPosition.add(characterDirection.multiplyScalar(2));  // 从人物前方2个单位开始
                startPosition.y += this.height;
                bullet.position.copy(startPosition);
                
                // 让子弹朝向发射方向
                bullet.lookAt(
                    bullet.position.x + bullet.userData.direction.x,
                    bullet.position.y + bullet.userData.direction.y,
                    bullet.position.z + bullet.userData.direction.z
                );
                
                console.log(`发射子弹${index}:`, {
                    position: bullet.position,
                    direction: bullet.userData.direction
                });
            }
        });
    }

    // 设置建筑物管理器
    setBuildingManager(buildingManager) {
        this.buildingManager = buildingManager;
    }

    // 检查子弹是否与建筑物碰撞
    checkBuildingCollision(bullet) {
        if (!this.buildingManager) return false;
        
        // 创建子弹的碰撞盒
        const bulletBox = new THREE.Box3().setFromObject(bullet);
        
        // 检查与建筑物的碰撞
        return this.buildingManager.checkCollisions(bulletBox);
    }

    // 设置敌人数组
    setEnemies(enemies) {
        this.enemies = enemies;
    }

    // 检查子弹是否击中敌人
    checkEnemyCollision(bullet) {
        if (!this.enemies || this.enemies.length === 0) {
            console.log('没有敌人可检测');
            return false;
        }

        // 创建子弹的包围盒，稍微扩大一点
        const bulletBox = new THREE.Box3().setFromObject(bullet);
        bulletBox.expandByScalar(1.5); // 扩大包围盒

        // 检查每个敌人
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (!enemy || !enemy.boundingBox) {
                console.log('敌人或包围盒不存在');
                continue;
            }

            // 检查碰撞
            if (bulletBox.intersectsBox(enemy.boundingBox)) {
                console.log(`击中敌人${i}！`);
                // 击中敌人，造成伤害
                const newHealth = enemy.health - this.damage;
                console.log(`敌人${i}当前血量: ${enemy.health}, 将受到${this.damage}点伤害`);
                enemy.updateHealth(newHealth);
                console.log(`敌人${i}剩余血量: ${enemy.health}`);
                return true;
            }
        }
        return false;
    }

    update() {
        this.angle += this.speed;
        
        // 更新每个子弹的位置
        this.bullets.forEach((bullet, index) => {
            if (!bullet.userData.isFired) {
                // 未发射的子弹继续环绕
                const x = Math.cos(this.angle + (index * Math.PI * 2 / this.bulletCount)) * this.radius;
                const z = Math.sin(this.angle + (index * Math.PI * 2 / this.bulletCount)) * this.radius;
                
                bullet.position.x = this.character.instance.position.x + x;
                bullet.position.y = this.character.instance.position.y + this.height;
                bullet.position.z = this.character.instance.position.z + z;
            } else {
                // 已发射的子弹向前移动
                const moveStep = bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed);
                bullet.position.add(moveStep);
                
                // 检查是否击中建筑物
                if (this.buildingManager && this.checkBuildingCollision(bullet)) {
                    console.log('子弹击中建筑物');
                    this.resetBullet(bullet, index);
                    return;
                }
                
                // 检查是否击中敌人
                if (this.checkEnemyCollision(bullet)) {
                    console.log('子弹击中敌人');
                    this.resetBullet(bullet, index);
                    return;
                }
                
                // 检查是否超出范围
                const distance = bullet.position.distanceTo(this.character.instance.position);
                if (distance > 100) {  // 超出100个单位后重置
                    console.log('子弹超出范围');
                    this.resetBullet(bullet, index);
                }
            }
        });
    }

    resetBullet(bullet, index) {
        bullet.userData.isFired = false;
        this.isFiring = false;
        
        // 重置子弹位置到环绕轨道
        const bulletAngle = this.angle + (index * (Math.PI * 2) / this.bulletCount);
        const x = Math.cos(bulletAngle) * this.radius;
        const z = Math.sin(bulletAngle) * this.radius;
        
        bullet.position.x = this.character.instance.position.x + x;
        bullet.position.y = this.character.instance.position.y + this.height;
        bullet.position.z = this.character.instance.position.z + z;
        
        // 重置子弹朝向
        bullet.lookAt(
            this.character.instance.position.x,
            this.character.instance.position.y + this.height,
            this.character.instance.position.z
        );
        
        console.log('重置子弹:', {
            position: bullet.position,
            index: index
        });
    }

    remove() {
        // 移除所有子弹
        this.bullets.forEach(bullet => {
            this.scene.remove(bullet);
        });
        this.bullets = [];
    }
}

export default Bullet; 