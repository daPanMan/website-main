import argparse
import os
import sys
import cv2
import numpy as np
import matplotlib.pyplot as plt
import pdb

if __name__ == "__main__":
    X = cv2.imread("indoor.png")
    Y = cv2.imread("outdoor.png")
    plt.imshow(X[:,:,2], cmap='gray')
    plt.show()
    plt.imshow(X[:,:,1], cmap='gray')
    plt.show()
    plt.imshow(X[:,:,0], cmap='gray')
    plt.show()
    plt.imshow(cv2.cvtColor(X, cv2.COLOR_RGB2Lab)[:,:,2], cmap='gray')
    plt.show()
    plt.imshow(cv2.cvtColor(X, cv2.COLOR_RGB2Lab)[:,:,1], cmap='gray')
    plt.show()
    plt.imshow(cv2.cvtColor(X, cv2.COLOR_RGB2Lab)[:,:,0], cmap='gray')
    plt.show()
    plt.imshow(cv2.cvtColor(Y, cv2.COLOR_RGB2Lab)[:,:,2], cmap='gray')
    plt.show()
    plt.imshow(cv2.cvtColor(Y, cv2.COLOR_RGB2Lab)[:,:,1], cmap='gray')
    plt.show()
    plt.imshow(cv2.cvtColor(Y, cv2.COLOR_RGB2Lab)[:,:,0], cmap='gray')
    plt.show()
    