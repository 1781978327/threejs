import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class Controls {
    constructor(camera, domElement) {
        // 使用全局的 OrbitControls
        this.controls = new OrbitControls(camera, domElement);
        this.init();
    }

    init() {
        // 设置控制器的基本参数
        this.controls.enableDamping = true; // 启用阻尼效果
        this.controls.dampingFactor = 0.05; // 阻尼系数
        this.controls.screenSpacePanning = true; // 平移时保持相机高度
        this.controls.minDistance = 10; // 最小缩放距离
        this.controls.maxDistance = 500; // 最大缩放距离
        this.controls.maxPolarAngle = Math.PI; // 最大垂直旋转角度
        this.controls.minPolarAngle = 0; // 最小垂直旋转角度
        this.controls.autoRotate = false; // 是否自动旋转
        this.controls.autoRotateSpeed = 2.0; // 自动旋转速度
        this.controls.enableZoom = true; // 启用缩放
        this.controls.enablePan = true; // 启用平移
        this.controls.enableRotate = true; // 启用旋转
        this.controls.rotateSpeed = 1.0; // 旋转速度
        this.controls.zoomSpeed = 1.0; // 缩放速度
        this.controls.panSpeed = 1.0; // 平移速度
        this.controls.target = new THREE.Vector3(0, 0, 0); // 设置默认目标点
        
        // 添加事件监听器
        this.controls.addEventListener('change', () => {
            // 当控制器发生变化时触发
            console.log('相机控制发生变化');
        });
    }

    // 更新控制器
    update() {
        if (this.controls) {
            this.controls.update();
        }
    }

    // 设置目标点
    setTarget(x, y, z) {
        if (this.controls) {
            this.controls.target.set(x, y, z);
        }
    }

    // 设置相机位置
    setPosition(x, y, z) {
        if (this.controls) {
            this.controls.object.position.set(x, y, z);
        }
    }

    // 启用/禁用自动旋转
    setAutoRotate(enabled) {
        if (this.controls) {
            this.controls.autoRotate = enabled;
        }
    }

    // 设置自动旋转速度
    setAutoRotateSpeed(speed) {
        if (this.controls) {
            this.controls.autoRotateSpeed = speed;
        }
    }

    // 设置旋转速度
    setRotateSpeed(speed) {
        if (this.controls) {
            this.controls.rotateSpeed = speed;
        }
    }

    // 设置缩放速度
    setZoomSpeed(speed) {
        if (this.controls) {
            this.controls.zoomSpeed = speed;
        }
    }

    // 设置平移速度
    setPanSpeed(speed) {
        if (this.controls) {
            this.controls.panSpeed = speed;
        }
    }

    // 设置最小/最大缩放距离
    setZoomLimits(min, max) {
        if (this.controls) {
            this.controls.minDistance = min;
            this.controls.maxDistance = max;
        }
    }

    // 设置垂直旋转角度限制
    setPolarAngleLimits(min, max) {
        if (this.controls) {
            this.controls.minPolarAngle = min;
            this.controls.maxPolarAngle = max;
        }
    }
}

export default Controls; 