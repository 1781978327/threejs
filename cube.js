import * as THREE from 'three';
import Base from './base.js';

class Cube extends Base {
    constructor(options = {}) {
        super();
        this.width = options.width || 1;
        this.height = options.height || 1;
        this.depth = options.depth || 1;
        this.color = options.color || 0x000000;
        this.shininess = options.shininess || 100;
        this.init();
    }

    init() {
        // 创建几何体
        this.geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        
        // 创建材质
        this.material = new THREE.MeshPhongMaterial({
            color: this.color,
            shininess: this.shininess
        });

        // 创建网格
        this.instance = new THREE.Mesh(this.geometry, this.material);
    }

    // 设置颜色
    setColor(color) {
        if (this.material) {
            this.material.color.set(color);
        }
    }

    // 设置光泽度
    setShininess(shininess) {
        if (this.material) {
            this.material.shininess = shininess;
        }
    }
}

export default Cube; 