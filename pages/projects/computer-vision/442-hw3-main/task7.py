"""
Task 7 Code
"""
import numpy as np
import common 
from common import save_img, read_img
from homography import homography_transform, RANSAC_fit_homography
import cv2
import os



def task7_warp_and_combine(img1, img2, H):
    '''
    You may want to write a function that merges the two images together given
    the two images and a homography: once you have the homography you do not
    need the correspondences; you just need the homography.
    Writing a function like this is entirely optional, but may reduce the chance
    of having a bug where your homography estimation and warping code have odd
    interactions.
    
    Input - img1: Input image 1 of shape (H1,W1,3)
            img2: Input image 2 of shape (H2,W2,3)
            H: homography mapping betwen them
    Output - V: stitched image of size (?,?,3); unknown since it depends on H
                but make sure in V, for pixels covered by both img1 and warped img2,
                you see only img2
    '''
    img2_warped = cv2.warpPerspective(img2, H, (img1.shape[1], img1.shape[0]))
    
    # Create a mask for the warped image to cover only the overlapping areas with img1
    mask2_warped = np.zeros((img1.shape[0], img1.shape[1]), dtype=np.uint8)
    pts = np.array([[0, 0], [img2.shape[1], 0], [img2.shape[1], img2.shape[0]], [0, img2.shape[0]]]).reshape((-1, 1, 2))
    cv2.fillConvexPoly(mask2_warped, np.int32(cv2.perspectiveTransform(pts, H)), (255))
    
    # Create the stitched image by blending img1 and the masked, warped img2
    V = np.zeros_like(img1)
    V[mask2_warped == 255] = img2_warped[mask2_warped == 255]
    V[mask2_warped == 0] = img1[mask2_warped == 0]
    
    return V

def improve_image(scene, template, transfer):
    '''
    Detect template image in the scene image and replace it with transfer image.

    Input - scene: image (H,W,3)
            template: image (K,K,3)
            transfer: image (L,L,3)
    Output - augment: the image with 
    
    Hints:
    a) You may assume that the template and transfer are both squares.
    b) This will work better if you find a nearest neighbor for every template
       keypoint as opposed to the opposite, but be careful about directions of the
       estimated homography and warping!
    '''
    sift = cv2.SIFT_create()
    kp1, des1 = sift.detectAndCompute(template, None)
    kp2, des2 = sift.detectAndCompute(scene, None)

    # Match features between the template and scene images
    bf = cv2.BFMatcher()
    matches = bf.match(des1, des2)

    best_matches = {}
    for match in matches:
        if match.queryIdx not in best_matches or match.distance < best_matches[match.queryIdx].distance:
            best_matches[match.queryIdx] = match
    
    src_pts = np.float32([kp1[m.queryIdx].pt for m in best_matches.values()]).reshape(-1, 1, 2)
    dst_pts = np.float32([kp2[m.trainIdx].pt for m in best_matches.values()]).reshape(-1, 1, 2)

    H, _ = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)

    # Warp the transfer image onto the scene
    if transfer.shape[:2] != template.shape[:2]:
        # Resize the transfer image to match the size of the template image
        transfer = cv2.resize(transfer, template.shape[:2][::-1])
    transfer_warped = cv2.warpPerspective(transfer, H, (scene.shape[1], scene.shape[0]))

    # Use transfer image as mask to replace corresponding pixels in the scene image
    mask = cv2.threshold(cv2.cvtColor(transfer_warped, cv2.COLOR_BGR2GRAY), 1, 255, cv2.THRESH_BINARY)[1]
    mask_inv = cv2.bitwise_not(mask)
    transfer_masked = cv2.bitwise_and(transfer_warped, transfer_warped, mask=mask)
    scene_masked = cv2.bitwise_and(scene, scene, mask=mask_inv)
    augmented = cv2.add(scene_masked, transfer_masked)

    return augmented





if __name__ == "__main__":
    # Task 7
    to_stitch = 'vgg'
    I1 = read_img('task7/scenes/bbb/scene.jpg')
    I2 = read_img('task7/scenes/bbb/template.png')
    I3 = read_img('task7/seals/monk.png')
    res = improve_image(I1,I2,I3)
    save_img(res,"myimproved.jpg")
