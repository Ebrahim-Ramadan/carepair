import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from "crypto"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const originalName = file.name;
    const ext = originalName ? originalName.split('.').pop() : '';
    const uniqueId = randomUUID();
    const publicId = ext
      ? `carepair/uploads/${uniqueId}.${ext}`
      : `carepair/uploads/${uniqueId}`;

    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto', // Auto-detect file type (image, video, raw)
          public_id: publicId,
          folder: 'carepair/uploads',
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      id: uniqueId,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      name: file.name,
      success: true,
      message: 'File uploaded successfully to Cloudinary',
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
