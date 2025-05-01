import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import SceneManager from '../scene.js';

// 将Three.js的扩展添加到全局对象
window.THREE = THREE;
window.OrbitControls = OrbitControls;
window.GLTFLoader = GLTFLoader;
window.MTLLoader = MTLLoader;
window.OBJLoader = OBJLoader;
window.FBXLoader = FBXLoader;
window.CSS3DRenderer = CSS3DRenderer;

// 初始化场景管理器
const sceneManager = new SceneManager();

// 初始化场景
sceneManager.init().then(() => {
    console.log('场景初始化完成');
}).catch(error => {
    console.error('场景初始化失败:', error);
}); 