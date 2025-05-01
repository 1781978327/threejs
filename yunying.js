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
                console.log('开始加载云樱模型:', this.modelPath);
                
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
                            
                            console.log('云樱模型加载成功');
                            console.log('模型原始尺寸:', object.scale);
                            console.log('模型原始位置:', object.position);
                            console.log('模型原始旋转:', object.rotation);
                            
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
                                    console.log('模型包含骨骼系统');
                                }
                            });
                            
                            if (!hasSkeleton) {
                                console.warn('模型不包含骨骼系统，可能无法播放动画');
                            }
                            
                            // 设置位置
                            this.setPosition(this.position.x, this.position.y + 5, this.position.z);
                            console.log('模型位置设置完成:', this.position);
                            
                            // 设置旋转
                            this.setRotation(this.rotation.x, this.rotation.y, this.rotation.z);
                            console.log('模型旋转设置完成:', this.rotation);

                            // 遍历模型中的所有网格
                            let meshCount = 0;
                            this.model.traverse((child) => {
                                if (child.isMesh) {
                                    meshCount++;
                                    // 启用阴影
                                    child.castShadow = true;
                                    child.receiveShadow = true;
                                }
                            });
                            console.log('模型网格数量:', meshCount);

                            // 创建碰撞盒
                            this.boundingBox = new THREE.Box3().setFromObject(this.model);
                            console.log('碰撞盒创建完成');

                            // 加载舞蹈动画
                            console.log('开始加载舞蹈动画:', this.dancePath);
                            const danceFileName = this.dancePath.substring(this.dancePath.lastIndexOf('/') + 1);
                            
                            // 创建新的加载器实例用于加载动画
                            const danceLoader = new THREE.FBXLoader();
                            danceLoader.setPath(basePath);
                            danceLoader.setResourcePath(texturePath);
                            
                            danceLoader.load(
                                danceFileName,
                                (danceObject) => {
                                    if (!danceObject) {
                                        console.warn('舞蹈动画加载失败：返回的对象为空');
                                        resolve(this.model);
                                        return;
                                    }
                                    
                                    console.log('舞蹈动画加载成功');
                                    
                                    // 设置动画
                                    if (danceObject.animations && danceObject.animations.length) {
                                        try {
                                            console.log('开始设置动画...');
                                            this.mixer = new THREE.AnimationMixer(this.model);
                                            danceObject.animations.forEach((clip) => {
                                                if (clip && clip.name) {
                                                    const action = this.mixer.clipAction(clip);
                                                    this.animations[clip.name] = action;
                                                    console.log('添加动画:', clip.name);
                                                }
                                            });
                                            // 默认播放第一个动画
                                            if (danceObject.animations[0] && danceObject.animations[0].name) {
                                                this.playAnimation(danceObject.animations[0].name);
                                                console.log('播放默认动画:', danceObject.animations[0].name);
                                            }
                                        } catch (error) {
                                            console.error('设置动画失败:', error);
                                        }
                                    } else {
                                        console.warn('模型没有动画数据');
                                    }

                                    // 标记初始化完成
                                    this.isInitialized = true;
                                    console.log('云樱初始化完成');
                                    resolve(this.model);
                                },
                                (xhr) => {
                                    const percentComplete = (xhr.loaded / xhr.total) * 100;
                                    console.log('舞蹈动画加载进度:', percentComplete.toFixed(2) + '%');
                                },
                                (error) => {
                                    console.error('加载舞蹈动画失败:', error);
                                    resolve(this.model); // 即使动画加载失败，也返回模型
                                }
                            );
                        },
                        (xhr) => {
                            const percentComplete = (xhr.loaded / xhr.total) * 100;
                            console.log('模型加载进度:', percentComplete.toFixed(2) + '%');
                        },
                        (error) => {
                            console.error('加载云樱模型失败:', error);
                            reject(error);
                        }
                    );
                });

                return model;
            } catch (error) {
                console.error('加载云樱模型失败:', error);
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
                console.error('更新动画失败:', error);
            }
        }
    }
}

export default YunYing; 