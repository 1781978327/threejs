import Base from './base.js';
import * as THREE from 'three';

class Building extends Base {
    constructor(options = {}) {
        super();
        this.width = options.width || 1;
        this.height = options.height || 1;
        this.depth = options.depth || 1;
        this.color = options.color || 0xC67171;
        this.position = options.position || { x: 0, y: 0, z: 0 };
        this.boundingBox = null;
        this.init();
    }

    init() {
        // 创建几何体
        this.geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        
        // 加载墙体纹理
        const textureLoader = new THREE.TextureLoader();
        const wallTexture = textureLoader.load('./images/floor.png');
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(this.width/2, this.height/2); // 根据建筑物大小调整纹理重复次数
        
        // 创建材质
        this.material = new THREE.MeshStandardMaterial({
            map: wallTexture,
            roughness: 0.7,
            metalness: 0.3
        });

        // 创建网格
        this.instance = new THREE.Mesh(this.geometry, this.material);
        
        // 设置位置
        this.setPosition(this.position.x, this.position.y, this.position.z);
        
        // 启用阴影
        this.instance.castShadow = true;

        // 创建碰撞盒
        this.boundingBox = new THREE.Box3().setFromObject(this.instance);
    }

    // 检查是否与另一个碰撞盒相交
    checkCollision(otherBox) {
        return this.boundingBox.intersectsBox(otherBox);
    }

    // 更新碰撞盒位置
    updateBoundingBox() {
        if (this.instance && this.boundingBox) {
            this.boundingBox.setFromObject(this.instance);
        }
    }
}

// 创建地面类
class Ground extends Base {
    constructor(options = {}) {
        super();
        this.width = options.width || 1000;
        this.height = options.height || 1000;
        this.color = options.color || 0x90EE90;
        this.init();
    }

    init() {
        // 创建几何体
        this.geometry = new THREE.PlaneGeometry(this.width, this.height);
        
        // 加载草地纹理
        const textureLoader = new THREE.TextureLoader();
        const grassTexture = textureLoader.load('./images/grass.jpg');
        grassTexture.wrapS = THREE.RepeatWrapping;
        grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(50, 50); // 设置纹理重复次数
        
        // 创建材质
        this.material = new THREE.MeshStandardMaterial({
            map: grassTexture,
            side: THREE.DoubleSide,
            roughness: 0.8,
            metalness: 0.2
        });

        // 创建网格
        this.instance = new THREE.Mesh(this.geometry, this.material);
        
        // 旋转地面
        this.instance.rotation.x = -Math.PI / 2;
        
        // 启用阴影
        this.instance.receiveShadow = true;
    }
}

// 创建贴图类
class TextureMarker extends Base {
    constructor(options = {}) {
        super();
        this.texturePath = options.texturePath || './images/怪物1.png';
        this.size = options.size || 10;
        this.position = options.position || { x: 0, y: 0.1, z: 0 };
        this.init();
    }

    init() {
        // 创建几何体
        this.geometry = new THREE.PlaneGeometry(this.size, this.size);
        
        // 加载贴图
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(this.texturePath);
        
        // 创建材质
        this.material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        // 创建网格
        this.instance = new THREE.Mesh(this.geometry, this.material);
        
        // 设置位置
        this.setPosition(this.position.x, this.position.y, this.position.z);
        
        // 旋转贴图使其面向相机
        this.instance.rotation.x = -Math.PI / 2;
    }
}

// 创建建筑物管理器
class BuildingManager {
    constructor(scene) {
        this.scene = scene;
        this.buildings = [];
        this.ground = null;
        this.safeZoneRadius = 10; // 安全区域半径
        this.textureMarker = null; // 贴图标记
    }

    // 创建地面
    createGround() {
        this.ground = new Ground();
        this.ground.addToScene(this.scene);
    }

    // 创建随机位置的贴图
    createRandomTextureMarker() {
        // 随机生成位置
        const x = this.getRandomInt(-500, 500);
        const z = this.getRandomInt(-500, 500);
        
        this.textureMarker = new TextureMarker({
            position: { x, y: 0.1, z }
        });
        
        this.textureMarker.addToScene(this.scene);
    }

    // 检查位置是否安全
    isPositionSafe(position) {
        // 检查是否在安全区域内
        const distanceFromCenter = Math.sqrt(position.x * position.x + position.z * position.z);
        if (distanceFromCenter < this.safeZoneRadius) {
            return false;
        }

        // 检查是否与任何建筑物重叠
        const testBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(position.x, position.y, position.z),
            new THREE.Vector3(2, 2, 2) // 测试盒的大小
        );

        for (const building of this.buildings) {
            if (building.checkCollision(testBox)) {
                return false;
            }
        }

        return true;
    }

    // 创建随机建筑物
    createRandomBuildings(count = 400) {
        for (let i = 0; i < count; i++) {
            const height = this.getRandomInt(5, 15);
            const width = this.getRandomInt(3, 8);
            const depth = this.getRandomInt(2, 8);
            
            // 尝试找到一个安全的位置
            let position;
            let attempts = 0;
            const maxAttempts = 50;

            do {
                const x = this.getRandomInt(-500, 500);
                const z = this.getRandomInt(-500, 500);
                const y = height / 2;
                position = { x, y, z };
                attempts++;
            } while (!this.isPositionSafe(position) && attempts < maxAttempts);

            // 如果找不到安全位置，跳过这个建筑物
            if (attempts >= maxAttempts) {
                continue;
            }

            const building = new Building({
                width,
                height,
                depth,
                position
            });

            building.addToScene(this.scene);
            this.buildings.push(building);
        }
    }

    // 获取随机整数
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 检查与建筑物的碰撞
    checkCollisions(characterBox) {
        for (const building of this.buildings) {
            if (building.checkCollision(characterBox)) {
                return true;
            }
        }
        return false;
    }

    // 清理所有建筑物
    dispose() {
        this.buildings.forEach(building => building.dispose());
        this.buildings = [];
        if (this.ground) {
            this.ground.dispose();
        }
    }
}

export { Building, Ground, BuildingManager }; 