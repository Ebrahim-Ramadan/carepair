import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function DELETE(request: NextRequest): Promise<Response> {
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

    // Validate photo type
    if (photoType !== 'beforePhotos' && photoType !== 'afterPhotos') {
      return NextResponse.json(
        { error: 'Invalid photo type. Must be beforePhotos or afterPhotos' },
        { status: 400 }
      );
    }

    const decodedPhotoUrl = decodeURIComponent(photoUrl);

    // Extract S3 key from the URL
    let s3Key = '';
    try {
      // Example S3 URL: https://bucket.s3.region.amazonaws.com/key
      const url = new URL(decodedPhotoUrl);
      // The key is everything after the bucket host
      s3Key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
      if (!s3Key) throw new Error('Could not extract S3 key from URL');
    } catch (error) {
      console.error('Error extracting S3 key from URL:', decodedPhotoUrl, error);
      return NextResponse.json(
        { error: 'Invalid S3 URL format' },
        { status: 400 }
      );
    }

    // Delete from S3
    let s3Success = false;
    try {
      const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      const deleteResult = await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: s3Key,
        })
      );
      // S3 does not throw if the object does not exist, so treat as success
      s3Success = true;
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

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Photo not found in database' },
        { status: 404 }
      );
    }

    // Return appropriate message based on success
    const message = s3Success
      ? 'Image deleted successfully from both S3 and database'
      : 'Image deleted from database successfully (S3 deletion may have failed)';

    return NextResponse.json({
      success: true,
      message,
      s3Success
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}