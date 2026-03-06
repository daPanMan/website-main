import os
import matplotlib
import matplotlib as mpl
import matplotlib.pyplot as plt
import numpy as np
import scipy.ndimage
# Use scipy.ndimage.convolve() for convolution.
# Use zero padding (Set mode = 'constant'). Refer docs for further info.

from common import read_img, save_img


def corner_score(image, u=5, v=5, window_size=(5, 5)):
    """
    Given an input image, x_offset, y_offset, and window_size,
    return the function E(u,v) for window size W
    corner detector score for that pixel.
    Use zero-padding to handle window values outside of the image.

    Input- image: H x W
           u: a scalar for x offset
           v: a scalar for y offset
           window_size: a tuple for window size

    Output- results: a image of size H x W
    """
    image_offseted = np.roll(np.roll(image, u, axis=0), v, axis=1)
    sq_diff = (image - image_offseted)**2
    window = np.ones(window_size)
    
    output = scipy.ndimage.convolve(sq_diff, window, mode='constant')
    return output


def harris_detector(image, window_size=(5, 5)):
    """
    Given an input image, calculate the Harris Detector score for all pixels
    You can use same-padding for intensity (or 0-padding for derivatives)
    to handle window values outside of the image.

    Input- image: H x W
    Output- results: a image of size H x W
    """
    # compute the derivatives
    Ix = np.zeros(image.shape)
    Iy = np.zeros(image.shape)
    
    kernel = np.array([-1, 0, 1], dtype=np.float32)
    for i in range(image.shape[0]):
        Ix[i, :] = np.convolve(image[i, :], kernel, mode="same")
    for j in range(image.shape[1]):
        Iy[:, j] = np.convolve(image[:, j], kernel, mode="same")

    Ixx = Ix**2
    Iyy = Iy**2
    Ixy = Ix*Iy

    # For each image location, construct the structure tensor and calculate
    # the Harris response
    response = np.zeros(image.shape)
    window = np.ones(window_size) / np.prod(window_size)
    for i in range(image.shape[0] - window_size[0] + 1):
        for j in range(image.shape[1] - window_size[1] + 1):
            Ixx_window = Ixx[i:i+window_size[0], j:j+window_size[1]]
            Iyy_window = Iyy[i:i+window_size[0], j:j+window_size[1]]
            Ixy_window = Ixy[i:i+window_size[0], j:j+window_size[1]]
            Sxx = np.sum(Ixx_window * window)
            Syy = np.sum(Iyy_window * window)
            Sxy = np.sum(Ixy_window * window)
            det = Sxx*Syy - Sxy**2
            trace = Sxx + Syy
            response[i, j] = det - 0.04 * trace**2
            
    return response


def main():
    img = read_img('./grace_hopper.png')

    # Feature Detection
    if not os.path.exists("./feature_detection"):
        os.makedirs("./feature_detection")

    # -- TODO Task 6: Corner Score --
    # (a): Complete corner_score()

    # (b)
    # Define offsets and window size and calulcate corner score
    u, v, W = 0, 5, (5,5)

    score = corner_score(img, u, v, W)
    save_img(score, "./feature_detection/corner_score.png")

    # Computing the corner scores for various u, v values.
    score = corner_score(img, 0, 5, W)
    save_img(score, "./feature_detection/corner_score05.png")

    score = corner_score(img, 0, -5, W)
    save_img(score, "./feature_detection/corner_score0-5.png")

    score = corner_score(img, 5, 0, W)
    save_img(score, "./feature_detection/corner_score50.png")

    score = corner_score(img, -5, 0, W)
    save_img(score, "./feature_detection/corner_score-50.png")

    # (c): No Code

    # -- TODO Task 7: Harris Corner Detector --
    # (a): Complete harris_detector()

    # (b)
    harris_corners = harris_detector(img)
    save_img(harris_corners, "./feature_detection/harris_response.png")

    plt.imshow(harris_corners, cmap="hot")
    cax = plt.axes([0.85, 0.1, 0.075, 0.8])
    plt.colorbar(cax=cax)
    plt.savefig("harris_heatmap.png")
    



if __name__ == "__main__":
    main()
