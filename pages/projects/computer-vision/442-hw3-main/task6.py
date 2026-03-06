"""
Task6 Code
"""
import numpy as np
import common 
from common import save_img, read_img, get_AKAZE
from homography import fit_homography, homography_transform, RANSAC_fit_homography
import os
import cv2

def compute_distance(desc1, desc2):
    '''
    Calculates L2 distance between 2 binary descriptor vectors.
        
    Input - desc1: Descriptor vector of shape (N,F)
            desc2: Descriptor vector of shape (M,F)
    
    Output - dist: a (N,M) L2 distance matrix where dist(i,j)
             is the squared Euclidean distance between row i of 
             desc1 and desc2. You may want to use the distance
             calculation trick
             ||x - y||^2 = ||x||^2 + ||y||^2 - 2x^T y
    '''
    x_norms = np.sum(desc1**2, axis=1)
    y_norms = np.sum(desc2**2, axis=1)
    xy = np.dot(desc1, desc2.T)
    dist = x_norms[:, np.newaxis] + y_norms[np.newaxis, :] - 2*xy
    return dist

def find_matches(desc1, desc2, ratioThreshold):
    '''
    Calculates the matches between the two sets of keypoint
    descriptors based on distance and ratio test.
    
    Input - desc1: Descriptor vector of shape (N,F)
            desc2: Descriptor vector of shape (M,F)
            ratioThreshhold : maximum acceptable distance ratio between 2
                              nearest matches 
    
    Output - matches: a list of indices (i,j) 1 <= i <= N, 1 <= j <= M giving
             the matches between desc1 and desc2.
             
             This should be of size (K,2) where K is the number of 
             matches and the row [ii,jj] should appear if desc1[ii,:] and 
             desc2[jj,:] match.
    '''
    # Find the indices of the closest matches for each descriptor in desc1
    dists = compute_distance(desc1, desc2)
    closest_indices = np.argsort(dists, axis=1)[:, :2]

    # Calculate the distance ratio between the closest and second closest matches
    closest_dists = dists[np.arange(len(desc1)), closest_indices[:, 0]]
    second_closest_dists = dists[np.arange(len(desc1)), closest_indices[:, 1]]
    dist_ratios = closest_dists / second_closest_dists

    # Find the indices where the distance ratio is below the threshold
    matches_indices = np.where(dist_ratios < ratioThreshold)[0]

    # Return the matching pairs
    matches = np.column_stack((matches_indices, closest_indices[matches_indices, 0]))

    return matches




def draw_matches(img1, img2, kp1, kp2, matches):
    '''
    Creates an output image where the two source images stacked vertically
    connecting matching keypoints with a line. 
        
    Input - img1: Input image 1 of shape (H1,W1,3)
            img2: Input image 2 of shape (H2,W2,3)
            kp1: Keypoint matrix for image 1 of shape (N,4)
            kp2: Keypoint matrix for image 2 of shape (M,4)
            matches: List of matching pairs indices between the 2 sets of 
                     keypoints (K,2)
    
    Output - Image where 2 input images stacked vertically with lines joining 
             the matched keypoints
    Hint: see cv2.line
    '''
    #Hint:
    #Use common.get_match_points() to extract keypoint locations
    pts = common.get_match_points(kp1, kp2, matches)
    
    # Adjust keypoints in second image to account for vertical stacking
    pts1 = np.array([[e[0], e[1]] for e in pts])
    pts2 = np.array([[e[2], e[3]] for e in pts])
    pts2[:,1] += img1.shape[0]
    
    # Concatenate the two images vertically
    img_matches = np.concatenate((img1, img2), axis=0)
    
    # Draw lines between the matched keypoints
    #pts1.shape[0]
    for i in range(100):
        pt1 = (int(pts1[i][0]), int(pts1[i][1]))
        pt2 = (int(pts2[i][0]), int(pts2[i][1]))
        color = tuple(np.random.randint(0, 255, 3).tolist())
        cv2.line(img_matches, pt1, pt2, color, 2)
    
    return img_matches


