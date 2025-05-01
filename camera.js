import * as THREE from 'three';
import Base from './base.js';

class Camera extends Base {
    constructor(options = {}) {
        super();
        this.fov = options.fov || 75;
        this.aspect = options.aspect || window.innerWidth / window.innerHeight;
        this.near = options.near || 0.1;
        this.far = options.far || 1000;
        this.position = options.position || { x: 0, y: 10, z: 20 };
        this.target = options.target || { x: 0, y: 0, z: 0 };
        this.rotationSpeed = options.rotationSpeed || 0.002;
        this.zoomSpeed = options.zoomSpeed || 0.1;
        this.minDistance = options.minDistance || 5;
        this.maxDistance = options.maxDistance || 30;
        this.minPolarAngle = options.minPolarAngle || 0;
        this.maxPolarAngle = options.maxPolarAngle || Math.PI / 2;
        this.targetObject = null;
        this.distance = 20;
        this.phi = Math.PI / 4;
        this.theta = 0;
        this.keys = {};
        this.isPointerLocked = false;
        this.init();
    }

    init() {
        // 创建透视相机
        this.instance = new THREE.PerspectiveCamera(
            this.fov,
            this.aspect,
            this.near,
            this.far
        );

        // 设置相机位置
        this.setPosition(this.position.x, this.position.y, this.position.z);

        // 初始化鼠标事件
        this.initMouseEvents();
        // 初始化键盘事件
        this.initKeyboardEvents();
    }

    initMouseEvents() {
        // 点击时锁定鼠标
        document.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                document.body.requestPointerLock();
            }
        });

        // 监听鼠标锁定状态变化
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === document.body;
        });

        // 监听鼠标移动
        document.addEventListener('mousemove', (event) => {
            if (this.isPointerLocked) {
                // 更新相机角度
                this.theta -= event.movementX * this.rotationSpeed;
                this.phi = Math.max(0.1, Math.min(Math.PI / 2, this.phi + event.movementY * this.rotationSpeed));

                // 更新角色朝向
                if (this.targetObject) {
                    this.targetObject.setRotation(0, this.theta, 0);
                }
            }
        });

        // 鼠标滚轮缩放
        document.addEventListener('wheel', (event) => {
            const delta = Math.sign(event.deltaY);
            this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance + delta * this.zoomSpeed));
        });
    }

    initKeyboardEvents() {
        document.addEventListener('keydown', (event) => {
            this.keys[event.key.toLowerCase()] = true;
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.key.toLowerCase()] = false;
        });
    }

    setTarget(object) {
        this.targetObject = object;
    }

    update() {
        if (this.targetObject) {
            // 计算相机位置
            const x = this.distance * Math.sin(this.phi) * Math.sin(this.theta);
            const y = this.distance * Math.cos(this.phi);
            const z = this.distance * Math.sin(this.phi) * Math.cos(this.theta);

            // 设置相机位置
            this.instance.position.set(
                this.targetObject.instance.position.x + x,
                this.targetObject.instance.position.y + y,
                this.targetObject.instance.position.z + z
            );

            // 设置相机朝向
            this.instance.lookAt(this.targetObject.instance.position);

            // 处理键盘输入
            if (this.keys['w']) {
                this.targetObject.move('forward', 1, this.theta);
            }
            if (this.keys['s']) {
                this.targetObject.move('backward', 1, this.theta);
            }
            if (this.keys['a']) {
                this.targetObject.move('left', 1, this.theta);
            }
            if (this.keys['d']) {
                this.targetObject.move('right', 1, this.theta);
            }
        }
    }

    getRotation() {
        return this.theta;
    }
}

export default Camera; 