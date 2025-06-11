import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/env";

function logCaller(label: string) {
    const err = new Error();
    const stack = err.stack?.split("\n").slice(2).join("\n"); // Skip first two lines
    console.log(`\n${label}:\n${stack}\n`);
}

export const createServerS3Client = () => {
    logCaller("CREATING SERVER S3CLIENT ===================");
    return new S3Client({
        region: env.UPLOAD_REGION,
        endpoint: env.UPLOAD_ENDPOINT, // http://minio:9002
        // forcePathStyle: true,
        credentials: {
            accessKeyId: env.UPLOAD_ACCESS_KEY_ID,
            secretAccessKey: env.UPLOAD_SECRET_ACCESS_KEY,
        },
    });
};

export const createS3Client = () => {
    logCaller("CREATING FRONTEND S3CLIENT ===================");
    // if (typeof window === "undefined") {
    //     throw new Error("createS3Client should only be called in the browser.");
    // }
    const endpoint = "http://127.0.0.1:9002"
    return new S3Client({
        region: "us-east-1",
        endpoint,
        // forcePathStyle: true,
        credentials: {
            accessKeyId: "captable",
            secretAccessKey: "password",
        },
    });
};
