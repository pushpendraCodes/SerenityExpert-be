export declare function uploadImage(buffer: Buffer, folder: string, filename?: string): Promise<{
    url: string;
    publicId: string;
}>;
export declare function uploadFromUrl(url: string, folder: string): Promise<{
    url: string;
    publicId: string;
}>;
export declare function deleteAsset(publicId: string): Promise<void>;
export declare function uploadRecording(buffer: Buffer, callId: string): Promise<{
    url: string;
    publicId: string;
}>;
//# sourceMappingURL=cloudinary.service.d.ts.map