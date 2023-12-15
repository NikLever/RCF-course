import { Plane, Triangle, Line3, Vector3 } from 'three'

function getFaceVertices( face, geometry, vertices ){
    if (!face || !vertices ) return false;

    const posAttr = geometry.getAttribute('position');

    getVertexPosition(face.a, 0);
    getVertexPosition(face.b, 1);
    getVertexPosition(face.c, 2);

    return true;

    function getVertexPosition(vIndex, index){
        const v = vertices[index];
        v.x = posAttr.getX(vIndex);
        v.y = posAttr.getY(vIndex);
        v.z = posAttr.getZ(vIndex);
    }
}

function getLineRayIntersect( line, Ray, intersect){

}

function getTriangleEdgeRayIntersect( tri, ray, intersect ){
    const mid = new Vector3();
    tri.getMidoint(mid);
    const vertices = [ new Vector3(), new Vector3(), new Vector3() ];
}

function alignMeshToEdge( mesh, face, delta ){
    const posAttr = mesh.geometry.getAttribute('position');
    const triangle = new THREE.Triangle().setFromAttributeAndIndices(posAttr, face.a, face.b, face.c);
    const pos = new THREE.Vector3();
    mesh.getWorldPosition(pos);
    mesh.getWorldPosition(triangle.a);
    mesh.getWorldPosition(triangle.b);
    mesh.getWorldPosition(triangle.c);
}

export { alignMeshToEdge };