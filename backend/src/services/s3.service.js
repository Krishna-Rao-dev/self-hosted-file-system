import {
    DeleteObjectCommand,
    HeadObjectCommand,
    GetObjectCommand,
    PutObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../config/s3.js";

function expiry() {
    return Number(process.env.PRESIGNED_URL_EXPIRY || 300);
}

export function generateUploadUrl(key, contentType) {
    return getSignedUrl(
        s3,
        new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
            ContentType: contentType
        }),
        { expiresIn: expiry() }
    );
}

export function generateDownloadUrl(key, name) {
    return getSignedUrl(
        s3,
        new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
            ResponseContentDisposition: `attachment; filename="${name}"`
        }),
        { expiresIn: expiry() }
    );
}

export function deleteObject(key) {
    return s3.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key
    }));
}

export async function objectExists(key) {
    try {
        await s3.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
        return true;
    } catch (error) {
        if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        throw error;
    }
}