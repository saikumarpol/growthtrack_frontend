import re
import base64
import math
import csv
import os
import io
from datetime import datetime
from flask import Flask, jsonify, request
import cv2
import numpy as np
from PIL import Image
from scipy.spatial import distance as dist

# File paths for malnutrition charts
chart_files = {
    "male": {
        "0-2": "./charts/0-2_male.csv",
        "2-5": "./charts/2-5_male.csv"
    },
    "female": {
        "0-2": "./charts/0-2_female.csv",
        "2-5": "./charts/2-5_female.csv"
    }
}

def charRecogAndDistDetect(checkerboard_size,focal_length,image,age,gender,og_height,og_weight):
       
        checkerboard_square_size_mm = checkerboard_size
        focal_length = focal_length


# Check for the prefix and remove it if it exists
        prefix = 'data:image/jpeg;base64,'
        if image.startswith(prefix):
                 print("Prefix detected and removed")
                 image_new = image[len(prefix):]
        else:
                print("Prefix not found, using the whole string")
                image_new = image

        # Check if the replacement worked
        
        image_data = base64.b64decode(image_new)

        # Open the image using PIL
        with Image.open(io.BytesIO(image_data)) as img:
        # Convert to JPEG format (you can also specify other formats if needed)
                img_jpeg = img.convert('RGB')
        
        # Save the JPEG image
                img_jpeg.save('image.jpg')

        print("Image converted and saved as 'converted_image.jpg'")

# Open the image using PIL (or Pillow)
        # img = Image.open(img_buffer)

        # Save the image as a file
        # img.save('image.jpg')
        print("------------------data--tes----------------")
 #       print(pytesseract.image_to_string(img_rgb))
  #      result=pytesseract.image_to_string(img_rgb)
        result=''  
        print("------------------data--tes----------------")
        if(result == ''):
                output = 00
        elif(result[0][0][1][0][-1]=='.'):
                output = float(result[0][0][1][0][:-1])
        else:
                output = float(result[0][0][1][0])
        if result is None:
                raise ImageNotFoundException("Image not found")

        #only accounting for 2 decimal places, make change if using one decimal place
        if(output>=100):
                output = output/100

        #distance estimation function
        img = cv2.imread('image.jpg')#Reading test image
        i_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        i_gray_shrunk = resize_image(i_gray, 3)[1]
        s_max = np.max(i_gray_shrunk)
        s_dev = np.std(i_gray_shrunk)
        i_b = cv2.threshold(i_gray_shrunk, s_max - s_dev, 255,
                    cv2.THRESH_BINARY)[1]
        ret, corners, size = checkerboard_detection(i_b, (4,4))
        if(ret):
                ret, i_corc, icp, ocp = perspective_correction(i_b, corners, size)
                ret,diagonal_from_image,true_diagonal_length_mm = find_diagonal(ocp, size, checkerboard_square_size_mm)
                Distance = Distance_finder(
                                focal_length, true_diagonal_length_mm, diagonal_from_image)
                print('This is distance ', Distance)
        else:
              Distance=0;
        
        weight = output

        print("w",weight,type(og_weight))
        # weight = 3
        height = Distance
        print("h",height,type(float(og_height)))
        #bmi calculation
        # (him = height in meters)
        him = float(og_height)/100
        print("him",him)
        bmi = float(og_weight)/(him*him)
        print("bmi",bmi)
        # nutrition status
        # age = data["age"]
        age = age
        #age = 1
        gender = gender
        status = malnutrition_status_checker(age, gender, og_height, og_weight, bmi)


        print("Weight: ", weight)
        print("Height: ", height)
        print("BMI: ", bmi)
        print("Malnutrition Status: ", status)
        print("Age: ", age)
        height = round(height, 2)
        # return jsonify({'weight': weight, 'height': height, 'bmi': bmi, 'malnutrition_status': status}), 200
        return weight,height,bmi,status


# Check malnutrition status based on age, gender, height, weight, and BMI
def malnutrition_status_checker(age, gender, height, weight, bmi):
    age = int(age)
    age_group = "0-2" if age < 2 else "2-5"
    filename = chart_files[gender][age_group]
    
    # Rounding off height to nearest 0.5
    height = str(round(float(height) * 2) / 2)
    weight = str(round(float(weight), 1))

    if bmi:
        if bmi < 18.5:
            return "Underweight"
        elif 18.5 <= bmi < 25:
            return "Normal weight"
        elif 25 <= bmi < 30:
            return "Overweight"
        elif 30 <= bmi < 35:
            return "Class 1 (Moderate obesity)"
        elif 35 <= bmi < 40:
            return "Class 2 (Severe obesity)"
        else:
            return "Class 3 (Very severe or morbid obesity)"
    else:
        return "NO BMI"

# Detect checkerboard in an image
def checkerboard_detection(image, checkerboard_size=(4, 4)):
    if checkerboard_size[0] > 2 and checkerboard_size[1] > 2:
        no_of_rows = sorted(range(3, checkerboard_size[0] + 1), reverse=True)
        no_of_cols = sorted(range(3, checkerboard_size[1] + 1), reverse=True)
        
        for i in no_of_rows:
            for j in no_of_cols:
                ret, corners = cv2.findChessboardCorners(image, (i, j), None)
                if ret:
                    return ret, corners, (i, j)

        return False, [], ()
    return False, [], ()

