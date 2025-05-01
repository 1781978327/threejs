import * as THREE from 'three';
import Base from './base.js';

class Grenade extends Base {
    constructor(scene, character) {
        super();
        this.scene = scene;
        this.character = character;
        this.grenade = null;
        this.velocity = new THREE.Vector3();
        this.gravity = 0.3;
        this.isThrown = false;
        this.explosionRadius = 10;
        this.damage = 50;
        this.timer = 3;
        this.trail = null;  // 轨迹线
        this.trailPoints = [];  // 轨迹点
        this.createGrenade();
        this.createTrail();
    }

    createGrenade() {
        // 创建手雷几何体
        const geometry = new THREE.SphereGeometry(2, 32, 32);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            shininess: 100,
            emissive: 0xff0000,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.8
        });
        this.grenade = new THREE.Mesh(geometry, material);
        this.grenade.castShadow = true;
        
        // 添加点光源使手雷更亮
        const light = new THREE.PointLight(0xff0000, 2, 10);
        this.grenade.add(light);
        
        this.scene.add(this.grenade);
    }

    createTrail() {
        // 创建轨迹线
        const trailGeometry = new THREE.BufferGeometry();
        const trailMaterial = new THREE.LineBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.5
        });
        this.trail = new THREE.Line(trailGeometry, trailMaterial);
        this.scene.add(this.trail);
    }

    updateTrail() {
        if (!this.isThrown) return;

        // 添加新的轨迹点
        this.trailPoints.push(this.grenade.position.clone());
        
        // 只保留最近的50个点
        if (this.trailPoints.length > 50) {
            this.trailPoints.shift();
        }

        // 更新轨迹线
        const positions = new Float32Array(this.trailPoints.length * 3);
        this.trailPoints.forEach((point, i) => {
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;
        });
        
        this.trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.trail.geometry.attributes.position.needsUpdate = true;
    }

    throw() {
        if (this.isThrown) return;

        // 获取人物位置和朝向
        const characterPosition = this.character.instance.position.clone();
        const characterDirection = new THREE.Vector3(0, 0, -1);
        characterDirection.applyQuaternion(this.character.instance.quaternion);

        // 设置手雷初始位置（在人物前方）
        this.grenade.position.copy(characterPosition);
        this.grenade.position.y += 2;
        this.grenade.position.add(characterDirection.multiplyScalar(2));

        // 设置初始速度（形成抛物线）
        this.velocity.copy(characterDirection).multiplyScalar(15);
        this.velocity.y = 10;

        this.isThrown = true;
        this.startTimer();
    }

    update() {
        if (!this.isThrown) return;

        // 应用重力
        this.velocity.y -= this.gravity;

        // 更新位置
        this.grenade.position.add(this.velocity);

        // 更新轨迹
        this.updateTrail();

        // 检查是否落地
        if (this.grenade.position.y <= 0) {
            this.explode();
        }
    }

    startTimer() {
        setTimeout(() => {
            this.explode();
        }, this.timer * 1000);
    }

    explode() {
        if (!this.isThrown) return;

        // 创建爆炸效果
        const explosionGeometry = new THREE.SphereGeometry(this.explosionRadius, 32, 32);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.5
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(this.grenade.position);
        this.scene.add(explosion);

        // 添加爆炸光源
        const explosionLight = new THREE.PointLight(0xff0000, 5, 20);
        explosionLight.position.copy(this.grenade.position);
        this.scene.add(explosionLight);

        // 检查范围内的敌人
        this.checkDamage();

        // 移除手雷和轨迹
        this.scene.remove(this.grenade);
        this.scene.remove(this.trail);
        this.isThrown = false;
        this.trailPoints = [];
        this.createTrail();  // 重新创建轨迹线

        // 移除爆炸效果
        setTimeout(() => {
            this.scene.remove(explosion);
            this.scene.remove(explosionLight);
        }, 1000);
    }

    checkDamage() {
        console.log('爆炸！伤害范围:', this.explosionRadius);
        
        // 获取场景中的所有敌人
        const enemies = this.scene.children.filter(child => child.userData.isEnemy);
        
        // 检查每个敌人是否在爆炸范围内
        enemies.forEach(enemy => {
            const distance = enemy.position.distanceTo(this.grenade.position);
            if (distance <= this.explosionRadius) {
                console.log('敌人被爆炸击中，距离:', distance);
                // 计算伤害（距离越近伤害越高）
                const damage = Math.max(0, this.damage * (1 - distance / this.explosionRadius));
                console.log('造成伤害:', damage);
                // 使用正确的属性名更新血量
                if (enemy.userData.enemyInstance) {
                    enemy.userData.enemyInstance.updateHealth(enemy.userData.enemyInstance.health - damage);
                    console.log('敌人剩余血量:', enemy.userData.enemyInstance.health);
                }
            }
        });
    }
}

export default Grenade; 