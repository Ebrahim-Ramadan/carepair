import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
// GET handler to return a presigned S3 URL for the image
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoUrl = searchParams.get('photoUrl');
    if (!photoUrl) {
      return NextResponse.json({ error: 'Missing photoUrl parameter' }, { status: 400 });
    }
    const decodedPhotoUrl = decodeURIComponent(photoUrl);
    let s3Key = '';
    try {
      const url = new URL(decodedPhotoUrl);
      s3Key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
      if (!s3Key) throw new Error('Could not extract S3 key from URL');
    } catch (error) {
      return NextResponse.json({ error: 'Invalid S3 URL format' }, { status: 400 });
    }
    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: s3Key,
    });
    // Presign for 5 minutes
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json({ error: 'Failed to generate presigned URL' }, { status: 500 });
  }
}
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
export async function DELETE(request: NextRequest) {

  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');
    const photoType = searchParams.get('type') as 'beforePhotos' | 'afterPhotos';
    const photoUrl = searchParams.get('photoUrl');

    if (!ticketId || !photoType || !photoUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters: ticketId, type, or photoUrl' },
        { status: 400 }
      );
    }

    // Delete from S3
    const decodedPhotoUrl = decodeURIComponent(photoUrl);
    let s3Key = '';
    try {
      const url = new URL(decodedPhotoUrl);
      s3Key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
      if (!s3Key) throw new Error('Could not extract S3 key from URL');
      const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: s3Key,
        })
      );
    } catch (s3Error) {
      console.error('Error deleting from S3:', s3Error);
      // Continue with MongoDB deletion even if S3 fails
    }

    // Delete from MongoDB using URL as identifier
    const client = await clientPromise;
    const db = client.db('car_repair');

    const updateQuery: any = {
      $pull: {},
      $set: {
        updatedAt: new Date()
      }
    };
    updateQuery.$pull[photoType] = { url: decodedPhotoUrl };

    const result = await db.collection('tickets').updateOne(
      { _id: new ObjectId(ticketId) },
      updateQuery
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully from both S3 and database'
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}