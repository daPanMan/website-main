


export function emailGeometry(){
    const fontLoader = new THREE.FontLoader();
    let emailGeometry = null;
    
    fontLoader.load('fonts/helvetiker_bold.typeface.json', function (font) {
        console.log("✅ Font Loaded Successfully!", font); // Debugging
    
        emailGeometry = new THREE.TextGeometry("@", {
            font: font,
            size: 1.5,
            height: 0.4,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 5
        });
      
        emailGeometry.computeBoundingBox();
        emailGeometry.center();
        
        console.log("✅ Email Text Geometry Created:", emailGeometry); // Debugging
    }, undefined, function (error) {
        console.error("❌ Font Failed to Load:", error); // Debugging
    });
    console.log(emailGeometry)

    return emailGeometry;
}