# Resize the image
def resize_image(image, shrinking_factor=2):
    image_size = list(image.shape)
    if len(image_size) == 2:
        if shrinking_factor >= 1:
            new_image_height = int(np.round(image_size[0] / shrinking_factor, 0))
            new_image_width = int(np.round(image_size[1] / shrinking_factor, 0))
            shrunk_image = cv2.resize(image, (new_image_width, new_image_height), interpolation=cv2.INTER_AREA)
            return True, shrunk_image
        print('Incorrect shrinking factor, it has to be >= 1.')
        return False, []
    print('Incorrect image type, needs to be 8-bit grayscale.')
    return False, []

# Order the corner points
def order_points(corner_pts):
    if len(corner_pts) == 4:
        cpts_sorted_by_x = corner_pts[np.argsort(corner_pts[:, 0]), :]
        cpts_left_set = cpts_sorted_by_x[:2, :]
        cpts_right_set = cpts_sorted_by_x[2:, :]
        cpts_ls_sorted_by_y = cpts_left_set[np.argsort(cpts_left_set[:, 1]), :]
        (tl, bl) = cpts_ls_sorted_by_y
        distances_from_tl = dist.cdist(tl[np.newaxis], cpts_right_set, 'euclidean')[0]
        cpts_rs_sorted_by_distances_from_tl = cpts_right_set[np.argsort(distances_from_tl), :]
        (tr, br) = cpts_rs_sorted_by_distances_from_tl
        return True, np.array([tl, tr, br, bl], dtype="float32")
    print('Incorrect number of corner points provided')
    return False, ()

# Perform perspective correction
def perspective_correction(image, checkerboard_corners, checkerboard_size, offset_size=1000):
    image_size = image.shape
    icp = np.array([
        checkerboard_corners[0][0],
        checkerboard_corners[checkerboard_size[1] - 1][0],
        checkerboard_corners[checkerboard_size[1] * checkerboard_size[0] - 1][0],
        checkerboard_corners[(checkerboard_size[0] - 1) * checkerboard_size[1]][0]
    ])
    icp_reordered = list(order_points(icp)[1])
    checkerboard_hw_ratio = checkerboard_size[0] / checkerboard_size[1]
    checkerboard_height = math.sqrt((icp[2][0] - icp[1][0]) ** 2 + (icp[2][1] - icp[1][1]) ** 2)
    checkerboard_width = checkerboard_height * checkerboard_hw_ratio

    ocp = [
        icp_reordered[0],
        np.float32([icp_reordered[0][0] + checkerboard_width, icp_reordered[0][1]]),
        np.float32([icp_reordered[0][0] + checkerboard_width, icp_reordered[0][1] + checkerboard_height]),
        np.float32([icp_reordered[0][0], icp_reordered[0][1] + checkerboard_height])
    ]
    transformation_matrix = cv2.getPerspectiveTransform(np.float32(icp_reordered), np.float32(ocp))
    corrected_image = cv2.warpPerspective(image, transformation_matrix, (int(checkerboard_width + offset_size), int(checkerboard_height + offset_size)))
    return True, corrected_image, icp_reordered, ocp

# Calculate age from date of birth
def calculate_age(dob):
    today = datetime.today()
    dob = datetime.strptime(dob, '%Y-%m-%d')
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

# Focal length finder
def Focal_Length_Finder(Known_distance, true_diagonal_length_mm, diagonal_from_image):
    return (diagonal_from_image * Known_distance) / true_diagonal_length_mm

# Find the diagonal of the checkerboard
def find_diagonal(checkerboard_corners, checkerboard_size=(4, 4), checkerboard_square_size_mm=38.1):
    if len(checkerboard_corners) == 4 and len(checkerboard_size) == 2:
        tl = checkerboard_corners[0]
        br = checkerboard_corners[2]
        diagonal_from_image = math.sqrt((br[0] - tl[0]) ** 2 + (br[1] - tl[1]) ** 2)
        true_diagonal_length_mm = (math.sqrt(checkerboard_size[0] ** 2 + checkerboard_size[1] ** 2) * checkerboard_square_size_mm)
        return True, diagonal_from_image, true_diagonal_length_mm
    print('The checkerboard_corners must have 4 points and checkerboard_size must be of length 2.')
    return False, None, None

# Distance estimation function
def Distance_finder(Focal_Length, true_diagonal_length_mm, diagonal_from_image):
    distance = (true_diagonal_length_mm * Focal_Length) / diagonal_from_image
    return distance

# Custom exception for image not found
class ImageNotFoundException(Exception):
    code = 404
    message = 'Image not found'

# Calibration function
def calibrate(image, length, checker_board_size):
    calib = base64.b64decode(image)
    Known_distance = float(length)
    checkerboard_square_size_mm = float(checker_board_size)
    
    nparr = np.frombuffer(calib, np.uint8)
    calib_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    cv2.imwrite('calibration.jpeg', calib_img, [cv2.IMWRITE_JPEG_QUALITY, 50])
    
    img = cv2.imread('calibration.jpeg')  # For focal length
    i_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    resize_factor = 3  # Adjust as necessary
    i_gray_shrunk = cv2.resize(i_gray, (i_gray.shape[1] // resize_factor, i_gray.shape[0] // resize_factor))
    
    i_b = cv2.adaptiveThreshold(i_gray_shrunk, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                cv2.THRESH_BINARY, 11, 2)
    
    ret, corners, size = checkerboard_detection(i_b, (4, 4))
    ret, _, icp, ocp = perspective_correction(i_b, corners, size)
    ret, diagonal_from_image, true_diagonal_length_mm = find_diagonal(ocp, size, checkerboard_square_size_mm)
    focal_length_found = Focal_Length_Finder(Known_distance, true_diagonal_length_mm, diagonal_from_image)
    return focal_length_found

