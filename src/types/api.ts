export interface AuthRequest { username: string; password: string }
export interface AuthResponse { token: string }

export interface ProjectCreateRequest { name: string; slug?: string; description?: string }
export interface Project { id: string; name: string; slug: string; description?: string | null; status?: string; created_at?: string }

export interface ImageResponse { id: string; projectId: string; filename: string }
export interface ImageListResponse { items: ImageResponse[]; total?: number }

export interface SignedUrlResponse { token: string; url: string }

// Upload request is multipart/form-data: fields: projectId or projectSlug and file (binary)
export interface UploadForm {
  projectId?: string;
  projectSlug?: string;
  file?: any; // binary stream handled by multer
}
