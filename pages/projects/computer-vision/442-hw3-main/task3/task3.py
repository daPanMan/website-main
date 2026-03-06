import numpy as np
import matplotlib.pyplot as plt

# if __name__ == "__main__":
#   points_case_1 = np.load('task3/points_case_1.npy')
#   points_case_2 = np.load('task3/points_case_2.npy')

# # Extract the coordinates
# x = points_case_1[:,0]
# y = points_case_1[:,1]
# x_prime = points_case_1[:,2]
# y_prime = points_case_1[:,3]

# x2 = points_case_2[:,0]
# y2 = points_case_2[:,1]
# x_prime2 = points_case_2[:,2]
# y_prime2 = points_case_2[:,3]

# # Compute the transformed coordinates using the affine transformation
# S = np.array([[1.5, 0.5], [-0.5, 1.5]])
# t = np.array([[50], [100]])
# transformed_points_1 = np.dot(S, np.vstack((x,y))) + t
# transformed_points_2 = np.dot(S, np.vstack((x2,y2))) + t

# # Make the scatterplot
# fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 5))

# ax1.scatter(x, y, s=1, label='Original Points')
# ax1.scatter(x_prime, y_prime, s=1, label='Transformed Points')
# ax1.scatter(transformed_points_1[0,:], transformed_points_1[1,:], s=1, label='Transformed Original Points')
# ax1.legend()
# ax1.set_title('Points Case 1')

# ax2.scatter(x2, y2, s=1, label='Original Points')
# ax2.scatter(x_prime2, y_prime2, s=1, label='Transformed Points')
# ax2.scatter(transformed_points_2[0,:], transformed_points_2[1,:], s=1, label='Transformed Original Points')
# ax2.legend()
# ax2.set_title('Points Case 2')

# plt.savefig('scatterplot.png')
# plt.show()
# plt.close()

correspondences = np.load('task3/points_case_1.npy')

# Extract the x and y coordinates of the original points and the transformed points
x = correspondences[:, 0]
y = correspondences[:, 1]
x_prime = correspondences[:, 2]
y_prime = correspondences[:, 3]

# Set up the design matrix and target vector
A = np.zeros((2 * len(x), 6))
b = np.zeros((2 * len(x),))

for i in range(len(x)):
    A[2*i, :] = [x[i], y[i], 0, 0, 1, 0]
    A[2*i + 1, :] = [0, 0, x[i], y[i], 0, 1]
    b[2*i] = x_prime[i]
    b[2*i + 1] = y_prime[i]

# Solve for the unknown parameters
v, _, _, _ = np.linalg.lstsq(A, b, rcond=None)

# Extract the transformation matrix S and translation vector t from v
S = np.array([[v[0], v[1]], [v[2], v[3]]])
t = np.array([v[4], v[5]])

print("S =", S)
print("t =", t)

points1 = np.load('task3/points_case_1.npy')
points2 = np.load('task3/points_case_2.npy')

# Extract the x and y coordinates for each set of points
x1, y1, x1_prime, y1_prime = points1.T
x2, y2, x2_prime, y2_prime = points2.T

# Define the transformation matrix S and translation vector t
S = np.array([[1.2, 0.3], [0.4, 0.8]])
t = np.array([2.0, -1.0])

# Apply the transformation to the original points
points1_transformed = np.dot(S, points1[:, :2].T).T + t
points2_transformed = np.dot(S, points2[:, :2].T).T + t

# Create a scatterplot of the points for Case 1
fig, ax = plt.subplots()
ax.scatter(x1, y1, s=1, c='b', label='Original Points')
ax.scatter(x1_prime, y1_prime, s=1, c='r', label='Transformed Points')
ax.scatter(points1_transformed[:, 0], points1_transformed[:, 1], s=1, c='g', label='Transformed Original Points')
ax.set_title('Points Case 1')
ax.legend()
plt.savefig('points_case_1.png')
plt.close()

# Create a scatterplot of the points for Case 2
fig, ax = plt.subplots()
ax.scatter(x2, y2, s=1, c='b', label='Original Points')
ax.scatter(x2_prime, y2_prime, s=1, c='r', label='Transformed Points')
ax.scatter(points2_transformed[:, 0], points2_transformed[:, 1], s=1, c='g', label='Transformed Original Points')
ax.set_title('Points Case 2')
ax.legend()
plt.savefig('points_case_2.png')
plt.close()