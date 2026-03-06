import numpy as np
import utils


def find_projection(pts2d, pts3d):
    """
    Computes camera projection matrix M that goes from world 3D coordinates
    to 2D image coordinates.

    [u v 1]^T === M [x y z 1]^T

    Where (u,v) are the 2D image coordinates and (x,y,z) are the world 3D
    coordinates

    Inputs:
    - pts2d: Numpy array of shape (N,2) giving 2D image coordinates
    - pts3d: Numpy array of shape (N,3) giving 3D world coordinates

    Returns:
    - M: Numpy array of shape (3,4)

    """
    ###########################################################################
    # TODO: Your code here                                                    #
    ###########################################################################
    num_points = pts3d.shape[0]
    A = np.zeros((2 * num_points, 12))

    for i in range(num_points):
        x, y, z = pts3d[i, :]
        u, v = pts2d[i, :]
        A[2 * i] = [-x, -y, -z, -1, 0, 0, 0, 0, u * x, u * y, u * z, u]
        A[2 * i + 1] = [0, 0, 0, 0, -x, -y, -z, -1, v * x, v * y, v * z, v]

    _, _, Vt = np.linalg.svd(A)
    M = Vt[-1].reshape(3, 4)
    ###########################################################################
    #                             END OF YOUR CODE                            #
    ###########################################################################
    return M

def proj(point):
    x, y, w = point
    return np.array([x/w, y/w])

def compute_distance(pts2d, pts3d):
    """
    use find_projection to find matrix M, then use M to compute the average 
    distance in the image plane (i.e., pixel locations) 
    between the homogeneous points M X_i and 2D image coordinates p_i

    Inputs:
    - pts2d: Numpy array of shape (N,2) giving 2D image coordinates
    - pts3d: Numpy array of shape (N,3) giving 3D world coordinates

    Returns:
    - float: a average distance you calculated (threshold is 0.01)

    """
    ###########################################################################
    # TODO: Your code here                                                    #
    ###########################################################################
    M = find_projection(pts2d, pts3d)
    num_points = pts3d.shape[0]
    total_distance = 0
    
    for i in range(num_points):
        X = np.hstack((pts3d[i], 1))
        p = np.dot(M, X)
        proj_p = proj(p)
        total_distance += np.linalg.norm(proj_p - pts2d[i])
    ###########################################################################
    #                             END OF YOUR CODE                            #
    ###########################################################################
    return total_distance/num_points

if __name__ == '__main__':
    pts2d = np.loadtxt("task1/pts2d.txt")
    pts3d = np.loadtxt("task1/pts3d.txt")

    # Alternately, for some of the data, we provide pts1/pts1_3D, which you
    # can check your system on via
    """
    data = np.load("task23/ztrans/data.npz")
    pts2d = data['pts1']
    pts3d = data['pts1_3D']
    """
   
    foundDistance = compute_distance(pts2d, pts3d)
    print("Distance: %f\n" % foundDistance)

    mat = find_projection(pts2d, pts3d)
    print(f"M: {mat}")
