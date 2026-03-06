from PIL import Image
  
# creating image object
img = Image.open("bird1.jpg")
  
# using convert method for img1
img1 = img.convert()
img1 = img1.save("bird1-1.jpg")