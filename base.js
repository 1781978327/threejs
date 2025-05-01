import * as THREE from 'three';

class Base {
    constructor() {
        this.instance = null;
        this.material = null;
        this.geometry = null;
    }

    setPosition(x, y, z) {
        if (this.instance) {
            this.instance.position.set(x, y, z);
        }
    }

    setRotation(x, y, z) {
        if (this.instance) {
            this.instance.rotation.set(x, y, z);
        }
    }

    setScale(x, y, z) {
        if (this.instance) {
            this.instance.scale.set(x, y, z);
        }
    }

    setMaterial(material) {
        if (this.instance) {
            this.instance.material = material;
            this.material = material;
        }
    }

    setGeometry(geometry) {
        if (this.instance) {
            this.instance.geometry = geometry;
            this.geometry = geometry;
        }
    }

    addToScene(scene) {
        if (this.instance) {
            scene.add(this.instance);
        }
    }

    removeFromScene(scene) {
        if (this.instance) {
            scene.remove(this.instance);
        }
    }

    dispose() {
        if (this.instance) {
            if (this.geometry) {
                this.geometry.dispose();
            }
            if (this.material) {
                if (Array.isArray(this.material)) {
                    this.material.forEach(material => material.dispose());
                } else {
                    this.material.dispose();
                }
            }
        }
    }
}

export default Base; 