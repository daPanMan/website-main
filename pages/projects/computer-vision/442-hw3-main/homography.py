"""
Homography fitting functions
You should write these
"""
import numpy as np
from common import homography_transform
import matplotlib.pyplot as plt

def fit_homography(XY):
    '''
    Given a set of N correspondences XY of the form [x,y,x',y'],
    fit a homography from [x,y,1] to [x',y',1].
    
    Input - XY: an array with size(N,4), each row contains two
            points in the form [x_i, y_i, x'_i, y'_i] (1,4)
    Output -H: a (3,3) homography matrix that (if the correspondences can be
            described by a homography) satisfies [x',y',1]^T === H [x,y,1]^T

    '''
    N = XY.shape[0]

    # Construct the A matrix for the linear system
    A = np.zeros((2*N, 9))
    for i in range(N):
        x, y, x_prime, y_prime = XY[i]
        A[2*i] = [x, y, 1, 0, 0, 0, -x*x_prime, -y*x_prime, -x_prime]
        A[2*i+1] = [0, 0, 0, x, y, 1, -x*y_prime, -y*y_prime, -y_prime]

    # Solve the linear system to obtain the homography matrix
    U, S, V = np.linalg.svd(A)
    h = V[-1,:].reshape((3, 3))

    # Normalize the homography matrix
    h = h / h[2, 2]

    return h

def compute_homography(srcPts, dstPts):
    '''
    Computes the homography matrix that transforms
    srcPts to dstPts

    Input - srcPts: an array of shape (N, 2) representing the 
                     source points
            dstPts: an array of shape (N, 2) representing the 
                     destination points
    Output - H: a (3, 3) homography matrix
    '''
    N = srcPts.shape[0]
    A = np.zeros((2*N, 9))
    for i in range(N):
        x, y = srcPts[i, :]
        u, v = dstPts[i, :]
        A[2*i, :] = [-x, -y, -1, 0, 0, 0, x*u, y*u, u]
        A[2*i+1, :] = [0, 0, 0, -x, -y, -1, x*v, y*v, v]
    _, _, Vt = np.linalg.svd(A)
    H = Vt[-1, :].reshape((3, 3))
    H = H / H[2, 2]
    return H

def RANSAC_fit_homography(XY, eps=1, nIters=1000):
    '''
    Perform RANSAC to find the homography transformation 
    matrix which has the most inliers
        
    Input - XY: an array with size(N,4), each row contains two
            points in the form [x_i, y_i, x'_i, y'_i] (1,4)
            eps: threshold distance for inlier calculation
            nIters: number of iteration for running RANSAC
    Output - bestH: a (3,3) homography matrix fit to the 
                    inliers from the best model.

    Hints:
    a) Sample without replacement. Otherwise you risk picking a set of points
       that have a duplicate.
    b) *Re-fit* the homography after you have found the best inliers
    '''
    bestH = None
    bestInliers = 0
    bestInlierInds = []

    for i in range(nIters):
        # Sample 4 points without replacement
        sample = XY[np.random.choice(XY.shape[0], size=4, replace=False)]
        srcPts = sample[:, :2]
        dstPts = sample[:, 2:]

        # Compute homography
        H = compute_homography(srcPts, dstPts)

        # Calculate error
        XY_src = XY[:, :2]
        XY_dst = XY[:, 2:]
        error = np.linalg.norm(XY_dst - homography_transform(XY_src, H), axis=1)

        # Calculate inliers
        inlierInds = np.where(error < eps)[0]
        inliers = inlierInds.shape[0]

        # Update best homography if necessary
        if inliers > bestInliers:
            bestH = compute_homography(XY[inlierInds, :2], XY[inlierInds, 2:])
            bestInliers = inliers
            bestInlierInds = inlierInds

    return bestH

def apply_homography(points, h):
    # Add a third column of ones to the points array
    points = np.hstack((points, np.ones((len(points), 1))))

    # Apply the homography to the points
    points_transformed = np.dot(h, points.T).T

    # Normalize the transformed points
    points_transformed = points_transformed[:, :2] / points_transformed[:, 2, None]

    return points_transformed

