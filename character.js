import * as THREE from 'three';
import Base from './base.js';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

class Character extends Base {
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
        this.buildingManager = null;
        this.moveDirection = new THREE.Vector3();
        this.rotationSpeed = Math.PI / 2;
        this.isRotating = false;
        this.isInitialized = false;
        this.initPromise = null;
        this.camera = null;
        
        // 添加血条相关属性
        this.maxHealth = 100;
        this.currentHealth = this.maxHealth;
        this.healthBar = null;
        this.healthBarElement = null;
        this.lastHealthDecreaseTime = Date.now();
        
        this.init();
    }

    async init() {
        // 如果已经在初始化中，返回现有的Promise
        if (this.initPromise) {
            return this.initPromise;
        }

        // 创建新的初始化Promise
        this.initPromise = (async () => {
            try {
                console.log('开始创建人物方块...');
                
                // 创建方块几何体
                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 }); // 使用绿色区分
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
                
                // 标记初始化完成
                this.isInitialized = true;
                console.log('人物方块创建完成');
                
                // 创建血条
                this.createHealthBar();
                
            } catch (error) {
                console.error('创建人物方块失败:', error);
                this.isInitialized = false;
                throw error;
            }
        })();

        return this.initPromise;
    }

    // 设置建筑物管理器
    setBuildingManager(manager) {
        this.buildingManager = manager;
    }

    // 设置位置
    setPosition(x, y, z) {
        if (this.instance) {
            this.instance.position.set(x, y, z);
            // 更新碰撞盒位置
            if (this.boundingBox) {
                this.boundingBox.setFromObject(this.instance);
            }
        }
    }

    // 设置缩放
    setScale(x, y, z) {
        if (this.instance) {
            this.instance.scale.set(x, y, z);
            // 更新碰撞盒
            if (this.boundingBox) {
                this.boundingBox.setFromObject(this.instance);
            }
        }
    }

    // 设置旋转
    setRotation(x, y, z) {
        if (this.instance) {
            this.instance.rotation.set(x, y, z);
        }
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
        }
    }

    // 获取动画时长
    getAnimationDuration(name) {
        const action = this.animations[name];
        if (action) {
            const clip = action.getClip();
            return clip ? clip.duration : 0;
        }
        return 0;
    }

    // 更新方法
    update(delta) {
        // 如果未初始化完成，不执行更新
        if (!this.isInitialized || !this.instance) {
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
        
        // 应用持续旋转
        if (this.isRotating && this.instance) {
            this.instance.rotation.y += this.rotationSpeed * delta;
        }

        // 更新血条位置，使其始终面向相机
        if (this.healthBar && this.camera) {
            this.healthBar.lookAt(this.camera.position);
        }

        // 注释掉自动掉血逻辑
        /*
        // 每秒减少1点血量
        const currentTime = Date.now();
        if (currentTime - this.lastHealthDecreaseTime >= 1000) {
            this.takeDamage(1);
            this.lastHealthDecreaseTime = currentTime;
        }
        */
    }

    // 移动角色
    move(direction, speed = 1, cameraRotation = 0) {
        if (this.instance) {
            // 保存当前位置
            const oldPosition = this.instance.position.clone();

            // 根据角色朝向计算移动方向
            const moveDirection = new THREE.Vector3();
            let targetRotation = 0;
            
            switch (direction) {
                case 'forward':
                    moveDirection.set(0, 0, -1);
                    targetRotation = Math.PI;
                    break;
                case 'backward':
                    moveDirection.set(0, 0, 1);
                    targetRotation = 0;
                    break;
                case 'left':
                    moveDirection.set(-1, 0, 0);
                    targetRotation = -Math.PI / 2;
                    break;
                case 'right':
                    moveDirection.set(1, 0, 0);
                    targetRotation = Math.PI / 2;
                    break;
            }

            // 设置角色朝向
            this.instance.rotation.y = targetRotation;

            // 更新位置
            this.instance.position.add(moveDirection.multiplyScalar(speed));

            // 更新碰撞盒
            if (this.boundingBox) {
                this.boundingBox.setFromObject(this.instance);
            }

            // 检查碰撞
            if (this.buildingManager && this.buildingManager.checkCollisions(this.boundingBox)) {
                // 如果发生碰撞，恢复位置
                this.instance.position.copy(oldPosition);
                if (this.boundingBox) {
                    this.boundingBox.setFromObject(this.instance);
                }
                console.log('发生碰撞，位置已恢复');
            }
        }
    }

    // 旋转角色
    rotate(angle) {
        if (this.instance) {
            // 围绕自身轴心旋转
            this.instance.rotation.y += angle;
            // 更新碰撞盒
            if (this.boundingBox) {
                this.boundingBox.setFromObject(this.instance);
            }
        }
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

    updateHealth(health) {
        this.currentHealth = Math.max(0, Math.min(health, this.maxHealth));
        const healthPercentage = (this.currentHealth / this.maxHealth) * 100;
        this.healthBarElement.style.width = `${healthPercentage}%`;
    }

    // 受到伤害
    takeDamage(amount) {
        console.log('玩家受到伤害:', amount);
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        const healthPercentage = (this.currentHealth / this.maxHealth) * 100;
        this.healthBarElement.style.width = `${healthPercentage}%`;
        
        // 检查是否死亡
        if (this.currentHealth <= 0) {
            console.log('玩家死亡！');
            // 这里可以添加死亡逻辑
        }
    }

    // 设置相机
    setCamera(camera) {
        this.camera = camera;
    }
}

export default Character; 