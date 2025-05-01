import * as THREE from 'three';
import Base from './base.js';
import Cube from './cube.js';
import { BuildingManager } from './building.js';
import Controls from './controls.js';
import Character from './character.js';
import Enemy from './enemy.js';
import Grenade from './grenade.js';
import Bullet from './bullet.js';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

// 场景管理类
class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cube = null;
        this.buildingManager = null;
        this.controls = null;
        this.character = null;
        this.enemies = []; // 存储敌人实例
        this.clock = new THREE.Clock();
        this.keys = {}; // 存储按键状态
        this.cameraOffset = new THREE.Vector3(0, 30, 50); // 相机相对于人物的偏移
        this.cameraInitialized = false;
        this.isInitialized = false; // 添加初始化状态标志
        this.isInitializing = false; // 添加初始化中标志
        this.grenade = null;
        this.lastThrowTime = 0;
        this.throwInterval = 1000; // 1秒投掷一次
        this.bullet = null;
        this.cssRenderer = null;
        this.lastEnemyStatusTime = 0;
        this.isSpeedBoosted = false; // 添加加速状态标志
        this.normalMoveSpeed = 0.5; // 添加基础移动速度
        this.boostedMoveSpeed = 1.0; // 添加加速后的移动速度
        this.lastSaveTime = 0; // 添加上次保存时间
        this.saveInterval = 10000; // 10秒保存一次
        this.init();
    }

    // 初始化场景
    async init() {
        if (this.isInitialized || this.isInitializing) {
            console.warn('场景已经初始化或正在初始化');
            return;
        }

        this.isInitializing = true;
        console.log('开始初始化场景...');

        try {
            // 创建场景
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x87CEEB);
            this.scene.fog = new THREE.Fog(0x87CEEB, 1, 1000);  // 添加雾效，使远处物体逐渐消失

            // 添加地图纹理
            const textureLoader = new THREE.TextureLoader();
            const mapTexture = textureLoader.load('./images/pic1.jpg');
            mapTexture.wrapS = THREE.RepeatWrapping;
            mapTexture.wrapT = THREE.RepeatWrapping;
            mapTexture.repeat.set(1, 1);

            // 创建地面
            const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
            const groundMaterial = new THREE.MeshStandardMaterial({
                map: mapTexture,
                roughness: 0.8,
                metalness: 0.2
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            this.scene.add(ground);

            // 创建相机
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.camera.position.set(0, 100, 200);
            
            // 创建WebGL渲染器
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.body.appendChild(this.renderer.domElement);

            // 创建CSS3D渲染器
            this.cssRenderer = new CSS3DRenderer();
            this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
            this.cssRenderer.domElement.style.position = 'absolute';
            this.cssRenderer.domElement.style.top = '0';
            this.cssRenderer.domElement.style.pointerEvents = 'none';
            document.body.appendChild(this.cssRenderer.domElement);

            // 创建控制器
            this.controls = new Controls(this.camera, this.renderer.domElement);
            this.controls.setTarget(0, 0, 0);
            this.controls.setZoomLimits(10, 500);
            this.controls.setPolarAngleLimits(0, Math.PI / 2);
            this.controls.setRotateSpeed(0.5);
            this.controls.setPanSpeed(1.0);
            this.controls.setZoomSpeed(1.0);

            // 创建建筑物管理器
            this.buildingManager = new BuildingManager(this.scene);
            this.buildingManager.createGround();
            this.buildingManager.createRandomBuildings();
            this.buildingManager.createRandomTextureMarker();  // 添加随机位置的贴图

            // 创建人物
            this.character = new Character({
                position: { x: 0, y: 0, z: 0 },
                scale: { x: 10, y: 10, z: 10 },
                rotation: { x: 0, y: 0, z: 0 },
                useBox: true  // 添加标志使用方块
            });
            await this.character.init();
            this.character.addToScene(this.scene);
            this.character.setBuildingManager(this.buildingManager);
            this.character.setCamera(this.camera); // 设置角色的相机

            // 加载保存的位置
            await this.loadModelPosition();

            // 创建敌人
            await this.createEnemies();

            // 添加光源
            this.addLights();

            // 添加坐标轴辅助
            this.addAxesHelper();

            // 添加键盘事件监听
            this.addKeyboardControls();

            // 创建手雷
            this.grenade = new Grenade(this.scene, this.character);

            // 创建子弹
            this.bullet = new Bullet(this.scene, this.character);
            this.bullet.setBuildingManager(this.buildingManager);  // 设置建筑物管理器
            this.bullet.setEnemies(this.enemies); // 设置敌人数组

            // 监听窗口大小变化
            window.addEventListener('resize', () => this.onWindowResize());

            this.isInitialized = true;
            console.log('场景初始化完成');

            // 初始化完成后再开始动画循环
            this.animate();
        } catch (error) {
            console.error('场景初始化失败:', error);
            this.isInitializing = false;
        }
    }

    // 创建敌人
    async createEnemies() {
        console.log('开始创建敌人...');
        // 创建一个敌人
        this.enemy = new Enemy({
            position: { x: 0, y: 0, z: 0 },
            scale: { x: 10, y: 10, z: 10 },
            moveSpeed: 0.5,
            patrolRadius: 500
        });
        
        // 设置场景和玩家引用
        const sceneWithCharacter = this.scene;
        sceneWithCharacter.character = this.character; // 确保场景对象中包含玩家引用
        this.enemy.setScene(sceneWithCharacter);
        this.enemy.setBuildingManager(this.buildingManager); // 设置建筑物管理器
        
        // 加载敌人模型
        await this.enemy.init().then(() => {
            console.log('敌人加载完成');
            this.scene.add(this.enemy.instance);
            this.enemies.push(this.enemy);
            console.log('敌人创建完成，当前敌人数量:', this.enemies.length);
        }).catch(error => {
            console.error('加载敌人失败:', error);
        });
    }

    // 添加键盘控制
    addKeyboardControls() {
        // 使用 keydown 事件
        document.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            this.keys[key] = true;
            
            // 添加发射控制
            if (key === 'f') {  // 按F键发射子弹
                if (this.bullet && this.character && !this.character.isDead) {
                    this.bullet.fire();
                }
            }

            // 添加保存控制
            if (event.ctrlKey && key === 'c') {  // 按Ctrl+C保存坐标
                this.saveModelPositionToFile();
            }
        });

        // 使用 keyup 事件
        document.addEventListener('keyup', (event) => {
            const key = event.key.toLowerCase();
            this.keys[key] = false;
        });
    }

    // 保存所有模型坐标到文件
    saveModelPositionToFile() {
        try {
            const modelData = {
                character: null,
                enemies: []
            };

            // 保存角色坐标
            if (this.character && this.character.instance) {
                const position = this.character.instance.position;
                const rotation = this.character.instance.rotation;
                const scale = this.character.instance.scale;
                modelData.character = {
                    position: {
                        x: position.x,
                        y: position.y,
                        z: position.z
                    },
                    rotation: {
                        x: rotation.x,
                        y: rotation.y,
                        z: rotation.z
                    },
                    scale: {
                        x: scale.x,
                        y: scale.y,
                        z: scale.z
                    }
                };
                console.log('保存角色位置:', position);
            }

            // 保存所有敌人坐标
            this.enemies.forEach(enemy => {
                if (enemy && enemy.instance) {
                    const position = enemy.instance.position;
                    const rotation = enemy.instance.rotation;
                    const scale = enemy.instance.scale;
                    modelData.enemies.push({
                        position: {
                            x: position.x,
                            y: position.y,
                            z: position.z
                        },
                        rotation: {
                            x: rotation.x,
                            y: rotation.y,
                            z: rotation.z
                        },
                        scale: {
                            x: scale.x,
                            y: scale.y,
                            z: scale.z
                        }
                    });
                }
            });

            // 使用 Electron 的 API 保存文件
            if (window.electron) {
                window.electron.saveModelData(JSON.stringify(modelData, null, 2));
                console.log('模型数据已保存到文件');
            } else {
                console.log('模型数据:', modelData);
                // 如果不在 Electron 环境中，使用 localStorage 作为备选
                localStorage.setItem('modelData', JSON.stringify(modelData));
            }
        } catch (error) {
            console.error('保存模型数据失败:', error);
        }
    }

    // 加载所有模型坐标
    async loadModelPosition() {
        try {
            if (window.electron) {
                const result = await window.electron.loadModelData();
                if (result.success) {
                    const data = result.data;
                    
                    // 加载角色坐标
                    if (data.character && this.character) {
                        this.character.setPosition(
                            data.character.position.x,
                            data.character.position.y,
                            data.character.position.z
                        );
                        this.character.setRotation(
                            data.character.rotation.x,
                            data.character.rotation.y,
                            data.character.rotation.z
                        );
                        this.character.setScale(
                            data.character.scale.x,
                            data.character.scale.y,
                            data.character.scale.z
                        );
                    }

                    // 加载敌人坐标
                    if (data.enemies && this.enemies.length > 0) {
                        data.enemies.forEach((enemyData, index) => {
                            if (this.enemies[index] && this.enemies[index].instance) {
                                const enemy = this.enemies[index];
                                enemy.instance.position.set(
                                    enemyData.position.x,
                                    enemyData.position.y,
                                    enemyData.position.z
                                );
                                enemy.instance.rotation.set(
                                    enemyData.rotation.x,
                                    enemyData.rotation.y,
                                    enemyData.rotation.z
                                );
                                enemy.instance.scale.set(
                                    enemyData.scale.x,
                                    enemyData.scale.y,
                                    enemyData.scale.z
                                );
                            }
                        });
                    }
                    console.log('模型数据已从文件加载');
                } else {
                    console.log('没有找到保存的模型数据');
                }
            } else {
                // 如果不在 Electron 环境中，使用 localStorage 作为备选
                const savedData = localStorage.getItem('modelData');
                if (savedData) {
                    const data = JSON.parse(savedData);
                    // 加载角色坐标
                    if (data.character && this.character) {
                        this.character.setPosition(
                            data.character.position.x,
                            data.character.position.y,
                            data.character.position.z
                        );
                        this.character.setRotation(
                            data.character.rotation.x,
                            data.character.rotation.y,
                            data.character.rotation.z
                        );
                        this.character.setScale(
                            data.character.scale.x,
                            data.character.scale.y,
                            data.character.scale.z
                        );
                    }
                    // 加载敌人坐标
                    if (data.enemies && this.enemies.length > 0) {
                        data.enemies.forEach((enemyData, index) => {
                            if (this.enemies[index] && this.enemies[index].instance) {
                                const enemy = this.enemies[index];
                                enemy.instance.position.set(
                                    enemyData.position.x,
                                    enemyData.position.y,
                                    enemyData.position.z
                                );
                                enemy.instance.rotation.set(
                                    enemyData.rotation.x,
                                    enemyData.rotation.y,
                                    enemyData.rotation.z
                                );
                                enemy.instance.scale.set(
                                    enemyData.scale.x,
                                    enemyData.scale.y,
                                    enemyData.scale.z
                                );
                            }
                        });
                    }
                    console.log('模型数据已从 localStorage 加载');
                }
            }
        } catch (error) {
            console.error('加载模型数据失败:', error);
        }
    }

    // 处理键盘输入
    handleKeyboardInput() {
        if (!this.character || this.character.isDead) {
            console.log('角色未初始化或已死亡');
            return;
        }

        // 检查G键状态来切换加速
        if (this.keys['g']) {
            this.isSpeedBoosted = true;
        } else {
            this.isSpeedBoosted = false;
        }

        // 根据加速状态选择移动速度
        const moveSpeed = this.isSpeedBoosted ? this.boostedMoveSpeed : this.normalMoveSpeed;
        const rotateSpeed = 0.05;
        let isMoving = false;

        // 移动和转向控制
        if (this.keys['w']) {
            this.character.move('forward', moveSpeed);
            isMoving = true;
        } else if (this.keys['s']) {
            this.character.move('backward', moveSpeed);
            isMoving = true;
        } else if (this.keys['a']) {
            this.character.move('left', moveSpeed);
            isMoving = true;
        } else if (this.keys['d']) {
            this.character.move('right', moveSpeed);
            isMoving = true;
        }

        // 根据移动状态播放动画
        if (isMoving) {
            this.character.playAnimation('walk');
        } else {
            this.character.playAnimation('idle');
        }
    }

    // 添加光源
    addLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // 方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // 添加更多光源确保场景各处都有光照
        const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 100);
        pointLight1.position.set(50, 50, 50);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 100);
        pointLight2.position.set(-50, 50, -50);
        this.scene.add(pointLight2);
    }

    // 添加坐标轴辅助
    addAxesHelper() {
        const axesHelper = new THREE.AxesHelper(2);
        this.scene.add(axesHelper);
    }

    // 动画循环
    animate() {
        if (!this.isInitialized) {
            console.warn('场景未初始化，跳过动画循环');
            return;
        }

        requestAnimationFrame(this.animate.bind(this));
        const delta = this.clock.getDelta();
        
        // 更新控制器
        if (this.controls) {
            this.controls.update();
        }
        
        // 处理键盘输入
        this.handleKeyboardInput();
        
        // 更新角色
        if (this.character) {
            this.character.update(delta);
        }
        
        // 更新敌人
        if (this.enemies && this.enemies.length > 0) {
            const currentTime = Date.now();
            if (!this.lastEnemyStatusTime || currentTime - this.lastEnemyStatusTime >= 3000) {
                console.log('更新敌人状态，当前敌人数量:', this.enemies.length);
                this.enemies.forEach((enemy, index) => {
                    if (enemy) {
                        enemy.update(delta);
                        console.log(`敌人${index}当前血量:`, enemy.health);
                    }
                });
                this.lastEnemyStatusTime = currentTime;
            } else {
                this.enemies.forEach(enemy => {
                    if (enemy) {
                        enemy.update(delta);
                    }
                });
            }
        }
        
        // 更新手雷
        if (this.grenade) {
            this.grenade.update();
            
            // 每秒投掷一次手雷
            const currentTime = Date.now();
            if (currentTime - this.lastThrowTime >= this.throwInterval) {
                this.grenade.throw();
                this.lastThrowTime = currentTime;
            }
        }
        
        // 更新子弹
        if (this.bullet) {
            this.bullet.update();
        }
        
        // 更新相机位置
        this.updateCamera();
        
        // 定时保存坐标
        const currentTime = Date.now();
        if (currentTime - this.lastSaveTime >= this.saveInterval) {
            this.saveModelPositionToFile();
            this.lastSaveTime = currentTime;
        }
        
        // 渲染场景
        this.renderer.render(this.scene, this.camera);
        this.cssRenderer.render(this.scene, this.camera);
    }

    // 更新相机位置
    updateCamera() {
        if (this.character && this.character.instance) {
            // 获取人物位置
            const characterPosition = this.character.instance.position.clone();
            
            // 计算相机位置
            const cameraPosition = new THREE.Vector3();
            cameraPosition.copy(characterPosition);
            
            // 添加固定偏移
            cameraPosition.add(this.cameraOffset);
            
            // 设置相机位置
            this.camera.position.copy(cameraPosition);
            
            // 让相机看向人物
            this.camera.lookAt(characterPosition);
        }
    }

    // 窗口大小改变时调整
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    // 更新手雷
    updateGrenades() {
        // 使用倒序遍历，避免删除元素时影响索引
        for (let i = this.grenades.length - 1; i >= 0; i--) {
            const grenade = this.grenades[i];
            
            // 更新手雷位置
            grenade.position.add(grenade.velocity);
            
            // 应用重力
            grenade.velocity.y -= 0.01;
            
            // 检查是否击中地面
            if (grenade.position.y <= 0) {
                // 创建爆炸效果
                this.createExplosion(grenade.position);
                
                // 检查是否击中敌人
                if (this.enemy) {
                    const enemyBox = new THREE.Box3().setFromObject(this.enemy.instance);
                    const explosionBox = new THREE.Box3().setFromCenterAndSize(
                        grenade.position,
                        new THREE.Vector3(10, 10, 10)
                    );
                    
                    if (explosionBox.intersectsBox(enemyBox)) {
                        // 敌人受到伤害
                        this.enemy.updateHealth(this.enemy.health - 20);
                    }
                }
                
                // 移除手雷
                this.scene.remove(grenade);
                this.grenades.splice(i, 1);
                continue;
            }
            
            // 检查是否超出范围
            if (grenade.position.distanceTo(this.character.instance.position) > 100) {
                this.scene.remove(grenade);
                this.grenades.splice(i, 1);
            }
        }
    }
}

// 创建场景管理器实例
const sceneManager = new SceneManager();

// 导出场景管理器
export default SceneManager; 