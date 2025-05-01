import * as THREE from 'three';
import Base from './base.js';

class YunYing extends Base {
    constructor(options = {}) {
        super();
        this.modelPath = options.modelPath || './mode/云樱/53800_YunYing.fbx';
        this.dancePath = options.dancePath || './mode/云樱/53800_YunYing_Dance.fbx';
        this.position = options.position || { x: 0, y: 0, z: 0 };
        this.scale = options.scale || { x: 200, y: 200, z: 200 };
        this.rotation = options.rotation || { x: 0, y: 0, z: 0 };
        this.mixer = null;
        this.animations = {};
        this.currentAction = null;
        this.previousAction = null;
        this.boundingBox = null;
        this.isInitialized = false;
        this.initPromise = null;
        this.scene = options.scene || new THREE.Scene();
        this.init();
    }

    async init() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            try {
                // 创建 FBX 加载器
                const loader = new THREE.FBXLoader();
                
                // 设置加载器的基础路径
                const basePath = this.modelPath.substring(0, this.modelPath.lastIndexOf('/') + 1);
                loader.setPath(basePath);
                
                // 设置贴图路径
                const texturePath = basePath + 'Materials/';
                loader.setResourcePath(texturePath);
                
                // 获取文件名
                const fileName = this.modelPath.substring(this.modelPath.lastIndexOf('/') + 1);
                
                // 加载模型
                const model = await new Promise((resolve, reject) => {
                    loader.load(
                        fileName,
                        (object) => {
                            if (!object) {
                                reject(new Error('模型加载失败：返回的对象为空'));
                                return;
                            }
                            
                            // 直接设置模型的缩放
                            object.scale.set(200, 200, 200);
                            object.position.y = 10;
                            
                            this.model = object;
                            
                            // 确保场景存在
                            if (!this.scene) {
                                this.scene = new THREE.Scene();
                            }
                            
                            this.scene.add(this.model);
                            
                            // 检查模型是否包含骨骼
                            let hasSkeleton = false;
                            this.model.traverse((child) => {
                                if (child.isSkinnedMesh) {
                                    hasSkeleton = true;
                                }
                            });
                            
                            // 设置位置
                            this.setPosition(this.position.x, this.position.y + 5, this.position.z);
                            
                            // 设置旋转
                            this.setRotation(this.rotation.x, this.rotation.y, this.rotation.z);

                            // 遍历模型中的所有网格
                            this.model.traverse((child) => {
                                if (child.isMesh) {
                                    // 启用阴影
                                    child.castShadow = true;
                                    child.receiveShadow = true;
                                }
                            });

                            // 创建碰撞盒
                            this.boundingBox = new THREE.Box3().setFromObject(this.model);

                            // 创建基本的动画混合器
                            this.mixer = new THREE.AnimationMixer(this.model);

                            // 加载舞蹈动画
                            const danceFileName = this.dancePath.substring(this.dancePath.lastIndexOf('/') + 1);
                            
                            // 创建新的加载器实例用于加载动画
                            const danceLoader = new THREE.FBXLoader();
                            danceLoader.setPath(basePath);
                            danceLoader.setResourcePath(texturePath);
                            
                            danceLoader.load(
                                danceFileName,
                                (danceObject) => {
                                    if (!danceObject) {
                                        resolve(this.model);
                                        return;
                                    }
                                    
                                    // 设置动画
                                    if (danceObject.animations && danceObject.animations.length) {
                                        try {
                                            danceObject.animations.forEach((clip) => {
                                                if (clip && clip.name) {
                                                    const action = this.mixer.clipAction(clip);
                                                    this.animations[clip.name] = action;
                                                }
                                            });
                                            // 默认播放第一个动画
                                            if (danceObject.animations[0] && danceObject.animations[0].name) {
                                                this.playAnimation(danceObject.animations[0].name);
                                            }
                                        } catch (error) {
                                            // 动画设置失败，继续使用基本的动画混合器
                                        }
                                    }

                                    // 标记初始化完成
                                    this.isInitialized = true;
                                    resolve(this.model);
                                },
                                (xhr) => {
                                    // 加载进度回调，不输出日志
                                },
                                (error) => {
                                    resolve(this.model); // 即使动画加载失败，也返回模型
                                }
                            );
                        },
                        (xhr) => {
                            // 加载进度回调，不输出日志
                        },
                        (error) => {
                            reject(error);
                        }
                    );
                });

                return model;
            } catch (error) {
                this.isInitialized = false;
                throw error;
            }
        })();

        return this.initPromise;
    }

    // 播放动画
    playAnimation(name, duration = 0.2) {
        if (!this.mixer) {
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
        }
    }

    // 更新方法
    update(delta) {
        if (!this.isInitialized || !this.model) {
            return;
        }

        delta = Math.max(delta, 0.001);

        if (this.mixer) {
            try {
                this.mixer.update(delta);
            } catch (error) {
                // 更新动画失败，不输出日志
            }
        }
    }
}

export default YunYing; 