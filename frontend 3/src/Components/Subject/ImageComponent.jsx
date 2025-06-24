import React, { useEffect, useState } from 'react';
import AWS from 'aws-sdk';

const ImageComponent = ({ name, phoneNumber }) => {
    const [imageUrl, setImageUrl] = useState('');
    useEffect(() => {
        // AWS S3 configuration
        const minioEndpoint = 'https://pl-minio.iiit.ac.in';
        const accessKey = 'minioadmin';
        const secretKey = 'minioadmin';
        const bucketName = 'pmis-001';

        AWS.config.update({
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
            endpoint: minioEndpoint,
            s3ForcePathStyle: true,
            signatureVersion: 'v4',
        });

        const s3 = new AWS.S3();

        // Parameters for getObject method
        const params = {
            Bucket: bucketName,
            Key: `profilePictures/${name}_${phoneNumber}.jpg`,
        };

        // Fetch the image from S3 bucket
        const fetchImage = async () => {
            try {
                const data = await s3.getObject(params).promise();
                const url = URL.createObjectURL(new Blob([data.Body]));
                
                setImageUrl(url);

            } catch (error) {
                console.error('Error fetching image:', error);
            }
        };

        fetchImage();

        // Cleanup function
        return () => {
            // Perform any necessary cleanup
        };
    }, [name, phoneNumber]);

    return (
        <div className="profile-picture-container" style={{ display: 'flex', justifyContent: 'center' }}>
            {imageUrl && <img src={imageUrl} alt="Profile" style={{ width: '150px', height: '100px', objectFit: 'contain', padding: 'px', marginTop: '10px', border: '1px solid #ccc' }} />}
        </div>
    );
};

export default ImageComponent;
