// services/s3.service.js

import {
    PutObjectCommand
} from "@aws-sdk/client-s3";

import {
    getSignedUrl
} from "@aws-sdk/s3-request-presigner";

import { s3 } from "../config/s3.js";

export async function generateUploadUrl(
    key,
    contentType
) {

    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        ContentType: contentType
    });

    return await getSignedUrl(
        s3,
        command,
        {
            expiresIn: 300
        }
    );
}