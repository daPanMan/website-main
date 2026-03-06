import os

import numpy as np
import scipy.ndimage
# Use scipy.ndimage.convolve() for convolution.
# Use same padding (mode = 'reflect'). Refer docs for further info.

from common import (find_maxima, read_img, visualize_maxima,
                    visualize_scale_space)


def gaussian_filter(image, sigma):
    """
    Given an image, apply a Gaussian filter with the input kernel size
    and standard deviation

    Input
      image: image of size HxW
      sigma: scalar standard deviation of Gaussian Kernel

    Output
      Gaussian filtered image of size HxW
    """
    H, W = image.shape
    # -- good heuristic way of setting kernel size
    kernel_size = int(2 * np.ceil(2 * sigma) + 1)
    # Ensure that the kernel size isn't too big and is odd
    kernel_size = min(kernel_size, min(H, W) // 2)
    if kernel_size % 2 == 0:
        kernel_size = kernel_size + 1
    # TODO implement gaussian filtering of size kernel_size x kernel_size
    # Similar to Corner detection, use scipy's convolution function.
    # Again, be consistent with the settings (mode = 'reflect').
    gaussian_kernel = np.exp(-0.5 * (np.arange(-kernel_size, kernel_size+1)**2) / (sigma**2))
    gaussian_kernel /= np.sum(gaussian_kernel)
    output = scipy.ndimage.convolve(image, gaussian_kernel[np.newaxis, :], mode='reflect')
    output = scipy.ndimage.convolve(output, gaussian_kernel[:, np.newaxis], mode='reflect')
    return output




def main():
    image = read_img('polka.png')
    # import pdb; pdb.set_trace()
    # Create directory for polka_detections
    if not os.path.exists("./polka_detections"):
        os.makedirs("./polka_detections")

    # -- TODO Task 8: Single-scale Blob Detection --

    # (a), (b): Detecting Polka Dots
    # First, complete gaussian_filter()
    print("Detecting small polka dots")
    # -- Detect Small Circles
    sigma_1, sigma_2 = 1, 2
    gauss_1 = gaussian_filter(image, sigma_1)  # to implement
    gauss_2 = gaussian_filter(image, sigma_2)  # to implement

    # calculate difference of gaussians
    DoG_small = gauss_2 - gauss_1  # to implement

    # visualize maxima
    maxima = find_maxima(DoG_small, k_xy=10)
    visualize_scale_space(DoG_small, sigma_1, sigma_2 / sigma_1,
                          './polka_detections/polka_small_DoG.png')
    visualize_maxima(image, maxima, sigma_1, sigma_2 / sigma_1,
                     './polka_detections/polka_small.png')

    # -- Detect Large Circles
    print("Detecting large polka dots")
    sigma_1, sigma_2 = 4, 8
    gauss_1 = gaussian_filter(image, sigma_1)  # to implement
    gauss_2 = gaussian_filter(image, sigma_2)  # to implement


    # calculate difference of gaussians
    DoG_large = gauss_2 - gauss_1  # to implement

    # visualize maxima
    # Value of k_xy is a sugguestion; feel free to change it as you wish.
    maxima = find_maxima(DoG_large, k_xy=10)
    visualize_scale_space(DoG_large, sigma_1, sigma_2 / sigma_1,
                          './polka_detections/polka_large_DoG.png')
    visualize_maxima(image, maxima, sigma_1, sigma_2 / sigma_1,
                     './polka_detections/polka_large.png')


    # # -- TODO Task 9: Cell Counting --
    print("Detecting cells")
    image = read_img('cells/005cell.png')
    sigma_1, sigma_2 = 6, 12
    gauss_1 = gaussian_filter(image, sigma_1)  # to implement
    gauss_2 = gaussian_filter(image, sigma_2)  # to implement

    # calculate difference of gaussians
    DoG_small = gauss_2 - gauss_1  # to implement

    # visualize maxima
    maxima = find_maxima(DoG_small, k_xy=10)
    print(len(maxima))
    visualize_scale_space(DoG_small, sigma_1, sigma_2 / sigma_1,
                          './cell_detections/005cell_DoG.png')
    visualize_maxima(image, maxima, sigma_1, sigma_2 / sigma_1,
                     './cell_detections/005cell.png')

    print("Detecting cells")
    image = read_img('cells/006cell.png')
    sigma_1, sigma_2 = 5, 10
    gauss_1 = gaussian_filter(image, sigma_1)  # to implement
    gauss_2 = gaussian_filter(image, sigma_2)  # to implement

    # calculate difference of gaussians
    DoG_small = gauss_2 - gauss_1  # to implement

    # visualize maxima
    maxima = find_maxima(DoG_small, k_xy=10)
    print(len(maxima))
    visualize_scale_space(DoG_small, sigma_1, sigma_2 / sigma_1,
                          './cell_detections/006cell_DoG.png')
    visualize_maxima(image, maxima, sigma_1, sigma_2 / sigma_1,
                     './cell_detections/006cell.png')

    print("Detecting cells")
    image = read_img('cells/007cell.png')
    sigma_1, sigma_2 = 5, 10
    gauss_1 = gaussian_filter(image, sigma_1)  # to implement
    gauss_2 = gaussian_filter(image, sigma_2)  # to implement

    # calculate difference of gaussians
    DoG_small = gauss_2 - gauss_1  # to implement

    # visualize maxima
    maxima = find_maxima(DoG_small, k_xy=10)
    print(len(maxima))
    visualize_scale_space(DoG_small, sigma_1, sigma_2 / sigma_1,
                          './cell_detections/007cell_DoG.png')
    visualize_maxima(image, maxima, sigma_1, sigma_2 / sigma_1,
                     './cell_detections/007cell.png')


    print("Detecting cells")
    image = read_img('cells/008cell.png')
    sigma_1, sigma_2 = 5, 10
    gauss_1 = gaussian_filter(image, sigma_1)  # to implement
    gauss_2 = gaussian_filter(image, sigma_2)  # to implement

    # calculate difference of gaussians
    DoG_small = gauss_2 - gauss_1  # to implement

    # visualize maxima
    maxima = find_maxima(DoG_small, k_xy=10)
    print(len(maxima))
    visualize_scale_space(DoG_small, sigma_1, sigma_2 / sigma_1,
                          './cell_detections/008cell_DoG.png')
    visualize_maxima(image, maxima, sigma_1, sigma_2 / sigma_1,
                     './cell_detections/008cell.png')

    # Detect the cells in any four (or more) images from vgg_cells
    # Create directory for cell_detections
    if not os.path.exists("./cell_detections"):
        os.makedirs("./cell_detections")



if __name__ == '__main__':
    main()
