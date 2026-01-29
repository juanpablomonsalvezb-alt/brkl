// Google Drive Integration for Instituto Barkley
import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

export async function getGoogleDriveClient() {
  // 1. Try Local Service Account (Env Vars)
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    try {
      console.log('Initializing Google Drive with Service Account (Env Vars)...');
      const auth = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        undefined,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/drive']
      );
      return google.drive({ version: 'v3', auth });
    } catch (error) {
      console.warn('Failed to initialize local Service Account:', error);
    }
  }

  // 2. Try Application Default Credentials (ADC)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      console.log('Initializing Google Drive with ADC...');
      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/drive']
      });
      const client = await auth.getClient();
      return google.drive({ version: 'v3', auth: client as any });
    } catch (error) {
      console.warn('Failed to initialize ADC:', error);
    }
  }

  // 3. Fallback to Replit Auth (Original Logic)
  try {
    const accessToken = await getAccessToken();
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: accessToken
    });
    return google.drive({ version: 'v3', auth: oauth2Client });
  } catch (error) {
    console.error('All Google Drive authentication methods failed.');
    throw new Error('Google Drive authentication failed. Please configure GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in .env');
  }
}

export interface ModuleResource {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'infografia' | 'presentacion';
  embedUrl: string;
  mimeType: string;
}

export interface ModuleContent {
  moduleNumber: number;
  folderId: string;
  folderName: string;
  resources: ModuleResource[];
}

function getResourceType(mimeType: string, name: string): ModuleResource['type'] {
  const lowerName = name.toLowerCase();
  const baseName = lowerName.split('.')[0];

  // Detect by exact filename prefix (audio.*, infografia.*, presentacion.*, video.*)
  if (baseName === 'video') return 'video';
  if (baseName === 'audio') return 'audio';
  if (baseName === 'infografia') return 'infografia';
  if (baseName === 'presentacion') return 'presentacion';

  // Fallback to MIME type detection
  if (mimeType.includes('video')) return 'video';
  if (mimeType.includes('audio')) return 'audio';
  if (mimeType.includes('image')) return 'infografia';
  if (mimeType.includes('pdf') || mimeType.includes('presentation') || mimeType.includes('slides') || mimeType.includes('document')) return 'presentacion';

  return 'infografia';
}

function getEmbedUrl(fileId: string, mimeType: string): string {
  if (mimeType.includes('presentation') || mimeType.includes('slides')) {
    return `https://docs.google.com/presentation/d/${fileId}/embed?start=false&loop=false&delayms=3000`;
  }
  if (mimeType.includes('document')) {
    return `https://docs.google.com/document/d/${fileId}/preview`;
  }
  if (mimeType.includes('spreadsheet')) {
    return `https://docs.google.com/spreadsheets/d/${fileId}/preview`;
  }
  if (mimeType.includes('form')) {
    return `https://docs.google.com/forms/d/${fileId}/viewform?embedded=true`;
  }
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export async function listModuleFolders(parentFolderId: string): Promise<ModuleContent[]> {
  const drive = await getGoogleDriveClient();

  const foldersResponse = await drive.files.list({
    q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    orderBy: 'name'
  });

  const folders = foldersResponse.data.files || [];
  const modules: ModuleContent[] = [];

  for (const folder of folders) {
    const match = folder.name?.match(/[Mm](?:ó|o)dulo\s*(\d+)/i) || folder.name?.match(/(\d+)/);
    const moduleNumber = match ? parseInt(match[1]) : modules.length + 1;

    const filesResponse = await drive.files.list({
      q: `'${folder.id}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink)',
      orderBy: 'name'
    });

    const files = filesResponse.data.files || [];
    const resources: ModuleResource[] = files.map(file => ({
      id: file.id!,
      name: file.name!,
      type: getResourceType(file.mimeType || '', file.name || ''),
      embedUrl: getEmbedUrl(file.id!, file.mimeType || ''),
      mimeType: file.mimeType || ''
    }));

    modules.push({
      moduleNumber,
      folderId: folder.id!,
      folderName: folder.name!,
      resources
    });
  }

  return modules.sort((a, b) => a.moduleNumber - b.moduleNumber);
}

export async function getModuleResources(folderId: string): Promise<ModuleResource[]> {
  const drive = await getGoogleDriveClient();

  const filesResponse = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, webViewLink)',
    orderBy: 'name'
  });

  const files = filesResponse.data.files || [];
  return files.map(file => ({
    id: file.id!,
    name: file.name!,
    type: getResourceType(file.mimeType || '', file.name || ''),
    embedUrl: getEmbedUrl(file.id!, file.mimeType || ''),
    mimeType: file.mimeType || ''
  }));
}

export async function searchFolderByName(folderName: string): Promise<{ id: string; name: string } | null> {
  const drive = await getGoogleDriveClient();

  const response = await drive.files.list({
    q: `name contains '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: 1
  });

  const folders = response.data.files || [];
  if (folders.length > 0) {
    return { id: folders[0].id!, name: folders[0].name! };
  }
  return null;
}

export async function listRootFolders(): Promise<Array<{ id: string; name: string }>> {
  const drive = await getGoogleDriveClient();

  const response = await drive.files.list({
    q: `mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    orderBy: 'name',
    pageSize: 50
  });

  return (response.data.files || []).map(f => ({ id: f.id!, name: f.name! }));
}

// List PDF files from a folder with their download links
export async function listPDFsFromFolder(folderId: string): Promise<Array<{ 
  id: string; 
  name: string; 
  webViewLink: string;
  downloadUrl: string;
}>> {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`,
    fields: 'files(id, name, webViewLink)',
    orderBy: 'name'
  });

  const files = response.data.files || [];
  
  return files.map(file => ({
    id: file.id!,
    name: file.name!,
    webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`
  }));
}

// Extract page range from filename (e.g., "MATSM25E7B-8-17" => {start: 8, end: 17})
export function extractPageRangeFromFilename(filename: string): { start: number; end: number } | null {
  // Match patterns like: 8-17, 18-26, etc.
  const match = filename.match(/(\d+)-(\d+)/);
  if (match) {
    return {
      start: parseInt(match[1]),
      end: parseInt(match[2])
    };
  }
  return null;
}

// Match PDFs to modules based on page ranges
export function matchPDFsToModules(
  pdfs: Array<{ name: string; webViewLink: string }>,
  modulePagesConfig: Record<string, { start: number; end: number }>
): Record<string, { pdfUrl: string; fileName: string }> {
  const result: Record<string, { pdfUrl: string; fileName: string }> = {};
  
  for (const pdf of pdfs) {
    const pdfRange = extractPageRangeFromFilename(pdf.name);
    if (!pdfRange) continue;
    
    // Find which module matches this page range
    for (const [moduleKey, moduleRange] of Object.entries(modulePagesConfig)) {
      if (pdfRange.start === moduleRange.start && pdfRange.end === moduleRange.end) {
        result[moduleKey] = {
          pdfUrl: pdf.webViewLink,
          fileName: pdf.name
        };
        break;
      }
    }
  }
  
  return result;
}
