#!/usr/bin/python

import os
import numpy as np
import matplotlib.pyplot as plt
import cv2
import pdb


def colormapArray(X, colors):
    """
    Basically plt.imsave but return a matrix instead

    Given:
        a HxW matrix X
        a Nx3 color map of colors in [0,1] [R,G,B]
    Outputs:
        a HxW uint8 image using the given colormap. See the Bewares
    """
    N = colors.shape[0]
    max = np.nanmax(X)
    min = np.nanmin(X)

    #print(X.shape)
    if max != min:
        value = (N-1)*((X-min)/(max-min))
    else:
        value = np.zeros(X.shape)
    value=value.astype(np.int32)

    O=colors[value]
    # print(value.shape)
    # print(colors.shape)
    # print(O.shape)
    return O


if __name__ == "__main__":
    colors = np.load("mysterydata/colors.npy")
    data = np.load("mysterydata/mysterydata4.npy")
    for i in range(9):
        plt.imsave("mystery_%d.png" % i, colormapArray(data[:,:,i], colors))


    #pdb.set_trace()
