package com.ecommerce.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.net.URI;
import java.util.UUID;

@Service
@Slf4j
public class StorageService {

    private S3Client s3;

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.port}")
    private int port;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.bucket}")
    private String bucket;

    @Value("${minio.public-url}")
    private String publicUrl;

    @PostConstruct
    public void init() {
        this.s3 = S3Client.builder()
                .endpointOverride(URI.create(endpoint + ":" + port))
                .region(Region.US_EAST_1)
                .forcePathStyle(true)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .build();

        ensureBucketExists();
    }

    private void ensureBucketExists() {
        try {
            s3.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
            log.info("Bucket \"{}\" already exists.", bucket);
        } catch (S3Exception e) {
            try {
                s3.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
                log.info("Bucket \"{}\" created.", bucket);
            } catch (Exception ex) {
                log.error("Failed to create bucket \"{}\": {}", bucket, ex.getMessage());
            }
        }

        // Always try to apply the public-read policy just in case it doesn't have it
        try {
            String publicPolicy = """
                    {
                      "Version": "2012-10-17",
                      "Statement": [
                        {
                          "Effect": "Allow",
                          "Principal": "*",
                          "Action": "s3:GetObject",
                          "Resource": "arn:aws:s3:::%s/*"
                        }
                      ]
                    }
                    """.formatted(bucket);

            s3.putBucketPolicy(PutBucketPolicyRequest.builder()
                    .bucket(bucket)
                    .policy(publicPolicy)
                    .build());
            log.info("Bucket \"{}\" set to public-read.", bucket);
        } catch (Exception ex) {
            log.warn("Warning: Could not set bucket policy for \"{}\": {}", bucket, ex.getMessage());
        }
    }

    /**
     * Upload a file to MinIO.
     * 
     * @param file   Multipart file from the request
     * @param folder Subfolder prefix e.g. "products" or "categories"
     * @return Full public URL of the uploaded image
     */
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String ext = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String key = folder + "/" + UUID.randomUUID() + ext;

        s3.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(file.getContentType())
                        .build(),
                RequestBody.fromBytes(file.getBytes()));

        return publicUrl + "/" + bucket + "/" + key;
    }

    /**
     * Delete a file from MinIO by its full URL.
     */
    public void deleteFile(String fileUrl) {
        try {
            URI uri = URI.create(fileUrl);
            String path = uri.getPath();
            // path looks like /products/products/uuid.jpg — strip leading /bucket/
            String key = path.replaceFirst("/" + bucket + "/", "");

            s3.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build());
            log.info("Deleted file: {}", key);
        } catch (Exception e) {
            log.warn("Could not delete file {}: {}", fileUrl, e.getMessage());
        }
    }
}
