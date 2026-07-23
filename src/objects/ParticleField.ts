import {AdditiveBlending, BufferAttribute, BufferGeometry, Points, PointsMaterial} from 'three';
import {mulberry32} from '../utils/random';

export class ParticleField extends Points {
  public constructor(count: number) {
    const random = mulberry32(20260718);
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index++) {
      positions[index * 3] = (random() - 0.5) * 34;
      positions[index * 3 + 1] = (random() - 0.5) * 18;
      positions[index * 3 + 2] = (random() - 0.5) * 28;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    super(geometry, new PointsMaterial({color: '#7b9590', size: 0.026, transparent: true, opacity: 0.34, depthWrite: false, blending: AdditiveBlending}));
  }

  public update(elapsed: number, reducedMotion: boolean): void { if (!reducedMotion) this.rotation.y = elapsed * 0.004; }
  public disposeField(): void { this.geometry.dispose(); (this.material as PointsMaterial).dispose(); }
}
