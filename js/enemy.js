class Enemy {
    constructor(scene, position) {
        this.scene = scene;
        this.health = 100;
        this.maxHealth = 100;
        this.isDead = false;
        this.lastDamageTime = Date.now();
        
        // 创建敌人模型
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        
        // 创建血条
        this.createHealthBar();
        
        // 添加到场景
        this.scene.add(this.mesh);
        
        console.log('敌人创建，初始血量:', this.health);
    }

    createHealthBar() {
        // 创建血条背景
        const healthBarGeometry = new THREE.PlaneGeometry(2, 0.2);
        const healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        
        // 创建血条前景
        const healthBarFillGeometry = new THREE.PlaneGeometry(2, 0.2);
        const healthBarFillMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.healthBarFill = new THREE.Mesh(healthBarFillGeometry, healthBarFillMaterial);
        
        // 设置血条位置
        this.healthBar.position.y = 1.5;
        this.healthBarFill.position.y = 1.5;
        
        // 添加到敌人模型
        this.mesh.add(this.healthBar);
        this.mesh.add(this.healthBarFill);
    }

    update(delta) {
        if (!this.isDead) {
            const currentTime = Date.now();
            if (currentTime - this.lastDamageTime >= 1000) { // 每秒执行一次
                this.lastDamageTime = currentTime;
                this.takeDamage(1);
            }
        }
    }

    takeDamage(amount) {
        if (this.isDead) {
            console.log('敌人已死亡，不再扣血');
            return;
        }
        
        this.health -= amount;
        console.log('敌人受到伤害:', amount, '当前血量:', this.health);
        
        // 更新血条
        if (this.healthBarFill) {
            const healthPercent = this.health / this.maxHealth;
            this.healthBarFill.scale.x = healthPercent;
            console.log('血条更新:', healthPercent);
        } else {
            console.log('警告：血条对象不存在');
        }
        
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        console.log('敌人死亡');
        this.scene.remove(this.mesh);
        this.scene.remove(this.healthBar);
        this.scene.remove(this.healthBarFill);
    }
} 