if __name__ == "__main__":
    #If you want to test your homography, you may want write any code here, safely
    #enclosed by a if __name__ == "__main__": . This will ensure that if you import
    #the code, you don't run your test code too

    #part b
    points1 = np.load('task4/points_case_1.npy')
    points4 = np.load('task4/points_case_4.npy')

    H_case1 = fit_homography(points1)
    H_case4 = fit_homography(points4)

    # Normalize the last entry to 1
    H_case1 = H_case1 / H_case1[2, 2]
    H_case4 = H_case4 / H_case4[2, 2]

    # Transform the points using the obtained homography matrices
    points_case1_transformed = homography_transform(points1[:, :2], H_case1)
    points_case4_transformed = homography_transform(points4[:, :2], H_case4)

    # Print the obtained homography matrices
    print("Homography matrix for points case 1:")
    print(H_case1)
    print("Homography matrix for points case 4:")
    print(H_case4)


    # #part c
    # original_points_case5 = np.load('task4/points_case_5.npy')
    # original_points_case9 = np.load('task4/points_case_9.npy')

    # # Define the target points (unit square)
    # target_points = np.array([[0,0], [1,0], [1,1], [0,1]])

    # # Fit homography for case 5
    # H_case5 = fit_homography(original_points_case5)
    # transformed_points_case5 = homography_transform(H_case5, original_points_case5)

    # # Fit homography for case 9
    # H_case9 = fit_homography(original_points_case9)
    # transformed_points_case9 = homography_transform(H_case9, original_points_case9)

    # # Plot the points
    # fig, (ax1, ax2) = plt.subplots(ncols=2, figsize=(10,5))
    # ax1.scatter(original_points_case5[:,0], original_points_case5[:,1], label='Original Points', c='red')
    # ax1.scatter(target_points[:,0], target_points[:,1], label='Target Points', c='blue')
    # ax1.scatter(transformed_points_case5[:,0], transformed_points_case5[:,1], label='Transformed Points', c='green')
    # ax1.legend()
    # ax1.set_title('Case 5')

    # ax2.scatter(original_points_case9[:,0], original_points_case9[:,1], label='Original Points', c='red')
    # ax2.scatter(target_points[:,0], target_points[:,1], label='Target Points', c='blue')
    # ax2.scatter(transformed_points_case9[:,0], transformed_points_case9[:,1], label='Transformed Points', c='green')
    # ax2.legend()
    # ax2.set_title('Case 9')

    # plt.savefig('points_visualization.png')
    # plt.show()
    points5 = np.load('task4/points_case_5.npy')
    points9 = np.load('task4/points_case_9.npy')

    # Fit a homography for each set of points
    H5 = fit_homography(points5)
    H9 = fit_homography(points9)

    points5_transformed = apply_homography(points5[:, :2], H5)
    points9_transformed = apply_homography(points9[:, :2], H9)

    # Plot the original points, target points, and transformed points for points case 5.npy
    fig, ax = plt.subplots()
    ax.scatter(points5[:, 0], points5[:, 1], s=1, c='b', label='Original Points')
    ax.scatter(points5[:, 2], points5[:, 3], s=1, c='r', label='Target Points')
    ax.scatter(points5_transformed[:, 0], points5_transformed[:, 1], s=1, c='g', label='Transformed Points')
    ax.set_title('Points Case 5')
    ax.legend()
    plt.show()

    fig, ax = plt.subplots()
    ax.scatter(points9[:, 0], points9[:, 1], s=1, c='b', label='Original Points')
    ax.scatter(points9[:, 2], points9[:, 3], s=1, c='r', label='Target Points')
    ax.scatter(points9_transformed[:, 0], points9_transformed[:, 1], s=1, c='g', label='Transformed Points')
    ax.set_title('Points Case 9')
    ax.legend()
    plt.show()

