"use server";

import path from "node:path";
import { customId } from "@/common/id";
import { env } from "@/env";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import slugify from "@sindresorhus/slugify";
import {createS3Client, createServerS3Client} from "@/server/createServerS3Client";

const PrivateBucket = env.UPLOAD_BUCKET_PRIVATE;
const PublicBucket = env.UPLOAD_BUCKET_PUBLIC;

export type TypeKeyPrefixes =
    | "new-safes"
    | "existing-safes"
    | "signed-esign-doc"
    | "unsigned-esign-doc"
    | "stock-option-docs"
    | "company-logos"
    | "profile-avatars"
    | "generic-documents"
    | "shares-docs"
    | `data-room/${string}`;

export interface getPresignedUrlOptions {
  contentType: string;
  expiresIn?: number;
  fileName: string;
  keyPrefix: TypeKeyPrefixes;
  identifier: string;
  bucketMode: "privateBucket" | "publicBucket";
}

const TEN_MINUTES_IN_SECONDS = 10 * 60;

export const getPresignedPutUrl = async ({
                                           contentType,
                                           expiresIn,
                                           fileName,
                                           keyPrefix,
                                           identifier,
                                           bucketMode,
                                         }: getPresignedUrlOptions, serverClient = true) => {
  const { name, ext } = path.parse(fileName);

  const Key = `${identifier}/${keyPrefix}-${slugify(name)}-${customId(12)}${ext}`;

  const putObjectCommand = new PutObjectCommand({
    Bucket: bucketMode === "privateBucket" ? PrivateBucket : PublicBucket,
    Key,
    ContentType: contentType,
    ACL: bucketMode === "privateBucket" ? "private" : "public-read",
  });

  let s3Client = createServerS3Client()
  if (!serverClient) {
      s3Client = createS3Client()
  }

  const url = await getSignedUrl(s3Client, putObjectCommand, {
    expiresIn: expiresIn ?? TEN_MINUTES_IN_SECONDS,
  });

  const bucketUrl = new URL(url);
  bucketUrl.search = "";
  console.log("Get signed URL that was fetched", url)

  return { url, key: Key, bucketUrl: bucketUrl.toString() };
};

export const getPresignedGetUrl = async (key: string, serverClient = true) => {
    let s3Client = createServerS3Client()
    if (!serverClient) {
        s3Client = createS3Client()
    }
    const getObjectCommand = new GetObjectCommand({
    Bucket: PrivateBucket,
    Key: key,
    ResponseContentDisposition: "inline",
  });

  const url = await getSignedUrl(s3Client, getObjectCommand, {
    expiresIn: TEN_MINUTES_IN_SECONDS,
  });

  console.log("Presigned URL that was fetched", url)

  return { key, url };
};

export const deleteBucketFile = (key: string, serverClient = true) => {
    let s3Client = createServerS3Client()
    if (!serverClient) {
        s3Client = createS3Client()
    }

  return s3Client.send(
      new DeleteObjectCommand({
        Bucket: PrivateBucket,
        Key: key,
      })
  );
};
