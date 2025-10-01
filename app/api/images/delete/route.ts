import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

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

    // Validate photo type
    if (photoType !== 'beforePhotos' && photoType !== 'afterPhotos') {
      return NextResponse.json(
        { error: 'Invalid photo type. Must be beforePhotos or afterPhotos' },
        { status: 400 }
      );
    }

    const decodedPhotoUrl = decodeURIComponent(photoUrl);
    
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.ext
    let publicId = '';
    try {
      const urlParts = decodedPhotoUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      
      if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
        // Get everything after 'upload' and the version number (if present)
        const pathAfterUpload = urlParts.slice(uploadIndex + 1);
        
        // Remove version number if present (starts with 'v' followed by digits)
        const firstPart = pathAfterUpload[0];
        if (firstPart && /^v\d+$/.test(firstPart)) {
          pathAfterUpload.shift(); // Remove version number
        }
        
        // Join remaining parts and remove file extension
        const fullPath = pathAfterUpload.join('/');
        publicId = fullPath.replace(/\.[^/.]+$/, ''); // Remove file extension
      }
      
      if (!publicId) {
        throw new Error('Could not extract public ID from URL');
      }
    } catch (error) {
      console.error('Error extracting public ID from URL:', decodedPhotoUrl, error);
      return NextResponse.json(
        { error: 'Invalid Cloudinary URL format' },
        { status: 400 }
      );
    }

    console.log('Extracted public ID:', publicId, 'from URL:', decodedPhotoUrl);

    // Delete from Cloudinary
    let cloudinarySuccess = false;
    try {
      const cloudinaryResult = await cloudinary.uploader.destroy(publicId);
      console.log('Cloudinary deletion result:', cloudinaryResult);
      
      if (cloudinaryResult.result === 'ok' || cloudinaryResult.result === 'not found') {
        cloudinarySuccess = true;
      } else {
        console.error('Cloudinary deletion failed:', cloudinaryResult);
      }
    } catch (cloudinaryError) {
      console.error('Error deleting from Cloudinary:', cloudinaryError);
      // Continue with MongoDB deletion even if Cloudinary fails
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
    const message = cloudinarySuccess 
      ? 'Image deleted successfully from both Cloudinary and database'
      : 'Image deleted from database successfully (Cloudinary deletion may have failed)';

    return NextResponse.json({
      success: true,
      message,
      cloudinarySuccess
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}