def warp_and_combine(img1, img2, H):
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
    '''
    return V


def make_warped(img1, img2):
    '''
    Take two images and return an image, putting together the full pipeline.
    You should return an image of the panorama put together.
    
    Input - img1: Input image 1 of shape (H1,W1,3)
            img2: Input image 1 of shape (H2,W2,3)
    
    Output - Final stitched image
    Be careful about:
    a) The final image size 
    b) Writing code so that you first estimate H and then merge images with H.
    The system can fail to work due to either failing to find the homography or
    failing to merge things correctly.
    '''
    kp1, desc1 = common.get_AKAZE(img2)
    kp2, desc2 = common.get_AKAZE(img1)
    matches = find_matches(desc1, desc2, 0.7)
    
    matches = common.get_match_points(kp1, kp2, matches)

    # Compute homography
    H = RANSAC_fit_homography(matches)

    # Find corners of each image
    h1, w1 = img2.shape[:2]
    h2, w2 = img1.shape[:2]
    corners1 = np.array([[0, 0], [0, h1], [w1, h1], [w1, 0]])
    corners2 = np.array([[0, 0], [0, h2], [w2, h2], [w2, 0]])

    # Transform image 1 to merged coordinate system
    corners1_t = cv2.perspectiveTransform(corners1.reshape((-1, 1, 2)).astype(np.float32), H)
    corners_all = np.concatenate((corners1_t, corners2.reshape((-1, 1, 2))), axis=0)
    x_min, y_min = np.int32(corners_all.min(axis=0).ravel() - 0.5)
    x_max, y_max = np.int32(corners_all.max(axis=0).ravel() + 0.5)
    trans = np.array([[1, 0, -x_min], [0, 1, -y_min], [0, 0, 1]])

    # Warp both images to merged coordinate system
    img1_warped = cv2.warpPerspective(img2, trans.dot(H), (x_max - x_min, y_max - y_min))
    trans = trans.astype(np.float32)
    img2_warped = cv2.warpPerspective(img1, trans, (x_max - x_min, y_max - y_min))

    # Create mask for each image
    mask1 = np.ones((h1, w1, 3), dtype=np.uint8) * 255
    mask2 = np.ones((h2, w2, 3), dtype=np.uint8) * 255
    mask1_warped = cv2.warpPerspective(mask1, trans.dot(H), (x_max - x_min, y_max - y_min))
    mask2_warped = cv2.warpPerspective(mask2, trans, (x_max - x_min, y_max - y_min))

    # Create final stitched image
    final_img = np.zeros((y_max - y_min, x_max - x_min, 3), dtype=np.uint16)
    final_img += np.where(mask1_warped > 0, img1_warped, 0)
    final_img += np.where(mask2_warped > 0, img2_warped, 0)
    final_img = final_img.astype(np.float32)
    final_img /= np.where(mask1_warped > 0, 1, 0) + np.where(mask2_warped > 0, 1, 0) + 1e-10
    final_img_normalized = (final_img - final_img.min()) / (final_img.max() - final_img.min())
    final_img = (final_img_normalized * 255).astype(np.uint8)

    return final_img


if __name__ == "__main__":

    img1 = read_img('task6/florence2/p1.jpg')
    img2 = read_img('task6/florence2/p2.jpg')

    kp1, desc1 = common.get_AKAZE(img1)
    kp2, desc2 = common.get_AKAZE(img2)

    # Compute the matches between the images
    matches = find_matches(desc1, desc2, 0.75)

    # Draw the matches
    img_matches = draw_matches(img1, img2, kp1, kp2, matches)

    # Display the matches
    save_img(img_matches,"result_6d.jpg")
    #Possible starter code; you might want to loop over the task 6 images
    to_stitch = 'lowetag'
    I1 = read_img(os.path.join('task6',to_stitch,'p1.jpg'))
    I2 = read_img(os.path.join('task6',to_stitch,'p2.jpg'))
    res = make_warped(I1,I2)
    save_img(res,"mypanorama1.jpg")
    to_stitch = 'vgg'
    I1 = read_img(os.path.join('task6',to_stitch,'p1.jpg'))
    I2 = read_img(os.path.join('task6',to_stitch,'p2.jpg'))
    res = make_warped(I1,I2)
    save_img(res,"mypanorama2.jpg")
