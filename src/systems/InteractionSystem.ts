import {Raycaster, Vector2, type Camera, type Object3D} from 'three';
import type {ProjectId} from '../data/projects';
import type {ProjectNode} from '../objects/ProjectNode';

export class InteractionSystem {
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2(4, 4);
  private hovered: ProjectId | null = null;
  private enabled = true;
  private readonly targets: Object3D[];

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: Camera,
    private readonly nodes: ProjectNode[],
    private readonly onHover: (id: ProjectId | null) => void,
    private readonly onSelect: (id: ProjectId) => void,
  ) {
    this.targets = nodes.map((node) => node.hitTarget);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
    canvas.addEventListener('click', this.onClick);
  }

  public setEnabled(value: boolean): void { this.enabled = value; if (!value) this.setHovered(null); }

  private readonly onPointerMove = (event: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  };
  private readonly onPointerLeave = (): void => { this.pointer.set(4, 4); this.setHovered(null); };
  private readonly onClick = (): void => { if (this.enabled && this.hovered) this.onSelect(this.hovered); };

  public update(): void {
    if (!this.enabled) return;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.targets, false)[0];
    this.setHovered((hit?.object.userData.projectId as ProjectId | undefined) ?? null);
  }

  private setHovered(id: ProjectId | null): void {
    if (this.hovered === id) return;
    this.hovered = id;
    this.nodes.forEach((node) => node.setHovered(node.projectId === id));
    this.canvas.style.cursor = id ? 'pointer' : 'default';
    this.onHover(id);
  }

  public dispose(): void {
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.canvas.removeEventListener('click', this.onClick);
  }
}
