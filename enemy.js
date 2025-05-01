import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import Base from './base.js';
import { BuildingManager } from './building.js';

class Enemy extends Base {
    constructor(options = {}) {
        super();
        this.position = options.position || { x: 0, y: 0, z: 0 };
        this.scale = options.scale || { x: 10, y: 10, z: 10 };
        this.rotation = options.rotation || { x: 0, y: 0, z: 0 };
        this.mixer = null;
        this.animations = {};
        this.currentAction = null;
        this.previousAction = null;
        this.boundingBox = null;
        this.moveSpeed = options.moveSpeed || 5.0;
        this.patrolRadius = options.patrolRadius || 500;
        this.patrolCenter = options.patrolCenter || { x: 0, y: 0, z: 0 };
        this.targetPosition = null;
        this.changeDirectionTime = 0;
        this.directionChangeInterval = 8 + Math.random() * 7;
        this.isInitialized = false;
        this.initPromise = null;
        
        // 添加血条相关属性
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.healthBar = null;
        this.healthBarElement = null;
        this.camera = null;
        this.lastHealthDecreaseTime = Date.now();
        
        // 添加子弹相关属性
        this.bullets = [];
        this.angle = 0;
        this.radius = 5;
        this.height = 2;
        this.speed = 0.1;
        this.bulletCount = 8;
        this.isFiring = false;
        this.fireSpeed = 1.5;
        this.fireInterval = 3000;
        this.lastFireTime = 0;
        this.bulletDamage = 5;
        this.scene = null;
        
        this.init();
    }

    // 设置场景
    setScene(scene) {
        if (!scene) {
            console.error('场景对象为空');
            return;
        }
        this.scene = scene;
        if (scene.character) {
            console.log('场景中包含玩家对象');
        } else {
            console.warn('场景中未找到玩家对象');
        }
    }

    // 设置建筑物管理器
    setBuildingManager(manager) {
        this.buildingManager = manager;
        console.log('已设置建筑物管理器');
    }

    // 设置相机
    setCamera(camera) {
        this.camera = camera;
    }

    async init() {
        // 如果已经在初始化中，返回现有的Promise
        if (this.initPromise) {
            return this.initPromise;
        }

        // 创建新的初始化Promise
        this.initPromise = (async () => {
            try {
                console.log('开始创建敌人方块...');
                
                // 创建方块几何体
                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
                this.instance = new THREE.Mesh(geometry, material);
                
                // 设置位置
                this.setPosition(this.position.x, this.position.y, this.position.z);
                console.log('方块位置设置完成:', this.position);
                
                // 设置缩放
                this.setScale(this.scale.x, this.scale.y, this.scale.z);
                console.log('方块缩放设置完成:', this.scale);
                
                // 设置旋转
                this.setRotation(this.rotation.x, this.rotation.y, this.rotation.z);
                console.log('方块旋转设置完成:', this.rotation);

                // 启用阴影
                this.instance.castShadow = true;
                this.instance.receiveShadow = true;

                // 创建碰撞盒
                this.boundingBox = new THREE.Box3().setFromObject(this.instance);
                console.log('碰撞盒创建完成');

                // 设置初始巡逻目标
                this.setNewPatrolTarget();
                
                // 标记初始化完成
                this.isInitialized = true;
                console.log('敌人方块创建完成');
                
                // 创建血条
                this.createHealthBar();
                
            } catch (error) {
                console.error('创建敌人方块失败:', error);
                this.isInitialized = false;
                throw error;
            }
        })();

        return this.initPromise;
    }

    // 播放动画
    playAnimation(name, duration = 0.2) {
        if (!this.mixer) {
            console.warn('动画混合器未初始化');
            return;
        }
        
        if (this.animations[name]) {
            this.previousAction = this.currentAction;
            this.currentAction = this.animations[name];

            if (this.previousAction !== this.currentAction) {
                if (this.previousAction) {
                    this.previousAction.fadeOut(duration);
                }
                this.currentAction.reset().fadeIn(duration).play();
            }
        } else {
            console.warn('动画不存在:', name);
            // 如果没有找到指定动画，尝试播放第一个可用动画
            const firstAnimation = Object.keys(this.animations)[0];
            if (firstAnimation) {
                this.playAnimation(firstAnimation);
            }
        }
    }

