export function createCube(index, spec) {
  
    
    let baseX, baseY, baseZ;
    let cubeTitle = `Shape ${index + 1}`;

    

    let shape;
    let material;
  
    // ✅ Other Shapes
    // const shapes = [
    //     new THREE.BoxGeometry(1.5, 1.5, 1.5),
    //     new THREE.SphereGeometry(0.9, 32, 32),
    //     emailGeometry(),
    //     new THREE.BoxGeometry(1.6, 1.6, 1.6),
    //     new THREE.CylinderGeometry(2, 2, 0.2, 64),
    //     linkedInGeometry(),
    // ];
    // shape = shapes[index];


    

    const cube = spec.type;
    cubeTitle = spec.label;
    cube.userData.url = spec.url;
    console.log(cube);
    
    return cube;
}

// ✅ Function to Make Cubes Wander Randomly
export function animateCubeMovement(cube) {
    const randomTime = 2 + Math.random() * 3; // Vary speed between 2-5 seconds

    gsap.to(cube.position, {
        x: cube.position.x + (Math.random() - 0.5) * 1.5, 
        y: cube.position.y + (Math.random() - 0.5) * 1.5,
        z: cube.position.z + (Math.random() - 0.5) * 0.5,
        duration: randomTime,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1 
    });
    
    // ✅ Rotate freely in all directions for other shapes
    gsap.to(cube.rotation, {
        x: Math.random() * Math.PI * 2,
        y: Math.random() * Math.PI * 2,
        z: Math.random() * Math.PI * 2,
        duration: randomTime * 1.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
    });

}

export function onCubeClick(event, isInterrupted) {
    isInterrupted = true;
    const { x, y } = getMouseCoordinates(event);
    mouse.x = x;
    mouse.y = y;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(cubes, true);
    if (intersects.length > 0) {
        const clickedCube = intersects[0].object;
        if (clickedCube === activeCube) {
            playSound(zoomOutSound);
            returnCubeToFormation(clickedCube);
        } else {
            playSound(zoomInSound);
            gsap.to(camera.position, { x: 0, y: 0, z: 9, duration: 1 });
            zoomCubeIn(clickedCube);
        }
    }
    isInterrupted = false;
}

export function zoomCubeIn(cube) {
    if (activeCube === cube) return;
    if (activeCube) returnCubeToFormation(activeCube);

    gsap.killTweensOf(cube.position);
    gsap.killTweensOf(cube.rotation);
    
    gsap.to(cube.position, { x: 0, y: 0, z: 0, duration: 1, ease: "back.out(1.7)" });
    gsap.to(cube.scale, { x: 2.2, y: 2.2, z: 2.2, duration: 1, ease: "back.out(1.7)" });

    // ✅ Increase the text size when zoomed in
    titleObjects.forEach(title => {
        if (title.userData.cube === cube) {
            gsap.to(title.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.5 });
        }
    });

    iframeElement.src = cube.userData.url;
    setTimeout(() => {
        cssObject.visible = true;
        gsap.to(iframeElement, { opacity: 0.8, duration: 0.5 });
        showCloseButton();
    }, 500);

    activeCube = cube;
}



export function returnCubeToFormation(cube) {
    const index = cubes.indexOf(cube);
    if (index !== -1) {
        // ✅ Move cube back to its original position
        gsap.to(cube.position, { 
            x: originalPositions[index].x, 
            y: originalPositions[index].y, 
            z: originalPositions[index].z, 
            duration: 1, 
            ease: "back.out(1.7)" 
        });

        noShowCloseButton();

        gsap.to(cube.scale, { x: 1, y: 1, z: 1, duration: 1, ease: "back.out(1.7)" });

        // ✅ Fade out iframe before hiding it
        gsap.to(iframeElement, { opacity: 0, duration: 0.5, ease: "power2.in", onComplete: () => {
            cssObject.visible = false; // ✅ Hide iframe after fade-out
        }});
        gsap.to(bgm, { volume: 0.45, duration: 1 }); // Volume fades to 0.2 over 3 seconds
        gsap.to(camera.position, { x: 0, y: 0, z: 16, duration: 1 });

        // ✅ Restart the wandering animation when cube returns
        setTimeout(() => animateCubeMovement(cube), 1000); // Delay to prevent instant movement
    }

    activeCube = null;
}