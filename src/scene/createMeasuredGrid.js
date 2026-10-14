import { Group, GridHelper, BufferGeometry, Float32BufferAttribute, LineSegments, LineBasicMaterial, CanvasTexture, Sprite, SpriteMaterial, SRGBColorSpace } from 'three';

// World-space rulers: numbers stay attached to metre lines as the overview orbits.
export function createMeasuredGrid(width = 12, depth = 12) {
  const grid = new Group();
  grid.name = 'One metre floor grid';
  grid.position.y = .006;
  const lines=[];
  for(let x=Math.ceil(-width/2);x<=width/2;x++)lines.push(x,0,-depth/2,x,0,depth/2);
  for(let z=Math.ceil(-depth/2);z<=depth/2;z++)lines.push(-width/2,0,z,width/2,0,z);
  const floorLines=new BufferGeometry();floorLines.setAttribute('position',new Float32BufferAttribute(lines,3));
  grid.add(new LineSegments(floorLines,new LineBasicMaterial({color:'#8d9d8e'})));
  const vertices = [];
  function label(text, x, z, width = .6) {
    const canvas = document.createElement('canvas');
    canvas.width = 192; canvas.height = 96;
    const context = canvas.getContext('2d');

    context.fillStyle = '#20332b'; context.font = '600 64px Segoe UI';
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(text, 96, 48);
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace;
    const sprite = new Sprite(new SpriteMaterial({ map: texture, depthWrite: false, toneMapped: false }));
    sprite.position.set(x, .08, z); sprite.scale.set(width, width / 2, 1);
    grid.add(sprite);
  }
  // Two adjacent edges: one ruler for each floor axis.
  const spacing=Math.max(width,depth)>16?2:1;
  for(let metre=Math.ceil(-width/2);metre<=width/2;metre++) {
    vertices.push(metre,.002,depth/2,metre,.002,depth/2+.18);
    if(metre%spacing===0)label(String(metre),metre,depth/2+.42);
  }
  for(let metre=Math.ceil(-depth/2);metre<=depth/2;metre++) {
    vertices.push(-width/2,.002,metre,-width/2-.18,.002,metre);
    if(metre%spacing===0)label(String(metre),-width/2-.42,metre);
  }
  label('X (m)',0,depth/2+1,.85);
  label('Z (m)',-width/2-1,0,.85);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  grid.add(new LineSegments(geometry, new LineBasicMaterial({ color: '#466452' })));
  grid.traverse(object => object.layers.set(1));
  return grid;
}