    // 创建子弹
    createBullet() {
        if (!this.scene) {
            console.warn('场景未设置，无法创建子弹');
            return null;
        }

        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.8
        });
        const bullet = new THREE.Mesh(geometry, material);
        
        // 添加点光源
        const light = new THREE.PointLight(0xff0000, 2, 5);
        bullet.add(light);
        
        // 设置子弹属性
        bullet.userData = {
            isFired: false,
            direction: new THREE.Vector3(),
            speed: this.fireSpeed,
            damage: this.bulletDamage
        };
        
        this.bullets.push(bullet);
        this.scene.add(bullet);
        return bullet;
    }

    // 发射子弹
    fire() {
        if (!this.scene) {
            console.warn('场景未设置，无法发射子弹');
            return;
        }

        const currentTime = Date.now();
        if (currentTime - this.lastFireTime < this.fireInterval) {
            return;
        }
        
        this.lastFireTime = currentTime;
        console.log('敌人发射子弹');
        console.log('敌人位置:', this.instance.position);
        
        // 创建8颗子弹
        for (let i = 0; i < this.bulletCount; i++) {
            const bullet = this.createBullet();
            if (!bullet) continue;
            
            // 计算发射角度（45度间隔）
            const angle = (i * Math.PI * 2) / this.bulletCount;
            const direction = new THREE.Vector3(
                Math.sin(angle),
                0,
                Math.cos(angle)
            );
            
            // 设置发射方向
            bullet.userData.direction.copy(direction).normalize();
            bullet.userData.isFired = true;
            
            // 设置初始位置（从腰部发射）
            const startPosition = this.instance.position.clone();
            startPosition.y += this.height; // 使用腰部高度
            bullet.position.copy(startPosition);
            
            // 让子弹朝向发射方向
            bullet.lookAt(
                bullet.position.x + bullet.userData.direction.x,
                bullet.position.y + bullet.userData.direction.y,
                bullet.position.z + bullet.userData.direction.z
            );
            
            console.log('子弹初始位置:', bullet.position);
        }
    }

    // 更新子弹
    updateBullets() {
        if (!this.scene) {
            console.log('场景未设置');
            return;
        }

        // 检查玩家是否存在
        if (!this.scene.character) {
            console.log('玩家不存在');
            return;
        }

        // 输出玩家当前位置
        const playerPos = this.scene.character.instance ? this.scene.character.instance.position : null;
        if (playerPos) {
            console.log('\n========== 玩家当前位置 ==========');
            console.log(`x: ${playerPos.x.toFixed(2)}`);
            console.log(`y: ${playerPos.y.toFixed(2)}`);
            console.log(`z: ${playerPos.z.toFixed(2)}`);
            console.log('==================================\n');
        } else {
            console.log('无法获取玩家位置');
            return;
        }

        // 使用倒序遍历，避免删除元素时影响索引
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (bullet.userData.isFired) {
                // 移动子弹
                const moveStep = bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed);
                bullet.position.add(moveStep);
                
                // 检查是否击中玩家
                if (playerPos) {
                    // 计算三个坐标轴的距离
                    const dx = Math.abs(bullet.position.x - playerPos.x);
                    const dy = Math.abs(bullet.position.y - playerPos.y);
                    const dz = Math.abs(bullet.position.z - playerPos.z);
                    
                    // 输出位置信息
                    console.log('\n========== 子弹检测信息 ==========');
                    console.log(`子弹位置: x=${bullet.position.x.toFixed(2)}, y=${bullet.position.y.toFixed(2)}, z=${bullet.position.z.toFixed(2)}`);
                    console.log(`玩家位置: x=${playerPos.x.toFixed(2)}, y=${playerPos.y.toFixed(2)}, z=${playerPos.z.toFixed(2)}`);
                    console.log(`距离差值: dx=${dx.toFixed(2)}, dy=${dy.toFixed(2)}, dz=${dz.toFixed(2)}`);
                    console.log('==================================\n');
                    
                    // 如果三个坐标轴的距离都小于3个单位，认为击中
                    if (dx < 3 && dy < 3 && dz < 3) {
                        console.log('玩家被击中！');
                        // 减少玩家血量
                        this.scene.character.takeDamage(bullet.userData.damage);
                        // 移除子弹
                        this.scene.remove(bullet);
                        this.bullets.splice(i, 1);
                        continue;
                    }
                }
                
                // 检查是否超出范围
                const distance = bullet.position.distanceTo(this.instance.position);
                if (distance > 100) {
                    this.scene.remove(bullet);
                    this.bullets.splice(i, 1);
                }
            }
        }
    }

    // 更新敌人状态
    update(delta) {
        // 如果未初始化完成或已死亡，不执行更新
        if (!this.isInitialized || !this.instance || this.health <= 0) {
            return;
        }

        // 确保delta有最小值
        delta = Math.max(delta, 0.001);

        // 更新动画
        if (this.mixer) {
            try {
                this.mixer.update(delta);
            } catch (error) {
                console.error('更新动画失败:', error);
            }
        }

        // 更新巡逻行为
        this.updatePatrol(delta);

        // 更新血条位置，使其始终面向相机
        if (this.healthBar && this.camera) {
            this.healthBar.lookAt(this.camera.position);
        }

        // 更新子弹
        this.updateBullets();
        
        // 尝试发射子弹
        this.fire();
    }

    // 更新巡逻行为
    updatePatrol(delta) {
        if (!this.targetPosition || !this.instance) {
            console.warn('目标位置或实例不存在');
            return;
        }

        // 更新方向改变计时器
        this.changeDirectionTime += delta;
        
        // 如果到达目标点或时间到了，设置新的目标
        const direction = new THREE.Vector3().subVectors(
            this.targetPosition,
            this.instance.position
        );

        const distance = direction.length();
        if (distance < 0.5 || this.changeDirectionTime >= this.directionChangeInterval) {
            console.log('设置新的巡逻目标');
            this.setNewPatrolTarget();
            return;
        }

        // 归一化方向向量
        direction.normalize();

        // 添加一些随机性到移动方向
        const randomAngle = (Math.random() - 0.5) * 0.2; // 小幅度随机偏移
        const currentAngle = Math.atan2(direction.x, direction.z);
        const newAngle = currentAngle + randomAngle;
        
        // 计算新的方向
        direction.x = Math.sin(newAngle);
        direction.z = Math.cos(newAngle);

        // 计算目标旋转角度
        const targetRotation = Math.atan2(direction.x, direction.z);

        // 平滑旋转
        this.instance.rotation.y = targetRotation;

        // 保存当前位置
        const oldPosition = this.instance.position.clone();

        // 计算移动量
        const moveAmount = direction.multiplyScalar(this.moveSpeed * delta * 60);

        // 尝试移动
        this.instance.position.add(moveAmount);

        // 检查碰撞
        if (this.buildingManager) {
            // 更新碰撞盒
            this.boundingBox.setFromObject(this.instance);
            
            // 检查是否与建筑物碰撞
            if (this.buildingManager.checkCollisions(this.boundingBox)) {
                // 如果发生碰撞，恢复位置
                this.instance.position.copy(oldPosition);
                this.boundingBox.setFromObject(this.instance);
                
                // 设置新的巡逻目标
                this.setNewPatrolTarget();
                return;
            }
        }

        // 更新碰撞盒
        if (this.boundingBox) {
            this.boundingBox.setFromObject(this.instance);
        }

        // 播放行走动画
        this.playAnimation('walk');
    }

    // 设置新的巡逻目标
    setNewPatrolTarget() {
        // 在整个地图范围内随机选择一个点
        const x = (Math.random() - 0.5) * 1000;  // 地图宽度的一半
        const z = (Math.random() - 0.5) * 1000;  // 地图高度的一半
        this.targetPosition = new THREE.Vector3(
            x,
            this.patrolCenter.y,
            z
        );
        
        // 随机设置新的方向改变间隔
        this.directionChangeInterval = 8 + Math.random() * 7;
        this.changeDirectionTime = 0;
        
        // console.log('新目标位置:', this.targetPosition);
    }

    createHealthBar() {
        // 创建血条容器
        const healthBarContainer = document.createElement('div');
        healthBarContainer.style.position = 'absolute';
        healthBarContainer.style.width = '100px';
        healthBarContainer.style.height = '10px';
        healthBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        healthBarContainer.style.borderRadius = '5px';
        healthBarContainer.style.overflow = 'hidden';

        // 创建血条
        this.healthBarElement = document.createElement('div');
        this.healthBarElement.style.width = '100%';
        this.healthBarElement.style.height = '100%';
        this.healthBarElement.style.backgroundColor = '#ff0000';
        this.healthBarElement.style.transition = 'width 0.3s';

        healthBarContainer.appendChild(this.healthBarElement);

        // 创建CSS3D对象
        this.healthBar = new CSS3DObject(healthBarContainer);
        this.healthBar.position.set(0, 2, 0); // 在模型上方2个单位
        this.healthBar.scale.set(0.01, 0.01, 0.01); // 缩放以适应场景

        // 将血条添加到模型
        if (this.instance) {
            this.instance.add(this.healthBar);
        } else {
            console.warn('无法添加血条：模型实例不存在');
        }
    }

    updateHealth(newHealth) {
        this.health = Math.max(0, Math.min(newHealth, this.maxHealth));
        console.log('敌人血量更新:', this.health);
        
        // 更新血条
        if (this.healthBarElement) {
            const healthPercent = this.health / this.maxHealth;
            this.healthBarElement.style.width = `${healthPercent * 100}%`;
        } else {
            console.warn('血条元素不存在');
        }
        
        if (this.health <= 0) {
            console.log('敌人死亡');
            this.onDeath();
        }
    }

    onDeath() {
        // 可以在这里添加敌人死亡时的逻辑
        console.log('执行死亡逻辑');
        
        // 清理所有子弹
        if (this.bullets && this.bullets.length > 0) {
            this.bullets.forEach(bullet => {
                if (bullet && bullet.parent) {
                    this.scene.remove(bullet);
                }
            });
            this.bullets = [];
            console.log('清理所有子弹');
        }

        // 例如：播放死亡动画、移除模型等
        if (this.instance) {
            // 播放死亡动画
            this.playAnimation('death');
            // 延迟后移除模型和血条
            setTimeout(() => {
                if (this.instance && this.instance.parent) {
                    // 移除血条
                    if (this.healthBar && this.healthBar.parent) {
                        this.healthBar.parent.remove(this.healthBar);
                    }
                    // 移除模型
                    this.instance.parent.remove(this.instance);
                }
            }, 2000); // 2秒后移除
        }
    }
}

export default Enemy; 